import Link from "next/link";
import { adminUi } from "./admin-ui";

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
      className={adminUi.filterForm}
    >
      <div className="min-w-[200px] flex-1">
        <label htmlFor="admin-list-q" className={adminUi.labelBlock}>
          Search
        </label>
        <input
          id="admin-list-q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className={`mt-2 ${adminUi.inputFilter}`}
          autoComplete="off"
        />
      </div>
      {children}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={adminUi.btnPrimary}>
          Apply
        </button>
        <Link href={basePath} className={adminUi.btnSecondary}>
          Reset
        </Link>
      </div>
    </form>
  );
}
