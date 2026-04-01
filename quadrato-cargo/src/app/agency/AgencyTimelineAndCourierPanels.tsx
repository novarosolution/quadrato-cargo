"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BookingStatusId } from "@/lib/booking-status";
import { normalizeBookingStatus } from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStageOverride,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import { patchAgencyBookingTimelineApi } from "@/lib/api/agency-client";
import { ProfessionalTrackingTimeline } from "@/app/public/tsking/ProfessionalTrackingTimeline";
import { InternationalStaffFlowReference } from "@/components/tracking/InternationalStaffFlowReference";
import { resolveInternationalTimelineStageIndex } from "@/lib/international-timeline-stage";
import {
  DOMESTIC_PROFESSIONAL_STAGES,
  INTERNATIONAL_PROFESSIONAL_STAGES,
  domesticHubLocation,
  getDomesticProfessionalStageIndex,
  internationalHubLocation,
  type TrackingShipmentContext,
} from "@/lib/professional-tracking-stages";

const inputClass =
  "mt-1 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function datetimeLocalToIso(local: string): string {
  if (!local.trim()) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

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

function defaultPlaceholders(
  index: number,
  mode: "domestic" | "international",
  ctx: TrackingShipmentContext,
): { title: string; location: string; hint: string } {
  const stages = mode === "international" ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const def = stages[index];
  const defaultLocation =
    mode === "international"
      ? internationalHubLocation(index, ctx)
      : domesticHubLocation(index, ctx);
  return {
    title: def?.title || "",
    location: defaultLocation,
    hint: def?.hint || "",
  };
}

