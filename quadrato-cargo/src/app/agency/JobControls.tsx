"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { updateAgencyBookingApi } from "@/lib/api/agency-client";

type AgencyJobUpdateState =
  | { ok: true; message: string }
  | { ok: false; error: string };

const AGENCY_ALLOWED_STATUSES = [
  "agency_processing",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "on_hold",
  "delivered",
] as const;

type Props = {
  bookingId: string;
  currentStatus: string;
  trackingNotes: string | null;
};

export function AgencyJobControls({
  bookingId,
  currentStatus,
  trackingNotes,
}: Props) {
  const router = useRouter();
  const normalized = normalizeBookingStatus(currentStatus);
  const initialStatus = AGENCY_ALLOWED_STATUSES.includes(
    normalized as (typeof AGENCY_ALLOWED_STATUSES)[number],
  )
    ? normalized
    : "agency_processing";

  const [state, setState] = useState<AgencyJobUpdateState | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [statusValue, setStatusValue] = useState<string>(initialStatus);
  const [trackingValue, setTrackingValue] = useState(trackingNotes ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const result = await updateAgencyBookingApi({
      bookingId,
      status: statusValue,
      trackingNotes: trackingValue,
    });
    if (result.ok) {
      setState({ ok: true, message: result.message });
      router.refresh();
    } else {
      setState({ ok: false, error: result.error });
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label
          htmlFor={`agency-status-${bookingId}`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Agency status
        </label>
        <select
          id={`agency-status-${bookingId}`}
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        >
          {AGENCY_ALLOWED_STATUSES.map((s) => (
            <option key={s} value={s}>
              {BOOKING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={`agency-notes-${bookingId}`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Tracking notes
        </label>
        <textarea
          id={`agency-notes-${bookingId}`}
          rows={3}
          value={trackingValue}
          onChange={(e) => setTrackingValue(e.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      {state?.ok === false ? (
        <p className="text-xs text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-xs text-teal" role="status">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Update"}
      </button>
    </form>
  );
}
