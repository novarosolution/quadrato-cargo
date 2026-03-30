import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeBtn";
import { AdminLogoutButton } from "./dashboard/LogoutB";
import { AdminNav } from "./dashboard/Nav";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell admin-app-shell min-h-screen bg-canvas text-ink">
      <div className="sticky top-0 z-30 border-b border-border-strong/80 bg-surface-elevated/95 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link
                href="/admin/dashboard"
                className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
              >
                Admin Control Center
              </Link>
              <p className="mt-0.5 text-sm text-muted">
                Pick a tab below — hover any item for a short description.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <ThemeToggle className="h-10 w-10 rounded-xl border border-border-strong bg-canvas/40" />
              <AdminLogoutButton />
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <AdminNav />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
