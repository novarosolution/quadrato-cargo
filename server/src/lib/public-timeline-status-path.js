/**
 * Ordered list of booking statuses the shipment has been through (customer-facing timeline).
 * When admin/agency jumps status, the path records only actual transitions (e.g. submitted → delivered),
 * not every intermediate milestone.
 */

export function computeNextPublicTimelineStatusPath(existingPath, prevStatus, newStatus) {
  const prev = String(prevStatus ?? "").trim();
  const next = String(newStatus ?? "").trim();
  if (!prev || !next || prev === next) return null;

  const path = Array.isArray(existingPath) ? [...existingPath] : [];
  if (path.length === 0) {
    path.push(prev);
  }
  if (path[path.length - 1] !== next) {
    path.push(next);
  }
  return path;
}
