"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { authFieldClass, authInputClass } from "@/components/auth/authStyles";
import { publicClass, publicUi } from "@/components/public/public-ui";
import { postLogoutApi } from "@/lib/api/auth-client";
import {
  updateProfileNameApi,
  updateProfilePasswordApi,
} from "@/lib/api/profile-client";

type ProfileUpdateState =
  | { ok: true; message: string }
  | { ok: false; error: string };

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-strong/70 bg-linear-to-b from-surface-elevated/40 to-canvas/20 p-5 shadow-sm sm:p-6">
      <div className="flex gap-3 border-b border-border-strong/50 pb-4">
        <span className={publicUi.profileIconWell}>
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold tracking-tight text-ink">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-soft">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export function ProfileEditForm({ initialName }: { initialName: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<ProfileUpdateState | undefined>(undefined);
  const [pwState, setPwState] = useState<ProfileUpdateState | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [pwPending, setPwPending] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    setPending(true);
    const result = await updateProfileNameApi(name);
    setState(result);
    setPending(false);
    if (result.ok) router.refresh();
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

  async function onSignOut() {
    setSignOutPending(true);
    try {
      await postLogoutApi();
    } finally {
      setSignOutPending(false);
      window.location.assign("/public/login");
    }
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        icon={UserRound}
        title="Display name"
        description="Shown on bookings, labels, and in your account header."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className={authFieldClass}>
            <label htmlFor="profile-name" className="text-sm font-semibold text-ink">
              Name
            </label>
            <input
              id="profile-name"
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={initialName ?? ""}
              maxLength={120}
              className={authInputClass}
              placeholder="Your full name"
            />
          </div>
          {state?.ok === false && state.error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok === true ? (
            <p className="text-sm font-medium text-teal" role="status">
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className={publicClass(publicUi.btnPrimary, "w-full sm:w-auto disabled:opacity-50")}
          >
            {pending ? "Saving…" : "Save name"}
          </button>
        </form>
      </SettingsSection>

      <SettingsSection
        icon={KeyRound}
        title="Password"
        description="Use your current password, then a new one — at least 8 characters, with letters and numbers."
      >
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <div className={authFieldClass}>
            <label htmlFor="profile-current-password" className="text-sm font-semibold text-ink">
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
              <label htmlFor="profile-new-password" className="text-sm font-semibold text-ink">
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
              <label htmlFor="profile-confirm-password" className="text-sm font-semibold text-ink">
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
          {pwState?.ok === false && pwState.error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
              {pwState.error}
            </p>
          ) : null}
          {pwState?.ok === true ? (
            <p className="text-sm font-medium text-teal" role="status">
              {pwState.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pwPending}
            className={publicClass(
              publicUi.btnSecondary,
              "w-full font-bold sm:w-auto disabled:opacity-50",
            )}
          >
            {pwPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </SettingsSection>

      <SettingsSection
        icon={ShieldCheck}
        title="Session"
        description="Sign out on this device when you are finished, especially on a shared computer."
      >
        <button
          type="button"
          disabled={signOutPending}
          onClick={() => void onSignOut()}
          className={publicClass(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/[0.06] px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-500/12 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/15",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {signOutPending ? "Signing out…" : "Sign out"}
        </button>
      </SettingsSection>
    </div>
  );
}
