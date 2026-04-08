import { normalizeBookingStatus } from "@/lib/booking-status";

export type ProfileBookingStats = {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
};

export function computeProfileBookingStats(
  bookings: ReadonlyArray<{ status: string }>,
): ProfileBookingStats {
  let active = 0;
  let completed = 0;
  let cancelled = 0;
  for (const b of bookings) {
    const st = normalizeBookingStatus(b.status);
    if (st === "cancelled") cancelled += 1;
    else if (st === "delivered") completed += 1;
    else active += 1;
  }
  return {
    total: bookings.length,
    active,
    completed,
    cancelled,
  };
}
