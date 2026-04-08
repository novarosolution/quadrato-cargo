/**
 * Admin sidebar/header navigation — edit sections and items here only.
 * Order: overview → day-to-day operations → people → help.
 */
import {
  BarChart3,
  Building2,
  CircleHelp,
  Database,
  LayoutDashboard,
  Mail,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
};

export type AdminNavSection = {
  id: string;
  /** Shown in docs / future mega-menu; optional screen-reader context */
  title: string;
  items: readonly AdminNavItem[];
};

export const adminNavSections = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        hint: "Snapshot & recent activity",
        Icon: LayoutDashboard,
      },
      {
        href: "/admin/reports",
        label: "Reports",
        hint: "Monthly CSV export",
        Icon: BarChart3,
      },
      {
        href: "/admin/settings",
        label: "Settings",
        hint: "Site, exports & options",
        Icon: Database,
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        href: "/admin/bookings",
        label: "Bookings",
        hint: "All shipments",
        Icon: Package,
      },
      {
        href: "/admin/contacts",
        label: "Contacts",
        hint: "Inbound messages",
        Icon: Mail,
      },
    ],
  },
  {
    id: "directory",
    title: "People & network",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        hint: "Accounts & roles",
        Icon: Users,
      },
      {
        href: "/admin/network",
        label: "Network",
        hint: "Agencies & couriers",
        Icon: Building2,
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        href: "/admin/help",
        label: "Help",
        hint: "Admin reference",
        Icon: CircleHelp,
      },
    ],
  },
] as const satisfies readonly AdminNavSection[];
