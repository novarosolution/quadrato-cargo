"use client";

import { ProfessionalTrackingTimeline } from "@/app/public/tsking/ProfessionalTrackingTimeline";
import { normalizeBookingStatus } from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";

type Props = {
  status: string;
  routeType: string;
  updatedAtIso: string;
  publicTrackingNote: string | null;
  senderAddress: string | null;
  recipientAddress: string | null;
  assignedAgency: string | null;
  publicTimelineOverrides: PublicTimelineOverrides | null;
  publicTimelineStepVisibility: PublicTimelineStepVisibility | null;
  publicTimelineStatusPath: string[] | null;
  internationalAgencyStage: number | null;
};

/**
 * Staff-only preview: all macro steps (12 international / 5 domestic) with Completed / Latest / Upcoming.
 * Matches the public Track card layout; customer pages omit {@link ProfessionalTrackingTimeline.showAllStages}.
 */
export function AdminBookingTrackPreview({
  status,
  routeType,
  updatedAtIso,
  publicTrackingNote,
  senderAddress,
  recipientAddress,
  assignedAgency,
  publicTimelineOverrides,
  publicTimelineStepVisibility,
  publicTimelineStatusPath,
  internationalAgencyStage,
}: Props) {
  const mode = routeType === "international" ? "international" : "domestic";
  const st = normalizeBookingStatus(status);

  return (
    <ProfessionalTrackingTimeline
      status={st}
      routeType={mode}
      updatedAt={updatedAtIso}
      latestNote={publicTrackingNote}
      ctx={{
        senderAddress,
        recipientAddress,
        agencyName: assignedAgency,
      }}
      timelineOverrides={publicTimelineOverrides}
      publicTimelineStatusPath={publicTimelineStatusPath}
      publicTimelineStepVisibility={publicTimelineStepVisibility}
      internationalAgencyStage={internationalAgencyStage}
      showAllStages
    />
  );
}
