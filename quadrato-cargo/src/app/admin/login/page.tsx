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
          Super-admin (.env credentials) or team accounts created under Users →
          Create team account. Manage contacts, bookings, users, and status
          updates here.
        </p>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
        <p className="mt-8 text-center text-xs text-muted-soft">
          <Link href="/" className="underline-offset-2 hover:underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
