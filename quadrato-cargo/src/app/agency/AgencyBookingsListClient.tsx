"use client";

import { useMemo, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
  type BookingStatusId,
} from "@/lib/booking-status";
import { agencyIntakeTableCopy } from "@/lib/agency-content";
import type { AgencyHubIdentity } from "./agency-hub-types";
import { AgencyIntakeTable, type AgencyIntakeRow } from "./AgencyIntakeTable";

type Props = {
  rows: AgencyIntakeRow[];
  agencyIdentity: AgencyHubIdentity;
};

export function AgencyBookingsListClient({ rows, agencyIdentity }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter) {
        const st = normalizeBookingStatus(row.status);
        if (st !== statusFilter) return false;
      }
      if (!q) return true;
      const ref = (row.consignmentNumber || row.id).toLowerCase();
      const note = (row.publicTrackingNote || row.trackingNotes || "").toLowerCase();
      return (
        ref.includes(q) ||
        row.senderName.toLowerCase().includes(q) ||
        row.recipientName.toLowerCase().includes(q) ||
        note.includes(q) ||
        row.routeType.toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(normalizeBookingStatus(r.status));
    return [...set].sort();
  }, [rows]);

  const emptyMessage =
    rows.length > 0 && filtered.length === 0
      ? agencyIntakeTableCopy.emptyFilterState
      : undefined;

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col gap-3 rounded-2xl border border-border-strong/45 bg-surface-elevated/25 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5`}
      >
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label
            htmlFor="agency-bookings-search"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            {agencyIntakeTableCopy.filterSearchLabel}
          </label>
          <input
            id="agency-bookings-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={agencyIntakeTableCopy.filterSearchPlaceholder}
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink placeholder:text-muted-soft focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div className="w-full sm:w-52">
          <label
            htmlFor="agency-bookings-status"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            {agencyIntakeTableCopy.filterStatusLabel}
          </label>
          <select
            id="agency-bookings-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          >
            <option value="">{agencyIntakeTableCopy.filterStatusAll}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABELS[s as BookingStatusId]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <AgencyIntakeTable
        rows={filtered}
        agencyIdentity={agencyIdentity}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
