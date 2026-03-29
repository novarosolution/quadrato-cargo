import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { fetchAgencyBookingsServer } from "@/lib/api/agency-client";
import { AgencyHandoverForm } from "./Handover";
import { AgencyIntakeTable, type AgencyIntakeRow } from "./AgencyIntakeTable";

export const metadata: Metadata = {
  title: "Agency Intake",
  robots: { index: false, follow: false },
};

function partyName(payload: unknown, key: "sender" | "recipient"): string {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const section = root[key];
  if (!section || typeof section !== "object") return "—";
  const name = (section as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name : "—";
}

export default async function AgencyPage() {
  const cookieHeader = (await cookies()).toString();
  const res = await fetchAgencyBookingsServer(cookieHeader);
  const rows: AgencyIntakeRow[] = res.ok
    ? (res.data.bookings || []).map((b) => ({
        id: b.id,
        createdAt: new Date(b.createdAt).toISOString(),
        consignmentNumber: b.consignmentNumber,
        routeType: b.routeType,
        status: b.status,
        publicTrackingNote: b.publicTrackingNote ?? null,
        trackingNotes: b.trackingNotes ?? null,
        agencyHandoverVerifiedAt: b.agencyHandoverVerifiedAt ?? null,
        senderName: partyName(b.payload, "sender"),
        recipientName: partyName(b.payload, "recipient"),
        payload: b.payload,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Agency intake queue</h1>
        <p className="mt-1 text-sm text-muted-soft">
          Use <strong className="font-medium text-muted">Open</strong> to update status and the
          message shown on tracking. Use{" "}
          <strong className="font-medium text-muted">{`Accept & open`}</strong> when you need to
          enter the OTP from the courier first.
        </p>
      </div>

      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-lg font-semibold">Verify courier handover</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Optional shortcut: reference + OTP here, or accept from a row with{" "}
          <span className="font-medium">Accept & open</span>.
        </p>
        <div className="mt-6 max-w-xl">
          <AgencyHandoverForm />
        </div>
      </div>

      <AgencyIntakeTable rows={rows} />

      <p className="text-xs text-muted-soft">
        Pickup-side jobs live on{" "}
        <Link href="/courier" className="text-teal hover:underline">
          /courier
        </Link>
        .
      </p>
    </div>
  );
}
