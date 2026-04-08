"use client";

import { useActionState } from "react";
import { AdminPanel } from "@/components/admin/AdminPrimitives";
import { adminUi } from "@/components/admin/admin-ui";
import { adminUsersCopy } from "@/lib/admin-users-content";
import { createAgencyUserAdmin, type DataManageState } from "../dashboard/actions";

export function AdminCreateAgencyForm() {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(createAgencyUserAdmin, undefined);

  return (
    <AdminPanel>
      <h2 className={adminUi.sectionTitle}>{adminUsersCopy.createAgencyTitle}</h2>
      <p className={adminUi.sectionDesc}>{adminUsersCopy.createAgencyBlurb}</p>
      <form action={formAction} className="mt-5 max-w-2xl space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        <div className="sm:col-span-2">
          <label htmlFor="admin-agency-name" className={adminUi.labelBlock}>
            Agency / hub name
          </label>
          <input
            id="admin-agency-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={`mt-2 ${adminUi.input}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="admin-agency-email" className={adminUi.labelBlock}>
            Email
          </label>
          <input
            id="admin-agency-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`mt-2 ${adminUi.input}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="admin-agency-address" className={adminUi.labelBlock}>
            Hub address (optional)
          </label>
          <textarea
            id="admin-agency-address"
            name="agencyAddress"
            rows={2}
            className={`mt-2 resize-y ${adminUi.input}`}
            placeholder="Street, city"
          />
        </div>
        <div>
          <label htmlFor="admin-agency-city" className={adminUi.labelBlock}>
            Hub city (optional)
          </label>
          <input
            id="admin-agency-city"
            name="agencyCity"
            type="text"
            maxLength={80}
            className={`mt-2 ${adminUi.input}`}
            placeholder="Timeline city on Track"
          />
        </div>
        <div>
          <label htmlFor="admin-agency-phone" className={adminUi.labelBlock}>
            Phone (optional)
          </label>
          <input id="admin-agency-phone" name="agencyPhone" type="tel" className={`mt-2 ${adminUi.input}`} />
        </div>
        <div>
          <label htmlFor="admin-agency-pw" className={adminUi.labelBlock}>
            Password
          </label>
          <input
            id="admin-agency-pw"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={`mt-2 ${adminUi.input}`}
          />
        </div>
        <div>
          <label htmlFor="admin-agency-pw2" className={adminUi.labelBlock}>
            Confirm password
          </label>
          <input
            id="admin-agency-pw2"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className={`mt-2 ${adminUi.input}`}
          />
        </div>
        <div className="sm:col-span-2">
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
            className={`${adminUi.btnPrimary} mt-2 disabled:opacity-50`}
          >
            {pending ? "Creating…" : "Create agency"}
          </button>
        </div>
      </form>
    </AdminPanel>
  );
}
