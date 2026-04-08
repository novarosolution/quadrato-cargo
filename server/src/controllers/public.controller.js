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
  resolveAssignedAgencyDisplayName,
  resolveAssignedAgencyForPublicTrack
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
    shipment: z
      .object({
        contentsDescription: z.string().trim().min(5),
        weightKg: z.number().positive().max(1000),
        parcelCount: z.number().int().min(1).max(99).optional(),
        parcels: z
          .array(
            z.object({
              contentsDescription: z.string().trim().min(5),
              weightKg: z.number().positive().max(1000),
              dimensionsCm: z
                .object({
                  l: z.string().trim().max(32),
                  w: z.string().trim().max(32),
                  h: z.string().trim().max(32)
                })
                .optional(),
              declaredValue: z.string().trim().max(500).optional()
            })
          )
          .max(25)
          .optional(),
        dimensionsCm: z
          .object({
            l: z.string().trim().regex(/^\d+(\.\d+)?$/),
            w: z.string().trim().regex(/^\d+(\.\d+)?$/),
            h: z.string().trim().regex(/^\d+(\.\d+)?$/)
          })
          .optional(),
        declaredValue: z.string().trim().max(500).optional()
      })
      .superRefine((shipment, ctx) => {
        const n = shipment.parcelCount;
        const arr = shipment.parcels;
        if (arr == null || arr.length === 0) return;
        if (typeof n === "number" && arr.length !== n) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["parcels"],
            message: "Parcel list length must match parcel count."
          });
        }
      }),
    collectionMode: z.enum(["instant", "scheduled"]),
    pickupDate: z.string().trim().optional(),
    pickupTimeSlot: z.string().trim().optional(),
    pickupTimeSlotCustom: z.string().trim().max(64).optional(),
    pickupPreference: z.string().trim().min(1).max(240),
    instructions: z.string().trim().max(1000).optional(),
    agreedInternational: z.boolean().optional(),
    pickupCityHint: z.string().trim().min(2).max(120),
    deliveryCityHint: z.string().trim().min(2).max(120)
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

function resolveTrackRouteCities(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const sender = p.sender && typeof p.sender === "object" ? p.sender : {};
  const recipient = p.recipient && typeof p.recipient === "object" ? p.recipient : {};
  const fromCity =
    String(sender.city ?? "").trim() || String(p.pickupCityHint ?? "").trim() || null;
  const toCity =
    String(recipient.city ?? "").trim() ||
    String(p.deliveryCityHint ?? "").trim() ||
    null;
  const senderCountry = String(sender.country ?? "").trim() || null;
  const recipientCountry = String(recipient.country ?? "").trim() || null;
  return { fromCity, toCity, senderCountry, recipientCountry };
}

