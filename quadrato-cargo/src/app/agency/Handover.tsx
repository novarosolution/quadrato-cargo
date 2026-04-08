"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminUi } from "@/components/admin/admin-ui";
import { verifyAgencyHandoverApi } from "@/lib/api/agency-client";
import { agencyHandoverFormCopy } from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";

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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className={agencyUi.formBlock}>
        <h3 className={agencyUi.formBlockTitle}>{agencyHandoverFormCopy.stepReferenceTitle}</h3>
        <p className={agencyUi.formBlockHint}>{agencyHandoverFormCopy.stepReferenceHint}</p>
        <div className={agencyUi.fieldStack}>
          <div>
            <label htmlFor="agency-reference" className={adminUi.labelBlock}>
              {agencyHandoverFormCopy.referenceLabel}
            </label>
            <input
              id="agency-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              className={`${adminUi.input} mt-2 font-mono text-sm`}
              placeholder={agencyHandoverFormCopy.referencePlaceholder}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className={agencyUi.formBlock}>
        <h3 className={agencyUi.formBlockTitle}>{agencyHandoverFormCopy.stepOtpTitle}</h3>
        <p className={agencyUi.formBlockHint}>{agencyHandoverFormCopy.otpHint}</p>
        <div className={agencyUi.fieldStack}>
          <div>
            <label htmlFor="agency-otp" className={adminUi.labelBlock}>
              {agencyHandoverFormCopy.otpLabel}
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
              className={`${adminUi.input} mt-2 font-mono text-lg tracking-[0.35em] sm:text-xl`}
              placeholder={agencyHandoverFormCopy.otpPlaceholder}
              autoComplete="one-time-code"
            />
          </div>
        </div>
      </div>

      <div className={agencyUi.actionsBar}>
        <button type="submit" disabled={pending} className={agencyUi.btnPrimary}>
          {pending ? agencyHandoverFormCopy.submitPending : agencyHandoverFormCopy.submit}
        </button>
      </div>

      {state?.ok ? (
        <div
          className="rounded-xl border border-teal/35 bg-linear-to-br from-teal/12 to-transparent p-4 shadow-sm ring-1 ring-teal/15 sm:p-5"
          role="status"
        >
          <p className="text-sm font-medium text-teal">{state.message}</p>
          {state.booking ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-1">
              <div className="rounded-lg border border-border-strong/50 bg-canvas/25 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
                  {agencyHandoverFormCopy.resultReference}
                </dt>
                <dd className="mt-0.5 font-mono text-ink">
                  {state.booking.consignmentNumber || state.booking.id}
                </dd>
              </div>
              <div className="rounded-lg border border-border-strong/50 bg-canvas/25 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
                  {agencyHandoverFormCopy.resultRoute} / {agencyHandoverFormCopy.resultStatus}
                </dt>
                <dd className="mt-0.5 capitalize text-ink">
                  {state.booking.routeType}
                  <span className="mx-2 text-muted-soft">·</span>
                  {state.booking.status}
                </dd>
              </div>
              <div className="rounded-lg border border-border-strong/50 bg-canvas/25 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
                  {agencyHandoverFormCopy.resultPartiesTitle}
                </dt>
                <dd className="mt-1 space-y-1 text-muted">
                  <p>
                    <span className="text-muted-soft">{agencyHandoverFormCopy.resultSender}</span>{" "}
                    <span className="text-ink">{readPartyName(state.booking.payload, "sender") || "—"}</span>
                  </p>
                  <p>
                    <span className="text-muted-soft">{agencyHandoverFormCopy.resultRecipient}</span>{" "}
                    <span className="text-ink">
                      {readPartyName(state.booking.payload, "recipient") || "—"}
                    </span>
                  </p>
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}
      {state?.ok === false ? (
        <p className={agencyUi.messageErr} role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
