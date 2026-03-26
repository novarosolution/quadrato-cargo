"use client";

import { useActionState } from "react";
import {
  createAgencyUserAdmin,
  type DataManageState,
} from "../dashboard/actions";

export function AdminCreateAgencyForm() {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(createAgencyUserAdmin, undefined);

  return (
    <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
      <h2 className="font-display text-lg font-semibold">Create agency account</h2>
      <p className="mt-1 text-xs text-muted-soft">
        Agency teams sign in on normal <strong className="font-medium text-muted">Log in</strong>{" "}
        and open <span className="font-mono text-[11px]">/agency</span> to verify handover using
        reference + OTP.
      </p>
      <form action={formAction} className="mt-6 max-w-md space-y-4">
        <div>
          <label
            htmlFor="admin-agency-name"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Agency / contact name
          </label>
          <input
            id="admin-agency-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div>
          <label
            htmlFor="admin-agency-email"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Email (sign-in)
          </label>
          <input
            id="admin-agency-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div>
          <label
            htmlFor="admin-agency-pw"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Password
          </label>
          <input
            id="admin-agency-pw"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div>
          <label
            htmlFor="admin-agency-pw2"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Confirm password
          </label>
          <input
            id="admin-agency-pw2"
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
          className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create agency account"}
        </button>
      </form>
    </div>
  );
}
