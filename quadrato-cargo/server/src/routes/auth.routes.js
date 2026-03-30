import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, register } from "../controllers/auth.controller.js";

const router = Router();
const authWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many auth attempts. Please try again shortly." }
});

router.post("/register", authWriteLimiter, register);
router.post("/login", authWriteLimiter, login);
router.post("/logout", logout);
router.get("/me", me);

export default router;
