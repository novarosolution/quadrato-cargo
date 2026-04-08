import type { Metadata } from "next";
import Link from "next/link";
import { agencyGuidePageCopy, agencyMeta } from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";

export const metadata: Metadata = {
  title: agencyMeta.pageTitleGuide,
  robots: { index: false, follow: false },
};

export default function AgencyGuidePage() {
  return (
    <div className="stack-page content-wide gap-8 max-sm:gap-6">
      <AppSurfacePageHeader
        eyebrow={agencyGuidePageCopy.pageEyebrow}
        title={agencyGuidePageCopy.headerTitle}
        description={agencyGuidePageCopy.headerBlurb}
        actions={
          <Link
            href={agencyGuidePageCopy.backBookingsHref}
            prefetch={false}
            className="inline-flex items-center rounded-xl border border-border-strong bg-canvas/40 px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover"
          >
            {agencyGuidePageCopy.backBookingsLabel}
          </Link>
        }
      />

      <div className={agencyUi.pageGrid}>
        <div className="space-y-5">
          {agencyGuidePageCopy.sections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className={`${agencyUi.panelSurface} scroll-mt-28`}
            >
              <h2 className="font-display text-base font-semibold tracking-tight text-ink">
                {sec.title}
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                {sec.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal/80"
                      aria-hidden
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
