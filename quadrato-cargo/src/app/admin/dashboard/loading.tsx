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

export default function AdminDashboardLoading() {
  return (
    <AdminPageBody className="gap-8 max-sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-40 shrink-0" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 sm:col-span-2 lg:col-span-1" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div className={adminUi.panelMuted}>
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </AdminPageBody>
  );
}
