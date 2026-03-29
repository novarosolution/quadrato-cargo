import { env } from "../../config/env.js";
import { findUserById, toPublicUser } from "../users/user-repo.js";
import { clearAuthCookie } from "./token.js";
import { verifyAuthToken } from "./token.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.authCookieName];
    if (!token) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const payload = verifyAuthToken(token);
    const userId = String(payload?.sub || "");
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const userDoc = await findUserById(userId);
    if (!userDoc || userDoc.isActive === false) {
      clearAuthCookie(res);
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    req.auth = { user: toPublicUser(userDoc) };
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
}
