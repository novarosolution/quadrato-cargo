import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { auth } from "@/auth";
import { fetchAgencyBookingsServer } from "@/lib/api/agency-client";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { AgencyHandoverForm } from "./Handover";
import { AgencyIntakeTable, type AgencyIntakeRow } from "./AgencyIntakeTable";
import { AgencyProfileForm } from "./AgencyProfileForm";

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
  const session = await auth();
  const u = session?.user;
  const agencyIdentity = {
    displayName: (u?.name && u.name.trim()) || "Your agency hub",
    email: String(u?.email ?? "").trim(),
    agencyAddress: u?.agencyAddress?.trim() || null,
    agencyPhone: u?.agencyPhone?.trim() || null,
  };
  const profileInitial = {
    name: u?.name?.trim() ?? "",
    agencyAddress: u?.agencyAddress?.trim() ?? "",
    agencyPhone: u?.agencyPhone?.trim() ?? "",
  };

  const cookieHeader = (await cookies()).toString();
  const res = await fetchAgencyBookingsServer(cookieHeader);
  const rows: AgencyIntakeRow[] = res.ok
    ? (res.data.bookings || []).map((b) => ({
        id: b.id,
        createdAt: new Date(b.createdAt).toISOString(),
        updatedAt: (b.updatedAt && new Date(b.updatedAt).toISOString()) || new Date(b.createdAt).toISOString(),
        consignmentNumber: b.consignmentNumber,
        routeType: b.routeType,
        status: b.status,
        publicTrackingNote: b.publicTrackingNote ?? null,
        trackingNotes: b.trackingNotes ?? null,
        agencyHandoverVerifiedAt: b.agencyHandoverVerifiedAt ?? null,
        senderName: partyName(b.payload, "sender"),
        recipientName: partyName(b.payload, "recipient"),
        senderAddress: b.senderAddress ?? null,
        recipientAddress: b.recipientAddress ?? null,
        publicTimelineOverrides: b.publicTimelineOverrides ?? null,
        publicTimelineStatusPath: Array.isArray(b.publicTimelineStatusPath)
          ? b.publicTimelineStatusPath.map((s) => String(s ?? "").trim()).filter(Boolean)
          : null,
        courierId: b.courierId ?? null,
        payload: b.payload,
      }))
    : [];

  return (
    <div className="stack-page content-wide gap-8 max-sm:gap-6">
      <AppSurfacePageHeader
        title="Agency intake queue"
        description={
          <>
            Use <strong className="font-medium text-muted">Open</strong> to update status and the message
            shown on tracking. Use <strong className="font-medium text-muted">Accept &amp; open</strong> when
            you need to enter the OTP from the courier first. Your hub name and address appear on this
            portal and help keep the same agency on every booking you process.{" "}
            <span className="text-muted-soft">
              International and domestic bookings share the same lifecycle; when admin assigns your agency
              or changes a status, it appears here after you refresh or reopen a row.
            </span>
          </>
        }
      />

      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-lg font-semibold">Agency hub details</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Save your operating name, address, and phone. After you accept a handover or save a status
          update, the booking is linked to your sign-in account so customers see a consistent agency name
          on tracking.
        </p>
        <div className="mt-6 max-w-xl">
          <AgencyProfileForm
            initialName={profileInitial.name}
            initialAddress={profileInitial.agencyAddress}
            initialPhone={profileInitial.agencyPhone}
          />
        </div>
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

      <AgencyIntakeTable rows={rows} agencyIdentity={agencyIdentity} />

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
