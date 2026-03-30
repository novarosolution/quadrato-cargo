import type { Metadata } from "next";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicCardIcon } from "@/components/public/PublicCardIcon";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { pricingWeightBands, pricingZoneCards } from "@/lib/site-content";
import { QuoteRequestButton } from "./QuoteRequestButton";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pickup and shipment pricing by coverage zone, service mode, and shipment size.",
};

export default function PricingPage() {
  return (
    <div className="stack-page content-full">
      <PageHero
        eyebrow="Rates"
        title="Pricing by service type"
        description="Depends on area, mode, and parcel profile — share your route for a quote."
      />

      <PublicPageSection>
        <Container>
          <h2 className="font-display text-xl font-semibold text-ink">Coverage zones</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Compare where instant dispatch is available and where scheduled service is used.
          </p>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {pricingZoneCards.map((z) => (
              <li key={z.name}>
                <PublicCard interactive className="h-full">
                  <PublicCardIcon Icon={z.Icon} />
                  <h3 className="font-display font-semibold text-ink">{z.name}</h3>
                  <p className="mt-2 text-sm font-medium text-teal">{z.range}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{z.note}</p>
                </PublicCard>
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
            {pricingWeightBands.map((b) => {
              const BandIcon = b.Icon;
              return (
              <li
                key={b.label}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-pill sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <span className="inline-flex shrink-0 text-teal">
                  <BandIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-ink">{b.label}</span>
                  <span className="text-sm text-muted">{b.hint}</span>
                </div>
              </li>
            );
            })}
          </ul>

          <PublicCard className="mt-14 sm:p-10">
            <h2 className="font-display text-lg font-semibold text-ink">Get a written quote</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Share your route, shipment type, and preferred timeline. We will return clear options
              for your use case.
            </p>
            <QuoteRequestButton />
          </PublicCard>
        </Container>
      </PublicPageSection>
    </div>
  );
}
