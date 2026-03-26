"use client";

import { useActionState } from "react";
import type { UserRole } from "@/lib/user-role";
import { updateUserAdmin, type DataManageState } from "../dashboard/actions";

type Props = {
  userId: string;
  initialName: string | null;
  initialEmail: string;
  initialRole: UserRole;
  initialIsActive: boolean;
  initialIsOnDuty: boolean;
};

export function AdminUserEditForm({
  userId,
  initialName,
  initialEmail,
  initialRole,
  initialIsActive,
  initialIsOnDuty,
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateUserAdmin, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label
          htmlFor="admin-user-name"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Display name
        </label>
        <input
          id="admin-user-name"
          name="name"
          type="text"
          defaultValue={initialName ?? ""}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="Customer name"
          autoComplete="off"
        />
      </div>
      <div>
        <label
          htmlFor="admin-user-role"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Account type
        </label>
        <select
          id="admin-user-role"
          name="role"
          defaultValue={initialRole}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        >
          <option value="customer">Customer (site profile &amp; bookings)</option>
          <option value="staff">Team (admin panel only)</option>
          <option value="courier">Courier (assigned jobs at /courier)</option>
          <option value="agency">Agency (handover intake at /agency)</option>
        </select>
        <p className="mt-1.5 text-xs text-muted-soft">
          Staff use <span className="font-mono text-[11px]">/admin/login</span>; customers use the public Log in page.
        </p>
      </div>
      <div>
        <label
          htmlFor="admin-user-email"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Email (sign-in)
        </label>
        <input
          id="admin-user-email"
          name="email"
          type="email"
          required
          defaultValue={initialEmail}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-muted-soft">
          Changing email updates what they use to log in. Ensure the customer
          knows the new address.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-canvas/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Account availability
        </p>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink">
          <input type="hidden" name="isActive" value="off" />
          <input
            name="isActive"
            type="checkbox"
            value="on"
            defaultChecked={initialIsActive}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-2 focus:ring-teal/25"
          />
          Active account (available for new assignments)
        </label>
        {initialRole === "courier" ? (
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink">
            <input type="hidden" name="isOnDuty" value="off" />
            <input
              name="isOnDuty"
              type="checkbox"
              value="on"
              defaultChecked={initialIsOnDuty}
              className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-2 focus:ring-teal/25"
            />
            On duty (ready to receive new job)
          </label>
        ) : (
          <input type="hidden" name="isOnDuty" value={initialIsOnDuty ? "on" : "off"} />
        )}
      </div>
      <div className="rounded-xl border border-border bg-canvas/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Reset password (optional)
        </p>
        <p className="mt-1 text-xs text-muted-soft">
          Leave blank to keep the current password. Both fields must match if you
          set a new one.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="admin-user-new-pw"
              className="sr-only"
            >
              New password
            </label>
            <input
              id="admin-user-new-pw"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
              placeholder="New password"
            />
          </div>
          <div>
            <label
              htmlFor="admin-user-confirm-pw"
              className="sr-only"
            >
              Confirm new password
            </label>
            <input
              id="admin-user-confirm-pw"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
              placeholder="Confirm new password"
            />
          </div>
        </div>
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
        {pending ? "Saving…" : "Save user details"}
      </button>
    </form>
  );
}
