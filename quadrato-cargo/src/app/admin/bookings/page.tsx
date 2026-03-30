import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  isBookingStatusId,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { AdminBookingStatusBadge } from "@/components/admin/AdminBookingStatusBadge";
import { AdminListFilters } from "@/components/admin/ListFilters";
import { AdminPagination } from "@/components/admin/Pager";
import { fetchAdminBookings } from "@/lib/api/admin-server";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteCourierBooking } from "../dashboard/actions";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { OpenBookingByReferenceForm } from "./OpenBookingByReferenceForm";

const PAGE_SIZE = 25;

export const metadata: Metadata = {
  title: "Bookings — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    route?: string;
    account?: string;
  }>;
};

const QUICK_PRESETS: Array<{
  label: string;
  params: Record<string, string>;
}> = [
  { label: "In transit", params: { status: "in_transit" } },
  { label: "Submitted", params: { status: "submitted" } },
  { label: "Out for pickup", params: { status: "out_for_pickup" } },
  { label: "Delivered", params: { status: "delivered" } },
  { label: "Guest only", params: { account: "guest" } },
  { label: "International", params: { route: "international" } },
];

function buildBookingsHref(params: Record<string, string>) {
  const sp = new URLSearchParams(params);
  const q = sp.toString();
  return q ? `/admin/bookings?${q}` : "/admin/bookings";
}

