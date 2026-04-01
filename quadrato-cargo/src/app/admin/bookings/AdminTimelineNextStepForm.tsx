"use client";

import { useActionState, useMemo, useState } from "react";
import { normalizeBookingStatus } from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import { resolveInternationalTimelineStageIndex } from "@/lib/international-timeline-stage";
import {
  DOMESTIC_PROFESSIONAL_STAGES,
  getDomesticProfessionalStageIndex,
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
  internationalAgencyStage?: number | null;
};

export function AdminTimelineNextStepForm({
  bookingId,
  routeType,
  status,
  initial,
  initialStepVisibility = null,
  internationalAgencyStage = null,
}: Props) {
  const isInternational = String(routeType).toLowerCase() === "international";
  const modeKey = isInternational ? "international" : "domestic";
  const stages = isInternational
    ? INTERNATIONAL_PROFESSIONAL_STAGES
    : DOMESTIC_PROFESSIONAL_STAGES;
  const st = normalizeBookingStatus(status);
  const currentIndex = isInternational
    ? resolveInternationalTimelineStageIndex(st, internationalAgencyStage)
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
      <p className="text-sm text-muted-soft">
        Last step for this route. Change status in <strong className="text-ink">Status, notes &amp; dates</strong> if
        needed.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">
          Next: {stageDef.title} <span className="font-normal text-muted-soft">· does not change status</span>
        </p>
        <p className="mt-1 text-xs text-muted-soft">
          Advance the booking in <strong className="text-ink">Status, notes &amp; dates</strong> when ready.
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
            Title
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
            Location
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
            Time
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
            {pending ? "Saving…" : "Save text"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border-strong/80 bg-canvas/25 p-4">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={showOnPublicTrack}
            onChange={(e) => setShowOnPublicTrack(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          <span className="font-medium">Show on customer Track</span>
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
            {visPending ? "Saving…" : "Save visibility"}
          </button>
        </form>
      </div>
    </div>
  );
}
