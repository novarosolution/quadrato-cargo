import type { BookingStatusId } from "@/lib/booking-status";
import { siteName } from "@/lib/site";

/**
 * Professional international courier journey (example / product data).
 * Origin hub city and main sort hub come from agency + site settings on live Track.
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
    title: `Pickup stage (${siteName})`,
    steps: [
      {
        id: "intl_shipment_created",
        label: "Shipment created",
        hint: "Booking registered; labels and documentation are being prepared.",
      },
      {
        id: "intl_pickup_scheduled",
        label: "Pickup scheduled",
        hint: "Pickup window assigned for the sender / origin area.",
      },
      {
        id: "intl_shipment_picked_up",
        label: "Shipment picked up",
        hint: "Courier collected the parcel from the sender.",
      },
      {
        id: "intl_picked_up_rajkot",
        label: "Picked up – origin",
        hint: "Parcel confirmed at origin; first hub scan.",
      },
    ],
  },
  {
    key: "origin_hub",
    title: "Origin processing (agency hub)",
    steps: [
      {
        id: "intl_arrived_origin_rajkot",
        label: "Arrived at origin facility",
        hint: "Shipment scanned into the origin hub.",
      },
      {
        id: "intl_processed_origin_rajkot",
        label: "Shipment processed at origin facility",
        hint: "Sorted and prepared for linehaul to the next facility.",
      },
      {
        id: "intl_departed_rajkot",
        label: "Departed from origin facility",
        hint: "Dispatched toward main sort hub and export corridor.",
      },
    ],
  },
  {
    key: "domestic_transit",
    title: "Domestic transit (agency hub → main sort hub)",
    steps: [
      {
        id: "intl_in_transit_next",
        label: "In transit to next facility",
        hint: "Moving on domestic linehaul.",
      },
      {
        id: "intl_arrived_ahmedabad",
        label: "Arrived at main sort hub",
        hint: "Arrived at sorting hub for onward routing.",
      },
      {
        id: "intl_processed_ahmedabad",
        label: "Shipment processed at hub",
        hint: "Consolidated for export gateway.",
      },
      {
        id: "intl_departed_ahmedabad",
        label: "Departed from main sort hub",
        hint: "En route to international export gateway.",
      },
    ],
  },
  {
    key: "export_hub",
    title: "Export hub processing",
    steps: [
      {
        id: "intl_arrived_export_mumbai",
        label: "Arrived at export gateway",
        hint: "Received at international export gateway for your route.",
      },
      {
        id: "intl_received_gateway",
        label: "Shipment received at gateway",
        hint: "Export documentation, screening, and carrier acceptance queue.",
      },
      {
        id: "intl_security_complete",
        label: "Security check completed",
        hint: "Security screening completed per carrier and regulatory rules.",
      },
      {
        id: "intl_handed_customs_export",
        label: "Handed over to customs",
        hint: "Tendered to origin export customs for clearance.",
      },
    ],
  },
  {
    key: "export_customs_in",
    title: "Export customs (origin)",
    steps: [
      {
        id: "intl_customs_progress_in",
        label: "Export customs in progress",
        hint: "Export declaration under review.",
      },
      {
        id: "intl_customs_cleared_in",
        label: "Export customs cleared",
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
        label: "Departed origin country",
        hint: "Flight departed export airport.",
      },
      {
        id: "intl_in_transit_air",
        label: "In transit (air cargo)",
        hint: "International air segment; connections toward destination country.",
      },
      {
        id: "intl_arrived_usa",
        label: "Arrived in destination country",
        hint: "Landed and handed to import gateway.",
      },
    ],
  },
  {
    key: "import_customs_us",
    title: "Import customs (destination)",
    steps: [
      {
        id: "intl_received_import_hub",
        label: "Shipment received at import hub",
        hint: "Scanned at destination gateway.",
      },
      {
        id: "intl_customs_progress_us",
        label: "Import customs in progress",
        hint: "Local customs or broker processing as applicable.",
      },
      {
        id: "intl_customs_cleared_us",
        label: "Import customs cleared",
        hint: "Released for domestic delivery network.",
      },
    ],
  },
  {
    key: "destination_hub",
    title: "Destination processing (import hub)",
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
        hint: "Moving on domestic network toward the delivery address.",
      },
    ],
  },
  {
    key: "last_mile",
    title: "Last mile delivery",
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
 * to the 12-slot professional timeline macro index.
 * Last-mile: step 0 → macro 8 (out for delivery), step 1 → macro 9 (attempted), step 2 → macro 11 (delivered).
 * Macro 10 is reserved for on_hold / exception card only (not flat-indexed).
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
      if (flat < offset + 1) {
        return { macro: 8, sub: Math.max(0, flat - offset) };
      }
      if (flat < offset + 2) {
        return { macro: 9, sub: 0 };
      }
      if (flat < offset + len) {
        return { macro: 11, sub: 0 };
      }
      return { macro: 11, sub: 0 };
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
    agencyCity?: string | null;
    domesticMainHubCity?: string | null;
    fromCity?: string | null;
    toCity?: string | null;
    senderCountry?: string | null;
    recipientCountry?: string | null;
  },
): string {
  const ac = ctx.agencyCity?.trim() || null;
  const hub = ctx.domesticMainHubCity?.trim() || null;
  const fc = ctx.fromCity?.trim() || null;
  const tc = ctx.toCity?.trim() || null;
  const oc = String(ctx.senderCountry ?? "").trim() || (fc ? `${fc} (origin)` : "Origin country");
  const dc =
    String(ctx.recipientCountry ?? "").trim() || (tc ? `${tc} (destination)` : "Destination country");
  if (stepIndex <= 4)
    return ctx.senderAddress || (fc ? `${fc} (origin)` : ac ? `${ac} (origin)` : "Origin");
  if (stepIndex <= 6) return ac ? `${ac} hub` : ctx.agencyName ? `${ctx.agencyName} hub` : "Origin hub";
  if (stepIndex <= 10) {
    const o = ac || fc || "Origin";
    const d = hub || "Quadrato Cargo";
    return `${o} → ${d} linehaul`;
  }
  if (stepIndex <= 14) return `${oc} export gateway`;
  if (stepIndex <= 16) return `${oc} export customs`;
  if (stepIndex <= 20) return `International air cargo (${oc} → ${dc})`;
  if (stepIndex <= 23) return `${dc} import gateway / customs`;
  if (stepIndex <= 26) return ctx.agencyName?.trim() || `${dc} destination hub`;
  return ctx.recipientAddress || "Delivery location";
}

export function estimateInternationalEdd(createdAtIso: string): Date | null {
  const d = new Date(createdAtIso);
  if (Number.isNaN(d.getTime())) return null;
  const edd = new Date(d);
  edd.setUTCDate(edd.getUTCDate() + 10);
  return edd;
}
