import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { fetchAgencyBookingsServer } from "@/lib/api/agency-client";
import {
  agencyBookingDetailPageCopy,
  agencyDefaults,
  agencyMeta,
} from "@/lib/agency-content";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { agencyUi } from "@/lib/agency-ui";
import { mapAgencyBookingsToIntakeRows } from "../../_lib/map-agency-intake-rows";
import { AgencyJobControls } from "../../JobControls";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: agencyMeta.pageTitleBooking,
    robots: { index: false, follow: false },
  };
}

export default async function AgencyBookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const u = session?.user;
  const agencyIdentity = {
    displayName: (u?.name && u.name.trim()) || agencyDefaults.hubDisplayName,
    agencyAddress: u?.agencyAddress?.trim() || null,
    agencyPhone: u?.agencyPhone?.trim() || null,
    agencyCity: u?.agencyCity?.trim() || null,
  };

  const cookieHeader = (await cookies()).toString();
  const res = await fetchAgencyBookingsServer(cookieHeader);
  if (!res.ok) notFound();

  const rows = mapAgencyBookingsToIntakeRows(res.data.bookings || []);
  const row = rows.find((r) => r.id === id);
  if (!row) notFound();

  const reference = row.consignmentNumber || row.id;
  const quickId = `agency-booking-${row.id}-quick`;
  const statusWorkspaceId = `${quickId}-status`;
  const timelineId = `agency-booking-${row.id}-timeline`;

  return (
    <div className="stack-page content-wide gap-6 max-sm:gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Link
          href="/agency"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal transition hover:text-teal/85 hover:underline"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          {agencyBookingDetailPageCopy.backToBookings}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`#${quickId}`}
            className="rounded-full border border-border-strong/70 bg-canvas/35 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-teal/35"
          >
            Handover
          </a>
          <a
            href={`#${statusWorkspaceId}`}
            className="rounded-full border border-border-strong/70 bg-canvas/35 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-teal/35"
          >
            Status
          </a>
          <a
            href={`#${timelineId}`}
            className="rounded-full border border-border-strong/70 bg-canvas/35 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-teal/35"
          >
            Timeline
          </a>
          <Link
            href={agencyBookingDetailPageCopy.guideHref}
            prefetch={false}
            className="rounded-full border border-border-strong/70 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/10"
          >
            {agencyBookingDetailPageCopy.guideLinkLabel}
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <AppSurfacePageHeader
          eyebrow={agencyBookingDetailPageCopy.headerEyebrow}
          title={reference}
          description={agencyBookingDetailPageCopy.headerDescription}
        />

        <div className={`mt-6 ${agencyUi.formBlock}`}>
          <AgencyJobControls
            key={`${row.id}-${row.updatedAt}-${String(row.internationalAgencyStage ?? "")}`}
            bookingId={row.id}
            reference={reference}
            routeType={row.routeType}
            currentStatus={row.status}
            updatedAtIso={row.updatedAt}
            bookedAtIso={row.createdAt}
            agencyHandoverVerifiedAt={row.agencyHandoverVerifiedAt}
            publicTrackingNote={row.publicTrackingNote || row.trackingNotes}
            senderAddress={row.senderAddress}
            recipientAddress={row.recipientAddress}
            publicTimelineOverrides={row.publicTimelineOverrides}
            publicTimelineStepVisibility={row.publicTimelineStepVisibility}
            publicTimelineStatusPath={row.publicTimelineStatusPath}
            internationalAgencyStage={row.internationalAgencyStage}
            courierId={row.courierId}
            courierName={row.courierName}
            payload={row.payload}
            otpFocusSignal={0}
            agencyIdentity={agencyIdentity}
            layout="page"
          />
        </div>
      </div>
    </div>
  );
}
