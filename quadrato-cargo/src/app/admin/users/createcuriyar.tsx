"use client";

import { useActionState } from "react";
import { AdminPanel } from "@/components/admin/AdminPrimitives";
import { adminUi } from "@/components/admin/admin-ui";
import { adminUsersCopy } from "@/lib/admin-users-content";
import { createCourierUserAdmin, type DataManageState } from "../dashboard/actions";

export function AdminCreateCourierForm() {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(createCourierUserAdmin, undefined);

  return (
    <AdminPanel>
      <h2 className={adminUi.sectionTitle}>{adminUsersCopy.createCourierTitle}</h2>
      <p className={adminUi.sectionDesc}>{adminUsersCopy.createCourierBlurb}</p>
      <form action={formAction} className="mt-5 max-w-md space-y-4">
        <div>
          <label htmlFor="admin-courier-name" className={adminUi.labelBlock}>
            Full name
          </label>
          <input
            id="admin-courier-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={`mt-2 ${adminUi.input}`}
          />
        </div>
        <div>
          <label htmlFor="admin-courier-email" className={adminUi.labelBlock}>
            Email
          </label>
          <input
            id="admin-courier-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`mt-2 ${adminUi.input}`}
          />
        </div>
        <div>
          <label htmlFor="admin-courier-pw" className={adminUi.labelBlock}>
            Password
          </label>
          <input
            id="admin-courier-pw"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={`mt-2 ${adminUi.input}`}
          />
        </div>
        <div>
          <label htmlFor="admin-courier-pw2" className={adminUi.labelBlock}>
            Confirm password
          </label>
          <input
            id="admin-courier-pw2"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className={`mt-2 ${adminUi.input}`}
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
        <button type="submit" disabled={pending} className={`${adminUi.btnPrimary} disabled:opacity-50`}>
          {pending ? "Creating…" : "Create courier"}
        </button>
      </form>
    </AdminPanel>
  );
}
