"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import {
  DOMESTIC_PROFESSIONAL_STAGES,
  INTERNATIONAL_PROFESSIONAL_STAGES,
} from "@/lib/professional-tracking-stages";

const DOMESTIC_TIMELINE_MAX_INDEX = DOMESTIC_PROFESSIONAL_STAGES.length - 1;
const INTERNATIONAL_TIMELINE_MAX_INDEX = INTERNATIONAL_PROFESSIONAL_STAGES.length - 1;
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import { AdminFormField, adminInputClassName } from "@/components/admin/AdminFormField";
import {
  saveCustomerTimelineAdmin,
  saveCustomerTimelineLocationsAdmin,
  saveCustomerTimelineStepAdmin,
  saveCustomerTimelineStepVisibilityOnly,
  type BookingAdminUpdateState,
} from "@/app/admin/dashboard/actions";

type StageFields = { title: string; location: string; hint: string; shownAt: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function initMode(
  maxIdx: number,
  src: Record<string, { title?: string; location?: string; hint?: string; shownAt?: string }> | undefined,
): Record<string, StageFields> {
  const out: Record<string, StageFields> = {};
  for (let i = 0; i <= maxIdx; i++) {
    const k = String(i);
    const p = src?.[k];
    out[k] = {
      title: p?.title ?? "",
      location: p?.location ?? "",
      hint: p?.hint ?? "",
      shownAt: p?.shownAt ? isoToDatetimeLocal(p.shownAt) : "",
    };
  }
  return out;
}

function buildApiPayload(domestic: Record<string, StageFields>, international: Record<string, StageFields>) {
  const cleanMode = (m: Record<string, StageFields>, max: number) => {
    const out: Record<string, { title?: string; location?: string; hint?: string; shownAt?: string }> = {};
    for (let i = 0; i <= max; i++) {
      const k = String(i);
      const s = m[k];
      if (!s) continue;
      const o: (typeof out)[string] = {};
      if (s.title.trim()) o.title = s.title.trim();
      if (s.location.trim()) o.location = s.location.trim();
      if (s.hint.trim()) o.hint = s.hint.trim();
      if (s.shownAt.trim()) {
        const d = new Date(s.shownAt);
        if (!Number.isNaN(d.getTime())) o.shownAt = d.toISOString();
      }
      if (Object.keys(o).length) out[k] = o;
    }
    return out;
  };
  return {
    domestic: cleanMode(domestic, DOMESTIC_TIMELINE_MAX_INDEX),
    international: cleanMode(international, INTERNATIONAL_TIMELINE_MAX_INDEX),
  };
}

function initVisibleMap(
  maxIdx: number,
  src: Record<string, boolean> | undefined,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (let i = 0; i <= maxIdx; i++) {
    const k = String(i);
    out[k] = src?.[k] !== false;
  }
  return out;
}

function buildStepVisibilityPayload(
  visDom: Record<string, boolean>,
  visIntl: Record<string, boolean>,
) {
  const domestic: Record<string, boolean> = {};
  for (let i = 0; i <= DOMESTIC_TIMELINE_MAX_INDEX; i++) {
    const k = String(i);
    domestic[k] = visDom[k] !== false;
  }
  const international: Record<string, boolean> = {};
  for (let i = 0; i <= INTERNATIONAL_TIMELINE_MAX_INDEX; i++) {
    const k = String(i);
    international[k] = visIntl[k] !== false;
  }
  return { merge: true, domestic, international };
}

type Props = {
  bookingId: string;
  routeType: string;
  initial: PublicTimelineOverrides | null | undefined;
  initialStepVisibility?: PublicTimelineStepVisibility | null | undefined;
};

const inputClass = adminInputClassName();

function defaultLocationSaveMask(stepCount: number): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (let i = 0; i < stepCount; i++) {
    m[String(i)] = true;
  }
  return m;
}

