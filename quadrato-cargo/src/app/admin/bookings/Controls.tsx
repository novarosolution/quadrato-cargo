"use client";

import { useActionState, useId, useMemo, useState } from "react";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  AdminFormField,
  adminInputClassName,
} from "@/components/admin/AdminFormField";
import {
  saveManualTrackingAdmin,
  type BookingAdminUpdateState,
} from "../dashboard/actions";

export type AgencyOption = {
  email: string;
  name: string | null;
};

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
  routeType: string;
  pickupPin?: string | null;
  assignedAgency?: string | null;
  agencyOptions?: AgencyOption[];
  currentStatus: string;
  consignmentNumber: string | null;
  publicTrackingNote: string | null;
  /** Operational activity log (DB `trackingNotes`); may be shown on public tracking when enabled. */
  operationalTrackingNotes: string | null;
  internalNotes: string | null;
  couriers: AdminBookingCourierOption[];
  assignedCourierId: string | null;
};

const inputClass = adminInputClassName();
const selectClass = adminInputClassName();

export function AdminBookingControls({
  bookingId,
  routeType,
  pickupPin,
  assignedAgency,
  agencyOptions = [],
  currentStatus,
  consignmentNumber,
  publicTrackingNote,
  operationalTrackingNotes,
  internalNotes,
  couriers,
  assignedCourierId,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const agencyDatalistId = `admin-agency-dl-${uid}`;
  const status = normalizeBookingStatus(currentStatus);
  const [statusValue, setStatusValue] = useState<string>(status);
  const [trackingValue, setTrackingValue] = useState(publicTrackingNote ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [state, formAction, pending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveManualTrackingAdmin, undefined);
  const nowLabel = new Date().toLocaleString();

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
    const line = `[${nowLabel}] ${text}`;
    setTrackingValue((prev) =>
      mode === "replace" ? line : prev.trim() ? `${prev}\n${line}` : line,
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="rounded-lg border border-border-strong/80 bg-canvas/40 px-3 py-2.5 text-sm leading-relaxed text-muted">
        Use the fields below to control what appears on the public Track page (when those sections are
        turned on in Site settings), PDFs, and courier tools.{" "}
        <span className="font-medium text-ink">One button at the bottom saves everything on this form.</span>
      </p>
      <AdminFormField
        label="Where is the shipment now?"
        htmlFor="admin-booking-status"
        hint="Pick the step that matches reality. Customers may see this label on Track if you show the status badge there."
      >
        <select
          id="admin-booking-status"
          name="status"
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
          className={inputClass}
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
              onClick={() => setStatusValue(s)}
              className="rounded-lg border border-border-strong bg-canvas/40 px-2.5 py-1 text-xs text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              {BOOKING_STATUS_LABELS[normalizeBookingStatus(s)]}
            </button>
          ))}
        </div>
      </AdminFormField>

      <AdminFormField
        label="Which agency partner is handling this?"
        htmlFor="admin-assigned-agency"
        hint={
          <>
            Enter the same <strong className="font-medium text-muted">email address</strong> the
            partner uses to sign in. Customers see the <strong className="font-medium text-muted">name</strong>{" "}
            from that staff account on Track, not the email. Choose from the list or type the email.
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
          id="admin-assigned-agency"
          name="assignedAgency"
          type="text"
          defaultValue={assignedAgency ?? ""}
          className={inputClass}
          placeholder="Partner’s sign-in email, e.g. partner@company.com"
          autoComplete="off"
          list={agencyOptions.length > 0 ? agencyDatalistId : undefined}
        />
      </AdminFormField>

      <AdminFormField
        label="Tracking number the customer types in"
        htmlFor="admin-tracking-id"
        hint="Shown on Track and labels. Leave blank to fall back to the booking ID or barcode."
      >
        <input
          id="admin-tracking-id"
          name="consignmentNumber"
          type="text"
          defaultValue={consignmentNumber ?? ""}
          className={inputClass}
          placeholder="e.g. QC-2025-001234 or your own reference"
          autoComplete="off"
        />
      </AdminFormField>

      <AdminFormField
        label="Short message to the customer"
        htmlFor="admin-tracking"
        hint="Plain language update: pickup done, delay, customs, etc. Shown on Track and on PDFs that include customer notes."
      >
        <textarea
          id="admin-tracking"
          name="publicTrackingNote"
          rows={4}
          value={trackingValue}
          onChange={(e) => setTrackingValue(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="Example: Your parcel was picked up today. Expected delivery Thursday."
        />
        <div className="mt-3 rounded-xl border border-border bg-canvas/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Ready-made sentences (saves typing)
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="rounded-lg border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
            >
              <option value="">Choose a starter line…</option>
              <option value="serviceability">Serviceability verified</option>
              <option value="pickup_soon">Pickup team heading now</option>
              <option value="picked_up">Parcel picked up</option>
              <option value="in_transit">In transit update</option>
              <option value="out_delivery">Out for delivery</option>
              <option value="delivered">Delivered</option>
              <option value="hold">On hold / action required</option>
            </select>
            <button
              type="button"
              onClick={() => applyTemplate("append")}
              className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              Add to note
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("replace")}
              className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              Replace note
            </button>
          </div>
        </div>
      </AdminFormField>

      <AdminFormField
        label="Full activity timeline (technical log)"
        htmlFor="admin-operational-log"
        hint={
          <>
            Longer running log: system lines plus courier and hub updates with dates. Customers only
            see this block if you turn on <span className="font-medium text-muted">Operational activity log</span>{" "}
            under Site settings → Public tracking page.
          </>
        }
      >
        <textarea
          id="admin-operational-log"
          name="operationalTrackingNotes"
          rows={6}
          defaultValue={operationalTrackingNotes ?? ""}
          className={`${inputClass} resize-y font-mono text-xs`}
          placeholder="Each line can include a date. Edit or add entries as needed."
        />
      </AdminFormField>

      <AdminFormField
        label="Private notes for your team only"
        htmlFor="admin-internal"
        hint="Never shown to the customer on Track or on their profile."
      >
        <textarea
          id="admin-internal"
          name="internalNotes"
          rows={3}
          defaultValue={internalNotes ?? ""}
          className={`${inputClass} resize-y`}
          placeholder="Reminders, phone calls, billing flags — staff only"
        />
      </AdminFormField>

      <div className="border-t border-border-strong pt-4">
        <h3 className="text-sm font-semibold text-ink">Driver / pickup person</h3>
        <p className="mb-3 mt-1 text-sm text-muted-soft">
          Pick who handles pickup and delivery in the courier app. You cannot newly assign someone who
          is inactive, off duty, or already busy on another open job — but you can keep the current
          person selected.
        </p>
        <AdminFormField
          label="Courier on this job"
          htmlFor="admin-booking-courier"
          hint="They use the Courier area of the website to see this booking."
        >
          <select
            id="admin-booking-courier"
            name="courierUserId"
            defaultValue={assignedCourierId ?? "__unassigned"}
            className={selectClass}
          >
            <option value="__unassigned">No courier yet</option>
            {couriers.map((c) => (
              <option
                key={c.id}
                value={c.id}
                disabled={
                  (!c.isActive || !c.isOnDuty || c.readyForJob === false) &&
                  assignedCourierId !== c.id
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

      {state?.ok === false && state.error ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <div className="space-y-1" role="status">
          <p className="text-sm text-teal">{state.message}</p>
          {state.warning ? (
            <p className="text-sm text-amber-800 dark:text-amber-200" role="alert">
              {state.warning}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-xl border border-teal/70 bg-teal px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save all tracking changes"}
      </button>
    </form>
  );
}
