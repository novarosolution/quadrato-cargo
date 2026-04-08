"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Package, Search, Truck } from "lucide-react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
  type BookingStatusId,
} from "@/lib/booking-status";
import {
  formatEddDisplay,
  resolveEstimatedDeliveryDate,
} from "@/lib/estimated-delivery";
import { publicClass, publicUi } from "@/components/public/public-ui";

export type ProfileBookingRowProps = {
  id: string;
  routeType: string;
  status: string;
  createdAt: string;
  consignmentNumber: string | null;
  estimatedDeliveryAt: string | null;
  customerTrackingNote: string | null;
  courierName?: string | null;
  courierEmail?: string | null;
};

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function isTerminalDelivered(st: BookingStatusId) {
  return st === "delivered";
}

function isCancelled(st: BookingStatusId) {
  return st === "cancelled";
}

type TabId = "active" | "completed" | "cancelled";

export function ProfileBookingsPanel({ rows }: { rows: ProfileBookingRowProps[] }) {
  const [tab, setTab] = useState<TabId>("active");
  const [query, setQuery] = useState("");

  const buckets = useMemo(() => {
    const active: ProfileBookingRowProps[] = [];
    const completed: ProfileBookingRowProps[] = [];
    const cancelled: ProfileBookingRowProps[] = [];
    for (const r of rows) {
      const st = normalizeBookingStatus(r.status);
      if (isCancelled(st)) cancelled.push(r);
      else if (isTerminalDelivered(st)) completed.push(r);
      else active.push(r);
    }
    return { active, completed, cancelled };
  }, [rows]);

  const counts = {
    active: buckets.active.length,
    completed: buckets.completed.length,
    cancelled: buckets.cancelled.length,
  };

  const list =
    tab === "active"
      ? buckets.active
      : tab === "completed"
        ? buckets.completed
        : buckets.cancelled;

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const hay = [
        b.id,
        b.consignmentNumber ?? "",
        b.routeType,
        b.status,
        b.customerTrackingNote ?? "",
        b.courierName ?? "",
        b.courierEmail ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [list, query]);

  const tabBtn = (id: TabId, label: string, count: number) => {
    const on = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className={publicClass(
          "min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition sm:px-4",
          on
            ? "border-teal/45 bg-teal/15 text-ink ring-1 ring-teal/25"
            : "border-border-strong bg-canvas/40 text-muted hover:border-teal/30 hover:bg-pill-hover hover:text-ink",
        )}
      >
        <span className="block truncate">{label}</span>
        <span className="mt-0.5 block text-xs font-medium tabular-nums text-muted-soft">
          {count}
        </span>
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        {tabBtn("active", "In progress", counts.active)}
        {tabBtn("completed", "Completed", counts.completed)}
        {tabBtn("cancelled", "Cancelled", counts.cancelled)}
      </div>

      <div className="relative mt-5">
        <label htmlFor="profile-bookings-search" className="sr-only">
          Search bookings
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft"
          strokeWidth={2}
          aria-hidden
        />
        <input
          id="profile-bookings-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID, consignment, route, or status…"
          className="w-full rounded-xl border border-border-strong bg-canvas/40 py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted-soft focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/20"
          autoComplete="off"
        />
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-canvas/25 px-5 py-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-soft" strokeWidth={1.25} aria-hidden />
          <p className="mt-3 text-sm font-medium text-ink">
            {tab === "active"
              ? "Nothing here yet"
              : tab === "completed"
                ? "No completed deliveries"
                : "No cancelled bookings"}
          </p>
          {tab === "active" ? (
            <Link
              href="/public/book"
              className={publicClass(publicUi.btnPrimary, "mt-5 inline-flex")}
            >
              Book courier
            </Link>
          ) : null}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border-strong bg-canvas/25 px-5 py-8 text-center">
          <p className="text-sm font-medium text-muted">
            No bookings match &ldquo;{query.trim()}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className={publicClass(publicUi.link, "mt-3 inline-block text-sm")}
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filteredList.map((b) => {
            const st = normalizeBookingStatus(b.status);
            const created = new Date(b.createdAt);
            const listEdd = resolveEstimatedDeliveryDate({
              routeType: b.routeType,
              createdAtIso: created.toISOString(),
              estimatedDeliveryAt: b.estimatedDeliveryAt,
            });
            const rt = b.routeType.toLowerCase();
            const routeLabel =
              rt === "international"
                ? "International"
                : rt === "domestic"
                  ? "Domestic"
                  : b.routeType;

            return (
              <li key={b.id}>
                <Link
                  href={`/public/profile/booksdetels/${b.id}`}
                  className={publicClass(publicUi.profileBookingRow, "items-start")}
                >
                  <span className={publicUi.profileIconWell}>
                    <Truck className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-semibold text-ink">
                        {routeLabel}
                      </span>
                      <span
                        className={publicClass(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                          isCancelled(st)
                            ? "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400"
                            : isTerminalDelivered(st)
                              ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
                              : "bg-teal/12 text-teal ring-teal/20",
                        )}
                      >
                        {BOOKING_STATUS_LABELS[st]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-soft">
                      {dateFmt.format(created)}
                      {b.consignmentNumber ? ` · ${b.consignmentNumber}` : ""}
                    </p>
                    {listEdd && !isCancelled(st) ? (
                      <p className="text-xs font-semibold text-teal">
                        EDD {formatEddDisplay(listEdd)}
                      </p>
                    ) : null}
                    {b.customerTrackingNote ? (
                      <p className="line-clamp-2 text-sm text-muted">{b.customerTrackingNote}</p>
                    ) : null}
                    {b.courierName || b.courierEmail ? (
                      <div className="text-xs">
                        <p className="text-muted-soft">
                          <span className="font-medium text-muted">Courier</span>
                          {b.courierName ? (
                            <span className="text-ink"> · {b.courierName}</span>
                          ) : null}
                          {!b.courierName && b.courierEmail ? (
                            <span className="text-ink"> · {b.courierEmail}</span>
                          ) : null}
                        </p>
                        {b.courierName && b.courierEmail ? (
                          <p className="truncate text-muted">{b.courierEmail}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <ChevronRight
                    className="mt-1 h-5 w-5 shrink-0 text-muted-soft group-hover:text-teal"
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
