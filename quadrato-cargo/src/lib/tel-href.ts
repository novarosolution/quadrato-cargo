/**
 * Build a `tel:` URL from a display phone string so mobile browsers open the dialer correctly.
 * Keeps a leading + for international numbers; strips spaces, parentheses, dashes, and dots.
 */
export function telHref(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return "tel:";
  const hadPlus = s.trimStart().startsWith("+");
  const digits = s.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (hadPlus) return `tel:+${digits.replace(/^\+/, "")}`;
  return `tel:${digits}`;
}
