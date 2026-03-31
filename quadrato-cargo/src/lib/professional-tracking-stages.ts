import type { BookingStatusId } from "@/lib/booking-status";
import {
  INTERNATIONAL_TRACKING_PHASES,
  bookingStatusToInternationalStepIndex,
  legacyInternationalFlatIndexToMacroSub,
} from "@/lib/international-tracking-flow";

export type TrackingShipmentContext = {
  senderAddress: string | null;
  recipientAddress: string | null;
  agencyName: string | null;
};

export type ProfessionalStageDef = {
  id: string;
  title: string;
  hint: string;
};

/**
 * Twelve-slot international flow: phases from {@link INTERNATIONAL_TRACKING_PHASES},
 * plus separate out-for-delivery, delivery-attempted, exception, and delivered cards.
 */
function buildInternationalProfessionalStages(): ProfessionalStageDef[] {
  const phases = INTERNATIONAL_TRACKING_PHASES;
  const head = phases.slice(0, -1);
  const lastPhase = phases[phases.length - 1];

  const out: ProfessionalStageDef[] = head.map((p) => ({
    id: `intl_${p.key}`,
    title: p.title,
    hint: p.steps[0]?.hint ?? "",
  }));

  out.push({
    id: "intl_out_for_delivery_card",
    title: "Out for delivery",
    hint: lastPhase.steps[0]?.hint ?? "Courier is on the way to the recipient.",
  });

  out.push({
    id: "intl_delivery_attempted_card",
    title: "Delivery attempted",
    hint:
      lastPhase.steps[1]?.hint ??
      "Shown when a delivery attempt was made but not completed.",
  });

  out.push({
    id: "intl_exceptions_panel",
    title: "Exception / problem status",
    hint: "Weather or operational delay, customs hold, address issues, or rescheduled delivery.",
  });

  out.push({
    id: "intl_delivered_final",
    title: "Delivered",
    hint: lastPhase.steps[2]?.hint ?? "Proof of delivery completed.",
  });

  return out;
}

export const INTERNATIONAL_PROFESSIONAL_STAGES: ProfessionalStageDef[] =
  buildInternationalProfessionalStages();

/** Domestic journey: five visible stages (same card UI, no India/USA dividers). */
export const DOMESTIC_PROFESSIONAL_STAGES: ProfessionalStageDef[] = [
  {
    id: "dom_s0_pickup",
    title: "Pickup & booking",
    hint: "Booking confirmed and pickup scheduled or completed.",
  },
  {
    id: "dom_s1_hub",
    title: "Hub processing",
    hint: "Received and sorted at service hub.",
  },
  {
    id: "dom_s2_transit",
    title: "In transit",
    hint: "Moving toward destination region.",
  },
  {
    id: "dom_s3_last_mile",
    title: "Out for delivery",
    hint: "Courier assigned for final delivery.",
  },
  {
    id: "dom_s4_delivered",
    title: "Delivered",
    hint: "Shipment delivered successfully.",
  },
];

/**
 * Macro stage index (0–11): last mile split into out-for-delivery (8), delivery attempted (9),
 * exception (10), delivered (11). Aligned with {@link legacyInternationalFlatIndexToMacroSub}.
 */
export function getInternationalProfessionalStageIndex(status: BookingStatusId): number {
  if (status === "on_hold") return 10;
  if (status === "cancelled") return 0;
  const flat = bookingStatusToInternationalStepIndex(status);
  return legacyInternationalFlatIndexToMacroSub(flat).macro;
}

export function getDomesticProfessionalStageIndex(status: BookingStatusId): number {
  const map: Record<BookingStatusId, number> = {
    submitted: 0,
    confirmed: 0,
    serviceability_check: 0,
    serviceable: 0,
    pickup_scheduled: 0,
    out_for_pickup: 0,
    picked_up: 1,
    agency_processing: 1,
    in_transit: 2,
    on_hold: 3,
    out_for_delivery: 3,
    delivery_attempted: 3,
    delivered: 4,
    cancelled: 0,
  };
  return map[status] ?? 0;
}

export function internationalHubLocation(
  stageIndex: number,
  ctx: TrackingShipmentContext,
): string {
  switch (stageIndex) {
    case 0:
      return ctx.senderAddress || "Rajkot · pickup zone";
    case 1:
      return "Rajkot origin facility";
    case 2:
      return "Ahmedabad / domestic linehaul";
    case 3:
      return "Mumbai export gateway";
    case 4:
      return "India export customs";
    case 5:
      return "International air cargo (India → USA)";
    case 6:
      return "USA import hub / gateway";
    case 7:
      return ctx.agencyName || "USA destination hub";
    case 8:
      return ctx.recipientAddress || "Out for delivery · recipient area";
    case 9:
      return ctx.recipientAddress || "Delivery attempt";
    case 10:
      return "Operations / customs / dispatch review";
    case 11:
      return ctx.recipientAddress || "Delivery completed";
    default:
      return "Quadrato Cargo network";
  }
}

export function domesticHubLocation(stageIndex: number, ctx: TrackingShipmentContext): string {
  switch (stageIndex) {
    case 0:
      return ctx.senderAddress || "Pickup location";
    case 1:
      return ctx.agencyName || "Regional hub";
    case 2:
      return ctx.agencyName || "In transit";
    case 3:
      return ctx.recipientAddress || "Delivery area";
    case 4:
      return ctx.recipientAddress || "Delivered";
    default:
      return ctx.agencyName || "Network";
  }
}

export type TimelineSegment = { kind: "stage"; index: number };

/**
 * Newest-first stage list (no divider rows; international and domestic use the same shape).
 */
export function buildProfessionalTimelineSegments(
  currentStageIndex: number,
  mode: "international" | "domestic",
): TimelineSegment[] {
  void mode;
  const forward = Array.from({ length: currentStageIndex + 1 }, (_, i) => i);
  return forward.reverse().map((idx) => ({ kind: "stage", index: idx }));
}
