import type { Metadata } from "next";
import Link from "next/link";
import { AdminCollapsible } from "@/components/admin/AdminCollapsible";
import { AdminBookingTrackPreview } from "../../AdminBookingTrackPreview";
import { TRACKER_EDIT, TRACKER_PREVIEW } from "@/lib/admin-tracker-edit-labels";
import { getAdminBookingBundle } from "../_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "../BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${TRACKER_PREVIEW} — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingTrackPreviewPage({ params }: Props) {
  const { id } = await params;
  const b = await getAdminBookingBundle(id);
  const { booking: row } = b;

  return (
    <div className="space-y-6">
      <BookingSectionIntro step="Customer view" title={`${TRACKER_PREVIEW} (staff)`}>
        <p>
          Read-only preview. To change card titles, map lines, hints, times, and step visibility, use{" "}
          <Link href={`/admin/bookings/${id}/timeline`} className="font-medium text-teal hover:underline">
            {TRACKER_EDIT}
          </Link>{" "}
          (bulk timeline editor on one page). Status, tracking number, and customer message:{" "}
          <Link href={`/admin/bookings/${id}/dispatch`} className="font-medium text-teal hover:underline">
            Dispatch
          </Link>
          .
        </p>
      </BookingSectionIntro>

      <div className="rounded-2xl border border-teal/30 bg-linear-to-r from-teal/10 to-canvas/30 p-4 dark:from-teal/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Edit timeline copy?</p>
            <p className="mt-0.5 text-xs text-muted-soft">All cards, one editor.</p>
          </div>
          <Link
            href={`/admin/bookings/${id}/timeline`}
            prefetch={false}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90"
          >
            Open {TRACKER_EDIT} →
          </Link>
        </div>
      </div>

      <AdminCollapsible
        id="booking-track-preview"
        title="Live preview"
        description="International: all 12 macros including upcoming. Domestic: matches customer view."
        defaultOpen
      >
        <div className="rounded-xl border border-border-strong bg-canvas/30 p-3">
          <AdminBookingTrackPreview
            status={row.status}
            routeType={row.routeType}
            updatedAtIso={b.trackPreviewUpdatedIso}
            bookedAtIso={row.createdAt.toISOString()}
            publicTrackingNote={row.publicTrackingNote ?? row.customerTrackingNote ?? null}
            senderAddress={b.senderAddressForTrack}
            recipientAddress={b.recipientAddressForTrack}
            agencyName={b.trackPreviewAgencyName}
            agencyCity={b.trackPreviewAgencyCity}
            domesticMainHubCity={b.trackPreviewDomesticHubCity}
            fromCity={b.trackPreviewFromCity}
            toCity={b.trackPreviewToCity}
            senderCountry={b.trackPreviewSenderCountry}
            recipientCountry={b.trackPreviewRecipientCountry}
            publicTimelineOverrides={row.publicTimelineOverrides ?? null}
            publicTimelineStepVisibility={row.publicTimelineStepVisibility ?? null}
            publicTimelineStatusPath={
              Array.isArray(row.publicTimelineStatusPath)
                ? row.publicTimelineStatusPath
                    .map((s: unknown) => String(s ?? "").trim())
                    .filter(Boolean)
                : null
            }
            internationalAgencyStage={
              row.internationalAgencyStage != null &&
              Number.isInteger(row.internationalAgencyStage) &&
              row.internationalAgencyStage >= 0 &&
              row.internationalAgencyStage < 12
                ? row.internationalAgencyStage
                : null
            }
          />
        </div>
      </AdminCollapsible>
    </div>
  );
}
