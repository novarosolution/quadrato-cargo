import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchCourierBookingDetailServer } from "@/lib/api/courier-client";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { CourierStartJobButton } from "../../startjob";
import { CourierPickupOtpForm } from "../../picotp";
import { DeliveryCompletePopup } from "./DeliveryCompletePopup";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Job ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function CourierBookingDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();
  const res = await fetchCourierBookingDetailServer(cookieHeader, id);
  const row = res.ok
    ? {
        ...res.data.booking,
        createdAt: new Date(res.data.booking.createdAt),
      }
    : null;

  if (!row) notFound();

  const st = normalizeBookingStatus(row.status);
  const payload = (row.payload || {}) as Record<string, unknown>;
  const sender = (payload.sender && typeof payload.sender === "object"
    ? payload.sender
    : {}) as Record<string, unknown>;
  const recipient = (payload.recipient && typeof payload.recipient === "object"
    ? payload.recipient
    : {}) as Record<string, unknown>;
  const shipment = (payload.shipment && typeof payload.shipment === "object"
    ? payload.shipment
    : {}) as Record<string, unknown>;
  const pickupPreference =
    typeof payload.pickupPreference === "string" ? payload.pickupPreference : "";
  const instructions =
    typeof payload.instructions === "string" ? payload.instructions : "";
  const canStartJob =
    st === "submitted" ||
    st === "confirmed" ||
    st === "serviceability_check" ||
    st === "serviceable" ||
    st === "pickup_scheduled";
  const canVerifyPickupOtp =
    st === "submitted" ||
    st === "confirmed" ||
    st === "serviceability_check" ||
    st === "serviceable" ||
    st === "pickup_scheduled" ||
    st === "out_for_pickup";
  const courierLockedAfterHandover =
    st === "agency_processing" ||
    st === "in_transit" ||
    st === "out_for_delivery" ||
    st === "delivery_attempted" ||
    st === "on_hold" ||
    st === "delivered" ||
    st === "cancelled";

  const routeLabel = row.routeType === "international" ? "International" : "Domestic";

  return (
    <div className="stack-page content-narrow gap-8 max-sm:gap-6">
      {st === "delivered" ? (
        <DeliveryCompletePopup
          reference={row.consignmentNumber || row.id}
          recipientName={String(recipient.name ?? "")}
          recipientPhone={String(recipient.phone ?? "")}
          recipientAddress={
            [recipient.street, recipient.city, recipient.postal, recipient.country]
              .map((x) => String(x ?? "").trim())
              .filter(Boolean)
              .join(", ")
          }
          parcelSummary={String(shipment.contentsDescription ?? "")}
        />
      ) : null}
      <Link href="/courier" className="text-sm text-teal hover:underline">
        ← All my deliveries
      </Link>

      <AppSurfacePageHeader
        title={`${routeLabel} shipment`}
        description={
          <>
            <span className="block text-sm text-muted-soft">
              {row.createdAt.toLocaleString()} · ID {row.id}
            </span>
            <span className="mt-2 block text-sm">
              <span className="text-muted-soft">Reference: </span>
              <span className="font-mono text-ink">{row.consignmentNumber || row.id}</span>
            </span>
            <span className="mt-1 block text-xs text-muted-soft">
              Share this reference with agency for this booking handover verification.
            </span>
            <span className="mt-2 block text-sm">
              <span className="text-muted-soft">Status: </span>
              <span className="font-medium text-teal">{BOOKING_STATUS_LABELS[st]}</span>
            </span>
            {row.assignedAgency ? (
              <span className="mt-2 block text-sm">
                <span className="text-muted-soft">Agency: </span>
                <span className="font-medium text-ink">{row.assignedAgency}</span>
              </span>
            ) : null}
            {row.agencyHandoverOtpCode ? (
              <span className="mt-2 block text-sm text-amber-700 dark:text-amber-400">
                <span className="text-muted-soft">Agency handover OTP: </span>
                <span className="font-mono">{row.agencyHandoverOtpCode}</span>
              </span>
            ) : null}
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Agency handover details</h2>
          <p className="mt-1 text-xs text-muted-soft">
            Courier shares both values below with agency team.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-canvas/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-soft">Reference</p>
              <p className="mt-1 font-mono text-sm text-ink">
                {row.consignmentNumber || row.id}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-canvas/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-soft">Agency OTP</p>
              <p className="mt-1 font-mono text-sm text-ink">
                {row.agencyHandoverOtpCode || "Available after pickup OTP verification"}
              </p>
              <p className="mt-1 text-[11px] text-muted-soft">
                This OTP is valid for this booking only.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
          <h2 className="font-display text-lg font-semibold">Start courier job</h2>
          <p className="mt-1 text-xs text-muted-soft">
            Tap start when you leave for pickup. Status becomes{" "}
            <span className="font-medium">Out for pickup</span>.
          </p>
          <div className="mt-6">
            {canStartJob ? (
              <CourierStartJobButton bookingId={row.id} />
            ) : (
              <p className="text-sm text-muted-soft">
                Job start is already done or this booking is in next stage.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
          <h2 className="font-display text-lg font-semibold">Pickup OTP verification</h2>
          <p className="mt-1 text-xs text-muted-soft">
            Courier only verifies customer OTP. After pickup, agency team handles
            status updates from <span className="font-mono text-[11px]">/agency</span>.
          </p>
          <div className="mt-6">
            {canVerifyPickupOtp ? (
              <CourierPickupOtpForm bookingId={row.id} />
            ) : (
              <p className="text-sm text-muted-soft">
                {courierLockedAfterHandover
                  ? "Courier job is already handed over to agency. Courier updates are locked."
                  : "Pickup OTP already verified for this booking."}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
            <h2 className="font-display text-lg font-semibold">Pickup details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-muted-soft">Sender</dt>
                <dd className="text-ink">
                  {String(sender.name ?? "—")} · {String(sender.phone ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-soft">Address</dt>
                <dd className="text-ink">
                  {[sender.street, sender.city, sender.postal, sender.country]
                    .map((x) => String(x ?? "").trim())
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-soft">Pickup preference</dt>
                <dd className="text-ink">{pickupPreference || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
            <h2 className="font-display text-lg font-semibold">Delivery details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-muted-soft">Recipient</dt>
                <dd className="text-ink">
                  {String(recipient.name ?? "—")} · {String(recipient.phone ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-soft">Address</dt>
                <dd className="text-ink">
                  {[recipient.street, recipient.city, recipient.postal, recipient.country]
                    .map((x) => String(x ?? "").trim())
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-soft">Parcel</dt>
                <dd className="text-ink">
                  {String(shipment.contentsDescription ?? "—")}
                </dd>
              </div>
              {instructions ? (
                <div>
                  <dt className="text-muted-soft">Admin instructions</dt>
                  <dd className="whitespace-pre-wrap text-ink">{instructions}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
