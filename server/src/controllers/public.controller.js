import { z } from "zod";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
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
  bookingId: z.string().trim().min(1),
  bookingDateLabel: z.string().trim().default(""),
  updatedAtLabel: z.string().trim().default(""),
  statusLabel: z.string().trim().default(""),
  reference: z.string().trim().default(""),
  routeTypeLabel: z.string().trim().default(""),
  consignmentNumber: z.string().trim().default(""),
  fromCity: z.string().trim().default(""),
  toCity: z.string().trim().default(""),
  senderName: z.string().trim().default(""),
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

function buildPdfHtml(input, qrDataUrl) {
  const primary = normalizeHex(input.settings.primaryColor, "#0f766e");
  const accent = normalizeHex(input.settings.accentColor, "#16a34a");
  const card = normalizeHex(input.settings.cardColor, "#f8fafc");
  const data = {
    ...input,
    settings: {
      ...input.settings,
      primary,
      accent,
      card
    }
  };

  const row = (label, value) => `
    <div class="cell">
      <div class="label">${esc(label)}</div>
      <div class="value">${esc(value)}</div>
    </div>
  `;

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
        padding: 24px;
      }
      .header {
        display: grid;
        grid-template-columns: 1fr 150px;
        gap: 16px;
        align-items: start;
      }
      .brand {
        border-radius: 18px;
        padding: 18px 20px;
        background: linear-gradient(135deg, ${data.settings.primary}, #0b5f58);
        color: #fff;
        position: relative;
        overflow: hidden;
      }
      .brand::after {
        content: "${esc(data.settings.watermarkText)}";
        position: absolute;
        right: 14px;
        bottom: 6px;
        font-size: 14px;
        opacity: .15;
        letter-spacing: .5px;
      }
      .logo-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        height: 26px;
        border-radius: 8px;
        background: rgba(255,255,255,.18);
        border: 1px solid rgba(255,255,255,.35);
        font-weight: 700;
        margin-bottom: 10px;
        padding: 0 10px;
      }
      .company { font-size: 42px; line-height: 1; font-family: "Times New Roman", serif; margin: 0; }
      .subtitle { margin-top: 4px; font-size: 18px; color: #fef3c7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .address { margin-top: 6px; font-size: 13px; opacity: .95; }
      .ref { margin-top: 10px; font-size: 26px; font-weight: 700; }
      .chips { margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap; }
      .chip {
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .2px;
        background: #fff;
        color: ${data.settings.primary};
      }
      .qr {
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        background: #fff;
        padding: 12px;
        text-align: center;
        box-shadow: 0 10px 20px rgba(2,6,23,.08);
      }
      .qr img { width: 120px; height: 120px; display: block; margin: 0 auto; }
      .qr .caption { margin-top: 8px; font-weight: 700; color: #334155; }
      .card {
        margin-top: 18px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        background: ${data.settings.card};
        padding: 18px;
      }
      .card h2 {
        margin: 0 0 12px;
        font-size: 24px;
        color: #0f172a;
      }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
      .cell .label {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: .4px;
        margin-bottom: 4px;
      }
      .cell .value {
        font-size: 17px;
        line-height: 1.35;
        color: #0f172a;
        word-break: break-word;
      }
      .full { grid-column: 1 / -1; }
      .muted { color: #334155; }
      .support {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        font-size: 14px;
        color: #334155;
      }
      .footer {
        margin-top: 18px;
        text-align: center;
        font-size: 13px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="header">
        <div class="brand">
          <div class="logo-chip">${esc(data.settings.logoText)}</div>
          <h1 class="company">${esc(data.settings.companyName)}</h1>
          <div class="subtitle">${esc(data.settings.headerSubtitle)}</div>
          <div class="address">${esc(data.settings.companyAddress)}</div>
          <div class="ref">Reference: ${esc(data.reference)}</div>
          <div class="chips">
            <div class="chip">Status ${esc(data.statusLabel)}</div>
            <div class="chip">Route ${esc(data.routeTypeLabel)}</div>
          </div>
        </div>
        <div class="qr">
          <img src="${esc(qrDataUrl)}" alt="Tracking QR" />
          <div class="caption">SCAN TO TRACK</div>
        </div>
      </section>

      <section class="card">
        <h2>Shipment Summary</h2>
        <div class="grid">
          ${row("Booked At", data.bookingDateLabel)}
          ${row("Last Update", data.updatedAtLabel)}
          ${row("Status", data.statusLabel)}
          ${row("Route", data.routeTypeLabel)}
          ${row("From City", data.fromCity)}
          ${row("To City", data.toCity)}
          ${row("Sender", data.senderName)}
          ${row("Recipient", data.recipientName)}
          ${row("Agency", data.agencyLabel)}
          ${row("Declared Value", data.amountLabel)}
        </div>
      </section>

      <section class="card">
        <h2>Parcel & Tracking</h2>
        <div class="grid">
          ${row("Weight", data.weightLabel)}
          ${row("Dimensions", data.dimensionsLabel)}
          ${row("Consignment No", data.consignmentNumber)}
          ${row("Booking ID", data.bookingId)}
          <div class="cell full">
            <div class="label">Contents</div>
            <div class="value">${esc(data.contentsLabel)}</div>
          </div>
          <div class="cell full">
            <div class="label">Instructions</div>
            <div class="value">${esc(data.instructionsLabel)}</div>
          </div>
          <div class="cell full">
            <div class="label">Dispatch Notes</div>
            <div class="value">${esc(data.trackingNotesLabel)}</div>
          </div>
          <div class="cell full">
            <div class="label">Tracking URL</div>
            <div class="value muted">${esc(data.trackUrl)}</div>
          </div>
        </div>
        <div class="support">
          <strong>Support:</strong> ${esc(data.settings.supportEmail)} | ${esc(data.settings.supportPhone)} | ${esc(data.settings.website)}
        </div>
      </section>

      <div class="footer">${esc(data.settings.footerNote)}</div>
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
    const html = buildPdfHtml(parsed.data, qrDataUrl);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
    });

    const filenameSafeRef = parsed.data.reference.replace(/[^a-zA-Z0-9-_]/g, "-");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="courier-details-${filenameSafeRef || parsed.data.bookingId}.pdf"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return sendError(res, "Invalid PDF data payload.", 400);
    }
    return next(error);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
