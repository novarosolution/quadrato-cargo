import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/auth/SessionWrap";
import { assertCourier } from "@/lib/courier-auth";
import { CourierNav } from "./Nav";

export const metadata: Metadata = {
  title: "Courier",
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
      <div className="app-shell admin-app-shell min-h-screen bg-canvas text-ink">
        <CourierNav email={courier.email} />
        <main className="role-dashboard-main">{children}</main>
      </div>
    </AppSessionProvider>
  );
}
