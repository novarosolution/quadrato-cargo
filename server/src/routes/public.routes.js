import { Router } from "express";
import {
  createContact,
  createPublicBooking,
  getSiteSettings,
  trackBooking
} from "../controllers/public.controller.js";

const router = Router();

router.post("/contact", createContact);
router.post("/bookings", createPublicBooking);
router.get("/track/:reference", trackBooking);
router.get("/site-settings", getSiteSettings);

export default router;
