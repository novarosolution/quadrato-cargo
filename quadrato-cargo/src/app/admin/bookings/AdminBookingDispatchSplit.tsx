"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";

function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
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
import { CalendarDays } from "lucide-react";
import { dateInputToIso, isoToDateInputValue } from "@/lib/estimated-delivery";
import { INTERNATIONAL_PROFESSIONAL_STAGES } from "@/lib/professional-tracking-stages";

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
  /** ISO strings for customer-facing labels (track, profile, PDF). */
  customerFacingBookedIso: string;
  customerFacingUpdatedIso: string;
  estimatedDeliveryAtIso: string | null;
  /** International: 0–11 = fixed Track card; null/undefined = follow status. */
  internationalAgencyStage?: number | null;
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
  customerFacingBookedIso,
  customerFacingUpdatedIso,
  estimatedDeliveryAtIso,
  internationalAgencyStage = null,
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
  const [displayBookedLocal, setDisplayBookedLocal] = useState(() =>
    isoToDatetimeLocalValue(customerFacingBookedIso),
  );
  const [displayUpdatedLocal, setDisplayUpdatedLocal] = useState(() =>
    isoToDatetimeLocalValue(customerFacingUpdatedIso),
  );
  const [eddDateLocal, setEddDateLocal] = useState(() =>
    isoToDateInputValue(estimatedDeliveryAtIso ?? ""),
  );
  const [intlAgencyStage, setIntlAgencyStage] = useState(() =>
    internationalAgencyStage != null &&
    Number.isInteger(internationalAgencyStage) &&
    internationalAgencyStage >= 0 &&
    internationalAgencyStage < 12
      ? String(internationalAgencyStage)
      : "",
  );

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [state, formAction, pending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveManualTrackingAdmin, undefined);

  useEffect(() => {
    if (state?.ok === true) router.refresh();
  }, [state?.ok, router]);

  useEffect(() => {
    setIntlAgencyStage(
      internationalAgencyStage != null &&
        Number.isInteger(internationalAgencyStage) &&
        internationalAgencyStage >= 0 &&
        internationalAgencyStage < 12
        ? String(internationalAgencyStage)
        : "",
    );
  }, [internationalAgencyStage]);

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
    const bookedRaw = displayBookedLocal.trim();
    const updatedRaw = displayUpdatedLocal.trim();
    fd.set(
      "customerDisplayCreatedAt",
      bookedRaw ? new Date(bookedRaw).toISOString() : "",
    );
    fd.set(
      "customerDisplayUpdatedAt",
      updatedRaw ? new Date(updatedRaw).toISOString() : "",
    );
    fd.set(
      "estimatedDeliveryAt",
      eddDateLocal.trim() ? dateInputToIso(eddDateLocal.trim()) : "",
    );
    fd.set("internationalAgencyStage", intlAgencyStage);
    return fd;
  }

  function submitDispatch() {
    formAction(buildFormData());
  }

  return (
    <div className="space-y-4">
      <AdminCollapsible
        id="booking-dispatch-panel"
        title="Status, notes & dates"
        defaultOpen
      >
        <div className="space-y-6">
          <p className="text-sm text-muted-soft">
            Use <strong className="text-ink">Save</strong> at the bottom — one save updates everything in this
            panel and agency/courier below.
          </p>
          <ManualTrackingQuickLinks bookingId={bookingId} trackReference={trackReference} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-soft">
                  Status &amp; tracking number
                </h3>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <AdminFormField label="Shipment status" htmlFor={`${uid}-status`}>
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
                        Shortcuts
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

                  {String(routeType).toLowerCase() === "international" ? (
                    <AdminFormField
                      label="International Track — active macro card (0–11)"
                      htmlFor={`${uid}-intl-stage`}
                    >
                      <select
                        id={`${uid}-intl-stage`}
                        className={inputClass}
                        value={intlAgencyStage}
                        onChange={(e) => setIntlAgencyStage(e.target.value)}
                      >
                        <option value="">Auto (from shipment status)</option>
                        {INTERNATIONAL_PROFESSIONAL_STAGES.map((def, i) => (
                          <option key={def.id} value={String(i)}>
                            {i}. {def.title}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-[11px] text-muted-soft">
                        Overrides which of the 12 international steps is highlighted on customer Track. Clear to
                        follow status again.
                      </p>
                    </AdminFormField>
                  ) : null}

                  <div className="sm:col-span-2 space-y-4 border-t border-border-strong/60 pt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-soft">
                      Dates customers see
                    </p>
                    <p className="text-[11px] text-muted-soft">Track, profile, PDFs. Clear field + save = system time.</p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <AdminFormField
                        label="Booked date & time"
                        htmlFor={`${uid}-cust-created`}
                      >
                        <input
                          id={`${uid}-cust-created`}
                          type="datetime-local"
                          className={inputClass}
                          value={displayBookedLocal}
                          onChange={(e) => setDisplayBookedLocal(e.target.value)}
                        />
                      </AdminFormField>
                      <AdminFormField
                        label="Last updated"
                        htmlFor={`${uid}-cust-updated`}
                      >
                        <input
                          id={`${uid}-cust-updated`}
                          type="datetime-local"
                          className={inputClass}
                          value={displayUpdatedLocal}
                          onChange={(e) => setDisplayUpdatedLocal(e.target.value)}
                        />
                      </AdminFormField>
                    </div>
                  </div>

                  <div
                    id="booking-estimated-delivery"
                    className="sm:col-span-2 mt-2 rounded-xl border border-teal/25 bg-linear-to-br from-teal/8 to-canvas/40 p-4 ring-1 ring-teal/10 dark:from-teal/15 dark:ring-teal/20"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <CalendarDays
                        className="mt-0.5 size-5 shrink-0 text-teal"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-soft">
                          Delivery date (EDD)
                        </p>
                        <p className="text-[11px] leading-relaxed text-muted-soft">
                          <span className="font-medium text-ink">International:</span> +10 day default until you set
                          a date. <span className="font-medium text-ink">Domestic:</span> EDD only if you set it.
                          Clear + save removes custom date.
                        </p>
                        <AdminFormField label="Delivery date" htmlFor={`${uid}-edd`}>
                          <input
                            id={`${uid}-edd`}
                            type="date"
                            className={`${inputClass} max-w-[11.5rem]`}
                            value={eddDateLocal}
                            onChange={(e) => setEddDateLocal(e.target.value)}
                          />
                        </AdminFormField>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-soft">
                  Message on Track
                </h3>
                <div className="mt-4">
                  <AdminFormField label="Customer note" htmlFor={`${uid}-public`}>
                    <textarea
                      id={`${uid}-public`}
                      rows={4}
                      className={`${inputClass} resize-y`}
                      value={publicNote}
                      onChange={(e) => setPublicNote(e.target.value)}
                      placeholder="Example: Picked up today. Expected delivery Thursday."
                    />
                    <div className="mt-3 rounded-xl border border-border bg-canvas/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">Starters</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="rounded-lg border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
                        >
                          <option value="">Pick text…</option>
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
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-soft">Staff only</h3>
                <div className="mt-4 space-y-5">
                  <AdminFormField label="Operations log" htmlFor={`${uid}-ops`}>
                    <textarea
                      id={`${uid}-ops`}
                      rows={6}
                      className={`${inputClass} resize-y font-mono text-xs`}
                      value={operationalLog}
                      onChange={(e) => setOperationalLog(e.target.value)}
                      placeholder="Timestamped lines, hub updates, courier notes…"
                    />
                  </AdminFormField>
                  <AdminFormField label="Internal notes" htmlFor={`${uid}-internal`}>
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
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </AdminCollapsible>

      <AdminCollapsible id="booking-assignment" title="Agency & courier">
        <div className="space-y-5">
          <AdminFormField label="Agency (login email)" htmlFor={`${uid}-agency`}>
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
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </AdminCollapsible>
    </div>
  );
}
