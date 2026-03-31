import type { BookingStatusId } from "@/lib/booking-status";

/**
 * Professional international courier journey (example / product data).
 * Rajkot → Ahmedabad → Mumbai export → USA — mirrors customer-facing tracking copy.
 */
export type InternationalTrackingStep = {
  id: string;
  label: string;
  hint: string;
};

export type InternationalTrackingPhase = {
  key: string;
  title: string;
  steps: InternationalTrackingStep[];
};

export const INTERNATIONAL_TRACKING_PHASES: InternationalTrackingPhase[] = [
  {
    key: "pickup_origin",
    title: "Pickup stage (origin – Rajkot)",
    steps: [
      {
        id: "intl_shipment_created",
        label: "Shipment created",
        hint: "Your booking is registered and labels are being prepared.",
      },
      {
        id: "intl_pickup_scheduled",
        label: "Pickup scheduled",
        hint: "A pickup window has been assigned for Rajkot.",
      },
      {
        id: "intl_shipment_picked_up",
        label: "Shipment picked up",
        hint: "Courier collected the parcel from the sender.",
      },
      {
        id: "intl_picked_up_rajkot",
        label: "Picked up – Rajkot",
        hint: "Parcel confirmed at origin city.",
      },
    ],
  },
  {
    key: "origin_hub",
    title: "Origin processing (Rajkot hub)",
    steps: [
      {
        id: "intl_arrived_origin_rajkot",
        label: "Arrived at origin facility – Rajkot",
        hint: "Shipment scanned into the origin hub.",
      },
      {
        id: "intl_processed_origin_rajkot",
        label: "Shipment processed at origin facility",
        hint: "Sorted and prepared for linehaul to the next hub.",
      },
      {
        id: "intl_departed_rajkot",
        label: "Departed from facility – Rajkot",
        hint: "Dispatched toward Ahmedabad / Mumbai corridor.",
      },
    ],
  },
  {
    key: "domestic_transit",
    title: "Domestic transit (Rajkot → Ahmedabad / Mumbai)",
    steps: [
      {
        id: "intl_in_transit_next",
        label: "In transit to next facility",
        hint: "Moving on domestic linehaul.",
      },
      {
        id: "intl_arrived_ahmedabad",
        label: "Arrived at hub – Ahmedabad",
        hint: "Arrived at sorting hub for onward routing.",
      },
      {
        id: "intl_processed_ahmedabad",
        label: "Shipment processed at hub",
        hint: "Consolidated for export gateway.",
      },
      {
        id: "intl_departed_ahmedabad",
        label: "Departed from hub – Ahmedabad",
        hint: "En route to export hub (Mumbai / Delhi).",
      },
    ],
  },
  {
    key: "export_hub",
    title: "Export hub processing (Mumbai / Delhi)",
    steps: [
      {
        id: "intl_arrived_export_mumbai",
        label: "Arrived at export hub – Mumbai",
        hint: "Received at international gateway.",
      },
      {
        id: "intl_received_gateway",
        label: "Shipment received at gateway",
        hint: "Export documentation and screening queue.",
      },
      {
        id: "intl_security_complete",
        label: "Security check completed",
        hint: "Screening cleared per carrier and customs rules.",
      },
      {
        id: "intl_handed_customs_export",
        label: "Handed over to customs",
        hint: "With Indian export customs for clearance.",
      },
    ],
  },
  {
    key: "export_customs_in",
    title: "Export customs (India)",
    steps: [
      {
        id: "intl_customs_progress_in",
        label: "Customs clearance in progress (India export)",
        hint: "Export declaration under review.",
      },
      {
        id: "intl_customs_cleared_in",
        label: "Customs cleared (India export)",
        hint: "Cleared to tender to airline.",
      },
    ],
  },
  {
    key: "air_transit",
    title: "Air transit (international movement)",
    steps: [
      {
        id: "intl_handed_airline",
        label: "Handed over to airline",
        hint: "Accepted by international air carrier.",
      },
      {
        id: "intl_departed_india",
        label: "Departed from origin country – India",
        hint: "Flight departed export airport.",
      },
      {
        id: "intl_in_transit_air",
        label: "In transit (air cargo)",
        hint: "Mid-air / connection legs toward destination.",
      },
      {
        id: "intl_arrived_usa",
        label: "Arrived at destination country – USA",
        hint: "Landed and handed to import gateway.",
      },
    ],
  },
  {
    key: "import_customs_us",
    title: "Import customs (USA)",
    steps: [
      {
        id: "intl_received_import_hub",
        label: "Shipment received at import hub",
        hint: "Scanned at destination gateway.",
      },
      {
        id: "intl_customs_progress_us",
        label: "Customs clearance in progress (USA import)",
        hint: "CBP / broker processing as applicable.",
      },
      {
        id: "intl_customs_cleared_us",
        label: "Customs cleared (USA import)",
        hint: "Released for domestic delivery network.",
      },
    ],
  },
  {
    key: "destination_hub",
    title: "Destination processing (USA hub)",
    steps: [
      {
        id: "intl_arrived_dest_facility",
        label: "Arrived at destination facility",
        hint: "At regional sort facility near recipient.",
      },
      {
        id: "intl_processed_dest",
        label: "Shipment processed at destination facility",
        hint: "Sorted for last-mile route.",
      },
      {
        id: "intl_in_transit_delivery_loc",
        label: "In transit to delivery location",
        hint: "On vehicle toward delivery address.",
      },
    ],
  },
  {
    key: "last_mile",
    title: "Last-mile delivery",
    steps: [
      {
        id: "intl_out_for_delivery",
        label: "Out for delivery",
        hint: "Courier is on the way to the recipient.",
      },
      {
        id: "intl_delivery_attempted",
        label: "Delivery attempted",
        hint: "Shown when a delivery attempt was made but not completed.",
      },
      {
        id: "intl_delivered",
        label: "Delivered",
        hint: "Proof of delivery captured.",
      },
    ],
  },
];

