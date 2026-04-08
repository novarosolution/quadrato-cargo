import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { fetchAdminUserDetail, type AdminBooking } from "@/lib/api/admin-server";
import { adminUsersCopy } from "@/lib/admin-users-content";
import { normalizeUserRole } from "@/lib/user-role";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { AdminPageBody, AdminPanel } from "@/components/admin/AdminPrimitives";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
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
  await params;
  return {
    title: "User — Admin",
    robots: { index: false, follow: false },
  };
}

function metaTile(label: string, value: ReactNode) {
  return (
    <div className="rounded-xl border border-border-strong/55 bg-canvas/25 px-3 py-2.5 dark:bg-canvas/15">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">{label}</p>
      <div className="mt-1 text-sm text-ink">{value}</div>
    </div>
  );
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
        courierAssignments: (res.user.courierAssignments || []).map((b: AdminBooking) => ({
          ...b,
          createdAt: new Date(b.createdAt),
        })),
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
    ur === "courier" ? user.isActive && user.isOnDuty && courierOpenJobCount === 0 : false;

  const roleBadgeClass =
    ur === "staff"
      ? "rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-medium text-teal"
      : ur === "courier"
        ? "rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
        : ur === "agency"
          ? "rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          : "rounded-full bg-canvas px-2.5 py-0.5 text-xs text-muted";

  const roleLabel =
    ur === "staff" ? "Team" : ur === "courier" ? "Courier" : ur === "agency" ? "Agency" : "Customer";

  const bookingLinkClass =
    "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong/60 bg-canvas/20 px-4 py-3 text-sm transition hover:border-teal/30 hover:bg-pill-hover/40";

  return (
    <AdminPageBody narrow className="gap-6 max-sm:gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/users"
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          {adminUsersCopy.detailBack}
        </Link>
        <DeleteRowButton
          label="Delete account"
          action={deleteUserAdmin.bind(null, user.id)}
          redirectAfter="/admin/users"
        />
      </div>

      <div className={adminClass(adminUi.panel, adminUi.panelPadding)}>
        <p className="section-eyebrow">{adminUsersCopy.detailEyebrow}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {user.name ?? user.email}
        </h1>
        <p className="mt-2 text-sm text-muted-soft">{user.email}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={roleBadgeClass}>{roleLabel}</span>
          <span
            className={
              user.isActive
                ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                : "rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400"
            }
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
          {ur === "courier" ? (
            <span
              className={
                user.isOnDuty
                  ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
              }
            >
              {user.isOnDuty ? "On duty" : "Off duty"}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metaTile("User ID", <span className="break-all font-mono text-[11px] text-muted">{user.id}</span>)}
          {metaTile("Joined", user.createdAt.toLocaleString())}
          {metaTile("Updated", user.updatedAt.toLocaleString())}
          {ur === "courier"
            ? metaTile(
                "Courier",
                courierReadyForJob
                  ? "Ready"
                  : user.isOnDuty
                    ? `Busy (${courierOpenJobCount} open)`
                    : "Off duty",
              )
            : metaTile("Bookings", String(user.bookings.length))}
        </div>
      </div>

      <AdminPanel>
        <h2 className={adminUi.sectionTitle}>{adminUsersCopy.detailSectionProfile}</h2>
        {!user.isActive ? (
          <p
            className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
            role="status"
          >
            {adminUsersCopy.detailInactiveBanner}
          </p>
        ) : null}
        <p className={`text-xs text-muted-soft ${user.isActive ? "mt-2" : "mt-3"}`}>
          {adminUsersCopy.detailProfileHint}
        </p>
        <div className="mt-6 max-w-lg">
          <AdminUserEditForm
            key={`${user.id}-${user.updatedAt.getTime()}`}
            userId={user.id}
            initialName={user.name}
            initialEmail={user.email}
            initialRole={ur}
            initialIsActive={user.isActive}
            initialIsOnDuty={user.isOnDuty}
            initialAgencyAddress={user.agencyAddress ?? ""}
            initialAgencyPhone={user.agencyPhone ?? ""}
            initialAgencyCity={user.agencyCity ?? ""}
          />
        </div>
      </AdminPanel>

      {ur !== "courier" || user.bookings.length > 0 ? (
        <AdminPanel variant="muted">
          <h2 className={adminUi.sectionTitle}>
            {adminUsersCopy.detailBookingsAsCustomer} ({user.bookings.length})
          </h2>
          {ur === "courier" ? (
            <p className="mt-1 text-xs text-muted-soft">{adminUsersCopy.detailBookingsCourierNote}</p>
          ) : null}
          {user.bookings.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{adminUsersCopy.detailNoBookings}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {user.bookings.map((b: BookingListItem) => {
                const st = normalizeBookingStatus(b.status);
                return (
                  <li key={b.id}>
                    <Link href={`/admin/bookings/${b.id}`} prefetch={false} className={bookingLinkClass}>
                      <span className="font-medium capitalize text-ink">{b.routeType}</span>
                      <span className="text-xs text-teal">{BOOKING_STATUS_LABELS[st]}</span>
                      <span className="w-full text-xs text-muted-soft sm:w-auto">
                        {b.createdAt.toLocaleString()}
                        {b.consignmentNumber ? ` · ${b.consignmentNumber}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminPanel>
      ) : null}

      {ur === "courier" ? (
        <AdminPanel variant="muted">
          <h2 className={adminUi.sectionTitle}>
            {adminUsersCopy.detailAssignedJobs} ({user.courierAssignments.length})
          </h2>
          <p className="mt-1 text-xs text-muted-soft">
            {adminUsersCopy.detailAssignedHint}{" "}
            <Link href="/admin/bookings" className="font-medium text-teal hover:underline">
              {adminUsersCopy.detailAssignedBookingsLabel}
            </Link>
            .
          </p>
          {user.courierAssignments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{adminUsersCopy.detailNoJobs}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {user.courierAssignments.map((b: BookingListItem) => {
                const st = normalizeBookingStatus(b.status);
                return (
                  <li key={b.id}>
                    <Link href={`/admin/bookings/${b.id}`} prefetch={false} className={bookingLinkClass}>
                      <span className="font-medium capitalize text-ink">{b.routeType}</span>
                      <span className="text-xs text-teal">{BOOKING_STATUS_LABELS[st]}</span>
                      <span className="w-full text-xs text-muted-soft sm:w-auto">
                        {b.createdAt.toLocaleString()}
                        {b.consignmentNumber ? ` · ${b.consignmentNumber}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminPanel>
      ) : null}
    </AdminPageBody>
  );
}
