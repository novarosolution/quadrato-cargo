import type { Metadata } from "next";
import Link from "next/link";
import {
  AdminEmptyState,
  AdminPageBody,
  AdminPanel,
  AdminTableShell,
} from "@/components/admin/AdminPrimitives";
import { adminUi } from "@/components/admin/admin-ui";
import {
  fetchAdminNetwork,
  type AdminNetworkAgency,
  type AdminNetworkCourier,
} from "@/lib/api/admin-server";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
  type BookingStatusId,
} from "@/lib/booking-status";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";

export const metadata: Metadata = {
  title: "Network — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function sortStatusEntries(byStatus: Record<string, number>): Array<[string, number]> {
  return Object.entries(byStatus)
    .filter(([, n]) => n > 0)
    .sort((a, b) => {
      const ia = BOOKING_STATUSES.indexOf(normalizeBookingStatus(a[0]) as BookingStatusId);
      const ib = BOOKING_STATUSES.indexOf(normalizeBookingStatus(b[0]) as BookingStatusId);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
}

function StatusMix({ byStatus }: { byStatus: Record<string, number> }) {
  const rows = sortStatusEntries(byStatus);
  if (rows.length === 0) {
    return <span className="text-muted-soft">—</span>;
  }
  return (
    <div className="flex max-w-[min(100%,28rem)] flex-wrap gap-1">
      {rows.map(([st, n]) => {
        const id = normalizeBookingStatus(st);
        return (
          <span
            key={st}
            className="inline-flex rounded-md border border-border-strong bg-canvas/60 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-ink"
            title={st}
          >
            {BOOKING_STATUS_LABELS[id]}: {n}
          </span>
        );
      })}
    </div>
  );
}

function formatJoined(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default async function AdminNetworkPage() {
  let data: Awaited<ReturnType<typeof fetchAdminNetwork>> | null = null;
  let loadError: string | null = null;
  try {
    data = await fetchAdminNetwork();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load network overview.";
  }

  if (loadError || !data?.ok) {
    return (
      <AdminPageBody>
        <AdminPageHeader title="Network" description="Could not load overview." />
        <AdminPanel variant="muted" className="border-rose-500/30">
          <p className="text-sm text-rose-600 dark:text-rose-300">{loadError || "Unable to load data."}</p>
        </AdminPanel>
      </AdminPageBody>
    );
  }

  const agencies: AdminNetworkAgency[] = data.agencies || [];
  const couriers: AdminNetworkCourier[] = data.couriers || [];
  const globalCounts = [...(data.allBookingStatusCounts || [])].sort((a, b) => {
    const ia = BOOKING_STATUSES.indexOf(normalizeBookingStatus(a.status) as BookingStatusId);
    const ib = BOOKING_STATUSES.indexOf(normalizeBookingStatus(b.status) as BookingStatusId);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return (
    <AdminPageBody className="gap-8">
      <AdminPageHeader
        title="Network"
        description={
          <>
            Agency &amp; courier workload. Edit accounts in{" "}
            <Link href="/admin/users" className="font-medium text-teal hover:underline">
              Users
            </Link>
            .
          </>
        }
      />

      <AdminPanel as="section" aria-labelledby="network-global-status">
        <h2 id="network-global-status" className={adminUi.sectionTitle}>
          All bookings — status
        </h2>
        {globalCounts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No bookings yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {globalCounts.map((row) => {
              const id = normalizeBookingStatus(row.status);
              return (
                <span
                  key={row.status}
                  className="inline-flex rounded-full border border-border-strong bg-teal/10 px-3 py-1 text-xs font-semibold text-ink"
                >
                  {BOOKING_STATUS_LABELS[id]}: {row.count}
                </span>
              );
            })}
          </div>
        )}
      </AdminPanel>

      <AdminPanel as="section" aria-labelledby="network-agencies-heading">
        <h2 id="network-agencies-heading" className={adminUi.sectionTitle}>
          Agencies ({agencies.length})
        </h2>
        <p className="mt-1 text-xs text-muted-soft">
          Counts where dispatch agency email matches this login (case-insensitive).
        </p>
        <AdminTableShell plain className="mt-4">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className={adminUi.theadSimple}>
              <tr>
                <th className={adminUi.thRelaxed}>Display name</th>
                <th className={adminUi.thRelaxed}>Login email</th>
                <th className={adminUi.thRelaxed}>Hub address</th>
                <th className={adminUi.thRelaxed}>Hub phone</th>
                <th className={adminUi.thRelaxed}>State</th>
                <th className={adminUi.thRelaxed}>Assigned total</th>
                <th className={adminUi.thRelaxed}>By status</th>
                <th className={adminUi.thRelaxed}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <AdminEmptyState>No agency accounts yet. Create one under Users.</AdminEmptyState>
                  </td>
                </tr>
              ) : (
                agencies.map((a) => (
                  <tr key={a.id} className={adminUi.trHoverBorder}>
                    <td className="max-w-[140px] truncate px-4 py-3 font-medium text-ink">
                      {a.name?.trim() ? a.name : "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted">{a.email}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted" title={a.agencyAddress ?? ""}>
                      {a.agencyAddress?.trim() ? a.agencyAddress : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                      {a.agencyPhone?.trim() ? a.agencyPhone : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      <span
                        className={
                          a.isActive
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400"
                            : "rounded-full bg-rose-500/15 px-2 py-0.5 font-medium text-rose-600"
                        }
                      >
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink">
                      {a.assignedBookingTotal}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusMix byStatus={a.assignedByStatus} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-col gap-1.5 text-xs">
                        <Link href={`/admin/users/${a.id}`} className="text-teal hover:underline">
                          Edit profile
                        </Link>
                        <Link
                          href={`/admin/bookings?agency=${encodeURIComponent(a.email)}`}
                          prefetch={false}
                          className="text-teal hover:underline"
                        >
                          Bookings list
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTableShell>
      </AdminPanel>

      <AdminPanel as="section" aria-labelledby="network-couriers-heading">
        <h2 id="network-couriers-heading" className={adminUi.sectionTitle}>
          Couriers ({couriers.length})
        </h2>
        <p className="mt-1 text-xs text-muted-soft">
          Open = active pipeline statuses. Total = all assignments for this courier.
        </p>
        <AdminTableShell plain className="mt-4">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className={adminUi.theadSimple}>
              <tr>
                <th className={adminUi.thRelaxed}>Name</th>
                <th className={adminUi.thRelaxed}>Email</th>
                <th className={adminUi.thRelaxed}>Joined</th>
                <th className={adminUi.thRelaxed}>Availability</th>
                <th className={adminUi.thRelaxed}>Open jobs</th>
                <th className={adminUi.thRelaxed}>Total assigned</th>
                <th className={adminUi.thRelaxed}>By status</th>
                <th className={adminUi.thRelaxed}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {couriers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <AdminEmptyState>No courier accounts yet. Create one under Users.</AdminEmptyState>
                  </td>
                </tr>
              ) : (
                couriers.map((c) => (
                  <tr key={c.id} className={adminUi.trHoverBorder}>
                    <td className="max-w-[140px] truncate px-4 py-3 font-medium text-ink">
                      {c.name?.trim() ? c.name : "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted">{c.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted-soft">
                      {formatJoined(c.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <span
                          className={
                            c.isActive
                              ? "w-fit rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400"
                              : "w-fit rounded-full bg-rose-500/15 px-2 py-0.5 font-medium text-rose-600"
                          }
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                        <span
                          className={
                            c.isOnDuty
                              ? "w-fit rounded-full bg-teal/15 px-2 py-0.5 font-medium text-teal"
                              : "w-fit rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-800 dark:text-amber-400"
                          }
                        >
                          {c.isOnDuty ? "On duty" : "Off duty"}
                        </span>
                        {c.readyForJob ? (
                          <span className="w-fit rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                            Assignable
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums font-medium text-ink">
                      {c.courierOpenJobs}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">
                      {c.courierJobTotal}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusMix byStatus={c.courierByStatus} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/admin/users/${c.id}`} className="text-xs text-teal hover:underline">
                        View / edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTableShell>
      </AdminPanel>
    </AdminPageBody>
  );
}
