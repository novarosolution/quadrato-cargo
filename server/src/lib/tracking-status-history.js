/** @typedef {"system"|"admin"|"agency"|"courier"} TrackingHistoryActor */

const ACTORS = new Set(["system", "admin", "agency", "courier"]);

/**
 * Append one customer-visible tracking step. Caller must only call on real status transitions.
 * @param {unknown} existingRaw
 * @param {{ status: string; location?: string | null; actor: string; at?: Date }} entry
 * @returns {Array<{ status: string; location: string | null; at: Date; actor: string }>}
 */
export function appendTrackingStatusHistoryEntry(existingRaw, entry) {
  const prev = Array.isArray(existingRaw) ? [...existingRaw] : [];
  const status = String(entry?.status ?? "").trim();
  if (!status) return prev;
  const locRaw = entry.location;
  const location =
    locRaw != null && String(locRaw).trim()
      ? String(locRaw).trim().slice(0, 500)
      : null;
  const actor = ACTORS.has(String(entry.actor)) ? String(entry.actor) : "system";
  const at =
    entry.at instanceof Date && !Number.isNaN(entry.at.getTime())
      ? entry.at
      : new Date();
  prev.push({ status, location, at, actor });
  return prev;
}
