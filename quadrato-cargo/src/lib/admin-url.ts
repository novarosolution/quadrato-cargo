/** Build query string for admin list links (drops empty values; page=1 omitted). */
export function adminListQuery(
  params: Record<string, string | undefined | null>,
): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "") continue;
    if (k === "page" && String(v) === "1") continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}
