import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/auth/SessionWrap";
import { assertCourier } from "@/lib/courier-auth";
import { roleClass, roleUi } from "@/components/role/role-ui";
import { courierMeta } from "@/lib/courier-content";
import { CourierNav } from "./Nav";

export const metadata: Metadata = {
  title: courierMeta.layoutTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CourierLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const courier = await assertCourier();

  return (
    <AppSessionProvider>
      <div className="app-shell admin-app-shell min-h-screen bg-canvas bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(45,212,191,0.07),transparent_55%)] text-ink">
        <CourierNav email={courier.email} />
        <main className={roleClass(roleUi.main, "courier-main")}>{children}</main>
      </div>
    </AppSessionProvider>
  );
}
