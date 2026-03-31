"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { updateAgencyBookingApi, verifyAgencyHandoverApi } from "@/lib/api/agency-client";
import type { AgencyHubIdentity } from "./agency-hub-types";

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

/** Extra templates when route is international (customs / linehaul wording). */
const INTERNATIONAL_STATUS_TEMPLATES: Partial<Record<AgencyAllowed, string[]>> = {
  agency_processing: [
    "International shipment received at export hub. Commercial invoice and customs paperwork under review.",
    "Parcel accepted for international processing; awaiting export clearance / flight allocation.",
  ],
  in_transit: [
    "International linehaul — departed origin country; in transit toward destination region. ETA: [date].",
    "Air / sea segment in progress. Tracking updates after arrival at destination gateway.",
    "Export cleared; shipment moving on international network to recipient country.",
  ],
  out_for_delivery: [
    "Cleared destination customs; out for local delivery. Duties/taxes: [if applicable].",
    "Final mile in destination country — courier may contact recipient for ID or duties.",
  ],
  on_hold: [
    "On hold at border / customs: [reason]. Recipient may need to provide documents or pay duties.",
    "Awaiting destination customs release or airline handling — shipment is secure.",
  ],
  delivered: [
    "International delivery completed — handed over in destination country per local procedure.",
  ],
};

function summarizePayloadForCourier(payload: unknown): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const ship =
    root.shipment && typeof root.shipment === "object"
      ? (root.shipment as Record<string, unknown>)
      : {};
  if (typeof ship.contentsDescription === "string" && ship.contentsDescription.trim()) {
    out.push({ label: "Contents", value: ship.contentsDescription });
  }
  if (ship.weightKg != null && String(ship.weightKg).trim() !== "") {
    out.push({ label: "Weight (kg)", value: String(ship.weightKg) });
  }
  const dim = ship.dimensionsCm;
  if (dim && typeof dim === "object") {
    const d = dim as Record<string, unknown>;
    const parts = ["length", "width", "height"]
      .map((k) => d[k])
      .filter((v) => v != null && String(v).trim() !== "");
    if (parts.length) out.push({ label: "Dimensions (cm)", value: parts.join(" × ") });
  } else if (typeof dim === "string" && dim.trim()) {
    out.push({ label: "Dimensions", value: dim });
  }
  if (ship.declaredValue != null && String(ship.declaredValue).trim() !== "") {
    out.push({ label: "Declared value", value: String(ship.declaredValue) });
  }
  const readParty = (key: "sender" | "recipient") => {
    const p = root[key] && typeof root[key] === "object" ? (root[key] as Record<string, unknown>) : {};
    const label = key === "sender" ? "Sender" : "Recipient";
    const phone = typeof p.phone === "string" ? p.phone.trim() : "";
    const parts = [
      typeof p.addressLine1 === "string" ? p.addressLine1 : "",
      typeof p.city === "string" ? p.city : "",
      typeof p.postal === "string" ? p.postal : "",
    ].filter(Boolean);
    const addr = parts.join(", ");
    if (phone) out.push({ label: `${label} phone`, value: phone });
    if (addr) out.push({ label: `${label} address`, value: addr });
  };
  readParty("sender");
  readParty("recipient");
  return out;
}

type Props = {
  bookingId: string;
  reference: string;
  /** domestic | international — international adds customs/linehaul templates */
  routeType?: string;
  currentStatus: string;
  agencyHandoverVerifiedAt?: string | null;
  publicTrackingNote: string | null;
  /** Booking payload: read-only summary for agency ↔ courier context */
  payload?: unknown;
  /** Increment (e.g. from "Accept & open") to focus OTP when handover not yet verified */
  otpFocusSignal?: number;
  agencyIdentity: AgencyHubIdentity;
};

