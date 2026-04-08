import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  fetchCourierBookingsServer,
  fetchCourierStatusServer,
} from "@/lib/api/courier-client";
import {
  courierIntroBullets,
  courierMeta,
  courierPageCopy,
} from "@/lib/courier-content";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { RoleStepSection } from "@/components/role/RoleStepSection";
import { roleUi } from "@/components/role/role-ui";
import { CourierDutyToggle } from "./dutytogle";

export const metadata: Metadata = {
  title: courierMeta.pageTitle,
  robots: { index: false, follow: false },
};

export default async function CourierDashboardPage() {
  const cookieHeader = (await cookies()).toString();
  const [res, statusRes] = await Promise.all([
    fetchCourierBookingsServer(cookieHeader),
    fetchCourierStatusServer(cookieHeader),
  ]);
  if (!res.ok || !statusRes.ok) {
    return (
      <div className="stack-page content-narrow">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-ink">
          <AppSurfacePageHeader
            title={courierPageCopy.loadErrorTitle}
            description={courierPageCopy.loadErrorBlurb}
          />
        </div>
      </div>
    );
  }
  const rows = (res.data.bookings || []).map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));
  const courier = statusRes.data.courier;

  return (
    <div className="stack-page content-wide gap-10 max-sm:gap-8">
      <AppSurfacePageHeader
        eyebrow={courierPageCopy.pageEyebrow}
        title={courierPageCopy.headerTitle}
        description={
          <ul className="list-disc space-y-2.5 pl-5 marker:text-teal/80">
            {courierIntroBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        }
      />

      <div className="flex flex-col gap-8 max-sm:gap-6">
        <RoleStepSection step={1} title={courierPageCopy.dutyTitle} description={courierPageCopy.dutyBlurb}>
          <CourierDutyToggle
            isActive={courier.isActive}
            initialIsOnDuty={courier.isOnDuty}
            openJobCount={courier.openJobCount}
          />
        </RoleStepSection>

        <RoleStepSection
          step={2}
          variant="plain"
          title={courierPageCopy.assignmentsTitle}
          description={courierPageCopy.assignmentsBlurb}
        >
          <div className={roleUi.tableWrap}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border-strong bg-surface-elevated/80">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-soft">Date</th>
                  <th className="px-4 py-3 font-medium text-muted-soft">Route</th>
                  <th className="px-4 py-3 font-medium text-muted-soft">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-soft">Reference</th>
                  <th className="px-4 py-3 font-medium text-muted-soft">Agency</th>
                  <th className="px-4 py-3 font-medium text-muted-soft">Pickup</th>
                  <th className="px-4 py-3 font-medium text-muted-soft">Latest update</th>
                  <th className="px-4 py-3 font-medium text-muted-soft">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted">
                      {courierPageCopy.emptyAssignments}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const st = normalizeBookingStatus(r.status);
                    const payload = (r.payload && typeof r.payload === "object"
                      ? r.payload
                      : {}) as Record<string, unknown>;
                    const sender = (payload.sender && typeof payload.sender === "object"
                      ? payload.sender
                      : {}) as Record<string, unknown>;
                    const pickupCity =
                      typeof sender.city === "string" ? sender.city : "";
                    const pickupPin =
                      typeof sender.postal === "string" ? sender.postal : "";
                    const updateSnippet =
                      typeof r.trackingNotes === "string" && r.trackingNotes.trim()
                        ? r.trackingNotes.trim().split("\n").at(-1)
                        : "No update yet";
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-border transition hover:bg-pill-hover"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-muted-soft">
                          {r.createdAt.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 capitalize">{r.routeType}</td>
                        <td className="px-4 py-3 text-xs font-medium text-teal">
                          {BOOKING_STATUS_LABELS[st]}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3">
                          <span className="font-mono text-xs text-ink">
                            {r.consignmentNumber || r.id}
                          </span>
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-muted">
                          {r.assignedAgency ?? "—"}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-muted">
                          {[pickupCity, pickupPin].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-muted">
                          {updateSnippet}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/courier/bookings/${r.id}`}
                            className="font-medium text-teal hover:underline"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </RoleStepSection>
      </div>

      <p className="text-sm text-muted">
        {courierPageCopy.footerAgencyPrefix}{" "}
        <Link href="/agency" className="font-medium text-teal hover:underline">
          {courierPageCopy.footerAgencyLinkLabel}
        </Link>
      </p>
    </div>
  );
}
