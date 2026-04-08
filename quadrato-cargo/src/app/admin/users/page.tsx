import type { Metadata } from "next";
import Link from "next/link";
import { AdminCollapsible } from "@/components/admin/AdminCollapsible";
import { AdminPageBody, AdminTableShell } from "@/components/admin/AdminPrimitives";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
import { AdminListFilters } from "@/components/admin/ListFilters";
import { AdminPagination } from "@/components/admin/Pager";
import { fetchAdminUsers } from "@/lib/api/admin-server";
import { adminUsersCopy } from "@/lib/admin-users-content";
import { normalizeUserRole } from "@/lib/user-role";
import { AdminCreateCourierForm } from "./createcuriyar";
import { AdminCreateAgencyForm } from "./createacagence";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
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

  const roleSuffix = roleFilter
    ? ` · ${
        roleFilter === "staff"
          ? "team"
          : roleFilter === "courier"
            ? "couriers"
            : roleFilter === "agency"
              ? "agencies"
              : "customers"
      }`
    : "";
  const metaLine = `${q ? `“${q}”` : "All"}${roleSuffix}${totalPages > 1 ? ` · p.${page}/${totalPages}` : ""}`;

  return (
    <AdminPageBody className="gap-8 max-sm:gap-6">
      <AdminPageHeader
        eyebrow={adminUsersCopy.listEyebrow}
        title={adminUsersCopy.listTitle}
        description={
          <span className="text-sm text-muted">
            {adminUsersCopy.listLead}{" "}
            <Link href="/admin/bookings" className="font-medium text-teal hover:underline">
              {adminUsersCopy.listLeadBookingsLabel}
            </Link>
            .
          </span>
        }
        actions={
          <div
            className={adminClass(
              adminUi.statTile,
              "flex min-w-26 flex-col justify-center py-3 text-center sm:min-w-30",
            )}
          >
            <span className="font-display text-2xl font-semibold tabular-nums text-ink">{total}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">accounts</span>
            <span className="mt-1 text-[10px] text-muted-soft">{metaLine}</span>
          </div>
        }
      />

      <AdminCollapsible
        id="admin-create-accounts"
        title={adminUsersCopy.createCollapsibleTitle}
        description={adminUsersCopy.createCollapsibleDesc}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCreateStaffForm />
          <AdminCreateCourierForm />
          <div className="lg:col-span-2">
            <AdminCreateAgencyForm />
          </div>
        </div>
      </AdminCollapsible>

      <AdminListFilters
        basePath="/admin/users"
        placeholder={adminUsersCopy.filterPlaceholder}
        defaultQuery={q}
      >
        <div className="min-w-[160px]">
          <label htmlFor="admin-users-role" className={adminUi.labelBlock}>
            Account type
          </label>
          <select
            id="admin-users-role"
            name="role"
            defaultValue={roleFilter ?? ""}
            className={adminUi.selectMt}
          >
            <option value="">All</option>
            <option value="customer">Customers</option>
            <option value="staff">Team</option>
            <option value="courier">Couriers</option>
            <option value="agency">Agencies</option>
          </select>
        </div>
      </AdminListFilters>

      <AdminTableShell>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className={adminUi.thead}>
            <tr>
              <th className={adminUi.th}>Joined</th>
              <th className={adminUi.th}>Type</th>
              <th className={adminUi.th}>Status</th>
              <th className={adminUi.th}>Name</th>
              <th className={adminUi.th}>Email</th>
              <th className={adminUi.th}>Jobs / bookings</th>
              <th className={adminUi.th}> </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  {q || roleFilter ? "No matches." : "No users yet."}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const role = normalizeUserRole(u.role);
                const courierOpenJobs = u.courierActiveJobCount ?? 0;
                return (
                  <tr key={u.id} className={adminUi.trHover}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-soft">
                      {u.createdAt.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
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
                    <td className="whitespace-nowrap px-4 py-3.5">
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
                    <td className="max-w-[160px] truncate px-4 py-3.5 font-medium text-ink">
                      {u.name ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3.5 text-muted">{u.email}</td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {role === "courier"
                        ? `${courierOpenJobs} open · ${
                            !u.isActive ? "Inactive" : !u.isOnDuty ? "Off duty" : "Available"
                          }`
                        : u.bookingCount ?? 0}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex rounded-lg border border-border-strong/80 bg-canvas/35 px-3 py-1.5 text-xs font-semibold text-teal transition hover:border-teal/35 hover:bg-teal/10"
                      >
                        {adminUsersCopy.tableViewEdit}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminPagination
        basePath="/admin/users"
        page={page}
        totalPages={totalPages}
        query={{
          q: q || undefined,
          role: roleFilter,
        }}
      />
    </AdminPageBody>
  );
}