/** Flat ordered list for timeline indexing */
export const INTERNATIONAL_TRACKING_STEPS: InternationalTrackingStep[] =
  INTERNATIONAL_TRACKING_PHASES.flatMap((p) => p.steps);

/**
 * Maps internal booking status to the furthest international milestone index reached.
 * When the API adds granular events, replace this with server-driven step indices.
 */
export function bookingStatusToInternationalStepIndex(
  status: BookingStatusId,
): number {
  const map: Record<BookingStatusId, number> = {
    submitted: 0,
    confirmed: 1,
    serviceability_check: 2,
    serviceable: 3,
    pickup_scheduled: 4,
    out_for_pickup: 5,
    picked_up: 7,
    agency_processing: 9,
    in_transit: 16,
    out_for_delivery: INTERNATIONAL_TRACKING_STEPS.findIndex(
      (s) => s.id === "intl_out_for_delivery",
    ),
    delivery_attempted: INTERNATIONAL_TRACKING_STEPS.findIndex(
      (s) => s.id === "intl_delivery_attempted",
    ),
    on_hold: 16,
    delivered: INTERNATIONAL_TRACKING_STEPS.length - 1,
    cancelled: 0,
  };
  return map[status] ?? 0;
}

/**
 * Maps a flat international step index (same space as {@link bookingStatusToInternationalStepIndex})
 * to the 11-slot professional timeline macro index and sub-step within that card.
 * Last-mile phase is split: first two rows → macro 8, final "Delivered" → macro 10; macro 9 is exceptions only.
 */
export function legacyInternationalFlatIndexToMacroSub(
  flat: number,
): { macro: number; sub: number } {
  const phases = INTERNATIONAL_TRACKING_PHASES;
  let offset = 0;
  for (let pi = 0; pi < phases.length; pi++) {
    const p = phases[pi];
    const isLast = pi === phases.length - 1;
    const len = p.steps.length;
    if (isLast) {
      if (flat < offset + 2) {
        return { macro: 8, sub: Math.max(0, flat - offset) };
      }
      if (flat < offset + len) {
        return { macro: 10, sub: 0 };
      }
      return { macro: 10, sub: 0 };
    }
    if (flat < offset + len) {
      return { macro: pi, sub: flat - offset };
    }
    offset += len;
  }
  return { macro: 0, sub: 0 };
}

export function internationalStepLocationLabel(
  stepIndex: number,
  ctx: {
    senderAddress: string | null;
    recipientAddress: string | null;
    agencyName: string | null;
  },
): string {
  if (stepIndex <= 4) return ctx.senderAddress || "Rajkot (origin)";
  if (stepIndex <= 6) return "Rajkot hub";
  if (stepIndex <= 10) return "Ahmedabad hub / linehaul";
  if (stepIndex <= 14) return "Export hub – Mumbai / Delhi";
  if (stepIndex <= 16) return "India export customs";
  if (stepIndex <= 20) return "International air cargo";
  if (stepIndex <= 23) return "USA import gateway / customs";
  if (stepIndex <= 26) return ctx.agencyName || "USA destination hub";
  return ctx.recipientAddress || "Delivery location";
}

export function estimateInternationalEdd(createdAtIso: string): Date | null {
  const d = new Date(createdAtIso);
  if (Number.isNaN(d.getTime())) return null;
  const edd = new Date(d);
  edd.setUTCDate(edd.getUTCDate() + 10);
  return edd;
}
