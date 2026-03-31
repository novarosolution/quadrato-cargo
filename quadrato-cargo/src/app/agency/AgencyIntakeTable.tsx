"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Fragment, useCallback, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import type { PublicTimelineOverrides } from "@/lib/api/public-client";
import type { AgencyHubIdentity } from "./agency-hub-types";
import { AgencyJobControls } from "./JobControls";

export type AgencyIntakeRow = {
  id: string;
  createdAt: string;
  updatedAt: string;
  consignmentNumber: string | null;
  routeType: string;
  status: string;
  publicTrackingNote: string | null;
  trackingNotes: string | null;
  agencyHandoverVerifiedAt: string | null;
  senderName: string;
  recipientName: string;
  senderAddress: string | null;
  recipientAddress: string | null;
  publicTimelineOverrides: PublicTimelineOverrides | null;
  publicTimelineStatusPath: string[] | null;
  courierId: string | null;
  payload: unknown;
};

type Props = {
  rows: AgencyIntakeRow[];
  agencyIdentity: AgencyHubIdentity;
};

export function AgencyIntakeTable({ rows, agencyIdentity }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  /** Increment only when "Accept & open" is used so the OTP field can be focused. */
  const [otpFocusSignal, setOtpFocusSignal] = useState(0);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  const openWithOtpFocus = useCallback((id: string) => {
    setOpenId(id);
    setOtpFocusSignal((n) => n + 1);
  }, []);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-strong">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-border-strong bg-surface-elevated/80">
          <tr>
            <th className="px-4 py-3 font-medium text-muted-soft">Created</th>
            <th className="px-4 py-3 font-medium text-muted-soft">Reference</th>
            <th className="px-4 py-3 font-medium text-muted-soft">Route</th>
            <th className="px-4 py-3 font-medium text-muted-soft">Shipment</th>
            <th className="px-4 py-3 font-medium text-muted-soft">Status</th>
            <th className="px-4 py-3 font-medium text-muted-soft">Customer update</th>
            <th className="px-4 py-3 font-medium text-muted-soft">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted">
                No agency-assigned bookings yet. Ask admin to set your agency in booking controls.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const st = normalizeBookingStatus(row.status);
              const note = row.publicTrackingNote || row.trackingNotes || "";
              const accepted = Boolean(row.agencyHandoverVerifiedAt);
              const isOpen = openId === row.id;
              const reference = row.consignmentNumber || row.id;

              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-border transition hover:bg-pill-hover/60">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-soft">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="max-w-[140px] px-4 py-3 font-mono text-xs text-ink">
                      <span className="break-all">{reference}</span>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink">{row.routeType}</td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-muted">
                      <p className="truncate">
                        <span className="text-muted-soft">From:</span> {row.senderName}
                      </p>
                      <p className="truncate">
                        <span className="text-muted-soft">To:</span> {row.recipientName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-pill px-2 py-0.5 text-xs font-medium text-teal">
                        {BOOKING_STATUS_LABELS[st]}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-muted">
                      <span className="line-clamp-2" title={note || undefined}>
                        {note || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        {!accepted ? (
                          <button
                            type="button"
                            onClick={() => openWithOtpFocus(row.id)}
                            className="inline-flex items-center justify-center rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                          >
                            Accept & open
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toggle(row.id)}
                          aria-expanded={isOpen}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal/40 hover:bg-pill-hover"
                        >
                          {isOpen ? (
                            <>
                              Close
                              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                            </>
                          ) : (
                            <>
                              Open
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-border-strong bg-canvas/20">
                      <td colSpan={7} className="px-4 py-5">
                        <div className="mx-auto max-w-3xl rounded-2xl border border-border-strong bg-surface-elevated/80 p-5 shadow-sm">
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border-strong pb-4">
                            <div>
                              <h3 className="font-display text-base font-semibold text-ink">
                                Update booking
                              </h3>
                              <p className="mt-1 text-xs text-muted-soft">
                                Accept handover with OTP if needed, then set status and the message
                                customers and couriers see on tracking.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOpenId(null)}
                              className="shrink-0 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-pill-hover"
                            >
                              Close panel
                            </button>
                          </div>
                          <AgencyJobControls
                            bookingId={row.id}
                            reference={reference}
                            routeType={row.routeType}
                            currentStatus={row.status}
                            updatedAtIso={row.updatedAt}
                            agencyHandoverVerifiedAt={row.agencyHandoverVerifiedAt}
                            publicTrackingNote={row.publicTrackingNote || row.trackingNotes}
                            senderAddress={row.senderAddress}
                            recipientAddress={row.recipientAddress}
                            publicTimelineOverrides={row.publicTimelineOverrides}
                            publicTimelineStatusPath={row.publicTimelineStatusPath}
                            courierId={row.courierId}
                            payload={row.payload}
                            otpFocusSignal={otpFocusSignal}
                            agencyIdentity={agencyIdentity}
                          />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
