"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";
import { agencyIntakeTableCopy } from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";
import { formatTableDateTimeUtcParts } from "@/lib/format-date-time-ui";
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
  publicTimelineStepVisibility: PublicTimelineStepVisibility | null;
  publicTimelineStatusPath: string[] | null;
  /** International: fixed Track macro index 0–11; null = follow status. */
  internationalAgencyStage: number | null;
  courierId: string | null;
  courierName: string | null;
  payload: unknown;
};

type Props = {
  rows: AgencyIntakeRow[];
  agencyIdentity: AgencyHubIdentity;
  /** When the parent filters the list and nothing matches */
  emptyMessage?: string;
};

export function AgencyIntakeTable({ rows, agencyIdentity, emptyMessage }: Props) {
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
    <div className={`overflow-x-auto ${agencyUi.tableWrap}`}>
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className={`${agencyUi.tableHead}`}>
          <tr>
            <th className="px-4 py-3 font-medium text-muted-soft">
              {agencyIntakeTableCopy.columns.bookedUtc}
            </th>
            <th className="px-4 py-3 font-medium text-muted-soft">
              {agencyIntakeTableCopy.columns.reference}
            </th>
            <th className="px-4 py-3 font-medium text-muted-soft">
              {agencyIntakeTableCopy.columns.route}
            </th>
            <th className="px-4 py-3 font-medium text-muted-soft">
              {agencyIntakeTableCopy.columns.shipment}
            </th>
            <th className="px-4 py-3 font-medium text-muted-soft">
              {agencyIntakeTableCopy.columns.status}
            </th>
            <th className="px-4 py-3 font-medium text-muted-soft">
              {agencyIntakeTableCopy.columns.customerUpdate}
            </th>
            <th className="px-4 py-3 font-medium text-muted-soft">
              {agencyIntakeTableCopy.columns.actions}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted">
                {emptyMessage ?? agencyIntakeTableCopy.emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const st = normalizeBookingStatus(row.status);
              const note = row.publicTrackingNote || row.trackingNotes || "";
              const accepted = Boolean(row.agencyHandoverVerifiedAt);
              const isOpen = openId === row.id;
              const reference = row.consignmentNumber || row.id;
              const bookedParts = formatTableDateTimeUtcParts(row.createdAt);

              return (
                <Fragment key={row.id}>
                  <tr
                    className="cursor-pointer border-b border-border-strong/40 transition hover:bg-pill-hover/50"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    aria-label={`Booking ${reference}. ${isOpen ? "Expanded" : "Collapsed"}. Press Enter or click to toggle details.`}
                    onClick={(e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest("button")) return;
                      toggle(row.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      toggle(row.id);
                    }}
                  >
                    <td
                      className="whitespace-nowrap px-4 py-3 text-muted-soft"
                      title={row.createdAt}
                    >
                      {bookedParts ? (
                        <div className="flex flex-col gap-0.5 leading-tight">
                          <span className="text-ink">{bookedParts.date}</span>
                          <span className="text-xs text-muted-soft">{bookedParts.time}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[140px] px-4 py-3 font-mono text-xs text-ink">
                      <span className="break-all">{reference}</span>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink">{row.routeType}</td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-muted">
                      <p className="truncate">
                        <span className="text-muted-soft">{agencyIntakeTableCopy.fromPrefix}</span>{" "}
                        {row.senderName}
                      </p>
                      <p className="truncate">
                        <span className="text-muted-soft">{agencyIntakeTableCopy.toPrefix}</span>{" "}
                        {row.recipientName}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              openWithOtpFocus(row.id);
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                          >
                            {agencyIntakeTableCopy.acceptOpen}
                          </button>
                        ) : null}
                        <Link
                          href={`/agency/bookings/${row.id}`}
                          title={agencyIntakeTableCopy.openFullPageTitle}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal/40 hover:bg-pill-hover"
                        >
                          {agencyIntakeTableCopy.openFullPage}
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(row.id);
                          }}
                          aria-expanded={isOpen}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-border-strong bg-canvas/50 px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal/40 hover:bg-pill-hover"
                        >
                          {isOpen ? (
                            <>
                              {agencyIntakeTableCopy.close}
                              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                            </>
                          ) : (
                            <>
                              {agencyIntakeTableCopy.open}
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-border-strong/50 bg-canvas/25">
                      <td colSpan={7} className="px-4 py-5">
                        <div className={`mx-auto max-w-3xl ${agencyUi.formBlock} p-5`}>
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border-strong/50 pb-4">
                            <div>
                              <h3 className="font-display text-base font-semibold text-ink">
                                {agencyIntakeTableCopy.panelTitle}
                              </h3>
                              <p className="mt-1 text-xs text-muted-soft">
                                {agencyIntakeTableCopy.panelBlurb}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenId(null);
                              }}
                              className="shrink-0 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-pill-hover"
                            >
                              {agencyIntakeTableCopy.closePanel}
                            </button>
                          </div>
                          <AgencyJobControls
                            key={`${row.id}-${row.updatedAt}-${String(row.internationalAgencyStage ?? "")}`}
                            bookingId={row.id}
                            reference={reference}
                            routeType={row.routeType}
                            currentStatus={row.status}
                            updatedAtIso={row.updatedAt}
                            bookedAtIso={row.createdAt}
                            agencyHandoverVerifiedAt={row.agencyHandoverVerifiedAt}
                            publicTrackingNote={row.publicTrackingNote || row.trackingNotes}
                            senderAddress={row.senderAddress}
                            recipientAddress={row.recipientAddress}
                            publicTimelineOverrides={row.publicTimelineOverrides}
                            publicTimelineStepVisibility={row.publicTimelineStepVisibility}
                            publicTimelineStatusPath={row.publicTimelineStatusPath}
                            internationalAgencyStage={row.internationalAgencyStage}
                            courierId={row.courierId}
                            courierName={row.courierName}
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
