"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  MapPin,
  Package,
  Plane,
  ShieldCheck,
  Truck,
  User,
  Info,
} from "lucide-react";
import type { BookingStatusId } from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import { resolveInternationalTimelineStageIndex } from "@/lib/international-timeline-stage";
import {
  buildProfessionalTimelineSegments,
  buildProfessionalTimelineSegmentsFromStatusPath,
  defaultInternationalStageTitle,
  DOMESTIC_PROFESSIONAL_STAGES,
  domesticHubLocation,
  getDomesticProfessionalStageIndex,
  internationalHubLocation,
  INTERNATIONAL_PROFESSIONAL_STAGES,
  type TrackingShipmentContext,
} from "@/lib/professional-tracking-stages";

function customerSeesTimelineStep(
  visibility: PublicTimelineStepVisibility | null | undefined,
  mode: "domestic" | "international",
  stageIndex: number,
  currentIdx: number,
): boolean {
  if (stageIndex === currentIdx) return true;
  const m = visibility?.[mode];
  return m?.[String(stageIndex)] !== false;
}

function formatTrackingTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true,
    }).format(d);
  } catch {
    return "—";
  }
}

/** Default stage icons on timeline cards. */
const iconTeal = "size-4 text-teal";

function stageIcon(
  stageIndex: number,
  isInternational: boolean,
  isException: boolean,
): ReactNode {
  const ic = iconTeal;
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
        return <Truck className={ic} aria-hidden />;
      case 9:
        return <Package className={ic} aria-hidden />;
      case 10:
        return isException ? (
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
        ) : (
          <Info className={ic} aria-hidden />
        );
      case 11:
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
  status: BookingStatusId;
  routeType: "domestic" | "international";
  updatedAt: string;
  /** ISO booking created; used for macro 0 time when a step has no `shownAt` (avoids every card showing the same `updatedAt`). */
  bookedAtIso?: string | null;
  ctx: TrackingShipmentContext;
  latestNote?: string | null;
  /** When set, overrides default stage title, location line, hint, and optional per-card time. */
  timelineOverrides?: PublicTimelineOverrides | null;
  /** Domestic only: optional sparse list from recorded status transitions. Ignored for international. */
  publicTimelineStatusPath?: string[] | null;
  /** Hide steps from customer Track (current macro always shown). Applies to domestic and international. */
  publicTimelineStepVisibility?: PublicTimelineStepVisibility | null;
  /** International: optional 0–11 override for which timeline card is current (agency/admin). */
  internationalAgencyStage?: number | null;
  /**
   * Admin/agency preview: list every macro step (12 intl / 5 domestic), newest first.
   * Past steps = Completed, current = Latest update, future = Upcoming. Ignores status path.
   * Customer-facing pages should leave this false (default).
   */
  showAllStages?: boolean;
};

