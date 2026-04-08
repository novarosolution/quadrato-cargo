import { normalizeBookingStatus, type BookingStatusId } from "@/lib/booking-status";
import {
  INTERNATIONAL_TRACKING_PHASES,
  bookingStatusToInternationalStepIndex,
  legacyInternationalFlatIndexToMacroSub,
} from "@/lib/international-tracking-flow";

/** Fallback when site settings / API omit main hub (matches server default). */
export const DEFAULT_DOMESTIC_MAIN_HUB_CITY = "Quadrato Cargo";

export type TrackingShipmentContext = {
  senderAddress: string | null;
  recipientAddress: string | null;
  agencyName: string | null;
  /** Hub city for public timeline (never full street address). */
  agencyCity: string | null;
  /** Main network / sort hub for domestic linehaul copy (site setting). */
  domesticMainHubCity: string | null;
  /** Booking sender city when available (fallback copy). */
  fromCity?: string | null;
  /** Booking recipient city when available (fallback copy). */
  toCity?: string | null;
  /** Pickup / origin country label from booking (international route copy). */
  senderCountry?: string | null;
  /** Delivery / destination country label from booking (international route copy). */
  recipientCountry?: string | null;
  /** Shown on pickup-stage location lines when a courier is assigned. */
  courierName?: string | null;
};

function routeCountryLine(value: string | null | undefined, fallback: string): string {
  const t = String(value ?? "").trim();
  return t || fallback;
}

export type ProfessionalStageDef = {
  id: string;
  title: string;
  hint: string;
};

/** International macro index for the `origin_hub` phase (“Origin processing …”). */
export const INTERNATIONAL_ORIGIN_PROCESSING_MACRO_INDEX = 1;

/**
 * When an agency is assigned, macro 1 defaults to “Origin processing (Agency name)” instead of the
 * static catalog title (agency hub).
 */
export function defaultInternationalStageTitle(
  stageIndex: number,
  staticTitle: string,
  agencyName: string | null | undefined,
): string {
  if (stageIndex !== INTERNATIONAL_ORIGIN_PROCESSING_MACRO_INDEX) return staticTitle;
  const n = String(agencyName ?? "").trim();
  if (!n) return staticTitle;
  return `Origin processing (${n})`;
}

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
    hint: "Delays (weather or operations), customs hold, address issues, or rescheduled delivery. Use On hold + customer note for detail.",
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
  const hub = ctx.domesticMainHubCity?.trim() || DEFAULT_DOMESTIC_MAIN_HUB_CITY;
  const ac = ctx.agencyCity?.trim() || null;
  const fc = ctx.fromCity?.trim() || null;
  const tc = ctx.toCity?.trim() || null;
  const originCountry = routeCountryLine(ctx.senderCountry, fc ? `${fc} (origin)` : "Origin country");
  const destCountry = routeCountryLine(ctx.recipientCountry, tc ? `${tc} (destination)` : "Destination country");
  switch (stageIndex) {
    case 0: {
      const base =
        ctx.senderAddress ||
        (fc ? `${fc} · pickup zone` : ac ? `${ac} · service area` : "Pickup zone");
      const cn = ctx.courierName?.trim();
      if (cn) return `${cn} · collecting from ${base}`;
      return base;
    }
    case 1:
      return ac ? `${ac} origin hub` : ctx.agencyName ? `${ctx.agencyName} hub` : "Origin hub";
    case 2: {
      const origin = ac || fc || "Origin hub";
      return `${origin} → ${hub}`;
    }
    case 3:
      return `${originCountry} export gateway`;
    case 4:
      return `${originCountry} export customs`;
    case 5:
      return `International air cargo (${originCountry} → ${destCountry})`;
    case 6:
      return `${destCountry} import hub / gateway`;
    case 7:
      return ctx.agencyName?.trim() || `${destCountry} destination hub`;
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
  const hub = ctx.domesticMainHubCity?.trim() || DEFAULT_DOMESTIC_MAIN_HUB_CITY;
  const ac = ctx.agencyCity?.trim() || null;
  const fc = ctx.fromCity?.trim() || null;
  switch (stageIndex) {
    case 0: {
      const base =
        ctx.senderAddress ||
        (fc ? `${fc} · pickup` : ac ? `${ac} · booking area` : "Pickup location");
      const cn = ctx.courierName?.trim();
      if (cn) return `${cn} · collecting from ${base}`;
      return base;
    }
    case 1: {
      const name = ctx.agencyName?.trim();
      if (name && ac) return `${name} · ${ac}`;
      if (ac) return `${ac} hub`;
      return name || "Regional hub";
    }
    case 2: {
      const origin = ac || ctx.agencyName?.trim() || fc || "Regional hub";
      return `${origin} → ${hub}`;
    }
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

/**
 * Timeline from recorded status transitions (admin/agency/courier). Skips “filled in” milestones
 * when ops jumps status. Returns null to fall back to {@link buildProfessionalTimelineSegments}.
 */
export function buildProfessionalTimelineSegmentsFromStatusPath(
  statusPath: string[] | null | undefined,
  mode: "international" | "domestic",
): TimelineSegment[] | null {
  if (!statusPath || statusPath.length === 0) return null;
  const isInternational = mode === "international";
  const macros: number[] = [];
  for (const raw of statusPath) {
    const s = normalizeBookingStatus(raw);
    const idx = isInternational
      ? getInternationalProfessionalStageIndex(s)
      : getDomesticProfessionalStageIndex(s);
    if (macros.length === 0 || macros[macros.length - 1] !== idx) {
      macros.push(idx);
    }
  }
  return macros.reverse().map((index) => ({ kind: "stage" as const, index }));
}
