export function getApiBaseUrl(): string {
  const publicConfigured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const serverConfigured =
    process.env.API_BASE_URL?.trim() ||
    process.env.BACKEND_API_BASE_URL?.trim() ||
    publicConfigured;

  // In the browser on production, prefer same-origin requests so auth cookies
  // are issued/read on the frontend domain (via Next.js rewrite proxy).
  if (typeof window !== "undefined") {
    if (process.env.NODE_ENV === "production") return "";
    return (publicConfigured || "http://localhost:4010").replace(/\/+$/, "");
  }

  return (serverConfigured || "http://localhost:4010").replace(/\/+$/, "");
}
