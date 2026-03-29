import { ObjectId } from "mongodb";
import { z } from "zod";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { getDb } from "../db/mongo.js";
import {
  findBookingByCourierAndId,
  listBookingsByCourierId,
  startCourierJob,
  verifyPickupOtpByCourier
} from "../modules/bookings/booking-repo.js";
import { updateUserDutyStatus } from "../modules/users/user-repo.js";
import { objectIdStringSchema } from "../shared/zod-helpers.js";

const COURIER_OPEN_STATUSES = [
  "submitted",
  "confirmed",
  "serviceability_check",
  "serviceable",
  "pickup_scheduled",
  "out_for_pickup"
];

const courierDutySchema = z.object({
  isOnDuty: z.boolean({
    invalid_type_error: "isOnDuty must be true or false (JSON boolean)."
  })
});

const courierPickupOtpSchema = z.object({
  otpCode: z.string().trim().regex(/^\d{6}$/, "Pickup OTP must be exactly 6 digits.")
});

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
    const idParsed = objectIdStringSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return sendError(res, idParsed.error.issues[0]?.message ?? "Invalid booking id.");
    }
    const row = await findBookingByCourierAndId(req.auth.user.id, idParsed.data);
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
    const parsed = courierDutySchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid duty status.";
      return sendError(res, msg);
    }
    const { isOnDuty } = parsed.data;
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
    const idParsed = objectIdStringSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return sendError(res, idParsed.error.issues[0]?.message ?? "Invalid booking id.");
    }
    const parsed = courierPickupOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid pickup OTP.";
      return sendError(res, msg);
    }
    const result = await verifyPickupOtpByCourier(
      req.auth.user.id,
      idParsed.data,
      parsed.data.otpCode
    );
    if (!result.ok) {
      if (result.reason === "not_found") {
        return sendNotFound(res, "Booking not found.");
      }
      if (result.reason === "handover_done") {
        return sendError(
          res,
          "Courier updates are locked. Booking is already handed over to agency."
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
    const idParsed = objectIdStringSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return sendError(res, idParsed.error.issues[0]?.message ?? "Invalid booking id.");
    }
    const result = await startCourierJob(req.auth.user.id, idParsed.data);
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
