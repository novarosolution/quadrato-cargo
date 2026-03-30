"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BadgeCheck,
  CircleDot,
  Clock3,
  Home,
  MapPin,
  PackageCheck,
  PackageSearch,
  ScanSearch,
  ShieldCheck,
  Truck,
  Warehouse,
  XCircle,
} from "lucide-react";
import {
  BOOKING_STATUS_LABELS,
  type BookingStatusId,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  fetchPublicTracking,
  type PublicTrackingShipment,
} from "@/lib/api/public-client";
import {
  INTERNATIONAL_EXCEPTION_STATUSES,
  estimateInternationalEdd,
} from "@/lib/international-tracking-flow";
import { PublicCard } from "@/components/public/PublicCard";
import { ProfessionalTrackingTimeline } from "@/app/public/tsking/ProfessionalTrackingTimeline";

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
        publicBarcodeCode?: string | null;
        trackingNotes: string | null;
        publicTrackingNote?: string | null;
        customerTrackingNote: string | null;
        courierName: string | null;
        agencyName: string | null;
        senderName: string | null;
        senderAddress: string | null;
        recipientName: string | null;
        recipientAddress: string | null;
        createdAt: string;
        /** From DB `updatedAt`; falls back to `createdAt` in UI if omitted (older API). */
        updatedAt?: string;
        shipment: PublicTrackingShipment | null;
      };
    };

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

function stepLocationLabel(
  stepId: BookingStatusId,
  data: Extract<State, { kind: "success" }>["data"]
) {
  if (stepId === "delivered" || stepId === "out_for_delivery") {
    return data.recipientAddress || "Delivery address";
  }
  if (stepId === "out_for_pickup" || stepId === "picked_up") {
    return data.senderAddress || "Pickup address";
  }
  return data.agencyName || "Quadrato Cargo Hub";
}

