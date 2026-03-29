import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { siteDescription } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Doorstep pickup, scheduled collection, international shipping support, and shipment tracking.",
};

const services = [
  {
    name: "Instant collection",
    body: "Request immediate pickup at your address. Where serviceable, our team dispatches quickly.",
  },
  {
    name: "Scheduled pickup",
    body: "Choose a date and time window for collection and we assign the pickup accordingly.",
  },
  {
    name: "International shipment support",
    body: "For cross-border deliveries, we coordinate documentation, movement, and partner handoff.",
  },
  {
    name: "Tracking milestones",
    body: "Status updates are shared through the tracking flow so customers can follow progress clearly.",
  },
  {
    name: "Delivery confirmation",
    body: "Delivery status and references remain available for support and record keeping.",
  },
  {
    name: "Traditional logistics suite",
    body: "We also support cargo, lane-based pricing, and standard logistics operations for business flows.",
  },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHero
        eyebrow="What we run"
        title="International courier at your doorstep"
        description={siteDescription}
      />

      <section className="page-section">
        <Container>
          <ul className="grid gap-5 md:grid-cols-2">
            {services.map((s) => (
              <li
                key={s.name}
                className="card-interactive rounded-2xl border border-border bg-surface-elevated/70 p-8 backdrop-blur-sm"
              >
                <div className="mb-5 h-1 w-14 rounded-full bg-gradient-to-r from-teal to-accent" />
                <h2 className="font-display text-xl font-semibold text-ink">{s.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-16 rounded-[1.5rem] border border-dashed border-teal/30 bg-teal/5 p-10 text-center backdrop-blur-sm">
            <p className="text-sm text-muted">
              Sending internationally? Submit your booking details and our team
              will guide pickup, documentation, and the next shipment stage.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/public/book"
                className="btn-primary inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20"
              >
                Book courier
              </Link>
              <Link
                href="/public/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-ghost-border px-8 py-3.5 text-sm font-semibold text-ink transition hover:bg-pill-hover"
              >
                Talk to dispatch
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
