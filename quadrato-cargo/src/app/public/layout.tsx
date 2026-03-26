import { AppSessionProvider } from "@/components/auth/SessionWrap";
import { Footer } from "@/components/Foot";
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
          <div className="border-b border-teal/20 bg-teal/10 px-4 py-2 text-center text-sm text-ink">
            <span>{siteSettings.announcementText}</span>
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
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </AppSessionProvider>
  );
}
