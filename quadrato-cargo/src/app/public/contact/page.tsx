import type { Metadata } from "next";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicCardIcon } from "@/components/public/PublicCardIcon";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { fetchSiteSettings } from "@/lib/api/public-client";
import { buildContactDispatchSidebarItems } from "@/lib/site-content";
import { ContactForm } from "./Contact";
import { publicUi } from "@/components/public/public-ui";
import { ContactLocationMap } from "./ContactLocationMap";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Quadrato Cargo for pickup support, shipment queries, and pricing quotes.",
};

export default async function ContactPage() {
  const siteSettings = await fetchSiteSettings();
  const dispatchItems = buildContactDispatchSidebarItems({
    supportPhone: siteSettings.pdfSupportPhone,
    supportEmail: siteSettings.pdfSupportEmail,
    publicInfoEmail: siteSettings.publicInfoEmail,
    officeAddress: siteSettings.pdfCompanyAddress,
  });

  return (
    <div className={publicUi.page}>
      <PageHero
        eyebrow="Contact"
        title="Talk to dispatch"
        description="Route, timing, and quote — send details in the form."
      />

      <PublicPageSection>
        <Container>
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className={publicUi.sectionTitleMd}>Dispatch</h2>
              <p className="mt-2 text-sm text-muted">
                Phone, email, and address come from admin Data &amp; site settings (same as footer).
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
                            <a href={ch.href} className={publicUi.linkQuiet}>
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
          <ContactLocationMap
            officeAddress={siteSettings.pdfCompanyAddress}
            googleMapsEmbedSrc={siteSettings.googleMapsEmbedSrc}
          />
        </Container>
      </PublicPageSection>
    </div>
  );
}
