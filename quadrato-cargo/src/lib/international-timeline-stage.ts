import type { BookingStatusId } from "@/lib/booking-status";
import { getInternationalProfessionalStageIndex } from "@/lib/professional-tracking-stages";

/** Matches `INTERNATIONAL_PROFESSIONAL_STAGES.length` (macro cards 0–11). */
export const INTERNATIONAL_TIMELINE_STAGE_COUNT = 12;

/**
 * When set (international only), this index drives which timeline card is "current" on Track.
 * Otherwise falls back to coarse `status` mapping.
 */
export function resolveInternationalTimelineStageIndex(
  status: BookingStatusId,
  internationalAgencyStage: number | null | undefined,
): number {
  if (
    internationalAgencyStage != null &&
    Number.isInteger(internationalAgencyStage) &&
    internationalAgencyStage >= 0 &&
    internationalAgencyStage < INTERNATIONAL_TIMELINE_STAGE_COUNT
  ) {
    return internationalAgencyStage;
  }
  return getInternationalProfessionalStageIndex(status);
}
