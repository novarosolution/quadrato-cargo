"use client";

import type { AdminMonthlyReport } from "@/lib/api/admin-server";
import { adminUi } from "@/components/admin/admin-ui";
import { Download } from "lucide-react";

function csvCell(value: string | number) {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildReportCsv(report: AdminMonthlyReport, months: number) {
  const lines: string[] = [];
  lines.push(csvCell(`Admin monthly report (${months}-month window)`));
  lines.push(`generated_utc,${csvCell(new Date().toISOString())}`);
  lines.push("");
  lines.push("totals");
  lines.push("metric,value");
  lines.push(`users,${report.totals.users}`);
  lines.push(`contacts,${report.totals.contacts}`);
  lines.push(`bookings,${report.totals.bookings}`);
  lines.push("");
  lines.push("monthly");
  lines.push("month,users,contacts,bookings");
  for (const row of report.monthly) {
    lines.push(
      [row.month, row.users, row.contacts, row.bookings].map((v) => csvCell(v)).join(","),
    );
  }
  lines.push("");
  lines.push("booking_status");
  lines.push("status,count");
  for (const row of report.bookingStatusBreakdown) {
    lines.push(`${csvCell(row.status)},${row.count}`);
  }
  lines.push("");
  lines.push("route_type");
  lines.push("route_type,count");
  for (const row of report.routeBreakdown) {
    lines.push(`${csvCell(row.routeType)},${row.count}`);
  }
  lines.push("");
  lines.push("insights");
  for (const line of report.insights) {
    lines.push(csvCell(line));
  }
  return `\ufeff${lines.join("\n")}`;
}

export function AdminMonthlyReportCsvButton({
  report,
  months,
}: {
  report: AdminMonthlyReport;
  months: number;
}) {
  function download() {
    const csv = buildReportCsv(report, months);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-monthly-report-${months}m-${new Date().toISOString().slice(0, 10)}.csv`;
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className={`inline-flex items-center gap-2 ${adminUi.btnSecondary}`}
    >
      <Download className="h-4 w-4 text-teal" strokeWidth={2} aria-hidden />
      Download report CSV
    </button>
  );
}
