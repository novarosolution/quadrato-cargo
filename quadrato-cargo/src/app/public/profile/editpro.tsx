"use client";

import { useState } from "react";
import { authFieldClass, authInputClass } from "@/components/auth/authStyles";
import {
  updateProfileNameApi,
  updateProfilePasswordApi,
} from "@/lib/api/profile-client";
type ProfileUpdateState =
  | { ok: true; message: string }
  | { ok: false; error: string };

export function ProfileEditForm({ initialName }: { initialName: string | null }) {
  const [state, setState] = useState<ProfileUpdateState | undefined>(undefined);
  const [pwState, setPwState] = useState<ProfileUpdateState | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [pwPending, setPwPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    setPending(true);
    const result = await updateProfileNameApi(name);
    setState(result);
    setPending(false);
  }

  async function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const currentPassword = String(fd.get("currentPassword") ?? "");
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    setPwPending(true);
    const result = await updateProfilePasswordApi({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setPwState(result);
    if (result.ok) form.reset();
    setPwPending(false);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className={authFieldClass}>
          <label htmlFor="profile-name" className="text-sm font-medium text-ink">
            Display name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={initialName ?? ""}
            maxLength={120}
            className={authInputClass}
            placeholder="Your name"
          />
          <p className="text-xs text-muted-soft">
            Shown on bookings and in your account.
          </p>
        </div>
        {state?.ok === false && state.error ? (
          <p className="text-sm text-rose-500" role="alert">
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
          className="inline-flex rounded-full border border-teal/70 bg-teal px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-teal/20 transition hover:bg-teal/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
      </form>

      <form
        onSubmit={onPasswordSubmit}
        className="space-y-4 rounded-2xl border border-border-strong bg-canvas/30 p-4 sm:p-5"
      >
        <p className="text-sm font-semibold text-ink">Change password</p>
        <div className={authFieldClass}>
          <label htmlFor="profile-current-password" className="text-sm font-medium text-ink">
            Current password
          </label>
          <input
            id="profile-current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={authInputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={authFieldClass}>
            <label htmlFor="profile-new-password" className="text-sm font-medium text-ink">
              New password
            </label>
            <input
              id="profile-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={authInputClass}
            />
          </div>
          <div className={authFieldClass}>
            <label htmlFor="profile-confirm-password" className="text-sm font-medium text-ink">
              Confirm new password
            </label>
            <input
              id="profile-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={authInputClass}
            />
          </div>
        </div>
        <p className="text-xs text-muted-soft">
          Use at least 8 characters with a mix of letters, numbers, and symbols.
        </p>
        {pwState?.ok === false && pwState.error ? (
          <p className="text-sm text-rose-500" role="alert">
            {pwState.error}
          </p>
        ) : null}
        {pwState?.ok === true ? (
          <p className="text-sm text-teal" role="status">
            {pwState.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pwPending}
          className="inline-flex rounded-full border border-border-strong bg-canvas/60 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover disabled:opacity-50"
        >
          {pwPending ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
