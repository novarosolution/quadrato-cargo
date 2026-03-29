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
    body: "Request pickup now; we dispatch where your area is serviceable.",
  },
  {
    name: "Scheduled pickup",
    body: "Pick a date and window; we align collection to it.",
  },
  {
    name: "International",
    body: "Cross-border moves with docs, transit, and carrier handoff.",
  },
  {
    name: "Tracking",
    body: "Milestones in the tracking flow so you can follow progress.",
  },
  {
    name: "Delivery confirmation",
    body: "Final status and references kept for support and records.",
  },
  {
    name: "Business logistics",
    body: "Cargo, lane pricing, and standard ops for business flows.",
  },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHero
        eyebrow="Services"
        title="International courier at your doorstep"
        description={siteDescription}
      />

      <section className="page-section">
        <Container>
          <ul className="grid gap-5 md:grid-cols-2">
            {services.map((s) => (
              <li
                key={s.name}
                className="card-interactive rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-sm sm:p-7"
              >
                <div className="mb-4 h-1 w-12 rounded-full bg-teal" />
                <h2 className="font-display text-lg font-semibold text-ink">{s.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl border border-dashed border-teal/30 bg-teal/5 p-6 text-center backdrop-blur-sm sm:p-8">
            <p className="text-sm text-muted">
              International send? Book online or talk to dispatch for the next step.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
              <Link
                href="/public/book"
                className="btn-primary inline-flex items-center justify-center rounded-2xl border border-teal/70 bg-teal px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/20"
              >
                Book courier
              </Link>
              <Link
                href="/public/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-ghost-border px-6 py-3 text-sm font-semibold text-ink transition hover:bg-pill-hover"
              >
                Contact
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
