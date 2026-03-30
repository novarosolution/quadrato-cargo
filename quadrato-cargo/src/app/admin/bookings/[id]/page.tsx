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
import { AdminCustomerTimelineForm } from "../AdminCustomerTimelineForm";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { AdminTimelineQuickCardForm } from "../AdminTimelineQuickCardForm";
import { AdminBookingPickupForm } from "../AdminBookingPickupForm";
import { AdminBookingShipmentForm } from "../AdminBookingShipmentForm";

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
          <DeleteRowButton
            label="Delete booking"
            action={deleteCourierBooking.bind(null, row.id)}
            redirectAfter="/admin/bookings"
          />
        }
      />

      <nav
        aria-label="On this page"
        className="rounded-2xl border border-border-strong bg-surface-elevated/40 px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">On this page</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <li>
            <a href="#booking-summary" className={jumpLinkClass}>
              Summary
            </a>
          </li>
          <li>
            <a href="#booking-tracking" className={jumpLinkClass}>
              Tracking &amp; dispatch
            </a>
          </li>
          <li>
            <a href="#booking-customer-view" className={jumpLinkClass}>
              Customer view
            </a>
          </li>
          <li>
            <a href="#booking-shipment" className={jumpLinkClass}>
              Shipment
            </a>
          </li>
          <li>
            <a href="#booking-invoice" className={jumpLinkClass}>
              Invoice
            </a>
          </li>
          <li>
            <a href="#booking-pickup-details" className={jumpLinkClass}>
              Pickup &amp; details
            </a>
          </li>
        </ul>
      </nav>

      <section
        id="booking-summary"
        className="scroll-mt-24 rounded-2xl border border-border-strong bg-surface-elevated/50 p-5"
      >
        <h2 className="font-display text-lg font-semibold">Shipment summary</h2>
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
        </dl>
      </section>

      <section id="booking-tracking" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Tracking &amp; dispatch</h2>
          <p className="mt-1 text-sm text-muted">Status, notes, agency, courier, and the public timeline.</p>
        </div>
        <AdminBookingDispatchSplit
          key={row.id}
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
        />

        <section
          id="booking-quick-card"
          className="scroll-mt-24 rounded-2xl border border-teal/25 bg-teal/4 p-5 dark:bg-teal/10"
        >
          <h2 className="font-display text-lg font-semibold text-ink">Current timeline step</h2>
          <div className="mt-4">
            <AdminTimelineQuickCardForm
              key={`${row.id}-${row.routeType}-${row.status}-${JSON.stringify(row.publicTimelineOverrides ?? null)}`}
              bookingId={row.id}
              routeType={row.routeType}
              status={row.status}
              initial={row.publicTimelineOverrides ?? null}
            />
          </div>
        </section>

        <AdminCollapsible id="booking-customer-timeline" title="All timeline steps">
          <AdminCustomerTimelineForm
            key={`${row.id}-${row.routeType}`}
            bookingId={row.id}
            routeType={row.routeType}
            initial={row.publicTimelineOverrides ?? null}
          />
        </AdminCollapsible>
      </section>

      <section id="booking-customer-view" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Customer view</h2>
          <p className="mt-1 text-sm text-muted">Names on Track; profile downloads.</p>
        </div>

        <AdminCollapsible id="booking-contacts" title="Sender &amp; recipient contact" defaultOpen>
          <AdminBookingContactForm
            bookingId={row.id}
            routeType={row.routeType === "international" ? "international" : "domestic"}
            initial={contactInitial}
          />
        </AdminCollapsible>
      </section>

      <section id="booking-shipment" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Shipment details</h2>
          <p className="mt-1 text-sm text-muted">
            Weight, dimensions, contents, and declared value (shown on track and profile when enabled).
          </p>
        </div>
        <AdminCollapsible id="booking-shipment-form" title="Parcel &amp; declared value" defaultOpen>
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
          <h2 className="font-display text-lg font-semibold text-ink">Pickup &amp; details</h2>
          <p className="mt-1 text-sm text-muted">Pickup schedule, sender address, account link, full JSON.</p>
        </div>

        <AdminCollapsible id="booking-pickup-form" title="Pickup &amp; sender address" defaultOpen>
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
