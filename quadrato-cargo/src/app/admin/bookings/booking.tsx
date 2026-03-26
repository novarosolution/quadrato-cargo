"use client";

import { useActionState } from "react";
import {
  updateCourierBookingDataAdmin,
  type DataManageState,
} from "../dashboard/actions";

type Props = {
  bookingId: string;
  routeType: string;
  payloadJson: string;
};

export function AdminBookingDataForm({
  bookingId,
  routeType,
  payloadJson,
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateCourierBookingDataAdmin, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div>
        <label
          htmlFor="admin-booking-route"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Route type
        </label>
        <select
          id="admin-booking-route"
          name="routeType"
          defaultValue={
            routeType === "international" ? "international" : "domestic"
          }
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        >
          <option value="domestic">Domestic</option>
          <option value="international">International</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="admin-booking-payload"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Payload (JSON object)
        </label>
        <textarea
          id="admin-booking-payload"
          name="payloadJson"
          rows={16}
          required
          defaultValue={payloadJson}
          spellCheck={false}
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 font-mono text-xs leading-relaxed text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
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
        {pending ? "Saving…" : "Save route & payload"}
      </button>
    </form>
  );
}
