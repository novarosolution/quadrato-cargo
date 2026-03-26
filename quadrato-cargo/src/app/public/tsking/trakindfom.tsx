"use client";

import { FormEvent, useEffect, useState } from "react";
import { BOOKING_STATUS_LABELS, normalizeBookingStatus } from "@/lib/booking-status";
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
        createdAt: string;
      };
    };

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
    setState({ kind: "loading" });
    const res = await fetchPublicTracking(ref);
    if (!res.ok) {
      setState({ kind: "error", message: res.message });
      return;
    }
    setState({ kind: "success", data: res.tracking });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="track-reference" className="text-sm font-medium text-ink">
          Booking ID or consignment number
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="track-reference"
            name="reference"
            type="text"
            placeholder="e.g. 67f... or QC-123456"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
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
        <div className="space-y-3 rounded-2xl border border-border bg-surface-elevated/70 p-5">
          <p className="text-sm text-muted-soft">
            Reference <span className="font-mono text-muted">{state.data.id}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-soft">Status: </span>
            <span className="font-medium text-teal">
              {BOOKING_STATUS_LABELS[normalizeBookingStatus(state.data.status)]}
            </span>
          </p>
          <p className="text-sm text-muted">
            Route: <span className="capitalize">{state.data.routeType}</span>
          </p>
          {state.data.consignmentNumber ? (
            <p className="text-sm text-muted">
              Consignment:{" "}
              <span className="font-mono text-ink">{state.data.consignmentNumber}</span>
            </p>
          ) : null}
          {state.data.trackingNotes ? (
            <p className="whitespace-pre-wrap text-sm text-muted">
              {state.data.trackingNotes}
            </p>
          ) : (
            <p className="text-sm text-muted">
              No tracking notes yet. Dispatch will update this soon.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
