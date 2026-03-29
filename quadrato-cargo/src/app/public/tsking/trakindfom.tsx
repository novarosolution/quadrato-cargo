"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  type BookingStatusId,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchPublicTracking } from "@/lib/api/public-client";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      data: {
        id: string;
        routeType: string;
        status: string;
        consignmentNumber: string | null;
        trackingNotes: string | null;
        customerTrackingNote: string | null;
        courierName: string | null;
        agencyName: string | null;
        senderName: string | null;
        senderAddress: string | null;
        recipientName: string | null;
        recipientAddress: string | null;
        createdAt: string;
      };
    };

const TRACKING_FLOW: Array<{
  id: BookingStatusId;
  hint: string;
}> = [
  { id: "submitted", hint: "Parcel created and submitted successfully." },
  { id: "confirmed", hint: "Shipment details confirmed by dispatch." },
  { id: "serviceability_check", hint: "Serviceability check in progress." },
  { id: "serviceable", hint: "Route is serviceable for pickup." },
  { id: "pickup_scheduled", hint: "Pickup slot assigned." },
  { id: "out_for_pickup", hint: "Pickup agent is on the way." },
  { id: "picked_up", hint: "Parcel has been picked up from sender." },
  { id: "agency_processing", hint: "Processing at regional hub." },
  { id: "in_transit", hint: "Shipment is moving to destination region." },
  { id: "out_for_delivery", hint: "Out for delivery to recipient." },
  { id: "delivery_attempted", hint: "Delivery attempt recorded." },
  { id: "on_hold", hint: "Shipment is temporarily on hold." },
  { id: "delivered", hint: "Shipment delivered successfully." },
];

const CANCELLED_FLOW: Array<{
  id: BookingStatusId;
  hint: string;
}> = [
  { id: "submitted", hint: "Parcel created and submitted successfully." },
  { id: "cancelled", hint: "Shipment has been cancelled." },
];

function statusIndex(status: BookingStatusId, flow: Array<{ id: BookingStatusId }>) {
  const index = flow.findIndex((x) => x.id === status);
  return index < 0 ? 0 : index;
}

function prettyDate(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function TrackOrderForm({ initialReference = "" }: { initialReference?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [reference, setReference] = useState(initialReference);

  useEffect(() => {
    if (!initialReference) return;
    const run = async () => {
      setState({ kind: "loading" });
      const res = await fetchPublicTracking(initialReference);
      if (!res.ok) {
        setState({ kind: "error", message: res.message });
        return;
      }
      setState({ kind: "success", data: res.tracking });
    };
    run();
  }, [initialReference]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ref = reference.trim();
    if (!ref) {
      setState({ kind: "error", message: "Enter booking ID or consignment number." });
      return;
    }
    if (ref.length < 6) {
      setState({ kind: "error", message: "Reference looks too short. Please check and try again." });
      return;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(ref)) {
      setState({
        kind: "error",
        message: "Use only letters, numbers, and hyphens in the reference."
      });
      return;
    }
    setState({ kind: "loading" });
    const res = await fetchPublicTracking(ref);
    if (!res.ok) {
      setState({ kind: "error", message: res.message });
      return;
    }
    setState({ kind: "success", data: res.tracking });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="track-reference" className="text-sm font-medium text-ink">
          Booking ID or consignment number
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="track-reference"
            name="reference"
            type="text"
            placeholder="e.g. QC12345678 or booking ID"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            inputMode="text"
            autoCapitalize="characters"
            maxLength={40}
            pattern="[A-Za-z0-9-]{6,40}"
            className="w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
          <button
            type="submit"
            className="btn-primary rounded-xl bg-linear-to-r from-accent-deep via-accent to-accent-hover px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={state.kind === "loading"}
          >
            {state.kind === "loading" ? "Checking..." : "Track"}
          </button>
        </div>
      </form>

      {state.kind === "error" ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {state.message}
        </p>
      ) : null}

      {state.kind === "success" ? (
        <div className="space-y-4">
          <div className="panel-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-soft">
                  Parcel tracking number
                </p>
                <p className="font-mono text-base font-semibold text-ink">
                  {state.data.consignmentNumber || state.data.id}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                {BOOKING_STATUS_LABELS[normalizeBookingStatus(state.data.status)]}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">
              Route:{" "}
              <span className="font-medium capitalize text-ink">{state.data.routeType}</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              Created: <span className="text-ink">{prettyDate(state.data.createdAt)}</span>
            </p>
            <p className="mt-1 text-xs text-muted-soft">
              Reference:{" "}
              <span className="font-mono text-muted">{state.data.id}</span>
            </p>
            <div className="mt-4 grid gap-2.5 text-xs text-muted sm:grid-cols-2">
              <p>
                <span className="font-semibold text-ink">Pickup courier:</span>{" "}
                {state.data.courierName || "Pending assignment"}
              </p>
              <p>
                <span className="font-semibold text-ink">Agency:</span>{" "}
                {state.data.agencyName || "Pending assignment"}
              </p>
              <p>
                <span className="font-semibold text-ink">Pickup address:</span>{" "}
                {state.data.senderAddress || "-"}
              </p>
              <p>
                <span className="font-semibold text-ink">Delivery address:</span>{" "}
                {state.data.recipientAddress || "-"}
              </p>
            </div>
          </div>

          <div className="panel-card">
            <ol className="relative ml-2 border-l border-border-strong pl-4">
              {(normalizeBookingStatus(state.data.status) === "cancelled"
                ? CANCELLED_FLOW
                : TRACKING_FLOW
              ).map((step, idx, flow) => {
                const normalized = normalizeBookingStatus(state.data.status);
                const currentIdx = statusIndex(normalized, flow);
                const done = idx < currentIdx;
                const current = idx === currentIdx;
                const visible = idx <= currentIdx + 2;
                if (!visible) return null;

                return (
                  <li key={step.id} className="relative mb-5 last:mb-0">
                    <span
                      className={`absolute -left-[1.19rem] top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                        current
                          ? "border-teal bg-teal text-white"
                          : done
                            ? "border-teal/30 bg-teal/15 text-teal"
                            : "border-border-strong bg-canvas text-muted-soft"
                      }`}
                    >
                      {done || current ? "✓" : "•"}
                    </span>
                    <div
                      className={`rounded-xl border px-3 py-2 ${
                        current
                          ? "border-teal/35 bg-teal/10"
                          : done
                            ? "border-border-strong bg-canvas/40"
                            : "border-border bg-canvas/20"
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink">
                        {BOOKING_STATUS_LABELS[step.id]}
                      </p>
                      <p className="mt-1 text-xs text-muted">{step.hint}</p>
                      {current && (state.data.customerTrackingNote || state.data.trackingNotes) ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs text-ink">
                          {state.data.customerTrackingNote || state.data.trackingNotes}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[11px] text-muted-soft">
                        {idx === 0
                          ? prettyDate(state.data.createdAt)
                          : current
                            ? "Current status"
                            : done
                              ? "Completed"
                              : "Pending"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
