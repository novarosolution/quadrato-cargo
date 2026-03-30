import type { Metadata } from "next";
import Link from "next/link";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  isBookingStatusId,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { AdminListFilters } from "@/components/admin/ListFilters";
import { AdminPagination } from "@/components/admin/Pager";
import { fetchAdminBookings } from "@/lib/api/admin-server";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteCourierBooking } from "../dashboard/actions";
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
    /** guest = no linked user; linked = has customer account */
    account?: string;
  }>;
};

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Courier bookings
        </h1>
        <p className="mt-2 text-sm text-muted">
          {total} booking{total === 1 ? "" : "s"}
          {q || statusFilter || routeFilter || accountFilter
            ? " (filtered)"
            : ""}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </p>
      </div>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-4 sm:p-5">
        <OpenBookingByReferenceForm />
      </section>

      <AdminListFilters
        basePath="/admin/bookings"
        placeholder="ID, Tracking ID, route, customer email…"
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

      <div className="overflow-x-auto rounded-2xl border border-border-strong">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border-strong bg-surface-elevated/80">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-soft">Date</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Route</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Status</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Account</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Courier</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Sender</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Recipient</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
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
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border transition hover:bg-pill-hover"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-soft">
                      {r.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 capitalize text-ink">
                      {r.routeType}
                    </td>
                    <td className="max-w-[120px] px-4 py-3 text-xs font-medium text-teal">
                      {BOOKING_STATUS_LABELS[st]}
                    </td>
                    <td className="max-w-[140px] px-4 py-3 text-muted">
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
                    <td className="max-w-[120px] px-4 py-3 text-muted">
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
                    <td className="max-w-[120px] truncate px-4 py-3 text-muted">
                      {p.sender?.name ?? "—"}
                      {p.sender?.country ? ` (${p.sender.country})` : ""}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 text-muted">
                      {p.recipient?.name ?? "—"}
                      {p.recipient?.country ? ` (${p.recipient.country})` : ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/bookings/${r.id}`}
                          prefetch={false}
                          className="text-teal hover:underline"
                        >
                          Open / edit
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
        query={{
          q: q || undefined,
          status: statusFilter,
          route: routeFilter,
          account: accountFilter,
        }}
      />
    </div>
  );
}
