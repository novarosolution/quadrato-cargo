"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CircleHelp,
  Database,
  LayoutDashboard,
  Mail,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";

const adminNavItems: Array<{
  href: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
}> = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    hint: "Overview and recent bookings",
    Icon: LayoutDashboard,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    hint: "Monthly summaries",
    Icon: BarChart3,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    hint: "Site and data export",
    Icon: Database,
  },
  {
    href: "/admin/users",
    label: "Users",
    hint: "Staff, couriers, agencies",
    Icon: Users,
  },
  {
    href: "/admin/contacts",
    label: "Contacts",
    hint: "Inbound messages",
    Icon: Mail,
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    hint: "All shipments",
    Icon: Package,
  },
  {
    href: "/admin/help",
    label: "Help",
    hint: "Admin guide",
    Icon: CircleHelp,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label="Admin sections">
      {adminNavItems.map(({ href, label, hint, Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            title={hint}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-3.5 sm:py-2.5 ${
              isActive
                ? "bg-teal text-slate-950 shadow-sm ring-1 ring-teal/40"
                : "text-muted hover:bg-pill-hover hover:text-ink"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${isActive ? "text-slate-950" : "opacity-70"}`}
              strokeWidth={2}
              aria-hidden
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
