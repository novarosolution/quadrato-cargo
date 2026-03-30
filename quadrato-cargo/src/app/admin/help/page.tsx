import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";

export const metadata: Metadata = {
  title: "Admin help",
  robots: { index: false, follow: false },
};

export default function AdminHelpPage() {
  return (
    <div className="stack-page content-narrow gap-8">
      <AdminPageHeader
        title="Admin quick reference"
        description="Use this panel to run the public site and operations. Full technical detail lives in the repo under docs/."
      />

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-base font-semibold text-ink">Who signs in here</h2>
        <p className="mt-2 text-sm text-muted">
          Only the credentials configured on the API as{" "}
          <code className="rounded bg-pill px-1 py-0.5 text-xs">ADMIN_EMAIL</code> and{" "}
          <code className="rounded bg-pill px-1 py-0.5 text-xs">ADMIN_PASSWORD</code>. Staff,
          courier, and agency users are separate accounts (created under Users) and use their own
          dashboards — not this login form.
        </p>
      </section>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-base font-semibold text-ink">Main areas</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
          <li>
            <strong className="text-ink">Dashboard</strong> — counts, recent activity, status
            breakdown.
          </li>
          <li>
            <strong className="text-ink">Reports</strong> — monthly aggregates.
          </li>
          <li>
            <strong className="text-ink">Data &amp; site</strong> — public phone/email, banner, PDF
            branding, tracking toggles, <strong>CSV exports</strong> for users, contacts, and bookings.
          </li>
          <li>
            <strong className="text-ink">Users</strong> — create courier/agency/staff, edit roles,
            reset access.
          </li>
          <li>
            <strong className="text-ink">Contacts</strong> — contact form submissions.
          </li>
          <li>
            <strong className="text-ink">Bookings</strong> — search, open by reference, edit status,
            dispatch, pickup and delivery details, shipment fields, invoice, timeline, JSON fallback.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-base font-semibold text-ink">Documentation</h2>
        <p className="mt-2 text-sm text-muted">
          In the project folder, open{" "}
          <code className="rounded bg-pill px-1.5 py-0.5 text-xs">
            quadrato-cargo/docs/ROLES_AND_FLOWS.md
          </code>{" "}
          for API routes, roles, and customer/courier/agency flows.{" "}
          <code className="rounded bg-pill px-1.5 py-0.5 text-xs">
            quadrato-cargo/docs/ADMIN_IMPROVEMENT_ROADMAP.md
          </code>{" "}
          lists planned upgrades.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/settings"
            prefetch={false}
            className="text-sm font-medium text-teal hover:underline"
          >
            Data &amp; site →
          </Link>
          <Link
            href="/admin/bookings"
            prefetch={false}
            className="text-sm font-medium text-teal hover:underline"
          >
            Bookings →
          </Link>
        </div>
      </section>
    </div>
  );
}
