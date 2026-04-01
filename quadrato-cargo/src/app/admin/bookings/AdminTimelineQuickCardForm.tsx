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

export function AdminTimelineQuickCardForm({
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
  const stageIndex = isInternational
    ? resolveInternationalTimelineStageIndex(st, internationalAgencyStage)
    : getDomesticProfessionalStageIndex(st);
  const stageDef = stages[stageIndex];
  const idxKey = String(stageIndex);
  const stageSnap = initial?.[modeKey]?.[idxKey];

  const [title, setTitle] = useState(() => stageSnap?.title?.trim() ?? "");
  const [location, setLocation] = useState(() => stageSnap?.location?.trim() ?? "");
  const [hint, setHint] = useState(() => stageSnap?.hint?.trim() ?? "");
  const [shownAtLocal, setShownAtLocal] = useState(() =>
    stageSnap?.shownAt ? isoToDatetimeLocal(stageSnap.shownAt) : "",
  );

  const [showOnPublicTrack, setShowOnPublicTrack] = useState(
    () => initialStepVisibility?.[modeKey]?.[idxKey] !== false,
  );

  const stepVisibilityOnlyJson = useMemo(
    () =>
      JSON.stringify({
        merge: true,
        [modeKey]: { [idxKey]: showOnPublicTrack },
      }),
    [modeKey, idxKey, showOnPublicTrack],
  );

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

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">
          {stageDef?.title ?? "Step"} <span className="font-normal text-muted-soft">· {routeType}</span>
        </p>
        <p className="mt-1 text-xs text-muted-soft">
          Change status in <strong className="text-ink">Status, notes &amp; dates</strong>
          {isInternational
            ? " (international macro card can be fixed there too). "
            : ". "}
          Empty fields = default text. Agencies can edit the same card in Agency portal.
        </p>
      </div>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="modeKey" value={modeKey} />
        <input type="hidden" name="stepIndex" value={idxKey} />
        <input type="hidden" name="stepPayloadJson" value={stepPayloadJson} />

        <div className="sm:col-span-2">
          <label
            htmlFor="quick-card-title"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Title
          </label>
          <input
            id="quick-card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={stageDef?.title ?? "Title"}
            className={`mt-1 w-full ${inputClass}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="quick-card-location"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Location
          </label>
          <input
            id="quick-card-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Map pin line (optional override)"
            className={`mt-1 w-full ${inputClass}`}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="quick-card-hint"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Short description
          </label>
          <textarea
            id="quick-card-hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={stageDef?.hint ?? "Description"}
            rows={3}
            className={`mt-1 w-full resize-y ${inputClass}`}
          />
        </div>

        <div>
          <label
            htmlFor="quick-card-time"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Time
          </label>
          <input
            id="quick-card-time"
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
        <p className="mt-1 text-[11px] text-muted-soft">
          Off = hidden (current status card still shows). Customers never see this checkbox.
        </p>
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
