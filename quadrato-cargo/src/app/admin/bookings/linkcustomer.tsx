"use client";

import { useActionState } from "react";
import {
  linkBookingToUserAdmin,
  unlinkBookingFromUserAdmin,
  type DataManageState,
} from "../dashboard/actions";

type Props = {
  bookingId: string;
  linkedUserEmail: string | null;
};

export function AdminBookingCustomerLink({
  bookingId,
  linkedUserEmail,
}: Props) {
  const [linkState, linkAction, linkPending] = useActionState<
    DataManageState | undefined,
    FormData
  >(linkBookingToUserAdmin, undefined);

  const [unlinkState, unlinkAction, unlinkPending] = useActionState<
    DataManageState | undefined,
    FormData
  >(unlinkBookingFromUserAdmin, undefined);

  if (linkedUserEmail) {
    return (
      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
        <h2 className="font-display text-lg font-semibold">Customer account</h2>
        <p className="mt-1 text-xs text-muted-soft">
          This booking is linked to{" "}
          <span className="font-medium text-ink">{linkedUserEmail}</span>. Unlink
          if it should not appear on that profile (e.g. wrong account).
        </p>
        <form action={unlinkAction} className="mt-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          {unlinkState?.ok === false && unlinkState.error ? (
            <p className="mb-2 text-sm text-rose-400" role="alert">
              {unlinkState.error}
            </p>
          ) : null}
          {unlinkState?.ok === true ? (
            <p className="mb-2 text-sm text-teal" role="status">
              {unlinkState.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={unlinkPending}
            className="rounded-xl border border-border-strong bg-canvas/50 px-4 py-2.5 text-sm font-medium text-muted transition hover:border-rose-400/40 hover:text-rose-400 disabled:opacity-50"
          >
            {unlinkPending ? "…" : "Unlink from customer account"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
      <h2 className="font-display text-lg font-semibold">Link to customer</h2>
      <p className="mt-1 text-xs text-muted-soft">
        Guest booking — not on anyone&apos;s profile. Enter the email of a user
        who registered on the site (customer role). They will see this shipment
        on their profile; you set status and tracking in Dispatch controls
        above.
      </p>
      <form action={linkAction} className="mt-4 space-y-4">
        <input type="hidden" name="bookingId" value={bookingId} />
        <div>
          <label
            htmlFor="admin-link-email"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Customer email (registered account)
          </label>
          <input
            id="admin-link-email"
            name="customerEmail"
            type="email"
            required
            autoComplete="off"
            placeholder="name@example.com"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        {linkState?.ok === false && linkState.error ? (
          <p className="text-sm text-rose-400" role="alert">
            {linkState.error}
          </p>
        ) : null}
        {linkState?.ok === true ? (
          <p className="text-sm text-teal" role="status">
            {linkState.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={linkPending}
          className="inline-flex rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {linkPending ? "Linking…" : "Link to account"}
        </button>
      </form>
    </div>
  );
}
