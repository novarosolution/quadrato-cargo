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
  bookedAtIso: string;
  publicTrackingNote: string | null;
  senderAddress: string | null;
  recipientAddress: string | null;
  agencyName: string | null;
  agencyCity: string | null;
  domesticMainHubCity: string;
  fromCity: string | null;
  toCity: string | null;
  senderCountry: string | null;
  recipientCountry: string | null;
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
  bookedAtIso,
  publicTrackingNote,
  senderAddress,
  recipientAddress,
  agencyName,
  agencyCity,
  domesticMainHubCity,
  fromCity,
  toCity,
  senderCountry,
  recipientCountry,
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
      bookedAtIso={bookedAtIso}
      latestNote={publicTrackingNote}
      ctx={{
        senderAddress,
        recipientAddress,
        agencyName,
        agencyCity,
        domesticMainHubCity,
        fromCity,
        toCity,
        senderCountry,
        recipientCountry,
      }}
      timelineOverrides={publicTimelineOverrides}
      publicTimelineStatusPath={publicTimelineStatusPath}
      publicTimelineStepVisibility={publicTimelineStepVisibility}
      internationalAgencyStage={internationalAgencyStage}
      showAllStages
    />
  );
}
