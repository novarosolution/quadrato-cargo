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

export function isBookingStatusId(v: string): v is BookingStatusId {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

export function normalizeBookingStatus(
  raw: string | null | undefined,
): BookingStatusId {
  if (raw && isBookingStatusId(raw)) return raw;
  return "submitted";
}
