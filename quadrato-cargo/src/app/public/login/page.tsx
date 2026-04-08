import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CustomerAuthLayout } from "@/components/auth/CustomerAuthLayout";
import { formatAuthCallbackError } from "@/lib/auth-callback-errors";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { publicUi } from "@/components/public/public-ui";
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
  const registerHref = `/public/register?callbackUrl=${encodeURIComponent(redirectAfterLogin)}`;

  return (
    <CustomerAuthLayout
      title="Log in"
      description={
        <>
          <span className="block">
            Sign in with the email and password from your registration. First time?{" "}
            <Link href={registerHref} className={publicUi.link}>
              Create an account
            </Link>{" "}
            — it is instant and does not require admin approval.
          </span>
        </>
      }
    >
      <LoginForm callbackError={callbackError} redirectTo={redirectAfterLogin} />
    </CustomerAuthLayout>
  );
}
