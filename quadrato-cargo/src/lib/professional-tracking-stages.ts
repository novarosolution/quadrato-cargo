import type { BookingStatusId } from "@/lib/booking-status";

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

/** Eleven-stage international professional flow (indices 0–10). */
export const INTERNATIONAL_PROFESSIONAL_STAGES: ProfessionalStageDef[] = [
  {
    id: "intl_s0_pickup",
    title: "Pickup (Rajkot)",
    hint: "Collection, scheduling, and confirmation at origin.",
  },
  {
    id: "intl_s1_origin",
    title: "Origin processing",
    hint: "Sorting and preparation at the origin hub.",
  },
  {
    id: "intl_s2_domestic",
    title: "Domestic transit",
    hint: "Linehaul between origin region and export gateway.",
  },
  {
    id: "intl_s3_export_hub",
    title: "Export hub",
    hint: "Gateway screening, documentation, and carrier handoff prep.",
  },
  {
    id: "intl_s4_export_customs",
    title: "Export customs (India)",
    hint: "Indian export declarations and clearance.",
  },
  {
    id: "intl_s5_air",
    title: "Air transit (India → USA)",
    hint: "International air cargo movement.",
  },
  {
    id: "intl_s6_import_customs",
    title: "Import customs (USA)",
    hint: "Destination customs and release.",
  },
  {
    id: "intl_s7_destination",
    title: "Destination processing",
    hint: "Regional hub sort before last mile.",
  },
  {
    id: "intl_s8_last_mile",
    title: "Last mile",
    hint: "Final routing to the recipient address.",
  },
  {
    id: "intl_s9_exceptions",
    title: "Exceptions / hold",
    hint: "Delay, customs hold, or action required — see dispatch notes.",
  },
  {
    id: "intl_s10_delivered",
    title: "Delivered",
    hint: "Proof of delivery completed.",
  },
];

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

export function getInternationalProfessionalStageIndex(status: BookingStatusId): number {
  const map: Record<BookingStatusId, number> = {
    submitted: 0,
    confirmed: 0,
    serviceability_check: 0,
    serviceable: 0,
    pickup_scheduled: 0,
    out_for_pickup: 0,
    picked_up: 1,
    agency_processing: 3,
    in_transit: 5,
    on_hold: 9,
    out_for_delivery: 8,
    delivery_attempted: 8,
    delivered: 10,
    cancelled: 0,
  };
  return map[status] ?? 0;
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
