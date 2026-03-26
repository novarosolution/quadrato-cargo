import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminListQuery } from "@/lib/admin-url";

type Props = {
  basePath: string;
  page: number;
  totalPages: number;
  /** All query params to preserve (except page handled here) */
  query: Record<string, string | undefined>;
};

export function AdminPagination({
  basePath,
  page,
  totalPages,
  query,
}: Props) {
  if (totalPages <= 1) return null;

  // Avoid writing page=1 into URLs so canonical list links stay stable.
  const prev =
    page > 1
      ? `${basePath}${adminListQuery({ ...query, page: page - 1 === 1 ? undefined : String(page - 1) })}`
      : null;
  const next =
    page < totalPages
      ? `${basePath}${adminListQuery({ ...query, page: String(page + 1) })}`
      : null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border-strong pt-4 text-sm"
      aria-label="Pagination"
    >
      <p className="text-muted">
        Page <span className="font-medium text-ink">{page}</span> of{" "}
        <span className="font-medium text-ink">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        {prev ? (
          <Link
            href={prev}
            className="inline-flex items-center gap-1 rounded-xl border border-border-strong bg-canvas/40 px-3 py-2 font-medium text-ink transition hover:bg-pill-hover"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Previous
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-border bg-canvas/20 px-3 py-2 text-muted opacity-60">
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Previous
          </span>
        )}
        {next ? (
          <Link
            href={next}
            className="inline-flex items-center gap-1 rounded-xl border border-border-strong bg-canvas/40 px-3 py-2 font-medium text-ink transition hover:bg-pill-hover"
          >
            Next
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-border bg-canvas/20 px-3 py-2 text-muted opacity-60">
            Next
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
