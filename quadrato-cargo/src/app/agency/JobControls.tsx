"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { updateAgencyBookingApi, verifyAgencyHandoverApi } from "@/lib/api/agency-client";

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
  reference: string;
  currentStatus: string;
  agencyHandoverVerifiedAt?: string | null;
  publicTrackingNote: string | null;
};

export function AgencyJobControls({
  bookingId,
  reference,
  currentStatus,
  agencyHandoverVerifiedAt,
  publicTrackingNote,
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
  const [accepting, setAccepting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [handoverAccepted, setHandoverAccepted] = useState(Boolean(agencyHandoverVerifiedAt));
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState<string>(initialStatus);
  const [trackingValue, setTrackingValue] = useState(publicTrackingNote ?? "");

  async function verifyHandover(codeArg?: string) {
    const code = String(codeArg ?? otpCode).trim();
    if (code.length !== 6) return;
    setAccepting(true);
    setAcceptError(null);
    const result = await verifyAgencyHandoverApi({ reference, otpCode: code });
    if (result.ok) {
      setHandoverAccepted(true);
      setStatusValue("agency_processing");
      setOtpCode("");
      router.refresh();
    } else {
      setAcceptError(result.error);
    }
    setAccepting(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const result = await updateAgencyBookingApi({
      bookingId,
      status: statusValue,
      publicTrackingNote: trackingValue,
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
      {!handoverAccepted ? (
        <div className="rounded-xl border border-border-strong bg-canvas/30 p-3">
          <label
            htmlFor={`agency-otp-${bookingId}`}
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Accept with agency OTP
          </label>
          <input
            id={`agency-otp-${bookingId}`}
            value={otpCode}
            onChange={(e) => {
              const val = e.currentTarget.value.replace(/\D/g, "").slice(0, 6);
              setOtpCode(val);
              if (val.length === 6) {
                void verifyHandover(val);
              }
            }}
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 font-mono text-sm tracking-[0.2em] text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
            placeholder="Enter 6-digit OTP"
          />
          <p className="mt-1 text-[11px] text-muted-soft">
            Auto-accept starts when 6 digits are entered.
          </p>
          {acceptError ? (
            <p className="mt-2 text-xs text-rose-400" role="alert">
              {acceptError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={accepting || otpCode.trim().length !== 6}
            onClick={() => void verifyHandover()}
            className="mt-2 rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover disabled:opacity-50"
          >
            {accepting ? "Accepting..." : "Accept now"}
          </button>
        </div>
      ) : (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
          Accepted at agency handover.
        </p>
      )}
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
          Customer update text
        </label>
        <textarea
          id={`agency-notes-${bookingId}`}
          rows={4}
          value={trackingValue}
          onChange={(e) => setTrackingValue(e.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="Example: Shipment reached agency hub, dispatching to destination city tonight."
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
