import type { Metadata } from "next";
import { AdminCollapsible } from "@/components/admin/AdminCollapsible";
import { AdminBookingCustomerLink } from "../../linkcustomer";
import { AdminBookingDataForm } from "../../booking";
import { AdminBookingPickupForm } from "../../AdminBookingPickupForm";
import { getAdminBookingBundle } from "../_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "../BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Pickup & data — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingMorePage({ params }: Props) {
  const { id } = await params;
  const { booking: row, pickupInitial, json } = await getAdminBookingBundle(id);

  return (
    <div className="space-y-6">
      <BookingSectionIntro step="Extra" title="Pickup, account link & raw JSON">
        <p>
          Pickup scheduling and sender pickup address, attach this booking to a customer login, or edit the full
          payload as JSON for advanced fixes.
        </p>
      </BookingSectionIntro>

      <AdminCollapsible
        id="booking-pickup-form"
        title="Pickup & sender address"
        description="Collection mode, window, instructions, and where we collect from."
        defaultOpen
      >
        <AdminBookingPickupForm
          bookingId={row.id}
          routeType={row.routeType === "international" ? "international" : "domestic"}
          initial={pickupInitial}
        />
      </AdminCollapsible>

      <AdminCollapsible
        id="booking-customer"
        title="Customer account link"
        description="Connect the shipment to a registered user so it appears in their profile."
      >
        <AdminBookingCustomerLink
          bookingId={row.id}
          linkedUserEmail={row.user?.email ?? null}
          embedded
        />
      </AdminCollapsible>

      <AdminCollapsible
        id="booking-data"
        title="Booking data (JSON)"
        description="Power users only — invalid JSON can break Track and PDFs."
      >
        <AdminBookingDataForm bookingId={row.id} routeType={row.routeType} payloadJson={json} />
      </AdminCollapsible>
    </div>
  );
}
