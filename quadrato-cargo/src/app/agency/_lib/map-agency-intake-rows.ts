import type { AgencyBooking } from "@/lib/api/agency-client";
import type { AgencyIntakeRow } from "../AgencyIntakeTable";

function partyName(payload: unknown, key: "sender" | "recipient"): string {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const section = root[key];
  if (!section || typeof section !== "object") return "—";
  const name = (section as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name : "—";
}

export function mapAgencyBookingsToIntakeRows(bookings: AgencyBooking[]): AgencyIntakeRow[] {
  return bookings.map((b) => ({
    id: b.id,
    createdAt: new Date(b.createdAt).toISOString(),
    updatedAt: (b.updatedAt && new Date(b.updatedAt).toISOString()) || new Date(b.createdAt).toISOString(),
    consignmentNumber: b.consignmentNumber,
    routeType: b.routeType,
    status: b.status,
    publicTrackingNote: b.publicTrackingNote ?? null,
    trackingNotes: b.trackingNotes ?? null,
    agencyHandoverVerifiedAt: b.agencyHandoverVerifiedAt ?? null,
    senderName: partyName(b.payload, "sender"),
    recipientName: partyName(b.payload, "recipient"),
    senderAddress: b.senderAddress ?? null,
    recipientAddress: b.recipientAddress ?? null,
    publicTimelineOverrides: b.publicTimelineOverrides ?? null,
    publicTimelineStepVisibility: b.publicTimelineStepVisibility ?? null,
    publicTimelineStatusPath: Array.isArray(b.publicTimelineStatusPath)
      ? b.publicTimelineStatusPath.map((s) => String(s ?? "").trim()).filter(Boolean)
      : null,
    internationalAgencyStage:
      b.internationalAgencyStage != null &&
      Number.isInteger(b.internationalAgencyStage) &&
      b.internationalAgencyStage >= 0 &&
      b.internationalAgencyStage < 12
        ? b.internationalAgencyStage
        : null,
    courierId: b.courierId ?? null,
    courierName: b.courierName ?? null,
    payload: b.payload,
  }));
}
