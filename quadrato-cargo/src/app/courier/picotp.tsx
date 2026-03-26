"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { verifyCourierPickupOtpApi } from "@/lib/api/courier-client";

export function CourierPickupOtpForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [otpCode, setOtpCode] = useState("");
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<
    | undefined
    | {
        ok: true;
        message: string;
        agencyHandoverOtp?: string | null;
        agencyHandoverOtpExpiresAt?: string | null;
      }
    | { ok: false; error: string }
  >(undefined);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const result = await verifyCourierPickupOtpApi({
      bookingId,
      otpCode,
    });
    if (result.ok) {
      setState({
        ok: true,
        message: result.message,
        agencyHandoverOtp: result.agencyHandoverOtp ?? null,
        agencyHandoverOtpExpiresAt: result.agencyHandoverOtpExpiresAt ?? null,
      });
      setOtpCode("");
      router.refresh();
    } else {
      setState({ ok: false, error: result.error });
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label
        htmlFor="courier-pickup-otp"
        className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
      >
        Verify pickup OTP from customer
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="courier-pickup-otp"
          name="otpCode"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          placeholder="Enter 6-digit OTP"
          className="w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 font-mono text-sm tracking-[0.2em] text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
      {state?.ok ? (
        <div className="space-y-1">
          <p className="text-sm text-teal" role="status">
            {state.message}
          </p>
          {state.agencyHandoverOtp ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Agency handover OTP:{" "}
              <span className="font-mono text-sm tracking-wider">
                {state.agencyHandoverOtp}
              </span>
              {state.agencyHandoverOtpExpiresAt
                ? ` (expires ${new Date(state.agencyHandoverOtpExpiresAt).toLocaleString()})`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}
      {state?.ok === false ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
