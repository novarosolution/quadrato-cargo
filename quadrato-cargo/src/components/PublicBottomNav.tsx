"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck, Search } from "lucide-react";

export function PublicBottomNav() {
  const pathname = usePathname();
  const isBook = pathname.startsWith("/public/book");
  const isTrack = pathname.startsWith("/public/tsking");

  return (
    <nav
      aria-label="Primary mobile actions"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-canvas/95 p-3 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
        <Link
          href="/public/book"
          prefetch={false}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
            isBook
              ? "bg-teal text-slate-950"
              : "border border-border-strong bg-surface-elevated/80 text-ink hover:border-teal/40 hover:bg-pill-hover"
          }`}
        >
          <PackageCheck className="h-4 w-4" aria-hidden />
          Book
        </Link>
        <Link
          href="/public/tsking"
          prefetch={false}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
            isTrack
              ? "bg-teal text-slate-950"
              : "border border-border-strong bg-surface-elevated/80 text-ink hover:border-teal/40 hover:bg-pill-hover"
          }`}
        >
          <Search className="h-4 w-4" aria-hidden />
          Track
        </Link>
      </div>
    </nav>
  );
}
