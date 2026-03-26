import { ObjectId } from "mongodb";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { getDb } from "../db/mongo.js";
import {
  findBookingByCourierAndId,
  listBookingsByCourierId,
  startCourierJob,
  verifyPickupOtpByCourier
} from "../modules/bookings/booking-repo.js";
import { updateUserDutyStatus } from "../modules/users/user-repo.js";

const COURIER_OPEN_STATUSES = [
  "submitted",
  "confirmed",
  "serviceability_check",
  "serviceable",
  "pickup_scheduled",
  "out_for_pickup"
];

export function requireCourier(req, res, next) {
  const role = String(req.auth?.user?.role ?? "");
  if (role !== "courier") {
    return sendError(res, "Courier access only.", 403);
  }
  return next();
}

export async function listMyCourierBookings(req, res, next) {
  try {
    const rows = await listBookingsByCourierId(req.auth.user.id);
    return sendOk(res, { bookings: rows });
  } catch (error) {
    return next(error);
  }
}

export async function getMyCourierBookingById(req, res, next) {
  try {
    const row = await findBookingByCourierAndId(req.auth.user.id, req.params.id);
    if (!row) {
      return sendNotFound(res, "Booking not found.");
    }
    return sendOk(res, { booking: row });
  } catch (error) {
    return next(error);
  }
}

export async function getCourierStatus(req, res, next) {
  try {
    const db = await getDb();
    const courierId = req.auth.user.id;
    if (!ObjectId.isValid(courierId)) {
      return sendNotFound(res, "Courier account not found.");
    }
    const openJobCount = await db.collection("bookings").countDocuments({
      courierId: new ObjectId(courierId),
      status: { $in: COURIER_OPEN_STATUSES }
    });
    return sendOk(res, {
      courier: {
        id: courierId,
        isOnDuty: req.auth.user.isOnDuty !== false,
        isActive: req.auth.user.isActive !== false,
        openJobCount,
        readyForJob:
          req.auth.user.isActive !== false &&
          req.auth.user.isOnDuty !== false &&
          openJobCount === 0
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateCourierStatus(req, res, next) {
  try {
    const isOnDuty = req.body?.isOnDuty === true;
    const updated = await updateUserDutyStatus(req.auth.user.id, isOnDuty);
    if (!updated) {
      return sendNotFound(res, "Courier account not found.");
    }
    return sendOk(res, {
      message: isOnDuty ? "Courier set to on duty." : "Courier set to off duty.",
      courier: {
        id: req.auth.user.id,
        isOnDuty: updated.isOnDuty !== false,
        isActive: updated.isActive !== false
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyMyPickupOtp(req, res, next) {
  try {
    const otpCode = String(req.body?.otpCode ?? "").trim();
    if (!otpCode) {
      return sendError(res, "Pickup OTP is required.");
    }
    const result = await verifyPickupOtpByCourier(req.auth.user.id, req.params.id, otpCode);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return sendNotFound(res, "Booking not found.");
      }
      if (result.reason === "handover_done") {
        return sendError(
          res,
          "Courier updates are locked. Booking is already handed over to agency.",
        );
      }
      if (result.reason === "expired") {
        return sendError(res, "Pickup OTP has expired.");
      }
      return sendError(res, "Invalid pickup OTP.");
    }
    return sendOk(res, {
      message: result.alreadyVerified
        ? "Pickup OTP already verified for this booking."
        : "Pickup OTP verified. Status updated to picked up.",
      agencyHandoverOtp: result.booking?.agencyHandoverOtpCode ?? null,
      agencyHandoverOtpExpiresAt: result.booking?.agencyHandoverOtpExpiresAt ?? null,
      booking: result.booking
    });
  } catch (error) {
    return next(error);
  }
}

export async function startMyCourierJob(req, res, next) {
  try {
    const result = await startCourierJob(req.auth.user.id, req.params.id);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return sendNotFound(res, "Booking not found.");
      }
      return sendError(res, "Cannot start this job in current booking stage.");
    }
    return sendOk(res, {
      message: result.alreadyStarted
        ? "Job already started for this booking."
        : "Job started. Status updated to out for pickup.",
      booking: result.booking
    });
  } catch (error) {
    return next(error);
  }
}