export function AdminCustomerTimelineForm({
  bookingId,
  routeType,
  initial,
  initialStepVisibility = null,
}: Props) {
  const isInternational = String(routeType).toLowerCase() === "international";
  const stages = isInternational ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const modeKey = isInternational ? "international" : "domestic";

  const [domestic, setDomestic] = useState(() =>
    initMode(DOMESTIC_TIMELINE_MAX_INDEX, initial?.domestic),
  );
  const [international, setInternational] = useState(() =>
    initMode(INTERNATIONAL_TIMELINE_MAX_INDEX, initial?.international),
  );
  const [visibleDomestic, setVisibleDomestic] = useState(() =>
    initVisibleMap(DOMESTIC_TIMELINE_MAX_INDEX, initialStepVisibility?.domestic),
  );
  const [visibleInternational, setVisibleInternational] = useState(() =>
    initVisibleMap(INTERNATIONAL_TIMELINE_MAX_INDEX, initialStepVisibility?.international),
  );
  const [step, setStep] = useState(0);

  const modeState = isInternational ? international : domestic;
  const setModeState = isInternational ? setInternational : setDomestic;

  const [state, formAction, pending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveCustomerTimelineAdmin, undefined);

  const [stepState, stepFormAction, stepPending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveCustomerTimelineStepAdmin, undefined);

  const [stepVisState, stepVisFormAction, stepVisPending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveCustomerTimelineStepVisibilityOnly, undefined);

  const [locState, locFormAction, locPending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveCustomerTimelineLocationsAdmin, undefined);

  const [locSaveMask, setLocSaveMask] = useState<Record<string, boolean>>(() =>
    defaultLocationSaveMask(stages.length),
  );

  const updateField = useCallback(
    (idx: number, field: keyof StageFields, value: string) => {
      const k = String(idx);
      setModeState((prev) => ({
        ...prev,
        [k]: { ...prev[k], [field]: value },
      }));
    },
    [setModeState],
  );

  const payloadJson = useMemo(
    () =>
      JSON.stringify({
        ...buildApiPayload(domestic, international),
        stepVisibility: buildStepVisibilityPayload(visibleDomestic, visibleInternational),
      }),
    [domestic, international, visibleDomestic, visibleInternational],
  );

  const last = stages.length - 1;
  const def = stages[step];
  const row = modeState[String(step)] ?? {
    title: "",
    location: "",
    hint: "",
    shownAt: "",
  };

  const stepPayloadJson = useMemo(
    () =>
      JSON.stringify({
        title: row.title,
        location: row.location,
        hint: row.hint,
        shownAt: row.shownAt,
      }),
    [row.title, row.location, row.hint, row.shownAt],
  );

  const visibleMap = modeKey === "international" ? visibleInternational : visibleDomestic;
  const setVisibleMap = modeKey === "international" ? setVisibleInternational : setVisibleDomestic;

  const stepVisibilitySubmitJson = useMemo(() => {
    const vm = modeKey === "international" ? visibleInternational : visibleDomestic;
    return JSON.stringify({
      merge: true,
      [modeKey]: { [String(step)]: vm[String(step)] !== false },
    });
  }, [modeKey, step, visibleInternational, visibleDomestic]);

  const locationsPayloadJson = useMemo(() => {
    const inner: Record<string, { location: string }> = {};
    for (let i = 0; i <= last; i++) {
      const k = String(i);
      if (!locSaveMask[k]) continue;
      inner[k] = { location: (modeState[k]?.location ?? "").trim() };
    }
    return JSON.stringify(inner);
  }, [modeState, last, locSaveMask]);

  const selectedLocationStepCount = useMemo(() => {
    let n = 0;
    for (let i = 0; i <= last; i++) {
      if (locSaveMask[String(i)]) n += 1;
    }
    return n;
  }, [locSaveMask, last]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-soft">
        <span className="font-medium capitalize text-ink">{routeType}</span>, {stages.length} steps. Edit below,
        then <strong className="text-ink">Save all</strong> for one update, or save each section as you go. Status:
        use <strong className="text-ink">Status, notes &amp; dates</strong> above.
      </p>

      <div
        id="save-all-timeline"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-teal/35 bg-teal/5 p-4 dark:bg-teal/10"
      >
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="timelineJson" value={payloadJson} />
          <button
            type="submit"
            disabled={pending || locPending || stepPending || stepVisPending}
            className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save all"}
          </button>
          <button
            type="button"
            disabled={pending || locPending || stepPending || stepVisPending}
            className="rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
            onClick={() => {
              setDomestic(initMode(DOMESTIC_TIMELINE_MAX_INDEX, undefined));
              setInternational(initMode(INTERNATIONAL_TIMELINE_MAX_INDEX, undefined));
              setVisibleDomestic(initVisibleMap(DOMESTIC_TIMELINE_MAX_INDEX, undefined));
              setVisibleInternational(initVisibleMap(INTERNATIONAL_TIMELINE_MAX_INDEX, undefined));
              setStep(0);
            }}
          >
            Reset form
          </button>
        </form>
        <p className="text-xs text-muted-soft">Saves every step + show/hide for both routes.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-border-strong bg-surface-elevated/30 p-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Bulk location lines</h3>
          <p className="mt-1 text-xs text-muted-soft">
            Tick steps to update. Empty = default location on Track.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-border-strong bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:border-teal/40"
            onClick={() => {
              setLocSaveMask(() => {
                const next: Record<string, boolean> = {};
                for (let i = 0; i <= last; i++) next[String(i)] = true;
                return next;
              });
            }}
          >
            All
          </button>
          <button
            type="button"
            className="rounded-lg border border-border-strong bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:border-teal/40"
            onClick={() => {
              setLocSaveMask(() => {
                const next: Record<string, boolean> = {};
                for (let i = 0; i <= last; i++) next[String(i)] = false;
                return next;
              });
            }}
          >
            None
          </button>
          <span className="self-center text-xs text-muted-soft">
            {selectedLocationStepCount}/{last + 1} selected
          </span>
        </div>
        <ul className="space-y-4">
          {stages.map((stageDef, idx) => {
            const k = String(idx);
            const loc = modeState[k]?.location ?? "";
            const checked = locSaveMask[k] !== false;
            return (
              <li
                key={`all-loc-${k}`}
                className="flex flex-col gap-2 rounded-lg border border-border-strong/60 bg-canvas/20 p-3 sm:flex-row sm:items-start sm:gap-4"
              >
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-ink sm:pt-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setLocSaveMask((prev) => ({ ...prev, [k]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
                  />
                  Apply
                </label>
                <div className="min-w-0 flex-1">
                  <AdminFormField label={`${idx + 1}. ${stageDef.title}`} htmlFor={`tl-all-loc-${modeKey}-${k}`}>
                    <input
                      id={`tl-all-loc-${modeKey}-${k}`}
                      className={inputClass}
                      value={loc}
                      onChange={(e) => updateField(idx, "location", e.target.value)}
                      placeholder="e.g. hub name or address (optional)"
                      maxLength={500}
                    />
                  </AdminFormField>
                </div>
              </li>
            );
          })}
        </ul>
        <form action={locFormAction} className="pt-1">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="modeKey" value={modeKey} />
          <input type="hidden" name="locationsJson" value={locationsPayloadJson} />
          <button
            type="submit"
            disabled={
              locPending || pending || stepPending || stepVisPending || selectedLocationStepCount === 0
            }
            className="rounded-xl border border-teal/50 bg-teal-dim/80 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal disabled:opacity-60 dark:bg-teal-dim/40"
          >
            {locPending ? "Saving…" : "Save locations"}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong bg-canvas/30 px-3 py-2 text-xs text-muted-soft">
        <span className="font-medium text-ink">
          Step {step + 1} / {stages.length}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs font-medium text-ink hover:border-teal/40"
            disabled={step <= 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          <button
            type="button"
            className="rounded-lg border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs font-medium text-ink hover:border-teal/40"
            disabled={step >= last}
            onClick={() => setStep((s) => Math.min(last, s + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {def ? (
        <div className="space-y-4 rounded-xl border border-border-strong bg-surface-elevated/40 p-4">
          <p className="text-xs text-muted-soft">
            Default: <span className="text-ink">{def.title}</span> — {def.hint}
          </p>
          <AdminFormField label="Title" htmlFor={`tl-${modeKey}-${step}-title`}>
            <input
              id={`tl-${modeKey}-${step}-title`}
              className={inputClass}
              value={row.title}
              onChange={(e) => updateField(step, "title", e.target.value)}
              placeholder={def.title}
              maxLength={200}
            />
          </AdminFormField>
          <AdminFormField label="Location" htmlFor={`tl-${modeKey}-${step}-loc`}>
            <input
              id={`tl-${modeKey}-${step}-loc`}
              className={inputClass}
              value={row.location}
              onChange={(e) => updateField(step, "location", e.target.value)}
              placeholder="e.g. full address or hub name"
              maxLength={500}
            />
          </AdminFormField>
          <AdminFormField label="Description" htmlFor={`tl-${modeKey}-${step}-hint`}>
            <textarea
              id={`tl-${modeKey}-${step}-hint`}
              className={`${inputClass} min-h-[72px] resize-y`}
              value={row.hint}
              onChange={(e) => updateField(step, "hint", e.target.value)}
              placeholder={def.hint}
              maxLength={2000}
              rows={3}
            />
          </AdminFormField>
          <AdminFormField label="Time" htmlFor={`tl-${modeKey}-${step}-time`}>
            <input
              id={`tl-${modeKey}-${step}-time`}
              type="datetime-local"
              className={inputClass}
              value={row.shownAt}
              onChange={(e) => updateField(step, "shownAt", e.target.value)}
            />
          </AdminFormField>

          <form action={stepFormAction} className="space-y-2 pt-1">
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="modeKey" value={modeKey} />
            <input type="hidden" name="stepIndex" value={String(step)} />
            <input type="hidden" name="stepPayloadJson" value={stepPayloadJson} />
            <button
              type="submit"
              disabled={stepPending || pending || locPending || stepVisPending}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {stepPending ? "Saving…" : "Save text"}
            </button>
          </form>

          <div className="mt-4 rounded-lg border border-border-strong/80 bg-canvas/25 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={visibleMap[String(step)] !== false}
                onChange={(e) => {
                  const k = String(step);
                  setVisibleMap((prev) => ({ ...prev, [k]: e.target.checked }));
                }}
                className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
              />
              <span className="font-medium">Show on customer Track</span>
            </label>
            <form action={stepVisFormAction} className="mt-2">
              <input type="hidden" name="bookingId" value={bookingId} />
              <input type="hidden" name="stepVisibilityOnlyJson" value={stepVisibilitySubmitJson} />
              <button
                type="submit"
                disabled={stepVisPending || pending || locPending || stepPending}
                className="rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/40 disabled:opacity-60"
              >
                {stepVisPending ? "Saving…" : "Save visibility"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {locState?.ok === false ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {locState.error}
        </p>
      ) : null}
      {locState?.ok === true ? (
        <p className="rounded-lg border border-teal/30 bg-teal-dim/50 px-3 py-2 text-sm text-ink">
          {locState.message}
          {locState.warning ? (
            <span className="mt-1 block text-xs text-amber-800 dark:text-amber-200">{locState.warning}</span>
          ) : null}
        </p>
      ) : null}

      {stepState?.ok === false ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {stepState.error}
        </p>
      ) : null}
      {stepState?.ok === true ? (
        <p className="rounded-lg border border-teal/30 bg-teal-dim/50 px-3 py-2 text-sm text-ink">
          {stepState.message}
          {stepState.warning ? (
            <span className="mt-1 block text-xs text-amber-800 dark:text-amber-200">{stepState.warning}</span>
          ) : null}
        </p>
      ) : null}

      {stepVisState?.ok === false ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {stepVisState.error}
        </p>
      ) : null}
      {stepVisState?.ok === true ? (
        <p className="rounded-lg border border-teal/30 bg-teal-dim/50 px-3 py-2 text-sm text-ink">
          {stepVisState.message}
        </p>
      ) : null}

      {state?.ok === false ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="rounded-lg border border-teal/30 bg-teal-dim/50 px-3 py-2 text-sm text-ink">
          {state.message}
          {state.warning ? (
            <span className="mt-1 block text-xs text-amber-800 dark:text-amber-200">{state.warning}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
