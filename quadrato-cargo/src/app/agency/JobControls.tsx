"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import { updateAgencyBookingApi, verifyAgencyHandoverApi } from "@/lib/api/agency-client";
import {
  AGENCY_ALLOWED_STATUSES,
  AGENCY_INTERNATIONAL_STATUS_TEMPLATES,
  AGENCY_STATUS_UPDATE_TEMPLATES,
  type AgencyAllowedStatus,
  agencyJobControlsCopy,
  agencyNavCopy,
  agencyShipmentSummaryLabels as shipLabels,
  agencyTrackingWizardCopy as agencyWizardCopy,
} from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";
import type { AgencyHubIdentity } from "./agency-hub-types";
import {
  defaultInternationalStageTitle,
  INTERNATIONAL_PROFESSIONAL_STAGES,
} from "@/lib/professional-tracking-stages";
import { AgencyTimelineAndCourierPanels } from "./AgencyTimelineAndCourierPanels";

type AgencyJobUpdateState =
  | { ok: true; message: string }
  | { ok: false; error: string };

function payloadPartyCity(payload: unknown, key: "sender" | "recipient"): string | null {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const section = root[key];
  if (!section || typeof section !== "object") return null;
  const city = (section as Record<string, unknown>).city;
  return typeof city === "string" && city.trim() ? city.trim() : null;
}

function summarizePayloadForCourier(payload: unknown): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const ship =
    root.shipment && typeof root.shipment === "object"
      ? (root.shipment as Record<string, unknown>)
      : {};
  if (typeof ship.contentsDescription === "string" && ship.contentsDescription.trim()) {
    out.push({ label: shipLabels.contents, value: ship.contentsDescription });
  }
  if (ship.weightKg != null && String(ship.weightKg).trim() !== "") {
    out.push({ label: shipLabels.weightKg, value: String(ship.weightKg) });
  }
  const dim = ship.dimensionsCm;
  if (dim && typeof dim === "object") {
    const d = dim as Record<string, unknown>;
    const parts = ["length", "width", "height"]
      .map((k) => d[k])
      .filter((v) => v != null && String(v).trim() !== "");
    if (parts.length) out.push({ label: shipLabels.dimensionsCm, value: parts.join(" × ") });
  } else if (typeof dim === "string" && dim.trim()) {
    out.push({ label: shipLabels.dimensions, value: dim });
  }
  if (ship.declaredValue != null && String(ship.declaredValue).trim() !== "") {
    out.push({ label: shipLabels.declaredValue, value: String(ship.declaredValue) });
  }
  const readParty = (key: "sender" | "recipient") => {
    const p = root[key] && typeof root[key] === "object" ? (root[key] as Record<string, unknown>) : {};
    const phoneLabel = key === "sender" ? shipLabels.senderPhone : shipLabels.recipientPhone;
    const addressLabel = key === "sender" ? shipLabels.senderAddress : shipLabels.recipientAddress;
    const phone = typeof p.phone === "string" ? p.phone.trim() : "";
    const parts = [
      typeof p.addressLine1 === "string" ? p.addressLine1 : "",
      typeof p.city === "string" ? p.city : "",
      typeof p.postal === "string" ? p.postal : "",
    ].filter(Boolean);
    const addr = parts.join(", ");
    if (phone) out.push({ label: phoneLabel, value: phone });
    if (addr) out.push({ label: addressLabel, value: addr });
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
  updatedAtIso: string;
  /** Booking created (ISO); timeline first-step time when no per-card time set. */
  bookedAtIso?: string;
  agencyHandoverVerifiedAt?: string | null;
  publicTrackingNote: string | null;
  senderAddress?: string | null;
  recipientAddress?: string | null;
  publicTimelineOverrides?: PublicTimelineOverrides | null;
  publicTimelineStepVisibility?: PublicTimelineStepVisibility | null;
  publicTimelineStatusPath?: string[] | null;
  internationalAgencyStage?: number | null;
  courierId?: string | null;
  courierName?: string | null;
  /** Booking payload: read-only summary for agency ↔ courier context */
  payload?: unknown;
  /** Increment (e.g. from "Accept & open") to focus OTP when handover not yet verified */
  otpFocusSignal?: number;
  agencyIdentity: AgencyHubIdentity;
  /** Wider controls on dedicated booking page */
  layout?: "panel" | "page";
};

