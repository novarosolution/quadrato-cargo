import { roleUi } from "@/components/role/role-ui";

function Sk({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-surface-elevated/45 ring-1 ring-border-strong/40 ${className}`}
      aria-hidden
    />
  );
}

export default function CourierRouteLoading() {
  return (
    <div className="stack-page content-wide gap-8 max-sm:gap-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Sk className="h-3 w-32 max-w-full" />
        <Sk className="h-9 w-72 max-w-full sm:h-10" />
        <Sk className="h-4 w-full max-w-lg" />
      </div>
      <div className={`${roleUi.tableWrap} p-4 sm:p-5`}>
        <div className="space-y-3">
          <Sk className="h-10 w-full" />
          <Sk className="h-10 w-full" />
          <Sk className="h-10 w-full" />
          <Sk className="h-10 w-full" />
        </div>
      </div>
      <Sk className="h-36 w-full max-w-md" />
    </div>
  );
}
