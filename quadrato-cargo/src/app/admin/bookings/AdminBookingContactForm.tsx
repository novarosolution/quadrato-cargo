"use client";

import { useActionState } from "react";
import {
  updateBookingContactAdmin,
  type DataManageState,
} from "../dashboard/actions";

export type BookingContactInitial = {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientStreet: string;
  recipientCity: string;
  recipientPostal: string;
  recipientCountry: string;
};

type Props = {
  bookingId: string;
  routeType: "domestic" | "international";
  initial: BookingContactInitial;
};

export function AdminBookingContactForm({
  bookingId,
  routeType,
  initial,
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateBookingContactAdmin, undefined);

  const field =
    "rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="routeType" value={routeType} />

      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset className="space-y-3 rounded-xl border border-border bg-canvas/20 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Sender
          </legend>
          <div>
            <label
              htmlFor="admin-contact-sender-name"
              className="text-xs font-medium text-muted-soft"
            >
              Name
            </label>
            <input
              id="admin-contact-sender-name"
              name="senderName"
              type="text"
              defaultValue={initial.senderName}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div>
            <label
              htmlFor="admin-contact-sender-email"
              className="text-xs font-medium text-muted-soft"
            >
              Email
            </label>
            <input
              id="admin-contact-sender-email"
              name="senderEmail"
              type="email"
              defaultValue={initial.senderEmail}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div>
            <label
              htmlFor="admin-contact-sender-phone"
              className="text-xs font-medium text-muted-soft"
            >
              Phone
            </label>
            <input
              id="admin-contact-sender-phone"
              name="senderPhone"
              type="tel"
              defaultValue={initial.senderPhone}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-border bg-canvas/20 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Recipient
          </legend>
          <div>
            <label
              htmlFor="admin-contact-recipient-name"
              className="text-xs font-medium text-muted-soft"
            >
              Name
            </label>
            <input
              id="admin-contact-recipient-name"
              name="recipientName"
              type="text"
              defaultValue={initial.recipientName}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div>
            <label
              htmlFor="admin-contact-recipient-email"
              className="text-xs font-medium text-muted-soft"
            >
              Email
            </label>
            <input
              id="admin-contact-recipient-email"
              name="recipientEmail"
              type="email"
              defaultValue={initial.recipientEmail}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div>
            <label
              htmlFor="admin-contact-recipient-phone"
              className="text-xs font-medium text-muted-soft"
            >
              Phone
            </label>
            <input
              id="admin-contact-recipient-phone"
              name="recipientPhone"
              type="tel"
              defaultValue={initial.recipientPhone}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div>
            <label
              htmlFor="admin-contact-recipient-street"
              className="text-xs font-medium text-muted-soft"
            >
              Street / address line
            </label>
            <input
              id="admin-contact-recipient-street"
              name="recipientStreet"
              type="text"
              defaultValue={initial.recipientStreet}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="admin-contact-recipient-city"
                className="text-xs font-medium text-muted-soft"
              >
                City
              </label>
              <input
                id="admin-contact-recipient-city"
                name="recipientCity"
                type="text"
                defaultValue={initial.recipientCity}
                autoComplete="off"
                className={`mt-1 w-full ${field}`}
              />
            </div>
            <div>
              <label
                htmlFor="admin-contact-recipient-postal"
                className="text-xs font-medium text-muted-soft"
              >
                Postal
              </label>
              <input
                id="admin-contact-recipient-postal"
                name="recipientPostal"
                type="text"
                defaultValue={initial.recipientPostal}
                autoComplete="off"
                className={`mt-1 w-full ${field}`}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="admin-contact-recipient-country"
              className="text-xs font-medium text-muted-soft"
            >
              Country
            </label>
            <input
              id="admin-contact-recipient-country"
              name="recipientCountry"
              type="text"
              defaultValue={initial.recipientCountry}
              autoComplete="off"
              className={`mt-1 w-full ${field}`}
            />
          </div>
        </fieldset>
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
        {pending ? "Saving…" : "Save contacts"}
      </button>
    </form>
  );
}
