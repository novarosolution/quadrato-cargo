import type { Metadata } from "next";
import Link from "next/link";
import { fetchAdminMonthlyReport } from "@/lib/api/admin-server";
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Monthly reports</h1>
          <p className="mt-2 text-sm text-muted">
            Analyst-style summary for business activity, growth, and operations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-soft">Range:</span>
          {[6, 12, 18].map((m) => (
            <Link
              key={m}
              href={`/admin/reports?months=${m}`}
              prefetch={false}
              className={`rounded-lg px-3 py-1.5 ${
                m === months
                  ? "bg-teal text-slate-950"
                  : "border border-border-strong text-ink hover:bg-pill-hover"
              }`}
            >
              {m} months
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/60 p-6">
          <p className="text-sm text-muted-soft">New users</p>
          <p className="mt-2 font-display text-3xl font-semibold">{report.totals.users}</p>
        </div>
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/60 p-6">
          <p className="text-sm text-muted-soft">Contact requests</p>
          <p className="mt-2 font-display text-3xl font-semibold">{report.totals.contacts}</p>
        </div>
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/60 p-6">
          <p className="text-sm text-muted-soft">Bookings submitted</p>
          <p className="mt-2 font-display text-3xl font-semibold">{report.totals.bookings}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
        <h2 className="font-display text-lg font-semibold">Analyst insights</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink">
          {report.insights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
          <h2 className="font-display text-lg font-semibold">Booking status breakdown</h2>
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
        </div>

        <div className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
          <h2 className="font-display text-lg font-semibold">Route type breakdown</h2>
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
        </div>
      </section>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
        <h2 className="font-display text-lg font-semibold">Month-by-month report</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-strong text-left text-muted-soft">
                <th className="px-3 py-2 font-medium">Month</th>
                <th className="px-3 py-2 font-medium">Users</th>
                <th className="px-3 py-2 font-medium">Contacts</th>
                <th className="px-3 py-2 font-medium">Bookings</th>
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
      </section>
    </div>
  );
}
