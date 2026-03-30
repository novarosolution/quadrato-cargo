import { z } from "zod";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { env } from "../config/env.js";
import { getDb } from "../db/mongo.js";
import {
  normalizeSiteSettings,
  publicTrackUiFromSettings
} from "../models/site-settings.model.js";
import {
  createBooking,
  findBookingByReference
} from "../modules/bookings/booking-repo.js";
import { createContactSubmission } from "../modules/contacts/contact-repo.js";
import { verifyAuthToken } from "../modules/auth/token.js";
import { findUserById } from "../modules/users/user-repo.js";
import { computePublicBarcodeCode } from "../shared/public-barcode-code.js";

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

const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  service: z.string().trim().min(1),
  message: z.string().trim().min(1)
});

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
    return sendOk(res, {
      trackUi,
      tracking: {
        id: row.id,
        routeType: row.routeType,
        status: row.status,
        consignmentNumber: row.consignmentNumber,
        publicBarcodeCode: row.publicBarcodeCode || computePublicBarcodeCode(row.id),
        trackingNotes: row.trackingNotes ?? null,
        publicTrackingNote: row.publicTrackingNote ?? null,
        customerTrackingNote: row.customerTrackingNote ?? null,
        courierName,
        agencyName: row.assignedAgency || null,
        senderName: row.senderName || null,
        senderAddress: row.senderAddress || null,
        recipientName: row.recipientName || null,
        recipientAddress: row.recipientAddress || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt ?? row.createdAt,
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
