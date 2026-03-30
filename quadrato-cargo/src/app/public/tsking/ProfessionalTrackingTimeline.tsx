"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  FileText,
  MapPin,
  Package,
  Plane,
  ShieldCheck,
  Truck,
  User,
  Info,
} from "lucide-react";
import type { BookingStatusId } from "@/lib/booking-status";
import {
  buildProfessionalTimelineSegments,
  DOMESTIC_PROFESSIONAL_STAGES,
  getDomesticProfessionalStageIndex,
  getInternationalProfessionalStageIndex,
  internationalHubLocation,
  domesticHubLocation,
  INTERNATIONAL_PROFESSIONAL_STAGES,
  type TrackingShipmentContext,
} from "@/lib/professional-tracking-stages";

function formatTrackingTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(iso));
}

/** Default stage icons on neutral card surface. */
const iconTeal = "size-4 text-teal";
/**
 * Latest row uses a teal-tinted gradient; pure teal can wash out in light mode.
 * Dark mode keeps teal for brand consistency on near-black canvas.
 */
const iconOnTealWash = "size-4 text-ink dark:text-teal";

function stageIcon(
  stageIndex: number,
  isInternational: boolean,
  isException: boolean,
  onTealWash: boolean,
): ReactNode {
  const ic = onTealWash ? iconOnTealWash : iconTeal;
  if (isException) {
    return <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />;
  }
  if (isInternational) {
    switch (stageIndex) {
      case 0:
        return <Package className={ic} aria-hidden />;
      case 1:
        return <Building2 className={ic} aria-hidden />;
      case 2:
        return <Truck className={ic} aria-hidden />;
      case 3:
        return <Building2 className={ic} aria-hidden />;
      case 4:
        return <ShieldCheck className={ic} aria-hidden />;
      case 5:
        return <Plane className={ic} aria-hidden />;
      case 6:
        return <ShieldCheck className={ic} aria-hidden />;
      case 7:
        return <Building2 className={ic} aria-hidden />;
      case 8:
        return <User className={ic} aria-hidden />;
      case 9:
        return isException ? (
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
        ) : (
          <Info className={ic} aria-hidden />
        );
      case 10:
        return <Check className={ic} aria-hidden />;
      default:
        return <Package className={ic} aria-hidden />;
    }
  }
  switch (stageIndex) {
    case 0:
      return <Package className={ic} aria-hidden />;
    case 1:
      return <Building2 className={ic} aria-hidden />;
    case 2:
      return <Truck className={ic} aria-hidden />;
    case 3:
      return <User className={ic} aria-hidden />;
    case 4:
      return <Check className={ic} aria-hidden />;
    default:
      return <Package className={ic} aria-hidden />;
  }
}

export type ProfessionalTrackingTimelineProps = {
  bookingId: string;
  status: BookingStatusId;
  routeType: "domestic" | "international";
  updatedAt: string;
  ctx: TrackingShipmentContext;
  latestNote?: string | null;
  showPdfLink?: boolean;
};

