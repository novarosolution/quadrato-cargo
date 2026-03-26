"use client";

import { useActionState } from "react";
import {
  createStaffUserAdmin,
  type DataManageState,
} from "../dashboard/actions";

export function AdminCreateStaffForm() {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(createStaffUserAdmin, undefined);

  return (
    <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
      <h2 className="font-display text-lg font-semibold">Create team account</h2>
      <p className="mt-1 text-xs text-muted-soft">
        Staff sign in at <span className="font-mono text-[11px]">/admin/login</span>{" "}
        to manage bookings, contacts, and users. They do not use the public site
        profile.
      </p>
      <form action={formAction} className="mt-6 max-w-md space-y-4">
        <div>
          <label
            htmlFor="admin-staff-name"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Full name
          </label>
          <input
            id="admin-staff-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div>
          <label
            htmlFor="admin-staff-email"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Email (admin sign-in)
          </label>
          <input
            id="admin-staff-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div>
          <label
            htmlFor="admin-staff-pw"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Password
          </label>
          <input
            id="admin-staff-pw"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div>
          <label
            htmlFor="admin-staff-pw2"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Confirm password
          </label>
          <input
            id="admin-staff-pw2"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
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
          className="inline-flex rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create team account"}
        </button>
      </form>
    </div>
  );
}
