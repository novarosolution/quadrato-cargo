import Link from "next/link";
import { normalizeBookingStatus } from "@/lib/booking-status";
import { AdminBookingStatusBadge } from "@/components/admin/AdminBookingStatusBadge";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteCourierBooking } from "../../dashboard/actions";
import type { AdminBookingWithDates } from "./_lib/get-admin-booking-bundle";
import { ChevronRight } from "lucide-react";

type Props = {
  booking: AdminBookingWithDates;
};

export function AdminBookingLayoutHeader({ booking }: Props) {
  const st = normalizeBookingStatus(booking.status);
  const ref =
    (booking.consignmentNumber && String(booking.consignmentNumber).trim()) ||
    (booking.publicBarcodeCode && String(booking.publicBarcodeCode).trim()) ||
    booking.id.slice(0, 10);

  const routeLabel = booking.routeType === "international" ? "International" : "Domestic";

  return (
    <header className="overflow-hidden rounded-2xl border border-border-strong/80 bg-linear-to-b from-surface-elevated/85 to-surface-elevated/55 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] backdrop-blur-md dark:from-surface-elevated/65 dark:to-surface-elevated/40 dark:shadow-black/50 dark:ring-white/[0.05]">
      <div className="border-b border-border-strong/50 bg-linear-to-r from-teal/10 via-teal/[0.04] to-transparent px-4 py-4 sm:px-6 sm:py-5 dark:from-teal/14">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-soft sm:text-sm">
          <Link href="/admin/bookings" prefetch={false} className="font-medium text-teal hover:underline">
            Bookings
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
          <span className="truncate font-mono text-[11px] text-muted sm:text-xs" title={booking.id}>
            {ref}
          </span>
        </nav>

        <div className="mt-3 flex flex-col gap-4 sm:mt-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border-strong/70 bg-canvas/50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                {routeLabel}
              </span>
              <AdminBookingStatusBadge status={st} />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Shipment
            </h1>
            <p className="max-w-xl text-sm text-muted">Use the section nav to edit dispatch, track, parcel, and more.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <DeleteRowButton
              label="Delete booking"
              action={deleteCourierBooking.bind(null, booking.id)}
              redirectAfter="/admin/bookings"
            />
            <p className="text-right text-[11px] text-muted-soft">
              Booked {booking.createdAt.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:py-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border-strong/55 bg-canvas/30 px-3 py-2.5 shadow-sm transition hover:border-teal/35 hover:bg-canvas/45">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Internal ID</p>
          <p className="mt-1 break-all font-mono text-xs text-ink">{booking.id}</p>
        </div>
        <div className="rounded-xl border border-border-strong/55 bg-canvas/30 px-3 py-2.5 shadow-sm transition hover:border-teal/35 hover:bg-canvas/45">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Public reference</p>
          <p className="mt-1 font-mono text-sm font-medium text-ink">{ref}</p>
        </div>
        <div className="rounded-xl border border-border-strong/55 bg-canvas/30 px-3 py-2.5 shadow-sm transition hover:border-teal/35 hover:bg-canvas/45 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Quick link</p>
          <Link
            href={`/public/tsking?reference=${encodeURIComponent(ref)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex text-sm font-medium text-teal hover:underline"
          >
            Open customer Track →
          </Link>
        </div>
      </div>
    </header>
  );
}
