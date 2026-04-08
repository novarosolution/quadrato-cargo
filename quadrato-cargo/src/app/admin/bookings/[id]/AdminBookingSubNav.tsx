"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Box,
  Eye,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  Truck,
  Users,
} from "lucide-react";
import { TRACKER_EDIT, TRACKER_PREVIEW } from "@/lib/admin-tracker-edit-labels";

type Item = { segment: string; label: string; hint: string; Icon: LucideIcon };

const ITEMS: Item[] = [
  { segment: "", label: "Overview", hint: "Summary", Icon: LayoutDashboard },
  { segment: "dispatch", label: "Dispatch", hint: "Status & assignment", Icon: Truck },
  { segment: "track-preview", label: TRACKER_PREVIEW, hint: "Customer view", Icon: Eye },
  {
    segment: "timeline",
    label: TRACKER_EDIT,
    hint: "Bulk timeline copy & visibility",
    Icon: Pencil,
  },
  { segment: "contacts", label: "People", hint: "Sender & receiver", Icon: Users },
  { segment: "parcel", label: "Parcel", hint: "Shipment details", Icon: Box },
  { segment: "invoice", label: "Invoice", hint: "PDF & lines", Icon: FileText },
  { segment: "more", label: "More", hint: "Pickup, account, JSON", Icon: MoreHorizontal },
];

export function AdminBookingSubNav({ bookingId }: { bookingId: string }) {
  const pathname = usePathname();
  const base = `/admin/bookings/${bookingId}`;

  function isActive(segment: string) {
    if (!segment) {
      return pathname === base || pathname === `${base}/`;
    }
    return pathname === `${base}/${segment}` || pathname.startsWith(`${base}/${segment}/`);
  }

  return (
    <nav
      aria-label="Booking sections"
      className="mt-4 rounded-2xl border border-border-strong/80 bg-linear-to-b from-surface-elevated/70 to-surface-elevated/45 shadow-[0_8px_32px_-20px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.04] backdrop-blur-md dark:from-surface-elevated/50 dark:to-surface-elevated/30 dark:shadow-black/40 lg:mt-5"
    >
      <p className="hidden border-b border-border-strong/50 px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-soft lg:block">
        Sections
      </p>
      {/* Mobile: pill strip */}
      <div className="p-2 lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITEMS.map((item) => {
            const href = item.segment ? `${base}/${item.segment}` : base;
            const on = isActive(item.segment);
            const Icon = item.Icon;
            return (
              <Link
                key={item.segment || "overview"}
                href={href}
                prefetch={false}
                title={item.hint}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  on
                    ? "border-teal/50 bg-teal/20 text-ink shadow-md ring-1 ring-teal/20"
                    : "border-border-strong/60 bg-canvas/45 text-muted hover:border-teal/30 hover:bg-canvas/55 hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5 opacity-80" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop: vertical list */}
      <ul className="hidden flex-col gap-0.5 p-2 lg:flex">
        {ITEMS.map((item) => {
          const href = item.segment ? `${base}/${item.segment}` : base;
          const on = isActive(item.segment);
          const Icon = item.Icon;
          return (
            <li key={item.segment || "overview"}>
              <Link
                href={href}
                prefetch={false}
                title={item.hint}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  on
                    ? "bg-teal/14 text-ink ring-1 ring-teal/25 shadow-sm dark:bg-teal/20"
                    : "text-muted hover:bg-canvas/50 hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-teal transition ${
                    on
                      ? "border-teal/35 bg-teal/10"
                      : "border-border-strong/50 bg-canvas/30 group-hover:border-teal/20"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm font-semibold leading-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
