import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKING_STATUS_LABELS, normalizeBookingStatus } from "@/lib/booking-status";
import { fetchAdminBookingDetail } from "@/lib/api/admin-server";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { AdminTimelineQuickCardForm } from "../../AdminTimelineQuickCardForm";
import { AdminTimelineNextStepForm } from "../../AdminTimelineNextStepForm";
import { AdminCustomerTimelineForm } from "../../AdminCustomerTimelineForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Customer Track — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

const jumpClass =
  "rounded-lg border border-border-strong bg-canvas/40 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover";

export default async function AdminBookingTimelinePage({ params }: Props) {
  const { id } = await params;
  const res = await fetchAdminBookingDetail(id);
  const row = res.booking;
  if (!row) notFound();

  const st = normalizeBookingStatus(row.status);
  const ref =
    (row.consignmentNumber && String(row.consignmentNumber).trim()) ||
    (row.publicBarcodeCode && String(row.publicBarcodeCode).trim()) ||
    id.slice(0, 8);

  return (
    <div className="stack-page content-narrow">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/admin/bookings/${id}`} prefetch={false} className="text-sm text-teal hover:underline">
          ← Booking
        </Link>
        <span className="text-muted-soft">·</span>
        <Link href="/admin/bookings" prefetch={false} className="text-sm text-muted-soft hover:text-teal hover:underline">
          All bookings
        </Link>
      </div>

      <AdminPageHeader
        title="Customer Track"
        description={
          <>
            <span className="font-mono text-xs text-muted-soft">{ref}</span>
            <span className="text-muted-soft"> · </span>
            {BOOKING_STATUS_LABELS[st]}
            <span className="text-muted-soft"> · </span>
            <span className="capitalize">{row.routeType}</span>
          </>
        }
      />

      <div className="rounded-2xl border border-teal/25 bg-teal/5 p-4 text-sm text-muted-soft dark:bg-teal/10">
        <p className="font-medium text-ink">Everything for the public Track page</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong className="text-ink">Text</strong> — titles, locations, descriptions, times per step.
          </li>
          <li>
            <strong className="text-ink">Visibility</strong> — turn off <em>Show on customer Track</em> to hide a step.
            Customers never see that checkbox. The step for <em>today&apos;s status</em> always stays visible so
            the timeline is never empty.
          </li>
          <li>
            <strong className="text-ink">Status</strong> — change shipment status on the main booking page under{" "}
            <strong className="text-ink">Status, notes &amp; dates</strong>, then return here to edit cards.
          </li>
        </ul>
      </div>

      <nav
        aria-label="Sections on this page"
        className="flex flex-wrap gap-2 border-b border-border-strong pb-3"
      >
        <a href="#timeline-current" className={jumpClass}>
          Current card
        </a>
        <a href="#timeline-next" className={jumpClass}>
          Next card
        </a>
        <a href="#timeline-bulk" className={jumpClass}>
          All steps
        </a>
      </nav>

      <section id="timeline-current" className="scroll-mt-28 rounded-2xl border border-teal/25 bg-teal/4 p-5 dark:bg-teal/10">
        <h2 className="font-display text-lg font-semibold text-ink">Current Track card</h2>
        <p className="mt-1 text-xs text-muted-soft">Matches today&apos;s shipment status.</p>
        <div className="mt-4">
          <AdminTimelineQuickCardForm
            key={`${row.id}-${row.routeType}-${row.status}-${JSON.stringify(row.publicTimelineOverrides ?? null)}-${JSON.stringify(row.publicTimelineStepVisibility ?? null)}`}
            bookingId={row.id}
            routeType={row.routeType}
            status={row.status}
            initial={row.publicTimelineOverrides ?? null}
            initialStepVisibility={row.publicTimelineStepVisibility ?? null}
          />
        </div>
      </section>

      <section
        id="timeline-next"
        className="scroll-mt-28 rounded-2xl border border-border-strong bg-surface-elevated/40 p-5"
      >
        <h2 className="font-display text-lg font-semibold text-ink">Next Track card</h2>
        <p className="mt-1 text-xs text-muted-soft">Prepare the following step before you advance status.</p>
        <div className="mt-4">
          <AdminTimelineNextStepForm
            key={`${row.id}-${row.routeType}-next-${row.status}-${JSON.stringify(row.publicTimelineOverrides ?? null)}-${JSON.stringify(row.publicTimelineStepVisibility ?? null)}`}
            bookingId={row.id}
            routeType={row.routeType}
            status={row.status}
            initial={row.publicTimelineOverrides ?? null}
            initialStepVisibility={row.publicTimelineStepVisibility ?? null}
          />
        </div>
      </section>

      <section id="timeline-bulk" className="scroll-mt-28 rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">All timeline steps (bulk)</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Save all, bulk locations, step-by-step edits, and per-step visibility.
        </p>
        <div className="mt-4">
          <AdminCustomerTimelineForm
            key={`${row.id}-${row.routeType}-${JSON.stringify(row.publicTimelineStepVisibility ?? null)}`}
            bookingId={row.id}
            routeType={row.routeType}
            initial={row.publicTimelineOverrides ?? null}
            initialStepVisibility={row.publicTimelineStepVisibility ?? null}
          />
        </div>
      </section>
    </div>
  );
}
