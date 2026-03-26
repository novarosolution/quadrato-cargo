import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  adminMe
} from "../controllers/admin-auth.controller.js";

const router = Router();

router.post("/login", adminLogin);
router.post("/logout", adminLogout);
router.get("/me", adminMe);

export default router;
