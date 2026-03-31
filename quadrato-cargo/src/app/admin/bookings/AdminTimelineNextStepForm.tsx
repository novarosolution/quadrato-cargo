"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { normalizeBookingStatus } from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import {
  DOMESTIC_PROFESSIONAL_STAGES,
  getDomesticProfessionalStageIndex,
  getInternationalProfessionalStageIndex,
  INTERNATIONAL_PROFESSIONAL_STAGES,
} from "@/lib/professional-tracking-stages";
import { adminInputClassName } from "@/components/admin/AdminFormField";
import {
  saveCustomerTimelineStepAdmin,
  saveCustomerTimelineStepVisibilityOnly,
  type BookingAdminUpdateState,
} from "@/app/admin/dashboard/actions";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

type Props = {
  bookingId: string;
  routeType: string;
  status: string;
  initial: PublicTimelineOverrides | null | undefined;
  initialStepVisibility?: PublicTimelineStepVisibility | null | undefined;
};

export function AdminTimelineNextStepForm({
  bookingId,
  routeType,
  status,
  initial,
  initialStepVisibility = null,
}: Props) {
  const isInternational = String(routeType).toLowerCase() === "international";
  const modeKey = isInternational ? "international" : "domestic";
  const stages = isInternational
    ? INTERNATIONAL_PROFESSIONAL_STAGES
    : DOMESTIC_PROFESSIONAL_STAGES;
  const st = normalizeBookingStatus(status);
  const currentIndex = isInternational
    ? getInternationalProfessionalStageIndex(st)
    : getDomesticProfessionalStageIndex(st);
  const lastIndex = stages.length - 1;
  const hasNext = currentIndex < lastIndex;
  const nextIndex = hasNext ? currentIndex + 1 : -1;
  const stageDef = hasNext && nextIndex >= 0 ? stages[nextIndex] : null;
  const stageSnap =
    hasNext && nextIndex >= 0 ? initial?.[modeKey]?.[String(nextIndex)] : undefined;

  const [title, setTitle] = useState(() => stageSnap?.title?.trim() ?? "");
  const [location, setLocation] = useState(() => stageSnap?.location?.trim() ?? "");
  const [hint, setHint] = useState(() => stageSnap?.hint?.trim() ?? "");
  const [shownAtLocal, setShownAtLocal] = useState(() =>
    stageSnap?.shownAt ? isoToDatetimeLocal(stageSnap.shownAt) : "",
  );

  const [showOnPublicTrack, setShowOnPublicTrack] = useState(() => {
    if (!hasNext || nextIndex < 0) return true;
    return initialStepVisibility?.[modeKey]?.[String(nextIndex)] !== false;
  });
  useEffect(() => {
    if (!hasNext || nextIndex < 0) return;
    const k = String(nextIndex);
    setShowOnPublicTrack(initialStepVisibility?.[modeKey]?.[k] !== false);
  }, [initialStepVisibility, modeKey, hasNext, nextIndex]);

  useEffect(() => {
    if (!hasNext || nextIndex < 0) return;
    const k = String(nextIndex);
    const snap = initial?.[modeKey]?.[k];
    setTitle(snap?.title?.trim() ?? "");
    setLocation(snap?.location?.trim() ?? "");
    setHint(snap?.hint?.trim() ?? "");
    setShownAtLocal(snap?.shownAt ? isoToDatetimeLocal(snap.shownAt) : "");
  }, [initial, modeKey, hasNext, nextIndex]);

  const stepVisibilityOnlyJson = useMemo(() => {
    const k = String(nextIndex);
    return JSON.stringify({
      merge: true,
      [modeKey]: { [k]: showOnPublicTrack },
    });
  }, [modeKey, nextIndex, showOnPublicTrack]);

  const stepPayloadJson = useMemo(
    () =>
      JSON.stringify({
        title,
        location,
        hint,
        shownAt: shownAtLocal,
      }),
    [title, location, hint, shownAtLocal],
  );

  const [state, formAction, pending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveCustomerTimelineStepAdmin, undefined);

  const [visState, visFormAction, visPending] = useActionState<
    BookingAdminUpdateState | undefined,
    FormData
  >(saveCustomerTimelineStepVisibilityOnly, undefined);

  const inputClass = adminInputClassName();

  if (!hasNext || !stageDef) {
    return (
      <div className="space-y-2 rounded-lg border border-border-strong/80 bg-canvas/20 px-3 py-3 text-sm text-muted-soft">
        <p className="font-medium text-ink">No next timeline card</p>
        <p>
          This booking is already on the last milestone for{" "}
          <span className="capitalize text-ink">{routeType}</span> tracking, or there is no following step to
          pre-fill. To change what customers see as &quot;current&quot;, use{" "}
          <strong className="font-medium text-ink">Status &amp; messages</strong> above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-muted-soft dark:bg-amber-500/10">
        <p className="font-semibold text-ink">Prep the next step (status unchanged)</p>
        <p className="mt-1">
          This edits the <strong className="text-ink">following</strong> timeline card (step {nextIndex} —{" "}
          {stageDef.title}). It does <strong className="text-ink">not</strong> move the booking forward. When you
          are ready, change <strong className="text-ink">Shipment status</strong> in{" "}
          <strong className="text-ink">Status &amp; messages</strong> above and save that form.
        </p>
      </div>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="modeKey" value={modeKey} />
        <input type="hidden" name="stepIndex" value={String(nextIndex)} />
        <input type="hidden" name="stepPayloadJson" value={stepPayloadJson} />

        <div className="sm:col-span-2">
          <label
            htmlFor="next-card-title"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Card title
          </label>
          <input
            id="next-card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={stageDef.title}
            className={`mt-1 w-full ${inputClass}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="next-card-location"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Location line
          </label>
          <input
            id="next-card-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Map pin line (optional override)"
            className={`mt-1 w-full ${inputClass}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="next-card-hint"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Short description
          </label>
          <textarea
            id="next-card-hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={stageDef.hint}
            rows={3}
            className={`mt-1 w-full resize-y ${inputClass}`}
          />
        </div>

        <div>
          <label
            htmlFor="next-card-time"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Time on card
          </label>
          <input
            id="next-card-time"
            type="datetime-local"
            value={shownAtLocal}
            onChange={(e) => setShownAtLocal(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
          />
        </div>

        <div className="flex flex-col justify-end gap-2 sm:col-span-2">
          {state?.ok === false && state.error ? (
            <p className="text-sm text-rose-400" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok === true ? (
            <p className="text-sm text-teal" role="status">
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || visPending}
            className="inline-flex w-full justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            {pending ? "Saving…" : "Save next step card text"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-dashed border-border-strong/90 bg-surface-elevated/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">Next step — Track visibility only</p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={showOnPublicTrack}
            onChange={(e) => setShowOnPublicTrack(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          <span>
            <span className="font-medium">Show on public Track</span>
            <span className="mt-0.5 block text-xs text-muted-soft">
              When this becomes the active step, customers will see it if checked. Admin-only control.
            </span>
          </span>
        </label>
        <form action={visFormAction} className="mt-3">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="stepVisibilityOnlyJson" value={stepVisibilityOnlyJson} />
          {visState?.ok === false && visState.error ? (
            <p className="mb-2 text-sm text-rose-400" role="alert">
              {visState.error}
            </p>
          ) : null}
          {visState?.ok === true ? (
            <p className="mb-2 text-sm text-teal" role="status">
              {visState.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={visPending || pending}
            className="inline-flex justify-center rounded-xl border border-border-strong bg-canvas px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/40 disabled:opacity-50"
          >
            {visPending ? "Saving…" : "Save Track visibility only (next step)"}
          </button>
        </form>
      </div>
    </div>
  );
}