function buildBookingFieldErrors(issues = []) {
  const out = {};
  const mapping = {
    routeType: "routeType",
    "bookingPayload.collectionMode": "collectionMode",
    "bookingPayload.pickupDate": "pickupDate",
    "bookingPayload.pickupTimeSlot": "pickupTimeSlot",
    "bookingPayload.pickupTimeSlotCustom": "pickupTimeSlotCustom",
    "bookingPayload.pickupCityHint": "pickupCityHint",
    "bookingPayload.deliveryCityHint": "deliveryCityHint",
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

function escHtmlLines(value, maxChars) {
  const t = String(value ?? "").trim().slice(0, maxChars);
  if (!t) return "";
  return t
    .split(/\r?\n/)
    .map((line) => esc(line))
    .join("<br/>");
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

function parcelSizeCmHint(hint) {
  if (!hint || typeof hint !== "object") return "";
  const dm = hint.dimensionsCm;
  if (dm && typeof dm === "object") {
    const l = String(dm.l ?? "").trim();
    const w = String(dm.w ?? "").trim();
    const h = String(dm.h ?? "").trim();
    const parts = [l, w, h].filter(Boolean);
    if (parts.length === 3) return `${l} × ${w} × ${h} cm`;
    if (parts.length) return `${parts.join(" × ")} cm`;
  }
  return "";
}

/** If only a plain number was entered under Size, show it under Wt (common data-entry mistake). */
function normalizePdfLineWeightSize(weightKg, sizeCm) {
  let w = String(weightKg ?? "").trim();
  let s = String(sizeCm ?? "").trim();
  if (!w && s && /^\d+(\.\d+)?$/.test(s) && !/[×x]/.test(s)) {
    w = s;
    s = "";
  }
  return { weightKg: w, sizeCm: s };
}

function isInvoiceLineRowEmpty(row) {
  if (!row || typeof row !== "object") return true;
  return (
    !String(row.description ?? "").trim() &&
    !String(row.amount ?? "").trim() &&
    !String(row.weightKg ?? "").trim() &&
    !String(row.sizeCm ?? "").trim() &&
    !String(row.declaredValue ?? "").trim()
  );
}

function trimTrailingEmptyInvoiceRows(rows) {
  const out = Array.isArray(rows) ? [...rows] : [];
  while (out.length > 0 && isInvoiceLineRowEmpty(out[out.length - 1])) {
    out.pop();
  }
  return out;
}

/** Merge saved invoice lines with shipment.parcels (admin rows win; parcel rows only when empty). */
function mergeInvoiceLineItemsWithParcels(rawLineItems, payload) {
  const shipment =
    payload && typeof payload === "object" && payload.shipment && typeof payload.shipment === "object"
      ? payload.shipment
      : {};
  const pcRaw = shipment.parcelCount;
  const parcelN =
    typeof pcRaw === "number" && Number.isFinite(pcRaw)
      ? Math.round(pcRaw)
      : Number.parseInt(String(pcRaw ?? "1").trim(), 10) || 1;
  const nClamped = Math.min(25, Math.max(1, parcelN));
  const rawParcels = Array.isArray(shipment.parcels) ? shipment.parcels : [];
  const parcels = [];
  for (const pr of rawParcels) {
    if (!pr || typeof pr !== "object") continue;
    parcels.push(pr);
  }
  if (parcels.length === 0) {
    const contentsBase = String(shipment.contentsDescription ?? "").trim();
    const weightFromShipment =
      typeof shipment.weightKg === "number" && Number.isFinite(shipment.weightKg)
        ? String(shipment.weightKg)
        : String(shipment.weightKg ?? "").trim();
    const dm =
      shipment.dimensionsCm && typeof shipment.dimensionsCm === "object" ? shipment.dimensionsCm : null;
    parcels.push({
      contentsDescription: contentsBase,
      weightKg: weightFromShipment,
      declaredValue: String(shipment.declaredValue ?? "").trim(),
      ...(dm ? { dimensionsCm: dm } : {})
    });
  }
  while (parcels.length < nClamped) {
    parcels.push({});
  }
  if (parcels.length > nClamped) parcels.length = nClamped;

  const savedRowsRaw = [];
  for (const row of Array.isArray(rawLineItems) ? rawLineItems : []) {
    if (!row || typeof row !== "object") continue;
    savedRowsRaw.push({
      description: String(row.description ?? "").trim(),
      amount: String(row.amount ?? "").trim(),
      weightKg: String(row.weightKg ?? "").trim(),
      sizeCm: String(row.sizeCm ?? "").trim(),
      declaredValue: String(row.declaredValue ?? "").trim(),
    });
  }
  const savedRows = trimTrailingEmptyInvoiceRows(savedRowsRaw);
  const anySavedInvoiceRow = savedRows.some((r) => !isInvoiceLineRowEmpty(r));

  const rowCount = anySavedInvoiceRow
    ? Math.min(25, Math.max(savedRows.length, 1))
    : Math.min(25, Math.max(nClamped, 1));

  const merged = [];
  for (let i = 0; i < rowCount; i++) {
    const saved = savedRows[i] || {};
    const hint = parcels[i] || {};
    const wHint =
      typeof hint.weightKg === "number" && Number.isFinite(hint.weightKg)
        ? String(hint.weightKg)
        : String(hint.weightKg ?? "").trim();
    const dvHint = String(hint.declaredValue ?? "").trim();
    const defaultDesc = i < nClamped ? `Item ${i + 1}` : `Line ${i + 1}`;
    const description = saved.description || (anySavedInvoiceRow ? "" : defaultDesc);
    const weightKg = saved.weightKg || wHint || "";
    const sizeCm = saved.sizeCm || parcelSizeCmHint(hint) || "";
    const declaredValue = saved.declaredValue || dvHint || "";
    const amount = String(saved.amount ?? "").trim();
    merged.push({ description, amount, weightKg, sizeCm, declaredValue });
  }
  return merged;
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
  const senderState = payloadValue(payload, ["sender", "state"], "");
  const senderPostal = payloadValue(payload, ["sender", "postal"], "");
  const senderCountry = payloadValue(payload, ["sender", "country"], "");
  const recipientStreet = payloadValue(payload, ["recipient", "street"], "");
  const recipientCity = payloadValue(payload, ["recipient", "city"], "");
  const recipientState = payloadValue(payload, ["recipient", "state"], "");
  const recipientPostal = payloadValue(payload, ["recipient", "postal"], "");
  const recipientCountry = payloadValue(payload, ["recipient", "country"], "");
  const addrPart = (v) => {
    const s = String(v ?? "").trim();
    return s && s !== "-" ? s : "";
  };
  let senderAddress =
    [addrPart(senderStreet), addrPart(senderCity), addrPart(senderState), addrPart(senderPostal), addrPart(senderCountry)]
      .filter(Boolean)
      .join(", ") || "-";
  if (senderAddress === "-") {
    senderAddress = String(booking.senderAddress || "").trim() || "-";
  }
  const recipientAddress =
    [
      addrPart(recipientStreet),
      addrPart(recipientCity),
      addrPart(recipientState),
      addrPart(recipientPostal),
      addrPart(recipientCountry)
    ]
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
  const rawLineItems = Array.isArray(inv?.lineItems) ? inv.lineItems : [];
  const mergedLineItems = mergeInvoiceLineItemsWithParcels(rawLineItems, payload);
  const normalizedLineItems = mergedLineItems
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const description = String(row.description ?? "").trim();
      const amount = String(row.amount ?? "").trim();
      const { weightKg: wNorm, sizeCm: sNorm } = normalizePdfLineWeightSize(
        row.weightKg,
        row.sizeCm
      );
      const weightKg = String(wNorm ?? "").trim();
      const sizeCm = String(sNorm ?? "").trim();
      const declaredValue = String(row.declaredValue ?? "").trim();
      if (!description && !amount && !weightKg && !sizeCm && !declaredValue) return null;
      const out = { description: description || "—", amount: amount ? String(amount).trim() : null };
      if (weightKg) out.weightKg = weightKg;
      if (sizeCm) out.sizeCm = sizeCm;
      if (declaredValue) out.declaredValue = declaredValue;
      return out;
    })
    .filter(Boolean);
  const lineItemsForPdf = normalizedLineItems.length ? normalizedLineItems : null;
  const adminInvoice =
    inv || lineItemsForPdf
      ? {
          number: inv ? String(inv.number ?? "").trim() || null : null,
          currency: inv
            ? String(inv.currency ?? "INR").trim().slice(0, 12) || "INR"
            : "INR",
          subtotal: inv ? String(inv.subtotal ?? "").trim() || null : null,
          tax: inv ? String(inv.tax ?? "").trim() || null : null,
          customsDuties: inv ? String(inv.customsDuties ?? "").trim() || null : null,
          insurancePremium: inv ? String(inv.insurancePremium ?? "").trim() || null : null,
          total: inv ? String(inv.total ?? "").trim() || null : null,
          insurance: inv ? String(inv.insurance ?? "").trim() || null : null,
          lineDescription: inv ? String(inv.lineDescription ?? "").trim() || null : null,
          notes: inv ? String(inv.notes ?? "").trim() || null : null,
          lineItems: lineItemsForPdf,
        }
      : null;
  const contentsBase = payloadValue(payload, ["shipment", "contentsDescription"], "-");
  const lineDesc = adminInvoice?.lineDescription ? String(adminInvoice.lineDescription).trim() : "";
  const contentsLabel =
    lineDesc && contentsBase !== "-"
      ? `${lineDesc} — ${contentsBase}`
      : lineDesc || contentsBase;
  const adminTotal = adminInvoice?.total ? String(adminInvoice.total).trim() : "";
  const lineTotalsFromInvoiceLines = normalizedLineItems.reduce((acc, row) => {
    if (!row || typeof row !== "object") return acc;
    const n = Number.parseFloat(String(row.amount ?? "").replace(/[^0-9.-]/g, ""));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
  const amountLabel =
    adminTotal ||
    (lineTotalsFromInvoiceLines > 0 ? lineTotalsFromInvoiceLines.toFixed(2) : "") ||
    payloadValue(payload, ["shipment", "declaredValue"], "-");
  const pdfUpdatedSource = booking.customerFacingUpdatedAt ?? booking.updatedAt ?? booking.createdAt;
  const pdfCacheKey = String(
    Math.floor(
      (pdfUpdatedSource instanceof Date
        ? pdfUpdatedSource.getTime()
        : new Date(pdfUpdatedSource).getTime()) / 1000,
    ) || 0,
  );

  return {
    ...parsedData,
    bookingDateLabel: safeDateLabel(booking.customerFacingCreatedAt ?? booking.createdAt),
    updatedAtLabel: safeDateLabel(
      booking.customerFacingUpdatedAt ?? booking.updatedAt ?? booking.createdAt
    ),
    pdfCacheKey,
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

/** Strip legacy one-cell “Shipment / Parcel 1 | Parcel 2 …” text so each PDF row stays short. */
function simplifyPdfLineDescription(desc, rowIndex) {
  let s = String(desc ?? "").trim();
  if (!s) return `Item ${rowIndex + 1}`;
  const segments = s.split(/\s*\|\s*(?=Parcel\s+\d+)/i);
  if (segments.length > 1) s = segments[0].trim();
  s = s.replace(/^Shipment\s+/i, "").trim();
  const pm = s.match(/^Parcel\s+\d+\s*[—–\-]\s*(.*)$/i);
  if (pm) {
    const rest = (pm[1] || "").trim();
    return (rest || `Item ${rowIndex + 1}`).slice(0, 160);
  }
  return s.slice(0, 160);
}

/** Shared field normalisation for invoice PDFs (server-rendered). */
function prepareInvoicePdfData(input) {
  const primary = normalizeHex(input.settings.primaryColor, "#0f766e");
  const accent = normalizeHex(input.settings.accentColor, "#16a34a");
  const card = normalizeHex(input.settings.cardColor, "#f8fafc");
  const ai = input.adminInvoice && typeof input.adminInvoice === "object" ? input.adminInvoice : null;
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
  const invoiceLineItems = Array.isArray(ai?.lineItems)
    ? ai.lineItems
        .map((row, rowIndex) => {
          if (!row || typeof row !== "object") return null;
          const description = String(row.description ?? "").trim();
          const amountRaw = row.amount;
          const amountStr =
            amountRaw != null && String(amountRaw).trim() !== "" ? String(amountRaw).trim() : "";
          const weightKgIn = String(row.weightKg ?? "").trim();
          const sizeCmIn = String(row.sizeCm ?? "").trim();
          const { weightKg, sizeCm } = normalizePdfLineWeightSize(weightKgIn, sizeCmIn);
          const declaredValue = String(row.declaredValue ?? "").trim();
          if (!description && !amountStr && !weightKg && !sizeCm && !declaredValue) return null;
          return {
            description: simplifyPdfLineDescription(description || "—", rowIndex),
            amount: amountStr,
            weightKg,
            sizeCm,
            declaredValue
          };
        })
        .filter(Boolean)
    : [];
  const lineTotalsSum = invoiceLineItems.reduce((acc, row) => {
    const n = Number.parseFloat(String(row.amount ?? "").replace(/[^0-9.-]/g, ""));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
  const adminTotalRaw = String(ai?.total ?? "").trim();
  const totalFigure =
    adminTotalRaw || (lineTotalsSum > 0 ? lineTotalsSum.toFixed(2) : "") || subtotal;
  const chargeTotalEnvio = `${currencyLabel} ${totalFigure}`.trim();
  const adminInvoiceInsurance = ai?.insurance ? String(ai.insurance).trim().slice(0, 4000) : "";
  const pdfMoneyBreakRow = (label, rawAmt) => {
    const s = String(rawAmt ?? "").trim();
    if (!s) return null;
    return {
      label,
      value: `${currencyLabel} ${s}`.trim().slice(0, 44)
    };
  };
  const invoiceBreakdownRows = [
    pdfMoneyBreakRow("Subtotal", ai?.subtotal),
    pdfMoneyBreakRow("Tax", ai?.tax),
    pdfMoneyBreakRow("Customs", ai?.customsDuties),
    pdfMoneyBreakRow("Insurance", ai?.insurancePremium)
  ].filter(Boolean);
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
    chargeTotalEnvio,
    currencyLabel,
    adminInvoiceNotes: ai?.notes ? String(ai.notes).trim() : "",
    adminInvoiceInsurance,
    invoiceBreakdownRows,
    invoiceLineItems
  };
}

/**
 * Compact invoice HTML for ISO A6 (105 mm × 148 mm) — matches tracking slip page size.
 */
function buildInvoiceA6PdfHtml(input, barcodeDataUrl) {
  const data = prepareInvoicePdfData(input);
  const p = data.settings.primary;
  const card = data.settings.card;
  const isInternational = String(data.routeTypeLabel || "")
    .toLowerCase()
    .includes("international");
  const stampText = isInternational ? "INT'L INVOICE" : "INVOICE";
  const routeShort = isInternational ? "International" : "Domestic";

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
        grid-template-columns: 1fr auto auto;
        gap: 5px;
        align-items: start;
      }
      .inv-stamp {
        background: ${p};
        color: #fff;
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 0.12em;
        padding: 4px 6px;
        border-radius: 4px;
        text-align: center;
        line-height: 1.2;
        white-space: nowrap;
        align-self: start;
      }
      .brand-lockup img { display: block; height: 38px; width: auto; max-width: 100%; object-fit: contain; }
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
      .inv-detail {
        margin-top: 3px;
        font-size: 6px;
        line-height: 1.35;
        color: #374151;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        padding: 3px 5px;
        background: #fafafa;
        word-break: break-word;
      }
      .inv-detail strong { color: ${p}; font-size: 6.5px; display: block; margin-bottom: 2px; }
      .inv-detail-body, .note-body {
        font-size: 6px;
        line-height: 1.35;
        color: #334155;
        word-break: break-word;
        white-space: normal;
      }
      .lines {
        margin-top: 3px;
        font-size: 6.5px;
        line-height: 1.3;
        color: #1f2937;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        padding: 3px 4px;
        background: #fafafa;
      }
      .sum-grid {
        margin-top: 3px;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        overflow: hidden;
        font-size: 6px;
        background: #fafafa;
      }
      .sum-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 6px;
        padding: 2px 5px;
        border-bottom: 1px solid #e5e7eb;
        color: #334155;
      }
      .sum-row:last-child { border-bottom: none; }
      .sum-row strong {
        font-size: 6px;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
      }
      .line-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        font-size: 6px;
        margin-top: 2px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }
      .line-table col.c-idx { width: 6%; }
      .line-table col.c-item { width: 36%; }
      .line-table col.c-wt { width: 11%; }
      .line-table col.c-sz { width: 24%; }
      .line-table col.c-amt { width: 13%; }
      .line-table thead th {
        color: ${p};
        font-weight: 700;
        font-size: 5.5px;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        background: #f1f5f9;
        border-bottom: 1px solid ${p};
        padding: 4px 3px;
        vertical-align: middle;
      }
      .line-table tbody td {
        border-bottom: 1px solid #e5e7eb;
        padding: 4px 3px;
        vertical-align: top;
        word-wrap: break-word;
        overflow-wrap: anywhere;
        word-break: break-word;
        hyphens: auto;
      }
      .line-table tbody tr:last-child td { border-bottom: none; }
      .line-table th.idx,
      .line-table td.idx {
        text-align: center;
        color: #64748b;
        font-weight: 600;
      }
      .line-table th.item,
      .line-table td.item { text-align: left; }
      .line-table th.wt,
      .line-table td.wt {
        text-align: center;
        font-size: 5.5px;
        color: #334155;
      }
      .line-table th.sz,
      .line-table td.sz {
        text-align: center;
        font-size: 5.5px;
        color: #475569;
      }
      .line-table th.amt,
      .line-table td.amt {
        text-align: right;
        font-size: 5.5px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .line-table .item-main { font-weight: 600; color: #111827; font-size: 6px; }
      .total-bar {
        margin-top: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        background: ${p};
        color: #fff;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 7px;
        font-weight: 800;
      }
      .total-bar strong { font-size: 8px; font-weight: 800; letter-spacing: 0.02em; }
      .note {
        margin-top: 3px;
        font-size: 6px;
        line-height: 1.3;
        color: #64748b;
        max-height: 14mm;
        overflow: hidden;
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
          <div class="inv-stamp" aria-hidden="true">${esc(stampText)}</div>
          <div class="co-meta">${esc(
            [data.settings.companyAddress, data.settings.supportPhone, data.settings.supportEmail]
              .map((x) => String(x ?? "").trim())
              .filter(Boolean)
              .join(" · ")
              .slice(0, 200) || "—"
          )}</div>
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
        Booked ${esc(data.bookingDateLabel)} ·
        <strong>${esc(routeShort)}</strong> ·
        Currency <strong>${esc(data.currencyLabel)}</strong> ·
        Updated ${esc(data.updatedAtLabel)}
      </div>

      <section class="people">
        <div class="person">
          <h4>Bill from</h4>
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

      ${
        data.invoiceLineItems && data.invoiceLineItems.length
          ? `<div class="lines">
<table class="line-table">
<colgroup>
  <col class="c-idx" />
  <col class="c-item" />
  <col class="c-wt" />
  <col class="c-sz" />
  <col class="c-amt" />
</colgroup>
<thead><tr>
<th class="idx">#</th>
<th class="item">Item</th>
<th class="wt">Wt (kg)</th>
<th class="sz">Size (cm)</th>
<th class="amt">Amt</th>
</tr></thead>
<tbody>${data.invoiceLineItems
              .map((row, idx) => {
                const mainLine = esc(String(row.description || "—")).slice(0, 120);
                const rawAmt = String(row.amount ?? "").trim();
                const am =
                  rawAmt !== ""
                    ? esc(`${data.currencyLabel} ${rawAmt}`.slice(0, 28))
                    : "—";
                const wt = row.weightKg ? esc(String(row.weightKg).slice(0, 14)) : "—";
                const sz = row.sizeCm ? esc(String(row.sizeCm).slice(0, 40)) : "—";
                return `<tr>
<td class="idx">${idx + 1}</td>
<td class="item"><span class="item-main">${mainLine}</span></td>
<td class="wt">${wt}</td>
<td class="sz">${sz}</td>
<td class="amt">${am}</td>
</tr>`;
              })
              .join("")}</tbody></table></div>`
          : ""
      }
      ${
        data.adminInvoice && String(data.adminInvoice.lineDescription || "").trim()
          ? `<div class="inv-detail"><strong>Service description</strong><div class="inv-detail-body">${escHtmlLines(data.adminInvoice.lineDescription, 4000)}</div></div>`
          : ""
      }
      ${
        data.invoiceBreakdownRows && data.invoiceBreakdownRows.length
          ? `<div class="sum-grid">${data.invoiceBreakdownRows
              .map(
                (r) =>
                  `<div class="sum-row"><span>${esc(r.label)}</span><strong>${esc(r.value)}</strong></div>`
              )
              .join("")}</div>`
          : ""
      }
      ${
        data.adminInvoiceInsurance
          ? `<div class="inv-detail"><strong>Insurance details</strong><div class="inv-detail-body">${escHtmlLines(data.adminInvoiceInsurance, 4000)}</div></div>`
          : ""
      }

      <div class="total-bar">
        <span>TOTAL</span>
        <strong>${esc(data.chargeTotalEnvio)}</strong>
      </div>

      ${
        data.adminInvoiceNotes
          ? `<div class="note"><strong>Note</strong><div class="note-body">${escHtmlLines(data.adminInvoiceNotes, 2000)}</div></div>`
          : ""
      }

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
        min-height: 38px;
      }
      .brand-lockup img {
        display: block;
        height: 38px;
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
      const n = String(courier?.name ?? "").trim();
      courierName = n || "Pickup courier";
    }
    const { agencyName, agencyCity } = await resolveAssignedAgencyForPublicTrack(
      db,
      row.assignedAgency
    );
    const { fromCity, toCity, senderCountry, recipientCountry } = resolveTrackRouteCities(
      row.payload
    );
    const domesticMainHubCity = siteNorm.domesticMainHubCity || "Quadrato Cargo";
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
        /** City label for hub / linehaul on Track (not street address). */
        agencyCity,
        /** Network main hub for domestic linehaul copy (site setting). */
        domesticMainHubCity,
        fromCity,
        toCity,
        senderCountry,
        recipientCountry,
        senderName: row.senderName || null,
        senderAddress: row.senderAddress || null,
        recipientName: row.recipientName || null,
        recipientAddress: row.recipientAddress || null,
        createdAt: row.customerFacingCreatedAt ?? row.createdAt,
        updatedAt: row.customerFacingUpdatedAt ?? row.updatedAt ?? row.createdAt,
        shipment: buildShipmentSummaryForPublicTrack(row.payload),
        publicTimelineOverrides: row.publicTimelineOverrides ?? null,
        publicTimelineStepVisibility: row.publicTimelineStepVisibility ?? null,
        estimatedDeliveryAt: row.estimatedDeliveryAt ?? null,
        publicTimelineStatusPath: row.publicTimelineStatusPath ?? null,
        internationalAgencyStage: row.internationalAgencyStage ?? null
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
    const cacheKey = String(input.pdfCacheKey || "0").replace(/[^0-9]/g, "") || "0";
    const pdfKind = isTrackingTemplate ? "tracking" : "invoice";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (!isTrackingTemplate) {
      res.setHeader("X-QC-Invoice-Template", "2026-04-v2");
    }
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfKind}-${filenameSafeRef || input.bookingId}-v${cacheKey}.pdf"`
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
