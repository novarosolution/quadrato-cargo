import type { Metadata } from "next";
import Link from "next/link";
import {
  Box,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Truck,
  Users,
} from "lucide-react";
import { BOOKING_STATUS_LABELS, normalizeBookingStatus } from "@/lib/booking-status";
import {
  formatEddDisplay,
  resolveEstimatedDeliveryDate,
} from "@/lib/estimated-delivery";
import { TRACKER_EDIT, TRACKER_PREVIEW } from "@/lib/admin-tracker-edit-labels";
import { getAdminBookingBundle } from "./_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "./BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Overview — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingOverviewPage({ params }: Props) {
  const { id } = await params;
  const { booking: row } = await getAdminBookingBundle(id);
  const base = `/admin/bookings/${id}`;
  const st = normalizeBookingStatus(row.status);

  const adminEddResolved = resolveEstimatedDeliveryDate({
    routeType: row.routeType,
    createdAtIso: row.createdAt.toISOString(),
    estimatedDeliveryAt: row.estimatedDeliveryAt ?? null,
  });
  const hasCustomEdd = Boolean(row.estimatedDeliveryAt);

  const inv = row.invoice && typeof row.invoice === "object" ? row.invoice : null;
  const invNo = inv?.number != null ? String(inv.number).trim() : "";
  const invTotal = inv?.total != null ? String(inv.total).trim() : "";
  const invCur = (inv?.currency != null ? String(inv.currency).trim() : "") || "INR";
  const invLineCount = Array.isArray(inv?.lineItems) ? inv.lineItems.length : 0;

  const tiles: Array<{
    href: string;
    title: string;
    body: string;
    Icon: typeof Truck;
  }> = [
    {
      href: `${base}/dispatch`,
      title: "Dispatch",
      body: "Status, tracking number, customer message, dates, partner, driver.",
      Icon: Truck,
    },
    {
      href: `${base}/track-preview`,
      title: TRACKER_PREVIEW,
      body: "See the tracking page exactly as the customer sees it.",
      Icon: Eye,
    },
    {
      href: `${base}/timeline`,
      title: TRACKER_EDIT,
      body: "Timeline editor: every card and visibility — one page.",
      Icon: Pencil,
    },
    {
      href: `${base}/contacts`,
      title: "People",
      body: "Sender and receiver — names, phones, addresses.",
      Icon: Users,
    },
    {
      href: `${base}/parcel`,
      title: "Parcel",
      body: "Weight, size, what is inside.",
      Icon: Box,
    },
    {
      href: `${base}/invoice`,
      title: "Invoice",
      body: "Prices and PDF for the customer.",
      Icon: FileText,
    },
    {
      href: `${base}/more`,
      title: "More",
      body: "Pickup time, link to customer account, advanced data.",
      Icon: MoreHorizontal,
    },
  ];

  const flowSteps = [
    { n: "1", label: "Dispatch", href: `${base}/dispatch` },
    { n: "2", label: TRACKER_EDIT, href: `${base}/timeline` },
    { n: "3", label: TRACKER_PREVIEW, href: `${base}/track-preview` },
    { n: "4", label: "People", href: `${base}/contacts` },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <BookingSectionIntro step="Start here" title="This parcel">
        <p>
          Use the <strong className="font-medium text-ink">menu</strong> on the side (or pills on a phone). Only open
          what you need to change.
        </p>
      </BookingSectionIntro>

      <section aria-labelledby="booking-flow" className="rounded-2xl border border-teal/20 bg-teal/5 p-4 dark:bg-teal/10 sm:p-5">
        <h2 id="booking-flow" className="text-sm font-semibold text-ink">
          Easy order to follow
        </h2>
        <ol className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {flowSteps.map((s, i) => (
            <li key={s.n} className="flex items-center gap-2 sm:gap-3">
              {i > 0 ? (
                <ChevronRight
                  className="hidden h-4 w-4 shrink-0 text-teal/50 sm:block"
                  aria-hidden
                />
              ) : null}
              <Link
                href={s.href}
                prefetch={false}
                className="inline-flex items-center gap-3 rounded-xl border border-teal/25 bg-canvas/60 px-4 py-3 text-sm font-medium text-ink shadow-sm transition hover:border-teal/45 hover:bg-pill-hover dark:bg-canvas/30"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/20 text-sm font-bold text-teal">
                  {s.n}
                </span>
                {s.label}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="booking-overview-summary">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="booking-overview-summary" className="font-display text-lg font-semibold text-ink sm:text-xl">
            At a glance
          </h2>
          <Link
            href={`${base}/dispatch`}
            prefetch={false}
            className="hidden text-sm font-medium text-teal hover:underline sm:inline"
          >
            Edit dispatch →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 dark:bg-canvas/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Status</p>
            <p className="mt-1.5 text-base font-semibold text-teal">{BOOKING_STATUS_LABELS[st]}</p>
          </div>
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 dark:bg-canvas/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Tracking ID</p>
            <p className="mt-1.5 break-all font-mono text-sm text-ink">{row.consignmentNumber || "—"}</p>
          </div>
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 dark:bg-canvas/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Agency</p>
            <p className="mt-1.5 wrap-break-word text-sm text-ink">{row.assignedAgency || "—"}</p>
          </div>
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 dark:bg-canvas/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Courier</p>
            <p className="mt-1.5 text-sm text-ink">
              {row.courier ? (
                <Link
                  href={`/admin/users/${row.courier.id}`}
                  prefetch={false}
                  className="font-medium text-teal hover:underline"
                >
                  {row.courier.name ?? row.courier.email}
                </Link>
              ) : (
                <span className="text-muted-soft">Not assigned</span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 dark:bg-canvas/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Customer</p>
            <p className="mt-1.5 text-sm text-ink">
              {row.user ? (
                <Link
                  href={`/admin/users/${row.user.id}`}
                  prefetch={false}
                  className="font-medium text-teal hover:underline"
                >
                  {row.user.name ?? row.user.email}
                </Link>
              ) : (
                <span className="text-muted-soft">Guest (not linked)</span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 dark:bg-canvas/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Barcode</p>
            <p className="mt-1.5 font-mono text-xs text-ink">{row.publicBarcodeCode || "—"}</p>
          </div>
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 sm:col-span-2 lg:col-span-3 dark:bg-canvas/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Invoice</p>
                <p className="mt-1.5 text-sm text-ink">
                  {invNo ? (
                    <>
                      No. <span className="font-mono font-semibold">{invNo}</span>
                    </>
                  ) : (
                    <span className="text-muted-soft">No invoice number set</span>
                  )}
                </p>
                <dl className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2 sm:gap-x-6">
                  <div>
                    <dt className="text-muted-soft">Total</dt>
                    <dd className="font-semibold text-teal">{invTotal ? `${invCur} ${invTotal}` : "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-soft">Saved line rows</dt>
                    <dd className="font-medium text-ink">{invLineCount > 0 ? `${invLineCount} line(s)` : "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-soft">Customer PDF download</dt>
                    <dd className="font-medium text-ink">
                      {row.invoicePdfReady === false ? "Blocked" : "Allowed"} (after pickup OTP)
                    </dd>
                  </div>
                </dl>
              </div>
              <Link
                href={`${base}/invoice`}
                prefetch={false}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-teal/20 transition hover:opacity-92"
              >
                Update invoice
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-border-strong/60 bg-canvas/30 p-4 sm:col-span-2 lg:col-span-3 dark:bg-canvas/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-soft">Est. delivery (EDD)</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold text-teal">{formatEddDisplay(adminEddResolved)}</span>
              {hasCustomEdd ? (
                <span className="rounded-full border border-teal/35 bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                  Custom
                </span>
              ) : row.routeType === "international" ? (
                <span className="text-xs text-muted-soft">Default +10 days until set on Dispatch.</span>
              ) : (
                <span className="text-xs text-muted-soft">Optional — set on Dispatch for Track.</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="booking-quick-sections">
        <h2 id="booking-quick-sections" className="font-display text-lg font-semibold text-ink sm:text-xl">
          All sections
        </h2>
        <p className="mt-1 text-sm text-muted-soft">
          Same links as the sidebar — tap a card to open that page.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {tiles.map(({ href, title, body, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                prefetch={false}
                className="group flex h-full items-start gap-4 rounded-2xl border border-border-strong/70 bg-surface-elevated/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal/35 hover:shadow-md dark:bg-surface-elevated/25"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/12 text-teal ring-1 ring-teal/15 transition group-hover:bg-teal/18">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-display text-base font-semibold text-ink">{title}</span>
                    <ChevronRight
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-soft transition group-hover:translate-x-0.5 group-hover:text-teal"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-soft">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
