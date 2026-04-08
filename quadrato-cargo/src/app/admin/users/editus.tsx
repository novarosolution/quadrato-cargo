"use client";

import { useActionState, useState } from "react";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
import { adminUsersCopy } from "@/lib/admin-users-content";
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
  initialAgencyCity?: string | null;
};

const fieldStack = "space-y-4";

export function AdminUserEditForm({
  userId,
  initialName,
  initialEmail,
  initialRole,
  initialIsActive,
  initialIsOnDuty,
  initialAgencyAddress = "",
  initialAgencyPhone = "",
  initialAgencyCity = "",
}: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateUserAdmin, undefined);
  const [roleDraft, setRoleDraft] = useState<UserRole>(initialRole);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={userId} />
      <div className={fieldStack}>
        <div>
          <label htmlFor="admin-user-name" className={adminUi.labelBlock}>
            Display name
          </label>
          <input
            id="admin-user-name"
            name="name"
            type="text"
            defaultValue={initialName ?? ""}
            className={`mt-2 ${adminUi.input}`}
            placeholder="Name"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="admin-user-role" className={adminUi.labelBlock}>
            Account type
          </label>
          <select
            id="admin-user-role"
            name="role"
            value={roleDraft}
            onChange={(e) => setRoleDraft(normalizeUserRole(e.target.value))}
            className={adminUi.selectMt}
          >
            <option value="customer">Customer</option>
            <option value="staff">Team</option>
            <option value="courier">Courier</option>
            <option value="agency">Agency</option>
          </select>
          <p className="mt-1.5 text-xs text-muted-soft">{adminUsersCopy.editRoleHint}</p>
        </div>
        <div>
          <label htmlFor="admin-user-email" className={adminUi.labelBlock}>
            Email (sign-in)
          </label>
          <input
            id="admin-user-email"
            name="email"
            type="email"
            required
            defaultValue={initialEmail}
            className={`mt-2 ${adminUi.input}`}
            autoComplete="off"
          />
          <p className="mt-1.5 text-xs text-muted-soft">{adminUsersCopy.editEmailHint}</p>
        </div>
      </div>

      <div className={adminClass(adminUi.rowCard, "space-y-3")}>
        <p className={adminUi.labelBlock}>Availability</p>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            name="isActive"
            type="checkbox"
            value="on"
            defaultChecked={initialIsActive}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-2 focus:ring-teal/25"
          />
          <input type="hidden" name="isActive" value="off" />
          Active (can sign in)
        </label>
        {roleDraft === "courier" ? (
          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input
              name="isOnDuty"
              type="checkbox"
              value="on"
              defaultChecked={initialIsOnDuty}
              className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-2 focus:ring-teal/25"
            />
            <input type="hidden" name="isOnDuty" value="off" />
            On duty
          </label>
        ) : (
          <input type="hidden" name="isOnDuty" value={initialIsOnDuty ? "on" : "off"} />
        )}
      </div>

      {roleDraft === "agency" ? (
        <div className={adminClass(adminUi.rowCard, "space-y-4")}>
          <div>
            <p className={adminUi.labelBlock}>{adminUsersCopy.editAgencyBlockTitle}</p>
            <p className="mt-1 text-xs text-muted-soft">{adminUsersCopy.editAgencyBlockHint}</p>
          </div>
          <div>
            <label htmlFor="admin-user-agency-address" className={adminUi.labelBlock}>
              Hub address
            </label>
            <textarea
              id="admin-user-agency-address"
              name="agencyAddress"
              rows={3}
              defaultValue={initialAgencyAddress ?? ""}
              className={`mt-2 resize-y ${adminUi.input}`}
              placeholder="Street, city, postal, country"
            />
          </div>
          <div>
            <label htmlFor="admin-user-agency-city" className={adminUi.labelBlock}>
              Hub city (public tracking)
            </label>
            <input
              id="admin-user-agency-city"
              name="agencyCity"
              type="text"
              maxLength={80}
              defaultValue={initialAgencyCity ?? ""}
              className={`mt-2 ${adminUi.input}`}
              placeholder="e.g. Rajkot"
            />
          </div>
          <div>
            <label htmlFor="admin-user-agency-phone" className={adminUi.labelBlock}>
              Operations phone
            </label>
            <input
              id="admin-user-agency-phone"
              name="agencyPhone"
              type="tel"
              defaultValue={initialAgencyPhone ?? ""}
              className={`mt-2 ${adminUi.input}`}
            />
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="agencyAddress" value="" />
          <input type="hidden" name="agencyPhone" value="" />
          <input type="hidden" name="agencyCity" value="" />
        </>
      )}

      <div className={adminClass(adminUi.rowCard, "space-y-3")}>
        <p className={adminUi.labelBlock}>New password (optional)</p>
        <p className="text-xs text-muted-soft">{adminUsersCopy.editPasswordHint}</p>
        <div className="space-y-3">
          <input
            id="admin-user-new-pw"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className={adminUi.input}
            placeholder="New password"
          />
          <input
            id="admin-user-confirm-pw"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={adminUi.input}
            placeholder="Confirm"
          />
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
      <button type="submit" disabled={pending} className={`${adminUi.btnPrimary} disabled:opacity-50`}>
        {pending ? adminUsersCopy.editSaving : adminUsersCopy.editSave}
      </button>
    </form>
  );
}
