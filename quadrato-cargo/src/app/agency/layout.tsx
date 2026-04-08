import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/auth/SessionWrap";
import { auth } from "@/auth";
import { assertAgency } from "@/lib/agency-auth";
import { roleClass, roleUi } from "@/components/role/role-ui";
import { agencyMeta } from "@/lib/agency-content";
import { AgencyNav } from "./Nav";

export const metadata: Metadata = {
  title: {
    default: agencyMeta.layoutDefaultTitle,
    template: `%s · ${agencyMeta.layoutTitle}`,
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AgencyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await assertAgency();
  const session = await auth();
  const u = session?.user;

  return (
    <AppSessionProvider>
      <div className="app-shell admin-app-shell min-h-screen bg-canvas bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(45,212,191,0.09),transparent_55%)] text-ink">
        <AgencyNav
          name={u?.name ?? null}
          agencyAddress={u?.agencyAddress ?? null}
          agencyPhone={u?.agencyPhone ?? null}
        />
        <main className={roleClass(roleUi.main, "agency-main")}>{children}</main>
      </div>
    </AppSessionProvider>
  );
}
