import { agencyUi } from "@/lib/agency-ui";

function Sk({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-surface-elevated/45 ring-1 ring-border-strong/40 ${className}`}
      aria-hidden
    />
  );
}

export default function AgencyRouteLoading() {
  return (
    <div className="stack-page content-wide gap-8 max-sm:gap-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Sk className="h-3 w-28 max-w-full" />
        <Sk className="h-9 w-64 max-w-full sm:h-10" />
        <Sk className="h-4 w-full max-w-xl" />
      </div>
      <div className={agencyUi.pageGrid}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Sk className="h-40 sm:h-44" />
          <Sk className="h-40 sm:h-44" />
        </div>
        <Sk className="mt-4 h-52 w-full" />
      </div>
    </div>
  );
}
