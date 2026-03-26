import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { auth } from "@/auth";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchProfileBookingsServer } from "@/lib/api/profile-client";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { TrackOrderForm } from "./trakindfom";

export const metadata: Metadata = {
  title: "Track order",
  description:
    "Track your shipment status using booking ID or consignment number.",
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams?: Promise<{ reference?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const initialReference = String(params.reference ?? "").trim();
  const session = await auth();
  const cookieHeader = (await cookies()).toString();
  const userBookingsRes = session?.user?.id
    ? await fetchProfileBookingsServer(cookieHeader)
    : { ok: false as const };
  const userBookings = userBookingsRes.ok
    ? (userBookingsRes.data.bookings || []).slice(0, 5)
    : [];

  return (
    <div>
      <PageHero
        eyebrow="Tracking"
        title="Track your order in real time"
        description="Enter your booking ID or consignment number to see latest dispatch status. You can also open this page directly from the QR slip."
      />
      <section className="py-12 sm:py-16">
        <Container className="max-w-2xl">
          {userBookings.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-border bg-surface-elevated/70 p-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                Your recent orders
              </h2>
              <p className="mt-1 text-sm text-muted">
                Quick track links for your last bookings.
              </p>
              <ul className="mt-4 space-y-2">
                {userBookings.map((b) => {
                  const reference = b.consignmentNumber || b.id;
                  return (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong bg-canvas/40 px-3 py-2 text-sm"
                    >
                      <span className="text-muted-soft">
                        {BOOKING_STATUS_LABELS[normalizeBookingStatus(b.status)]}
                      </span>
                      <Link
                        href={`/public/tsking?reference=${encodeURIComponent(reference)}`}
                        className="font-mono text-teal hover:underline"
                      >
                        {reference}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
            <TrackOrderForm initialReference={initialReference} />
          </div>
        </Container>
      </section>
    </div>
  );
}
