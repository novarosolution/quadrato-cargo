"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { AdminCollapsible } from "@/components/admin/AdminCollapsible";
import {
  AdminFormField,
  adminInputClassName,
} from "@/components/admin/AdminFormField";
import { ManualTrackingQuickLinks } from "./ManualTrackingQuickLinks";
import {
  saveManualTrackingAdmin,
  type BookingAdminUpdateState,
} from "../dashboard/actions";

export type AgencyOption = { email: string; name: string | null };

export type AdminBookingCourierOption = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  isOnDuty: boolean;
  readyForJob?: boolean;
  courierActiveJobCount?: number;
};

type Props = {
  bookingId: string;
  trackReference: string;
  routeType: string;
  pickupPin?: string | null;
  assignedAgency: string | null;
  agencyOptions: AgencyOption[];
  currentStatus: string;
  consignmentNumber: string | null;
  publicTrackingNote: string | null;
  operationalTrackingNotes: string | null;
  internalNotes: string | null;
  couriers: AdminBookingCourierOption[];
  assignedCourierId: string | null;
};

const inputClass = adminInputClassName();
const selectClass = adminInputClassName();

export function AdminBookingDispatchSplit({
  bookingId,
  trackReference,
  routeType,
  pickupPin,
  assignedAgency,
  agencyOptions,
  currentStatus,
  consignmentNumber,
  publicTrackingNote,
  operationalTrackingNotes,
  internalNotes,
  couriers,
  assignedCourierId,
}: Props) {
  const router = useRouter();
  const uid = useId().replace(/:/g, "");
  const agencyDatalistId = `admin-agency-dl-${uid}`;

  const normalizedStatus = normalizeBookingStatus(currentStatus);
  const [status, setStatus] = useState<string>(normalizedStatus);
  const [consignment, setConsignment] = useState(consignmentNumber ?? "");
  const [publicNote, setPublicNote] = useState(publicTrackingNote ?? "");
  const [operationalLog, setOperationalLog] = useState(operationalTrackingNotes ?? "");
  const [internal, setInternal] = useState(internalNotes ?? "");
  const [agency, setAgency] = useState(assignedAgency ?? "");
  const [courierId, setCourierId] = useState(assignedCourierId ?? "__unassigned");

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [state, formAction, pending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveManualTrackingAdmin, undefined);

  useEffect(() => {
    if (state?.ok === true) router.refresh();
  }, [state?.ok, router]);

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
    const line = `[${new Date().toLocaleString()}] ${text}`;
    setPublicNote((prev) => (mode === "replace" ? line : prev.trim() ? `${prev}\n${line}` : line));
  }

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("bookingId", bookingId);
    fd.set("status", status);
    fd.set("consignmentNumber", consignment);
    fd.set("publicTrackingNote", publicNote);
    fd.set("operationalTrackingNotes", operationalLog);
    fd.set("internalNotes", internal);
    fd.set("assignedAgency", agency);
    fd.set("courierUserId", courierId);
    return fd;
  }

  function submitDispatch() {
    formAction(buildFormData());
  }

  return (
    <div className="space-y-4">
      <AdminCollapsible
        id="booking-customer-tracking"
        title="Dispatch & customer updates"
        description="Status, tracking number, customer-visible message, activity log, and staff-only notes."
        defaultOpen
      >
        <div className="space-y-6">
          <ManualTrackingQuickLinks bookingId={bookingId} trackReference={trackReference} />

          <div className="rounded-xl border border-teal/20 bg-teal-dim/20 px-4 py-3 text-xs leading-relaxed text-muted-soft">
            <p className="font-semibold text-ink">What saves here</p>
            <p className="mt-1">
              One save updates status, tracking ID, public message, operational log, and internal notes on this
              booking. Your agency and courier choices stay as they are unless you change them under{" "}
              <strong className="font-medium text-ink">Assignment</strong> below (that save uses the same button
              data).
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-soft">
                  Status &amp; tracking ID
                </h3>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <AdminFormField
                    label="Shipment status"
                    htmlFor={`${uid}-status`}
                    hint="Drives the professional timeline and customer-facing status when enabled in Site settings."
                  >
                    <select
                      id={`${uid}-status`}
                      className={inputClass}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {BOOKING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {BOOKING_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="w-full text-[11px] font-medium uppercase tracking-wide text-muted-soft">
                        Quick picks
                      </span>
                      {quickStatuses.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(normalizeBookingStatus(s))}
                          className="rounded-lg border border-border-strong bg-canvas/40 px-2.5 py-1 text-xs text-ink transition hover:border-teal/35 hover:bg-pill-hover"
                        >
                          {BOOKING_STATUS_LABELS[normalizeBookingStatus(s)]}
                        </button>
                      ))}
                    </div>
                  </AdminFormField>

                  <AdminFormField
                    label="Tracking / consignment number"
                    htmlFor={`${uid}-consignment`}
                    hint="What the customer can type on the Track page. Falls back to barcode or booking ID if empty."
                  >
                    <input
                      id={`${uid}-consignment`}
                      type="text"
                      className={inputClass}
                      value={consignment}
                      onChange={(e) => setConsignment(e.target.value)}
                      placeholder="e.g. QC-2025-001234"
                      autoComplete="off"
                    />
                  </AdminFormField>
                </div>
              </div>

              <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-soft">
                  Customer-visible message
                </h3>
                <div className="mt-4">
                  <AdminFormField
                    label="Public note"
                    htmlFor={`${uid}-public`}
                    hint="Shown on Track and customer PDFs that include notes. Plain language."
                  >
                    <textarea
                      id={`${uid}-public`}
                      rows={4}
                      className={`${inputClass} resize-y`}
                      value={publicNote}
                      onChange={(e) => setPublicNote(e.target.value)}
                      placeholder="Example: Picked up today. Expected delivery Thursday."
                    />
                    <div className="mt-3 rounded-xl border border-border bg-canvas/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
                        Ready-made lines
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="rounded-lg border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
                        >
                          <option value="">Choose a starter…</option>
                          <option value="serviceability">Serviceability verified</option>
                          <option value="pickup_soon">Pickup team heading</option>
                          <option value="picked_up">Parcel picked up</option>
                          <option value="in_transit">In transit</option>
                          <option value="out_delivery">Out for delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="hold">On hold</option>
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
                  </AdminFormField>
                </div>
              </div>

              <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-soft">
                  Logs &amp; internal notes
                </h3>
                <div className="mt-4 space-y-5">
                  <AdminFormField
                    label="Operational activity log"
                    htmlFor={`${uid}-ops`}
                    hint={
                      <>
                        Stored as <span className="font-medium text-muted">trackingNotes</span>. Shown on
                        Track only if enabled under Site settings.
                      </>
                    }
                  >
                    <textarea
                      id={`${uid}-ops`}
                      rows={6}
                      className={`${inputClass} resize-y font-mono text-xs`}
                      value={operationalLog}
                      onChange={(e) => setOperationalLog(e.target.value)}
                      placeholder="Timestamped lines, hub updates, courier notes…"
                    />
                  </AdminFormField>
                  <AdminFormField
                    label="Internal notes (staff only)"
                    htmlFor={`${uid}-internal`}
                    hint="Never shown on the public Track page."
                  >
                    <textarea
                      id={`${uid}-internal`}
                      rows={3}
                      className={`${inputClass} resize-y`}
                      value={internal}
                      onChange={(e) => setInternal(e.target.value)}
                      placeholder="Billing flags, call notes…"
                    />
                  </AdminFormField>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-soft">
            <strong className="font-medium text-ink">Addresses and parcel details</strong> on the public track
            page come from <strong className="font-medium text-ink">Booking data (JSON)</strong> in Account
            &amp; advanced.
          </p>

          <details className="rounded-lg border border-border-strong bg-canvas/30 px-3 py-2 text-xs text-muted-soft">
            <summary className="cursor-pointer font-medium text-ink">Database field names</summary>
            <ul className="mt-2 space-y-1 font-mono text-[10px] text-muted">
              <li>Shipment status → status</li>
              <li>Tracking / consignment number → consignmentNumber</li>
              <li>Public note → publicTrackingNote</li>
              <li>Operational activity log → trackingNotes</li>
              <li>Internal notes → internalNotes</li>
            </ul>
          </details>

          {state?.ok === false && state.error ? (
            <p className="text-sm text-rose-400" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok === true ? (
            <div className="space-y-1" role="status">
              <p className="text-sm text-teal">{state.message}</p>
              {state.warning ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">{state.warning}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={submitDispatch}
            className="inline-flex rounded-xl border border-teal/70 bg-teal px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save dispatch updates"}
          </button>
        </div>
      </AdminCollapsible>

      <AdminCollapsible
        id="booking-assignment"
        title="Assignment"
        description="Agency partner and courier. Saving keeps your dispatch fields above — nothing is cleared."
      >
        <div className="space-y-5">
          <p className="rounded-lg border border-border-strong/80 bg-canvas/40 px-3 py-2.5 text-sm leading-relaxed text-muted">
            Use the agency email they log in with. Customers see that partner&apos;s display name on tracking
            when applicable. Courier must be active and available unless they are already assigned to this job.
          </p>

          <AdminFormField
            label="Agency partner"
            htmlFor={`${uid}-agency`}
            hint={
              <>
                Partner&apos;s <strong className="font-medium text-muted">login email</strong>. Customers
                see the name from that user account on Track.
              </>
            }
          >
            {agencyOptions.length > 0 ? (
              <datalist id={agencyDatalistId}>
                {agencyOptions.map((a) => (
                  <option key={a.email} value={a.email}>
                    {a.name ? `${a.name} (${a.email})` : a.email}
                  </option>
                ))}
              </datalist>
            ) : null}
            <input
              id={`${uid}-agency`}
              type="text"
              className={inputClass}
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="partner@company.com"
              autoComplete="off"
              list={agencyOptions.length > 0 ? agencyDatalistId : undefined}
            />
          </AdminFormField>

          <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
            <h3 className="text-sm font-semibold text-ink">Courier</h3>
            <p className="mt-1 text-xs text-muted-soft">
              Pickup / delivery in the courier app. Cannot newly assign someone inactive, off duty, or
              already on another open job — current assignee stays selectable.
            </p>
            <div className="mt-4">
              <AdminFormField label="Courier on this job" htmlFor={`${uid}-courier`}>
                <select
                  id={`${uid}-courier`}
                  className={selectClass}
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                >
                  <option value="__unassigned">No courier yet</option>
                  {couriers.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      disabled={
                        (!c.isActive || !c.isOnDuty || c.readyForJob === false) &&
                        courierId !== c.id
                      }
                    >
                      {c.name ?? c.email} ({c.email})
                      {!c.isActive
                        ? " — Inactive"
                        : !c.isOnDuty
                          ? " — Off duty"
                          : c.readyForJob === false
                            ? ` — Busy (${c.courierActiveJobCount ?? 1} open)`
                            : " — Ready"}
                    </option>
                  ))}
                </select>
              </AdminFormField>
            </div>
          </div>

          <details className="rounded-lg border border-border-strong bg-canvas/30 px-3 py-2 text-xs text-muted-soft">
            <summary className="cursor-pointer font-medium text-ink">Database field names</summary>
            <ul className="mt-2 space-y-1 font-mono text-[10px] text-muted">
              <li>Agency partner → assignedAgency</li>
              <li>Courier on this job → courierId</li>
            </ul>
          </details>

          {state?.ok === false && state.error ? (
            <p className="text-sm text-rose-400" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok === true ? (
            <div className="space-y-1" role="status">
              <p className="text-sm text-teal">{state.message}</p>
              {state.warning ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">{state.warning}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={submitDispatch}
            className="inline-flex rounded-xl border border-teal/70 bg-teal px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save assignment"}
          </button>
        </div>
      </AdminCollapsible>
    </div>
  );
}
