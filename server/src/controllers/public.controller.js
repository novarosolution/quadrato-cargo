import { z } from "zod";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import bwipjs from "bwip-js";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { env } from "../config/env.js";
import { getDb } from "../db/mongo.js";
import { normalizeSiteSettings } from "../models/site-settings.model.js";
import {
  createBooking,
  findBookingByReference,
  findBookingByUserAndId
} from "../modules/bookings/booking-repo.js";
import { createContactSubmission } from "../modules/contacts/contact-repo.js";
import { verifyAuthToken } from "../modules/auth/token.js";
import { findUserById } from "../modules/users/user-repo.js";
import { computePublicBarcodeCode } from "../shared/public-barcode-code.js";

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z
    .string()
    .trim()
    .email()
    .refine((value) => !isPhoneLikeEmail(value), {
      message: "Email cannot be only numbers."
    }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{7,15}$/.test(String(value)), {
      message: "Phone must contain only numbers (7 to 15 digits)."
    }),
  service: z.string().trim().min(1),
  message: z.string().trim().min(10).max(1000)
});

function isPhoneLikeEmail(value) {
  return /^[\d+\-\s]+$/.test(String(value || "").trim());
}

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{7,15}$/, {
    message: "Phone must contain only numbers (7 to 15 digits)."
  });

const safeEmailSchema = z
  .string()
  .trim()
  .email()
  .refine((value) => !isPhoneLikeEmail(value), {
    message: "Email cannot be only numbers."
  });

const bookingPayloadSchema = z
  .object({
    sender: z.object({
      name: z.string().trim().min(2),
      email: safeEmailSchema,
      phone: phoneSchema,
      street: z.string().trim().min(1),
      city: z.string().trim().min(1),
      postal: z.string().trim().min(3),
      country: z.string().trim().min(1)
    }),
    recipient: z.object({
      name: z.string().trim().min(2),
      email: safeEmailSchema,
      phone: phoneSchema,
      street: z.string().trim().min(1),
      city: z.string().trim().min(1),
      postal: z.string().trim().min(3),
      country: z.string().trim().min(1)
    }),
    shipment: z.object({
      contentsDescription: z.string().trim().min(5),
      weightKg: z.number().positive().max(1000),
      dimensionsCm: z
        .object({
          l: z.string().trim().regex(/^\d+(\.\d+)?$/),
          w: z.string().trim().regex(/^\d+(\.\d+)?$/),
          h: z.string().trim().regex(/^\d+(\.\d+)?$/)
        })
        .optional(),
      declaredValue: z.string().trim().max(120).optional()
    }),
    collectionMode: z.enum(["instant", "scheduled"]),
    pickupDate: z.string().trim().optional(),
    pickupTimeSlot: z.string().trim().optional(),
    pickupTimeSlotCustom: z.string().trim().max(64).optional(),
    pickupPreference: z.string().trim().min(1).max(240),
    instructions: z.string().trim().max(1000).optional(),
    agreedInternational: z.boolean().optional()
  })
  .superRefine((payload, ctx) => {
    if (payload.collectionMode !== "scheduled") return;
    const pickupDateRaw = String(payload.pickupDate || "").trim();
    if (!String(payload.pickupDate || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupDate"],
        message: "Pickup date is required for scheduled pickup."
      });
    } else {
      const validDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(pickupDateRaw);
      const parsed = validDateOnly ? new Date(`${pickupDateRaw}T00:00:00`) : null;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (!parsed || Number.isNaN(parsed.getTime()) || parsed.getTime() < todayStart.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pickupDate"],
          message: "Pickup date cannot be in the past for scheduled pickup."
        });
      }
    }
    const slotRaw = String(payload.pickupTimeSlot || "").trim();
    if (!slotRaw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupTimeSlot"],
        message: "Pickup time slot is required for scheduled pickup."
      });
    } else if (slotRaw.toLowerCase() === "custom") {
      const custom = String(payload.pickupTimeSlotCustom || "").trim();
      if (custom.length < 3 || custom.length > 64) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pickupTimeSlotCustom"],
          message: "Custom pickup time must be 3 to 64 characters."
        });
      }
    }
    if (!String(payload.pickupPreference || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupPreference"],
        message: "Pickup note is required for scheduled pickup."
      });
    }
  });

const createBookingRequestSchema = z
  .object({
    routeType: z.enum(["domestic", "international"]),
    bookingPayload: bookingPayloadSchema
  })
  .superRefine((data, ctx) => {
    if (data.routeType !== "international") return;
    if (data.bookingPayload.agreedInternational !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bookingPayload", "agreedInternational"],
        message: "Confirm the details are accurate for export and customs processing."
      });
    }
    const s = String(data.bookingPayload.sender.country || "").trim().toLowerCase();
    const r = String(data.bookingPayload.recipient.country || "").trim().toLowerCase();
    if (s && r && s === r) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bookingPayload", "recipient", "country"],
        message:
          "International booking: delivery country should be outside the pickup country."
      });
    }
  });

const trackingReferenceSchema = z
  .string()
  .trim()
  .min(6)
  .max(40)
  .regex(/^[a-zA-Z0-9-]+$/);

