"use client";

import { useActionState, useState } from "react";
import { normalizeUserRole, type UserRole } from "@/lib/user-role";
import { updateUserAdmin, type DataManageState } from "../dashboard/actions";

type Props = {
  userId: string;
  initialName: string | null;
  initialEmail: string;
  initialRole: UserRole;
  initialIsActive: boolean;
  initialIsOnDuty: boolean;
  initialAgencyAddress?: string | null;
  initialAgencyPhone?: string | null;
};

export function AdminUserEditForm({
  userId,
  initialName,
  initialEmail,
  initialRole,
  initialIsActive,
  initialIsOnDuty,
  initialAgencyAddress = "",
  initialAgencyPhone = "",
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateUserAdmin, undefined);
  const [roleDraft, setRoleDraft] = useState<UserRole>(initialRole);

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
          value={roleDraft}
          onChange={(e) => setRoleDraft(normalizeUserRole(e.target.value))}
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
          {/* Checkbox must come before hidden "off" so FormData.get("isActive") is "on" when checked (first value wins). */}
          <input
            name="isActive"
            type="checkbox"
            value="on"
            defaultChecked={initialIsActive}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-2 focus:ring-teal/25"
          />
          <input type="hidden" name="isActive" value="off" />
          Active account (user can sign in; couriers/agencies can be assigned when active)
        </label>
        {roleDraft === "courier" ? (
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink">
            <input
              name="isOnDuty"
              type="checkbox"
              value="on"
              defaultChecked={initialIsOnDuty}
              className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-2 focus:ring-teal/25"
            />
            <input type="hidden" name="isOnDuty" value="off" />
            On duty (ready to receive new job)
          </label>
        ) : (
          <input type="hidden" name="isOnDuty" value={initialIsOnDuty ? "on" : "off"} />
        )}
      </div>
      {roleDraft === "agency" ? (
        <div className="rounded-xl border border-border bg-canvas/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Agency hub (shown on /agency and customer tracking)
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="admin-user-agency-address"
                className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
              >
                Hub address
              </label>
              <textarea
                id="admin-user-agency-address"
                name="agencyAddress"
                rows={3}
                defaultValue={initialAgencyAddress ?? ""}
                className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
                placeholder="Street, city, postal, country"
              />
            </div>
            <div>
              <label
                htmlFor="admin-user-agency-phone"
                className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
              >
                Operations phone
              </label>
              <input
                id="admin-user-agency-phone"
                name="agencyPhone"
                type="tel"
                defaultValue={initialAgencyPhone ?? ""}
                className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="agencyAddress" value="" />
          <input type="hidden" name="agencyPhone" value="" />
        </>
      )}
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
