"use client";

import { useActionState } from "react";
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
};

export function AdminBookingCourierAssign({
  bookingId,
  couriers,
  assignedCourierId,
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(assignCourierToBookingAdmin, undefined);

  return (
    <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
      <h2 className="font-display text-lg font-semibold">Assigned courier</h2>
      <p className="mt-1 text-xs text-muted-soft">
        Pick who collects / delivers this shipment. A courier can have several
        open jobs at once; only inactive or off-duty couriers are blocked.
        Couriers use <span className="font-mono text-[11px]">/courier</span> for
        their list.
      </p>
      <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="bookingId" value={bookingId} />
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="admin-booking-courier"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Courier
          </label>
          <select
            id="admin-booking-courier"
            name="courierUserId"
            defaultValue={assignedCourierId ?? "__unassigned"}
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          >
            <option value="__unassigned">— Unassigned —</option>
            {couriers.map((c) => (
              <option
                key={c.id}
                value={c.id}
                disabled={(!c.isActive || !c.isOnDuty) && assignedCourierId !== c.id}
              >
                {c.name ?? c.email} ({c.email})
                {!c.isActive
                  ? " — Inactive"
                  : !c.isOnDuty
                    ? " — Off duty"
                    : (c.courierActiveJobCount ?? 0) > 0
                      ? ` — ${c.courierActiveJobCount} open job(s)`
                      : " — Ready"}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save assignment"}
        </button>
      </form>
      {state?.ok === false && state.error ? (
        <p className="mt-2 text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="mt-2 text-sm text-teal" role="status">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
