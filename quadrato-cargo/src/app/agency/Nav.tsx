"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgencyLogoutButton } from "./Logoutb";

export function AgencyNav({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-border-strong bg-surface-elevated/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold">Agency</p>
          <p className="text-xs text-muted-soft">Handover intake · {email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/agency"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === "/agency"
                ? "bg-teal text-white"
                : "text-muted hover:bg-pill-hover hover:text-ink"
            }`}
          >
            Intake queue
          </Link>
          <AgencyLogoutButton />
        </div>
      </div>
    </div>
  );
}
