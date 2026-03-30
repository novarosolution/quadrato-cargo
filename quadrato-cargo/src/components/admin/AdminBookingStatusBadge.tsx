import {
  BOOKING_STATUS_LABELS,
  type BookingStatusId,
} from "@/lib/booking-status";

function statusTone(status: BookingStatusId) {
  if (status === "delivered") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "on_hold" || status === "delivery_attempted") return "warning" as const;
  if (
    status === "in_transit" ||
    status === "out_for_delivery" ||
    status === "picked_up" ||
    status === "agency_processing" ||
    status === "out_for_pickup"
  ) {
    return "active" as const;
  }
  if (
    status === "submitted" ||
    status === "confirmed" ||
    status === "serviceability_check" ||
    status === "serviceable" ||
    status === "pickup_scheduled"
  ) {
    return "queued" as const;
  }
  return "muted" as const;
}

const toneClass: Record<
  ReturnType<typeof statusTone>,
  string
> = {
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-900 dark:text-rose-200",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-200",
  active: "border-teal/30 bg-teal/12 text-ink",
  queued: "border-border-strong bg-surface-highlight text-muted",
  muted: "border-border bg-canvas/40 text-muted-soft",
};

type Props = { status: BookingStatusId; className?: string };

export function AdminBookingStatusBadge({ status, className = "" }: Props) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight ${toneClass[tone]} ${className}`.trim()}
    >
      <span className="truncate">{BOOKING_STATUS_LABELS[status]}</span>
    </span>
  );
}
