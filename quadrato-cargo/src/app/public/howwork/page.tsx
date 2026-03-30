import type { Metadata } from "next";
import Link from "next/link";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicCardIcon } from "@/components/public/PublicCardIcon";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { howItWorksSteps } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Quadrato Cargo works: booking, pickup, shipment updates, and delivery confirmation.",
};

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        eyebrow="Flow"
        title="From booking to delivery"
        description="Pickup, movement, and status updates in one clear path."
      />

      <PublicPageSection>
        <Container>
          <ol className="space-y-8">
            {howItWorksSteps.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-4 md:flex-row md:gap-10">
                <div className="flex shrink-0 items-start md:w-40">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-teal to-teal/70 text-base font-bold text-slate-950 shadow-lg shadow-teal/25">
                    {i + 1}
                  </span>
                </div>
                <PublicCard interactive className="flex-1 md:p-6">
                  <PublicCardIcon Icon={step.Icon} />
                  <h2 className="font-display text-lg font-semibold text-ink -mt-2">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </PublicCard>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-linear-to-br from-surface-elevated to-surface px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
      </PublicPageSection>
    </div>
  );
}