export function AgencyJobControls({
  bookingId,
  reference,
  routeType = "domestic",
  currentStatus,
  agencyHandoverVerifiedAt,
  publicTrackingNote,
  payload,
  otpFocusSignal = 0,
  agencyIdentity,
}: Props) {
  const router = useRouter();
  const otpRef = useRef<HTMLInputElement>(null);
  const normalized = normalizeBookingStatus(currentStatus);
  const isInternational = String(routeType).toLowerCase() === "international";
  const isCancelled = normalized === "cancelled";
  const agencySelectable = (s: string): s is AgencyAllowed =>
    AGENCY_ALLOWED_STATUSES.includes(s as AgencyAllowed);
  const initialStatus = agencySelectable(normalized) ? normalized : "agency_processing";

  const [state, setState] = useState<AgencyJobUpdateState | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [handoverAccepted, setHandoverAccepted] = useState(Boolean(agencyHandoverVerifiedAt));
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState<string>(initialStatus);
  const [trackingValue, setTrackingValue] = useState(publicTrackingNote ?? "");

  const courierSummary = useMemo(() => summarizePayloadForCourier(payload), [payload]);

  useEffect(() => {
    setHandoverAccepted(Boolean(agencyHandoverVerifiedAt));
  }, [agencyHandoverVerifiedAt]);

  useEffect(() => {
    const n = normalizeBookingStatus(currentStatus);
    if (agencySelectable(n)) {
      setStatusValue(n);
    } else if (!isCancelled) {
      setStatusValue("agency_processing");
    }
  }, [currentStatus, isCancelled]);

  useEffect(() => {
    setTrackingValue(publicTrackingNote ?? "");
  }, [publicTrackingNote]);

  useEffect(() => {
    if (otpFocusSignal === 0) return;
    if (handoverAccepted) return;
    otpRef.current?.focus();
  }, [otpFocusSignal, handoverAccepted]);

  const templatesForStatus = useMemo(() => {
    const base = STATUS_UPDATE_TEMPLATES[statusValue as AgencyAllowed] ?? [];
    const intl = isInternational
      ? INTERNATIONAL_STATUS_TEMPLATES[statusValue as AgencyAllowed] ?? []
      : [];
    return [...base, ...intl];
  }, [statusValue, isInternational]);

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
    if (!handoverAccepted || isCancelled) return;
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
    <form onSubmit={onSubmit} className="space-y-5">
      {courierSummary.length > 0 ? (
        <div className="rounded-xl border border-border-strong bg-canvas/30 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Shipment details (for reference)
          </h4>
          <p className="mt-1 text-[11px] text-muted-soft">
            Read-only from the booking. Use the customer update box below for what appears on public
            tracking (courier and customer both see that text).
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {courierSummary.map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">
                  {label}
                </dt>
                <dd className="mt-0.5 break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {!handoverAccepted ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Step 1 — Accept handover
          </h4>
          <p className="mt-1 text-[11px] text-muted-soft">
            Enter the 6-digit agency OTP from the courier. It auto-submits when complete, or use the
            button.
          </p>
          <label
            htmlFor={`agency-otp-${bookingId}`}
            className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Agency OTP
          </label>
          <input
            ref={otpRef}
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
            className="mt-2 w-full max-w-xs rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 font-mono text-sm tracking-[0.2em] text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
            placeholder="••••••"
          />
          {acceptError ? (
            <p className="mt-2 text-xs text-rose-400" role="alert">
              {acceptError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={accepting || otpCode.trim().length !== 6}
            onClick={() => void verifyHandover()}
            className="mt-3 rounded-xl bg-teal px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {accepting ? "Accepting…" : "Accept handover"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Handover accepted — processing under your hub. Status updates keep this booking linked to
            your agency account.
          </p>
          <div className="rounded-xl border border-teal/25 bg-teal-dim/40 px-4 py-3 text-sm text-ink dark:bg-teal/10">
            <p className="font-semibold text-ink">{agencyIdentity.displayName}</p>
            <p className="mt-0.5 text-xs text-muted-soft">{agencyIdentity.email}</p>
            {agencyIdentity.agencyAddress ? (
              <p className="mt-2 text-xs leading-relaxed text-muted">{agencyIdentity.agencyAddress}</p>
            ) : (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-200/90">
                Add your hub address in &ldquo;Agency hub details&rdquo; above so it shows here and stays
                consistent on every job.
              </p>
            )}
            {agencyIdentity.agencyPhone ? (
              <p className="mt-1 text-xs text-muted-soft">Phone · {agencyIdentity.agencyPhone}</p>
            ) : null}
          </div>
        </div>
      )}

      <div className="space-y-4 border-t border-border-strong pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Step 2 — Status & message to customer / courier context
        </h4>
        <p className="rounded-lg border border-border-strong bg-canvas/30 px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-muted-soft">Booking status (from system / admin): </span>
          <span className="text-ink">{BOOKING_STATUS_LABELS[normalized]}</span>
          {isInternational ? (
            <span className="ml-2 rounded-md bg-teal/10 px-1.5 py-0.5 font-medium text-teal">
              International
            </span>
          ) : null}
          {!agencySelectable(normalized) && !isCancelled ? (
            <span className="mt-1 block text-[11px] text-amber-800 dark:text-amber-200/90">
              This step is before or outside the agency menu; after you accept handover, choose the next
              status below to align with tracking.
            </span>
          ) : null}
        </p>
        {isCancelled ? (
          <p
            className="rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm text-muted"
            role="status"
          >
            This booking is <strong className="text-ink">cancelled</strong>. Status updates are managed by
            admin only.
          </p>
        ) : !handoverAccepted ? (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100/90">
            Accept the courier handover (Step 1) before saving status or customer updates. That keeps
            admin-assigned international and domestic milestones in order and avoids overwriting the
            booking by mistake.
          </p>
        ) : (
          <>
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
                className="mt-2 w-full max-w-md rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
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
                Customer update (tracking + courier-visible context)
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
                rows={5}
                value={trackingValue}
                onChange={(e) => setTrackingValue(e.target.value)}
                className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
                placeholder="Tap a template or write instructions for the customer. Replace [brackets] with real details before saving."
              />
            </div>
          </>
        )}
      </div>

      {state?.ok === false ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-teal" role="status">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !handoverAccepted || isCancelled}
        className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save status & customer update"}
      </button>
    </form>
  );
}
