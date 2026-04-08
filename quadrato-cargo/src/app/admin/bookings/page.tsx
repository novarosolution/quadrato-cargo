import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  isBookingStatusId,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { AdminBookingStatusBadge } from "@/components/admin/AdminBookingStatusBadge";
import {
  AdminEmptyState,
  AdminPageBody,
  AdminPanel,
  AdminStepHeader,
  AdminTableShell,
} from "@/components/admin/AdminPrimitives";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
import { AdminListFilters } from "@/components/admin/ListFilters";
import { AdminPagination } from "@/components/admin/Pager";
import {
  fetchAdminBookings,
  fetchAdminNetwork,
  type AdminNetworkCourier,
} from "@/lib/api/admin-server";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteCourierBooking } from "../dashboard/actions";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { OpenBookingByReferenceForm } from "./OpenBookingByReferenceForm";

const DEFAULT_PAGE_SIZE = 25;

function partyCity(payload: unknown, party: "sender" | "recipient"): string {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const sec = root[party];
  if (!sec || typeof sec !== "object") return "—";
  const city = String((sec as Record<string, unknown>).city ?? "").trim();
  return city || "—";
}

function partyName(payload: unknown, party: "sender" | "recipient"): string {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const sec = root[party];
  if (!sec || typeof sec !== "object") return "";
  return String((sec as Record<string, unknown>).name ?? "").trim();
}

