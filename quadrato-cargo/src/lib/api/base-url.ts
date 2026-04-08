function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/**
 * Direct Express URL. Use only from Next.js Route Handlers that proxy upstream;
 * avoids rewriting a request back through the same Next route.
 */
export function getApiUpstreamBaseUrl(): string {
  const configured =
    process.env.API_BASE_URL?.trim() ||
    process.env.BACKEND_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return stripTrailingSlash(configured || "http://localhost:4010");
}

export function getApiBaseUrl(): string {
  const publicConfigured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const serverConfigured =
    process.env.API_BASE_URL?.trim() ||
    process.env.BACKEND_API_BASE_URL?.trim() ||
    publicConfigured;

  // Browser: same-origin `/api/*` so `next.config` rewrites proxy to Express (dev + prod).
  if (typeof window !== "undefined") {
    return "";
  }

  if (serverConfigured) {
    return stripTrailingSlash(serverConfigured);
  }

  // Dev (RSC, Server Actions, auth.ts): call this Next server so `/api` rewrites reach Express
  // instead of failing with ECONNREFUSED to localhost:4010 when nothing listens there.
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT || "3000";
    return `http://127.0.0.1:${port}`;
  }

  // Production server without explicit API URL: relative `/api/...` resolves to this app.
  return "";
}

/**
 * Invoice/tracking PDF POST URL — always same-origin so Next can proxy to Express
 * (`app/api/public/bookings/pdf/route.ts`).
 */
export function getBookingPdfPostUrl(): string {
  return "/api/public/bookings/pdf";
}
