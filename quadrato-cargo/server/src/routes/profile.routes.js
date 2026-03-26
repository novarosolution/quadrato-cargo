import { Router } from "express";
import {
  getMyBookingById,
  getMyBookingPickupOtp,
  getMyProfile,
  listMyBookings,
  updateMyPassword,
  updateMyProfile
} from "../controllers/profile.controller.js";
import { requireAuth } from "../modules/auth/auth-middleware.js";

const router = Router();

router.get("/me", requireAuth, getMyProfile);
router.patch("/me", requireAuth, updateMyProfile);
router.get("/me/bookings", requireAuth, listMyBookings);
router.get("/me/bookings/:id", requireAuth, getMyBookingById);
router.get("/me/bookings/:id/pickup-otp", requireAuth, getMyBookingPickupOtp);
router.patch("/me/password", requireAuth, updateMyPassword);

export default router;
