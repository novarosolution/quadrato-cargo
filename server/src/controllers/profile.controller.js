import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  sendError,
  sendNotFound,
  sendOk,
  sendValidationError
} from "../components/api-response.js";
import { toPublicUser } from "../models/user.model.js";
import {
  findBookingByUserAndId,
  getPickupOtpForUserBooking,
  listBookingsByUserId
} from "../modules/bookings/booking-repo.js";
import {
  findUsersByIds,
  findUserById,
  updateUserAddressBook,
  updateUserName,
  updateUserPasswordHash
} from "../modules/users/user-repo.js";
import { MIN_PASSWORD_LENGTH } from "../shared/constants.js";
import { passwordComplexitySchema } from "../shared/password-rules.js";
import { objectIdStringSchema } from "../shared/zod-helpers.js";

const updateProfileSchema = z.object({
  name: z.string().trim().min(8).max(120).optional()
});
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordComplexitySchema,
  confirmPassword: z.string().min(MIN_PASSWORD_LENGTH).max(72)
});
const addressSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^\d{7,15}$/),
  street: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postal: z.string().trim().min(1),
  country: z.string().trim().min(1)
});
const updateAddressBookSchema = z.object({
  sender: addressSchema.nullish(),
  recipient: addressSchema.nullish()
});

export function getMyProfile(req, res) {
  return sendOk(res, { user: req.auth.user });
}

export async function updateMyProfile(req, res, next) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg =
        parsed.error.flatten().fieldErrors.name?.[0] ?? "Please enter a valid name.";
      return sendError(res, msg);
    }

    if (parsed.data.name === undefined) {
      const user = await findUserById(req.auth.user.id);
      return sendOk(res, {
        message: "No changes applied.",
        user: user ? toPublicUser(user) : req.auth.user
      });
    }

    const user = await updateUserName(req.auth.user.id, parsed.data.name);
    return sendOk(res, {
      message: "Profile updated successfully.",
      user: user ? toPublicUser(user) : req.auth.user
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyAddressBook(req, res, next) {
  try {
    const user = await findUserById(req.auth.user.id);
    return sendOk(res, {
      addressBook: user?.addressBook || { sender: null, recipient: null }
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyAddressBook(req, res, next) {
  try {
    const parsed = updateAddressBookSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Please enter valid address details.", 400);
    }
    const user = await updateUserAddressBook(req.auth.user.id, {
      ...(parsed.data.sender !== undefined ? { sender: parsed.data.sender } : {}),
      ...(parsed.data.recipient !== undefined ? { recipient: parsed.data.recipient } : {})
    });
    return sendOk(res, {
      message: "Address book updated successfully.",
      addressBook: user?.addressBook || { sender: null, recipient: null }
    });
  } catch (error) {
    return next(error);
  }
}

export async function listMyBookings(req, res, next) {
  try {
    const limitRaw = Number.parseInt(String(req.query.limit ?? "100"), 10);
    const summary = String(req.query.summary ?? "0").trim() === "1";
    const rows = await listBookingsByUserId(req.auth.user.id, req.auth.user.email, {
      limit: Number.isFinite(limitRaw) ? limitRaw : 100,
      summary,
      backfill: false
    });
    const courierIds = Array.from(
      new Set(
        rows
          .map((row) => String(row?.courierId || "").trim())
          .filter(Boolean)
      )
    );
    const couriers = await findUsersByIds(courierIds);
    const courierMap = new Map(
      couriers.map((courier) => [
        String(courier._id),
        String(courier?.name || courier?.email || "").trim() || null
      ])
    );
    const bookings = rows.map((row) => ({
      ...row,
      courierName: row?.courierId ? courierMap.get(String(row.courierId)) || null : null
    }));
    return sendOk(res, { bookings });
  } catch (error) {
    return next(error);
  }
}

export async function getMyBookingById(req, res, next) {
  try {
    const idParsed = objectIdStringSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return sendError(res, idParsed.error.issues[0]?.message ?? "Invalid booking id.");
    }
    const row = await findBookingByUserAndId(
      req.auth.user.id,
      idParsed.data,
      req.auth.user.email
    );
    if (!row) {
      return sendNotFound(res, "Booking not found.");
    }
    let courierName = null;
    if (row.courierId) {
      const courier = await findUserById(row.courierId);
      courierName = String(courier?.name || courier?.email || "").trim() || null;
    }
    return sendOk(res, { booking: { ...row, courierName } });
  } catch (error) {
    return next(error);
  }
}

export async function getMyBookingPickupOtp(req, res, next) {
  try {
    const idParsed = objectIdStringSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return sendError(res, idParsed.error.issues[0]?.message ?? "Invalid booking id.");
    }
    const otp = await getPickupOtpForUserBooking(
      req.auth.user.id,
      idParsed.data,
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
      const f = parsed.error.flatten().fieldErrors;
      return sendValidationError(res, {
        currentPassword: f.currentPassword?.[0],
        newPassword: f.newPassword?.[0],
        confirmPassword: f.confirmPassword?.[0]
      });
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
