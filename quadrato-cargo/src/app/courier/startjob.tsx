"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startCourierJobApi } from "@/lib/api/courier-client";

type Props = {
  bookingId: string;
};

export function CourierStartJobButton({ bookingId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<
    | undefined
    | { ok: true; message: string }
    | { ok: false; error: string }
  >(undefined);

  async function onStart() {
    setPending(true);
    const result = await startCourierJobApi({ bookingId });
    if (result.ok) {
      setState({ ok: true, message: result.message });
      router.refresh();
    } else {
      setState({ ok: false, error: result.error });
    }
    setPending(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onStart}
        disabled={pending}
        className="rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Starting..." : "Start job"}
      </button>
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
