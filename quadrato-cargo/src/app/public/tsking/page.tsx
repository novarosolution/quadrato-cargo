import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { auth } from "@/auth";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchProfileBookingsServer } from "@/lib/api/profile-client";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { TrackOrderForm } from "./trakindfom";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Track your shipment status using booking ID or Tracking ID.",
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
    ? await fetchProfileBookingsServer(cookieHeader, { limit: 5, summary: true })
    : { ok: false as const };
  const userBookings = userBookingsRes.ok
    ? (userBookingsRes.data.bookings || []).filter(
        (b) => normalizeBookingStatus(b.status) !== "delivered",
      )
    : [];

  return (
    <div>
      <PageHero
        eyebrow="Tracking"
        title="Track your order in real time"
        description="Enter your booking ID or Tracking ID to see the latest status."
      />
      <PublicPageSection compact>
        <Container className="max-w-2xl">
          {userBookings.length > 0 ? (
            <PublicCard className="mb-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                Your recent orders
              </h2>
              <p className="mt-1 text-sm text-muted">
                Quick track links for your last bookings.
              </p>
              <ul className="mt-4 space-y-2">
                {userBookings.map((b) => {
                  const reference =
                    b.publicBarcodeCode || b.consignmentNumber || b.id;
                  return (
                    <li
                      key={b.id}
                      className="panel-card-soft flex flex-wrap items-center justify-between gap-2 text-sm"
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
            </PublicCard>
          ) : null}
          <TrackOrderForm initialReference={initialReference} />
        </Container>
      </PublicPageSection>
    </div>
  );
}
