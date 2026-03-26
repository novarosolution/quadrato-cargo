import { z } from "zod";
import { env } from "../config/env.js";
import { sendError, sendOk } from "../components/api-response.js";
import {
  clearAdminCookie,
  setAdminCookie,
  signAdminToken,
  verifyAdminToken
} from "../modules/auth/token.js";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export function adminLogin(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "Enter a valid admin email and password.");
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  if (email !== env.adminEmail || password !== env.adminPassword) {
    return sendError(res, "Invalid admin credentials.", 401);
  }

  const token = signAdminToken({
    sub: "env-admin",
    email: env.adminEmail
  });
  setAdminCookie(res, token);
  return sendOk(res, { message: "Admin login successful." });
}

export function adminLogout(_req, res) {
  clearAdminCookie(res);
  return sendOk(res, { message: "Logged out." });
}

export function adminMe(req, res) {
  const token = req.cookies?.[env.adminCookieName];
  if (!token) return sendOk(res, { admin: null });
  try {
    const payload = verifyAdminToken(token);
    return sendOk(res, {
      admin: {
        email: String(payload.email || env.adminEmail)
      }
    });
  } catch {
    return sendOk(res, { admin: null });
  }
}
