import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="app-shell flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface-elevated/80 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Quadrato Cargo — Admin
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with the admin email and password from your API environment (
          <code className="rounded bg-pill px-1 py-0.5 text-xs">ADMIN_EMAIL</code> /{" "}
          <code className="rounded bg-pill px-1 py-0.5 text-xs">ADMIN_PASSWORD</code>
          ). Courier, agency, and customer accounts use the public login — not this screen.
        </p>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
        <p className="mt-8 text-center text-xs text-muted-soft">
          <Link href="/public" className="underline-offset-2 hover:underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
