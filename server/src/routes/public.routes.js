import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createContact,
  createPublicBooking,
  generateBookingPdf,
  getSiteSettings,
  trackBooking
} from "../controllers/public.controller.js";

const router = Router();
const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many requests. Please try again in a few minutes." }
});
const trackLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many tracking checks. Please slow down." }
});

router.post("/contact", publicWriteLimiter, createContact);
router.post("/bookings", publicWriteLimiter, createPublicBooking);
router.post("/bookings/pdf", generateBookingPdf);
router.get("/track/:reference", trackLimiter, trackBooking);
router.get("/site-settings", getSiteSettings);

export default router;
