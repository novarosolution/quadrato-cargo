import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageBody, AdminPanel } from "@/components/admin/AdminPrimitives";
import { adminUi } from "@/components/admin/admin-ui";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";

export const metadata: Metadata = {
  title: "Admin help",
  robots: { index: false, follow: false },
};

export default function AdminHelpPage() {
  return (
    <AdminPageBody className="gap-8 max-sm:gap-6">
      <AdminPageHeader
        title="Help"
        description="Quick reference for the admin console. Couriers, agencies, and customers use separate apps with their own logins."
      />

      <AdminPanel as="section" aria-labelledby="help-access-heading">
        <h2 id="help-access-heading" className={adminUi.sectionTitle}>
          Access
        </h2>
        <p className={`${adminUi.sectionDesc} mt-2 max-w-2xl`}>
          Console login uses environment credentials{" "}
          <code className="rounded-md bg-pill px-1.5 py-0.5 text-[11px] text-ink">ADMIN_EMAIL</code> /{" "}
          <code className="rounded-md bg-pill px-1.5 py-0.5 text-[11px] text-ink">ADMIN_PASSWORD</code>.
        </p>
      </AdminPanel>

      <AdminPanel as="section" aria-labelledby="help-areas-heading">
        <h2 id="help-areas-heading" className={adminUi.sectionTitle}>
          Areas
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          <li className={adminUi.rowCard}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">Overview</p>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">Dashboard</span> — counts and recent activity.
            </p>
          </li>
          <li className={adminUi.rowCard}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">Operations</p>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">Bookings</span> — list, filters, and detail tabs.
            </p>
          </li>
          <li className={adminUi.rowCard}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">People</p>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">Users / Network / Contacts</span> — accounts and workload.
            </p>
          </li>
          <li className={adminUi.rowCard}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">Config</p>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">Settings / Reports</span> — site copy, exports, monthly CSV.
            </p>
          </li>
        </ul>

        <div className={`${adminUi.divider} mt-8 flex flex-wrap gap-3 pt-6`}>
          <Link href="/admin/settings" prefetch={false} className={adminUi.btnSecondary}>
            Settings
          </Link>
          <Link href="/admin/bookings" prefetch={false} className={adminUi.btnSecondary}>
            Bookings
          </Link>
        </div>
      </AdminPanel>
    </AdminPageBody>
  );
}
