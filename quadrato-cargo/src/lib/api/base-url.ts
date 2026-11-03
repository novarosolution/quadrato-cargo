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
  // Browser: same-origin `/api/*` so `next.config` rewrites proxy to Express.
  if (typeof window !== "undefined") {
    return "";
  }
  // Server Actions / RSC must use an absolute upstream URL. Relative `/api/...`
  // often fails with "Failed to fetch" on Vercel (no request base for undici).
  return getApiUpstreamBaseUrl();
}

/**
 * Invoice/tracking PDF POST URL — always same-origin so Next can proxy to Express
 * (`app/api/public/bookings/pdf/route.ts`).
 */
export function getBookingPdfPostUrl(): string {
  return "/api/public/bookings/pdf";
}
