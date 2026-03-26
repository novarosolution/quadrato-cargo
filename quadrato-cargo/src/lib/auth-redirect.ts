/** Only same-origin relative paths — prevents open redirects from query/form. */
export function safeRedirectPath(
  raw: string | undefined | null,
  fallback = "/public/profile",
): string {
  const s = String(raw ?? "").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  if (s.includes("\\") || s.includes("\0")) return fallback;
  return s;
}
