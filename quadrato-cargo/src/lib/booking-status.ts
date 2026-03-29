export const BOOKING_STATUSES = [
  "submitted",
  "confirmed",
  "serviceability_check",
  "serviceable",
  "pickup_scheduled",
  "out_for_pickup",
  "picked_up",
  "agency_processing",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "on_hold",
  "delivered",
  "cancelled",
] as const;

export type BookingStatusId = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatusId, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  serviceability_check: "Serviceability check",
  serviceable: "Serviceable area confirmed",
  pickup_scheduled: "Pickup scheduled",
  out_for_pickup: "Out for pickup",
  picked_up: "Picked up",
  agency_processing: "At agency processing",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivery_attempted: "Delivery attempted",
  on_hold: "On hold",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** US spelling and common legacy labels → canonical id */
const STATUS_ALIASES: Record<string, BookingStatusId> = {
  canceled: "cancelled",
  complete: "delivered",
  completed: "delivered",
};

export function isBookingStatusId(v: string): v is BookingStatusId {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

/**
 * Normalize status strings from API or legacy data (spacing, case, US spelling).
 */
export function normalizeBookingStatus(
  raw: string | null | undefined,
): BookingStatusId {
  if (raw == null) return "submitted";
  let s = String(raw).trim().toLowerCase();
  if (!s) return "submitted";
  s = s.replace(/[\s-]+/g, "_");
  if (isBookingStatusId(s)) return s;
  const alias = STATUS_ALIASES[s];
  if (alias) return alias;
  return "submitted";
}
