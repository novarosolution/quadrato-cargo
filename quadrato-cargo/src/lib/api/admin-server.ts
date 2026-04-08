import { getApiBaseUrl } from "@/lib/api/base-url";
import { ADMIN_API_SECRET } from "@/lib/admin-api-secret";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";

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
  /** Agency hub profile (role agency only). */
  agencyAddress?: string | null;
  agencyPhone?: string | null;
  agencyCity?: string | null;
};

export type AdminBookingInvoiceLineItem = {
  description: string;
  amount?: string | null;
  /** Per-parcel weight on invoice line (optional). */
  weightKg?: string | null;
  /** L × W × H (optional). */
  sizeCm?: string | null;
  /** Per-parcel declared value text (optional). */
  declaredValue?: string | null;
};

export type AdminBookingInvoice = {
  number?: string | null;
  currency?: string | null;
  subtotal?: string | null;
  tax?: string | null;
  insurance?: string | null;
  insurancePremium?: string | null;
  customsDuties?: string | null;
  total?: string | null;
  lineDescription?: string | null;
  notes?: string | null;
  lineItems?: AdminBookingInvoiceLineItem[] | null;
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
  updatedAt?: string;
  /** Admin overrides; omitted when unset. */
  customerDisplayCreatedAt?: string | null;
  customerDisplayUpdatedAt?: string | null;
  /** Effective instants shown to customers (track, profile, PDF). */
  customerFacingCreatedAt?: string | null;
  customerFacingUpdatedAt?: string | null;
  /** Optional; shown as EDD on track & profile (domestic only when set). */
  estimatedDeliveryAt?: string | null;
  /** When false, customer invoice PDF is blocked until admin re-enables. Omitted/undefined treated as allowed (legacy rows). */
  invoicePdfReady?: boolean;
  invoice?: AdminBookingInvoice | null;
  publicBarcodeCode?: string | null;
  /** Optional per-stage text for the public professional timeline. */
  publicTimelineOverrides?: PublicTimelineOverrides | null;
  /** Steps hidden from public Track (`false` only stored). */
  publicTimelineStepVisibility?: PublicTimelineStepVisibility | null;
  /** Recorded status path for timeline history (optional). */
  publicTimelineStatusPath?: string[] | null;
  /** International: 0–11 Track macro step; null = auto from status. */
  internationalAgencyStage?: number | null;
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
  googleMapsEmbedSrc: string;
  pdfLogoText: string;
  pdfPrimaryColor: string;
  pdfAccentColor: string;
  pdfCardColor: string;
  pdfHeaderSubtitle: string;
  pdfSupportEmail: string;
  pdfSupportPhone: string;
  publicInfoEmail: string;
  pdfWebsite: string;
  pdfWatermarkText: string;
  pdfFooterNote: string;
  trackShowStatusBadge: boolean;
  trackShowRouteAndDates: boolean;
  trackShowOperationalLog: boolean;
  trackShowAssignmentSection: boolean;
  trackShowShipmentCard: boolean;
  trackShowTimeline: boolean;
  trackShowInternationalHelp: boolean;
  trackShowOnHoldBanner: boolean;
  /** Main sort hub label on domestic / origin linehaul timeline (e.g. Quadrato Cargo). */
  domesticMainHubCity: string;
};

export type AdminMonthlyReport = {
  months: number;
  monthly: Array<{ month: string; users: number; contacts: number; bookings: number }>;
  totals: { users: number; contacts: number; bookings: number };
  bookingStatusBreakdown: Array<{ status: string; count: number }>;
  routeBreakdown: Array<{ routeType: string; count: number }>;
  insights: string[];
};

/** Admin network overview: agencies + couriers with live booking mix. */
export type AdminNetworkAgency = AdminUser & {
  assignedBookingTotal: number;
  assignedByStatus: Record<string, number>;
};

export type AdminNetworkCourier = AdminUser & {
  courierJobTotal: number;
  courierOpenJobs: number;
  courierByStatus: Record<string, number>;
  readyForJob: boolean;
};

export type AdminNetworkResponse = {
  ok: boolean;
  agencies: AdminNetworkAgency[];
  couriers: AdminNetworkCourier[];
  allBookingStatusCounts: Array<{ status: string; count: number }>;
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
    throw new Error(
      "Cannot reach the API. Start the backend and confirm NEXT_PUBLIC_API_URL (or your configured base URL) matches where the server listens.",
    );
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    const fromApi = typeof body.message === "string" && body.message.trim() ? body.message.trim() : "";
    if (res.status === 401) {
      throw new Error(
        fromApi ||
          "Unauthorized — ADMIN_API_SECRET in the Next.js app (.env or .env.local) must match ADMIN_API_SECRET on the API server. Restart Next and the API after changing either value.",
      );
    }
    if (res.status === 403) {
      throw new Error(fromApi || "Forbidden — this admin key cannot perform that action.");
    }
    if (res.status === 404) {
      throw new Error(fromApi || "Not found — check the ID or refresh the page.");
    }
    if (res.status === 429) {
      throw new Error(fromApi || "Too many requests — wait a moment and try again.");
    }
    if (res.status >= 500) {
      throw new Error(
        fromApi || "Server error — check API logs or try again shortly.",
      );
    }
    throw new Error(fromApi || `Admin API request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

export async function fetchAdminOverview() {
  return adminFetch<{ ok: boolean; snapshot: AdminOverviewSnapshot }>(
    "/api/admin/overview",
  );
}

export async function fetchAdminNetwork() {
  return adminFetch<AdminNetworkResponse>("/api/admin/network");
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
  fromCity?: string;
  toCity?: string;
  courier?: string;
  agency?: string;
  pageSize?: number;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.route) search.set("route", params.route);
  if (params.account) search.set("account", params.account);
  if (params.fromCity) search.set("fromCity", params.fromCity);
  if (params.toCity) search.set("toCity", params.toCity);
  if (params.courier) search.set("courier", params.courier);
  if (params.agency) search.set("agency", params.agency);
  if (params.pageSize && (params.pageSize === 50 || params.pageSize === 100)) {
    search.set("pageSize", String(params.pageSize));
  }
  if (params.page) search.set("page", String(params.page));
  return adminFetch<{
    ok: boolean;
    total: number;
    page: number;
    pageSize: number;
    bookings: AdminBooking[];
  }>(`/api/admin/bookings?${search.toString()}`);
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
