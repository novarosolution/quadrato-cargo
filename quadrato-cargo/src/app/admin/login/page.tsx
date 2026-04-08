import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageHeader } from "@/components/layout/AppPageHeader";
import { Container } from "@/components/Wrap";
import { publicUi } from "@/components/public/public-ui";
import { isAdminSessionValid } from "@/lib/admin-auth";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdminSessionValid()) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-teal/[0.07] via-canvas to-canvas px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] sm:pb-16 sm:pt-16">
      <div
        className="pointer-events-none fixed -right-32 -top-32 h-72 w-72 rounded-full bg-teal/10 blur-3xl"
        aria-hidden
      />
      <Container className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <PublicPageHeader eyebrow="Admin" title="Sign in" />
        <PublicCard className="mt-6 shadow-2xl shadow-black/35 sm:p-8">
          <AdminLoginForm />
        </PublicCard>
        <p className={publicUi.authFooterNote}>
          <Link href="/public" className={publicUi.linkQuiet}>
            Back to site
          </Link>
        </p>
      </Container>
    </div>
  );
}
