"use client";

import Link from "next/link";
import { PackageCheck, Search } from "lucide-react";
import { usePathname } from "next/navigation";

export function PublicSpeedButtons() {
  const pathname = usePathname();
  const onBook = pathname.startsWith("/public/book");
  const onTrack = pathname.startsWith("/public/tsking");

  return (
    <nav
      aria-label="Speed actions"
      className="fixed bottom-6 right-4 z-40 hidden flex-col gap-3 lg:flex"
    >
      <Link
        href="/public/book"
        prefetch={false}
        title="Book courier"
        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 ${
          onBook
            ? "border-teal/80 bg-teal text-slate-950 shadow-teal/30"
            : "border-border-strong bg-surface-elevated/85 text-ink hover:border-teal/45 hover:text-teal"
        }`}
      >
        <PackageCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
        <span className="sr-only">Book courier</span>
      </Link>
      <Link
        href="/public/tsking"
        prefetch={false}
        title="Track courier"
        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 ${
          onTrack
            ? "border-teal/80 bg-teal text-slate-950 shadow-teal/30"
            : "border-border-strong bg-surface-elevated/85 text-ink hover:border-teal/45 hover:text-teal"
        }`}
      >
        <Search className="h-5 w-5" strokeWidth={2} aria-hidden />
        <span className="sr-only">Track courier</span>
      </Link>
    </nav>
  );
}
