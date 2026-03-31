import { z } from "zod";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { toPublicUser } from "../models/user.model.js";
import {
  listBookingsByAgency,
  updateBookingByAgency,
  verifyAgencyHandoverOtp
} from "../modules/bookings/booking-repo.js";
import { updateAgencyPartnerProfile } from "../modules/users/user-repo.js";
import { objectIdStringSchema } from "../shared/zod-helpers.js";

const ALLOWED_AGENCY_STATUSES = [
  "agency_processing",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "on_hold",
  "delivered"
];

export function requireAgency(req, res, next) {
  const role = String(req.auth?.user?.role ?? "");
  if (role !== "agency") {
    return sendError(res, "Agency access only.", 403);
  }
  return next();
}

const agencyReferenceSchema = z
  .string()
  .trim()
  .min(4)
  .max(40)
  .regex(/^[a-zA-Z0-9-]+$/);

const agencyVerifyHandoverSchema = z.object({
  reference: agencyReferenceSchema,
  otpCode: z.string().trim().regex(/^\d{6}$/, "OTP must be exactly 6 digits.")
});

const agencyUpdateBookingSchema = z.object({
  status: z.string().refine((s) => ALLOWED_AGENCY_STATUSES.includes(s), {
    message: "Invalid status for agency update."
  }),
  publicTrackingNote: z.string().trim().max(2000).optional(),
  trackingNotes: z.string().trim().max(2000).optional()
});

const agencyProfilePatchSchema = z.object({
  name: z.string().trim().max(120).optional(),
  agencyAddress: z.string().trim().max(500).optional(),
  agencyPhone: z.string().trim().max(40).optional()
});

export async function listMyAgencyBookings(req, res, next) {
  try {
    const rows = await listBookingsByAgency(req.auth.user);
    return sendOk(res, { bookings: rows });
  } catch (error) {
    return next(error);
  }
}

export async function verifyAgencyHandover(req, res, next) {
  try {
    const parsed = agencyVerifyHandoverSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid request.";
      return sendError(res, msg);
    }
    const { reference, otpCode } = parsed.data;
    const result = await verifyAgencyHandoverOtp(req.auth.user, reference, otpCode);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return sendNotFound(res, "Booking not found for this agency.");
      }
      if (result.reason === "handover_not_ready") {
        return sendError(
          res,
          "Agency handover is not ready yet. Courier must verify pickup OTP first."
        );
      }
      if (result.reason === "expired") {
        return sendError(res, "Agency handover OTP expired.");
      }
      return sendError(res, "Invalid agency handover OTP.");
    }
    return sendOk(res, {
      message: result.alreadyVerified
        ? "Agency handover already verified."
        : "Agency handover verified. Agency processing started.",
      booking: result.booking
    });
  } catch (error) {
    return next(error);
  }
}

export async function patchAgencyProfile(req, res, next) {
  try {
    const parsed = agencyProfilePatchSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message ?? "Invalid profile.");
    }
    const { name, agencyAddress, agencyPhone } = parsed.data;
    const hasField =
      name !== undefined || agencyAddress !== undefined || agencyPhone !== undefined;
    if (!hasField) {
      return sendError(res, "Send at least one field to update.");
    }
    if (name !== undefined && String(name).trim() && String(name).trim().length < 8) {
      return sendError(res, "Name must be at least 8 characters when provided.");
    }
    const updated = await updateAgencyPartnerProfile(req.auth.user.id, {
      name,
      agencyAddress,
      agencyPhone
    });
    if (!updated) {
      return sendError(res, "Could not update agency profile.", 400);
    }
    return sendOk(res, {
      message: "Agency profile saved.",
      user: toPublicUser(updated)
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyAgencyBooking(req, res, next) {
  try {
    const idParsed = objectIdStringSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return sendError(res, idParsed.error.issues[0]?.message ?? "Invalid booking id.");
    }

    const parsed = agencyUpdateBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid agency update.";
      return sendError(res, msg);
    }

    const publicNote =
      parsed.data.publicTrackingNote !== undefined
        ? parsed.data.publicTrackingNote
        : parsed.data.trackingNotes;

    const row = await updateBookingByAgency(req.auth.user, idParsed.data, {
      status: parsed.data.status,
      publicTrackingNote: publicNote
    });
    if (!row) {
      return sendNotFound(res, "Booking not found for this agency.");
    }
    return sendOk(res, { message: "Agency update saved.", booking: row });
  } catch (error) {
    return next(error);
  }
}
