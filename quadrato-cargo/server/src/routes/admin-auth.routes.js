import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  adminLogin,
  adminLogout,
  adminMe
} from "../controllers/admin-auth.controller.js";

const router = Router();
const adminAuthWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many admin login attempts. Please try again shortly." }
});

router.post("/login", adminAuthWriteLimiter, adminLogin);
router.post("/logout", adminLogout);
router.get("/me", adminMe);

export default router;
