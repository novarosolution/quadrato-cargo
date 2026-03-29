"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { verifyAgencyHandoverApi } from "@/lib/api/agency-client";

function readPartyName(payload: unknown, key: "sender" | "recipient") {
  const root = payload && typeof payload === "object" ? payload : {};
  const section = (root as Record<string, unknown>)[key];
  if (!section || typeof section !== "object") return "";
  const name = (section as Record<string, unknown>).name;
  return typeof name === "string" ? name : "";
}

export function AgencyHandoverForm() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<
    | undefined
    | {
        ok: true;
        message: string;
        booking?: {
          id: string;
          routeType: string;
          status: string;
          consignmentNumber: string | null;
          payload: unknown;
        };
      }
    | { ok: false; error: string }
  >(undefined);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const result = await verifyAgencyHandoverApi({ reference, otpCode });
    if (result.ok) {
      setState({
        ok: true,
        message: result.message,
        booking: result.booking
          ? {
              id: result.booking.id,
              routeType: result.booking.routeType,
              status: result.booking.status,
              consignmentNumber: result.booking.consignmentNumber,
              payload: result.booking.payload,
            }
          : undefined,
      });
      setOtpCode("");
      router.refresh();
    } else {
      setState({ ok: false, error: result.error });
    }
    setPending(false);
  }

  async function autoVerifyIfReady(nextOtp: string) {
    if (nextOtp.trim().length !== 6 || !reference.trim()) return;
    setPending(true);
    const result = await verifyAgencyHandoverApi({ reference, otpCode: nextOtp });
    if (result.ok) {
      setState({
        ok: true,
        message: result.message,
        booking: result.booking
          ? {
              id: result.booking.id,
              routeType: result.booking.routeType,
              status: result.booking.status,
              consignmentNumber: result.booking.consignmentNumber,
              payload: result.booking.payload,
            }
          : undefined,
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
      <div>
        <label
          htmlFor="agency-reference"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Reference (Tracking ID or booking ID)
        </label>
        <input
          id="agency-reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 font-mono text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="QC-2026-0001 or booking id"
        />
      </div>
      <div>
        <label
          htmlFor="agency-otp"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Agency handover OTP
        </label>
        <input
          id="agency-otp"
          value={otpCode}
          onChange={(e) => {
            const next = e.currentTarget.value.replace(/\D/g, "").slice(0, 6);
            setOtpCode(next);
            if (next.length === 6) {
              void autoVerifyIfReady(next);
            }
          }}
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 font-mono text-sm tracking-[0.2em] text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          placeholder="Enter OTP"
        />
        <p className="mt-1 text-[11px] text-muted-soft">
          OTP is booking-specific. Enter 6 digits to auto-verify.
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Verifying..." : "Verify handover & start agency job"}
      </button>
      {state?.ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <p className="text-emerald-400" role="status">
            {state.message}
          </p>
          {state.booking ? (
            <div className="mt-2 space-y-1 text-xs text-muted">
              <p>
                <span className="text-muted-soft">Reference:</span>{" "}
                <span className="font-mono text-ink">
                  {state.booking.consignmentNumber || state.booking.id}
                </span>
              </p>
              <p>
                <span className="text-muted-soft">Route:</span>{" "}
                <span className="capitalize text-ink">{state.booking.routeType}</span>
                <span className="mx-2 text-muted-soft">|</span>
                <span className="text-muted-soft">Status:</span>{" "}
                <span className="text-ink">{state.booking.status}</span>
              </p>
              <p>
                <span className="text-muted-soft">Sender:</span>{" "}
                <span className="text-ink">
                  {readPartyName(state.booking.payload, "sender") || "—"}
                </span>
                <span className="mx-2 text-muted-soft">|</span>
                <span className="text-muted-soft">Recipient:</span>{" "}
                <span className="text-ink">
                  {readPartyName(state.booking.payload, "recipient") || "—"}
                </span>
              </p>
            </div>
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
