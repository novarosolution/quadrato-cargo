import type { Metadata } from "next";
import { AdminBookingInvoiceForm } from "../../AdminBookingInvoiceForm";
import { getAdminBookingBundle } from "../_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "../BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invoice — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingInvoicePage({ params }: Props) {
  const { id } = await params;
  const { booking: row, invoiceInitial } = await getAdminBookingBundle(id);

  return (
    <div className="space-y-6">
      <BookingSectionIntro step="Billing" title="Invoice & customer PDF">
        <p>
          Edit each line (item, weight, size, line total), optional service description and notes, then currency and
          grand total. The customer PDF matches the line table plus one total. Toggle download from Track / profile.{" "}
          <strong className="font-medium text-ink">Save invoice</strong> persists all rows.
        </p>
      </BookingSectionIntro>

      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5 shadow-sm">
        <AdminBookingInvoiceForm
          bookingId={row.id}
          allowCustomerInvoicePdf={row.invoicePdfReady !== false}
          initial={invoiceInitial}
        />
      </div>
    </div>
  );
}
