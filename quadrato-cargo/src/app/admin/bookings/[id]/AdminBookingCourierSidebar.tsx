"use client";

import Link from "next/link";
import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { adminInputClassName } from "@/components/admin/AdminFormField";
import {
  assignCourierToBookingAdmin,
  type DataManageState,
} from "@/app/admin/dashboard/actions";
import type { AdminBookingCourierOption } from "../AdminBookingDispatchSplit";

type Props = {
  bookingId: string;
  couriers: AdminBookingCourierOption[];
  assignedCourierId: string | null;
  assignedCourier: { name: string | null; email: string } | null;
};

const copy = {
  title: "Courier on this job",
  hint: "Update the assigned driver from any booking section — no need to open Dispatch first.",
  current: "Currently assigned",
  unassigned: "No courier assigned",
  selectLabel: "Courier",
  submit: "Update courier",
  pending: "Updating…",
  dispatchLink: "Full dispatch & status",
} as const;

export function AdminBookingCourierSidebar({
  bookingId,
  couriers,
  assignedCourierId,
  assignedCourier,
}: Props) {
  const router = useRouter();
  const uid = useId().replace(/:/g, "");
  const selectId = `admin-sidebar-courier-${uid}`;
  const [state, formAction, pending] = useActionState<DataManageState | undefined, FormData>(
    assignCourierToBookingAdmin,
    undefined,
  );

  useEffect(() => {
    if (state?.ok === true) router.refresh();
  }, [state?.ok, router]);

  const selectClass = adminInputClassName();

  return (
    <div className="mb-4 rounded-2xl border border-border-strong/80 bg-linear-to-b from-surface-elevated/70 to-surface-elevated/45 p-3 shadow-[0_8px_32px_-20px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.04] backdrop-blur-md dark:from-surface-elevated/50 dark:to-surface-elevated/30 dark:shadow-black/40 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-soft">{copy.title}</p>
      <p className="mt-1 text-xs leading-snug text-muted">{copy.hint}</p>

      <div className="mt-3 rounded-lg border border-border-strong/70 bg-canvas/30 px-3 py-2 text-sm">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">{copy.current}</p>
        {assignedCourier ? (
          <p className="mt-1 font-medium text-ink">
            {assignedCourier.name?.trim() || assignedCourier.email}
          </p>
        ) : (
          <p className="mt-1 text-muted">{copy.unassigned}</p>
        )}
        {assignedCourier?.name?.trim() ? (
          <p className="mt-0.5 text-xs text-muted-soft">{assignedCourier.email}</p>
        ) : null}
      </div>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="bookingId" value={bookingId} />
        <div>
          <label htmlFor={selectId} className="block text-[11px] font-semibold text-muted-soft">
            {copy.selectLabel}
          </label>
          <select
            id={selectId}
            name="courierUserId"
            defaultValue={assignedCourierId ?? "__unassigned"}
            className={`${selectClass} mt-1.5 text-sm`}
          >
            <option value="__unassigned">No courier yet</option>
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

        {state?.ok === false ? (
          <p className="text-xs text-rose-400" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <p className="text-xs text-teal" role="status">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl border border-teal/70 bg-teal px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
        >
          {pending ? copy.pending : copy.submit}
        </button>
      </form>

      <Link
        href={`/admin/bookings/${bookingId}/dispatch`}
        prefetch={false}
        className="mt-3 block text-center text-xs font-semibold text-teal hover:underline"
      >
        {copy.dispatchLink}
      </Link>
    </div>
  );
}
