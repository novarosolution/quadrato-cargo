"use client";

import { useActionState } from "react";
import {
  updateBookingPickupAdmin,
  type DataManageState,
} from "../dashboard/actions";

export type BookingPickupInitial = {
  collectionMode: string;
  pickupDate: string;
  pickupTimeSlot: string;
  pickupTimeSlotCustom: string;
  pickupPreference: string;
  instructions: string;
  senderStreet: string;
  senderCity: string;
  senderState: string;
  senderPostal: string;
  senderCountry: string;
};

type Props = {
  bookingId: string;
  routeType: "domestic" | "international";
  initial: BookingPickupInitial;
};

const field =
  "mt-1 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

export function AdminBookingPickupForm({ bookingId, routeType, initial }: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateBookingPickupAdmin, undefined);

  const mode =
    initial.collectionMode === "instant" || initial.collectionMode === "scheduled"
      ? initial.collectionMode
      : "scheduled";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="routeType" value={routeType} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="admin-pickup-mode" className="text-xs font-medium text-muted-soft">
            Collection
          </label>
          <select
            id="admin-pickup-mode"
            name="collectionMode"
            defaultValue={mode}
            className={field}
          >
            <option value="instant">Instant</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
        <div>
          <label htmlFor="admin-pickup-date" className="text-xs font-medium text-muted-soft">
            Pickup date
          </label>
          <input
            id="admin-pickup-date"
            name="pickupDate"
            type="text"
            defaultValue={initial.pickupDate}
            placeholder="YYYY-MM-DD"
            autoComplete="off"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="admin-pickup-slot" className="text-xs font-medium text-muted-soft">
            Time slot
          </label>
          <input
            id="admin-pickup-slot"
            name="pickupTimeSlot"
            type="text"
            defaultValue={initial.pickupTimeSlot}
            autoComplete="off"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="admin-pickup-slot-custom" className="text-xs font-medium text-muted-soft">
            Custom time text
          </label>
          <input
            id="admin-pickup-slot-custom"
            name="pickupTimeSlotCustom"
            type="text"
            defaultValue={initial.pickupTimeSlotCustom}
            autoComplete="off"
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="admin-pickup-preference" className="text-xs font-medium text-muted-soft">
          Pickup note (shown to ops / customer summary)
        </label>
        <textarea
          id="admin-pickup-preference"
          name="pickupPreference"
          rows={3}
          defaultValue={initial.pickupPreference}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="admin-pickup-instructions" className="text-xs font-medium text-muted-soft">
          Special instructions
        </label>
        <textarea
          id="admin-pickup-instructions"
          name="instructions"
          rows={2}
          defaultValue={initial.instructions}
          className={field}
        />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-border bg-canvas/20 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Pickup address (sender)
        </legend>
        <div>
          <label htmlFor="admin-pickup-street" className="text-xs font-medium text-muted-soft">
            Street
          </label>
          <input
            id="admin-pickup-street"
            name="senderStreet"
            type="text"
            defaultValue={initial.senderStreet}
            autoComplete="off"
            className={field}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="admin-pickup-city" className="text-xs font-medium text-muted-soft">
              City
            </label>
            <input
              id="admin-pickup-city"
              name="senderCity"
              type="text"
              defaultValue={initial.senderCity}
              autoComplete="off"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="admin-pickup-state" className="text-xs font-medium text-muted-soft">
              State / province
            </label>
            <input
              id="admin-pickup-state"
              name="senderState"
              type="text"
              defaultValue={initial.senderState}
              placeholder="e.g. Gujarat"
              autoComplete="off"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="admin-pickup-postal" className="text-xs font-medium text-muted-soft">
              Postal / ZIP
            </label>
            <input
              id="admin-pickup-postal"
              name="senderPostal"
              type="text"
              defaultValue={initial.senderPostal}
              autoComplete="off"
              className={field}
            />
          </div>
        </div>
        <div>
          <label htmlFor="admin-pickup-country" className="text-xs font-medium text-muted-soft">
            Country
          </label>
          <input
            id="admin-pickup-country"
            name="senderCountry"
            type="text"
            defaultValue={initial.senderCountry}
            autoComplete="off"
            className={field}
          />
        </div>
      </fieldset>

      {state?.ok === false ? (
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
        className="inline-flex rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save pickup"}
      </button>
    </form>
  );
}
