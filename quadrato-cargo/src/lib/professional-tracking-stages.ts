import type { BookingStatusId } from "@/lib/booking-status";
import {
  INTERNATIONAL_EXCEPTION_STATUSES,
  INTERNATIONAL_TRACKING_PHASES,
  bookingStatusToInternationalStepIndex,
  legacyInternationalFlatIndexToMacroSub,
} from "@/lib/international-tracking-flow";

export type TrackingShipmentContext = {
  senderAddress: string | null;
  recipientAddress: string | null;
  agencyName: string | null;
};

export type ProfessionalSubstepDef = {
  id: string;
  label: string;
};

export type ProfessionalStageDef = {
  id: string;
  title: string;
  hint: string;
  /** Detailed checklist under each macro stage (international). */
  substeps?: readonly ProfessionalSubstepDef[];
};

/**
 * Eleven-slot international flow: phases from {@link INTERNATIONAL_TRACKING_PHASES},
 * plus split last mile / exceptions / delivered — matches professional courier copy (Rajkot → USA).
 */
function buildInternationalProfessionalStages(): ProfessionalStageDef[] {
  const phases = INTERNATIONAL_TRACKING_PHASES;
  const head = phases.slice(0, -1);
  const lastPhase = phases[phases.length - 1];

  const out: ProfessionalStageDef[] = head.map((p) => ({
    id: `intl_${p.key}`,
    title: p.title,
    hint: p.steps[0]?.hint ?? "",
    substeps: p.steps.map((s) => ({ id: s.id, label: s.label })),
  }));

  out.push({
    id: "intl_last_mile_active",
    title: lastPhase.title,
    hint: lastPhase.steps[0]?.hint ?? "",
    substeps: lastPhase.steps.slice(0, 2).map((s) => ({ id: s.id, label: s.label })),
  });

  out.push({
    id: "intl_exceptions_panel",
    title: "Exception / problem status",
    hint: "Weather or operational delay, customs hold, address issues, or rescheduled delivery.",
    substeps: INTERNATIONAL_EXCEPTION_STATUSES.map((e) => ({
      id: e.id,
      label: e.label,
    })),
  });

  out.push({
    id: "intl_delivered_final",
    title: "Delivered",
    hint: lastPhase.steps[2]?.hint ?? "Proof of delivery completed.",
    substeps: [
      { id: lastPhase.steps[2].id, label: lastPhase.steps[2].label },
    ],
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
 * Macro stage index (0–10) aligned with {@link bookingStatusToInternationalStepIndex} and
 * {@link legacyInternationalFlatIndexToMacroSub} so checklist progress matches card position.
 */
export function getInternationalProfessionalStageIndex(status: BookingStatusId): number {
  if (status === "on_hold") return 9;
  if (status === "cancelled") return 0;
  const flat = bookingStatusToInternationalStepIndex(status);
  return legacyInternationalFlatIndexToMacroSub(flat).macro;
}

/** Sub-step row highlight within the current macro card (international checklist). */
export function getInternationalTimelineSubstepCursor(
  status: BookingStatusId,
): { macro: number; sub: number } {
  if (status === "on_hold") return { macro: 9, sub: 0 };
  if (status === "cancelled") return { macro: 0, sub: 0 };
  const flat = bookingStatusToInternationalStepIndex(status);
  return legacyInternationalFlatIndexToMacroSub(flat);
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
      return ctx.recipientAddress || "Last mile · delivery area";
    case 9:
      return "Operations / customs / dispatch review";
    case 10:
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

export type TimelineSegment =
  | { kind: "stage"; index: number }
  | { kind: "divider"; key: string; label: string };

/**
 * Newest-first stage list with optional India → USA transition markers (international only).
 */
export function buildProfessionalTimelineSegments(
  currentStageIndex: number,
  mode: "international" | "domestic",
): TimelineSegment[] {
  const forward = Array.from({ length: currentStageIndex + 1 }, (_, i) => i);
  const rev = forward.reverse();
  const out: TimelineSegment[] = [];
  for (let j = 0; j < rev.length; j++) {
    const idx = rev[j];
    out.push({ kind: "stage", index: idx });
    if (mode !== "international") continue;
    const next = rev[j + 1];
    if (next === undefined) continue;
    if (idx === 6 && next === 5) {
      out.push({
        kind: "divider",
        key: "usa-import",
        label: "Arriving in USA · import gateway",
      });
    }
    if (idx === 5 && next === 4) {
      out.push({
        kind: "divider",
        key: "india-air",
        label: "International departure · air cargo (India)",
      });
    }
  }
  return out;
}
