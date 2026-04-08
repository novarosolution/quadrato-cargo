import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import {
  agencyHubFormCopy,
  agencyHubPageCopy,
  agencyMeta,
} from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { AgencyProfileForm } from "../AgencyProfileForm";

export const metadata: Metadata = {
  title: agencyMeta.pageTitleHub,
  robots: { index: false, follow: false },
};

export default async function AgencyHubProfilePage() {
  const session = await auth();
  const u = session?.user;
  const profileInitial = {
    name: u?.name?.trim() ?? "",
    agencyAddress: u?.agencyAddress?.trim() ?? "",
    agencyPhone: u?.agencyPhone?.trim() ?? "",
    agencyCity: u?.agencyCity?.trim() ?? "",
  };

  return (
    <div className="stack-page content-wide gap-8 max-sm:gap-6">
      <AppSurfacePageHeader
        eyebrow={agencyHubPageCopy.pageEyebrow}
        title={agencyHubPageCopy.headerTitle}
        description={agencyHubPageCopy.headerBlurb}
        actions={
          <Link
            href={agencyHubPageCopy.guideHref}
            prefetch={false}
            className="inline-flex items-center rounded-xl border border-border-strong/70 bg-canvas/30 px-4 py-2 text-sm font-semibold text-teal transition hover:border-teal/40 hover:bg-teal/10"
          >
            {agencyHubPageCopy.guideLinkLabel}
          </Link>
        }
      />

      <div className={agencyUi.pageGrid}>
        <div className={agencyUi.panelSurface}>
          <header className={agencyUi.panelHeader}>
            <h2 className={`${agencyUi.panelTitle} text-ink`}>{agencyHubFormCopy.panelTitle}</h2>
            <p className={agencyUi.panelSubtitle}>{agencyHubFormCopy.panelSubtitle}</p>
          </header>
          <AgencyProfileForm
            initialName={profileInitial.name}
            initialAddress={profileInitial.agencyAddress}
            initialCity={profileInitial.agencyCity}
            initialPhone={profileInitial.agencyPhone}
          />
        </div>
      </div>
    </div>
  );
}
