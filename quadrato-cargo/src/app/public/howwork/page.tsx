import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Quadrato Cargo works: booking, pickup, shipment updates, and delivery confirmation.",
};

const steps = [
  {
    title: "Book",
    body: "Sender, recipient, parcel details. Instant or scheduled pickup; we check serviceability first.",
  },
  {
    title: "Pickup assigned",
    body: "We assign staff and run scheduled windows as you selected.",
  },
  {
    title: "Tracking ID",
    body: "After acceptance you get a reference; track with booking or tracking ID on the site.",
  },
  {
    title: "In transit",
    body: "Sorting, movement, and partner handoff — international lanes include customs where needed.",
  },
  {
    title: "Delivered",
    body: "Status updates for you and support; tracking stays on the tracking page.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        eyebrow="Flow"
        title="From booking to delivery"
        description="Pickup, movement, and status updates in one clear path."
      />

      <section className="page-section">
        <Container>
          <ol className="space-y-8">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-4 md:flex-row md:gap-10"
              >
                <div className="flex shrink-0 items-start md:w-40">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal/70 text-base font-bold text-slate-950 shadow-lg shadow-teal/25">
                    {i + 1}
                  </span>
                </div>
                <div className="card-interactive flex-1 rounded-2xl border border-border bg-surface-elevated/70 p-5 backdrop-blur-sm md:p-6">
                  <h2 className="font-display text-lg font-semibold text-ink">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-surface-elevated to-surface px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="max-w-md text-sm text-muted">
              Routes and pricing — see the price page or ask dispatch.
            </p>
            <Link
              href="/public/price"
              className="btn-primary inline-flex shrink-0 items-center justify-center rounded-2xl border border-teal/70 bg-teal px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-teal/25"
            >
              Pricing
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
