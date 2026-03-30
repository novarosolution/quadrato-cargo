import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/auth/SessionWrap";
import { assertAgency } from "@/lib/agency-auth";
import { AgencyNav } from "./Nav";

export const metadata: Metadata = {
  title: "Agency",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AgencyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const agency = await assertAgency();

  return (
    <AppSessionProvider>
      <div className="app-shell admin-app-shell min-h-screen bg-canvas text-ink">
        <AgencyNav email={agency.email} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </AppSessionProvider>
  );
}
