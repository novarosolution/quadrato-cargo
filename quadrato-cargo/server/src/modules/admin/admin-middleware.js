import { env } from "../../config/env.js";

export function requireAdminApi(req, res, next) {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== env.adminApiSecret) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  return next();
}
