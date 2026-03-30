"use client";

import { useActionState } from "react";
import {
  updateBookingShipmentAdmin,
  type DataManageState,
} from "../dashboard/actions";

export type BookingShipmentInitial = {
  contentsDescription: string;
  weightKg: string;
  declaredValue: string;
  dimL: string;
  dimW: string;
  dimH: string;
};

type Props = {
  bookingId: string;
  routeType: "domestic" | "international";
  initial: BookingShipmentInitial;
};

export function AdminBookingShipmentForm({
  bookingId,
  routeType,
  initial,
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateBookingShipmentAdmin, undefined);

  const field =
    "rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="routeType" value={routeType} />

      <div>
        <label
          htmlFor="admin-shipment-contents"
          className="text-xs font-medium text-muted-soft"
        >
          Contents description
        </label>
        <textarea
          id="admin-shipment-contents"
          name="contentsDescription"
          rows={3}
          defaultValue={initial.contentsDescription}
          autoComplete="off"
          className={`mt-1 w-full ${field}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="admin-shipment-weight"
            className="text-xs font-medium text-muted-soft"
          >
            Weight (kg)
          </label>
          <input
            id="admin-shipment-weight"
            name="weightKg"
            type="text"
            inputMode="decimal"
            defaultValue={initial.weightKg}
            autoComplete="off"
            className={`mt-1 w-full ${field}`}
          />
        </div>
        <div>
          <label
            htmlFor="admin-shipment-declared"
            className="text-xs font-medium text-muted-soft"
          >
            Declared value
          </label>
          <input
            id="admin-shipment-declared"
            name="declaredValue"
            type="text"
            defaultValue={initial.declaredValue}
            autoComplete="off"
            className={`mt-1 w-full ${field}`}
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-border bg-canvas/20 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Dimensions (cm)
        </legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="admin-shipment-l" className="text-xs text-muted-soft">
              L
            </label>
            <input
              id="admin-shipment-l"
              name="dimL"
              type="text"
              inputMode="decimal"
              defaultValue={initial.dimL}
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div>
            <label htmlFor="admin-shipment-w" className="text-xs text-muted-soft">
              W
            </label>
            <input
              id="admin-shipment-w"
              name="dimW"
              type="text"
              inputMode="decimal"
              defaultValue={initial.dimW}
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div>
            <label htmlFor="admin-shipment-h" className="text-xs text-muted-soft">
              H
            </label>
            <input
              id="admin-shipment-h"
              name="dimH"
              type="text"
              inputMode="decimal"
              defaultValue={initial.dimH}
              className={`mt-1 w-full ${field}`}
            />
          </div>
        </div>
      </fieldset>

      {state?.ok === false && state.error ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-teal" role="status">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save shipment details"}
      </button>
    </form>
  );
}
