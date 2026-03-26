import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
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
            You create your own customer account here — dispatch does not need to
            invite you. Use the same email to log in, open your profile anytime,
            and attach courier bookings to this account so status and shipment
            details stay in one place.
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="max-w-lg">
          <div className="rounded-[1.5rem] border border-border bg-surface-elevated/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
            <RegisterForm redirectTo={redirectAfterRegister} />
          </div>
          <p className="mt-8 text-center text-xs text-muted-soft">
            <Link href="/public" className="underline-offset-2 hover:underline">
              Back to home
            </Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
