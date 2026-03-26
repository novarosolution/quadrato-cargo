import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { siteDescription } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "International courier at your doorstep — instant or scheduled PIN pickup, backend-led collection, consignment numbers, manual tracking at first, and traditional logistics options.",
};

const services = [
  {
    name: "Instant collection (PIN / postal code)",
    body: "Request immediate pickup at your address. Where the PIN is serviceable, our backend dispatches logistics staff with a target of about 10 minutes — not a guarantee; traffic and capacity apply.",
  },
  {
    name: "Scheduled pickup",
    body: "Choose a date and time window for collection at your PIN or postal code. Same backend coordination: field team arrives in the booked slot, then operations continue manually until carrier handoff.",
  },
  {
    name: "International door-to-door orchestration",
    body: "Out-of-country bookings: we collect from the sender, drive export and customs steps, and pass the parcel to the associated international carrier. Customers receive a consignment number after acceptance; partner identity is not exposed in the initial phase.",
  },
  {
    name: "Manual tracking & milestones",
    body: "Early-stage tracking is entered manually by operations — status updates, handoffs, and exceptions are logged as the shipment moves. Digital self-serve tracking can evolve as you integrate carriers.",
  },
  {
    name: "QR-oriented delivery receipt",
    body: "Delivery receipts are designed like utility-style slips (e.g. gas bills): QR-led so customers can scan and fetch the latest status without hunting through emails.",
  },
  {
    name: "Traditional logistics suite",
    body: "Beyond doorstep collection, we mirror familiar market offerings — lane-based pricing, cargo bands, scheduled linehaul, and proof of delivery options for domestic and commercial flows.",
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

      <section className="py-16 sm:py-24">
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
              Sending out of country? Use the booking form with full sender,
              recipient, and customs-ready details — choose instant or scheduled
              PIN pickup; we take it from field acceptance through export and
              partner handoff.
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