export const metadata: Metadata = {
  title: "Bookings — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    status?: string;
    route?: string;
    account?: string;
    fromCity?: string;
    toCity?: string;
    courier?: string;
    agency?: string;
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

/** Accept assigned / unassigned / 24-hex courier user id; ignore junk. */
function normalizeAdminBookingsCourierParam(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (t === "assigned" || t === "unassigned") return t;
  if (/^[a-f0-9]{24}$/i.test(t)) return t;
  return undefined;
}

function isPresetActive(
  preset: (typeof QUICK_PRESETS)[number],
  current: {
    status?: string;
    route?: string;
    account?: string;
    q: string;
    page: number;
    fromCity: string;
    toCity: string;
    courier: string;
    agency: string;
    pageSize: number;
  },
) {
  if (current.q.trim() !== "" || current.page !== 1) return false;
  if (
    current.fromCity.trim() !== "" ||
    current.toCity.trim() !== "" ||
    current.courier.trim() !== "" ||
    current.agency.trim() !== "" ||
    current.pageSize !== DEFAULT_PAGE_SIZE
  ) {
    return false;
  }
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
  const fromCity = sp.fromCity?.trim() ?? "";
  const toCity = sp.toCity?.trim() ?? "";
  const courierRaw = sp.courier?.trim() ?? "";
  const courierForApi = normalizeAdminBookingsCourierParam(courierRaw);
  const agencyFilter = sp.agency?.trim() ?? "";
  const pageSizeRaw = sp.pageSize?.trim() ?? "";
  const pageSize =
    pageSizeRaw === "50" || pageSizeRaw === "100"
      ? Number(pageSizeRaw)
      : DEFAULT_PAGE_SIZE;

  const res = await fetchAdminBookings({
    q,
    status: statusFilter,
    route: routeFilter,
    account: accountFilter,
    fromCity: fromCity || undefined,
    toCity: toCity || undefined,
    courier: courierForApi,
    agency: agencyFilter || undefined,
    pageSize: pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize,
    page,
  });
  const total = res.total;
  const effectivePageSize = res.pageSize ?? pageSize;
  const rows = (res.bookings || []).map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));

  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));

  const anyFilter = Boolean(
    q ||
      statusFilter ||
      routeFilter ||
      accountFilter ||
      fromCity ||
      toCity ||
      courierForApi ||
      agencyFilter,
  );

  const subtitle = `${total} booking${total === 1 ? "" : "s"}${anyFilter ? " · filtered" : ""}${totalPages > 1 ? ` · page ${page} / ${totalPages}` : ""}${effectivePageSize !== DEFAULT_PAGE_SIZE ? ` · ${effectivePageSize} per page` : ""}`;

  const filterQuery = {
    q: q || undefined,
    status: statusFilter,
    route: routeFilter,
    account: accountFilter,
    fromCity: fromCity || undefined,
    toCity: toCity || undefined,
    courier: courierForApi,
    agency: agencyFilter || undefined,
    pageSize:
      effectivePageSize !== DEFAULT_PAGE_SIZE ? String(effectivePageSize) : undefined,
  };

  const currentForPresets = {
    status: statusFilter,
    route: routeFilter,
    account: accountFilter,
    q,
    page,
    fromCity,
    toCity,
    courier: courierForApi ? courierRaw.trim() : "",
    agency: agencyFilter,
    pageSize: effectivePageSize,
  };

  let networkCouriers: AdminNetworkCourier[] = [];
  try {
    const net = await fetchAdminNetwork();
    if (net.ok && Array.isArray(net.couriers)) {
      networkCouriers = [...net.couriers].sort((a, b) => {
        const an = (a.name || a.email || "").toLowerCase();
        const bn = (b.name || b.email || "").toLowerCase();
        return an.localeCompare(bn);
      });
    }
  } catch {
    /* list still works if network overview is unavailable */
  }

  const courierSelectValue = courierForApi !== undefined ? courierRaw : "";
  const courierIdsKnown = new Set(networkCouriers.map((c) => c.id));
  const orphanSelectedCourier =
    courierForApi &&
    /^[a-f0-9]{24}$/i.test(courierForApi) &&
    !courierIdsKnown.has(courierForApi)
      ? courierForApi
      : null;

  return (
    <AdminPageBody className="gap-8">
      <AdminPageHeader
        title="Bookings"
        description="Filter, search, or open by reference."
        actions={
          <p className="text-sm font-medium text-muted-soft" aria-live="polite">
            {subtitle}
          </p>
        }
      />

      <AdminPanel variant="accent" as="section" aria-labelledby="bookings-step-find-heading">
        <AdminStepHeader
          accent
          step={1}
          id="bookings-step-find-heading"
          title="Open by reference"
          description="Tracking ID, booking ID, or barcode."
        />
        <div className="mt-4 border-t border-teal/15 pt-4">
          <OpenBookingByReferenceForm />
        </div>
      </AdminPanel>

      <AdminPanel as="section" aria-labelledby="bookings-step-filter-heading">
        <AdminStepHeader
          step={2}
          id="bookings-step-filter-heading"
          title="Filter list"
          description="Presets and fields combine in one search."
        />

        <div className={`mt-5 ${adminUi.divider} pt-5`}>
          <p className={adminUi.kicker}>Common presets</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PRESETS.map((preset) => {
              const active = isPresetActive(preset, currentForPresets);
              return (
                <Link
                  key={preset.label}
                  href={buildBookingsHref(preset.params)}
                  prefetch={false}
                  className={adminClass(
                    adminUi.presetBase,
                    active ? adminUi.presetActive : adminUi.presetIdle,
                  )}
                >
                  {preset.label}
                </Link>
              );
            })}
            <Link href="/admin/bookings" prefetch={false} className={adminUi.presetClear}>
              Clear all filters
            </Link>
          </div>
        </div>

        <div className={`mt-6 ${adminUi.divider} pt-6`}>
          <p className={adminUi.kicker}>Search &amp; refine</p>
          <p className="mt-1 text-xs text-muted-soft">
            From / to columns show <strong className="font-medium text-ink">city</strong> (hover for name).
          </p>
          <div className="mt-4">
            <AdminListFilters
              basePath="/admin/bookings"
              placeholder="Booking ID, tracking ID, barcode, sender/recipient name or city…"
              defaultQuery={q}
            >
              <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0">
                  <label htmlFor="admin-booking-from-city" className={adminUi.labelBlock}>
                    From city (pickup)
                  </label>
                  <input
                    id="admin-booking-from-city"
                    name="fromCity"
                    type="search"
                    defaultValue={fromCity}
                    placeholder="e.g. Mumbai"
                    autoComplete="off"
                    className={`mt-2 ${adminUi.inputFilter}`}
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="admin-booking-to-city" className={adminUi.labelBlock}>
                    To city (delivery)
                  </label>
                  <input
                    id="admin-booking-to-city"
                    name="toCity"
                    type="search"
                    defaultValue={toCity}
                    placeholder="e.g. London"
                    autoComplete="off"
                    className={`mt-2 ${adminUi.inputFilter}`}
                  />
                </div>
                <div className="min-w-[160px]">
                  <label htmlFor="admin-booking-courier-filter" className={adminUi.labelBlock}>
                    Courier
                  </label>
                  <select
                    id="admin-booking-courier-filter"
                    name="courier"
                    defaultValue={courierSelectValue}
                    className={adminUi.selectMt}
                  >
                    <option value="">All couriers</option>
                    <option value="assigned">Assigned (any)</option>
                    <option value="unassigned">Not assigned</option>
                    {orphanSelectedCourier ? (
                      <option value={orphanSelectedCourier}>
                        Courier {orphanSelectedCourier.slice(0, 8)}…
                      </option>
                    ) : null}
                    {networkCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name?.trim()
                          ? `${c.name.trim()} (${c.email})`
                          : c.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                  <label htmlFor="admin-booking-agency-filter" className={adminUi.labelBlock}>
                    Agency (name or email fragment)
                  </label>
                  <input
                    id="admin-booking-agency-filter"
                    name="agency"
                    type="search"
                    defaultValue={agencyFilter}
                    placeholder="Matches assigned agency field"
                    autoComplete="off"
                    className={`mt-2 ${adminUi.inputFilter}`}
                  />
                </div>
                <div className="min-w-[140px]">
                  <label htmlFor="admin-booking-page-size" className={adminUi.labelBlock}>
                    Rows per page
                  </label>
                  <select
                    id="admin-booking-page-size"
                    name="pageSize"
                    defaultValue={String(effectivePageSize)}
                    className={adminUi.selectMt}
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
              <div className="min-w-[160px]">
                <label htmlFor="admin-booking-status" className={adminUi.labelBlock}>
                  Shipment status
                </label>
                <select
                  id="admin-booking-status"
                  name="status"
                  defaultValue={statusFilter ?? ""}
                  className={adminUi.selectMt}
                >
                  <option value="">Any status</option>
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {BOOKING_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px]">
                <label htmlFor="admin-booking-route" className={adminUi.labelBlock}>
                  Route type
                </label>
                <select
                  id="admin-booking-route"
                  name="route"
                  defaultValue={routeFilter ?? ""}
                  className={adminUi.selectMt}
                >
                  <option value="">Domestic &amp; international</option>
                  <option value="domestic">Domestic only</option>
                  <option value="international">International only</option>
                </select>
              </div>
              <div className="min-w-[160px]">
                <label htmlFor="admin-booking-account" className={adminUi.labelBlock}>
                  Customer account
                </label>
                <select
                  id="admin-booking-account"
                  name="account"
                  defaultValue={accountFilter ?? ""}
                  className={adminUi.selectMt}
                >
                  <option value="">All (guest + linked)</option>
                  <option value="linked">Linked to a user account</option>
                  <option value="guest">Guest only (not linked)</option>
                </select>
              </div>
            </AdminListFilters>
          </div>
        </div>
      </AdminPanel>

      <div className="border-b border-border-strong pb-4">
        <AdminStepHeader
          step={3}
          id="bookings-step-table-heading"
          title="Results"
          description={<span className="text-sm text-muted-soft">Manage opens full detail.</span>}
        />
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <AdminEmptyState>
            {anyFilter ? "No bookings match your filters." : "No bookings yet."}
          </AdminEmptyState>
        ) : (
          rows.map((r) => {
            const st = normalizeBookingStatus(r.status);
            const fromC = partyCity(r.payload, "sender");
            const toC = partyCity(r.payload, "recipient");
            const senderNm = partyName(r.payload, "sender");
            const recipientNm = partyName(r.payload, "recipient");
            const fromTitle = [senderNm, fromC !== "—" ? fromC : ""].filter(Boolean).join(" · ") || undefined;
            const toTitle = [recipientNm, toC !== "—" ? toC : ""].filter(Boolean).join(" · ") || undefined;
            const track =
              (r.consignmentNumber && String(r.consignmentNumber).trim()) ||
              (r.publicBarcodeCode && String(r.publicBarcodeCode).trim()) ||
              r.id.slice(0, 10) + "…";
            return (
              <article key={r.id} className={adminUi.rowCard}>
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
                    <dd className="max-w-[60%] text-right">
                      {r.courier ? (
                        <Link
                          href={`/admin/users/${r.courier.id}`}
                          prefetch={false}
                          className="block text-teal hover:underline"
                        >
                          <span className="block truncate">
                            {r.courier.name ?? r.courier.email}
                          </span>
                          {r.courier.name && r.courier.email ? (
                            <span className="block truncate text-xs text-muted-soft">
                              {r.courier.email}
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-soft">From (city)</dt>
                    <dd
                      className="max-w-[60%] truncate text-right text-muted"
                      title={fromTitle}
                    >
                      {fromC}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-soft">To (city)</dt>
                    <dd className="max-w-[60%] truncate text-right text-muted" title={toTitle}>
                      {toC}
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
      <AdminTableShell className="hidden md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className={adminUi.thead}>
            <tr>
              <th className={adminUi.th}>Date</th>
              <th className={adminUi.th}>Tracking</th>
              <th className={adminUi.th}>Route</th>
              <th className={adminUi.th}>Status</th>
              <th className={adminUi.th}>Account</th>
              <th className={adminUi.th}>Courier</th>
              <th className={adminUi.th}>From (city)</th>
              <th className={adminUi.th}>To (city)</th>
              <th className={adminUi.th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted">
                  {anyFilter ? "No bookings match your filters." : "No bookings yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const st = normalizeBookingStatus(r.status);
                const fromC = partyCity(r.payload, "sender");
                const toC = partyCity(r.payload, "recipient");
                const senderNm = partyName(r.payload, "sender");
                const recipientNm = partyName(r.payload, "recipient");
                const fromTitle =
                  [senderNm, fromC !== "—" ? fromC : ""].filter(Boolean).join(" · ") || undefined;
                const toTitle =
                  [recipientNm, toC !== "—" ? toC : ""].filter(Boolean).join(" · ") || undefined;
                const track =
                  (r.consignmentNumber && String(r.consignmentNumber).trim()) ||
                  (r.publicBarcodeCode && String(r.publicBarcodeCode).trim()) ||
                  r.id;
                return (
                  <tr key={r.id} className={adminUi.trHover}>
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
                    <td className="max-w-[140px] px-4 py-3.5 text-muted">
                      {r.courier ? (
                        <Link
                          href={`/admin/users/${r.courier.id}`}
                          prefetch={false}
                          className="block text-teal hover:underline"
                          title={
                            r.courier.name && r.courier.email
                              ? `${r.courier.name} · ${r.courier.email}`
                              : r.courier.email
                          }
                        >
                          <span className="block truncate">
                            {r.courier.name ?? r.courier.email}
                          </span>
                          {r.courier.name && r.courier.email ? (
                            <span className="block truncate text-xs text-muted-soft">
                              {r.courier.email}
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        <span className="text-muted-soft">—</span>
                      )}
                    </td>
                    <td
                      className="max-w-[140px] truncate px-4 py-3.5 text-muted"
                      title={fromTitle}
                    >
                      {fromC}
                    </td>
                    <td
                      className="max-w-[140px] truncate px-4 py-3.5 text-muted"
                      title={toTitle}
                    >
                      {toC}
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
      </AdminTableShell>

      <AdminPagination
        basePath="/admin/bookings"
        page={page}
        totalPages={totalPages}
        query={filterQuery}
      />
    </AdminPageBody>
  );
}
