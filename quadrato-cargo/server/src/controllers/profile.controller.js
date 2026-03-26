import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";
import { toPublicUser } from "../models/user.model.js";
import {
  findBookingByUserAndId,
  getPickupOtpForUserBooking,
  listBookingsByUserId
} from "../modules/bookings/booking-repo.js";
import {
  findUserById,
  updateUserName,
  updateUserPasswordHash
} from "../modules/users/user-repo.js";
import { MIN_PASSWORD_LENGTH } from "../shared/constants.js";

const updateProfileSchema = z.object({
  name: z.string().trim().max(120).optional()
});
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH),
  confirmPassword: z.string().min(MIN_PASSWORD_LENGTH)
});

export function getMyProfile(req, res) {
  return sendOk(res, { user: req.auth.user });
}

export async function updateMyProfile(req, res, next) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Please enter a valid name.");
    }

    const user = await updateUserName(req.auth.user.id, parsed.data.name ?? "");
    return sendOk(res, {
      message: "Profile updated successfully.",
      user: user ? toPublicUser(user) : req.auth.user
    });
  } catch (error) {
    return next(error);
  }
}

export async function listMyBookings(req, res, next) {
  try {
    const rows = await listBookingsByUserId(req.auth.user.id, req.auth.user.email);
    return sendOk(res, { bookings: rows });
  } catch (error) {
    return next(error);
  }
}

export async function getMyBookingById(req, res, next) {
  try {
    const row = await findBookingByUserAndId(
      req.auth.user.id,
      req.params.id,
      req.auth.user.email
    );
    if (!row) {
      return sendNotFound(res, "Booking not found.");
    }
    return sendOk(res, { booking: row });
  } catch (error) {
    return next(error);
  }
}

export async function getMyBookingPickupOtp(req, res, next) {
  try {
    const otp = await getPickupOtpForUserBooking(
      req.auth.user.id,
      req.params.id,
      req.auth.user.email
    );
    if (!otp) {
      return sendNotFound(res, "Booking not found.");
    }
    return sendOk(res, { pickupOtp: otp });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyPassword(req, res, next) {
  try {
    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
    }

    const { currentPassword, newPassword, confirmPassword } = parsed.data;
    if (newPassword !== confirmPassword) {
      return sendError(res, "New passwords do not match.");
    }
    if (newPassword === currentPassword) {
      return sendError(res, "Use a different new password.");
    }

    const user = await findUserById(req.auth.user.id);
    if (!user?.passwordHash) {
      return sendError(res, "Password update is not available for this account.");
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return sendError(res, "Current password is incorrect.", 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordHash(req.auth.user.id, passwordHash);
    return sendOk(res, { message: "Password updated successfully." });
  } catch (error) {
    return next(error);
  }
}