function stepIcon(stepId: BookingStatusId) {
  switch (stepId) {
    case "submitted":
      return PackageSearch;
    case "confirmed":
      return ShieldCheck;
    case "serviceability_check":
      return ScanSearch;
    case "serviceable":
      return BadgeCheck;
    case "pickup_scheduled":
      return Clock3;
    case "out_for_pickup":
      return Truck;
    case "picked_up":
      return PackageCheck;
    case "agency_processing":
      return Warehouse;
    case "in_transit":
      return Truck;
    case "out_for_delivery":
      return MapPin;
    case "delivery_attempted":
      return Home;
    case "on_hold":
      return Clock3;
    case "delivered":
      return BadgeCheck;
    case "cancelled":
      return XCircle;
    default:
      return CircleDot;
  }
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
      setState({ kind: "error", message: "Enter booking ID or Tracking ID." });
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
      {state.kind !== "success" ? (
        <PublicCard>
          <form onSubmit={onSubmit} className="space-y-3">
            <label htmlFor="track-reference" className="text-sm font-medium text-ink">
              Booking ID or Tracking ID
            </label>
            <p className="text-xs text-muted-soft">
              Use your <strong className="font-medium text-muted">QC</strong> code, Tracking ID, or
              booking ID — any of these opens the same shipment.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="track-reference"
                name="reference"
                type="text"
                placeholder="e.g. QC0123456789, Tracking ID, or booking ID"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                inputMode="text"
                autoCapitalize="characters"
                maxLength={40}
                pattern="[A-Za-z0-9-]{6,40}"
                className="h-12 w-full rounded-2xl border border-border-strong bg-canvas/50 px-4 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
              />
              <button
                type="submit"
                className="btn-primary h-12 rounded-2xl border border-teal/70 bg-teal px-6 text-sm font-semibold text-slate-950 disabled:opacity-60"
                disabled={state.kind === "loading"}
              >
                {state.kind === "loading" ? "Checking..." : "Track"}
              </button>
            </div>
          </form>

          {state.kind === "error" ? (
            <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {state.message}
            </p>
          ) : null}
        </PublicCard>
      ) : null}

      {state.kind === "success" ? (
        <div className="space-y-4">
          <PublicCard>
            {(() => {
              const lastTouch = state.data.updatedAt ?? state.data.createdAt;
              const routeLabel = String(state.data.routeType || "").toLowerCase();
              const isIntl = routeLabel === "international";
              const edd = isIntl ? estimateInternationalEdd(state.data.createdAt) : null;
              const tn = String(state.data.trackingNotes ?? "").trim();
              const pub = String(state.data.publicTrackingNote ?? "").trim();
              const showActivityLog = Boolean(tn && tn !== pub);
              return (
                <>
                  <div className="rounded-xl border border-teal/25 bg-linear-to-br from-teal-dim/80 to-canvas p-4 ring-1 ring-teal/15 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                          Parcel tracking no.
                        </p>
                        <p className="mt-1 break-all font-mono text-lg font-bold tracking-tight text-ink sm:text-xl">
                          {state.data.consignmentNumber || state.data.id}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center rounded-full border border-teal/35 bg-teal-dim px-3 py-1 text-xs font-semibold text-ink dark:text-teal">
                        {BOOKING_STATUS_LABELS[normalizeBookingStatus(state.data.status)]}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 border-t border-border-strong/60 pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-muted-soft">Route</dt>
                        <dd className="mt-0.5 font-medium capitalize text-ink">
                          {state.data.routeType}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-soft">Created</dt>
                        <dd className="mt-0.5 text-ink">{prettyDate(state.data.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-soft">Last updated</dt>
                        <dd className="mt-0.5 text-ink">{prettyDate(lastTouch)}</dd>
                      </div>
                      {isIntl ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-medium text-muted-soft">
                            Est. delivery (EDD)
                          </dt>
                          <dd className="mt-0.5 font-medium text-ink">
                            {edd
                              ? new Intl.DateTimeFormat("en-IN", {
                                  dateStyle: "medium",
                                }).format(edd)
                              : "—"}
                            <span className="ml-1 text-xs font-normal text-muted-soft">
                              (indicative; updates as the shipment moves)
                            </span>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                  {showActivityLog ? (
                    <details className="mt-4 rounded-lg border border-border-strong bg-surface-highlight/40 px-3 py-2">
                      <summary className="cursor-pointer text-xs font-medium text-ink hover:text-teal">
                        Operational activity log
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-xs text-muted-soft">
                        {state.data.trackingNotes}
                      </p>
                    </details>
                  ) : null}
                </>
              );
            })()}
            <details className="mt-4 border-t border-border pt-4">
              <summary className="cursor-pointer text-sm font-medium text-teal hover:underline">
                Assignment, barcode &amp; addresses
              </summary>
              <p className="mt-3 text-xs text-muted-soft">
                Booking reference:{" "}
                <span className="font-mono text-muted">{state.data.id}</span>
              </p>
              {state.data.publicBarcodeCode ? (
                <p className="mt-2 text-xs text-muted-soft">
                  Barcode / scan code:{" "}
                  <span className="font-mono text-ink">{state.data.publicBarcodeCode}</span>
                </p>
              ) : null}
              <div className="mt-3 grid gap-2.5 text-xs text-muted sm:grid-cols-2">
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
            </details>
          </PublicCard>

          {state.data.shipment ? (
            <PublicCard>
              <h3 className="text-sm font-semibold text-ink">Shipment details</h3>
              <dl className="mt-3 space-y-2 text-sm text-muted">
                {state.data.shipment.contentsDescription ? (
                  <div>
                    <dt className="text-xs font-medium text-muted-soft">Contents</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-ink">
                      {state.data.shipment.contentsDescription}
                    </dd>
                  </div>
                ) : null}
                {state.data.shipment.weightKg != null ? (
                  <div>
                    <dt className="text-xs font-medium text-muted-soft">Weight</dt>
                    <dd className="mt-0.5 text-ink">{state.data.shipment.weightKg} kg</dd>
                  </div>
                ) : null}
                {state.data.shipment.dimensionsCm &&
                (state.data.shipment.dimensionsCm.l ||
                  state.data.shipment.dimensionsCm.w ||
                  state.data.shipment.dimensionsCm.h) ? (
                  <div>
                    <dt className="text-xs font-medium text-muted-soft">Dimensions (cm)</dt>
                    <dd className="mt-0.5 text-ink">
                      {state.data.shipment.dimensionsCm.l ?? "?"} ×{" "}
                      {state.data.shipment.dimensionsCm.w ?? "?"} ×{" "}
                      {state.data.shipment.dimensionsCm.h ?? "?"}
                    </dd>
                  </div>
                ) : null}
                {state.data.shipment.declaredValue ? (
                  <div>
                    <dt className="text-xs font-medium text-muted-soft">Declared value</dt>
                    <dd className="mt-0.5 text-ink">{state.data.shipment.declaredValue}</dd>
                  </div>
                ) : null}
              </dl>
            </PublicCard>
          ) : null}

          <PublicCard>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4 text-teal" aria-hidden />
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">Shipment timeline</h3>
                  <p className="text-xs text-muted-soft">
                    Stages follow your booking status from our operations database.
                  </p>
                </div>
              </div>
            </div>
            {normalizeBookingStatus(state.data.status) === "on_hold" &&
            String(state.data.routeType).toLowerCase() === "international" ? (
              <p className="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100">
                Shipment on hold — check updates below. Common reasons include customs review or
                address clarification.{" "}
                {state.data.publicTrackingNote || state.data.customerTrackingNote || ""}
              </p>
            ) : null}
            {(() => {
              const normalized = normalizeBookingStatus(state.data.status);
              const isInternational =
                String(state.data.routeType).toLowerCase() === "international";

              if (normalized === "cancelled") {
                const flow = CANCELLED_FLOW;
                const currentIdx = statusIndex(normalized, flow);
                const visible = flow.slice(0, currentIdx + 1).reverse();
                return (
                  <ol className="relative space-y-3 pl-6">
                    <div
                      className="pointer-events-none absolute bottom-2 left-2.5 top-2 w-px bg-border-strong"
                      aria-hidden
                    />
                    {visible.map((step, idx) => {
                      const isCurrent = idx === 0;
                      const noteText = isCurrent
                        ? state.data.publicTrackingNote ||
                          state.data.customerTrackingNote ||
                          step.hint
                        : step.hint;
                      const StepIcon = stepIcon(step.id);
                      return (
                        <li key={step.id} className="relative">
                          <span
                            className={`absolute -left-[1.35rem] top-3 inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                              isCurrent
                                ? "border-accent bg-accent/15 text-accent"
                                : "border-teal/35 bg-teal/10 text-teal"
                            }`}
                          >
                            {isCurrent ? (
                              <CircleDot className="h-3 w-3" strokeWidth={2.2} />
                            ) : (
                              <BadgeCheck className="h-3 w-3" strokeWidth={2.4} />
                            )}
                          </span>
                          <div
                            className={`rounded-xl border px-3 py-3 shadow-sm ${
                              isCurrent
                                ? "border-accent/40 bg-linear-to-br from-accent/10 to-canvas/30 shadow-accent/10"
                                : "border-border-strong bg-canvas/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border-strong bg-surface-elevated/70 text-muted">
                                <StepIcon className="h-3.5 w-3.5" />
                              </span>
                              <p className="text-sm font-semibold text-ink">
                                {BOOKING_STATUS_LABELS[step.id]}
                              </p>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-xs text-muted">
                              {noteText}
                            </p>
                            <p className="mt-2 flex max-w-full min-w-0 items-start gap-1 rounded-md border border-border-strong bg-canvas/50 px-2 py-1 text-[11px] text-muted-soft">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                              <span className="min-w-0 break-words">
                                {stepLocationLabel(step.id, state.data)}
                              </span>
                            </p>
                            <p className="mt-2 text-[11px] text-muted-soft">
                              {step.id === "submitted"
                                ? `Created: ${prettyDate(state.data.createdAt)}`
                                : isCurrent
                                  ? "Latest update"
                                  : "Completed status"}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                );
              }

              if (isInternational) {
                return (
                  <>
                    <ProfessionalTrackingTimeline
                      bookingId={state.data.id}
                      status={normalized}
                      routeType="international"
                      updatedAt={state.data.updatedAt ?? state.data.createdAt}
                      latestNote={
                        state.data.publicTrackingNote || state.data.customerTrackingNote
                      }
                      ctx={{
                        senderAddress: state.data.senderAddress,
                        recipientAddress: state.data.recipientAddress,
                        agencyName: state.data.agencyName,
                      }}
                    />
                    <details className="mt-4 rounded-lg border border-border-strong bg-canvas/20 px-3 py-2">
                      <summary className="cursor-pointer text-[11px] font-medium text-muted-soft hover:text-ink">
                        Common delays &amp; customs holds
                      </summary>
                      <ul className="mt-2 space-y-1.5 text-[11px] text-muted">
                        {INTERNATIONAL_EXCEPTION_STATUSES.map((ex) => (
                          <li key={ex.id}>
                            <span className="font-medium text-ink">{ex.label}</span>
                            <span className="text-muted-soft"> — {ex.hint}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </>
                );
              }

              return (
                <ProfessionalTrackingTimeline
                  bookingId={state.data.id}
                  status={normalized}
                  routeType="domestic"
                  updatedAt={state.data.updatedAt ?? state.data.createdAt}
                  latestNote={
                    state.data.publicTrackingNote || state.data.customerTrackingNote
                  }
                  ctx={{
                    senderAddress: state.data.senderAddress,
                    recipientAddress: state.data.recipientAddress,
                    agencyName: state.data.agencyName,
                  }}
                />
              );
            })()}
          </PublicCard>
        </div>
      ) : null}
    </div>
  );
}
