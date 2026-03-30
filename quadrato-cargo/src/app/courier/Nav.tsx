"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CourierLogoutButton } from "./Logoutb";

export function CourierNav({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border-strong/80 bg-surface-elevated/95 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-ink">Courier</p>
          <p className="text-xs text-muted-soft">Assigned deliveries · {email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/courier"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === "/courier"
                ? "bg-teal font-semibold text-slate-950 shadow-sm"
                : "text-muted hover:bg-pill-hover hover:text-ink"
            }`}
          >
            My jobs
          </Link>
          <CourierLogoutButton />
        </div>
      </div>
    </header>
  );
}
