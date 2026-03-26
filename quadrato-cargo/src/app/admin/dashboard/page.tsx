import type { Metadata } from "next";
import {
  fetchAdminOverview,
  type AdminBooking,
  type AdminContact,
  type AdminUser,
} from "@/lib/api/admin-server";
import { AdminDatabaseError } from "./DbError";
import {
  AdminDashboardView,
  type DashboardSnapshot,
} from "./Dashboard";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Fresh counts and activity on every visit. */
export const dynamic = "force-dynamic";

async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const res = await fetchAdminOverview();
  const s = res.snapshot;
  return {
    ...s,
    recentContacts: (s.recentContacts || []).map((x: AdminContact) => ({
      ...x,
      createdAt: new Date(x.createdAt),
    })),
    recentBookings: (s.recentBookings || []).map((x: AdminBooking) => ({
      ...x,
      createdAt: new Date(x.createdAt),
    })),
    recentUsers: (s.recentUsers || []).map((x: AdminUser & { bookingCount: number }) => ({
      ...x,
      createdAt: new Date(x.createdAt),
    })),
  } satisfies DashboardSnapshot;
}

export default async function AdminDashboardPage() {
  let data: DashboardSnapshot;
  try {
    data = await loadDashboardSnapshot();
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "Unknown error";
    return <AdminDatabaseError message={message} />;
  }
  return <AdminDashboardView {...data} />;
}
