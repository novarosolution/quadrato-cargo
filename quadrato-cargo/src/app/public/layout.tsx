import { AppSessionProvider } from "@/components/auth/SessionWrap";
import { Footer } from "@/components/Foot";
import { PublicBottomNav } from "@/components/PublicBottomNav";
import { PublicZone } from "@/components/public/PublicZone";
import { PublicSpeedButtons } from "@/components/PublicSpeedButtons";
import { Header } from "@/components/TopBar";
import Link from "next/link";
import { fetchSiteSettings } from "@/lib/api/public-client";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await fetchSiteSettings();
  const showAnnouncement =
    siteSettings.announcementEnabled && siteSettings.announcementText.length > 0;

  return (
    <AppSessionProvider>
      <div className="app-shell flex min-h-full flex-col">
        {showAnnouncement ? (
          <div className="border-b border-teal/25 bg-linear-to-r from-teal/12 via-teal/8 to-accent/10 px-4 py-2.5 text-center text-sm text-ink backdrop-blur-sm">
            <span className="inline-block max-w-full wrap-break-word">{siteSettings.announcementText}</span>
            {siteSettings.announcementCtaLabel && siteSettings.announcementCtaHref ? (
              <Link
                href={siteSettings.announcementCtaHref}
                className="ml-2 font-medium text-teal underline-offset-2 hover:underline"
              >
                {siteSettings.announcementCtaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
        <Header />
        <main className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          <PublicZone>{children}</PublicZone>
        </main>
        <PublicSpeedButtons />
        <PublicBottomNav />
        <Footer initialSiteSettings={siteSettings} />
      </div>
    </AppSessionProvider>
  );
}
