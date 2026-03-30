/**
 * Mitigations for cookie-authenticated CSRF and cross-origin abuse:
 * 1) When Origin is present on mutating methods, it must match the CORS allow list.
 * 2) When Sec-Fetch-Site is "cross-site" and session cookies are present, reject —
 *    important for SameSite=None deployments where third-party pages could POST with cookies.
 * Server-to-server and older clients (no Sec-Fetch-Site / no Origin) are unchanged.
 *
 * @param {string[]} allowedOrigins
 * @param {{ sensitiveCookieNames?: string[] }} [options]
 */
export function crossSiteMutationGuard(allowedOrigins, options = {}) {
  const set = new Set(
    allowedOrigins.map((o) => String(o).replace(/\/+$/, "")),
  );
  const sensitiveCookieNames = options.sensitiveCookieNames ?? [];

  function hasSensitiveSessionCookie(req) {
    if (!sensitiveCookieNames.length || !req.cookies) return false;
    return sensitiveCookieNames.some((name) => {
      const v = req.cookies[name];
      return v != null && String(v).length > 0;
    });
  }

  return function crossSiteMutationGuardMiddleware(req, res, next) {
    const method = (req.method || "GET").toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();

    const secFetchSite = (req.get("Sec-Fetch-Site") || "").toLowerCase();
    if (secFetchSite === "cross-site" && hasSensitiveSessionCookie(req)) {
      return res.status(403).json({
        ok: false,
        message: "Cross-site request with session cookies rejected.",
      });
    }

    const origin = req.get("Origin");
    if (!origin) return next();
    const normalized = String(origin).replace(/\/+$/, "");
    if (set.has(normalized)) return next();
    return res.status(403).json({
      ok: false,
      message: "Cross-origin request rejected.",
    });
  };
}