function isPresetActive(
  preset: (typeof QUICK_PRESETS)[number],
  current: {
    status?: string;
    route?: string;
    account?: string;
    q: string;
    page: number;
  },
) {
  if (current.q.trim() !== "" || current.page !== 1) return false;
  const entries = Object.entries(preset.params);
  if (entries.length !== 1) return false;
  const [key, val] = entries[0];
  if (key === "status") return val === current.status;
  if (key === "route") return val === current.route;
  if (key === "account") return val === current.account;
  return false;
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const statusRaw = sp.status?.trim() ?? "";
  const statusFilter =
    statusRaw && isBookingStatusId(statusRaw) ? statusRaw : undefined;
  const routeRaw = sp.route?.trim() ?? "";
  const routeFilter =
    routeRaw === "domestic" || routeRaw === "international"
      ? routeRaw
      : undefined;
  const accountRaw = sp.account?.trim() ?? "";
  const accountFilter =
    accountRaw === "guest" || accountRaw === "linked" ? accountRaw : undefined;

  const res = await fetchAdminBookings({
    q,
    status: statusFilter,
    route: routeFilter,
    account: accountFilter,
    page,
  });
  const total = res.total;
  const rows = (res.bookings || []).map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const subtitle = `${total} booking${total === 1 ? "" : "s"}${q || statusFilter || routeFilter || accountFilter ? " · filtered" : ""}${totalPages > 1 ? ` · page ${page} / ${totalPages}` : ""}`;

  const filterQuery = {
    q: q || undefined,
    status: statusFilter,
    route: routeFilter,
    account: accountFilter,
  };

  const currentForPresets = {
    status: statusFilter,
    route: routeFilter,
    account: accountFilter,
    q,
    page,
  };

  return (
    <div className="stack-page content-wide gap-8">
      <AdminPageHeader
        title="Bookings"
        description={
          <span className="text-muted">
            Search, filter, then <strong className="font-medium text-ink">Manage</strong> to edit pickup,
            tracking, contacts, and invoice on each shipment.
          </span>
        }
        actions={
          <p className="text-sm font-medium text-muted-soft" aria-live="polite">
            {subtitle}
          </p>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <section className="rounded-2xl border border-teal/25 bg-linear-to-br from-teal/6 to-transparent p-5 shadow-sm lg:col-span-2 dark:from-teal/10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal">
            <Search className="h-3.5 w-3.5" aria-hidden />
            Open by reference
          </div>
          <div className="mt-4">
            <OpenBookingByReferenceForm />
          </div>
        </section>
        <aside className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-5 text-sm text-muted">
          <p className="font-display text-sm font-semibold text-ink">On the booking page</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed">
            <li>Tracking, status, agency &amp; courier</li>
            <li>Customer timeline &amp; public notes</li>
            <li>Pickup address &amp; schedule</li>
            <li>Invoice PDF settings</li>
          </ul>
        </aside>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
          Quick filters
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((preset) => {
            const active = isPresetActive(preset, currentForPresets);
            return (
              <Link
                key={preset.label}
                href={buildBookingsHref(preset.params)}
                prefetch={false}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-teal/50 bg-teal/15 text-ink"
                    : "border-border-strong bg-canvas/40 text-muted hover:border-teal/35 hover:bg-pill-hover hover:text-ink"
                }`}
              >
                {preset.label}
              </Link>
            );
          })}
          <Link
            href="/admin/bookings"
            prefetch={false}
            className="inline-flex items-center rounded-full border border-dashed border-border-strong px-3 py-1.5 text-xs font-medium text-muted-soft hover:border-teal/30 hover:text-ink"
          >
            Clear filters
          </Link>
        </div>
      </div>

      <AdminListFilters
        basePath="/admin/bookings"
        placeholder="Booking ID, tracking ID, barcode, email, city…"
        defaultQuery={q}
      >
        <div className="min-w-[160px]">
          <label
            htmlFor="admin-booking-status"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Status
          </label>
          <select
            id="admin-booking-status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label
            htmlFor="admin-booking-route"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Route
          </label>
          <select
            id="admin-booking-route"
            name="route"
            defaultValue={routeFilter ?? ""}
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          >
            <option value="">All routes</option>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
        </div>
        <div className="min-w-[160px]">
          <label
            htmlFor="admin-booking-account"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Customer link
          </label>
          <select
            id="admin-booking-account"
            name="account"
            defaultValue={accountFilter ?? ""}
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          >
            <option value="">All bookings</option>
            <option value="linked">Linked to account</option>
            <option value="guest">Guest only</option>
          </select>
        </div>
      </AdminListFilters>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border-strong bg-surface-elevated/40 px-4 py-10 text-center text-sm text-muted">
            {q || statusFilter || routeFilter || accountFilter
              ? "No bookings match your filters."
              : "No bookings yet."}
          </div>
        ) : (
          rows.map((r) => {
            const p = r.payload as {
              sender?: { name?: string; country?: string };
              recipient?: { name?: string; country?: string };
            };
            const st = normalizeBookingStatus(r.status);
            const track =
              (r.consignmentNumber && String(r.consignmentNumber).trim()) ||
              (r.publicBarcodeCode && String(r.publicBarcodeCode).trim()) ||
              r.id.slice(0, 10) + "…";
            return (
              <article
                key={r.id}
                className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <AdminBookingStatusBadge status={st} />
                  <Link
                    href={`/admin/bookings/${r.id}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:opacity-90"
                  >
                    Manage
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
                <p className="mt-3 font-mono text-xs text-ink" title={track}>
                  {track}
                </p>
                <p className="mt-1 text-xs text-muted-soft tabular-nums">
                  {r.createdAt.toLocaleString()} ·{" "}
                  <span className="capitalize text-muted">{r.routeType}</span>
                </p>
                <dl className="mt-3 grid gap-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-soft">Customer</dt>
                    <dd className="max-w-[60%] truncate text-right text-ink">
                      {r.user ? (
                        <Link
                          href={`/admin/users/${r.user.id}`}
                          prefetch={false}
                          className="text-teal hover:underline"
                        >
                          {r.user.name ?? r.user.email}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-soft">Courier</dt>
                    <dd className="max-w-[60%] truncate text-right">
                      {r.courier ? (
                        <Link
                          href={`/admin/users/${r.courier.id}`}
                          prefetch={false}
                          className="text-teal hover:underline"
                        >
                          {r.courier.name ?? r.courier.email}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-soft">Sender</dt>
                    <dd className="max-w-[60%] truncate text-right text-muted">
                      {p.sender?.name ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-soft">Recipient</dt>
                    <dd className="max-w-[60%] truncate text-right text-muted">
                      {p.recipient?.name ?? "—"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end border-t border-border pt-3">
                  <DeleteRowButton
                    label="Delete"
                    action={deleteCourierBooking.bind(null, r.id)}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border-strong shadow-sm md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border-strong bg-surface-elevated/95 backdrop-blur-md">
            <tr>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Date
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Tracking
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Route
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Status
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Account
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Courier
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Sender
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Recipient
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted">
                  {q || statusFilter || routeFilter || accountFilter
                    ? "No bookings match your filters."
                    : "No bookings yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const p = r.payload as {
                  sender?: { name?: string; country?: string };
                  recipient?: { name?: string; country?: string };
                };
                const st = normalizeBookingStatus(r.status);
                const track =
                  (r.consignmentNumber && String(r.consignmentNumber).trim()) ||
                  (r.publicBarcodeCode && String(r.publicBarcodeCode).trim()) ||
                  r.id;
                return (
                  <tr
                    key={r.id}
                    className="transition hover:bg-pill-hover/80"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs tabular-nums text-muted-soft">
                      {r.createdAt.toLocaleString()}
                    </td>
                    <td className="max-w-[140px] px-4 py-3.5">
                      <span
                        className="block truncate font-mono text-xs text-ink"
                        title={track}
                      >
                        {track}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 capitalize text-ink">
                      {r.routeType}
                    </td>
                    <td className="max-w-[min(200px,22vw)] px-4 py-3.5">
                      <AdminBookingStatusBadge status={st} />
                    </td>
                    <td className="max-w-[130px] px-4 py-3.5 text-muted">
                      {r.user ? (
                        <Link
                          href={`/admin/users/${r.user.id}`}
                          prefetch={false}
                          className="block truncate text-teal hover:underline"
                          title={r.user.email}
                        >
                          {r.user.name ?? r.user.email}
                        </Link>
                      ) : (
                        <span className="text-muted-soft">—</span>
                      )}
                    </td>
                    <td className="max-w-[120px] px-4 py-3.5 text-muted">
                      {r.courier ? (
                        <Link
                          href={`/admin/users/${r.courier.id}`}
                          prefetch={false}
                          className="block truncate text-teal hover:underline"
                          title={r.courier.email}
                        >
                          {r.courier.name ?? r.courier.email}
                        </Link>
                      ) : (
                        <span className="text-muted-soft">—</span>
                      )}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3.5 text-muted">
                      {p.sender?.name ?? "—"}
                      {p.sender?.country ? ` (${p.sender.country})` : ""}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3.5 text-muted">
                      {p.recipient?.name ?? "—"}
                      {p.recipient?.country ? ` (${p.recipient.country})` : ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/bookings/${r.id}`}
                          prefetch={false}
                          className="inline-flex items-center gap-0.5 rounded-lg bg-teal/15 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/25"
                        >
                          Manage
                          <ChevronRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
                        </Link>
                        <DeleteRowButton
                          label="Delete"
                          action={deleteCourierBooking.bind(null, r.id)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/bookings"
        page={page}
        totalPages={totalPages}
        query={filterQuery}
      />
    </div>
  );
}
