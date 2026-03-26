import { Router } from "express";
import {
  createContact,
  createPublicBooking,
  generateBookingPdf,
  getSiteSettings,
  trackBooking
} from "../controllers/public.controller.js";

const router = Router();

router.post("/contact", createContact);
router.post("/bookings", createPublicBooking);
router.post("/bookings/pdf", generateBookingPdf);
router.get("/track/:reference", trackBooking);
router.get("/site-settings", getSiteSettings);

export default router;
