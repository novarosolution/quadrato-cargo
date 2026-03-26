import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeBtn";
import { isAdminSessionValid } from "@/lib/admin-auth";
import { AdminLogoutButton } from "./dashboard/LogoutB";
import { AdminNav } from "./dashboard/Nav";

const adminMenu = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Data" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/bookings", label: "Bookings" }
];

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminSessionValid())) {
    redirect("/admin/login");
  }

  return (
    <div className="app-shell min-h-screen bg-canvas text-ink">
      <div className="sticky top-0 z-30 border-b border-border bg-surface-elevated/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Link href="/admin/dashboard" className="font-display text-lg font-semibold tracking-tight">
              Admin Control Center
            </Link>
            <p className="text-xs text-muted-soft">Quadrato Cargo operations & reports</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminNav nav={adminMenu} />
            <ThemeToggle className="h-9 w-9 rounded-lg" />
            <AdminLogoutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
