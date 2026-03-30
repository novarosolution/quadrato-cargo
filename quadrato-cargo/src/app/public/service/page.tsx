import type { Metadata } from "next";
import Link from "next/link";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicCardIcon } from "@/components/public/PublicCardIcon";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { servicesPageCards } from "@/lib/site-content";
import { siteDescription } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Doorstep pickup, scheduled collection, international shipping support, and shipment tracking.",
};

export default function ServicesPage() {
  return (
    <div>
      <PageHero
        eyebrow="Services"
        title="International courier at your doorstep"
        description={siteDescription}
      />

      <PublicPageSection>
        <Container>
          <ul className="grid gap-5 md:grid-cols-2">
            {servicesPageCards.map((s) => (
              <li key={s.title}>
                <PublicCard interactive className="h-full sm:p-7">
                  <PublicCardIcon Icon={s.Icon} />
                  <h2 className="font-display text-lg font-semibold text-ink">{s.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </PublicCard>
              </li>
            ))}
          </ul>

          <PublicCard className="mt-12 border-dashed border-teal/30 bg-teal/5 text-center sm:p-8">
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
          </PublicCard>
        </Container>
      </PublicPageSection>
    </div>
  );
}
