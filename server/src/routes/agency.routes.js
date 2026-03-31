import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  listMyAgencyBookings,
  patchAgencyProfile,
  requireAgency,
  updateMyAgencyBooking,
  verifyAgencyHandover
} from "../controllers/agency.controller.js";
import { requireAuth } from "../modules/auth/auth-middleware.js";

const agencyVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many handover attempts. Please try again shortly." }
});

const agencyPatchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many agency updates. Please slow down." }
});

const agencyProfileLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many profile updates. Try again shortly." }
});

const router = Router();
router.get("/me/bookings", requireAuth, requireAgency, listMyAgencyBookings);
router.patch(
  "/me/profile",
  requireAuth,
  requireAgency,
  agencyProfileLimiter,
  patchAgencyProfile
);
router.patch(
  "/me/public/profile",
  requireAuth,
  requireAgency,
  agencyProfileLimiter,
  patchAgencyProfile
);
router.get("/me/public/bookings", requireAuth, requireAgency, listMyAgencyBookings);
router.post(
  "/verify-handover",
  requireAuth,
  requireAgency,
  agencyVerifyLimiter,
  verifyAgencyHandover
);
router.patch(
  "/me/bookings/:id",
  requireAuth,
  requireAgency,
  agencyPatchLimiter,
  updateMyAgencyBooking
);
router.patch(
  "/me/public/bookings/:id",
  requireAuth,
  requireAgency,
  agencyPatchLimiter,
  updateMyAgencyBooking
);

export default router;
