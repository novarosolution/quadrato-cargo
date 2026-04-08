import type { Metadata } from "next";
import { AdminBookingContactForm } from "../../AdminBookingContactForm";
import { getAdminBookingBundle } from "../_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "../BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Contacts — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingContactsPage({ params }: Props) {
  const { id } = await params;
  const { booking: row, contactInitial } = await getAdminBookingBundle(id);

  return (
    <div className="space-y-6">
      <BookingSectionIntro step="People" title="Sender & recipient">
        <p>
          Updates merge into the booking payload. These fields feed public Track, customer profile, and PDFs where
          applicable.
        </p>
      </BookingSectionIntro>

      <div className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5 shadow-sm">
        <AdminBookingContactForm
          bookingId={row.id}
          routeType={row.routeType === "international" ? "international" : "domestic"}
          initial={contactInitial}
        />
      </div>
    </div>
  );
}
