import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { fetchAdminOverview, fetchAdminSiteSettings } from "@/lib/api/admin-server";
import { AdminDatabaseError } from "../dashboard/DbError";
import { AdminPageBody, AdminPanel } from "@/components/admin/AdminPrimitives";
import { adminUi } from "@/components/admin/admin-ui";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { AdminSiteSettingsForm } from "./SiteSettings";

export const metadata: Metadata = {
  title: "Settings — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDataPage() {
  let res;
  let settingsRes;
  try {
    [res, settingsRes] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminSiteSettings(),
    ]);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "Unknown error";
    return <AdminDatabaseError message={message} />;
  }
  const { userCount, contactCount, bookingCount } = res.snapshot;

  return (
    <AdminPageBody narrow>
      <AdminPageHeader title="Settings" description="Site copy, branding, and exports." />

      <AdminSiteSettingsForm initialSettings={settingsRes.settings} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={adminUi.statTile}>
          <p className="text-sm font-medium text-muted-soft">Users</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {userCount}
          </p>
          <Link
            href="/admin/users"
            className="mt-4 inline-block text-sm text-teal hover:underline"
          >
            Manage users →
          </Link>
        </div>
        <div className={adminUi.statTile}>
          <p className="text-sm font-medium text-muted-soft">Contacts</p>
          <p className="mt-2 font-display text-3xl font-semibold text-teal">
            {contactCount}
          </p>
          <Link
            href="/admin/contacts"
            className="mt-4 inline-block text-sm text-teal hover:underline"
          >
            Manage contacts →
          </Link>
        </div>
        <div className={adminUi.statTile}>
          <p className="text-sm font-medium text-muted-soft">Bookings</p>
          <p className="mt-2 font-display text-3xl font-semibold text-accent">
            {bookingCount}
          </p>
          <Link
            href="/admin/bookings"
            className="mt-4 inline-block text-sm text-teal hover:underline"
          >
            Manage bookings →
          </Link>
        </div>
      </div>

      <AdminPanel as="section">
        <h2 className={adminUi.sectionTitle}>CSV export</h2>
        <p className="mt-1 text-xs text-muted-soft">Signed-in admin only. UTF-8 CSV.</p>
        <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <li>
            <Link
              href="/api/admin/exports/users"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover"
            >
              <Download className="h-4 w-4 text-ink" strokeWidth={2} />
              Export all users (CSV)
            </Link>
          </li>
          <li>
            <Link
              href="/api/admin/exports/contacts"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover"
            >
              <Download className="h-4 w-4 text-teal" strokeWidth={2} />
              Export all contacts (CSV)
            </Link>
          </li>
          <li>
            <Link
              href="/api/admin/exports/bookings"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover"
            >
              <Download className="h-4 w-4 text-accent" strokeWidth={2} />
              Export all bookings (CSV)
            </Link>
          </li>
        </ul>
      </AdminPanel>

      <AdminPanel as="section">
        <h2 className={adminUi.sectionTitle}>Quick filters</h2>
        <p className="mt-1 text-xs text-muted-soft">Saved list views.</p>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li>
            <Link
              href="/admin/bookings?status=in_transit"
              className="text-teal hover:underline"
            >
              Bookings — In transit
            </Link>
          </li>
          <li>
            <Link
              href="/admin/bookings?status=submitted"
              className="text-teal hover:underline"
            >
              Bookings — Submitted
            </Link>
          </li>
          <li>
            <Link
              href="/admin/bookings?route=international"
              className="text-teal hover:underline"
            >
              Bookings — International routes
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="text-teal hover:underline">
              Users — all
            </Link>
          </li>
          <li>
            <Link href="/admin/contacts" className="text-teal hover:underline">
              Contacts — all
            </Link>
          </li>
        </ul>
      </AdminPanel>
    </AdminPageBody>
  );
}
