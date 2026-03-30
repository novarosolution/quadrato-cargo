import { randomBytes } from "node:crypto";

/** Double-submit cookie name; must match `CSRF_COOKIE_NAME` in the Next app client helper. */
export const CSRF_COOKIE_NAME = "qc_csrf";

/**
 * Ensures a CSRF token cookie on every response and validates double-submit for mutating
 * requests when a session cookie is present (browser CSRF). Skips when `x-admin-secret`
 * matches (server-side admin API).
 */
export function csrfDoubleSubmit(env) {
  return function csrfDoubleSubmitMiddleware(req, res, next) {
    const existingRaw = req.cookies?.[CSRF_COOKIE_NAME];
    const validExisting =
      typeof existingRaw === "string" && /^[a-f0-9]{64}$/i.test(existingRaw);
    const token = validExisting ? existingRaw : randomBytes(32).toString("hex");

    if (!validExisting) {
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: env.cookieSameSite,
        secure: env.cookieSecure,
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const method = (req.method || "GET").toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return next();
    }

    const adminSecret = req.get("x-admin-secret");
    if (adminSecret && adminSecret === env.adminApiSecret) {
      return next();
    }

    const hasSession =
      Boolean(req.cookies?.[env.authCookieName]) ||
      Boolean(req.cookies?.[env.adminCookieName]);
    if (!hasSession) {
      return next();
    }

    if (validExisting) {
      const hdr = req.get("X-CSRF-Token");
      if (!hdr || hdr !== existingRaw) {
        return res.status(403).json({
          ok: false,
          message: "Invalid or missing CSRF token.",
        });
      }
    }

    next();
  };
}
