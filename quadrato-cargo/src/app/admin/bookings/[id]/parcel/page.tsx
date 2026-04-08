import type { Metadata } from "next";
import { AdminBookingShipmentForm } from "../../AdminBookingShipmentForm";
import { getAdminBookingBundle } from "../_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "../BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Parcel — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingParcelPage({ params }: Props) {
  const { id } = await params;
  const { booking: row, shipmentInitial } = await getAdminBookingBundle(id);

  return (
    <div className="space-y-6">
      <BookingSectionIntro step="Shipment" title="Parcel details">
        <p>
          Edit each parcel in the table (matches customer book form: one block per parcel). Saving updates combined
          shipment text, total weight, and per-parcel rows stored on the booking. Invoice line items still follow parcel
          count on the invoice tab.
        </p>
      </BookingSectionIntro>

      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5 shadow-sm">
        <AdminBookingShipmentForm
          bookingId={row.id}
          routeType={row.routeType === "international" ? "international" : "domestic"}
          initial={shipmentInitial}
        />
      </div>
    </div>
  );
}
