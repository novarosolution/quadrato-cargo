import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { fetchAdminOverview, fetchAdminSiteSettings } from "@/lib/api/admin-server";
import { AdminDatabaseError } from "../dashboard/DbError";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { AdminSiteSettingsForm } from "./SiteSettings";

export const metadata: Metadata = {
  title: "Data & site — Admin",
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
    <div className="stack-page content-narrow gap-10 max-sm:gap-8">
      <AdminPageHeader
        title="Data & website"
        description="Edit public phone and email, site banner, PDF branding, and tracking layout — then export or open lists below."
      />

      <AdminSiteSettingsForm initialSettings={settingsRes.settings} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/60 p-6">
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
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/60 p-6">
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
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/60 p-6">
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

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
        <h2 className="font-display text-lg font-semibold">CSV export</h2>
        <p className="mt-2 text-sm text-muted">
          You must be signed in to admin. Each link downloads a UTF-8 CSV (opens in
          Excel or Sheets).
        </p>
        <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <li>
            <a
              href="/api/admin/exports/users"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover"
            >
              <Download className="h-4 w-4 text-ink" strokeWidth={2} />
              Export all users (CSV)
            </a>
          </li>
          <li>
            <a
              href="/api/admin/exports/contacts"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover"
            >
              <Download className="h-4 w-4 text-teal" strokeWidth={2} />
              Export all contacts (CSV)
            </a>
          </li>
          <li>
            <a
              href="/api/admin/exports/bookings"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-canvas/40 px-4 py-3 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover"
            >
              <Download className="h-4 w-4 text-accent" strokeWidth={2} />
              Export all bookings (CSV)
            </a>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
        <h2 className="font-display text-lg font-semibold">Quick filters</h2>
        <p className="mt-2 text-sm text-muted">
          Jump to list views with common filters (search &amp; edit on each row).
        </p>
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
              Bookings — Submitted (needs action)
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
              All users — search by name or email
            </Link>
          </li>
          <li>
            <Link href="/admin/contacts" className="text-teal hover:underline">
              All contacts — search full text
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
