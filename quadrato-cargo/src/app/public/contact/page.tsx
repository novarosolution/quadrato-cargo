import type { Metadata } from "next";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicCardIcon } from "@/components/public/PublicCardIcon";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { fetchSiteSettings } from "@/lib/api/public-client";
import { buildContactDispatchSidebarItems } from "@/lib/site-content";
import { ContactForm } from "./Contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Quadrato Cargo for pickup support, shipment queries, and pricing quotes.",
};

const linkClass =
  "text-teal underline-offset-2 transition hover:text-teal hover:underline";

export default async function ContactPage() {
  const siteSettings = await fetchSiteSettings();
  const dispatchItems = buildContactDispatchSidebarItems({
    supportPhone: siteSettings.pdfSupportPhone,
    supportEmail: siteSettings.pdfSupportEmail,
    publicInfoEmail: siteSettings.publicInfoEmail,
  });

  return (
    <div className="stack-page content-full">
      <PageHero
        eyebrow="Contact"
        title="Talk to dispatch"
        description="Route, timing, and quote — send details in the form."
      />

      <PublicPageSection>
        <Container>
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="font-display text-lg font-semibold text-ink">Dispatch</h2>
              <p className="mt-2 text-sm text-muted">
                Phone and email below match the site footer and your admin “Data” settings. Form is
                fastest for detailed requests.
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                {dispatchItems.map((ch) => (
                  <PublicCard key={ch.id}>
                    <div className="flex gap-3">
                      <PublicCardIcon Icon={ch.Icon} className="mb-0 shrink-0" size="sm" />
                      <div className="min-w-0">
                        <dt className="font-medium text-ink">{ch.label}</dt>
                        <dd className="mt-1 wrap-break-word text-muted">
                          {ch.href ? (
                            <a href={ch.href} className={linkClass}>
                              {ch.body}
                            </a>
                          ) : (
                            ch.body
                          )}
                        </dd>
                      </div>
                    </div>
                  </PublicCard>
                ))}
              </dl>
            </div>
            <PublicCard className="shadow-2xl shadow-black/35 lg:col-span-3 lg:p-10">
              <ContactForm />
            </PublicCard>
          </div>
        </Container>
      </PublicPageSection>
    </div>
  );
}
