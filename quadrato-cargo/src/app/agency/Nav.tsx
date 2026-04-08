"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Building2, KeyRound, LayoutList } from "lucide-react";
import { QuadratoBrandLogo } from "@/components/QuadratoBrandLogo";
import { roleUi } from "@/components/role/role-ui";
import {
  agencyDefaults,
  agencyNavCopy,
  agencySections,
  type AgencySectionId,
} from "@/lib/agency-content";
import { AgencyLogoutButton } from "./Logoutb";

const sectionIcon: Record<AgencySectionId, typeof LayoutList> = {
  bookings: LayoutList,
  handover: KeyRound,
  hub: Building2,
  guide: BookOpen,
};

function isSectionActive(pathname: string, href: string) {
  if (href === "/agency") {
    return (
      pathname === "/agency" ||
      pathname === "/agency/" ||
      pathname.startsWith("/agency/bookings")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AgencyNav({
  name,
  agencyAddress,
  agencyPhone,
}: {
  name: string | null;
  agencyAddress: string | null;
  agencyPhone: string | null;
}) {
  const pathname = usePathname() || "";
  const displayName = (name && name.trim()) || agencyDefaults.navDisplayName;

  return (
    <header className={roleUi.headerShell}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/agency"
              className="shrink-0 rounded-none p-1 text-ink opacity-90 transition hover:opacity-100"
              aria-label="Agency home"
            >
              <QuadratoBrandLogo variant="mark" className="h-9 w-9 sm:h-10 sm:w-10" />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
                {displayName}
              </p>
              <p className="mt-0.5 hidden text-xs text-muted-soft sm:block">
                {agencyPhone ? (
                  <>
                    {agencyNavCopy.phonePrefix} {agencyPhone}
                  </>
                ) : agencyAddress ? (
                  <span className="line-clamp-1">{agencyAddress}</span>
                ) : (
                  <span className="text-muted-soft/80">Agency partner portal</span>
                )}
              </p>
            </div>
          </div>
          <AgencyLogoutButton />
        </div>

        <nav
          className="flex gap-1 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Agency sections"
        >
          <div className="flex min-w-min flex-1 gap-1 rounded-2xl border border-border-strong/50 bg-canvas/30 p-1 sm:gap-1.5 dark:bg-canvas/20">
            {agencySections.map((s) => {
              const active = isSectionActive(pathname, s.href);
              const Icon = sectionIcon[s.id];
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  title={s.shortHint}
                  className={
                    "flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm " +
                    (active
                      ? "bg-teal/15 text-ink shadow-sm ring-1 ring-teal/25"
                      : "text-muted hover:bg-pill-hover/80 hover:text-ink")
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-85" strokeWidth={1.75} aria-hidden />
                  <span className="truncate">{s.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
