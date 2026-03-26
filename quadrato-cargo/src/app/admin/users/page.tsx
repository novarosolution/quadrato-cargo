import type { Metadata } from "next";
import Link from "next/link";
import { AdminListFilters } from "@/components/admin/ListFilters";
import { AdminPagination } from "@/components/admin/Pager";
import { fetchAdminUsers } from "@/lib/api/admin-server";
import { normalizeUserRole } from "@/lib/user-role";
import { AdminCreateCourierForm } from "./createcuriyar";
import { AdminCreateAgencyForm } from "./createacagence";
import { AdminCreateStaffForm } from "./createstaf";

const PAGE_SIZE = 25;

export const metadata: Metadata = {
  title: "Users — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const roleRaw = sp.role?.trim() ?? "";
  const roleFilter =
    roleRaw === "customer" ||
    roleRaw === "staff" ||
    roleRaw === "courier" ||
    roleRaw === "agency"
      ? roleRaw
      : undefined;

  const res = await fetchAdminUsers({
    q,
    role: roleFilter,
    page,
  });
  const total = res.total;
  const users = (res.users || []).map((u) => ({
    ...u,
    createdAt: new Date(u.createdAt),
    updatedAt: new Date(u.updatedAt),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Users &amp; team
        </h1>
        <p className="mt-2 text-sm text-muted">
          {total} account{total === 1 ? "" : "s"}
          {q ? ` matching “${q}”` : ""}
          {roleFilter
            ? ` · ${
                roleFilter === "staff"
                  ? "team"
                  : roleFilter === "courier"
                    ? "couriers"
                    : roleFilter === "agency"
                      ? "agencies"
                    : "customers"
              }`
            : ""}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-soft">
          Customers register on the public site. Here you add team logins, set{" "}
          <strong className="font-medium text-muted">Customer</strong>,{" "}
          <strong className="font-medium text-muted">Team</strong>, or{" "}
          <strong className="font-medium text-muted">Courier / Agency</strong> on a user’s
          profile, and attach bookings to a customer from{" "}
          <Link href="/admin/bookings" className="text-teal hover:underline">
            Bookings
          </Link>{" "}
          → open a shipment → link by email and update status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCreateStaffForm />
        <AdminCreateCourierForm />
        <AdminCreateAgencyForm />
      </div>

      <AdminListFilters
        basePath="/admin/users"
        placeholder="Name or email…"
        defaultQuery={q}
      >
        <div className="min-w-[160px]">
          <label
            htmlFor="admin-users-role"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Account type
          </label>
          <select
            id="admin-users-role"
            name="role"
            defaultValue={roleFilter ?? ""}
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          >
            <option value="">All</option>
            <option value="customer">Customers</option>
            <option value="staff">Team</option>
            <option value="courier">Couriers</option>
            <option value="agency">Agencies</option>
          </select>
        </div>
      </AdminListFilters>

      <div className="overflow-x-auto rounded-2xl border border-border-strong">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border-strong bg-surface-elevated/80">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-soft">Joined</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Type</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Availability</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Name</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Email</th>
              <th className="px-4 py-3 font-medium text-muted-soft">
                Bookings / jobs
              </th>
              <th className="px-4 py-3 font-medium text-muted-soft">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  {q || roleFilter
                    ? "No users match your filters."
                    : "No users yet."}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const role = normalizeUserRole(u.role);
                const courierOpenJobs = u.courierActiveJobCount ?? 0;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border transition hover:bg-pill-hover"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-soft">
                      {u.createdAt.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={
                          role === "staff"
                            ? "rounded-full bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal"
                            : role === "courier"
                              ? "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                              : role === "agency"
                                ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              : "rounded-full bg-canvas px-2 py-0.5 text-xs text-muted"
                        }
                      >
                        {role === "staff"
                          ? "Team"
                          : role === "courier"
                            ? "Courier"
                            : role === "agency"
                              ? "Agency"
                            : "Customer"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            u.isActive
                              ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              : "rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400"
                          }
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                        {role === "courier" ? (
                          <span
                            className={
                              u.isOnDuty
                                ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                                : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                            }
                          >
                            {u.isOnDuty ? "On duty" : "Off duty"}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-ink">
                      {u.name ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {role === "courier"
                        ? `${courierOpenJobs} open · ${
                            u.readyForJob
                              ? "Ready"
                              : u.isOnDuty
                                ? "Busy"
                                : "Off duty"
                          }`
                        : u.bookingCount ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-teal hover:underline"
                        >
                          View / edit
                        </Link>
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
        basePath="/admin/users"
        page={page}
        totalPages={totalPages}
        query={{
          q: q || undefined,
          role: roleFilter,
        }}
      />
    </div>
  );
}
