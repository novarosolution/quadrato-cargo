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
      <div className="app-shell min-h-screen bg-canvas text-ink">
        <CourierNav email={courier.email} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </AppSessionProvider>
  );
}
