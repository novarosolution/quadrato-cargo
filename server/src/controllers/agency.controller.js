import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import {
  listBookingsByAgency,
  updateBookingByAgency,
  verifyAgencyHandoverOtp
} from "../modules/bookings/booking-repo.js";

const ALLOWED_AGENCY_STATUSES = new Set([
  "agency_processing",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "on_hold",
  "delivered"
]);

export function requireAgency(req, res, next) {
  const role = String(req.auth?.user?.role ?? "");
  if (role !== "agency") {
    return sendError(res, "Agency access only.", 403);
  }
  return next();
}

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
    const reference = String(req.body?.reference ?? "").trim();
    const otpCode = String(req.body?.otpCode ?? "").trim();
    if (!reference || !otpCode) {
      return sendError(res, "Reference and OTP are required.");
    }
    const result = await verifyAgencyHandoverOtp(req.auth.user, reference, otpCode);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return sendNotFound(res, "Booking not found for this agency.");
      }
      if (result.reason === "handover_not_ready") {
        return sendError(
          res,
          "Agency handover is not ready yet. Courier must verify pickup OTP first.",
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

export async function updateMyAgencyBooking(req, res, next) {
  try {
    const status = String(req.body?.status ?? "").trim();
    if (!ALLOWED_AGENCY_STATUSES.has(status)) {
      return sendError(res, "Invalid status for agency update.");
    }
    const row = await updateBookingByAgency(req.auth.user, req.params.id, {
      status,
      publicTrackingNote: req.body?.publicTrackingNote ?? req.body?.trackingNotes
    });
    if (!row) {
      return sendNotFound(res, "Booking not found for this agency.");
    }
    return sendOk(res, { message: "Agency update saved.", booking: row });
  } catch (error) {
    return next(error);
  }
}