export function ProfessionalTrackingTimeline({
  bookingId,
  status,
  routeType,
  updatedAt,
  ctx,
  latestNote = null,
  showPdfLink = true,
}: ProfessionalTrackingTimelineProps) {
  const isInternational = routeType === "international";
  const stages = isInternational ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const currentIdx = isInternational
    ? getInternationalProfessionalStageIndex(status)
    : getDomesticProfessionalStageIndex(status);
  const isCancelled = status === "cancelled";
  const isOnHold = status === "on_hold";
  const segments = buildProfessionalTimelineSegments(currentIdx, isInternational ? "international" : "domestic");

  const pdfHref = `/public/profile/booksdetels/${bookingId}`;

  return (
    <div className="space-y-4">
      <div className="relative pl-8">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px bg-border-strong"
          aria-hidden
        />

        <ol className="space-y-4">
          {segments.map((seg, i) => {
            if (seg.kind === "divider") {
              return (
                <li key={`div-${seg.key}-${i}`} className="relative">
                  <div className="absolute -left-[21px] top-1/2 z-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-canvas text-[10px] font-bold text-muted">
                    ·
                  </div>
                  <div className="rounded-xl border border-dashed border-teal/40 bg-teal-dim px-3 py-2 text-center text-xs font-semibold text-ink dark:border-teal/30">
                    {seg.label}
                  </div>
                </li>
              );
            }

            const stageIndex = seg.index;
            const def = stages[stageIndex];
            if (!def) return null;

            const actuallyLatest = seg.kind === "stage" && i === 0;
            const isExceptionCard =
              isOnHold &&
              ((isInternational && stageIndex === 9) || (!isInternational && stageIndex === 3));
            const location = isInternational
              ? internationalHubLocation(stageIndex, ctx)
              : domesticHubLocation(stageIndex, ctx);

            const completed = !actuallyLatest && !isCancelled;
            const showPdf = showPdfLink && actuallyLatest && !isCancelled;

            return (
              <li key={`${def.id}-${stageIndex}-${i}`} className="relative">
                <div
                  className={[
                    "absolute -left-[21px] top-5 z-1 flex size-6 items-center justify-center rounded-full border-2 shadow-sm",
                    isExceptionCard && actuallyLatest
                      ? "border-amber-500 bg-amber-500 text-white"
                      : completed || actuallyLatest
                        ? "border-teal bg-teal text-slate-950"
                        : "border-border bg-canvas text-muted",
                  ].join(" ")}
                  aria-hidden
                >
                  {isExceptionCard && actuallyLatest ? (
                    <AlertTriangle className="size-3.5 stroke-[2.5]" />
                  ) : completed || actuallyLatest ? (
                    <Check className="size-3.5 stroke-3" />
                  ) : (
                    <span className="size-2 rounded-full bg-muted" />
                  )}
                </div>

                <article
                  className={[
                    "rounded-2xl border bg-canvas p-4 shadow-sm transition-colors",
                    actuallyLatest
                      ? "border-teal/40 bg-linear-to-br from-teal-dim to-canvas ring-1 ring-teal/25"
                      : isExceptionCard
                        ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20"
                        : "border-border",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {stageIcon(
                        stageIndex,
                        isInternational,
                        isExceptionCard,
                        Boolean(actuallyLatest),
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-ink">
                          {def.title}
                        </h3>
                        {actuallyLatest ? (
                          <span className="rounded-full border border-teal/30 bg-teal-dim px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink dark:border-teal/40 dark:text-teal">
                            Latest update
                          </span>
                        ) : completed ? (
                          <span className="rounded-full border border-border-strong bg-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-soft">
                            Completed
                          </span>
                        ) : null}
                      </div>
                      <p className="flex items-start gap-1.5 text-sm text-ink/90">
                        <MapPin
                          className="mt-0.5 size-3.5 shrink-0 text-accent dark:text-accent-hover"
                          aria-hidden
                        />
                        <span className="break-words text-muted">{location}</span>
                      </p>
                      <p className="text-xs text-muted-soft">{def.hint}</p>
                      {actuallyLatest && latestNote?.trim() ? (
                        <p className="rounded-lg border border-border-strong bg-surface-highlight px-3 py-2 text-xs text-ink">
                          {latestNote.trim()}
                        </p>
                      ) : null}
                      {showPdf ? (
                        <Link
                          href={pdfHref}
                          className="inline-flex items-center gap-2 rounded-2xl border border-teal/70 bg-teal px-4 py-2.5 text-sm font-semibold text-[#0f172a] shadow-md transition hover:border-teal hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                        >
                          <FileText className="size-4" aria-hidden />
                          Download PDF
                        </Link>
                      ) : null}
                      <p className="flex items-center gap-1.5 font-sans text-xs text-muted-soft">
                        <Clock className="size-3.5 shrink-0 text-muted" aria-hidden />
                        {actuallyLatest ? formatTrackingTimestamp(updatedAt) : "—"}
                      </p>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
