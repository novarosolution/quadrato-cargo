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
    title: "Book your shipment",
    body: "Enter sender, recipient, and parcel details. Choose instant or scheduled pickup.",
    detail: "We confirm serviceability before dispatch.",
  },
  {
    title: "Pickup is assigned",
    body: "Our team assigns staff and shares the pickup progress.",
    detail: "Scheduled pickup follows your selected date and time window.",
  },
  {
    title: "Consignment number is generated",
    body: "After pickup acceptance, you receive a tracking reference for status updates.",
    detail: "You can track from the website using booking ID or consignment number.",
  },
  {
    title: "Shipment processing and movement",
    body: "Operations manage sorting, transit, and handoff to the required network.",
    detail: "International lanes include compliance and customs checkpoints.",
  },
  {
    title: "Delivery update",
    body: "Delivery status is updated for customer visibility and support follow-up.",
    detail: "Tracking remains available anytime from the tracking page.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        eyebrow="Workflow"
        title="Doorstep booking to delivery updates"
        description="A clear flow from booking details to pickup, shipment movement, and final status updates."
      />

      <section className="page-section">
        <Container>
          <ol className="space-y-10">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-6 md:flex-row md:gap-12"
              >
                <div className="flex shrink-0 items-start md:w-44">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal/70 text-lg font-bold text-slate-950 shadow-lg shadow-teal/25">
                    {i + 1}
                  </span>
                </div>
                <div className="card-interactive flex-1 rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-sm md:p-8">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                  <p className="mt-5 border-t border-border pt-5 text-sm text-ink/90">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 flex flex-col gap-5 rounded-[1.5rem] border border-border bg-gradient-to-br from-surface-elevated to-surface px-6 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Need route guidance and pricing? Share your shipment lane and we will help you choose the right option.
            </p>
            <Link
              href="/public/price"
              className="btn-primary inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep to-accent px-6 py-3 text-sm font-semibold text-white shadow-md shadow-accent/25"
            >
              View pricing
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
