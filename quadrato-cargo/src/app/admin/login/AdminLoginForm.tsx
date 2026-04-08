"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginState } from "./actions";

const initial: AdminLoginState = { ok: false, message: "" };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initial);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" : "bg-rose-500/15 text-rose-800 dark:text-rose-200"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <div>
        <label htmlFor="admin-email" className="text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1.5 w-full rounded-xl border border-border-strong bg-canvas px-4 py-3 text-base text-ink"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-xl border border-border-strong bg-canvas px-4 py-3 text-base text-ink"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full rounded-xl py-3 text-base font-semibold disabled:opacity-50 sm:text-sm"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
