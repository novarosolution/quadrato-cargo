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
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { CourierDutyToggle } from "./dutytogle";

export const metadata: Metadata = {
  title: "My deliveries",
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
            title="Unable to load courier assignments"
            description="Courier jobs could not be loaded from backend. Check backend server status and refresh this page."
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
    <div className="stack-page content-wide gap-6 max-sm:gap-5">
      <AppSurfacePageHeader
        title="My deliveries"
        description="Jobs assigned to you by dispatch. Open a row to start job, verify pickup OTP, and share handover details with agency."
      />

      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
        <h2 className="font-display text-lg font-semibold">Duty status</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Set yourself on duty when available for new assignments, or off duty
          when not available.
        </p>
        <div className="mt-4">
          <CourierDutyToggle
            isActive={courier.isActive}
            initialIsOnDuty={courier.isOnDuty}
            openJobCount={courier.openJobCount}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border-strong">
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
                  No assignments yet. Dispatch will assign bookings from
                  admin.
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
                        className="text-teal hover:underline"
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
    </div>
  );
}
