"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

type AgencyAllowed = (typeof AGENCY_ALLOWED_STATUSES)[number];

/** Prefilled customer-facing lines per status (edit [brackets] before sending). */
const STATUS_UPDATE_TEMPLATES: Partial<Record<AgencyAllowed, string[]>> = {
  agency_processing: [
    "Received at agency hub. Sorting and dispatch preparation in progress.",
    "Parcel logged at agency. Next scan: outbound to destination region.",
  ],
  in_transit: [
    "In transit to destination hub. ETA update: [date / time].",
    "Shipment en route to destination city. Tracking will refresh after arrival scan.",
    "Departed origin facility; in network transit — no action needed from recipient yet.",
  ],
  out_for_delivery: [
    "Out for delivery today. Courier may contact recipient if access or OTP is required.",
    "With delivery associate for final mile. Expected attempt today.",
  ],
  delivery_attempted: [
    "Delivery attempted — [reason]. We will retry / await recipient instruction.",
    "Could not complete delivery. Recipient can contact support with Tracking ID for reschedule.",
  ],
  on_hold: [
    "Temporarily on hold: [reason]. We will update when movement resumes.",
    "Awaiting [documents / customs / recipient response]. Shipment is safe at our facility.",
  ],
  delivered: [
    "Delivered successfully to recipient. Thank you for using Quadrato Cargo.",
    "Delivery completed. Signed / handed over as per local process.",
  ],
};

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
    normalized as AgencyAllowed,
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

  const templatesForStatus = useMemo(() => {
    const list = STATUS_UPDATE_TEMPLATES[statusValue as AgencyAllowed];
    return list ?? [];
  }, [statusValue]);

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

  function insertTemplate(text: string) {
    setTrackingValue((prev) => {
      const t = text.trim();
      if (!prev.trim()) return t;
      return `${prev.trim()}\n${t}`;
    });
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
          Customer update text (shown on tracking + delivery note context)
        </label>
        {templatesForStatus.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {templatesForStatus.map((tpl) => (
              <button
                key={tpl}
                type="button"
                title={tpl}
                onClick={() => insertTemplate(tpl)}
                className="max-w-full rounded-lg border border-border-strong bg-canvas/40 px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug text-ink transition hover:border-teal/40 hover:bg-pill-hover"
              >
                <span className="line-clamp-2">{tpl}</span>
              </button>
            ))}
          </div>
        ) : null}
        <textarea
          id={`agency-notes-${bookingId}`}
          rows={4}
          value={trackingValue}
          onChange={(e) => setTrackingValue(e.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="Tap a template above or write your own. Replace [brackets] with real dates or reasons before saving."
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
