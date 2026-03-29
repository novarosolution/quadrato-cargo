import type { Metadata } from "next";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { QuoteRequestButton } from "./QuoteRequestButton";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pickup and shipment pricing by coverage zone, service mode, and shipment size.",
};

const zones = [
  {
    name: "Instant pickup",
    range: "ZIP / postal codes with fast dispatch",
    note: "Urgent collection.",
  },
  {
    name: "Scheduled coverage",
    range: "Booked windows, wider city",
    note: "Distance, window, and vehicle affect price.",
  },
  {
    name: "International & cargo",
    range: "Cross-border and heavy",
    note: "Compliance and handling stages included.",
  },
];

const bands = [
  { label: "Document / small parcel", hint: "Up to ~5 kg, hand carry" },
  { label: "Standard cargo", hint: "Cartons, totes, midsize items" },
  { label: "Pallet / tail-lift", hint: "Skids, bulky equipment" },
];

export default function PricingPage() {
  return (
    <div>
      <PageHero
        eyebrow="Rates"
        title="Pricing by service type"
        description="Depends on area, mode, and parcel profile — share your route for a quote."
      />

      <section className="page-section">
        <Container>
          <h2 className="font-display text-xl font-semibold text-ink">Coverage zones</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Compare where instant dispatch is available and where scheduled
            service is used.
          </p>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {zones.map((z) => (
              <li
                key={z.name}
                className="card-interactive rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-sm"
              >
                <h3 className="font-display font-semibold text-ink">{z.name}</h3>
                <p className="mt-2 text-sm font-medium text-teal">{z.range}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{z.note}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-16 font-display text-xl font-semibold text-ink">
            Weight &amp; size bands
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Shipment size and handling profile help us share the right options quickly.
          </p>
          <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-elevated/60 backdrop-blur-sm">
            {bands.map((b) => (
              <li
                key={b.label}
                className="flex flex-col gap-1 px-6 py-4 transition-colors hover:bg-pill sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-ink">{b.label}</span>
                <span className="text-sm text-muted">{b.hint}</span>
              </li>
            ))}
          </ul>

          <div className="mt-14 rounded-[1.5rem] border border-border bg-surface-elevated/80 p-8 backdrop-blur-sm sm:p-10">
            <h2 className="font-display text-lg font-semibold text-ink">
              Get a written quote
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Share your route, shipment type, and preferred timeline. We will
              return clear options for your use case.
            </p>
            <QuoteRequestButton />
          </div>
        </Container>
      </section>
    </div>
  );
}
