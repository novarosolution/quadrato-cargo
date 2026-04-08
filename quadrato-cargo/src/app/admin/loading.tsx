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

/** Fallback while admin segments without a local `loading.tsx` stream (reports, settings, etc.). */
export default function AdminRouteLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <AdminPageBody className="gap-8 max-sm:gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className={adminUi.panelMuted}>
          <Skeleton className="h-6 w-48" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </AdminPageBody>
    </div>
  );
}
