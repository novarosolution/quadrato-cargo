import { getApiBaseUrl } from "@/lib/api/base-url";
import { ADMIN_API_SECRET } from "@/lib/admin-api-secret";

export type AdminContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  message: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  isOnDuty: boolean;
  readyForJob?: boolean;
  courierActiveJobCount?: number;
  createdAt: string;
  updatedAt: string;
  bookingCount?: number;
  courierJobCount?: number;
  bookings?: AdminBooking[];
  courierAssignments?: AdminBooking[];
};

export type AdminBookingInvoice = {
  number?: string | null;
  currency?: string | null;
  subtotal?: string | null;
  tax?: string | null;
  insurance?: string | null;
  customsDuties?: string | null;
  discount?: string | null;
  total?: string | null;
  lineDescription?: string | null;
  notes?: string | null;
};

export type AdminBooking = {
  id: string;
  routeType: string;
  status: string;
  consignmentNumber: string | null;
  trackingNotes: string | null;
  publicTrackingNote?: string | null;
  customerTrackingNote?: string | null;
  internalNotes: string | null;
  assignedAgency?: string | null;
  payload: unknown;
  userId: string | null;
  courierId: string | null;
  createdAt: string;
  /** When false, customer invoice PDF is blocked until admin re-enables. Omitted/undefined treated as allowed (legacy rows). */
  invoicePdfReady?: boolean;
  invoice?: AdminBookingInvoice | null;
  publicBarcodeCode?: string | null;
  user?: AdminUser | null;
  courier?: AdminUser | null;
};

export type AdminOverviewSnapshot = {
  userCount: number;
  contactCount: number;
  bookingCount: number;
  activeBookingCount: number;
  bookingByStatus: Array<{ status: string; count: number }>;
  last24h: { users: number; contacts: number; bookings: number };
  last7d: { users: number; contacts: number; bookings: number };
  recentContacts: AdminContact[];
  recentBookings: AdminBooking[];
  recentUsers: Array<AdminUser & { bookingCount: number }>;
};

export type AdminSiteSettings = {
  announcementEnabled: boolean;
  announcementText: string;
  announcementCtaLabel: string;
  announcementCtaHref: string;
  pdfCompanyName: string;
  pdfCompanyAddress: string;
  pdfLogoText: string;
  pdfPrimaryColor: string;
  pdfAccentColor: string;
  pdfCardColor: string;
  pdfHeaderSubtitle: string;
  pdfSupportEmail: string;
  pdfSupportPhone: string;
  pdfWebsite: string;
  pdfWatermarkText: string;
  pdfFooterNote: string;
  trackShowStatusBadge: boolean;
  trackShowRouteAndDates: boolean;
  trackShowOperationalLog: boolean;
  trackShowAssignmentSection: boolean;
  trackShowShipmentCard: boolean;
  trackShowTimeline: boolean;
  trackShowPdfButton: boolean;
  trackShowInternationalHelp: boolean;
  trackShowOnHoldBanner: boolean;
};

export type AdminMonthlyReport = {
  months: number;
  monthly: Array<{ month: string; users: number; contacts: number; bookings: number }>;
  totals: { users: number; contacts: number; bookings: number };
  bookingStatusBreakdown: Array<{ status: string; count: number }>;
  routeBreakdown: Array<{ routeType: string; count: number }>;
  insights: string[];
};

async function adminFetch<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      cache: "no-store",
      headers: {
        "x-admin-secret": ADMIN_API_SECRET,
      },
    });
  } catch {
    throw new Error("Cannot connect to backend API. Ensure server is running on API base URL.");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `Admin API request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchAdminOverview() {
  return adminFetch<{ ok: boolean; snapshot: AdminOverviewSnapshot }>(
    "/api/admin/overview",
  );
}

export async function fetchAdminUsers(params: {
  q?: string;
  role?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  if (params.page) search.set("page", String(params.page));
  return adminFetch<{ ok: boolean; total: number; users: AdminUser[] }>(
    `/api/admin/users?${search.toString()}`,
  );
}

export async function fetchAdminUserDetail(id: string) {
  return adminFetch<{ ok: boolean; user: AdminUser }>(
    `/api/admin/users/${encodeURIComponent(id)}`,
  );
}

export async function fetchAdminBookings(params: {
  q?: string;
  status?: string;
  route?: string;
  account?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.route) search.set("route", params.route);
  if (params.account) search.set("account", params.account);
  if (params.page) search.set("page", String(params.page));
  return adminFetch<{ ok: boolean; total: number; bookings: AdminBooking[] }>(
    `/api/admin/bookings?${search.toString()}`,
  );
}

export async function fetchAdminBookingDetail(id: string) {
  return adminFetch<{ ok: boolean; booking: AdminBooking; couriers: AdminUser[] }>(
    `/api/admin/bookings/${encodeURIComponent(id)}`,
  );
}

export async function fetchAdminContacts(params: { q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  return adminFetch<{ ok: boolean; total: number; contacts: AdminContact[] }>(
    `/api/admin/contacts?${search.toString()}`,
  );
}

export async function fetchAdminContactDetail(id: string) {
  return adminFetch<{ ok: boolean; contact: AdminContact }>(
    `/api/admin/contacts/${encodeURIComponent(id)}`,
  );
}

export async function fetchAdminSiteSettings() {
  return adminFetch<{ ok: boolean; settings: AdminSiteSettings }>(
    "/api/admin/settings/site",
  );
}

export async function fetchAdminMonthlyReport(months = 6) {
  const search = new URLSearchParams();
  search.set("months", String(months));
  return adminFetch<{ ok: boolean; report: AdminMonthlyReport }>(
    `/api/admin/reports/monthly?${search.toString()}`,
  );
}
