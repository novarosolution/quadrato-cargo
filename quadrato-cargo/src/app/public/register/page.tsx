import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { RegisterForm } from "./Register";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create your own Quadrato Cargo customer account — book, track shipments, and manage your profile.",
};

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const q = await searchParams;
  const redirectAfterRegister = safeRedirectPath(
    firstParam(q.callbackUrl),
    "/public/profile",
  );

  const session = await auth();
  if (session?.user) {
    const target =
      redirectAfterRegister === "/public/login" ||
      redirectAfterRegister === "/public/register"
        ? "/public/profile"
        : redirectAfterRegister;
    redirect(target);
  }

  return (
    <div>
      <section className="border-b border-border py-10 sm:py-14">
        <Container className="max-w-lg">
          <p className="section-eyebrow">Account</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Register
          </h1>
          <p className="mt-3 text-sm text-muted">
            Create your customer account in seconds. Book while logged in to keep
            all shipments and tracking in one place.
          </p>
        </Container>
      </section>

      <PublicPageSection>
        <Container className="max-w-lg">
          <PublicCard className="shadow-2xl shadow-black/40 sm:p-8">
            <RegisterForm redirectTo={redirectAfterRegister} />
          </PublicCard>
          <p className="mt-8 text-center text-xs text-muted-soft">
            <Link href="/public" className="underline-offset-2 hover:underline">
              Back to home
            </Link>
          </p>
        </Container>
      </PublicPageSection>
    </div>
  );
}
