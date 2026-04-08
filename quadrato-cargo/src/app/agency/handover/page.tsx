import type { Metadata } from "next";
import Link from "next/link";
import { agencyHandoverPageCopy, agencyMeta } from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { AgencyHandoverForm } from "../Handover";

export const metadata: Metadata = {
  title: agencyMeta.pageTitleHandover,
  robots: { index: false, follow: false },
};

export default function AgencyHandoverPage() {
  return (
    <div className="stack-page content-wide gap-8 max-sm:gap-6">
      <AppSurfacePageHeader
        eyebrow={agencyHandoverPageCopy.pageEyebrow}
        title={agencyHandoverPageCopy.headerTitle}
        description={agencyHandoverPageCopy.headerBlurb}
        actions={
          <Link
            href={agencyHandoverPageCopy.guideHref}
            prefetch={false}
            className="inline-flex items-center rounded-xl border border-border-strong/70 bg-canvas/30 px-4 py-2 text-sm font-semibold text-teal transition hover:border-teal/40 hover:bg-teal/10"
          >
            {agencyHandoverPageCopy.guideLinkLabel}
          </Link>
        }
      />

      <div className={agencyUi.pageGrid}>
        <div className={agencyUi.panelSurface}>
          <header className={agencyUi.panelHeader}>
            <h2 className={`${agencyUi.panelTitle} text-ink`}>
              {agencyHandoverPageCopy.formPanelTitle}
            </h2>
            <p className={agencyUi.panelSubtitle}>{agencyHandoverPageCopy.formPanelSubtitle}</p>
          </header>
          <AgencyHandoverForm />
        </div>
      </div>
    </div>
  );
}
