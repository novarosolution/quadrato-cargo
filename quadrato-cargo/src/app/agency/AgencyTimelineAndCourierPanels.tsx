"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BookingStatusId } from "@/lib/booking-status";
import { normalizeBookingStatus } from "@/lib/booking-status";
import type { PublicTimelineOverrides } from "@/lib/api/public-client";
import { ProfessionalTrackingTimeline } from "@/app/public/tsking/ProfessionalTrackingTimeline";
import {
  DOMESTIC_PROFESSIONAL_STAGES,
  INTERNATIONAL_PROFESSIONAL_STAGES,
  domesticHubLocation,
  getDomesticProfessionalStageIndex,
  getInternationalProfessionalStageIndex,
  internationalHubLocation,
  type TrackingShipmentContext,
} from "@/lib/professional-tracking-stages";

function formatStepTime(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
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

function courierPickupExtras(payload: unknown): { label: string; value: string }[] {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const out: { label: string; value: string }[] = [];
  const pref = typeof root.pickupPreference === "string" ? root.pickupPreference.trim() : "";
  if (pref) out.push({ label: "Pickup preference", value: pref });
  const instr = typeof root.instructions === "string" ? root.instructions.trim() : "";
  if (instr) out.push({ label: "Courier / pickup instructions", value: instr });
  return out;
}

function effectiveStageRow(
  index: number,
  mode: "domestic" | "international",
  overrides: PublicTimelineOverrides | null | undefined,
  ctx: TrackingShipmentContext,
): { title: string; location: string; hint: string; shownAt: string | null } {
  const stages = mode === "international" ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const def = stages[index];
  const snap = overrides?.[mode]?.[String(index)];
  const defaultLocation =
    mode === "international"
      ? internationalHubLocation(index, ctx)
      : domesticHubLocation(index, ctx);
  return {
    title: snap?.title?.trim() || def?.title || `Step ${index}`,
    location: snap?.location?.trim() || defaultLocation,
    hint: snap?.hint?.trim() || def?.hint || "",
    shownAt: snap?.shownAt?.trim() || null,
  };
}

type Props = {
  status: string;
  routeType: string;
  updatedAtIso: string;
  publicTrackingNote: string | null;
  senderAddress: string | null;
  recipientAddress: string | null;
  agencyDisplayName: string;
  publicTimelineOverrides: PublicTimelineOverrides | null | undefined;
  publicTimelineStatusPath: string[] | null | undefined;
  courierId: string | null;
  payload: unknown;
};

export function AgencyTimelineAndCourierPanels({
  status,
  routeType,
  updatedAtIso,
  publicTrackingNote,
  senderAddress,
  recipientAddress,
  agencyDisplayName,
  publicTimelineOverrides,
  publicTimelineStatusPath,
  courierId,
  payload,
}: Props) {
  const [allOpen, setAllOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const mode = String(routeType).toLowerCase() === "international" ? "international" : "domestic";
  const stages = mode === "international" ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const st = normalizeBookingStatus(status);
  const stageIndex =
    mode === "international"
      ? getInternationalProfessionalStageIndex(st)
      : getDomesticProfessionalStageIndex(st);

  const ctx = useMemo<TrackingShipmentContext>(
    () => ({
      senderAddress,
      recipientAddress,
      agencyName: agencyDisplayName?.trim() || null,
    }),
    [senderAddress, recipientAddress, agencyDisplayName],
  );

  const currentRow = useMemo(
    () => effectiveStageRow(stageIndex, mode, publicTimelineOverrides, ctx),
    [stageIndex, mode, publicTimelineOverrides, ctx],
  );

  const pickupExtras = useMemo(() => courierPickupExtras(payload), [payload]);

  const timelineUpdatedAt =
    currentRow.shownAt && !Number.isNaN(new Date(currentRow.shownAt).getTime())
      ? currentRow.shownAt
      : updatedAtIso;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Courier &amp; pickup context
        </h4>
        <p className="mt-1 text-[11px] text-muted-soft">
          Same operational context the courier sees for this job (read-only).
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {courierId ? (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">
                Assigned courier (user id)
              </dt>
              <dd className="mt-0.5 font-mono text-xs text-ink">{courierId}</dd>
            </div>
          ) : (
            <div className="sm:col-span-2 text-xs text-muted-soft">No courier assigned yet.</div>
          )}
          {pickupExtras.map(({ label, value }) => (
            <div key={label} className="min-w-0 sm:col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">{label}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap wrap-break-word text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 dark:bg-teal/10">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Current timeline step
        </h4>
        <p className="mt-1 text-[11px] text-muted-soft">
          Customer-facing professional timeline card for today&apos;s status (
          <span className="capitalize">{mode}</span> step {stageIndex}). Admin overrides apply when set.
        </p>
        <div className="mt-3 space-y-2 rounded-lg border border-border-strong bg-canvas/40 px-3 py-3 text-sm">
          <p className="font-medium text-ink">{currentRow.title}</p>
          <p className="text-xs text-muted">{currentRow.location}</p>
          {currentRow.hint ? (
            <p className="text-xs leading-relaxed text-muted-soft">{currentRow.hint}</p>
          ) : null}
          <p className="text-[11px] text-muted-soft">
            Card time: <span className="text-ink">{formatStepTime(timelineUpdatedAt)}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border-strong bg-canvas/20">
        <button
          type="button"
          onClick={() => setAllOpen((o) => !o)}
          aria-expanded={allOpen}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-ink transition hover:bg-pill-hover/50"
        >
          <span>All timeline steps</span>
          {allOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-soft" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-soft" aria-hidden />
          )}
        </button>
        {allOpen ? (
          <div className="border-t border-border-strong px-4 py-3">
            <ol className="space-y-3">
              {stages.map((def, index) => {
                const row = effectiveStageRow(index, mode, publicTimelineOverrides, ctx);
                const isCurrent = index === stageIndex;
                return (
                  <li
                    key={def.id}
                    className={`rounded-lg border px-3 py-2.5 text-sm ${
                      isCurrent
                        ? "border-teal/40 bg-teal/5 dark:bg-teal/10"
                        : "border-border-strong bg-canvas/30"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
                      Step {index} — {def.title}
                      {isCurrent ? (
                        <span className="ml-2 normal-case text-teal">· current</span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-medium text-ink">{row.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{row.location}</p>
                    {row.hint ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-soft">{row.hint}</p>
                    ) : null}
                    {row.shownAt ? (
                      <p className="mt-1 text-[11px] text-muted-soft">
                        Override time: {formatStepTime(row.shownAt)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 border-t border-border-strong pt-3">
              <button
                type="button"
                onClick={() => setPreviewOpen((o) => !o)}
                aria-expanded={previewOpen}
                className="flex w-full items-center justify-between gap-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-soft transition hover:text-ink"
              >
                <span>Preview as on public Track</span>
                {previewOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
              </button>
              {previewOpen ? (
                <div className="mt-2 rounded-lg border border-border bg-surface-elevated/50 p-3">
                  <ProfessionalTrackingTimeline
                    status={st as BookingStatusId}
                    routeType={mode}
                    updatedAt={updatedAtIso}
                    latestNote={publicTrackingNote}
                    ctx={ctx}
                    timelineOverrides={publicTimelineOverrides ?? null}
                    publicTimelineStatusPath={publicTimelineStatusPath ?? null}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
