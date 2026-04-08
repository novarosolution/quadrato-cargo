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

export default function AdminBookingsLoading() {
  return (
    <AdminPageBody className="gap-8 max-sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-36 shrink-0" />
      </div>
      <div className={adminUi.filterForm}>
        <Skeleton className="h-10 flex-1 min-w-[8rem]" />
        <Skeleton className="h-10 flex-1 min-w-[8rem]" />
        <Skeleton className="h-10 flex-1 min-w-[8rem]" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className={adminUi.tableScrollPlain}>
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </AdminPageBody>
  );
}
