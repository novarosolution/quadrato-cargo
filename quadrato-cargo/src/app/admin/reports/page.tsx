import type { Metadata } from "next";
import Link from "next/link";
import { fetchAdminMonthlyReport } from "@/lib/api/admin-server";
import { AdminMonthlyReportCsvButton } from "@/components/admin/AdminMonthlyReportCsvButton";
import { AdminPageBody, AdminPanel } from "@/components/admin/AdminPrimitives";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { AdminDatabaseError } from "../dashboard/DbError";

export const metadata: Metadata = {
  title: "Reports — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ months?: string }>;
};

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const months = Math.max(
    3,
    Math.min(24, Number.parseInt(String(params.months ?? "6"), 10) || 6),
  );

  let report;
  try {
    const res = await fetchAdminMonthlyReport(months);
    report = res.report;
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "Unknown error";
    return <AdminDatabaseError message={message} />;
  }

  return (
    <AdminPageBody className="gap-8 max-sm:gap-6">
      <AdminPageHeader
        title="Reports"
        description="Monthly totals — CSV matches the tables."
        actions={
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Range
              </span>
              {[6, 12, 18].map((m) => (
                <Link
                  key={m}
                  href={`/admin/reports?months=${m}`}
                  prefetch={false}
                  className={adminClass(
                    adminUi.shortcutPill,
                    m === months ? adminUi.presetActive : adminUi.shortcutPillIdle,
                  )}
                >
                  {m} mo
                </Link>
              ))}
            </div>
            <AdminMonthlyReportCsvButton report={report} months={months} />
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className={adminUi.statTile}>
          <p className="text-sm text-muted-soft">Users</p>
          <p className="mt-2 font-display text-3xl font-semibold">{report.totals.users}</p>
        </div>
        <div className={adminUi.statTile}>
          <p className="text-sm text-muted-soft">Contacts</p>
          <p className="mt-2 font-display text-3xl font-semibold">{report.totals.contacts}</p>
        </div>
        <div className={adminUi.statTile}>
          <p className="text-sm text-muted-soft">Bookings</p>
          <p className="mt-2 font-display text-3xl font-semibold">{report.totals.bookings}</p>
        </div>
      </section>

      <AdminPanel as="section">
        <h2 className={adminUi.sectionTitle}>Insights</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink">
          {report.insights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </AdminPanel>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminPanel as="div">
          <h2 className={adminUi.sectionTitle}>By status</h2>
          <div className="mt-4 space-y-2 text-sm">
            {report.bookingStatusBreakdown.length === 0 ? (
              <p className="text-muted">No data yet.</p>
            ) : (
              report.bookingStatusBreakdown.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                >
                  <span className="capitalize text-muted-soft">{row.status}</span>
                  <span className="font-medium">{row.count}</span>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel as="div">
          <h2 className={adminUi.sectionTitle}>By route</h2>
          <div className="mt-4 space-y-2 text-sm">
            {report.routeBreakdown.length === 0 ? (
              <p className="text-muted">No data yet.</p>
            ) : (
              report.routeBreakdown.map((row) => (
                <div
                  key={row.routeType}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                >
                  <span className="capitalize text-muted-soft">{row.routeType}</span>
                  <span className="font-medium">{row.count}</span>
                </div>
              ))
            )}
          </div>
        </AdminPanel>
      </section>

      <AdminPanel as="section">
        <h2 className={adminUi.sectionTitle}>By month</h2>
        <p className={adminUi.sectionDesc}>New users, contacts, bookings — UTC months.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={adminUi.theadSimple}>
              <tr className="text-left">
                <th className={adminUi.thRelaxed}>Month</th>
                <th className={adminUi.thRelaxed}>Users</th>
                <th className={adminUi.thRelaxed}>Contacts</th>
                <th className={adminUi.thRelaxed}>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {report.monthly.map((row) => (
                <tr key={row.month} className="border-b border-border/60">
                  <td className="px-3 py-2">{row.month}</td>
                  <td className="px-3 py-2">{row.users}</td>
                  <td className="px-3 py-2">{row.contacts}</td>
                  <td className="px-3 py-2 font-medium">{row.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminPageBody>
  );
}
