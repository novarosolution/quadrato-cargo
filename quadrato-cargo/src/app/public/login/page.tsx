import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { PublicPageHeader } from "@/components/layout/AppPageHeader";
import { Container } from "@/components/Wrap";
import { formatAuthCallbackError } from "@/lib/auth-callback-errors";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { LoginForm } from "./Login";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Quadrato Cargo account.",
};

type PageProps = {
  searchParams: Promise<{
    error?: string | string[];
    callbackUrl?: string | string[];
  }>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const q = await searchParams;
  const redirectAfterLogin = safeRedirectPath(
    firstParam(q.callbackUrl),
    "/public/profile",
  );

  const session = await auth();
  if (session?.user) {
    const target =
      redirectAfterLogin === "/public/login" || redirectAfterLogin === "/public/register"
        ? "/public/profile"
        : redirectAfterLogin;
    redirect(target);
  }

  const callbackError = formatAuthCallbackError(q.error);

  return (
    <div className="stack-page content-full">
      <section className="border-b border-border py-10 sm:py-14">
        <Container className="max-w-lg">
          <PublicPageHeader
            eyebrow="Account"
            title="Log in"
            description={
              <>
                <span className="block">
                  Sign in with the email and password from your registration. First time?{" "}
                  <Link href="/public/register" className="font-medium text-teal hover:underline">
                    Create an account
                  </Link>{" "}
                  — it is instant and does not require admin approval.
                </span>
                <span className="mt-2 block text-xs text-muted-soft">
                  Staff / team: use{" "}
                  <Link href="/admin/login" className="text-teal hover:underline">
                    Admin login
                  </Link>{" "}
                  — not this page.
                </span>
              </>
            }
          />
        </Container>
      </section>

      <PublicPageSection>
        <Container className="max-w-lg">
          <PublicCard className="shadow-2xl shadow-black/40 sm:p-8">
            <LoginForm
              callbackError={callbackError}
              redirectTo={redirectAfterLogin}
            />
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
