"use client";

import { useActionState, useState } from "react";
import {
  updateBookingShipmentAdmin,
  type DataManageState,
} from "../dashboard/actions";

export type ShipmentParcelInitial = {
  contentsDescription: string;
  weightKg: string;
  declaredValue: string;
  dimL: string;
  dimW: string;
  dimH: string;
};

export type BookingShipmentInitial = {
  parcelCount: string;
  parcels: ShipmentParcelInitial[];
};

type Props = {
  bookingId: string;
  routeType: "domestic" | "international";
  initial: BookingShipmentInitial;
};

function emptyParcelRow(): ShipmentParcelInitial {
  return {
    contentsDescription: "",
    weightKg: "",
    declaredValue: "",
    dimL: "",
    dimW: "",
    dimH: "",
  };
}

export function AdminBookingShipmentForm({
  bookingId,
  routeType,
  initial,
}: Props) {
  const startCount = Math.min(
    25,
    Math.max(
      1,
      Number.parseInt(String(initial.parcelCount).trim(), 10) ||
        initial.parcels.length ||
        1,
    ),
  );
  const [parcelCountState, setParcelCountState] = useState(startCount);
  const [rows, setRows] = useState<ShipmentParcelInitial[]>(() => {
    const p = [...initial.parcels];
    while (p.length < startCount) p.push(emptyParcelRow());
    return p.slice(0, startCount);
  });

  function onParcelCountInput(raw: string) {
    const n = Math.min(25, Math.max(1, Number.parseInt(raw.trim(), 10) || 1));
    setParcelCountState(n);
    setRows((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push(emptyParcelRow());
      return next;
    });
  }

  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateBookingShipmentAdmin, undefined);

  const field =
    "rounded-lg border border-border-strong bg-canvas/50 px-2 py-1.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="routeType" value={routeType} />

      <div className="max-w-[12rem]">
        <label
          htmlFor="admin-shipment-parcels"
          className="text-xs font-medium text-muted-soft"
        >
          Number of parcels
        </label>
        <input
          id="admin-shipment-parcels"
          name="parcelCount"
          type="text"
          inputMode="numeric"
          value={String(parcelCountState)}
          onChange={(e) => onParcelCountInput(e.target.value)}
          placeholder="1–25"
          autoComplete="off"
          className={`mt-1 w-full ${field}`}
        />
      </div>

      <p className="text-xs text-muted-soft">
        One row per parcel. Saving updates the booking payload, invoice line slots, and customer-facing
        summaries (combined contents text is built from all rows).
      </p>

      <div className="overflow-x-auto rounded-xl border border-border-strong">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border-strong bg-canvas/30 text-xs font-semibold uppercase tracking-wide text-muted-soft">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Contents</th>
              <th className="px-3 py-2">Weight (kg)</th>
              <th className="px-3 py-2">Declared value</th>
              <th className="px-3 py-2">L (cm)</th>
              <th className="px-3 py-2">W (cm)</th>
              <th className="px-3 py-2">H (cm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-strong">
            {rows.map((row, i) => (
              <tr key={i} className="align-top">
                <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-muted-soft">
                  {i + 1}
                </td>
                <td className="px-2 py-2">
                  <textarea
                    name={`parcel_${i}_contentsDescription`}
                    rows={2}
                    defaultValue={row.contentsDescription}
                    autoComplete="off"
                    className={`min-w-[180px] ${field}`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    name={`parcel_${i}_weightKg`}
                    type="text"
                    inputMode="decimal"
                    defaultValue={row.weightKg}
                    autoComplete="off"
                    className={`w-24 ${field}`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    name={`parcel_${i}_declaredValue`}
                    type="text"
                    defaultValue={row.declaredValue}
                    autoComplete="off"
                    className={`min-w-[120px] ${field}`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    name={`parcel_${i}_dimL`}
                    type="text"
                    inputMode="decimal"
                    defaultValue={row.dimL}
                    className={`w-16 ${field}`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    name={`parcel_${i}_dimW`}
                    type="text"
                    inputMode="decimal"
                    defaultValue={row.dimW}
                    className={`w-16 ${field}`}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    name={`parcel_${i}_dimH`}
                    type="text"
                    inputMode="decimal"
                    defaultValue={row.dimH}
                    className={`w-16 ${field}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
