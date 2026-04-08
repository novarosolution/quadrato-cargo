import { z } from "zod";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { toPublicUser } from "../models/user.model.js";
import {
  listBookingsByAgency,
  patchAgencyBookingTimelineOverrides,
  updateBookingByAgency,
  verifyAgencyHandoverOtp
} from "../modules/bookings/booking-repo.js";
import { findUsersByIds, updateAgencyPartnerProfile } from "../modules/users/user-repo.js";
import { timelineOverridesBodySchema } from "../shared/timeline-overrides-zod.js";
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
  trackingNotes: z.string().trim().max(2000).optional(),
  /** International: 0–11 = fixed Track card; null clears override (auto from status). Omit = unchanged. */
  internationalAgencyStage: z.number().int().min(0).max(11).nullable().optional()
});

const agencyProfilePatchSchema = z.object({
  name: z.string().trim().max(120).optional(),
  agencyAddress: z.string().trim().max(500).optional(),
  agencyPhone: z.string().trim().max(40).optional(),
  /** Shown on public tracking only (city); full street stays off customer Track. */
  agencyCity: z.string().trim().max(80).optional()
});

/** Resolve pickup courier display name for agency surfaces (name, else login email). */
async function attachCourierNamesToPublicBookings(bookings = []) {
  if (!bookings.length) return bookings;
  const ids = [
    ...new Set(
      bookings
        .map((b) => String(b?.courierId ?? "").trim())
        .filter(Boolean)
    )
  ];
  if (ids.length === 0) {
    return bookings.map((b) => ({ ...b, courierName: null }));
  }
  const couriers = await findUsersByIds(ids);
  const map = new Map(
    couriers.map((c) => {
      const name = String(c?.name ?? "").trim();
      const email = String(c?.email ?? "").trim();
      const label = name || email || null;
      return [String(c._id), label];
    })
  );
  return bookings.map((b) => ({
    ...b,
    courierName: b.courierId ? map.get(String(b.courierId)) ?? null : null
  }));
}

export async function listMyAgencyBookings(req, res, next) {
  try {
    const rows = await listBookingsByAgency(req.auth.user);
    const withNames = await attachCourierNamesToPublicBookings(rows);
    return sendOk(res, { bookings: withNames });
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
    const [booking] = await attachCourierNamesToPublicBookings([result.booking]);
    return sendOk(res, {
      message: result.alreadyVerified
        ? "Agency handover already verified."
        : "Agency handover verified. Agency processing started.",
      booking
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
    const { name, agencyAddress, agencyPhone, agencyCity } = parsed.data;
    const hasField =
      name !== undefined ||
      agencyAddress !== undefined ||
      agencyPhone !== undefined ||
      agencyCity !== undefined;
    if (!hasField) {
      return sendError(res, "Send at least one field to update.");
    }
    if (name !== undefined && String(name).trim() && String(name).trim().length < 8) {
      return sendError(res, "Name must be at least 8 characters when provided.");
    }
    const updated = await updateAgencyPartnerProfile(req.auth.user.id, {
      name,
      agencyAddress,
      agencyPhone,
      agencyCity
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
      publicTrackingNote: publicNote,
      internationalAgencyStage: parsed.data.internationalAgencyStage
    });
    if (!row) {
      return sendNotFound(res, "Booking not found for this agency.");
    }
    const [booking] = await attachCourierNamesToPublicBookings([row]);
    return sendOk(res, { message: "Agency update saved.", booking });
  } catch (error) {
    return next(error);
  }
}

export async function patchAgencyBookingTimeline(req, res, next) {
  try {
    const idParsed = objectIdStringSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return sendError(res, idParsed.error.issues[0]?.message ?? "Invalid booking id.");
    }
    const parsed = timelineOverridesBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendError(res, "Invalid timeline overrides payload.", 400);
    }
    if (parsed.data.domestic === undefined && parsed.data.international === undefined) {
      return sendError(res, "Send timeline step data (domestic or international).", 400);
    }
    const row = await patchAgencyBookingTimelineOverrides(req.auth.user, idParsed.data, {
      domestic: parsed.data.domestic,
      international: parsed.data.international
    });
    if (!row) {
      return sendNotFound(res, "Booking not found for this agency.");
    }
    const [booking] = await attachCourierNamesToPublicBookings([row]);
    return sendOk(res, { message: "Customer timeline saved.", booking });
  } catch (error) {
    return next(error);
  }
}
