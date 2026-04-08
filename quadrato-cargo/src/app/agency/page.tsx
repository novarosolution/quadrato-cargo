import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { fetchAgencyBookingsServer } from "@/lib/api/agency-client";
import { agencyDefaults, agencyIntakePageCopy, agencyMeta } from "@/lib/agency-content";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { mapAgencyBookingsToIntakeRows } from "./_lib/map-agency-intake-rows";
import { AgencyBookingsListClient } from "./AgencyBookingsListClient";

export const metadata: Metadata = {
  title: agencyMeta.pageTitleIntake,
  robots: { index: false, follow: false },
};

export default async function AgencyIntakePage() {
  const session = await auth();
  const u = session?.user;
  const agencyIdentity = {
    displayName: (u?.name && u.name.trim()) || agencyDefaults.hubDisplayName,
    agencyAddress: u?.agencyAddress?.trim() || null,
    agencyPhone: u?.agencyPhone?.trim() || null,
    agencyCity: u?.agencyCity?.trim() || null,
  };

  const cookieHeader = (await cookies()).toString();
  const res = await fetchAgencyBookingsServer(cookieHeader);
  const rows = res.ok ? mapAgencyBookingsToIntakeRows(res.data.bookings || []) : [];
  const count = rows.length;

  return (
    <div className="stack-page content-wide gap-8 max-sm:gap-6">
      <AppSurfacePageHeader
        eyebrow={agencyIntakePageCopy.pageEyebrow}
        title={agencyIntakePageCopy.headerTitle}
        description={agencyIntakePageCopy.headerLead}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-2xl border border-border-strong/60 bg-surface-elevated/50 px-4 py-2 text-center text-sm tabular-nums text-ink">
              <span className="block text-2xl font-semibold tracking-tight">{count}</span>
              <span className="text-xs font-medium text-muted-soft">assigned</span>
            </span>
          </div>
        }
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold tracking-tight text-ink">Queue</h2>
            <p className="mt-0.5 max-w-xl text-sm text-muted">{agencyIntakePageCopy.bookingsSectionBlurb}</p>
          </div>
        </div>
        <AgencyBookingsListClient rows={rows} agencyIdentity={agencyIdentity} />
      </section>

      <p className="text-center text-xs text-muted-soft sm:text-left">
        <Link href="/courier" className="font-medium text-teal hover:underline">
          {agencyIntakePageCopy.footerPickupLinkLabel}
        </Link>
        <span className="text-muted-soft"> · </span>
        <Link href="/agency/guide" prefetch={false} className="font-medium text-teal hover:underline">
          Guide
        </Link>
      </p>
    </div>
  );
}
