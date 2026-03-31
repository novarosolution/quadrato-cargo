"use client";

import { useActionState, useMemo, useState } from "react";
import { normalizeBookingStatus } from "@/lib/booking-status";
import type { PublicTimelineOverrides } from "@/lib/api/public-client";
import {
  DOMESTIC_PROFESSIONAL_STAGES,
  getDomesticProfessionalStageIndex,
  getInternationalProfessionalStageIndex,
  INTERNATIONAL_PROFESSIONAL_STAGES,
} from "@/lib/professional-tracking-stages";
import { adminInputClassName } from "@/components/admin/AdminFormField";
import {
  saveCustomerTimelineStepAdmin,
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
};

export function AdminTimelineQuickCardForm({
  bookingId,
  routeType,
  status,
  initial,
}: Props) {
  const isInternational = String(routeType).toLowerCase() === "international";
  const modeKey = isInternational ? "international" : "domestic";
  const stages = isInternational
    ? INTERNATIONAL_PROFESSIONAL_STAGES
    : DOMESTIC_PROFESSIONAL_STAGES;
  const st = normalizeBookingStatus(status);
  const stageIndex = isInternational
    ? getInternationalProfessionalStageIndex(st)
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

  const inputClass = adminInputClassName();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-soft">
        Step <span className="font-mono text-ink">{stageIndex}</span> —{" "}
        <span className="font-medium text-ink">{stageDef?.title ?? "Stage"}</span> (
        <span className="capitalize">{routeType}</span>). Empty fields remove your text and the site uses
        defaults.
      </p>
      <p className="text-xs text-muted-soft">
        Assigned agencies can edit the same step from <span className="font-mono text-[11px]">/agency</span>.
      </p>

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
            Card title
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
            Location line
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
            Time on card
          </label>
          <input
            id="quick-card-time"
            type="datetime-local"
            value={shownAtLocal}
            onChange={(e) => setShownAtLocal(e.target.value)}
            className={`mt-1 w-full ${inputClass}`}
          />
        </div>

        <div className="flex flex-col justify-end gap-2 sm:col-span-1">
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
            disabled={pending}
            className="inline-flex w-full justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            {pending ? "Saving…" : "Save tracking card"}
          </button>
        </div>
      </form>
    </div>
  );
}
