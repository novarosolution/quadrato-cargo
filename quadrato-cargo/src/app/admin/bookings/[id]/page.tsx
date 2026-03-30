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
import { AdminTimelineQuickCardForm } from "../AdminTimelineQuickCardForm";

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
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const contactInitial = {
    senderName: str(sender.name),
    senderEmail: str(sender.email),
    senderPhone: str(sender.phone),
    recipientName: str(recipient.name),
    recipientEmail: str(recipient.email),
    recipientPhone: str(recipient.phone),
  };
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

  const jumpLinkClass =
    "text-sm font-medium text-teal underline-offset-2 transition hover:underline";

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
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Edit this booking in three areas: <strong className="font-medium text-ink">operations</strong>{" "}
            (status, assignment, notes), <strong className="font-medium text-ink">what customers see</strong>{" "}
            on the public track page, and <strong className="font-medium text-ink">account &amp; advanced</strong>{" "}
            (linking the customer and raw data). Use the links below to jump.
          </p>
        </div>
        <DeleteRowButton
          label="Delete booking"
          action={deleteCourierBooking.bind(null, row.id)}
          redirectAfter="/admin/bookings"
        />
      </div>

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
            <a href="#booking-section-ops" className={jumpLinkClass}>
              Operations &amp; dispatch
            </a>
          </li>
          <li>
            <a href="#booking-customer-tracking" className={jumpLinkClass}>
              Dispatch &amp; updates
            </a>
          </li>
          <li>
            <a href="#booking-assignment" className={jumpLinkClass}>
              Assignment
            </a>
          </li>
          <li>
            <a href="#booking-section-public" className={jumpLinkClass}>
              What customers see
            </a>
          </li>
          <li>
            <a href="#booking-contacts" className={jumpLinkClass}>
              Contacts
            </a>
          </li>
          <li>
            <a href="#booking-quick-card" className={jumpLinkClass}>
              Current tracking card
            </a>
          </li>
          <li>
            <a href="#booking-customer-timeline" className={jumpLinkClass}>
              Full timeline
            </a>
          </li>
          <li>
            <a href="#booking-invoice" className={jumpLinkClass}>
              Invoice PDF
            </a>
          </li>
          <li>
            <a href="#booking-section-advanced" className={jumpLinkClass}>
              Account &amp; advanced
            </a>
          </li>
        </ul>
      </nav>

      <section
        id="booking-summary"
        className="scroll-mt-24 rounded-2xl border border-border-strong bg-surface-elevated/50 p-5"
      >
        <h2 className="font-display text-lg font-semibold">Shipment summary</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Read-only snapshot of this booking. Everything below is editable.
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

      <section id="booking-section-ops" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Operations &amp; dispatch</h2>
          <p className="mt-1 text-sm text-muted">
            Status, tracking ID, messages customers see, agency partner, and courier. Saving applies everything
            in the open panels below to this booking.
          </p>
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
      </section>

      <section id="booking-section-public" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">What customers see</h2>
          <p className="mt-1 text-sm text-muted">
            Public track page: contact names and phones, the highlighted timeline card, optional overrides for
            every step, and invoice PDF settings.
          </p>
        </div>

        <AdminCollapsible
          id="booking-contacts"
          title="Sender & recipient contact"
          description="Name, email, and phone only. Full addresses are edited in Booking data (JSON) at the bottom."
          defaultOpen
        >
          <AdminBookingContactForm
            bookingId={row.id}
            routeType={row.routeType === "international" ? "international" : "domestic"}
            initial={contactInitial}
          />
        </AdminCollapsible>

        <section
          id="booking-quick-card"
          className="scroll-mt-24 rounded-2xl border border-teal/25 bg-teal/[0.04] p-5 dark:bg-teal/10"
        >
          <h2 className="font-display text-lg font-semibold text-ink">Current public tracking card</h2>
          <p className="mt-1 text-xs text-muted-soft">
            Matches this booking&apos;s status on the <span className="capitalize">{row.routeType}</span>{" "}
            timeline. Only this step changes; use Full timeline below to edit other steps at once.
          </p>
          <div className="mt-4">
            <AdminTimelineQuickCardForm
              bookingId={row.id}
              routeType={row.routeType}
              status={row.status}
              initial={row.publicTimelineOverrides ?? null}
            />
          </div>
        </section>

        <AdminCollapsible
          id="booking-customer-timeline"
          title="Full timeline (all steps)"
          description="Override any timeline card, bulk-edit location lines, or replace the whole saved snapshot."
        >
          <AdminCustomerTimelineForm
            bookingId={row.id}
            routeType={row.routeType}
            initial={row.publicTimelineOverrides ?? null}
          />
        </AdminCollapsible>

        <AdminCollapsible
          id="booking-invoice"
          title="Customer invoice PDF"
          description="Invoice lines and whether the customer can download the PDF after pickup."
        >
          <AdminBookingInvoiceForm
            bookingId={row.id}
            allowCustomerInvoicePdf={row.invoicePdfReady !== false}
            initial={invoiceInitial}
          />
        </AdminCollapsible>
      </section>

      <section id="booking-section-advanced" className="scroll-mt-24 space-y-4">
        <div className="rounded-xl border border-border-strong/80 bg-canvas/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Account &amp; advanced</h2>
          <p className="mt-1 text-sm text-muted">
            Link this booking to a customer profile, view pickup settings from the original booking, or edit the
            full JSON payload when you need full control.
          </p>
        </div>

        <AdminCollapsible
          id="booking-customer"
          title="Customer account"
          description="Link or unlink a registered customer to this booking."
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
          description="Pickup mode and window from the booking (read-only). Change these in Booking data (JSON)."
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
          description="Route type and full payload (addresses, shipment). Replaces the whole payload unless you use Contacts above for phone/email only."
        >
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
