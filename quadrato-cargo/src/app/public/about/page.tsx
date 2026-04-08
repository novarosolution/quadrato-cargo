import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Target, Telescope } from "lucide-react";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { PageHero } from "@/components/Hero";
import { publicUi } from "@/components/public/public-ui";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `${siteName} — technology-driven logistics, on-demand and scheduled pickup, and customer-centric courier solutions from Ahmedabad.`,
};

const OFFICE_ADDRESS_LINE =
  "Iconic Shyamal, Nr Shyamal Cross Roads, Satellite, Ahmedabad – 380015";

/** OpenStreetMap embed — no API key; works with CSP frame-src for openstreetmap.org. */
const MAP_OSM_EMBED_SRC =
  "https://www.openstreetmap.org/export/embed.html?bbox=" +
  encodeURIComponent("72.485,23.008,72.545,23.048") +
  "&layer=mapnik&marker=" +
  encodeURIComponent("23.0269,72.5283");

const MAPS_OPEN_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(
    "Iconic Shyamal, Nr Shyamal Cross Roads, Satellite, Ahmedabad 380015",
  );

export default function AboutPage() {
  return (
    <div className={publicUi.page}>
      <PageHero
        eyebrow="About"
        title={`About ${siteName}`}
        description="Technology-driven logistics with efficient first-mile pickup and a focus on trust, speed, and customer experience."
      />

      <PublicPageSection>
        <Container>
          <div className="mx-auto max-w-3xl">
            <PublicCard className="border-border-strong/80 bg-surface-elevated/50 sm:p-8 md:p-10">
              <h2 className={publicUi.sectionTitle}>Who we are</h2>
              <div className={`mt-5 ${publicUi.prose}`}>
                <p>
                  {siteName} is a technology-driven logistics service provider focused on delivering
                  efficient, flexible, and customer-centric courier solutions. We specialize in enabling
                  on-demand and scheduled first-mile pickup services, ensuring seamless parcel movement from
                  the customer&apos;s doorstep to the delivery network.
                </p>
              </div>
            </PublicCard>
          </div>

          <ul className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            <li>
              <PublicCard className="h-full border-teal/20 bg-linear-to-br from-teal/6 to-transparent sm:p-8">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal/15 text-teal">
                  <Target className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h2 className={`mt-5 ${publicUi.sectionTitleMd}`}>Our mission</h2>
                <p className={`mt-3 ${publicUi.proseSingle}`}>
                  To provide reliable, technology-enabled logistics solutions that enhance efficiency, reduce
                  turnaround time, and deliver superior customer experience.
                </p>
              </PublicCard>
            </li>
            <li>
              <PublicCard className="h-full border-accent/20 bg-linear-to-br from-accent/6 to-transparent sm:p-8">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Telescope className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h2 className={`mt-5 ${publicUi.sectionTitleMd}`}>Our vision</h2>
                <p className={`mt-3 ${publicUi.proseSingle}`}>
                  To establish {siteName} as a trusted and scalable logistics partner, recognized for
                  innovation, operational excellence, and customer trust in the cargo and courier ecosystem.
                </p>
              </PublicCard>
            </li>
          </ul>
        </Container>
      </PublicPageSection>

      <PublicPageSection className="border-t border-border bg-canvas-mid/30">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <p className="section-eyebrow justify-center sm:justify-start">Visit us</p>
              <h2 className={publicUi.sectionTitleDisplay}>
                Ahmedabad
              </h2>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10 lg:items-start">
              <div className="lg:col-span-5">
                <PublicCard className="h-full sm:p-6">
                  <div className="flex gap-4">
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal">
                      <MapPin className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">Office address</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{OFFICE_ADDRESS_LINE}</p>
                      <Link
                        href={MAPS_OPEN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-4 inline-flex ${publicUi.link}`}
                      >
                        Open in Google Maps
                      </Link>
                    </div>
                  </div>
                </PublicCard>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface-elevated shadow-lg shadow-black/10 lg:col-span-7">
                <iframe
                  title={`Map: ${siteName} office, Satellite, Ahmedabad`}
                  src={MAP_OSM_EMBED_SRC}
                  className="aspect-4/3 min-h-[280px] w-full border-0 sm:min-h-[360px] lg:aspect-auto lg:min-h-[400px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <p className="border-t border-border bg-canvas/30 px-3 py-2 text-center text-[11px] text-muted-soft">
                  ©{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={publicUi.linkQuiet}
                  >
                    OpenStreetMap
                  </a>{" "}
                  contributors ·{" "}
                  <a
                    href="https://www.openstreetmap.org/?mlat=23.0269&mlon=72.5283#map=17/23.0269/72.5283"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={publicUi.linkQuiet}
                  >
                    Full screen map
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </PublicPageSection>

      <PublicPageSection compact className="pb-16! lg:pb-20!">
        <Container>
          <PublicCard className="mx-auto max-w-2xl border-dashed border-teal/30 bg-teal/4 text-center sm:p-8">
            <p className="text-sm text-muted">Questions or quotes?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/public/contact"
                className="btn-primary inline-flex items-center justify-center rounded-2xl border border-teal/70 bg-teal px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/20"
              >
                Contact us
              </Link>
              <Link
                href="/public/book"
                className="inline-flex items-center justify-center rounded-2xl border border-ghost-border px-6 py-3 text-sm font-semibold text-ink transition hover:bg-pill-hover"
              >
                Book courier
              </Link>
            </div>
          </PublicCard>
        </Container>
      </PublicPageSection>
    </div>
  );
}
