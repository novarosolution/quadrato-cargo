"use client";

import { useState } from "react";

type Props = {
  reference: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  parcelSummary: string;
};

export function DeliveryCompletePopup({
  reference,
  recipientName,
  recipientPhone,
  recipientAddress,
  parcelSummary
}: Props) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface-elevated p-5 shadow-2xl">
        <h3 className="font-display text-lg font-semibold text-ink">
          Delivery completed
        </h3>
        <p className="mt-1 text-sm text-muted">
          Courier job is completed and parcel delivered to receiver.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-muted-soft">Reference</dt>
            <dd className="font-mono text-ink">{reference}</dd>
          </div>
          <div>
            <dt className="text-muted-soft">Receiver</dt>
            <dd className="text-ink">{recipientName || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-soft">Receiver phone</dt>
            <dd className="text-ink">{recipientPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-soft">Delivery address</dt>
            <dd className="text-ink">{recipientAddress || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-soft">Parcel</dt>
            <dd className="text-ink">{parcelSummary || "—"}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  );
}
