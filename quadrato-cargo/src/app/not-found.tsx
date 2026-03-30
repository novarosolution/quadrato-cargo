import Link from "next/link";
import type { Metadata } from "next";
import { QuadratoBrandLogo } from "@/components/QuadratoBrandLogo";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist or the link may be incorrect.",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16 text-center">
      <div className="panel-card max-w-md border border-border bg-surface-elevated/90 px-8 py-10 shadow-lg shadow-black/10 backdrop-blur-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 shrink-0 items-center justify-center text-ink">
          <QuadratoBrandLogo variant="mark" className="h-full w-full" decorative />
        </div>
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-soft">
          Error 404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The address may be mistyped, or the page was moved. Check the URL or go
          back to the site home.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/public"
            prefetch={false}
            className="btn-primary inline-flex h-12 items-center justify-center rounded-full border border-teal/70 bg-teal px-6 text-sm font-semibold text-slate-950 shadow-md shadow-teal/20 transition hover:bg-teal/90"
          >
            Home
          </Link>
          <Link
            href="/public/book"
            prefetch={false}
            className="btn-secondary inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
          >
            Book courier
          </Link>
          <Link
            href="/public/tsking"
            prefetch={false}
            className="btn-secondary inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
          >
            Track
          </Link>
        </div>
      </div>
    </div>
  );
}
