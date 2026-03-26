import Link from "next/link";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ClipboardList,
  Mail,
  Package,
  Sparkles,
  Users,
} from "lucide-react";

export type DashboardSnapshot = {
  userCount: number;
  contactCount: number;
  bookingCount: number;
  activeBookingCount: number;
  bookingByStatus: { status: string; count: number }[];
  last24h: { contacts: number; bookings: number; users: number };
  last7d: { contacts: number; bookings: number; users: number };
  recentContacts: {
    id: string;
    name: string;
    email: string;
    service: string;
    createdAt: Date;
  }[];
  recentBookings: {
    id: string;
    routeType: string;
    createdAt: Date;
    status: string;
  }[];
  recentUsers: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    bookingCount: number;
  }[];
};

function StatCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  href: string;
  label: string;
  value: number;
  hint?: string;
  icon: typeof Users;
  accent: "ink" | "teal" | "accent";
}) {
  const valueClass =
    accent === "teal"
      ? "text-teal"
      : accent === "accent"
        ? "text-accent"
        : "text-ink";
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border-strong bg-surface-elevated/60 p-6 transition hover:border-teal/35 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${valueClass}`}>
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-soft">{hint}</p>
          ) : null}
        </div>
        <span className="rounded-xl border border-border bg-canvas/40 p-2.5 text-muted transition group-hover:border-teal/25 group-hover:text-teal">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-teal opacity-0 transition group-hover:opacity-100">
        Open <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    </Link>
  );
}

export function AdminDashboardView(data: DashboardSnapshot) {
  const {
    userCount,
    contactCount,
    bookingCount,
    activeBookingCount,
    bookingByStatus,
    last24h,
    last7d,
    recentContacts,
    recentBookings,
    recentUsers,
  } = data;

  const statusStats = [...bookingByStatus].sort((left, right) => right.count - left.count);
  const maxStatusCount = Math.max(1, ...statusStats.map((stat) => stat.count));
  const isEmptyDb =
    userCount === 0 && contactCount === 0 && bookingCount === 0;

  return (
    <div className="space-y-10">
      {isEmptyDb ? (
        <div className="rounded-2xl border border-teal/35 bg-teal/10 p-5 text-sm text-muted">
          <p className="font-medium text-ink">No data in MongoDB yet</p>
          <p className="mt-2">
            If all metrics are zero, backend is connected but database has no
            records yet.
          </p>
          <ol className="mt-3 list-inside list-decimal space-y-1.5 text-left">
            <li>
              <code className="rounded bg-pill px-1.5 py-0.5 text-xs text-ink">
                Start backend: cd /Users/kuldip/2\ day/server && npm run dev
              </code>
            </li>
            <li>
              <code className="rounded bg-pill px-1.5 py-0.5 text-xs text-ink">
                Create some records from website forms (bookings/public/contact/public/register)
              </code>
            </li>
          </ol>
          <p className="mt-3 text-xs text-muted-soft">
            Refresh this page after creating new records to see live analytics.
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 border-b border-border-strong pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas/40 px-3 py-1 text-xs font-medium text-muted-soft">
            <Sparkles className="h-3.5 w-3.5 text-teal" strokeWidth={2} />
            Live overview
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            Admin dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Monitor customers, enquiries, and courier bookings. Open any card to
            view or edit records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-canvas/50 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-teal/40 hover:bg-pill-hover"
          >
            <ClipboardList className="h-4 w-4 text-teal" strokeWidth={2} />
            Data &amp; exports
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/admin/users"
          label="Customer accounts"
          value={userCount}
          hint="Registered users"
          icon={Users}
          accent="ink"
        />
        <StatCard
          href="/admin/contacts"
          label="Contact messages"
          value={contactCount}
          hint="Enquiries"
          icon={Mail}
          accent="teal"
        />
        <StatCard
          href="/admin/bookings"
          label="Courier bookings"
          value={bookingCount}
          hint="All time"
          icon={Package}
          accent="accent"
        />
        <StatCard
          href="/admin/bookings"
          label="Active pipeline"
          value={activeBookingCount}
          hint="Not delivered or cancelled"
          icon={BarChart3}
          accent="teal"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">
            Bookings by status
          </h2>
          <p className="mt-1 text-xs text-muted-soft">
            Distribution across all booking statuses.
          </p>
          <ul className="mt-6 space-y-4">
            {statusStats.length === 0 ? (
              <li className="text-sm text-muted">No bookings yet.</li>
            ) : (
              statusStats.map((statusStat) => {
                const statusKey = normalizeBookingStatus(statusStat.status);
                const fillPct = Math.round((statusStat.count / maxStatusCount) * 100);
                return (
                  <li key={statusStat.status}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-ink">
                        {BOOKING_STATUS_LABELS[statusKey]}
                      </span>
                      <span className="tabular-nums text-muted">{statusStat.count}</span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-canvas/80"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-linear-to-r from-teal/80 to-accent/70 transition-all"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
          <h2 className="font-display text-lg font-semibold">Activity</h2>
          <p className="mt-1 text-xs text-muted-soft">
            New records in the last 24 hours vs last 7 days.
          </p>
          <div className="mt-6 space-y-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-soft">
                <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                Last 24 hours
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Users</dt>
                  <dd className="font-medium tabular-nums text-ink">
                    {last24h.users}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Contacts</dt>
                  <dd className="font-medium tabular-nums text-teal">
                    {last24h.contacts}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Bookings</dt>
                  <dd className="font-medium tabular-nums text-accent">
                    {last24h.bookings}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="border-t border-border pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
                Last 7 days
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Users</dt>
                  <dd className="tabular-nums text-ink">{last7d.users}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Contacts</dt>
                  <dd className="tabular-nums text-teal">{last7d.contacts}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Bookings</dt>
                  <dd className="tabular-nums text-accent">{last7d.bookings}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold">Recent contacts</h2>
            <Link href="/admin/contacts" className="text-sm text-teal hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentContacts.length === 0 ? (
              <li className="text-sm text-muted">No messages yet.</li>
            ) : (
              recentContacts.map((contact) => (
                <li key={contact.id}>
                  <Link
                    href={`/admin/contacts/${contact.id}`}
                    className="block rounded-lg border border-border bg-canvas/30 px-3 py-2 text-sm transition hover:border-ghost-border"
                  >
                    <span className="font-medium text-ink">{contact.name}</span>
                    <span className="text-muted"> · {contact.service}</span>
                    <span className="mt-0.5 block text-xs text-muted-soft">
                      {contact.createdAt.toLocaleString()} · {contact.email}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-teal hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentBookings.length === 0 ? (
              <li className="text-sm text-muted">No bookings yet.</li>
            ) : (
              recentBookings.map((booking) => {
                const statusKey = normalizeBookingStatus(booking.status);
                return (
                  <li key={booking.id}>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="block rounded-lg border border-border bg-canvas/30 px-3 py-2 text-sm transition hover:border-ghost-border"
                    >
                      <span className="font-medium capitalize text-ink">
                        {booking.routeType}
                      </span>
                      <span className="ml-2 text-xs text-teal">
                        {BOOKING_STATUS_LABELS[statusKey]}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-soft">
                        {booking.createdAt.toLocaleString()}
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold">Recent users</h2>
            <Link href="/admin/users" className="text-sm text-teal hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentUsers.length === 0 ? (
              <li className="text-sm text-muted">No accounts yet.</li>
            ) : (
              recentUsers.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="block rounded-lg border border-border bg-canvas/30 px-3 py-2 text-sm transition hover:border-ghost-border"
                  >
                    <span className="font-medium text-ink">
                      {user.name ?? user.email}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-soft">
                      {user.createdAt.toLocaleString()} · {user.bookingCount} booking
                      {user.bookingCount === 1 ? "" : "s"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {user.email}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
