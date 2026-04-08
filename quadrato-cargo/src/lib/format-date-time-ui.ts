/**
 * SSR/client-safe datetime strings for tables and lists.
 * Uses fixed locale + UTC so Node (SSR) and browsers match (avoids hydration errors).
 */

const tableUtcFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const tableUtcDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const tableUtcTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Single-line label for ops tables, e.g. "24 Mar 2026, 13:26 UTC". */
export function formatTableDateTimeUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const main = tableUtcFormatter.format(d).replace(",", "");
  return `${main} UTC`;
}

/** Two-line display: date row + time row (still UTC). */
export function formatTableDateTimeUtcParts(iso: string): { date: string; time: string } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: tableUtcDateFormatter.format(d),
    time: `${tableUtcTimeFormatter.format(d)} UTC`,
  };
}