export function AgencyJobControls({
  bookingId,
  reference,
  routeType = "domestic",
  currentStatus,
  updatedAtIso,
  bookedAtIso,
  agencyHandoverVerifiedAt,
  publicTrackingNote,
  senderAddress = null,
  recipientAddress = null,
  publicTimelineOverrides = null,
  publicTimelineStepVisibility = null,
  publicTimelineStatusPath = null,
  internationalAgencyStage = null,
  courierId = null,
  courierName = null,
  payload,
  otpFocusSignal = 0,
  agencyIdentity,
  layout = "panel",
}: Props) {
  const router = useRouter();
  const otpRef = useRef<HTMLInputElement>(null);
  const normalized = normalizeBookingStatus(currentStatus);
  const isInternational = String(routeType).toLowerCase() === "international";
  const isCancelled = normalized === "cancelled";
  const agencySelectable = (s: string): s is AgencyAllowedStatus =>
    AGENCY_ALLOWED_STATUSES.includes(s as AgencyAllowedStatus);
  const initialStatus = agencySelectable(normalized) ? normalized : "agency_processing";

  const [state, setState] = useState<AgencyJobUpdateState | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [handoverAccepted, setHandoverAccepted] = useState(Boolean(agencyHandoverVerifiedAt));
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState<string>(initialStatus);
  const [trackingValue, setTrackingValue] = useState(publicTrackingNote ?? "");
  const [intlAgencyStage, setIntlAgencyStage] = useState(() =>
    internationalAgencyStage != null &&
    Number.isInteger(internationalAgencyStage) &&
    internationalAgencyStage >= 0 &&
    internationalAgencyStage < 12
      ? String(internationalAgencyStage)
      : "",
  );
  const [wizardStep, setWizardStep] = useState(0);

  const formId = `agency-job-form-${bookingId}`;
  const quickSectionId = `agency-booking-${bookingId}-quick`;
  const timelineSectionId = `agency-booking-${bookingId}-timeline`;

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

  useEffect(() => {
    if (layout !== "page") return;
    setWizardStep(Boolean(agencyHandoverVerifiedAt) ? 1 : 0);
  }, [bookingId, layout, agencyHandoverVerifiedAt]);

  useEffect(() => {
    if (layout !== "page" || typeof window === "undefined") return;
    const applyHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return;
      if (raw === quickSectionId) {
        setWizardStep(0);
        return;
      }
      if (!handoverAccepted && (raw === `${quickSectionId}-status` || raw === timelineSectionId)) {
        setWizardStep(0);
        return;
      }
      if (raw === `${quickSectionId}-status`) setWizardStep(1);
      else if (raw === timelineSectionId) setWizardStep(2);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [layout, quickSectionId, timelineSectionId, handoverAccepted]);

  const templatesForStatus = useMemo(() => {
    const base = AGENCY_STATUS_UPDATE_TEMPLATES[statusValue as AgencyAllowedStatus] ?? [];
    const intl = isInternational
      ? AGENCY_INTERNATIONAL_STATUS_TEMPLATES[statusValue as AgencyAllowedStatus] ?? []
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
      if (layout === "page") setWizardStep(1);
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
      ...(isInternational
        ? {
            internationalAgencyStage:
              intlAgencyStage === "" ? null : Number(intlAgencyStage),
          }
        : {}),
    });
    if (result.ok) {
      setState({ ok: true, message: result.message });
      router.refresh();
    } else {
      setState({ ok: false, error: result.error });
    }
    setPending(false);
  }

  const fieldMax = layout === "page" ? "max-w-2xl" : "max-w-md";
  const showStickySave = layout === "page" && handoverAccepted && !isCancelled && wizardStep === 1;

  const pageWizardSteps = [
    {
      index: 0,
      label: agencyWizardCopy.stepHandover,
      hint: agencyWizardCopy.stepHandoverHint,
      enabled: true,
    },
    {
      index: 1,
      label: agencyWizardCopy.stepUpdates,
      hint: agencyWizardCopy.stepUpdatesHint,
      enabled: handoverAccepted,
    },
    {
      index: 2,
      label: agencyWizardCopy.stepTimeline,
      hint: agencyWizardCopy.stepTimelineHint,
      enabled: handoverAccepted,
    },
  ] as const;

  function goWizardStep(next: number) {
    const clamped = Math.max(0, Math.min(2, next));
    if (clamped >= 1 && !handoverAccepted) return;
    setWizardStep(clamped);
  }

  const shipmentBlock =
    courierSummary.length > 0 ? (
      <div className={`${agencyUi.formBlock} border-border-strong/60`}>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          {agencyJobControlsCopy.shipmentDetailsTitle}
        </h4>
        <p className="mt-1 text-[11px] text-muted-soft">
          {agencyJobControlsCopy.shipmentDetailsBlurb}
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {courierSummary.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">
                {label}
              </dt>
              <dd className="mt-0.5 wrap-break-word text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    ) : null;

  const handoverBlockEl = !handoverAccepted ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            {agencyJobControlsCopy.step1Title}
          </h4>
          <p className="mt-1 text-[11px] text-muted-soft">{agencyJobControlsCopy.step1Blurb}</p>
          <label
            htmlFor={`agency-otp-${bookingId}`}
            className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            {agencyJobControlsCopy.otpFieldLabel}
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
            placeholder={agencyJobControlsCopy.otpPlaceholder}
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
            {accepting ? agencyJobControlsCopy.accepting : agencyJobControlsCopy.acceptHandover}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {agencyJobControlsCopy.handoverDone}
          </p>
          <div className="rounded-xl border border-teal/25 bg-teal-dim/40 px-4 py-3 text-sm text-ink dark:bg-teal/10">
            <p className="font-semibold text-ink">{agencyIdentity.displayName}</p>
            {agencyIdentity.agencyAddress ? (
              <p className="mt-2 text-xs leading-relaxed text-muted">{agencyIdentity.agencyAddress}</p>
            ) : (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-200/90">
                {agencyJobControlsCopy.addressMissing}
              </p>
            )}
            {agencyIdentity.agencyPhone ? (
              <p className="mt-1 text-xs text-muted-soft">
                {agencyNavCopy.phonePrefix} {agencyIdentity.agencyPhone}
              </p>
            ) : null}
            {agencyIdentity.agencyCity ? (
              <p className="mt-2 text-[11px] text-muted-soft">
                {agencyJobControlsCopy.trackingCityLabel}{" "}
                <span className="font-medium text-ink">{agencyIdentity.agencyCity}</span>
                {agencyJobControlsCopy.trackingCitySuffix}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-amber-800/90 dark:text-amber-200/85">
                {agencyJobControlsCopy.trackingCityMissing}
              </p>
            )}
          </div>
        </div>
      );

  const statusFieldsEl = (
      <div className="space-y-4 border-t border-border-strong pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          {agencyJobControlsCopy.step2Title}
        </h4>
        <p className="rounded-lg border border-border-strong bg-canvas/30 px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-muted-soft">
            {agencyJobControlsCopy.bookingStatusPrefix}{" "}
          </span>
          <span className="text-ink">{BOOKING_STATUS_LABELS[normalized]}</span>
          {isInternational ? (
            <span className="ml-2 rounded-md bg-teal/10 px-1.5 py-0.5 font-medium text-teal">
              {agencyJobControlsCopy.internationalBadge}
            </span>
          ) : null}
          {!agencySelectable(normalized) && !isCancelled ? (
            <span className="mt-1 block text-[11px] text-amber-800 dark:text-amber-200/90">
              {agencyJobControlsCopy.statusOutsideAgencyMenu}
            </span>
          ) : null}
        </p>
        {isCancelled ? (
          <p
            className="rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm text-muted"
            role="status"
          >
            {agencyJobControlsCopy.cancelledMessage.beforeStrong}
            <strong className="text-ink">{agencyJobControlsCopy.cancelledMessage.strong}</strong>
            {agencyJobControlsCopy.cancelledMessage.afterStrong}
          </p>
        ) : !handoverAccepted ? (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100/90">
            {agencyJobControlsCopy.mustAcceptFirst}
          </p>
        ) : (
          <>
            <div>
              <label
                htmlFor={`agency-status-${bookingId}`}
                className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
              >
                {agencyJobControlsCopy.agencyStatusLabel}
              </label>
              <select
                id={`agency-status-${bookingId}`}
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                className={`mt-2 w-full ${fieldMax} rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25`}
              >
                {AGENCY_ALLOWED_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {BOOKING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {isInternational ? (
              <div>
                <label
                  htmlFor={`agency-intl-stage-${bookingId}`}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
                >
                  {agencyJobControlsCopy.intlStageLabel}
                </label>
                <select
                  id={`agency-intl-stage-${bookingId}`}
                  value={intlAgencyStage}
                  onChange={(e) => setIntlAgencyStage(e.target.value)}
                  className={`mt-2 w-full ${fieldMax} rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25`}
                >
                  <option value="">{agencyJobControlsCopy.intlStageAuto}</option>
                  {INTERNATIONAL_PROFESSIONAL_STAGES.map((def, i) => (
                    <option key={def.id} value={String(i)}>
                      {i}. {defaultInternationalStageTitle(i, def.title, agencyIdentity.displayName)}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-muted-soft">
                  {agencyJobControlsCopy.intlStageHint}
                </p>
              </div>
            ) : null}
            <div>
              <label
                htmlFor={`agency-notes-${bookingId}`}
                className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
              >
                {agencyJobControlsCopy.customerUpdateLabel}
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
                placeholder={agencyJobControlsCopy.customerUpdatePlaceholder}
              />
            </div>
          </>
        )}
      </div>
  );

  const formFeedbackEl = (
    <>
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
    </>
  );

  const submitButtonEl = (
    <button
      type="submit"
      disabled={pending || !handoverAccepted || isCancelled}
      className={agencyUi.btnPrimary}
    >
      {pending ? agencyJobControlsCopy.savePending : agencyJobControlsCopy.save}
    </button>
  );

  const timelinePanelsProps = {
    bookingId,
    status: currentStatus,
    routeType,
    updatedAtIso,
    bookedAtIso: bookedAtIso ?? updatedAtIso,
    publicTrackingNote,
    senderAddress,
    recipientAddress,
    agencyDisplayName: agencyIdentity.displayName,
    agencyHubCity: agencyIdentity.agencyCity,
    routeFromCity: payloadPartyCity(payload, "sender"),
    routeToCity: payloadPartyCity(payload, "recipient"),
    publicTimelineOverrides,
    publicTimelineStepVisibility,
    publicTimelineStatusPath,
    internationalAgencyStage,
    courierId,
    courierName,
    payload,
  } as const;

  if (layout === "page") {
    const pagePadBottom = handoverAccepted && !isCancelled && wizardStep === 1;
    return (
      <div className={pagePadBottom ? "space-y-6 pb-28 sm:pb-24" : "space-y-6"}>
        {shipmentBlock}

        <nav
          aria-label={agencyWizardCopy.progressLabel}
          className="rounded-2xl border border-border-strong/90 bg-linear-to-b from-surface-elevated/80 to-surface-elevated/45 p-4 shadow-sm ring-1 ring-black/3 backdrop-blur-sm dark:ring-white/4 sm:p-5"
        >
          <ol className="grid gap-3 sm:grid-cols-3 sm:gap-2">
            {pageWizardSteps.map((step) => {
              const active = wizardStep === step.index;
              const done = wizardStep > step.index;
              return (
                <li key={step.index}>
                  <button
                    type="button"
                    disabled={!step.enabled}
                    onClick={() => goWizardStep(step.index)}
                    className={`flex w-full flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition sm:px-3.5 sm:py-3.5 ${
                      active
                        ? "border-teal/50 bg-teal/12 ring-1 ring-teal/20"
                        : done
                          ? "border-border-strong/70 bg-canvas/25 hover:border-teal/30"
                          : "border-border-strong/60 bg-canvas/20 opacity-60 hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                          active
                            ? "bg-teal text-slate-950"
                            : done
                              ? "bg-teal/20 text-teal"
                              : "bg-pill text-muted-soft"
                        }`}
                        aria-hidden
                      >
                        {step.index + 1}
                      </span>
                      <span className="font-display text-sm font-semibold tracking-tight text-ink">
                        {step.label}
                      </span>
                    </span>
                    <span className="pl-10 text-[11px] leading-snug text-muted-soft">{step.hint}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <p className="text-center text-xs font-medium text-muted sm:text-left">
          {agencyWizardCopy.wizardStepOf(wizardStep + 1, 3)}
        </p>

        {wizardStep === 0 ? (
          <section
            id={quickSectionId}
            className="scroll-mt-24 rounded-2xl border border-border-strong/80 bg-surface-elevated/35 p-5 sm:p-6"
            aria-labelledby={`${quickSectionId}-title`}
          >
            <h2 id={`${quickSectionId}-title`} className="font-display text-base font-semibold tracking-tight text-ink">
              {agencyWizardCopy.stepHandover}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-soft">
              {agencyWizardCopy.stepHandoverHint}
            </p>
            <div className="mt-5">{handoverBlockEl}</div>
          </section>
        ) : null}

        {wizardStep === 1 ? (
          <section
            id={`${quickSectionId}-status`}
            className="scroll-mt-24 rounded-2xl border border-border-strong/80 bg-surface-elevated/35 p-5 sm:p-6"
            aria-labelledby={`${quickSectionId}-updates-title`}
          >
            <h2
              id={`${quickSectionId}-updates-title`}
              className="font-display text-base font-semibold tracking-tight text-ink"
            >
              {agencyWizardCopy.stepUpdates}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-soft">
              {agencyJobControlsCopy.quickUpdatesIntro}
            </p>
            <form id={formId} onSubmit={onSubmit} className="mt-5 space-y-6">
              {statusFieldsEl}
              {formFeedbackEl}
              {submitButtonEl}
            </form>
          </section>
        ) : null}

        {wizardStep === 2 ? (
          <section
            id={timelineSectionId}
            className="scroll-mt-24 space-y-4"
            aria-labelledby={`${timelineSectionId}-title`}
          >
            <div>
              <h2
                id={`${timelineSectionId}-title`}
                className="font-display text-base font-semibold tracking-tight text-ink"
              >
                {agencyWizardCopy.stepTimeline}
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-soft">
                {agencyJobControlsCopy.timelineWorkspaceIntro}
              </p>
            </div>
            <AgencyTimelineAndCourierPanels
              key={`${bookingId}-wizard-timeline`}
              {...timelinePanelsProps}
              timelineLayout="wizard"
            />
          </section>
        ) : null}

        <div className="flex flex-col gap-3 rounded-2xl border border-border-strong/80 bg-surface-elevated/40 p-4 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={wizardStep <= 0}
            onClick={() => goWizardStep(wizardStep - 1)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-canvas/50 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            {agencyWizardCopy.back}
          </button>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {wizardStep === 0 && !handoverAccepted ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">{agencyWizardCopy.handoverRequiredForNext}</p>
            ) : null}
            {wizardStep < 2 ? (
              <button
                type="button"
                disabled={wizardStep === 0 && !handoverAccepted}
                onClick={() => goWizardStep(wizardStep + 1)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-teal/20 transition hover:opacity-92 disabled:pointer-events-none disabled:opacity-40"
              >
                {wizardStep === 0 ? agencyWizardCopy.nextToUpdates : agencyWizardCopy.nextToTimeline}
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {showStickySave ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end sm:p-4 sm:pr-6 lg:pr-10">
            <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-border-strong bg-surface-elevated/95 px-4 py-3 shadow-lg backdrop-blur-md">
              <span className="min-w-0 text-xs text-muted-soft">
                {agencyJobControlsCopy.stickySaveHint}
              </span>
              <button
                type="submit"
                form={formId}
                disabled={pending}
                className={`${agencyUi.btnPrimary} shrink-0 px-4 py-2.5 text-xs`}
              >
                {pending ? agencyJobControlsCopy.savePending : agencyJobControlsCopy.save}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {shipmentBlock}

      <section id={quickSectionId} className="scroll-mt-24 space-y-4">
        <form id={formId} onSubmit={onSubmit} className="space-y-5">
          {handoverBlockEl}
          {statusFieldsEl}
          {formFeedbackEl}
          {submitButtonEl}
        </form>
      </section>

      <section id={timelineSectionId} className="scroll-mt-24 space-y-3">
        <AgencyTimelineAndCourierPanels
          key={`${bookingId}-panel-timeline`}
          {...timelinePanelsProps}
          timelineLayout="default"
        />
      </section>
    </div>
  );
}