function AgencyTimelineStepForm({
  bookingId,
  mode,
  stepIndex,
  placeholders,
  overrideSnap,
}: {
  bookingId: string;
  mode: "domestic" | "international";
  stepIndex: number;
  placeholders: { title: string; location: string; hint: string };
  overrideSnap: PublicTimelineStageOverride | undefined;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(() => overrideSnap?.title ?? "");
  const [location, setLocation] = useState(() => overrideSnap?.location ?? "");
  const [hint, setHint] = useState(() => overrideSnap?.hint ?? "");
  const [shownAtLocal, setShownAtLocal] = useState(() => {
    const sa = overrideSnap?.shownAt;
    return sa && !Number.isNaN(new Date(sa).getTime()) ? isoToDatetimeLocal(sa) : "";
  });
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setPending(true);
    setMsg(null);
    const body = {
      merge: true,
      [mode]: {
        [String(stepIndex)]: {
          title: title.trim(),
          location: location.trim(),
          hint: hint.trim(),
          shownAt: shownAtLocal.trim() ? datetimeLocalToIso(shownAtLocal) : "",
        },
      },
    };
    const result = await patchAgencyBookingTimelineApi({ bookingId, body });
    setPending(false);
    if (result.ok) {
      setMsg({ ok: true, text: result.message });
      router.refresh();
    } else {
      setMsg({ ok: false, text: result.error });
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border-strong/60 pt-3">
      <p className="text-[11px] text-muted-soft">
        Site defaults when empty: <span className="text-ink">{placeholders.title}</span> ·{" "}
        {placeholders.location}
      </p>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          Card title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholders.title}
          className={inputClass}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          Location line
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={placeholders.location}
          className={inputClass}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">Hint</label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder={placeholders.hint}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          Card time (optional)
        </label>
        <input
          type="datetime-local"
          value={shownAtLocal}
          onChange={(e) => setShownAtLocal(e.target.value)}
          className={inputClass}
        />
      </div>
      {msg ? (
        <p className={`text-xs ${msg.ok ? "text-teal" : "text-rose-400"}`} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void save()}
        className="rounded-xl bg-teal px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : `Save step ${stepIndex}`}
      </button>
      <p className="text-[10px] text-muted-soft">
        Cleared fields remove your text for this step; the public Track page uses automatic copy again.
        Admins can edit the same timeline on this booking.
      </p>
    </div>
  );
}

type Props = {
  bookingId: string;
  status: string;
  routeType: string;
  updatedAtIso: string;
  bookedAtIso?: string;
  publicTrackingNote: string | null;
  senderAddress: string | null;
  recipientAddress: string | null;
  agencyDisplayName: string;
  publicTimelineOverrides: PublicTimelineOverrides | null | undefined;
  publicTimelineStepVisibility: PublicTimelineStepVisibility | null | undefined;
  publicTimelineStatusPath: string[] | null | undefined;
  internationalAgencyStage?: number | null;
  courierId: string | null;
  payload: unknown;
};

export function AgencyTimelineAndCourierPanels({
  bookingId,
  status,
  routeType,
  updatedAtIso,
  bookedAtIso = updatedAtIso,
  publicTrackingNote,
  senderAddress,
  recipientAddress,
  agencyDisplayName,
  publicTimelineOverrides,
  publicTimelineStepVisibility,
  publicTimelineStatusPath,
  internationalAgencyStage = null,
  courierId,
  payload,
}: Props) {
  const [allOpen, setAllOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);

  const mode = String(routeType).toLowerCase() === "international" ? "international" : "domestic";
  const stages = mode === "international" ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const st = normalizeBookingStatus(status);
  const stageIndex =
    mode === "international"
      ? resolveInternationalTimelineStageIndex(st, internationalAgencyStage)
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

  const currentPlaceholders = useMemo(
    () => defaultPlaceholders(stageIndex, mode, ctx),
    [stageIndex, mode, ctx],
  );

  const currentOverrideSnap = publicTimelineOverrides?.[mode]?.[String(stageIndex)];

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

      {mode === "international" ? (
        <InternationalStaffFlowReference defaultOpen={false} className="overflow-hidden" />
      ) : null}

      <div className="rounded-xl border border-border-strong bg-surface-elevated/60 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Full timeline preview (staff)
        </h4>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-soft">
          {mode === "international" ? (
            <>
              Shows all 12 macros including <strong className="text-ink">Upcoming</strong> — customers only see{" "}
              <strong className="text-ink">Completed</strong> + <strong className="text-ink">Latest update</strong> on
              public Track.
            </>
          ) : (
            <>
              All domestic macros including upcoming — matches customer-visible steps for domestic routes.
            </>
          )}
        </p>
        <div className="mt-3 rounded-lg border border-border bg-canvas/40 p-3">
          <ProfessionalTrackingTimeline
            status={st as BookingStatusId}
            routeType={mode}
            updatedAt={updatedAtIso}
            bookedAtIso={bookedAtIso}
            latestNote={publicTrackingNote}
            ctx={ctx}
            timelineOverrides={publicTimelineOverrides ?? null}
            publicTimelineStatusPath={publicTimelineStatusPath ?? null}
            publicTimelineStepVisibility={publicTimelineStepVisibility ?? null}
            internationalAgencyStage={internationalAgencyStage}
            showAllStages
          />
        </div>
      </div>

      <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 dark:bg-teal/10">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Current timeline step
        </h4>
        <p className="mt-1 text-[11px] text-muted-soft">
          What customers see on Track for today&apos;s status (
          <span className="capitalize">{mode}</span> step {stageIndex}). Edit below to fill missing copy or
          override admin defaults — saves apply on public tracking immediately.
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
        <AgencyTimelineStepForm
          key={`${bookingId}-${mode}-${stageIndex}-${JSON.stringify(currentOverrideSnap ?? null)}`}
          bookingId={bookingId}
          mode={mode}
          stepIndex={stageIndex}
          placeholders={currentPlaceholders}
          overrideSnap={currentOverrideSnap}
        />
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
            <p className="mb-3 text-[11px] text-muted-soft">
              Expand any step to edit title, location, hint, and optional time. Use this when a milestone
              was skipped on Track or you need international/customs wording per step.
            </p>
            <ul className="space-y-2">
              {stages.map((def, index) => {
                const row = effectiveStageRow(index, mode, publicTimelineOverrides, ctx);
                const isCurrent = index === stageIndex;
                const ph = defaultPlaceholders(index, mode, ctx);
                const snap = publicTimelineOverrides?.[mode]?.[String(index)];
                return (
                  <li
                    key={def.id}
                    className={`rounded-lg border ${
                      isCurrent ? "border-teal/40 bg-teal/5 dark:bg-teal/10" : "border-border-strong bg-canvas/30"
                    }`}
                  >
                    <details className="group">
                      <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
                              Step {index} — {def.title}
                              {isCurrent ? (
                                <span className="ml-2 normal-case text-teal">· current status</span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-sm font-medium text-ink">{row.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{row.location}</p>
                          </div>
                          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-soft group-open:rotate-180 motion-safe:transition" />
                        </div>
                      </summary>
                      <div className="border-t border-border-strong/80 px-3 pb-3">
                        <AgencyTimelineStepForm
                          key={`${bookingId}-${mode}-${index}-${JSON.stringify(snap ?? null)}`}
                          bookingId={bookingId}
                          mode={mode}
                          stepIndex={index}
                          placeholders={ph}
                          overrideSnap={snap}
                        />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>

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
                    bookedAtIso={bookedAtIso}
                    latestNote={publicTrackingNote}
                    ctx={ctx}
                    timelineOverrides={publicTimelineOverrides ?? null}
                    publicTimelineStatusPath={publicTimelineStatusPath ?? null}
                    publicTimelineStepVisibility={publicTimelineStepVisibility ?? null}
                    internationalAgencyStage={internationalAgencyStage}
                    showAllStages
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
