import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchAdminUserDetail, type AdminBooking } from "@/lib/api/admin-server";
import { normalizeUserRole } from "@/lib/user-role";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteUserAdmin } from "../../dashboard/actions";
import { AdminUserEditForm } from "../editus";

type Props = { params: Promise<{ id: string }> };
type BookingListItem = {
  id: string;
  createdAt: Date;
  routeType: string;
  status: string;
  consignmentNumber: string | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `User ${id.slice(0, 8)}… — Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const res = await fetchAdminUserDetail(id);
  const user = res.user
    ? {
        ...res.user,
        createdAt: new Date(res.user.createdAt),
        updatedAt: new Date(res.user.updatedAt),
        bookings: (res.user.bookings || []).map((b: AdminBooking) => ({
          ...b,
          createdAt: new Date(b.createdAt),
        })),
        courierAssignments: (res.user.courierAssignments || []).map(
          (b: AdminBooking) => ({
            ...b,
            createdAt: new Date(b.createdAt),
          }),
        ),
      }
    : null;

  if (!user) notFound();

  const ur = normalizeUserRole(user.role);
  const courierOpenStatuses = new Set([
    "submitted",
    "confirmed",
    "serviceability_check",
    "serviceable",
    "pickup_scheduled",
    "out_for_pickup",
  ]);
  const courierOpenJobCount =
    ur === "courier"
      ? user.courierAssignments.filter((b: BookingListItem) =>
          courierOpenStatuses.has(normalizeBookingStatus(b.status)),
        ).length
      : 0;
  const courierReadyForJob =
    ur === "courier"
      ? user.isActive && user.isOnDuty && courierOpenJobCount === 0
      : false;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/admin/users" className="text-sm text-teal hover:underline">
        ← All users
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">
              {user.name ?? user.email}
            </h1>
            <span
              className={
                ur === "staff"
                  ? "rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-medium text-teal"
                  : ur === "courier"
                    ? "rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                    : ur === "agency"
                      ? "rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                    : "rounded-full bg-canvas px-2.5 py-0.5 text-xs text-muted"
              }
            >
              {ur === "staff"
                ? "Team"
                : ur === "courier"
                  ? "Courier"
                  : ur === "agency"
                    ? "Agency"
                    : "Customer"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-soft">{user.email}</p>
          <p className="mt-2 text-xs">
            <span
              className={
                user.isActive
                  ? "rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400"
                  : "rounded-full bg-rose-500/15 px-2 py-0.5 font-medium text-rose-400"
              }
            >
              {user.isActive ? "Active" : "Inactive"}
            </span>
            {ur === "courier" ? (
              <span
                className={
                  user.isOnDuty
                    ? "ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400"
                    : "ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400"
                }
              >
                {user.isOnDuty ? "On duty" : "Off duty"}
              </span>
            ) : null}
          </p>
          <dl className="mt-4 grid gap-2 text-xs text-muted-soft sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-soft">User ID</dt>
              <dd className="mt-0.5 font-mono text-[11px] text-muted">{user.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-soft">Joined</dt>
              <dd className="mt-0.5">{user.createdAt.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-soft">Last updated</dt>
              <dd className="mt-0.5">{user.updatedAt.toLocaleString()}</dd>
            </div>
            {ur === "courier" ? (
              <div>
                <dt className="font-medium text-muted-soft">Job readiness</dt>
                <dd className="mt-0.5">
                  {courierReadyForJob
                    ? "Ready for new assignment"
                    : user.isOnDuty
                      ? `Busy (${courierOpenJobCount} open job${courierOpenJobCount === 1 ? "" : "s"})`
                      : "Off duty"}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <DeleteRowButton
          label="Delete account"
          action={deleteUserAdmin.bind(null, user.id)}
          redirectAfter="/admin/users"
        />
      </div>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-lg font-semibold">Account &amp; sign-in</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Update name, email, or set a new password. Deleting this user unlinks
          their bookings (guest bookings) and removes the account.
        </p>
        <div className="mt-6 max-w-lg">
          <AdminUserEditForm
            userId={user.id}
            initialName={user.name}
            initialEmail={user.email}
            initialRole={ur}
            initialIsActive={user.isActive}
            initialIsOnDuty={user.isOnDuty}
          />
        </div>
      </section>

      {ur !== "courier" || user.bookings.length > 0 ? (
        <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
          <h2 className="font-display text-lg font-semibold">
            {ur === "courier"
              ? `Customer bookings (${user.bookings.length})`
              : `Bookings (${user.bookings.length})`}
          </h2>
          {ur === "courier" ? (
            <p className="mt-2 text-xs text-muted-soft">
              Rare: courier accounts are not usually linked as customers.
            </p>
          ) : null}
          {user.bookings.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No bookings linked.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {user.bookings.map((b: BookingListItem) => {
                const st = normalizeBookingStatus(b.status);
                return (
                  <li key={b.id}>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-canvas/30 px-4 py-3 text-sm transition hover:border-teal/30"
                    >
                      <span className="font-medium capitalize text-ink">
                        {b.routeType}
                      </span>
                      <span className="text-xs text-teal">
                        {BOOKING_STATUS_LABELS[st]}
                      </span>
                      <span className="w-full text-xs text-muted-soft sm:w-auto">
                        {b.createdAt.toLocaleString()}
                        {b.consignmentNumber
                          ? ` · ${b.consignmentNumber}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {ur === "courier" ? (
        <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
          <h2 className="font-display text-lg font-semibold">
            Assigned jobs ({user.courierAssignments.length})
          </h2>
          <p className="mt-1 text-xs text-muted-soft">
            Shipments assigned to this courier from{" "}
            <Link href="/admin/bookings" className="text-teal hover:underline">
              Bookings
            </Link>
            .
          </p>
          {user.courierAssignments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No jobs assigned yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {user.courierAssignments.map((b: BookingListItem) => {
                const st = normalizeBookingStatus(b.status);
                return (
                  <li key={b.id}>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-canvas/30 px-4 py-3 text-sm transition hover:border-teal/30"
                    >
                      <span className="font-medium capitalize text-ink">
                        {b.routeType}
                      </span>
                      <span className="text-xs text-teal">
                        {BOOKING_STATUS_LABELS[st]}
                      </span>
                      <span className="w-full text-xs text-muted-soft sm:w-auto">
                        {b.createdAt.toLocaleString()}
                        {b.consignmentNumber
                          ? ` · ${b.consignmentNumber}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