function normalizeTrackingReference(value) {
  return String(value ?? "")
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildBookingFieldErrors(issues = []) {
  const out = {};
  const mapping = {
    routeType: "routeType",
    "bookingPayload.collectionMode": "collectionMode",
    "bookingPayload.pickupDate": "pickupDate",
    "bookingPayload.pickupTimeSlot": "pickupTimeSlot",
    "bookingPayload.pickupTimeSlotCustom": "pickupTimeSlotCustom",
    "bookingPayload.pickupPreference": "pickupPreference",
    "bookingPayload.sender.name": "senderName",
    "bookingPayload.sender.email": "senderEmail",
    "bookingPayload.sender.phone": "senderPhone",
    "bookingPayload.sender.street": "senderStreet",
    "bookingPayload.sender.city": "senderCity",
    "bookingPayload.sender.postal": "senderPostal",
    "bookingPayload.sender.country": "senderCountry",
    "bookingPayload.recipient.name": "recipientName",
    "bookingPayload.recipient.email": "recipientEmail",
    "bookingPayload.recipient.phone": "recipientPhone",
    "bookingPayload.recipient.street": "recipientStreet",
    "bookingPayload.recipient.city": "recipientCity",
    "bookingPayload.recipient.postal": "recipientPostal",
    "bookingPayload.recipient.country": "recipientCountry",
    "bookingPayload.shipment.contentsDescription": "contentsDescription",
    "bookingPayload.shipment.weightKg": "weightKg",
    "bookingPayload.agreedInternational": "agreed"
  };
  for (const issue of issues) {
    const key = mapping[String(issue.path || []).join(".")] || "routeType";
    if (!out[key]) out[key] = issue.message || "Invalid value.";
  }
  return out;
}

const pdfRequestSchema = z.object({
  template: z.enum(["invoice", "tracking"]).default("invoice"),
  bookingId: z.string().trim().min(1),
  bookingDateLabel: z.string().trim().default(""),
  updatedAtLabel: z.string().trim().default(""),
  statusLabel: z.string().trim().default(""),
  reference: z.string().trim().default(""),
  routeTypeLabel: z.string().trim().default(""),
  consignmentNumber: z.string().trim().default(""),
  fromCity: z.string().trim().default(""),
  toCity: z.string().trim().default(""),
  senderAddress: z.string().trim().default(""),
  senderPhone: z.string().trim().default(""),
  senderEmail: z.string().trim().default(""),
  senderName: z.string().trim().default(""),
  recipientAddress: z.string().trim().default(""),
  recipientPhone: z.string().trim().default(""),
  recipientEmail: z.string().trim().default(""),
  recipientName: z.string().trim().default(""),
  amountLabel: z.string().trim().default(""),
  weightLabel: z.string().trim().default(""),
  dimensionsLabel: z.string().trim().default(""),
  contentsLabel: z.string().trim().default(""),
  instructionsLabel: z.string().trim().default(""),
  trackingNotesLabel: z.string().trim().default(""),
  agencyLabel: z.string().trim().default(""),
  courierNameLabel: z.string().trim().default(""),
  trackUrl: z.string().trim().default(""),
  settings: z
    .object({
      companyName: z.string().trim().default("Quadrato Cargo"),
      companyAddress: z.string().trim().default(""),
      logoText: z.string().trim().default("QC"),
      primaryColor: z.string().trim().default("#0f766e"),
      accentColor: z.string().trim().default("#16a34a"),
      cardColor: z.string().trim().default("#f8fafc"),
      headerSubtitle: z.string().trim().default("International courier service"),
      supportEmail: z.string().trim().default("support@quadratocargo.com"),
      supportPhone: z.string().trim().default("+1 (555) 010-0199"),
      website: z.string().trim().default("https://quadratocargo.com"),
      watermarkText: z.string().trim().default("Quadrato Cargo"),
      footerNote: z.string().trim().default("Thank you for choosing Quadrato Cargo.")
    })
    .optional()
});

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeHex(color, fallback) {
  const value = String(color ?? "").trim();
  const match = value.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1]}` : fallback;
}

function buildShipmentSummaryForPublicTrack(payload) {
  if (!payload || typeof payload !== "object") return null;
  const s = payload.shipment;
  if (!s || typeof s !== "object") return null;
  const clip = (v, max = 800) => {
    const t = String(v ?? "").trim();
    if (!t) return null;
    return t.length > max ? `${t.slice(0, max)}…` : t;
  };
  let weightKg = null;
  if (typeof s.weightKg === "number" && Number.isFinite(s.weightKg)) {
    weightKg = s.weightKg;
  } else if (s.weightKg != null) {
    const n = Number.parseFloat(String(s.weightKg).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(n)) weightKg = n;
  }
  const dims = s.dimensionsCm && typeof s.dimensionsCm === "object" ? s.dimensionsCm : null;
  const dimensionsCm =
    dims && (dims.l != null || dims.w != null || dims.h != null)
      ? {
          l: dims.l != null ? String(dims.l) : null,
          w: dims.w != null ? String(dims.w) : null,
          h: dims.h != null ? String(dims.h) : null
        }
      : null;
  const out = {
    contentsDescription: clip(s.contentsDescription, 1200),
    weightKg,
    declaredValue: clip(s.declaredValue, 120),
    dimensionsCm
  };
  if (
    !out.contentsDescription &&
    out.weightKg == null &&
    !out.declaredValue &&
    !out.dimensionsCm
  ) {
    return null;
  }
  return out;
}

async function launchPdfBrowser() {
  const safeArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--no-zygote"
  ];
  const preferredExecutablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.GOOGLE_CHROME_BIN;

  try {
    return await puppeteer.launch({
      headless: true,
      executablePath: preferredExecutablePath || undefined,
      timeout: 15000
    });
  } catch (primaryError) {
    try {
      return await puppeteer.launch({
        headless: true,
        args: safeArgs,
        executablePath: preferredExecutablePath || undefined,
        timeout: 15000
      });
    } catch {
      // Try serverless Chromium as final fallback.
    }
    try {
      const [{ default: puppeteerCore }, chromiumModule] = await Promise.all([
        import("puppeteer-core"),
        import("@sparticuz/chromium")
      ]);
      const chromium = chromiumModule.default || chromiumModule;
      const chromiumPath =
        preferredExecutablePath || (await chromium.executablePath());
      return await puppeteerCore.launch({
        headless: true,
        executablePath: chromiumPath,
        args: [...chromium.args, ...safeArgs]
      });
    } catch (secondaryError) {
      const error = new Error("Unable to launch PDF browser in this environment.");
      error.cause = secondaryError || primaryError;
      throw error;
    }
  }
}

let sharedPdfBrowser = null;

async function getPdfBrowser() {
  if (sharedPdfBrowser && sharedPdfBrowser.isConnected()) return sharedPdfBrowser;
  sharedPdfBrowser = await launchPdfBrowser();
  sharedPdfBrowser.on("disconnected", () => {
    sharedPdfBrowser = null;
  });
  return sharedPdfBrowser;
}

function bookingStatusLabel(status) {
  const value = String(status || "").trim();
  const labels = {
    submitted: "Submitted",
    confirmed: "Confirmed",
    serviceability_check: "Serviceability check",
    serviceable: "Serviceable area confirmed",
    pickup_scheduled: "Pickup scheduled",
    out_for_pickup: "Out for pickup",
    picked_up: "Picked up",
    agency_processing: "At agency processing",
    in_transit: "In transit",
    out_for_delivery: "Out for delivery",
    delivery_attempted: "Delivery attempted",
    on_hold: "On hold",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  return labels[value] || "Submitted";
}

function safeDateLabel(raw) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw || "-");
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function payloadValue(payload, path, fallback = "-") {
  let current = payload;
  for (const key of path) {
    if (!current || typeof current !== "object") return fallback;
    current = current[key];
  }
  const out = String(current ?? "").trim();
  return out || fallback;
}

async function buildPdfDataFromBooking(req, parsedData) {
  const token = req.cookies?.[env.authCookieName];
  if (!token) {
    throw new Error("Unable to build booking PDF context.");
  }
  let authPayload;
  try {
    authPayload = verifyAuthToken(token);
  } catch {
    throw new Error("Unable to build booking PDF context.");
  }
  const userId = String(authPayload?.sub || "").trim();
  const userEmail = String(authPayload?.email || "").trim();
  if (!userId) throw new Error("Unable to build booking PDF context.");

  const booking = await findBookingByUserAndId(userId, parsedData.bookingId, userEmail);
  if (!booking) {
    throw new Error("Unable to build booking PDF context.");
  }
  if (!booking.pickupOtpVerifiedAt) {
    throw new Error("Pickup OTP verification pending.");
  }
  if (parsedData.template === "invoice" && booking.invoicePdfReady === false) {
    throw new Error("Invoice PDF disabled until billing is enabled by admin.");
  }

  const db = await getDb();
  const settingsRow = await db.collection("settings").findOne({ key: "site" });
  const normalizedSettings = normalizeSiteSettings(settingsRow);
  const payload = booking.payload || {};
  const referenceRaw = String(booking.consignmentNumber || booking.id || parsedData.bookingId).trim();
  const reference = normalizeTrackingReference(referenceRaw) || referenceRaw;
  const senderStreet = payloadValue(payload, ["sender", "street"], "");
  const senderCity = payloadValue(payload, ["sender", "city"], "");
  const senderPostal = payloadValue(payload, ["sender", "postal"], "");
  const senderCountry = payloadValue(payload, ["sender", "country"], "");
  const recipientStreet = payloadValue(payload, ["recipient", "street"], "");
  const recipientCity = payloadValue(payload, ["recipient", "city"], "");
  const recipientPostal = payloadValue(payload, ["recipient", "postal"], "");
  const recipientCountry = payloadValue(payload, ["recipient", "country"], "");
  const senderAddress = [senderStreet, senderCity, senderPostal, senderCountry]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(", ") || "-";
  const recipientAddress = [recipientStreet, recipientCity, recipientPostal, recipientCountry]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(", ") || "-";
  const weightValue = payloadValue(payload, ["shipment", "weightKg"], "-");
  const dimL = payloadValue(payload, ["shipment", "dimensionsCm", "l"], "?");
  const dimW = payloadValue(payload, ["shipment", "dimensionsCm", "w"], "?");
  const dimH = payloadValue(payload, ["shipment", "dimensionsCm", "h"], "?");
  const dimensions = dimL === "?" && dimW === "?" && dimH === "?" ? "-" : `${dimL} x ${dimW} x ${dimH} cm`;
  const courierName = booking.courierId
    ? String((await findUserById(booking.courierId))?.name || "").trim() || "-"
    : "-";
  const website = String(normalizedSettings.pdfWebsite || "https://quadratocargo.com").trim();
  const trackUrl =
    parsedData.trackUrl ||
    `${website.replace(/\/$/, "")}/public/tsking?reference=${encodeURIComponent(reference)}`;

  const inv = booking.invoice && typeof booking.invoice === "object" ? booking.invoice : null;
  const adminInvoice = inv
    ? {
        number: String(inv.number ?? "").trim() || null,
        currency: String(inv.currency ?? "INR").trim().slice(0, 12) || "INR",
        subtotal: String(inv.subtotal ?? "").trim() || null,
        tax: String(inv.tax ?? "").trim() || null,
        insurance: String(inv.insurance ?? "").trim() || null,
        customsDuties: String(inv.customsDuties ?? "").trim() || null,
        discount: String(inv.discount ?? "").trim() || null,
        total: String(inv.total ?? "").trim() || null,
        lineDescription: String(inv.lineDescription ?? "").trim() || null,
        notes: String(inv.notes ?? "").trim() || null
      }
    : null;
  const contentsBase = payloadValue(payload, ["shipment", "contentsDescription"], "-");
  const lineDesc = adminInvoice?.lineDescription ? String(adminInvoice.lineDescription).trim() : "";
  const contentsLabel =
    lineDesc && contentsBase !== "-"
      ? `${lineDesc} — ${contentsBase}`
      : lineDesc || contentsBase;
  const adminTotal = adminInvoice?.total ? String(adminInvoice.total).trim() : "";
  const amountLabel = adminTotal || payloadValue(payload, ["shipment", "declaredValue"], "-");

  return {
    ...parsedData,
    bookingDateLabel: safeDateLabel(booking.createdAt),
    updatedAtLabel: safeDateLabel(booking.updatedAt || booking.createdAt),
    statusLabel: bookingStatusLabel(booking.status),
    reference,
    routeTypeLabel: String(booking.routeType || "-"),
    consignmentNumber: String(booking.consignmentNumber || "-"),
    fromCity: senderCity || "-",
    toCity: recipientCity || "-",
    senderName: payloadValue(payload, ["sender", "name"], "-"),
    senderAddress,
    senderPhone: payloadValue(payload, ["sender", "phone"], "-"),
    senderEmail: payloadValue(payload, ["sender", "email"], "-"),
    recipientName: payloadValue(payload, ["recipient", "name"], "-"),
    recipientAddress,
    recipientPhone: payloadValue(payload, ["recipient", "phone"], "-"),
    recipientEmail: payloadValue(payload, ["recipient", "email"], "-"),
    amountLabel,
    weightLabel: String(weightValue === "-" ? "-" : `${weightValue} kg`),
    dimensionsLabel: dimensions,
    contentsLabel,
    instructionsLabel: payloadValue(payload, ["instructions"], "-"),
    trackingNotesLabel: String(booking.publicTrackingNote || booking.customerTrackingNote || "-"),
    agencyLabel: String(booking.assignedAgency || "-"),
    courierNameLabel: courierName,
    trackUrl,
    settings: {
      companyName: String(normalizedSettings.pdfCompanyName || "Quadrato Cargo"),
      companyAddress: String(normalizedSettings.pdfCompanyAddress || ""),
      logoText: String(normalizedSettings.pdfLogoText || "QC"),
      primaryColor: String(normalizedSettings.pdfPrimaryColor || "#0f766e"),
      accentColor: String(normalizedSettings.pdfAccentColor || "#16a34a"),
      cardColor: String(normalizedSettings.pdfCardColor || "#f8fafc"),
      headerSubtitle: String(normalizedSettings.pdfHeaderSubtitle || "International courier service"),
      supportEmail: String(normalizedSettings.pdfSupportEmail || "support@quadratocargo.com"),
      supportPhone: String(normalizedSettings.pdfSupportPhone || "+1 (555) 010-0199"),
      website,
      watermarkText: String(normalizedSettings.pdfWatermarkText || "Quadrato Cargo"),
      footerNote: String(normalizedSettings.pdfFooterNote || "Thank you for choosing Quadrato Cargo.")
    },
    publicBarcodeCode:
      String(booking.publicBarcodeCode || "").trim().toUpperCase() ||
      computePublicBarcodeCode(String(booking.id)),
    adminInvoice
  };
}

function buildPdfHtml(input, barcodeDataUrl) {
  const primary = normalizeHex(input.settings.primaryColor, "#0f766e");
  const accent = normalizeHex(input.settings.accentColor, "#16a34a");
  const card = normalizeHex(input.settings.cardColor, "#f8fafc");
  const ai = input.adminInvoice && typeof input.adminInvoice === "object" ? input.adminInvoice : null;
  const useAdminCharges = Boolean(
    ai && (String(ai.total || "").trim() || String(ai.subtotal || "").trim())
  );
  const amountRaw = String(input.amountLabel || "").trim();
  const amountNumber = Number.parseFloat(amountRaw.replace(/[^0-9.-]/g, ""));
  const amount = Number.isFinite(amountNumber) ? amountNumber.toFixed(2) : amountRaw || "0.00";
  const weightRaw = String(input.weightLabel || "").trim();
  const weightNumber = Number.parseFloat(weightRaw.replace(/[^0-9.-]/g, ""));
  const weight = Number.isFinite(weightNumber) ? weightNumber : 0;
  const [length = "-", width = "-", height = "-"] = String(input.dimensionsLabel || "")
    .replace(/cm/gi, "")
    .split("x")
    .map((v) => v.trim())
    .filter(Boolean);
  const volumetric = Number.isFinite(weightNumber) ? weightNumber : "-";
  const fixedCharge = Number.isFinite(amountNumber) ? (amountNumber * 0.05).toFixed(2) : "-";
  const declaredValue = amount;
  const safeReference = String(input.reference || input.bookingId || "").trim() || input.bookingId;
  const scanCode = String(input.publicBarcodeCode || safeReference).trim() || input.bookingId;
  const showAltTrackingRef = Boolean(safeReference && scanCode && safeReference !== scanCode);
  const displayInvoiceId = String(ai?.number || "").trim() || scanCode;
  const subtotal = Number.isFinite(amountNumber) ? amountNumber.toFixed(2) : amount;
  const declaredTotal = Number.isFinite(amountNumber) ? (amountNumber * 1.03).toFixed(2) : amount;
  const currencyLabel = String(ai?.currency || "INR").trim() || "INR";
  const chargeDiscount = useAdminCharges ? String(ai.discount || "").trim() || "0" : "0";
  const chargeInsurance = useAdminCharges
    ? String(ai.insurance || "").trim() || fixedCharge
    : fixedCharge;
  const chargeCustoms = useAdminCharges
    ? String(ai.customsDuties || "").trim() || "—"
    : "1";
  const chargeTax = useAdminCharges ? String(ai.tax || "").trim() || "—" : "0";
  const chargeDeclaredTotal = useAdminCharges
    ? String(ai.total || "").trim() || declaredTotal
    : declaredTotal;
  const chargeDeclaredValue = useAdminCharges
    ? String(ai.subtotal || "").trim() || declaredValue
    : declaredValue;
  const chargeTotalEnvio = useAdminCharges
    ? `${currencyLabel} ${String(ai.total || ai.subtotal || subtotal).trim()}`
    : `INR ${subtotal}`;
  const data = {
    ...input,
    settings: {
      ...input.settings,
      primary,
      accent,
      card
    },
    amount,
    weight,
    length,
    width,
    height,
    volumetric,
    fixedCharge,
    declaredValue,
    subtotal,
    declaredTotal,
    safeReference,
    scanCode,
    showAltTrackingRef,
    displayInvoiceId,
    chargeDiscount,
    chargeInsurance,
    chargeCustoms,
    chargeTax,
    chargeDeclaredTotal,
    chargeDeclaredValue,
    chargeTotalEnvio,
    adminInvoiceNotes: ai?.notes ? String(ai.notes).trim() : ""
  };

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
      }
      .page {
        padding: 22px;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: #ffffff;
      }
      .top {
        display: grid;
        grid-template-columns: 1.25fr 1fr 1fr;
        align-items: center;
        column-gap: 14px;
      }
      .brand {
        color: ${data.settings.primary};
        font-size: 38px;
        font-weight: 700;
        font-family: "Times New Roman", serif;
        margin-top: 0;
      }
      .company-meta {
        text-align: left;
        font-size: 13px;
        line-height: 1.4;
        color: #475569;
      }
      .barcode {
        text-align: right;
      }
      .barcode img {
        width: 230px;
        height: 72px;
        object-fit: contain;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 6px;
        background: #fff;
      }
      .barcode .code {
        margin-top: 4px;
        font-size: 28px;
        font-family: "Courier New", monospace;
        letter-spacing: .7px;
      }
      .barcode .code-sub {
        margin-top: 2px;
        font-size: 12px;
        color: #64748b;
        font-family: "Courier New", monospace;
      }
      .separator {
        margin: 12px 0 14px;
        border-top: 1px solid #e2e8f0;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 14px;
      }
      .billto {
        font-size: 14px;
        line-height: 1.38;
        background: ${data.settings.card};
        border: 1px solid #dbeafe;
        border-radius: 10px;
        padding: 10px 12px;
      }
      .billto .title {
        font-weight: 700;
        margin-bottom: 4px;
        color: ${data.settings.primary};
      }
      .mini-table {
        border: 1px solid #cbd5e1;
        border-collapse: collapse;
        width: 100%;
        font-size: 13px;
        border-radius: 10px;
        overflow: hidden;
      }
      .mini-table td {
        border: 1px solid #cbd5e1;
        padding: 7px 8px;
      }
      .mini-table td:first-child {
        background: ${data.settings.primary};
        color: #fff;
        width: 42%;
        font-weight: 600;
      }
      .detail-table {
        margin-top: 14px;
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        border-radius: 10px;
        overflow: hidden;
      }
      .detail-table th, .detail-table td {
        border: 1px solid #cbd5e1;
        padding: 7px 6px;
        vertical-align: top;
      }
      .detail-table th {
        background: ${data.settings.primary};
        color: #fff;
        text-align: left;
        font-weight: 700;
      }
      .detail-table tbody tr:nth-child(even) { background: #f8fafc; }
      .totals-wrap {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .totals-left, .totals-right {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        border-radius: 10px;
        overflow: hidden;
      }
      .totals-left td, .totals-right td {
        border: 1px solid #cbd5e1;
        padding: 7px 8px;
      }
      .charges-table {
        margin-top: 14px;
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        border-radius: 10px;
        overflow: hidden;
      }
      .charges-table th, .charges-table td {
        border: 1px solid #cbd5e1;
        padding: 8px 6px;
      }
      .charges-table th {
        background: ${data.settings.primary};
        color: #fff;
        text-align: left;
      }
      .charges-table tbody tr:nth-child(even) { background: #f8fafc; }
      .terms-title {
        margin-top: 14px;
        border-top: 1px solid #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
        text-align: center;
        letter-spacing: 3px;
        padding: 6px 0;
        font-weight: 700;
        color: #334155;
      }
      .terms-text {
        margin-top: 8px;
        font-size: 13px;
        line-height: 1.45;
        color: #334155;
      }
      .footer {
        margin-top: 10px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="top">
        <div>
          <div class="brand">${esc(data.settings.companyName)}</div>
        </div>
        <div class="company-meta">
          <div>TIN: ${esc(data.bookingId)}</div>
          <div>Phone: ${esc(data.settings.supportPhone)}</div>
          <div>Email: ${esc(data.settings.supportEmail)}</div>
          <div>Street: ${esc(data.settings.companyAddress)}</div>
        </div>
        <div class="barcode">
          <img src="${esc(barcodeDataUrl)}" alt="Invoice barcode" />
          <div class="code">${esc(data.scanCode)}</div>
          ${
            data.showAltTrackingRef
              ? `<div class="code-sub">Consignment / ref: ${esc(data.safeReference)}</div>`
              : ""
          }
        </div>
      </section>

      <div class="separator"></div>

      <section class="meta-grid">
        <div class="billto">
          <div class="title">Bill to</div>
          <div><strong>${esc(data.recipientName)}</strong></div>
          <div>${esc(data.recipientAddress || data.toCity)}</div>
          <div>${esc(data.recipientPhone)}</div>
          <div>${esc(data.recipientEmail)}</div>
        </div>
        <table class="mini-table">
          <tr><td>Shipping mode</td><td>${esc(data.routeTypeLabel)}</td></tr>
          <tr><td>Courier company</td><td>${esc(data.agencyLabel)}</td></tr>
          <tr><td>Service Mode</td><td>${esc(data.statusLabel)}</td></tr>
          <tr><td>Shipping Date</td><td>${esc(data.bookingDateLabel)}</td></tr>
          <tr><td>Invoice #</td><td><strong>${esc(data.displayInvoiceId)}</strong></td></tr>
        </table>
      </section>

      <table class="detail-table">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Description</th>
            <th>Weight</th>
            <th>Length</th>
            <th>Width</th>
            <th>Height</th>
            <th>Weight Vol.</th>
            <th>Fixed charge</th>
            <th>DecValue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${esc(data.amount)}</td>
            <td>${esc(data.contentsLabel)}</td>
            <td>${esc(String(data.weight))}</td>
            <td>${esc(data.length)}</td>
            <td>${esc(data.width)}</td>
            <td>${esc(data.height)}</td>
            <td>${esc(String(data.volumetric))}</td>
            <td>${esc(data.fixedCharge)}</td>
            <td>${esc(data.declaredValue)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals-wrap">
        <table class="totals-left">
          <tr><td><strong>Price kg: ${esc(String(data.weight))}</strong></td><td><strong>Weight: ${esc(String(data.weight))}</strong></td></tr>
          <tr><td><strong>Volumetric weight: ${esc(String(data.volumetric))}</strong></td><td><strong>Total weight calculation: ${esc(String(data.weight))}</strong></td></tr>
        </table>
        <table class="totals-right">
          <tr><td><strong>Subtotal</strong></td><td>${esc(data.subtotal)}</td></tr>
        </table>
      </div>

      <table class="charges-table">
        <thead>
          <tr>
            <th>Discount 0 %</th>
            <th>Shipping Insurance</th>
            <th>Customs Duties</th>
            <th>Tax</th>
            <th>Declared total value</th>
            <th>Declared value</th>
            <th>Total envio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${esc(data.chargeDiscount)}</td>
            <td>${esc(data.chargeInsurance)}</td>
            <td>${esc(data.chargeCustoms)}</td>
            <td>${esc(data.chargeTax)}</td>
            <td>${esc(data.chargeDeclaredTotal)}</td>
            <td>${esc(data.chargeDeclaredValue)}</td>
            <td>${esc(data.chargeTotalEnvio)}</td>
          </tr>
        </tbody>
      </table>

      ${
        data.adminInvoiceNotes
          ? `<div class="terms-title">BILLING NOTES</div>
      <div class="terms-text">${esc(data.adminInvoiceNotes)}</div>`
          : ""
      }

      <div class="terms-title">TERMS</div>
      <div class="terms-text">
        ACCEPTED: The sender declares that shipment details are accurate and no prohibited items are included. In case of customs checks, the client is responsible for duties and supporting documents. Courier transit timelines may vary by route, service mode, and destination compliance checks.
      </div>

      <div class="footer">${esc(data.settings.footerNote)}</div>
    </div>
  </body>
</html>`;
}

