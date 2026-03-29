"use client";

import { useActionState, useMemo, useState } from "react";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  updateCourierBookingAdmin,
  type BookingAdminUpdateState,
} from "../dashboard/actions";

type Props = {
  bookingId: string;
  routeType: string;
  pickupPin?: string | null;
  assignedAgency?: string | null;
  currentStatus: string;
  consignmentNumber: string | null;
  publicTrackingNote: string | null;
  internalNotes: string | null;
};

export function AdminBookingControls({
  bookingId,
  routeType,
  pickupPin,
  assignedAgency,
  currentStatus,
  consignmentNumber,
  publicTrackingNote,
  internalNotes,
}: Props) {
  const status = normalizeBookingStatus(currentStatus);
  const [statusValue, setStatusValue] = useState<string>(status);
  const [trackingValue, setTrackingValue] = useState(publicTrackingNote ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [state, formAction, pending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(updateCourierBookingAdmin, undefined);
  const nowLabel = new Date().toLocaleString();

  const quickStatuses = useMemo(
    () =>
      routeType === "domestic"
        ? [
            "serviceability_check",
            "serviceable",
            "pickup_scheduled",
            "out_for_pickup",
            "picked_up",
            "in_transit",
            "out_for_delivery",
            "delivered",
            "on_hold",
            "cancelled",
          ]
        : [
            "serviceability_check",
            "pickup_scheduled",
            "picked_up",
            "in_transit",
            "on_hold",
            "delivered",
            "cancelled",
          ],
    [routeType],
  );

  function templateText(key: string): string {
    const pinPart = pickupPin ? ` (Postal Code / ZIP ${pickupPin})` : "";
    switch (key) {
      case "serviceability":
        return `Serviceability check completed${pinPart}. Pickup support is available for this location.`;
      case "pickup_soon":
        return `Logistics staff is heading for pickup${pinPart}. Please keep parcel ready.`;
      case "picked_up":
        return "Parcel picked up by logistics staff and moved to processing hub.";
      case "in_transit":
        return "Parcel is in transit through our domestic logistics network.";
      case "out_delivery":
        return "Parcel is out for final delivery.";
      case "delivered":
        return "Delivery completed successfully.";
      case "hold":
        return "Shipment is on hold. Our support team will contact you with next steps.";
      default:
        return "";
    }
  }

  function applyTemplate(mode: "replace" | "append") {
    const text = templateText(selectedTemplate);
    if (!text) return;
    const line = `[${nowLabel}] ${text}`;
    setTrackingValue((prev) =>
      mode === "replace" ? line : prev.trim() ? `${prev}\n${line}` : line,
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div>
        <label
          htmlFor="admin-booking-status"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Status
        </label>
        <select
          id="admin-booking-status"
          name="status"
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        >
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {BOOKING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickStatuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusValue(s)}
              className="rounded-lg border border-border-strong bg-canvas/40 px-2.5 py-1 text-xs text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              {BOOKING_STATUS_LABELS[normalizeBookingStatus(s)]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-assigned-agency"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Assigned agency (email or name)
        </label>
        <input
          id="admin-assigned-agency"
          name="assignedAgency"
          type="text"
          defaultValue={assignedAgency ?? ""}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="e.g. agency1@partner.local"
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-muted-soft">
          To show on <span className="font-mono text-[11px]">/agency</span>, use the agency account email.
        </p>
      </div>

      <div>
        <label
          htmlFor="admin-consignment"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Tracking ID (visible to customer)
        </label>
        <input
          id="admin-consignment"
          name="consignmentNumber"
          type="text"
          defaultValue={consignmentNumber ?? ""}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="e.g. QC-2025-001234"
          autoComplete="off"
        />
      </div>

      <div>
        <label
          htmlFor="admin-tracking"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Customer update (shown on tracking + PDF)
        </label>
        <textarea
          id="admin-tracking"
          name="publicTrackingNote"
          rows={4}
          value={trackingValue}
          onChange={(e) => setTrackingValue(e.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="Example: Pickup done, handed to agency, expected delivery tomorrow."
        />
        <div className="mt-3 rounded-xl border border-border bg-canvas/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Quick customer update templates
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="rounded-lg border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
            >
              <option value="">Select template</option>
              <option value="serviceability">Serviceability verified</option>
              <option value="pickup_soon">Pickup team heading now</option>
              <option value="picked_up">Parcel picked up</option>
              <option value="in_transit">In transit update</option>
              <option value="out_delivery">Out for delivery</option>
              <option value="delivered">Delivered</option>
              <option value="hold">On hold / action required</option>
            </select>
            <button
              type="button"
              onClick={() => applyTemplate("append")}
              className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              Append
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("replace")}
              className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              Replace
            </button>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-internal"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Internal notes (admin only)
        </label>
        <textarea
          id="admin-internal"
          name="internalNotes"
          rows={3}
          defaultValue={internalNotes ?? ""}
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="Not shown on the customer profile"
        />
      </div>

      {state?.ok === false && state.error ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-teal" role="status">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-xl border border-teal/70 bg-teal px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save booking controls"}
      </button>
    </form>
  );
}
