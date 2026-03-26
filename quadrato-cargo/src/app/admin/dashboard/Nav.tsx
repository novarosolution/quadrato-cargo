"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export function AdminNav({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {nav.map((navItem) => {
        const isActiveLink =
          pathname === navItem.href ||
          (navItem.href !== "/admin/dashboard" &&
            pathname.startsWith(`${navItem.href}/`));
        return (
          <Link
            key={navItem.href}
            href={navItem.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActiveLink
                ? "bg-teal text-white shadow-sm"
                : "text-muted hover:bg-pill-hover hover:text-ink"
            }`}
          >
            {navItem.label}
          </Link>
        );
      })}
    </nav>
  );
}
