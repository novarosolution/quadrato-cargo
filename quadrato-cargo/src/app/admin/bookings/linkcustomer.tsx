"use client";

import { useActionState } from "react";
import { AdminFormField, adminInputClassName } from "@/components/admin/AdminFormField";
import {
  linkBookingToUserAdmin,
  unlinkBookingFromUserAdmin,
  type DataManageState,
} from "../dashboard/actions";

type Props = {
  bookingId: string;
  linkedUserEmail: string | null;
  /** Omit outer card/title when nested inside AdminCollapsible */
  embedded?: boolean;
};

const inputClass = adminInputClassName();

export function AdminBookingCustomerLink({
  bookingId,
  linkedUserEmail,
  embedded = false,
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
    const body = (
      <>
        <p className="text-sm text-muted-soft">
          Linked to{" "}
          <span className="font-medium text-ink">{linkedUserEmail}</span>. Unlink if this booking
          should not appear on that profile.
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
      </>
    );

    if (embedded) return body;

    return (
      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
        <h2 className="font-display text-lg font-semibold">Customer account</h2>
        <div className="mt-4">{body}</div>
      </div>
    );
  }

  const body = (
    <>
      {!embedded ? null : (
        <p className="mb-4 text-sm text-muted-soft">
          Guest booking — not on anyone{"'"}s profile. Enter a registered customer email; they will
          see this shipment on their profile.
        </p>
      )}
      <form action={linkAction} className="space-y-4">
        <input type="hidden" name="bookingId" value={bookingId} />
        <AdminFormField
          label="Customer email (registered account)"
          htmlFor="admin-link-email"
        >
          <input
            id="admin-link-email"
            name="customerEmail"
            type="email"
            required
            autoComplete="off"
            placeholder="name@example.com"
            className={inputClass}
          />
        </AdminFormField>
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
          className="inline-flex rounded-xl border border-teal/70 bg-teal px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-50"
        >
          {linkPending ? "Linking…" : "Link to account"}
        </button>
      </form>
    </>
  );

  if (embedded) return body;

  return (
    <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
      <h2 className="font-display text-lg font-semibold">Link to customer</h2>
      <p className="mt-1 text-xs text-muted-soft">
        Guest booking — not on anyone{"'"}s profile. Enter the email of a user who registered on
        the site (customer role). They will see this shipment on their profile; you set status and
        tracking in Dispatch {"&"} tracking.
      </p>
      <div className="mt-6">{body}</div>
    </div>
  );
}
