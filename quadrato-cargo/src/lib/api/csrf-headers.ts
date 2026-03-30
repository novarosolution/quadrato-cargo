/**
 * Double-submit CSRF cookie issued by the Express API (`csrfDoubleSubmit` middleware).
 * Keep in sync with `CSRF_COOKIE_NAME` in server `csrf-double-submit.js`.
 */
export const CSRF_COOKIE_NAME = "qc_csrf";

export function readBrowserCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k !== CSRF_COOKIE_NAME) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

/** Merge into credentialed mutation `fetch` calls when the CSRF cookie is present. */
export function csrfHeaderRecord(): Record<string, string> {
  const t = readBrowserCsrfToken();
  return t ? { "X-CSRF-Token": t } : {};
}
