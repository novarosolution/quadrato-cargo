"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import {
  DOMESTIC_PROFESSIONAL_STAGES,
  INTERNATIONAL_PROFESSIONAL_STAGES,
} from "@/lib/professional-tracking-stages";
import type { PublicTimelineOverrides } from "@/lib/api/public-client";
import { AdminFormField, adminInputClassName } from "@/components/admin/AdminFormField";
import {
  saveCustomerTimelineAdmin,
  saveCustomerTimelineStepAdmin,
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
    domestic: cleanMode(domestic, 4),
    international: cleanMode(international, 10),
  };
}

type Props = {
  bookingId: string;
  routeType: string;
  initial: PublicTimelineOverrides | null | undefined;
};

const inputClass = adminInputClassName();

export function AdminCustomerTimelineForm({ bookingId, routeType, initial }: Props) {
  const isInternational = String(routeType).toLowerCase() === "international";
  const stages = isInternational ? INTERNATIONAL_PROFESSIONAL_STAGES : DOMESTIC_PROFESSIONAL_STAGES;
  const modeKey = isInternational ? "international" : "domestic";

  const [domestic, setDomestic] = useState(() => initMode(4, initial?.domestic));
  const [international, setInternational] = useState(() => initMode(10, initial?.international));
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
    () => JSON.stringify(buildApiPayload(domestic, international)),
    [domestic, international],
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

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-muted-soft">
        Override the <strong className="font-medium text-ink">shipment timeline</strong> cards customers see on
        public tracking (title, location line, description, and optional time per step). Leave a field empty to
        keep the automatic default. This booking is{" "}
        <strong className="font-medium text-ink capitalize">{routeType}</strong> — you edit{" "}
        {stages.length} steps; the other route&apos;s overrides stay stored if you set them later. Use{" "}
        <strong className="font-medium text-ink">Save this step only</strong> to update just the current step
        without affecting others.{" "}
        <strong className="font-medium text-ink">Save full timeline (replace snapshot)</strong> replaces the
        entire saved snapshot for both domestic and international (built from the form state below).
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong bg-canvas/30 px-3 py-2 text-xs text-muted-soft">
        <span>
          Step <strong className="text-ink">{step + 1}</strong> of {stages.length}
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
          <p className="text-[11px] text-muted-soft">
            Default title: <span className="font-medium text-ink">{def.title}</span>
            <br />
            Default description: <span className="text-muted">{def.hint}</span>
          </p>
          <AdminFormField label="Card title (optional)" htmlFor={`tl-${modeKey}-${step}-title`}>
            <input
              id={`tl-${modeKey}-${step}-title`}
              className={inputClass}
              value={row.title}
              onChange={(e) => updateField(step, "title", e.target.value)}
              placeholder={def.title}
              maxLength={200}
            />
          </AdminFormField>
          <AdminFormField
            label="Location line (optional)"
            htmlFor={`tl-${modeKey}-${step}-loc`}
            hint="Shown next to the map pin on the customer card."
          >
            <input
              id={`tl-${modeKey}-${step}-loc`}
              className={inputClass}
              value={row.location}
              onChange={(e) => updateField(step, "location", e.target.value)}
              placeholder="e.g. full address or hub name"
              maxLength={500}
            />
          </AdminFormField>
          <AdminFormField label="Short description (optional)" htmlFor={`tl-${modeKey}-${step}-hint`}>
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
          <AdminFormField
            label="Time on card (optional)"
            htmlFor={`tl-${modeKey}-${step}-time`}
            hint="If empty, customers see the booking last-updated time for visible steps."
          >
            <input
              id={`tl-${modeKey}-${step}-time`}
              type="datetime-local"
              className={inputClass}
              value={row.shownAt}
              onChange={(e) => updateField(step, "shownAt", e.target.value)}
            />
          </AdminFormField>

          <form action={stepFormAction} className="pt-1">
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="modeKey" value={modeKey} />
            <input type="hidden" name="stepIndex" value={String(step)} />
            <input type="hidden" name="stepPayloadJson" value={stepPayloadJson} />
            <button
              type="submit"
              disabled={stepPending || pending}
              className="rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/40 disabled:opacity-60"
            >
              {stepPending ? "Saving step…" : "Save this step only"}
            </button>
          </form>
        </div>
      ) : null}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="timelineJson" value={payloadJson} />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl border border-teal/70 bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save full timeline (replace snapshot)"}
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-xl border border-border-strong bg-canvas px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
            onClick={() => {
              setDomestic(initMode(4, undefined));
              setInternational(initMode(10, undefined));
              setStep(0);
            }}
          >
            Clear all fields (then Save to remove custom text)
          </button>
        </div>
      </form>

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
