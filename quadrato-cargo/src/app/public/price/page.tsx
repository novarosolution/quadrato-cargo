import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "PIN-based instant pickup zones (~10 min target), scheduled collection, international lanes, and traditional logistics bands — indicative only.",
};

const zones = [
  {
    name: "Instant pickup — serviceable PINs",
    range: "Postal codes where backend can dispatch field staff fast",
    note: "Where we target ~10 minutes from assignment to your door; highest priority for same-hour collection requests.",
  },
  {
    name: "Scheduled & metro extended",
    range: "Booked windows and wider city coverage",
    note: "Pickup at your chosen slot or longer travel times — priced on distance, time, and vehicle class, not the 10-minute instant target.",
  },
  {
    name: "International & cargo",
    range: "Out of country and heavy cartons",
    note: "Export, customs, and partner handoff workflows plus pallets or vans; aligned with traditional logistics pricing models.",
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
        title="Serviceable PINs vs scheduled vs international"
        description={
          <>
            The <strong className="font-semibold text-teal">~10-minute</strong>{" "}
            target applies only where your PIN qualifies for instant collection
            and our backend can assign logistics staff immediately. Scheduled
            pickups, wider geography, and international legs use separate
            bands — all indicative until confirmed in writing.
          </>
        }
      />

      <section className="py-16 sm:py-24">
        <Container>
          <h2 className="font-display text-xl font-semibold text-ink">Coverage zones</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Map which PINs get instant dispatch vs scheduled-only when you go
            live — this layout separates rapid doorstep collection from
            traditional lane pricing.
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
            We price on service time, vehicle class, and risk — not just kilos.
            These bands help you brief us faster.
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
              Send lanes, typical weekly volume, and any SLA (e.g. must arrive
              before 11:00). We reply with options — economy, standard, and rush
              where available.
            </p>
            <Link
              href="/public/contact"
              className="btn-primary mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20"
            >
              Request a quote
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
