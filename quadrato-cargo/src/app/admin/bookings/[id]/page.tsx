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
import { AdminBookingDispatchSplit } from "../AdminBookingDispatchSplit";
import { AdminBookingCustomerLink } from "../linkcustomer";
import { AdminBookingDataForm } from "../booking";
import { AdminBookingContactForm } from "../AdminBookingContactForm";
import { AdminBookingInvoiceForm } from "../AdminBookingInvoiceForm";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { AdminBookingPickupForm } from "../AdminBookingPickupForm";
import { AdminBookingShipmentForm } from "../AdminBookingShipmentForm";
import {
  formatEddDisplay,
  resolveEstimatedDeliveryDate,
} from "@/lib/estimated-delivery";

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
  const recipient = (payload.recipient && typeof payload.recipient === "object"
    ? payload.recipient
    : {}) as Record<string, unknown>;
  const shipmentRaw =
    payload.shipment && typeof payload.shipment === "object"
      ? (payload.shipment as Record<string, unknown>)
      : {};
  const dims =
    shipmentRaw.dimensionsCm && typeof shipmentRaw.dimensionsCm === "object"
      ? (shipmentRaw.dimensionsCm as Record<string, unknown>)
      : {};
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const contactInitial = {
    senderName: str(sender.name),
    senderEmail: str(sender.email),
    senderPhone: str(sender.phone),
    recipientName: str(recipient.name),
    recipientEmail: str(recipient.email),
    recipientPhone: str(recipient.phone),
    recipientStreet: str(recipient.street),
    recipientCity: str(recipient.city),
    recipientPostal: str(recipient.postal),
    recipientCountry: str(recipient.country),
  };
  const weightFromPayload =
    typeof shipmentRaw.weightKg === "number" && Number.isFinite(shipmentRaw.weightKg)
      ? String(shipmentRaw.weightKg)
      : str(shipmentRaw.weightKg);
  const shipmentInitial = {
    contentsDescription: str(shipmentRaw.contentsDescription),
    weightKg: weightFromPayload,
    declaredValue: str(shipmentRaw.declaredValue),
    dimL: str(dims.l),
    dimW: str(dims.w),
    dimH: str(dims.h),
  };
  const pickupPin = typeof sender.postal === "string" ? sender.postal : "";
  const pickupInitial = {
    collectionMode:
      typeof payload.collectionMode === "string" ? payload.collectionMode : "",
    pickupDate: str(payload.pickupDate),
    pickupTimeSlot: str(payload.pickupTimeSlot),
    pickupTimeSlotCustom: str(payload.pickupTimeSlotCustom),
    pickupPreference:
      typeof payload.pickupPreference === "string" ? payload.pickupPreference : "",
    instructions: str(payload.instructions),
    senderStreet: str(sender.street),
    senderCity: str(sender.city),
    senderPostal: str(sender.postal),
    senderCountry: str(sender.country),
  };
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

  const jumpLinkClass =
    "text-sm font-medium text-teal underline-offset-2 transition hover:underline";

  const adminEddResolved = resolveEstimatedDeliveryDate({
    routeType: row.routeType,
    createdAtIso: row.createdAt.toISOString(),
    estimatedDeliveryAt: row.estimatedDeliveryAt ?? null,
  });
  const hasCustomEdd = Boolean(row.estimatedDeliveryAt);

  return (
    <div className="stack-page content-narrow">
      <Link href="/admin/bookings" prefetch={false} className="text-sm text-teal hover:underline">
        ← All bookings
      </Link>

      <AdminPageHeader
        title={`${row.routeType === "international" ? "International" : "Domestic"} booking`}
        description={
          <>
            {row.createdAt.toLocaleString()} · ID <span className="font-mono text-xs">{row.id}</span>
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/bookings/${row.id}/timeline`}
              prefetch={false}
              className="inline-flex items-center justify-center rounded-xl border border-teal/60 bg-teal/15 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-teal/25 dark:bg-teal/20"
            >
              Customer Track
            </Link>
            <DeleteRowButton
              label="Delete booking"
              action={deleteCourierBooking.bind(null, row.id)}
              redirectAfter="/admin/bookings"
            />
          </div>
        }
      />

      <div className="space-y-3 rounded-2xl border border-border-strong bg-surface-elevated/40 px-4 py-4">
        <p className="text-sm text-muted-soft">
          <span className="font-medium text-ink">Usual order:</span> status &amp; notes →{" "}
          <Link href={`/admin/bookings/${row.id}/timeline`} className="font-medium text-teal hover:underline">
            Customer Track
          </Link>{" "}
          → contacts / parcel / invoice if needed.
        </p>
        <nav aria-label="On this page">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">Jump to</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Booking</p>
              <ul className="mt-1.5 flex flex-col gap-1.5 text-sm">
                <li>
                  <a href="#booking-summary" className={jumpLinkClass}>
                    Summary
                  </a>
                </li>
                <li>
                  <a href="#booking-dispatch-panel" className={jumpLinkClass}>
                    Status &amp; notes
                  </a>
                </li>
                <li>
                  <a href="#booking-estimated-delivery" className={jumpLinkClass}>
                    Delivery date (EDD)
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Customer Track</p>
              <ul className="mt-1.5 flex flex-col gap-1.5 text-sm">
                <li>
                  <Link href={`/admin/bookings/${row.id}/timeline`} className={jumpLinkClass}>
                    Track editor (all)
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/admin/bookings/${row.id}/timeline#timeline-current`}
                    className={jumpLinkClass}
                  >
                    Current card
                  </Link>
                </li>
                <li>
                  <Link href={`/admin/bookings/${row.id}/timeline#timeline-next`} className={jumpLinkClass}>
                    Next card
                  </Link>
                </li>
                <li>
                  <Link href={`/admin/bookings/${row.id}/timeline#timeline-bulk`} className={jumpLinkClass}>
                    All steps (bulk)
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">People &amp; parcel</p>
              <ul className="mt-1.5 flex flex-col gap-1.5 text-sm">
                <li>
                  <a href="#booking-customer-view" className={jumpLinkClass}>
                    Contacts
                  </a>
                </li>
                <li>
                  <a href="#booking-shipment" className={jumpLinkClass}>
                    Parcel
                  </a>
                </li>
                <li>
                  <a href="#booking-invoice" className={jumpLinkClass}>
                    Invoice
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">More</p>
              <ul className="mt-1.5 flex flex-col gap-1.5 text-sm">
                <li>
                  <a href="#booking-pickup-details" className={jumpLinkClass}>
                    Pickup &amp; JSON
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>

      <section
        id="booking-summary"
        className="scroll-mt-24 rounded-2xl border border-border-strong bg-surface-elevated/50 p-5"
      >
        <h2 className="font-display text-lg font-semibold">Summary</h2>
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
            <dd className="mt-1 wrap-break-word text-ink">{row.assignedAgency || "—"}</dd>
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
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Est. delivery (EDD)
            </dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 text-ink">
              <span className="text-lg font-bold text-teal">
                {formatEddDisplay(adminEddResolved)}
              </span>
              {hasCustomEdd ? (
                <span className="rounded-full border border-teal/35 bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                  Custom
                </span>
              ) : row.routeType === "international" ? (
                <span className="text-xs text-muted-soft">Default +10 days unless you set EDD below.</span>
              ) : (
                <span className="text-xs text-muted-soft">Optional — set EDD below to show on Track.</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section id="booking-tracking" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Operations &amp; Track</h2>
          <p className="mt-1 text-sm text-muted">Status, agency, courier — then edit timeline on the Track page.</p>
        </div>
        <div className="rounded-2xl border border-teal/30 bg-linear-to-r from-teal/10 to-canvas/30 p-4 dark:from-teal/15">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Customer Track editor</p>
              <p className="mt-0.5 text-xs text-muted-soft">
                Current card, next card, bulk steps, and hide steps from customers.
              </p>
            </div>
            <Link
              href={`/admin/bookings/${row.id}/timeline`}
              prefetch={false}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90"
            >
              Open Track editor →
            </Link>
          </div>
        </div>
        <AdminBookingDispatchSplit
          key={`${row.id}-${String(row.customerFacingCreatedAt ?? "")}-${String(row.customerFacingUpdatedAt ?? "")}-${String(row.estimatedDeliveryAt ?? "")}-${String(row.internationalAgencyStage ?? "")}`}
          bookingId={row.id}
          trackReference={trackReference}
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
          customerFacingBookedIso={String(
            row.customerFacingCreatedAt ?? row.createdAt.toISOString(),
          )}
          customerFacingUpdatedIso={String(
            row.customerFacingUpdatedAt ??
              (typeof row.updatedAt === "string"
                ? row.updatedAt
                : row.createdAt.toISOString()),
          )}
          estimatedDeliveryAtIso={row.estimatedDeliveryAt ?? null}
          internationalAgencyStage={row.internationalAgencyStage ?? null}
        />
      </section>

      <section id="booking-customer-view" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Contacts</h2>
          <p className="mt-1 text-sm text-muted">Sender and recipient on Track and profile.</p>
        </div>

        <AdminCollapsible id="booking-contacts" title="Sender &amp; recipient" defaultOpen>
          <AdminBookingContactForm
            bookingId={row.id}
            routeType={row.routeType === "international" ? "international" : "domestic"}
            initial={contactInitial}
          />
        </AdminCollapsible>
      </section>

      <section id="booking-shipment" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Parcel</h2>
          <p className="mt-1 text-sm text-muted">Weight, size, contents on Track. Value is internal only.</p>
        </div>
        <AdminCollapsible id="booking-shipment-form" title="Parcel details" defaultOpen>
          <AdminBookingShipmentForm
            bookingId={row.id}
            routeType={row.routeType === "international" ? "international" : "domestic"}
            initial={shipmentInitial}
          />
        </AdminCollapsible>
      </section>

      <section id="booking-invoice" className="scroll-mt-24 space-y-4">
        <AdminCollapsible id="booking-invoice-panel" title="Invoice" defaultOpen>
          <AdminBookingInvoiceForm
            bookingId={row.id}
            allowCustomerInvoicePdf={row.invoicePdfReady !== false}
            initial={invoiceInitial}
          />
        </AdminCollapsible>
      </section>

      <section id="booking-pickup-details" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Pickup &amp; extra</h2>
          <p className="mt-1 text-sm text-muted">Pickup window, sender address, link account, raw data.</p>
        </div>

        <AdminCollapsible id="booking-pickup-form" title="Pickup &amp; sender" defaultOpen>
          <AdminBookingPickupForm
            bookingId={row.id}
            routeType={row.routeType === "international" ? "international" : "domestic"}
            initial={pickupInitial}
          />
        </AdminCollapsible>

        <AdminCollapsible id="booking-customer" title="Customer account">
          <AdminBookingCustomerLink
            bookingId={row.id}
            linkedUserEmail={row.user?.email ?? null}
            embedded
          />
        </AdminCollapsible>

        <AdminCollapsible id="booking-data" title="Booking data (JSON)">
          <AdminBookingDataForm
            bookingId={row.id}
            routeType={row.routeType}
            payloadJson={json}
          />
        </AdminCollapsible>
      </section>
    </div>
  );
}
