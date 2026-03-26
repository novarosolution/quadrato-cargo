import Link from "next/link";

type AdminListFiltersProps = {
  basePath: string;
  placeholder?: string;
  defaultQuery: string;
  children?: React.ReactNode;
};

export function AdminListFilters({
  basePath,
  placeholder = "Search…",
  defaultQuery,
  children,
}: AdminListFiltersProps) {
  return (
    <form
      method="GET"
      action={basePath}
      // Query-string based filters keep admin pages shareable and refresh-safe.
      className="flex flex-col gap-4 rounded-2xl border border-border-strong bg-surface-elevated/50 p-4 lg:flex-row lg:flex-wrap lg:items-end"
    >
      <div className="min-w-[200px] flex-1">
        <label
          htmlFor="admin-list-q"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Search
        </label>
        <input
          id="admin-list-q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          autoComplete="off"
        />
      </div>
      {children}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Apply
        </button>
        <Link
          href={basePath}
          className="inline-flex items-center justify-center rounded-xl border border-border-strong bg-canvas/40 px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-pill-hover hover:text-ink"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
