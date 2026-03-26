"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateCourierDutyStatusApi } from "@/lib/api/courier-client";

type Props = {
  isActive: boolean;
  initialIsOnDuty: boolean;
  openJobCount: number;
};

export function CourierDutyToggle({
  isActive,
  initialIsOnDuty,
  openJobCount
}: Props) {
  const router = useRouter();
  const [isOnDuty, setIsOnDuty] = useState(initialIsOnDuty);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<
    | undefined
    | { ok: true; message: string }
    | { ok: false; error: string }
  >(undefined);

  const disabled = !isActive || pending;
  const dutyLabel = isOnDuty ? "On duty" : "Off duty";

  async function onToggle() {
    if (!isActive) return;
    const nextValue = !isOnDuty;
    setPending(true);
    const result = await updateCourierDutyStatusApi({ isOnDuty: nextValue });
    if (result.ok) {
      setIsOnDuty(nextValue);
      setState({ ok: true, message: result.message });
      router.refresh();
    } else {
      setState({ ok: false, error: result.error });
    }
    setPending(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={
            isOnDuty
              ? "rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400"
              : "rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400"
          }
        >
          {dutyLabel}
        </span>
        <span className="text-muted-soft">
          Open jobs: {openJobCount}
        </span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending
          ? "Updating..."
          : isOnDuty
            ? "Set Off Duty"
            : "Set On Duty"}
      </button>
      {!isActive ? (
        <p className="text-xs text-rose-400">
          Account is inactive. Ask admin to activate your account.
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-teal" role="status">
          {state.message}
        </p>
      ) : null}
      {state?.ok === false ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
