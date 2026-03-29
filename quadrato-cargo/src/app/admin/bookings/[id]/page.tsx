import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchAdminBookingDetail } from "@/lib/api/admin-server";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteCourierBooking } from "../../dashboard/actions";
import { AdminBookingControls } from "../Controls";
import { AdminBookingCourierAssign } from "../asingtocuriyarboy";
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
  const res = await fetchAdminBookingDetail(id);
  const row = res.booking
    ? {
        ...res.booking,
        createdAt: new Date(res.booking.createdAt),
      }
    : null;
  const couriers = res.couriers || [];
  if (!row) notFound();

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
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/bookings" prefetch={false} className="text-sm text-teal hover:underline">
        ← All bookings
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-display text-2xl font-semibold capitalize">
            {row.routeType} booking
          </h1>
          <p className="mt-1 text-sm text-muted-soft">
            {row.createdAt.toLocaleString()} · ID {row.id}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-muted-soft">Status: </span>
            <span className="font-medium text-teal">
              {BOOKING_STATUS_LABELS[st]}
            </span>
          </p>
          {row.user ? (
            <p className="mt-2 text-sm text-muted">
              Account:{" "}
              <Link
                href={`/admin/users/${row.user.id}`}
                prefetch={false}
                className="font-medium text-teal hover:underline"
              >
                {row.user.name ?? row.user.email}
              </Link>
              <span className="text-muted-soft"> ({row.user.email})</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-soft">
              Guest booking (not linked to a user account)
            </p>
          )}
          {row.courier ? (
            <p className="mt-2 text-sm text-muted">
              Courier:{" "}
              <Link
                href={`/admin/users/${row.courier.id}`}
                prefetch={false}
                className="font-medium text-teal hover:underline"
              >
                {row.courier.name ?? row.courier.email}
              </Link>
              <span className="text-muted-soft"> ({row.courier.email})</span>
              {!row.courier.isActive ? (
                <span className="ml-2 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400">
                  Inactive
                </span>
              ) : !row.courier.isOnDuty ? (
                <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Off duty
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-soft">No courier assigned.</p>
          )}
        </div>
        <DeleteRowButton
          label="Delete booking"
          action={deleteCourierBooking.bind(null, row.id)}
          redirectAfter="/admin/bookings"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
            <h2 className="font-display text-lg font-semibold">
              Dispatch controls
            </h2>
            <p className="mt-1 text-xs text-muted-soft">
              Customer sees status, Tracking ID, and tracking notes on
              their profile. Internal notes stay in admin only.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-canvas/20 p-4">
              <h3 className="font-display text-sm font-semibold text-ink">
                Customer invoice PDF
              </h3>
              <p className="mt-1 text-xs text-muted-soft">
                Enter billing lines and totals; the customer&apos;s downloaded invoice uses this
                booking ID and always reflects the latest saved values.
              </p>
              <div className="mt-4">
                <AdminBookingInvoiceForm
                  bookingId={row.id}
                  allowCustomerInvoicePdf={row.invoicePdfReady !== false}
                  initial={invoiceInitial}
                />
              </div>
            </div>
            <div className="mt-6">
              <AdminBookingControls
                key={row.id}
                bookingId={row.id}
                routeType={row.routeType}
                pickupPin={pickupPin}
                assignedAgency={row.assignedAgency ?? null}
                currentStatus={row.status}
                consignmentNumber={row.consignmentNumber}
                publicTrackingNote={row.publicTrackingNote ?? row.customerTrackingNote ?? null}
                internalNotes={row.internalNotes}
              />
            </div>
          </div>
          <AdminBookingCustomerLink
            bookingId={row.id}
            linkedUserEmail={row.user?.email ?? null}
          />
          <AdminBookingCourierAssign
            bookingId={row.id}
            couriers={couriers}
            assignedCourierId={row.courierId}
          />
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
            <h2 className="font-display text-lg font-semibold">
              Operations workflow snapshot
            </h2>
            <p className="mt-1 text-xs text-muted-soft">
              International courier operations are backend-managed manually until
              handoff to partner carrier.
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-canvas/30 p-3">
                <dt className="text-xs uppercase tracking-wide text-muted-soft">
                  Collection mode
                </dt>
                <dd className="mt-1 font-medium capitalize text-ink">
                  {collectionMode || "Not set"}
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-canvas/30 p-3">
                <dt className="text-xs uppercase tracking-wide text-muted-soft">
                  Pickup Postal Code / ZIP
                </dt>
                <dd className="mt-1 font-medium text-ink">
                  {pickupPin || "Not set"}
                </dd>
              </div>
              <div className="rounded-xl border border-border bg-canvas/30 p-3">
                <dt className="text-xs uppercase tracking-wide text-muted-soft">
                  Pickup window / note
                </dt>
                <dd className="mt-1 font-medium text-ink">
                  {pickupPreference || "Not set"}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5">
            <h2 className="font-display text-lg font-semibold">
              Booking data
            </h2>
            <p className="mt-1 text-xs text-muted-soft">
              Route type and form payload (JSON object). Customer profile shows
              this data; edit carefully.
            </p>
            <div className="mt-6">
              <AdminBookingDataForm
                bookingId={row.id}
                routeType={row.routeType}
                payloadJson={json}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
