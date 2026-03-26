import { z } from "zod";
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
