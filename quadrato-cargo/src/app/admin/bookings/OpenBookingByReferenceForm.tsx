"use client";

import { useActionState } from "react";
import {
  openAdminBookingByReference,
  type OpenBookingByRefState,
} from "../dashboard/actions";
import { adminInputClassName } from "@/components/admin/AdminFormField";

const inputClass = adminInputClassName();

export function OpenBookingByReferenceForm() {
  const [state, action, pending] = useActionState<
    OpenBookingByRefState | undefined,
    FormData
  >(openAdminBookingByReference, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label
          htmlFor="admin-open-booking-ref"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Jump to a booking
        </label>
        <input
          id="admin-open-booking-ref"
          name="reference"
          type="text"
          required
          minLength={6}
          maxLength={40}
          pattern="[A-Za-z0-9-]{6,40}"
          placeholder="Paste tracking number, QC barcode, or internal booking ID"
          className={`${inputClass} mt-2`}
          autoComplete="off"
          disabled={pending}
        />
        <p className="mt-1 text-xs text-muted-soft">
          Uses the same search as your customers’ Track page — opens the full admin page for that
          shipment.
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 shrink-0 rounded-xl border border-teal/70 bg-teal px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
      >
        {pending ? "Opening…" : "Go to booking"}
      </button>
      {state?.ok === false ? (
        <p className="basis-full text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
