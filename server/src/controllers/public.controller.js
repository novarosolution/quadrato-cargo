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
  findBookingByReference
} from "../modules/bookings/booking-repo.js";
import { createContactSubmission } from "../modules/contacts/contact-repo.js";
import { verifyAuthToken } from "../modules/auth/token.js";

const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  service: z.string().trim().min(1),
  message: z.string().trim().min(1)
});

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
  trackUrl: z.string().trim().min(1),
  settings: z.object({
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

function buildCustomerCode(reference, bookingId) {
  const seed = String(bookingId || reference || "").trim() || "0";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 10000000000;
  }
  return `QC${String(hash).padStart(10, "0")}`;
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

function buildPdfHtml(input, qrDataUrl, barcodeDataUrl) {
  const primary = normalizeHex(input.settings.primaryColor, "#0f766e");
  const accent = normalizeHex(input.settings.accentColor, "#16a34a");
  const card = normalizeHex(input.settings.cardColor, "#f8fafc");
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
  const customerCode = buildCustomerCode(safeReference, input.bookingId);
  const subtotal = Number.isFinite(amountNumber) ? amountNumber.toFixed(2) : amount;
  const declaredTotal = Number.isFinite(amountNumber) ? (amountNumber * 1.03).toFixed(2) : amount;
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
    customerCode
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
          <div class="code">${esc(data.safeReference)}</div>
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
          <tr><td>Invoice #</td><td><strong>${esc(data.customerCode)}</strong></td></tr>
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
            <td>0</td>
            <td>${esc(data.fixedCharge)}</td>
            <td>1</td>
            <td>0</td>
            <td>${esc(data.declaredTotal)}</td>
            <td>${esc(data.declaredValue)}</td>
            <td>INR ${esc(data.subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div class="terms-title">TERMS</div>
      <div class="terms-text">
        ACCEPTED: The sender declares that shipment details are accurate and no prohibited items are included. In case of customs checks, the client is responsible for duties and supporting documents. Courier transit timelines may vary by route, service mode, and destination compliance checks.
      </div>

      <section style="display:none">
        <div class="qr">
          <img src="${esc(qrDataUrl)}" alt="Tracking QR" />
          <div class="caption">SCAN TO TRACK</div>
        </div>
      </section>

      <div class="footer">${esc(data.settings.footerNote)}</div>
    </div>
  </body>
</html>`;
}

function buildTrackingPdfHtml(input, qrDataUrl, barcodeDataUrl) {
  const primary = normalizeHex(input.settings.primaryColor, "#0f766e");
  const safeReference = String(input.reference || input.bookingId || "").trim() || input.bookingId;
  const customerCode = buildCustomerCode(safeReference, input.bookingId);
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
        <div class="barcode-id">${esc(customerCode)}</div>
      </div>
      <div class="code-big">${esc(customerCode)}</div>

      <div class="package-ref">PACKAGE REFERENCE:</div>
      <div class="line">
        Date: ${esc(input.bookingDateLabel)} | Amount: ${esc(input.amountLabel)} | Weight: ${esc(input.weightLabel)} | Cost: ${esc(input.amountLabel)}
      </div>
      <div class="line">
        Dimensions: ${esc(input.dimensionsLabel)}
      </div>

      <div class="service">
        <strong>SERVICE REFERENCE</strong> ${esc(input.statusLabel)} | ${esc(input.agencyLabel)}
      </div>

      <div class="pay-wrap">
        <div class="pay-title">Payment status</div>
        <span class="badge">Paid</span>
      </div>

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
    const routeType = String(req.body?.routeType ?? "").trim();
    const bookingPayload = req.body?.bookingPayload;
    if (!bookingPayload || typeof bookingPayload !== "object") {
      return sendError(res, "Invalid booking request.", 400, {
        fieldErrors: { routeType: "Please fill the booking form correctly." }
      });
    }
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
    const row = await findBookingByReference(req.params.reference ?? "");
    if (!row) {
      return sendNotFound(res, "Tracking not found.");
    }
    return sendOk(res, {
      tracking: {
        id: row.id,
        routeType: row.routeType,
        status: row.status,
        consignmentNumber: row.consignmentNumber,
        trackingNotes: row.trackingNotes,
        createdAt: row.createdAt
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
  let browser;
  try {
    const parsed = pdfRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid PDF data payload.", 400);
    }

    const safeTrackUrl = String(parsed.data.trackUrl || "").trim();
    const qrDataUrl = await QRCode.toDataURL(safeTrackUrl || "https://quadratocargo.com", {
      margin: 1,
      width: 220,
      color: {
        dark: normalizeHex(parsed.data.settings.primaryColor, "#0f766e"),
        light: "#ffffff"
      }
    });
    const barcodePng = await bwipjs.toBuffer({
      bcid: "code128",
      text: String(parsed.data.reference || parsed.data.bookingId || "QC-INVOICE"),
      scale: 3,
      height: 16,
      includetext: false,
      backgroundcolor: "FFFFFF"
    });
    const barcodeDataUrl = `data:image/png;base64,${barcodePng.toString("base64")}`;
    const html =
      parsed.data.template === "tracking"
        ? buildTrackingPdfHtml(parsed.data, qrDataUrl, barcodeDataUrl)
        : buildPdfHtml(parsed.data, qrDataUrl, barcodeDataUrl);

    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
    });

    const filenameSafeRef = parsed.data.reference.replace(/[^a-zA-Z0-9-_]/g, "-");
    const pdfBinary = Buffer.from(pdfBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="courier-details-${filenameSafeRef || parsed.data.bookingId}.pdf"`
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
    return next(error);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
