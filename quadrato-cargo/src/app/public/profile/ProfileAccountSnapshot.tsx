"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { publicClass, publicUi } from "@/components/public/public-ui";

type CopyState = "idle" | "copied";

function CopyRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [state, setState] = useState<CopyState>("idle");

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }, [value]);

  return (
    <div className="rounded-xl border border-border-strong/70 bg-canvas/30 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          {label}
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-teal transition hover:bg-teal/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          aria-label={`Copy ${label}`}
        >
          {state === "copied" ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Copy
            </>
          )}
        </button>
      </div>
      <p
        className={publicClass(
          "mt-1.5 break-all text-sm font-medium text-ink",
          mono && "font-mono text-[13px] tracking-tight",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function ProfileAccountSnapshot({
  email,
  userId,
  memberSinceLabel,
}: {
  email: string;
  userId: string;
  memberSinceLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.06] p-4 ring-1 ring-teal/10">
        <span className={publicUi.profileIconWell}>
          <Mail className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-muted">
          Use your email and customer ID when you contact dispatch so we can find your account quickly.
        </p>
      </div>

      <div className="space-y-3">
        <CopyRow label="Email" value={email} />
        <CopyRow label="Customer ID" value={userId} mono />
        <div className="rounded-xl border border-border-strong/70 bg-canvas/30 px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
            Member since
          </p>
          <p className="mt-1.5 text-sm font-medium text-ink">{memberSinceLabel}</p>
        </div>
      </div>
    </div>
  );
}
