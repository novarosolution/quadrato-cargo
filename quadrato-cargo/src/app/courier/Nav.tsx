"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CourierLogoutButton } from "./Logoutb";

export function CourierNav({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-border-strong bg-surface-elevated/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold">Courier</p>
          <p className="text-xs text-muted-soft">Assigned deliveries · {email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/courier"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === "/courier"
                ? "bg-teal text-white"
                : "text-muted hover:bg-pill-hover hover:text-ink"
            }`}
          >
            My jobs
          </Link>
          <CourierLogoutButton />
        </div>
      </div>
    </div>
  );
}
