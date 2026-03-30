import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  fetchAdminBookingDetail,
  fetchAdminUsers,
} from "@/lib/api/admin-server";
import { AdminCollapsible } from "@/components/admin/AdminCollapsible";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteCourierBooking } from "../../dashboard/actions";
import { AdminBookingControls } from "../Controls";
import { ManualTrackingQuickLinks } from "../ManualTrackingQuickLinks";
import { AdminBookingCustomerLink } from "../linkcustomer";
import { AdminBookingDataForm } from "../booking";
import { AdminBookingInvoiceForm } from "../AdminBookingInvoiceForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking ${id.slice(0, 8)}… — Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  const [res, agenciesRes] = await Promise.all([
    fetchAdminBookingDetail(id),
    fetchAdminUsers({ role: "agency", page: 1 }),
  ]);
  const row = res.booking
    ? {
        ...res.booking,
        createdAt: new Date(res.booking.createdAt),
      }
    : null;
  const couriers = res.couriers || [];
  if (!row) notFound();

  const agencyOptions = (agenciesRes.users || []).map((u) => ({
    email: u.email,
    name: u.name,
  }));

  const json = JSON.stringify(row.payload, null, 2);
  const st = normalizeBookingStatus(row.status);
  const payload = (row.payload && typeof row.payload === "object"
    ? row.payload
    : {}) as Record<string, unknown>;
  const sender = (payload.sender && typeof payload.sender === "object"
    ? payload.sender
    : {}) as Record<string, unknown>;
  const collectionMode =
    typeof payload.collectionMode === "string" ? payload.collectionMode : "";
  const pickupPreference =
    typeof payload.pickupPreference === "string" ? payload.pickupPreference : "";
  const pickupPin = typeof sender.postal === "string" ? sender.postal : "";
  const inv =
    row.invoice && typeof row.invoice === "object"
      ? (row.invoice as Record<string, string | null | undefined>)
      : {};
  const trackReference =
    (row.consignmentNumber && String(row.consignmentNumber).trim()) ||
    (row.publicBarcodeCode && String(row.publicBarcodeCode).trim()) ||
    row.id;

  const invoiceInitial = {
    number: String(inv.number ?? ""),
    currency: String(inv.currency ?? "INR"),
    subtotal: String(inv.subtotal ?? ""),
    tax: String(inv.tax ?? ""),
    insurance: String(inv.insurance ?? ""),
    customsDuties: String(inv.customsDuties ?? ""),
    discount: String(inv.discount ?? ""),
    total: String(inv.total ?? ""),
    lineDescription: String(inv.lineDescription ?? ""),
    notes: String(inv.notes ?? ""),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/bookings" prefetch={false} className="text-sm text-teal hover:underline">
        ← All bookings
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-display text-2xl font-semibold capitalize">
            {row.routeType} booking
          </h1>
          <p className="mt-1 text-sm text-muted-soft">
            {row.createdAt.toLocaleString()} · ID{" "}
            <span className="font-mono text-xs">{row.id}</span>
          </p>
        </div>
        <DeleteRowButton
          label="Delete booking"
          action={deleteCourierBooking.bind(null, row.id)}
          redirectAfter="/admin/bookings"
        />
      </div>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
        <h2 className="font-display text-lg font-semibold">Shipment summary</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Read-only snapshot. Open sections below to edit.
        </p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Status
            </dt>
            <dd className="mt-1 font-medium text-teal">{BOOKING_STATUS_LABELS[st]}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Tracking ID
            </dt>
            <dd className="mt-1 font-mono text-ink">
              {row.consignmentNumber || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Assigned agency
            </dt>
            <dd className="mt-1 break-words text-ink">{row.assignedAgency || "—"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Courier
            </dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 text-ink">
              {row.courier ? (
                <>
                  <Link
                    href={`/admin/users/${row.courier.id}`}
                    prefetch={false}
                    className="font-medium text-teal hover:underline"
                  >
                    {row.courier.name ?? row.courier.email}
                  </Link>
                  {!row.courier.isActive ? (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400">
                      Inactive
                    </span>
                  ) : !row.courier.isOnDuty ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Off duty
                    </span>
                  ) : null}
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Customer
            </dt>
            <dd className="mt-1 text-ink">
              {row.user ? (
                <Link
                  href={`/admin/users/${row.user.id}`}
                  prefetch={false}
                  className="font-medium text-teal hover:underline"
                >
                  {row.user.name ?? row.user.email}
                </Link>
              ) : (
                <span className="text-muted-soft">Guest (not linked)</span>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Public barcode
            </dt>
            <dd className="mt-1 font-mono text-xs text-ink">
              {row.publicBarcodeCode || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <div className="space-y-4">
        <AdminCollapsible
          id="booking-manual-tracking"
          title="Customer tracking & assignment"
          description="Update status, customer-facing messages, agency, tracking number, activity log, private notes, and courier — in everyday language. One save button updates everything in this section."
          defaultOpen
        >
          <div className="space-y-6">
            <ManualTrackingQuickLinks bookingId={row.id} trackReference={trackReference} />
            <AdminBookingControls
              key={row.id}
              bookingId={row.id}
              routeType={row.routeType}
              pickupPin={pickupPin}
              assignedAgency={row.assignedAgency ?? null}
              agencyOptions={agencyOptions}
              currentStatus={row.status}
              consignmentNumber={row.consignmentNumber}
              publicTrackingNote={row.publicTrackingNote ?? row.customerTrackingNote ?? null}
              operationalTrackingNotes={row.trackingNotes}
              internalNotes={row.internalNotes}
              couriers={couriers}
              assignedCourierId={row.courierId}
            />
            <p className="text-xs leading-relaxed text-muted-soft">
              <strong className="font-medium text-ink">Addresses and parcel details</strong> on the
              Track page come from{" "}
              <strong className="font-medium text-muted">Booking data (JSON)</strong> further down —
              open that section if pickup or delivery addresses look wrong.
            </p>
          </div>
        </AdminCollapsible>

        <AdminCollapsible
          id="booking-invoice"
          title="Customer invoice PDF"
          description="Billing lines and whether the customer can download the invoice PDF after pickup OTP."
        >
          <AdminBookingInvoiceForm
            bookingId={row.id}
            allowCustomerInvoicePdf={row.invoicePdfReady !== false}
            initial={invoiceInitial}
          />
        </AdminCollapsible>

        <AdminCollapsible
          id="booking-customer"
          title="Customer account"
          description="Link or unlink this booking to a registered customer profile."
        >
          <AdminBookingCustomerLink
            bookingId={row.id}
            linkedUserEmail={row.user?.email ?? null}
            embedded
          />
        </AdminCollapsible>

        <AdminCollapsible
          id="booking-ops"
          title="Operations snapshot"
          description="Collection mode, pickup PIN, and pickup window from the booking payload (read-only; change values via Booking data JSON if needed)."
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-canvas/30 p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-soft">Collection mode</dt>
              <dd className="mt-1 font-medium capitalize text-ink">
                {collectionMode || "Not set"}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-canvas/30 p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-soft">
                Pickup Postal Code / ZIP
              </dt>
              <dd className="mt-1 font-medium text-ink">{pickupPin || "Not set"}</dd>
            </div>
            <div className="rounded-xl border border-border bg-canvas/30 p-3 sm:col-span-1">
              <dt className="text-xs uppercase tracking-wide text-muted-soft">
                Pickup window / note
              </dt>
              <dd className="mt-1 font-medium text-ink">{pickupPreference || "Not set"}</dd>
            </div>
          </dl>
        </AdminCollapsible>

        <AdminCollapsible
          id="booking-data"
          title="Booking data (JSON)"
          description="Route type and raw payload — drives sender/recipient addresses and shipment details on public tracking. Customer profile reflects this; edit carefully."
        >
          <AdminBookingDataForm
            bookingId={row.id}
            routeType={row.routeType}
            payloadJson={json}
          />
        </AdminCollapsible>
      </div>
    </div>
  );
}
