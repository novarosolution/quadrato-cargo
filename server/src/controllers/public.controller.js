import { z } from "zod";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import bwipjs from "bwip-js";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { env } from "../config/env.js";
import { getDb } from "../db/mongo.js";
import {
  normalizeSiteSettings,
  publicTrackUiFromSettings
} from "../models/site-settings.model.js";
import {
  createBooking,
  findBookingByReference,
  findBookingByUserAndId
} from "../modules/bookings/booking-repo.js";
import { createContactSubmission } from "../modules/contacts/contact-repo.js";
import { verifyAuthToken } from "../modules/auth/token.js";
import { findUserById } from "../modules/users/user-repo.js";
import {
  resolveAssignedAgencyDisplayName
} from "../shared/agency-display-name.js";
import { computePublicBarcodeCode } from "../shared/public-barcode-code.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const _publicControllerDir = dirname(fileURLToPath(import.meta.url));

/** SVG lockup (grid + Quadrato Cargo + tagline) for invoice & tracking PDFs — same artwork as `quadrato-cargo/public/invoice-brand-logo.svg`. */
function loadInvoiceBrandLogoDataUrl() {
  try {
    const svgPath = join(_publicControllerDir, "..", "assets", "invoice-brand-logo.svg");
    const buf = readFileSync(svgPath);
    return `data:image/svg+xml;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

const INVOICE_BRAND_LOGO_DATA_URL = loadInvoiceBrandLogoDataUrl();

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
  let senderAddress = [senderStreet, senderCity, senderPostal, senderCountry]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(", ") || "-";
  if (senderAddress === "-") {
    senderAddress = String(booking.senderAddress || "").trim() || "-";
  }
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
    bookingDateLabel: safeDateLabel(booking.customerFacingCreatedAt ?? booking.createdAt),
    updatedAtLabel: safeDateLabel(
      booking.customerFacingUpdatedAt ?? booking.updatedAt ?? booking.createdAt
    ),
    reference,
    routeTypeLabel: String(booking.routeType || "-"),
    consignmentNumber: String(booking.consignmentNumber || "-"),
    fromCity: senderCity || "-",
    toCity: recipientCity || "-",
    senderName: (() => {
      const fromPayload = payloadValue(payload, ["sender", "name"], "");
      if (fromPayload && fromPayload !== "-") return fromPayload;
      return String(booking.senderName || "").trim() || "-";
    })(),
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
    trackingNotesLabel: String(
      [booking.publicTrackingNote, booking.customerTrackingNote].find((n) => String(n || "").trim()) ||
        "-"
    ),
    agencyLabel:
      (await resolveAssignedAgencyDisplayName(db, booking.assignedAgency)) ||
      "Pending assignment",
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

/** Shared field normalisation for invoice PDFs (server-rendered). */
function prepareInvoicePdfData(input) {
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
  return {
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
    currencyLabel,
    adminInvoiceNotes: ai?.notes ? String(ai.notes).trim() : ""
  };
}

/**
 * Compact invoice HTML for ISO A6 (105 mm × 148 mm) — matches tracking slip page size.
 */
function buildInvoiceA6PdfHtml(input, barcodeDataUrl) {
  const data = prepareInvoicePdfData(input);
  const p = data.settings.primary;
  const card = data.settings.card;

  const chargeRow = (label, value) =>
    value != null && String(value).trim()
      ? `<div class="chg"><span>${esc(label)}</span><strong>${esc(String(value).trim())}</strong></div>`
      : "";

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
        background: #fff;
      }
      .page { width: 100%; padding: 5px 7px 6px; }
      .inv-head {
        padding-bottom: 5px;
        margin-bottom: 5px;
        border-bottom: 2px solid ${p};
      }
      .top {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 6px;
        align-items: start;
      }
      .brand-lockup img { display: block; height: 22px; width: auto; max-width: 100%; object-fit: contain; }
      .brand {
        color: ${p};
        font-weight: 700;
        font-size: 14px;
        font-family: "Times New Roman", serif;
        line-height: 1.1;
      }
      .co-meta {
        font-size: 6.5px;
        line-height: 1.3;
        color: #374151;
        text-align: right;
        max-width: 48mm;
      }
      .co-meta .co { font-weight: 700; color: #0f172a; font-size: 7.5px; }
      .bc-wrap {
        margin-top: 4px;
        text-align: center;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 3px 5px;
        background: #fafafa;
      }
      .bc-wrap img { width: 100%; max-width: 100%; height: 28px; object-fit: contain; }
      .bc-id {
        font-family: "Courier New", monospace;
        font-size: 8px;
        letter-spacing: 0.25px;
        margin-top: 1px;
      }
      .inv-title {
        margin-top: 4px;
        font-size: 11px;
        font-weight: 800;
        color: #111827;
      }
      .inv-sub {
        font-size: 7.5px;
        color: #4b5563;
        margin-top: 2px;
        line-height: 1.35;
      }
      .people {
        margin-top: 5px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }
      .person {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: ${card};
        padding: 4px 5px;
        font-size: 6.5px;
        line-height: 1.3;
      }
      .person h4 {
        margin: 0 0 2px;
        font-size: 6.5px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        color: ${p};
        font-weight: 700;
      }
      .person .nm { font-weight: 700; font-size: 7.5px; color: #111827; }
      .kv {
        margin-top: 4px;
        font-size: 6.5px;
        line-height: 1.35;
        border-top: 1px solid #e5e7eb;
        padding-top: 3px;
      }
      .kv div { margin-bottom: 1px; }
      .kv strong { color: #374151; }
      .ship {
        margin-top: 3px;
        font-size: 6.5px;
        line-height: 1.35;
        color: #1f2937;
        word-break: break-word;
      }
      .chg-grid {
        margin-top: 4px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px 8px;
        font-size: 6.5px;
      }
      .chg { display: flex; justify-content: space-between; gap: 4px; border-bottom: 1px dotted #e5e7eb; padding-bottom: 1px; }
      .chg span { color: #6b7280; }
      .note {
        margin-top: 3px;
        font-size: 6px;
        line-height: 1.3;
        color: #64748b;
        max-height: 14mm;
        overflow: hidden;
      }
      .terms {
        margin-top: 3px;
        font-size: 5.5px;
        line-height: 1.3;
        color: #64748b;
      }
      .a6-tag {
        margin-top: 2px;
        text-align: center;
        font-size: 5px;
        color: #94a3b8;
        letter-spacing: 0.2px;
      }
      .footer {
        margin-top: 2px;
        text-align: center;
        font-size: 6px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="inv-head">
        <section class="top">
          ${
            INVOICE_BRAND_LOGO_DATA_URL
              ? `<div class="brand-lockup"><img src="${INVOICE_BRAND_LOGO_DATA_URL}" alt="${esc(data.settings.companyName)}" /></div>`
              : `<div class="brand">${esc(data.settings.companyName).slice(0, 36)}</div>`
          }
          <div class="co-meta">
            <div class="co">${esc(data.settings.companyName).slice(0, 40)}</div>
            <div>${esc(data.settings.companyAddress || "—").slice(0, 120)}</div>
            <div>${esc(data.settings.supportPhone)} · ${esc(data.settings.supportEmail)}</div>
          </div>
        </section>
      </header>

      <div class="bc-wrap">
        <img src="${esc(barcodeDataUrl)}" alt="Barcode" />
        <div class="bc-id">${esc(data.scanCode)}</div>
        ${
          data.showAltTrackingRef
            ? `<div style="font-size:6px;color:#6b7280;margin-top:1px;">Ref: ${esc(data.safeReference)}</div>`
            : ""
        }
      </div>

      <div class="inv-title">Invoice · ${esc(data.displayInvoiceId).slice(0, 28)}</div>
      <div class="inv-sub">
        Booked ${esc(data.bookingDateLabel)} · Updated ${esc(data.updatedAtLabel)} ·
        ID <span style="font-family:monospace">${esc(data.bookingId)}</span> ·
        ${esc(data.routeTypeLabel)} · ${esc(data.agencyLabel).slice(0, 22)}
      </div>

      <section class="people">
        <div class="person">
          <h4>Sender</h4>
          <div class="nm">${esc(data.senderName).slice(0, 48)}</div>
          <div>${esc((data.senderAddress || data.fromCity || "").slice(0, 140))}</div>
          <div>${esc(data.senderPhone)} ${esc(data.senderEmail).slice(0, 36)}</div>
        </div>
        <div class="person">
          <h4>Bill to</h4>
          <div class="nm">${esc(data.recipientName).slice(0, 48)}</div>
          <div>${esc((data.recipientAddress || data.toCity || "").slice(0, 140))}</div>
          <div>${esc(data.recipientPhone)} ${esc(data.recipientEmail).slice(0, 36)}</div>
        </div>
      </section>

      <div class="kv">
        <div><strong>Courier</strong> ${esc(data.courierNameLabel).slice(0, 42)}</div>
        <div><strong>Consignment</strong> ${esc(data.scanCode)}</div>
      </div>

      <div class="ship">
        <strong>Shipment</strong> ${esc(data.contentsLabel).slice(0, 200)} · Wt ${esc(String(data.weight))} ·
        ${esc(data.length)}×${esc(data.width)}×${esc(data.height)} cm · Amt ${esc(data.amount)} · Decl. ${esc(data.declaredValue)}
      </div>

      <div class="chg-grid">
        ${chargeRow("Subtotal", data.subtotal)}
        ${chargeRow("Tax", data.chargeTax)}
        ${chargeRow("Insurance", data.chargeInsurance)}
        ${chargeRow("Customs", data.chargeCustoms)}
        ${chargeRow("Discount", data.chargeDiscount)}
        ${chargeRow("Total", data.chargeTotalEnvio)}
      </div>

      ${
        data.adminInvoiceNotes
          ? `<div class="note"><strong>Note:</strong> ${esc(data.adminInvoiceNotes).slice(0, 280)}</div>`
          : ""
      }
      ${
        data.trackingNotesLabel && String(data.trackingNotesLabel).trim() !== "-"
          ? `<div class="note"><strong>Tracking:</strong> ${esc(data.trackingNotesLabel).slice(0, 200)}</div>`
          : ""
      }

      <div class="terms">
        Sender declares details accurate; customs/duties may apply; transit varies by route and compliance.
      </div>
      <div class="a6-tag">ISO A6 · 105 × 148 mm</div>
      <div class="footer">${esc(data.settings.footerNote).slice(0, 90)}</div>
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
      /* Compact layout for ISO A6 receipt (105mm × 148mm); may paginate if content is long */
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
        color: #111827;
        background: #fff;
      }
      .page {
        width: 100%;
        padding: 6px 8px 8px;
      }
      .track-doc-header {
        padding-bottom: 6px;
        margin-bottom: 6px;
        border-bottom: 2px solid ${primary};
      }
      .top {
        display: grid;
        grid-template-columns: 1fr auto;
        column-gap: 8px;
        align-items: start;
      }
      .brand-lockup {
        display: flex;
        align-items: center;
        background: transparent;
        padding: 0;
        min-height: 26px;
      }
      .brand-lockup img {
        display: block;
        height: 24px;
        width: auto;
        max-width: 100%;
        object-fit: contain;
        object-position: left center;
      }
      .brand {
        color: ${primary};
        font-weight: 700;
        font-size: 16px;
        font-family: "Times New Roman", serif;
        line-height: 1;
      }
      .meta {
        text-align: right;
        font-size: 7.5px;
        line-height: 1.35;
        color: #374151;
        max-width: 52mm;
      }
      .meta .co {
        font-weight: 700;
        color: #0f172a;
        font-size: 8.5px;
      }
      .barcode-wrap {
        margin-top: 6px;
        text-align: center;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 4px 6px;
        background: #fafafa;
      }
      .barcode-wrap img {
        width: 100%;
        max-width: 100%;
        height: 36px;
        object-fit: contain;
      }
      .barcode-id {
        font-family: "Courier New", monospace;
        font-size: 10px;
        letter-spacing: .35px;
        margin-top: 2px;
      }
      .code-big {
        margin-top: 4px;
        text-align: center;
        font-size: 15px;
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: .5px;
        color: #111827;
      }
      .package-ref {
        margin-top: 6px;
        font-size: 10px;
        font-weight: 700;
        color: #374151;
        text-align: center;
      }
      .line {
        margin-top: 3px;
        font-size: 8.5px;
        text-align: center;
        color: #374151;
      }
      .service {
        margin-top: 6px;
        text-align: center;
        font-size: 9.5px;
        color: #111827;
      }
      .service strong {
        letter-spacing: .3px;
      }
      .pay-wrap {
        margin-top: 8px;
        text-align: center;
      }
      .pay-title {
        font-size: 12px;
        font-weight: 500;
      }
      .badge {
        display: inline-block;
        margin-top: 4px;
        background: #16a34a;
        color: #fff;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 9px;
      }
      .route {
        margin-top: 6px;
        text-align: center;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.15;
        color: #111827;
      }
      .ops {
        margin-top: 6px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }
      .ops .cell {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 4px 6px;
        background: #f8fafc;
      }
      .ops .label {
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: .35px;
        color: #6b7280;
      }
      .ops .value {
        margin-top: 1px;
        font-size: 8.5px;
        font-weight: 600;
        color: #111827;
        word-break: break-word;
      }
      .people {
        margin-top: 6px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 5px;
      }
      .person {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #fff;
        padding: 5px 5px 6px;
      }
      .person h4 {
        margin: 0 0 2px;
        text-align: center;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .35px;
        color: #6b7280;
      }
      .person .name {
        text-align: center;
        font-weight: 700;
        font-size: 10px;
        line-height: 1.15;
        margin-bottom: 3px;
      }
      .person .block {
        text-align: center;
        font-size: 7.5px;
        line-height: 1.3;
        color: #1f2937;
        word-break: break-word;
      }
      .qr-row {
        margin-top: 6px;
        display: flex;
        justify-content: flex-end;
      }
      .qr-row img {
        width: 52px;
        height: 52px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 2px;
      }
      .footer {
        margin-top: 4px;
        text-align: center;
        font-size: 7px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="track-doc-header">
      <section class="top">
        ${
          INVOICE_BRAND_LOGO_DATA_URL
            ? `<div class="brand-lockup"><img src="${INVOICE_BRAND_LOGO_DATA_URL}" alt="${esc(input.settings.companyName)}" /></div>`
            : `<div class="brand">${esc(input.settings.companyName)}</div>`
        }
        <div class="meta">
          <div class="co">${esc(input.settings.companyName)}</div>
          <div>${esc(input.settings.headerSubtitle)}</div>
          <div>${esc(input.settings.companyAddress || "—")}</div>
          <div>Phone: ${esc(input.settings.supportPhone)}</div>
          ${
            input.settings.website
              ? `<div>${esc(input.settings.website)}</div>`
              : ""
          }
        </div>
      </section>
      </header>

      <div class="barcode-wrap">
        <img src="${esc(barcodeDataUrl)}" alt="Tracking Barcode" />
        <div class="barcode-id">${esc(scanCode)}</div>
      </div>
      <div class="code-big">${esc(scanCode)}</div>
      ${
        showAltRef
          ? `<div class="line" style="font-size:8px;font-weight:600;margin-top:3px;">Consignment / booking ref: ${esc(safeReference)}</div>`
          : ""
      }

      <div class="package-ref">PACKAGE REFERENCE</div>
      <div class="line" style="font-size:12px;margin-top:4px;">
        Booking ID: <strong>${esc(input.bookingId)}</strong>
        · Last updated: <strong>${esc(input.updatedAtLabel)}</strong>
      </div>
      <div class="line">
        Booked: ${esc(input.bookingDateLabel)} | Amount: ${esc(input.amountLabel)} | Weight: ${esc(input.weightLabel)}
      </div>
      <div class="line">
        Dimensions: ${esc(input.dimensionsLabel)}
      </div>
      ${
        input.trackingNotesLabel && String(input.trackingNotesLabel).trim() !== "-"
          ? `<div class="line" style="margin-top:6px;text-align:left;max-width:100%;padding:4px 6px;border:1px solid #e5e7eb;border-radius:6px;background:#f8fafc;font-size:8px;">
        <strong>Customer update:</strong> ${esc(input.trackingNotesLabel)}
      </div>`
          : ""
      }

      <div class="service">
        <strong>SHIPPING MODE</strong> <span style="text-transform:capitalize;">${esc(input.routeTypeLabel)}</span>
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
          <div class="block">${esc(input.senderEmail)}</div>
        </div>
        <div class="person">
          <h4>Recipient</h4>
          <div class="name">${esc(input.recipientName)}</div>
          <div class="block">${esc(input.recipientAddress)}</div>
          <div class="block">${esc(input.recipientPhone)}</div>
          <div class="block">${esc(input.recipientEmail)}</div>
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
        "Your booking is complete. You can track status anytime with your booking or tracking reference.",
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
    const db = await getDb();
    const siteRow = await db.collection("settings").findOne({ key: "site" });
    const siteNorm = normalizeSiteSettings(siteRow);
    const trackUi = publicTrackUiFromSettings(siteNorm);
    let courierName = null;
    if (row.courierId) {
      const courier = await findUserById(row.courierId);
      courierName = String(courier?.name || courier?.email || "").trim() || null;
    }
    const agencyName = await resolveAssignedAgencyDisplayName(db, row.assignedAgency);
    return sendOk(res, {
      trackUi,
      tracking: {
        id: row.id,
        routeType: row.routeType,
        status: row.status,
        consignmentNumber: row.consignmentNumber,
        publicBarcodeCode: row.publicBarcodeCode || computePublicBarcodeCode(row.id),
        /** Internal / operational log (seed + courier lines); safe for customer context. */
        trackingNotes: row.trackingNotes ?? null,
        /** Admin-edited message shown on track + profile. */
        publicTrackingNote: row.publicTrackingNote ?? null,
        /** Same as public note for customer surfaces (see booking model). */
        customerTrackingNote: row.customerTrackingNote ?? null,
        courierName,
        agencyName,
        senderName: row.senderName || null,
        senderAddress: row.senderAddress || null,
        recipientName: row.recipientName || null,
        recipientAddress: row.recipientAddress || null,
        createdAt: row.customerFacingCreatedAt ?? row.createdAt,
        updatedAt: row.customerFacingUpdatedAt ?? row.updatedAt ?? row.createdAt,
        shipment: buildShipmentSummaryForPublicTrack(row.payload),
        publicTimelineOverrides: row.publicTimelineOverrides ?? null,
        estimatedDeliveryAt: row.estimatedDeliveryAt ?? null
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
            width: 160,
            color: {
              dark: normalizeHex(input.settings.primaryColor, "#0f766e"),
              light: "#ffffff"
            }
          })
        : Promise.resolve(""),
      bwipjs.toBuffer({
        bcid: "code128",
        text: String(input.publicBarcodeCode || input.reference || input.bookingId || "QC-INVOICE"),
        scale: 2,
        height: 12,
        includetext: false,
        backgroundcolor: "FFFFFF"
      })
    ]);
    const barcodeDataUrl = `data:image/png;base64,${barcodePng.toString("base64")}`;
    const html = isTrackingTemplate
      ? buildTrackingPdfHtml(input, qrDataUrl, barcodeDataUrl)
      : buildInvoiceA6PdfHtml(input, barcodeDataUrl);

    const browser = await getPdfBrowser();
    page = await browser.newPage();
    /** Viewport ~ A6 aspect (105:148) for sharp print on ISO A6 PDFs */
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
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
      format: "A6",
      printBackground: true,
      margin: { top: "3mm", right: "3mm", bottom: "3mm", left: "3mm" }
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