export function ProfessionalTrackingTimeline({
  status,
  routeType,
  updatedAt,
  bookedAtIso = null,
  ctx,
  latestNote = null,
  timelineOverrides = null,
  publicTimelineStatusPath = null,
  publicTimelineStepVisibility = null,
  internationalAgencyStage = null,
  showAllStages = false,
}: ProfessionalTrackingTimelineProps) {
  const isInternational = routeType === "international";
  const stages = isInternational ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const modeOverrides =
    timelineOverrides?.[isInternational ? "international" : "domestic"] ?? null;
  const currentIdx = isInternational
    ? resolveInternationalTimelineStageIndex(status, internationalAgencyStage)
    : getDomesticProfessionalStageIndex(status);
  const isCancelled = status === "cancelled";
  const isOnHold = status === "on_hold";
  const mode = isInternational ? "international" : "domestic";

  let segments;
  if (showAllStages) {
    /** Admin/agency preview: all macros including future “Upcoming” rows. */
    const n = stages.length;
    segments = Array.from({ length: n }, (_, i) => n - 1 - i).map((index) => ({
      kind: "stage" as const,
      index,
    }));
  } else if (isInternational) {
    /** Customer international: only completed + current (macros 0..currentIdx). No future steps; ignore sparse status path. */
    const ladder = buildProfessionalTimelineSegments(currentIdx, mode);
    segments = ladder.filter((seg) =>
      customerSeesTimelineStep(publicTimelineStepVisibility, mode, seg.index, currentIdx),
    );
  } else {
    const ladder = buildProfessionalTimelineSegments(currentIdx, mode);
    const fromPath = buildProfessionalTimelineSegmentsFromStatusPath(publicTimelineStatusPath, mode);
    let built = fromPath ?? ladder;
    if (fromPath && !fromPath.some((s) => s.index === currentIdx)) {
      built = [{ kind: "stage" as const, index: currentIdx }, ...fromPath];
    }
    segments = built.filter((seg) =>
      customerSeesTimelineStep(publicTimelineStepVisibility, mode, seg.index, currentIdx),
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative pl-8">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px bg-border-strong"
          aria-hidden
        />

        <ol className="space-y-4">
          {segments.map((seg, i) => {
            const stageIndex = seg.index;
            const def = stages[stageIndex];
            if (!def) return null;

            const isUpcoming =
              showAllStages && !isCancelled && stageIndex > currentIdx;
            const actuallyLatest =
              seg.kind === "stage" &&
              !isCancelled &&
              (showAllStages ? stageIndex === currentIdx : i === 0);
            const isExceptionCard =
              isOnHold &&
              ((isInternational && stageIndex === 10) || (!isInternational && stageIndex === 3));
            const defaultLocation = isInternational
              ? internationalHubLocation(stageIndex, ctx)
              : domesticHubLocation(stageIndex, ctx);
            const o = modeOverrides?.[String(stageIndex)];
            const baseListTitle = isInternational
              ? defaultInternationalStageTitle(stageIndex, def.title, ctx.agencyName)
              : def.title;
            const titleText = o?.title?.trim() || baseListTitle;
            const location = o?.location?.trim() || defaultLocation;
            const hintText = o?.hint?.trim() || def.hint;
            const overrideTime =
              o?.shownAt?.trim() && !Number.isNaN(new Date(o.shownAt.trim()).getTime())
                ? o.shownAt.trim()
                : null;
            const bookedOk =
              Boolean(bookedAtIso?.trim()) &&
              !Number.isNaN(new Date(String(bookedAtIso).trim()).getTime());

            const completed =
              !isCancelled && !actuallyLatest && !isUpcoming;

            let clockLabel: string;
            if (isUpcoming) {
              clockLabel = "—";
            } else if (overrideTime) {
              clockLabel = formatTrackingTimestamp(overrideTime);
            } else if (actuallyLatest) {
              clockLabel = formatTrackingTimestamp(updatedAt);
            } else if (completed) {
              clockLabel =
                stageIndex === 0 && bookedOk
                  ? formatTrackingTimestamp(String(bookedAtIso).trim())
                  : "—";
            } else {
              clockLabel = "—";
            }

            return (
              <li key={`${def.id}-${stageIndex}-${i}`} className="relative">
                <div
                  className={[
                    "absolute -left-[21px] top-5 z-1 flex size-6 items-center justify-center rounded-full border-2 shadow-sm",
                    isUpcoming
                      ? "border-border-strong border-dashed bg-canvas text-muted"
                      : isExceptionCard && actuallyLatest
                        ? "border-amber-500 bg-amber-500 text-white"
                        : completed || actuallyLatest
                          ? "border-teal bg-teal text-slate-950"
                          : "border-border bg-canvas text-muted",
                  ].join(" ")}
                  aria-hidden
                >
                  {isUpcoming ? (
                    <span className="size-2 rounded-full bg-muted-soft/80" />
                  ) : isExceptionCard && actuallyLatest ? (
                    <AlertTriangle className="size-3.5 stroke-[2.5]" />
                  ) : completed || actuallyLatest ? (
                    <Check className="size-3.5 stroke-3" />
                  ) : (
                    <span className="size-2 rounded-full bg-muted" />
                  )}
                </div>

                <article
                  className={[
                    "rounded-xl border bg-canvas p-4 shadow-sm transition-colors",
                    isUpcoming
                      ? "border-border-strong/80 border-dashed bg-canvas/50 opacity-95"
                      : actuallyLatest
                        ? "border-border-strong bg-canvas/40"
                        : isExceptionCard
                          ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20"
                          : "border-border",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {stageIcon(stageIndex, isInternational, isExceptionCard)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-ink">
                          {titleText}
                        </h3>
                        {actuallyLatest && showAllStages ? (
                          <span className="rounded-full border border-teal/30 bg-teal-dim px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink dark:border-teal/40 dark:text-teal">
                            Latest update
                          </span>
                        ) : completed ? (
                          <span className="rounded-full border border-border-strong bg-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-soft">
                            Completed
                          </span>
                        ) : isUpcoming && showAllStages ? (
                          <span className="rounded-full border border-border-strong bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-soft">
                            Upcoming
                          </span>
                        ) : null}
                      </div>
                      <p className="flex items-start gap-1.5 text-sm font-semibold text-ink">
                        <MapPin
                          className="mt-0.5 size-3.5 shrink-0 text-accent dark:text-accent-hover"
                          aria-hidden
                        />
                        <span className="break-words">{location}</span>
                      </p>
                      <p className="text-sm leading-snug text-muted">{hintText}</p>
                      {actuallyLatest && latestNote?.trim() ? (
                        <p className="rounded-lg border border-border-strong bg-surface-highlight px-3 py-2 text-sm font-bold text-ink">
                          {latestNote.trim()}
                        </p>
                      ) : null}
                      <p className="flex items-center gap-1.5 font-sans text-xs text-muted-soft">
                        <Clock className="size-3.5 shrink-0 text-muted-soft" aria-hidden />
                        {actuallyLatest ? (
                          <span className="font-medium text-ink">Last updated: {clockLabel}</span>
                        ) : (
                          <span>{clockLabel}</span>
                        )}
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
