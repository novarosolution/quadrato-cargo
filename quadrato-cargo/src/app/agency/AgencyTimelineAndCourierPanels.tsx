"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { BookingStatusId } from "@/lib/booking-status";
import { normalizeBookingStatus } from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStageOverride,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import { patchAgencyBookingTimelineApi } from "@/lib/api/agency-client";
import {
  agencyCourierContextLabels,
  agencyTimelinePanelCopy as T,
  agencyTrackingWizardCopy as W,
} from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";
import { ProfessionalTrackingTimeline } from "@/app/public/tsking/ProfessionalTrackingTimeline";
import { InternationalStaffFlowReference } from "@/components/tracking/InternationalStaffFlowReference";
import { resolveInternationalTimelineStageIndex } from "@/lib/international-timeline-stage";
import {
  DEFAULT_DOMESTIC_MAIN_HUB_CITY,
  defaultInternationalStageTitle,
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
  if (pref) out.push({ label: agencyCourierContextLabels.pickupPreference, value: pref });
  const instr = typeof root.instructions === "string" ? root.instructions.trim() : "";
  if (instr) out.push({ label: agencyCourierContextLabels.pickupInstructions, value: instr });
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
  const baseTitle =
    mode === "international" && def?.title
      ? defaultInternationalStageTitle(index, def.title, ctx.agencyName)
      : def?.title || "";
  return {
    title: snap?.title?.trim() || baseTitle || `${T.stepHeading} ${index}`,
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
  const baseTitle =
    mode === "international" && def?.title
      ? defaultInternationalStageTitle(index, def.title, ctx.agencyName)
      : def?.title || "";
  return {
    title: baseTitle,
    location: defaultLocation,
    hint: def?.hint || "",
  };
}

/** Native `<details>` does not accept `defaultOpen` in React; use controlled `open` + `onToggle`. */
function AgencyTimelineStepDisclosure({
  initiallyOpen,
  className,
  children,
}: {
  initiallyOpen: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details
      className={className}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      {children}
    </details>
  );
}

function AgencyTimelineStepForm({
  bookingId,
  mode,
  stepIndex,
  placeholders,
  overrideSnap,
  comfortable,
}: {
  bookingId: string;
  mode: "domestic" | "international";
  stepIndex: number;
  placeholders: { title: string; location: string; hint: string };
  overrideSnap: PublicTimelineStageOverride | undefined;
  /** Wider hint area on full booking page */
  comfortable?: boolean;
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
        {T.stepFormDefaultsLead}{" "}
        <span className="text-ink">{placeholders.title}</span> · {placeholders.location}
      </p>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          {T.stepFormCardTitleLabel}
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
          {T.stepFormLocationLabel}
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
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          {T.stepFormHintLabel}
        </label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder={placeholders.hint}
          rows={comfortable ? 5 : 3}
          className={`${inputClass} resize-y`}
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          {T.stepFormCardTimeLabel}
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
        {pending ? T.stepFormSavePending : `${T.stepFormSaveButton} ${stepIndex}`}
      </button>
      <p className="text-[10px] text-muted-soft">{T.stepFormFooter}</p>
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
  /** Hub city for customer-style timeline (matches Track). */
  agencyHubCity?: string | null;
  routeFromCity?: string | null;
  routeToCity?: string | null;
  domesticMainHubCity?: string | null;
  publicTimelineOverrides: PublicTimelineOverrides | null | undefined;
  publicTimelineStepVisibility: PublicTimelineStepVisibility | null | undefined;
  publicTimelineStatusPath: string[] | null | undefined;
  internationalAgencyStage?: number | null;
  courierId: string | null;
  courierName?: string | null;
  payload: unknown;
  /** Full booking page: all steps first, expanded, roomier fields */
  timelineLayout?: "default" | "page" | "wizard";
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
  agencyHubCity = null,
  routeFromCity = null,
  routeToCity = null,
  domesticMainHubCity = null,
  publicTimelineOverrides,
  publicTimelineStepVisibility,
  publicTimelineStatusPath,
  internationalAgencyStage = null,
  courierId,
  courierName = null,
  payload,
  timelineLayout = "default",
}: Props) {
  const isPage = timelineLayout === "page";
  const isWizard = timelineLayout === "wizard";
  const [allOpen, setAllOpen] = useState(isPage);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [wizSub, setWizSub] = useState(0);

  const mode = String(routeType).toLowerCase() === "international" ? "international" : "domestic";
  const stages = mode === "international" ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const st = normalizeBookingStatus(status);
  const stageIndex =
    mode === "international"
      ? resolveInternationalTimelineStageIndex(st, internationalAgencyStage)
      : getDomesticProfessionalStageIndex(st);

  const routeCountries = useMemo(() => {
    const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const s =
      root.sender && typeof root.sender === "object"
        ? (root.sender as Record<string, unknown>)
        : {};
    const r =
      root.recipient && typeof root.recipient === "object"
        ? (root.recipient as Record<string, unknown>)
        : {};
    return {
      senderCountry: String(s.country ?? "").trim() || null,
      recipientCountry: String(r.country ?? "").trim() || null,
    };
  }, [payload]);

  const ctx = useMemo<TrackingShipmentContext>(
    () => ({
      senderAddress,
      recipientAddress,
      agencyName: agencyDisplayName?.trim() || null,
      agencyCity: agencyHubCity?.trim() || null,
      domesticMainHubCity:
        domesticMainHubCity?.trim() || DEFAULT_DOMESTIC_MAIN_HUB_CITY,
      fromCity: routeFromCity?.trim() || null,
      toCity: routeToCity?.trim() || null,
      senderCountry: routeCountries.senderCountry,
      recipientCountry: routeCountries.recipientCountry,
      courierName: courierName?.trim() || null,
    }),
    [
      senderAddress,
      recipientAddress,
      agencyDisplayName,
      agencyHubCity,
      domesticMainHubCity,
      routeFromCity,
      routeToCity,
      routeCountries.senderCountry,
      routeCountries.recipientCountry,
      courierName,
    ],
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

  const courierPanelEl = (
    <div className="rounded-xl border border-border-strong bg-canvas/25 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
        {T.courierPanelTitle}
      </h4>
      <p className="mt-1 text-[11px] text-muted-soft">{T.courierPanelBlurb}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {courierId ? (
          <>
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">
                {T.courierNameLabel}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">
                {courierName?.trim() ? courierName.trim() : T.courierNamePending}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">
                {T.courierRecordIdLabel}
              </dt>
              <dd className="mt-0.5 font-mono text-xs text-muted-soft">{courierId}</dd>
            </div>
          </>
        ) : (
          <div className="sm:col-span-2 text-xs text-muted-soft">{T.noCourierYet}</div>
        )}
        {pickupExtras.map(({ label, value }) => (
          <div key={label} className="min-w-0 sm:col-span-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">{label}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap wrap-break-word text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const staffPreviewSection = (
    <div className="rounded-xl border border-border-strong bg-surface-elevated/60 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
        {T.staffPreviewTitle}
      </h4>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-soft">
        {mode === "international"
          ? T.staffPreviewBlurbInternational
          : T.staffPreviewBlurbDomestic}
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
  );

  const timelineStepItems = stages.map((def, index) => {
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
        <AgencyTimelineStepDisclosure initiallyOpen={isPage} className="group">
          <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
                  {T.stepHeading} {index} —{" "}
                  {mode === "international"
                    ? defaultInternationalStageTitle(index, def.title, ctx.agencyName)
                    : def.title}
                  {isCurrent ? (
                    <span className="ml-2 normal-case text-teal">{T.currentStatusBadge}</span>
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
              comfortable={isPage}
            />
          </div>
        </AgencyTimelineStepDisclosure>
      </li>
    );
  });

  if (isWizard) {
    const stageCount = stages.length;
    const totalWiz = 1 + stageCount + 1;
    const subLabel =
      wizSub === 0
        ? W.timelineSubCourier
        : wizSub <= stageCount
          ? W.timelineSubStage
          : W.timelineSubPreview;

    let center: ReactNode = null;
    if (wizSub === 0) {
      center = (
        <div className="space-y-4">
          {courierPanelEl}
          {mode === "international" ? (
            <InternationalStaffFlowReference defaultOpen={false} className="overflow-hidden" />
          ) : null}
        </div>
      );
    } else if (wizSub <= stageCount) {
      const k = wizSub - 1;
      const def = stages[k];
      const ph = defaultPlaceholders(k, mode, ctx);
      const snap = publicTimelineOverrides?.[mode]?.[String(k)];
      const row = effectiveStageRow(k, mode, publicTimelineOverrides, ctx);
      const isCurrent = k === stageIndex;
      center = (
        <div className={agencyUi.panelSurface}>
          <div className="border-b border-border-strong/60 pb-4">
            <p className="section-eyebrow text-[10px]">{W.timelineSubStage}</p>
            <h4 className="mt-2 font-display text-base font-semibold tracking-tight text-ink">
              {T.stepHeading} {k} —{" "}
              {mode === "international"
                ? defaultInternationalStageTitle(k, def.title, ctx.agencyName)
                : def.title}
              {isCurrent ? (
                <span className="ml-2 text-sm font-normal text-teal">{T.currentStatusBadge}</span>
              ) : null}
            </h4>
            <p className="mt-2 text-sm font-medium text-ink">{row.title}</p>
            <p className="mt-1 text-xs text-muted">{row.location}</p>
            <p className="mt-2 text-[11px] text-muted-soft">
              {T.currentStepBlurbBefore}
              <span className="capitalize">{mode}</span>
              {T.currentStepBlurbAfterMode}
              {stageIndex}
              {T.currentStepBlurbAfterIndex}
            </p>
          </div>
          <div className="mt-5">
            <AgencyTimelineStepForm
              key={`${bookingId}-${mode}-${k}-wiz-${JSON.stringify(snap ?? null)}`}
              bookingId={bookingId}
              mode={mode}
              stepIndex={k}
              placeholders={ph}
              overrideSnap={snap}
              comfortable
            />
          </div>
        </div>
      );
    } else {
      center = staffPreviewSection;
    }

    return (
      <div className="space-y-5">
        <div className="min-h-[min(60vh,520px)]">{center}</div>
        <div className="flex flex-col gap-3 rounded-2xl border border-border-strong/80 bg-surface-elevated/40 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-soft">
            <span className="font-semibold text-ink">{W.timelineSubstepOf(wizSub + 1, totalWiz)}</span>
            <span className="mx-1.5 text-border-strong">·</span>
            {subLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={wizSub <= 0}
              onClick={() => setWizSub((s) => Math.max(0, s - 1))}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-canvas/50 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              {W.back}
            </button>
            {wizSub < totalWiz - 1 ? (
              <button
                type="button"
                onClick={() => setWizSub((s) => Math.min(totalWiz - 1, s + 1))}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-teal/20 transition hover:opacity-92"
              >
                {W.next}
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            ) : (
              <span className="inline-flex items-center rounded-xl border border-teal/25 bg-teal/10 px-4 py-2.5 text-xs font-semibold text-teal">
                {W.finishTimeline}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isPage ? "space-y-6" : "space-y-4"}>
      {courierPanelEl}

      {mode === "international" ? (
        <InternationalStaffFlowReference defaultOpen={false} className="overflow-hidden" />
      ) : null}

      {isPage ? (
        <>
          <div
            className={`rounded-2xl border-2 border-teal/25 bg-teal/5 p-4 sm:p-5 dark:border-teal/30 dark:bg-teal/10`}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              {T.pageWorkspaceSectionTitle}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">{T.pageWorkspaceSectionIntro}</p>
            <p className="mt-2 text-[11px] text-muted-soft">
              {T.currentStepBlurbBefore}
              <span className="capitalize">{mode}</span>
              {T.currentStepBlurbAfterMode}
              {stageIndex}
              {T.currentStepBlurbAfterIndex}
            </p>
            <ul className={`mt-4 space-y-2 ${isPage ? "sm:space-y-3" : ""}`}>{timelineStepItems}</ul>
          </div>
          {staffPreviewSection}
        </>
      ) : (
        <>
          {staffPreviewSection}

          <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 dark:bg-teal/10">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              {T.currentStepTitle}
            </h4>
            <p className="mt-1 text-[11px] text-muted-soft">
              {T.currentStepBlurbBefore}
              <span className="capitalize">{mode}</span>
              {T.currentStepBlurbAfterMode}
              {stageIndex}
              {T.currentStepBlurbAfterIndex}
            </p>
            <div className="mt-3 space-y-2 rounded-lg border border-border-strong bg-canvas/40 px-3 py-3 text-sm">
              <p className="font-medium text-ink">{currentRow.title}</p>
              <p className="text-xs text-muted">{currentRow.location}</p>
              {currentRow.hint ? (
                <p className="text-xs leading-relaxed text-muted-soft">{currentRow.hint}</p>
              ) : null}
              <p className="text-[11px] text-muted-soft">
                {T.cardTimePrefix}{" "}
                <span className="text-ink">{formatStepTime(timelineUpdatedAt)}</span>
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
              <span>{T.allStepsToggle}</span>
              {allOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-soft" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-soft" aria-hidden />
              )}
            </button>
            {allOpen ? (
              <div className="border-t border-border-strong px-4 py-3">
                <p className="mb-3 text-[11px] text-muted-soft">{T.allStepsIntro}</p>
                <ul className="space-y-2">{timelineStepItems}</ul>

                <div className="mt-4 border-t border-border-strong pt-3">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen((o) => !o)}
                    aria-expanded={previewOpen}
                    className="flex w-full items-center justify-between gap-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-soft transition hover:text-ink"
                  >
                    <span>{T.previewPublicToggle}</span>
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
        </>
      )}
    </div>
  );
}
