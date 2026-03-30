"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  bookingId: string;
  /** Prefer consignment, then barcode, then Mongo id for the public track URL. */
  trackReference: string;
};

export function ManualTrackingQuickLinks({ bookingId, trackReference }: Props) {
  const [copied, setCopied] = useState(false);
  const ref = trackReference.trim() || bookingId;
  const trackHref = `/public/tsking?reference=${encodeURIComponent(ref)}`;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-border-strong bg-canvas/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          This booking
        </span>
        <code className="max-w-full break-all rounded-md bg-surface-highlight px-2 py-1 font-mono text-[11px] text-ink">
          {bookingId}
        </code>
        <button
          type="button"
          onClick={copyId}
          className="rounded-lg border border-border-strong bg-canvas/50 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
        >
          {copied ? "Copied" : "Copy ID"}
        </button>
        <Link
          href={trackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-teal/50 bg-teal-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-teal hover:bg-teal/20"
        >
          Open public tracking
        </Link>
      </div>
      <p className="text-xs leading-relaxed text-muted-soft">
        Public tracking follows{" "}
        <span className="font-medium text-muted">Site settings → Public tracking page</span>. When
        assigned agency is an email, customers see the{" "}
        <span className="font-medium text-muted">agency user&apos;s name</span> from{" "}
        <span className="font-mono text-[10px]">/admin/users</span>, not the raw address.
      </p>
    </div>
  );
}
