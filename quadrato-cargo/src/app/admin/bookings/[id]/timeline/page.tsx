import type { Metadata } from "next";
import Link from "next/link";
import { BOOKING_STATUS_LABELS, normalizeBookingStatus } from "@/lib/booking-status";
import { AdminCustomerTimelineForm } from "../../AdminCustomerTimelineForm";
import { TRACKER_EDIT_SYSTEM, TRACKER_PREVIEW } from "@/lib/admin-tracker-edit-labels";
import { getAdminBookingBundle } from "../_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "../BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${TRACKER_EDIT_SYSTEM} — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingTimelinePage({ params }: Props) {
  const { id } = await params;
  const bundle = await getAdminBookingBundle(id);
  const { booking: row } = bundle;

  const st = normalizeBookingStatus(row.status);
  const ref =
    (row.consignmentNumber && String(row.consignmentNumber).trim()) ||
    (row.publicBarcodeCode && String(row.publicBarcodeCode).trim()) ||
    id.slice(0, 8);

  return (
    <div className="space-y-6">
      <BookingSectionIntro step="Customer copy" title={TRACKER_EDIT_SYSTEM}>
        <p>
          <strong className="font-medium text-ink">Everything on this page:</strong> per-step text (title, location,
          description, time), visibility, and <strong className="text-ink">Save all</strong>. Status and international
          macro are on{" "}
          <Link href={`/admin/bookings/${id}/dispatch`} className="font-medium text-teal hover:underline">
            Dispatch
          </Link>
          . See the live layout on{" "}
          <Link href={`/admin/bookings/${id}/track-preview`} className="font-medium text-teal hover:underline">
            {TRACKER_PREVIEW}
          </Link>
          .
        </p>
      </BookingSectionIntro>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-strong/70 bg-canvas/25 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:bg-canvas/15">
        <div>
          <p className="font-display text-sm font-semibold text-ink">
            <span className="font-mono text-xs text-muted-soft">{ref}</span>
            <span className="mx-1.5 text-muted-soft">·</span>
            {BOOKING_STATUS_LABELS[st]}
            <span className="mx-1.5 text-muted-soft">·</span>
            <span className="capitalize">{row.routeType}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/bookings/${id}/dispatch`}
            prefetch={false}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-teal/40 bg-teal/10 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-teal/18"
          >
            Dispatch
          </Link>
          <Link
            href={`/admin/bookings/${id}/track-preview`}
            prefetch={false}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border-strong bg-canvas/50 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/35"
          >
            {TRACKER_PREVIEW}
          </Link>
        </div>
      </div>

      <details className="rounded-2xl border border-teal/25 bg-teal/5 text-sm text-muted-soft dark:bg-teal/10">
        <summary className="cursor-pointer list-none px-4 py-3 font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
          How this page works
        </summary>
        <ul className="list-inside list-disc space-y-1.5 border-t border-teal/20 px-4 py-3">
          <li>
            Use <strong className="text-ink">Step … / N</strong> with Back/Next inside the bulk editor to move between
            cards.
          </li>
          <li>
            Hiding a step with <em>Show on customer Track</em> only affects past steps; the active macro always
            stays visible.
          </li>
          <li>
            International public Track shows completed steps plus the latest;{" "}
            <strong className="text-ink">{TRACKER_PREVIEW}</strong> shows every macro including upcoming.
          </li>
        </ul>
      </details>

      <section id="timeline-bulk" className="scroll-mt-28 rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">All timeline steps</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Save all, per-step edits, and which steps appear on customer Track.
        </p>
        <div className="mt-4">
          <AdminCustomerTimelineForm
            key={`${row.id}-${row.routeType}-${JSON.stringify(row.publicTimelineStepVisibility ?? null)}`}
            bookingId={row.id}
            routeType={row.routeType}
            initial={row.publicTimelineOverrides ?? null}
            initialStepVisibility={row.publicTimelineStepVisibility ?? null}
            assignedAgencyName={bundle.trackPreviewAgencyName}
          />
        </div>
      </section>
    </div>
  );
}
