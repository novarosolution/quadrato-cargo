import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchAgencyBookingsServer } from "@/lib/api/agency-client";
import { AgencyHandoverForm } from "./Handover";
import { AgencyJobControls } from "./JobControls";

export const metadata: Metadata = {
  title: "Agency Intake",
  robots: { index: false, follow: false },
};

export default async function AgencyPage() {
  const cookieHeader = (await cookies()).toString();
  const res = await fetchAgencyBookingsServer(cookieHeader);
  const rows = res.ok
    ? (res.data.bookings || []).map((b) => ({
        ...b,
        createdAt: new Date(b.createdAt),
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Agency intake queue</h1>
        <p className="mt-1 text-sm text-muted-soft">
          Courier shares <strong className="font-medium text-muted">Reference</strong>{" "}
          and <strong className="font-medium text-muted">Agency OTP</strong>.
          Enter OTP in the booking row to auto-accept and start agency processing.
        </p>
      </div>

      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-lg font-semibold">Verify courier handover</h2>
        <p className="mt-1 text-xs text-muted-soft">
          On success, status changes to <span className="font-medium">At agency processing</span>.
        </p>
        <div className="mt-6 max-w-xl">
          <AgencyHandoverForm />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border-strong">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-border-strong bg-surface-elevated/80">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-soft">Created</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Reference</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Route</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Shipment</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Status</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Customer update</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Accept / Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No agency-assigned bookings yet. Ask admin to set your agency in booking controls.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const st = normalizeBookingStatus(row.status);
                const payload = row.payload && typeof row.payload === "object"
                  ? (row.payload as Record<string, unknown>)
                  : {};
                const sender =
                  payload.sender && typeof payload.sender === "object"
                    ? (payload.sender as Record<string, unknown>)
                    : {};
                const recipient =
                  payload.recipient && typeof payload.recipient === "object"
                    ? (payload.recipient as Record<string, unknown>)
                    : {};
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border transition hover:bg-pill-hover"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-soft">
                      {row.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">
                      {row.consignmentNumber || row.id}
                    </td>
                    <td className="px-4 py-3 capitalize text-ink">{row.routeType}</td>
                    <td className="max-w-[280px] px-4 py-3 text-xs text-muted">
                      <p>
                        <span className="text-muted-soft">Sender:</span>{" "}
                        {typeof sender.name === "string" ? sender.name : "—"}
                      </p>
                      <p>
                        <span className="text-muted-soft">Recipient:</span>{" "}
                        {typeof recipient.name === "string" ? recipient.name : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-pill px-2 py-0.5 text-xs font-medium text-teal">
                        {BOOKING_STATUS_LABELS[st]}
                      </span>
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-3 text-muted">
                      {row.publicTrackingNote || row.trackingNotes || "—"}
                    </td>
                    <td className="min-w-[280px] px-4 py-3">
                      <AgencyJobControls
                        bookingId={row.id}
                        reference={row.consignmentNumber || row.id}
                        currentStatus={row.status}
                        agencyHandoverVerifiedAt={row.agencyHandoverVerifiedAt ?? null}
                        publicTrackingNote={row.publicTrackingNote || row.trackingNotes || null}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-soft">
        Need pickup-side details? Courier team works from{" "}
        <Link href="/courier" className="text-teal hover:underline">
          /courier
        </Link>
        .
      </p>
    </div>
  );
}
