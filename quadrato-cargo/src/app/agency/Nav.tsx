"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgencyLogoutButton } from "./Logoutb";

export function AgencyNav({
  email,
  name,
  agencyAddress,
  agencyPhone,
}: {
  email: string;
  name: string | null;
  agencyAddress: string | null;
  agencyPhone: string | null;
}) {
  const pathname = usePathname();
  const displayName = (name && name.trim()) || "Agency partner";
  return (
    <header className="sticky top-0 z-30 border-b border-border-strong/80 bg-surface-elevated/95 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 max-w-xl">
          <p className="font-display text-lg font-semibold tracking-tight text-ink">{displayName}</p>
          <p className="text-xs text-muted-soft">Sign-in · {email}</p>
          {agencyAddress ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">{agencyAddress}</p>
          ) : null}
          {agencyPhone ? (
            <p className="mt-0.5 text-xs text-muted-soft">Phone · {agencyPhone}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-muted-soft">Handover intake — bookings stay tied to this hub.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/agency"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === "/agency"
                ? "bg-teal font-semibold text-slate-950 shadow-sm"
                : "text-muted hover:bg-pill-hover hover:text-ink"
            }`}
          >
            Intake queue
          </Link>
          <AgencyLogoutButton />
        </div>
      </div>
    </header>
  );
}
