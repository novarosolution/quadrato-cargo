"use client";

import { useActionState } from "react";
import { AdminFormField, adminInputClassName } from "@/components/admin/AdminFormField";
import {
  assignCourierToBookingAdmin,
  type DataManageState,
} from "../dashboard/actions";

type CourierOption = {
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
  couriers: CourierOption[];
  assignedCourierId: string | null;
  embedded?: boolean;
};

const selectClass = adminInputClassName();

export function AdminBookingCourierAssign({
  bookingId,
  couriers,
  assignedCourierId,
  embedded = false,
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(assignCourierToBookingAdmin, undefined);

  const form = (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="bookingId" value={bookingId} />
      <AdminFormField label="Courier" htmlFor="admin-booking-courier" className="min-w-0 flex-1 sm:min-w-[220px]">
        <select
          id="admin-booking-courier"
          name="courierUserId"
          defaultValue={assignedCourierId ?? "__unassigned"}
          className={selectClass}
        >
          <option value="__unassigned">— Unassigned —</option>
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-teal/70 bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save assignment"}
      </button>
      {state?.ok === false && state.error ? (
        <p className="w-full text-sm text-rose-400 sm:order-last" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="w-full text-sm text-teal sm:order-last" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );

  if (embedded) {
    return (
      <>
        <p className="mb-4 text-sm text-muted-soft">
          Couriers use <span className="font-mono text-[11px]">/courier</span> for jobs. Inactive
          couriers cannot be assigned.
        </p>
        {form}
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
      <h2 className="font-display text-lg font-semibold">Assigned courier</h2>
      <p className="mt-1 text-xs text-muted-soft">
        Pick who collects / delivers this shipment. Couriers sign in on the site and open{" "}
        <span className="font-mono text-[11px]">/courier</span> for their jobs. Inactive couriers are
        shown but cannot be assigned.
      </p>
      <div className="mt-4">{form}</div>
    </div>
  );
}
