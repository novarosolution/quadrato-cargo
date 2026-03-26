import { Router } from "express";
import {
  listMyAgencyBookings,
  requireAgency,
  updateMyAgencyBooking,
  verifyAgencyHandover
} from "../controllers/agency.controller.js";
import { requireAuth } from "../modules/auth/auth-middleware.js";

const router = Router();
router.get("/me/bookings", requireAuth, requireAgency, listMyAgencyBookings);
router.get("/me/public/bookings", requireAuth, requireAgency, listMyAgencyBookings);
router.post("/verify-handover", requireAuth, requireAgency, verifyAgencyHandover);
router.patch("/me/bookings/:id", requireAuth, requireAgency, updateMyAgencyBooking);
router.patch("/me/public/bookings/:id", requireAuth, requireAgency, updateMyAgencyBooking);

export default router;