function buildTrackingPdfHtml(input, qrDataUrl, barcodeDataUrl) {
  const primary = normalizeHex(input.settings.primaryColor, "#0f766e");
  const safeReference = String(input.reference || input.bookingId || "").trim() || input.bookingId;
  const scanCode = String(input.publicBarcodeCode || safeReference).trim() || input.bookingId;
  const showAltRef = Boolean(safeReference && scanCode && safeReference !== scanCode);
  const routeLine = `${input.fromCity || "-"} - ${input.toCity || "-"}`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
        color: #111827;
        background: #fff;
      }
      .page {
        width: 100%;
        padding: 18px 20px 20px;
      }
      .top {
        display: grid;
        grid-template-columns: 1fr auto;
        column-gap: 10px;
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 10px;
      }
      .brand {
        color: ${primary};
        font-weight: 700;
        font-size: 30px;
        font-family: "Times New Roman", serif;
        line-height: 1;
      }
      .meta {
        text-align: right;
        font-size: 12px;
        line-height: 1.3;
        color: #4b5563;
      }
      .barcode-wrap {
        margin-top: 12px;
        text-align: center;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 10px 10px 8px;
        background: #fafafa;
      }
      .barcode-wrap img {
        width: 100%;
        max-width: 710px;
        height: 72px;
        object-fit: contain;
      }
      .barcode-id {
        font-family: "Courier New", monospace;
        font-size: 18px;
        letter-spacing: .6px;
        margin-top: 4px;
      }
      .code-big {
        margin-top: 10px;
        text-align: center;
        font-size: 42px;
        line-height: 1.05;
        font-weight: 800;
        letter-spacing: 1px;
        color: #111827;
      }
      .package-ref {
        margin-top: 14px;
        font-size: 14px;
        font-weight: 700;
        color: #374151;
      }
      .line {
        margin-top: 8px;
        font-size: 14px;
        text-align: center;
        color: #374151;
      }
      .service {
        margin-top: 12px;
        text-align: center;
        font-size: 15px;
        color: #111827;
      }
      .service strong {
        letter-spacing: .4px;
      }
      .pay-wrap {
        margin-top: 14px;
        text-align: center;
      }
      .pay-title {
        font-size: 20px;
        font-weight: 500;
      }
      .badge {
        display: inline-block;
        margin-top: 6px;
        background: #16a34a;
        color: #fff;
        padding: 4px 12px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
      }
      .route {
        margin-top: 18px;
        text-align: center;
        font-size: 36px;
        font-weight: 700;
        line-height: 1.15;
        color: #111827;
      }
      .ops {
        margin-top: 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .ops .cell {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 8px 10px;
        background: #f8fafc;
      }
      .ops .label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .4px;
        color: #6b7280;
      }
      .ops .value {
        margin-top: 2px;
        font-size: 13px;
        font-weight: 600;
        color: #111827;
        word-break: break-word;
      }
      .people {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 12px;
      }
      .person {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #fff;
        padding: 10px 10px 12px;
      }
      .person h4 {
        margin: 0 0 4px;
        text-align: center;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: .45px;
        color: #6b7280;
      }
      .person .name {
        text-align: center;
        font-weight: 700;
        font-size: 24px;
        line-height: 1.2;
        margin-bottom: 5px;
      }
      .person .block {
        text-align: center;
        font-size: 14px;
        line-height: 1.35;
        color: #1f2937;
        word-break: break-word;
      }
      .qr-row {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
      }
      .qr-row img {
        width: 110px;
        height: 110px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 4px;
      }
      .footer {
        margin-top: 8px;
        text-align: center;
        font-size: 11px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="top">
        <div class="brand">${esc(input.settings.companyName)}</div>
        <div class="meta">
          <div>${esc(input.settings.headerSubtitle)}</div>
          <div>${esc(input.settings.companyAddress)}</div>
          <div>Phone: ${esc(input.settings.supportPhone)}</div>
        </div>
      </section>

      <div class="barcode-wrap">
        <img src="${esc(barcodeDataUrl)}" alt="Tracking Barcode" />
        <div class="barcode-id">${esc(scanCode)}</div>
      </div>
      <div class="code-big">${esc(scanCode)}</div>
      ${
        showAltRef
          ? `<div class="line" style="font-size:13px;font-weight:600;margin-top:6px;">Consignment / booking ref: ${esc(safeReference)}</div>`
          : ""
      }

      <div class="package-ref">PACKAGE REFERENCE:</div>
      <div class="line">
        Date: ${esc(input.bookingDateLabel)} | Amount: ${esc(input.amountLabel)} | Weight: ${esc(input.weightLabel)} | Cost: ${esc(input.amountLabel)}
      </div>
      <div class="line">
        Dimensions: ${esc(input.dimensionsLabel)}
      </div>

      <div class="service">
        <strong>SERVICE REFERENCE</strong> ${esc(input.statusLabel)}
      </div>

      <section class="ops">
        <div class="cell">
          <div class="label">Pickup courier</div>
          <div class="value">${esc(input.courierNameLabel || "Pending assignment")}</div>
        </div>
        <div class="cell">
          <div class="label">Assigned agency</div>
          <div class="value">${esc(input.agencyLabel || "Pending assignment")}</div>
        </div>
      </section>

      <div class="route">${esc(routeLine)}</div>

      <section class="people">
        <div class="person">
          <h4>Sender</h4>
          <div class="name">${esc(input.senderName)}</div>
          <div class="block">${esc(input.senderAddress)}</div>
          <div class="block">${esc(input.senderPhone)}</div>
        </div>
        <div class="person">
          <h4>Recipient</h4>
          <div class="name">${esc(input.recipientName)}</div>
          <div class="block">${esc(input.recipientAddress)}</div>
          <div class="block">${esc(input.recipientPhone)}</div>
        </div>
      </section>

      <div class="qr-row">
        <img src="${esc(qrDataUrl)}" alt="Tracking QR" />
      </div>
      <div class="footer">${esc(input.settings.footerNote)}</div>
    </div>
  </body>
</html>`;
}

export async function createContact(req, res, next) {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      return sendError(res, "Please fix the highlighted fields.", 400, {
        fieldErrors: {
          name: f.name?.[0],
          email: f.email?.[0],
          phone: f.phone?.[0],
          service: f.service?.[0],
          message: f.message?.[0]
        }
      });
    }

    await createContactSubmission(parsed.data);
    return sendOk(res, { message: "Thanks, your message has been received." });
  } catch (error) {
    return next(error);
  }
}

export async function createPublicBooking(req, res, next) {
  try {
    const parsed = createBookingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid booking request.", 400, {
        fieldErrors: buildBookingFieldErrors(parsed.error.issues)
      });
    }
    const routeType = parsed.data.routeType;
    let bookingPayload = { ...parsed.data.bookingPayload };
    const slotRaw = String(bookingPayload.pickupTimeSlot || "").trim();
    if (slotRaw.toLowerCase() === "custom") {
      const custom = String(bookingPayload.pickupTimeSlotCustom || "").trim();
      bookingPayload = {
        ...bookingPayload,
        pickupTimeSlot: custom || bookingPayload.pickupTimeSlot
      };
    }
    delete bookingPayload.pickupTimeSlotCustom;
    let userId = null;
    const token = req.cookies?.[env.authCookieName];
    if (token) {
      try {
        const payload = verifyAuthToken(token);
        userId = String(payload?.sub ?? "").trim() || null;
      } catch {
        userId = null;
      }
    }

    const booking = await createBooking({
      routeType,
      payload: bookingPayload,
      userId
    });
    return sendOk(res, {
      message:
        "Booking submitted. Our backend team will verify serviceability, assign logistics staff for pickup, and manually update progress until carrier handoff.",
      bookingReference: booking?.id ?? null
    });
  } catch (error) {
    return next(error);
  }
}

export async function trackBooking(req, res, next) {
  try {
    const normalizedReference = normalizeTrackingReference(req.params.reference ?? "");
    const parsedReference = trackingReferenceSchema.safeParse(normalizedReference);
    if (!parsedReference.success) {
      return sendError(
        res,
        "Enter a valid Tracking ID or booking reference.",
        400
      );
    }
    const row = await findBookingByReference(parsedReference.data);
    if (!row) {
      return sendNotFound(res, "Tracking not found.");
    }
    let courierName = null;
    if (row.courierId) {
      const courier = await findUserById(row.courierId);
      courierName = String(courier?.name || courier?.email || "").trim() || null;
    }
    return sendOk(res, {
      tracking: {
        id: row.id,
        routeType: row.routeType,
        status: row.status,
        consignmentNumber: row.consignmentNumber,
        publicBarcodeCode: row.publicBarcodeCode || computePublicBarcodeCode(row.id),
        trackingNotes: row.customerTrackingNote || null,
        customerTrackingNote: row.customerTrackingNote || null,
        courierName,
        agencyName: row.assignedAgency || null,
        senderName: row.senderName || null,
        senderAddress: row.senderAddress || null,
        recipientName: row.recipientName || null,
        recipientAddress: row.recipientAddress || null,
        createdAt: row.createdAt,
        shipment: buildShipmentSummaryForPublicTrack(row.payload)
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSiteSettings(_req, res, next) {
  try {
    const db = await getDb();
    const row = await db.collection("settings").findOne({ key: "site" });
    return sendOk(res, { settings: normalizeSiteSettings(row) });
  } catch (error) {
    return next(error);
  }
}

export async function generateBookingPdf(req, res, next) {
  let page;
  try {
    const parsed = pdfRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid PDF data payload.", 400);
    }

    const input = await buildPdfDataFromBooking(req, parsed.data);

    const isTrackingTemplate = input.template === "tracking";
    const [qrDataUrl, barcodePng] = await Promise.all([
      isTrackingTemplate
        ? QRCode.toDataURL(String(input.trackUrl || "").trim() || "https://quadratocargo.com", {
            margin: 1,
            width: 220,
            color: {
              dark: normalizeHex(input.settings.primaryColor, "#0f766e"),
              light: "#ffffff"
            }
          })
        : Promise.resolve(""),
      bwipjs.toBuffer({
        bcid: "code128",
        text: String(input.publicBarcodeCode || input.reference || input.bookingId || "QC-INVOICE"),
        scale: 3,
        height: 16,
        includetext: false,
        backgroundcolor: "FFFFFF"
      })
    ]);
    const barcodeDataUrl = `data:image/png;base64,${barcodePng.toString("base64")}`;
    const html = isTrackingTemplate
      ? buildTrackingPdfHtml(input, qrDataUrl, barcodeDataUrl)
      : buildPdfHtml(input, barcodeDataUrl);

    const browser = await getPdfBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    await page
      .evaluate(async () => {
        await Promise.all(
          Array.from(document.images).map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) {
                  resolve();
                  return;
                }
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
              }),
          ),
        );
      })
      .catch(() => {});
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
    });

    const filenameSafeRef = String(input.reference || input.bookingId)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .trim();
    const pdfBinary = Buffer.from(pdfBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="courier-details-${filenameSafeRef || input.bookingId}.pdf"`
    );
    return res.status(200).send(pdfBinary);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return sendError(res, "Invalid PDF data payload.", 400);
    }
    if (error instanceof Error && error.message.includes("Unable to launch PDF browser")) {
      return sendError(
        res,
        "PDF engine is not available on server. Configure Chrome/Puppeteer runtime.",
        500
      );
    }
    if (error instanceof Error && error.message.includes("Unable to build booking PDF context")) {
      return sendError(res, "Unable to load booking data for PDF.", 400);
    }
    if (error instanceof Error && error.message.includes("Pickup OTP verification pending")) {
      return sendError(
        res,
        "Invoice/PDF is available after courier pickup OTP verification.",
        403
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("Invoice PDF disabled until billing is enabled by admin.")
    ) {
      return sendError(
        res,
        "Invoice PDF is not available yet. Billing must be finalized in admin for this booking.",
        403
      );
    }
    return next(error);
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}
