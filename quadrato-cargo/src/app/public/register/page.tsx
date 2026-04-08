import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CustomerAuthLayout } from "@/components/auth/CustomerAuthLayout";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { publicUi } from "@/components/public/public-ui";
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

  const loginHref = `/public/login?callbackUrl=${encodeURIComponent(redirectAfterRegister)}`;

  return (
    <CustomerAuthLayout
      title="Register"
      description={
        <>
          Create your customer account in seconds. Book while logged in to keep all shipments
          and tracking in one place. Already registered?{" "}
          <Link href={loginHref} className={publicUi.link}>
            Log in
          </Link>
          .
        </>
      }
    >
      <RegisterForm redirectTo={redirectAfterRegister} />
    </CustomerAuthLayout>
  );
}
