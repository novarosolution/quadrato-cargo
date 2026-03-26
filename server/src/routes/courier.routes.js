import { Router } from "express";
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

const router = Router();
router.get("/me/bookings", requireAuth, requireCourier, listMyCourierBookings);
router.get("/me/bookings/:id", requireAuth, requireCourier, getMyCourierBookingById);
router.get("/me/status", requireAuth, requireCourier, getCourierStatus);
router.patch("/me/status", requireAuth, requireCourier, updateCourierStatus);
router.post("/me/bookings/:id/verify-pickup-otp", requireAuth, requireCourier, verifyMyPickupOtp);
router.post("/me/bookings/:id/start-job", requireAuth, requireCourier, startMyCourierJob);

export default router;
