import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getCourierStatus,
  getMyCourierBookingById,
  listMyCourierBookings,
  requireCourier,
  startMyCourierJob,
  updateCourierStatus,
  verifyMyPickupOtp
} from "../controllers/courier.controller.js";
import { requireAuth } from "../modules/auth/auth-middleware.js";

const courierOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many OTP attempts. Please try again shortly." }
});

const courierJobMutationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many job actions. Please slow down." }
});

const courierDutyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many duty toggles. Please slow down." }
});

const router = Router();
router.get("/me/bookings", requireAuth, requireCourier, listMyCourierBookings);
router.get("/me/bookings/:id", requireAuth, requireCourier, getMyCourierBookingById);
router.get("/me/status", requireAuth, requireCourier, getCourierStatus);
router.patch("/me/status", requireAuth, requireCourier, courierDutyLimiter, updateCourierStatus);
router.post(
  "/me/bookings/:id/verify-pickup-otp",
  requireAuth,
  requireCourier,
  courierOtpLimiter,
  verifyMyPickupOtp
);
router.post(
  "/me/bookings/:id/start-job",
  requireAuth,
  requireCourier,
  courierJobMutationLimiter,
  startMyCourierJob
);

export default router;
