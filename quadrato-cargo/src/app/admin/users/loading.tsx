import { AdminPageBody } from "@/components/admin/AdminPrimitives";
import { adminUi } from "@/components/admin/admin-ui";

function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-surface-elevated/50 ${className}`}
      aria-hidden
    />
  );
}

export default function AdminUsersLoading() {
  return (
    <AdminPageBody className="gap-8 max-sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-24 max-w-full" />
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-[5.5rem] w-[7.5rem] shrink-0 rounded-2xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className={adminUi.filterForm}>
        <Skeleton className="h-10 min-w-[12rem] flex-1" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className={adminUi.tableScroll}>
        <div className="space-y-0">
          <Skeleton className="h-12 w-full rounded-none rounded-t-2xl" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-none border-t border-border-strong/40" />
          ))}
        </div>
      </div>
    </AdminPageBody>
  );
}
