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

/** Icons use site `--teal` token (not Tailwind default teal-* scale). */
const iconTeal = "size-4 text-teal";

function stageIcon(
  stageIndex: number,
  isInternational: boolean,
  isException: boolean,
): ReactNode {
  if (isException) {
    return <AlertTriangle className="size-4 text-amber-500" aria-hidden />;
  }
  if (isInternational) {
    switch (stageIndex) {
      case 0:
        return <Package className={iconTeal} aria-hidden />;
      case 1:
        return <Building2 className={iconTeal} aria-hidden />;
      case 2:
        return <Truck className={iconTeal} aria-hidden />;
      case 3:
        return <Building2 className={iconTeal} aria-hidden />;
      case 4:
        return <ShieldCheck className={iconTeal} aria-hidden />;
      case 5:
        return <Plane className={iconTeal} aria-hidden />;
      case 6:
        return <ShieldCheck className={iconTeal} aria-hidden />;
      case 7:
        return <Building2 className={iconTeal} aria-hidden />;
      case 8:
        return <User className={iconTeal} aria-hidden />;
      case 9:
        return isException ? (
          <AlertTriangle className="size-4 text-amber-500" aria-hidden />
        ) : (
          <Info className={iconTeal} aria-hidden />
        );
      case 10:
        return <Check className={iconTeal} aria-hidden />;
      default:
        return <Package className={iconTeal} aria-hidden />;
    }
  }
  switch (stageIndex) {
    case 0:
      return <Package className={iconTeal} aria-hidden />;
    case 1:
      return <Building2 className={iconTeal} aria-hidden />;
    case 2:
      return <Truck className={iconTeal} aria-hidden />;
    case 3:
      return <User className={iconTeal} aria-hidden />;
    case 4:
      return <Check className={iconTeal} aria-hidden />;
    default:
      return <Package className={iconTeal} aria-hidden />;
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
          className="absolute left-[11px] top-2 bottom-2 w-px bg-border/80"
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
                  <div className="rounded-xl border border-dashed border-teal/35 bg-teal-dim px-3 py-2 text-center text-xs font-semibold text-ink">
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
                    <div className="mt-0.5 shrink-0">{stageIcon(stageIndex, isInternational, isExceptionCard)}</div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-ink">
                          {def.title}
                        </h3>
                        {actuallyLatest ? (
                          <span className="rounded-full bg-teal-dim px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                            Latest update
                          </span>
                        ) : completed ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                            Completed
                          </span>
                        ) : null}
                      </div>
                      <p className="flex items-start gap-1.5 text-sm text-muted">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
                        <span className="break-words">{location}</span>
                      </p>
                      <p className="text-xs text-muted">{def.hint}</p>
                      {actuallyLatest && latestNote?.trim() ? (
                        <p className="rounded-lg border border-border bg-slate-500/5 px-3 py-2 text-xs text-ink dark:bg-slate-950/30">
                          {latestNote.trim()}
                        </p>
                      ) : null}
                      {showPdf ? (
                        <Link
                          href={pdfHref}
                          className="inline-flex items-center gap-2 rounded-2xl border border-teal/70 bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md transition hover:border-teal hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                        >
                          <FileText className="size-4" aria-hidden />
                          Download PDF
                        </Link>
                      ) : null}
                      <p className="flex items-center gap-1.5 font-sans text-xs text-muted">
                        <Clock className="size-3.5 shrink-0" aria-hidden />
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
