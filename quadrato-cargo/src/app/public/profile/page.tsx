import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Home,
  Inbox,
  MapPin,
  MapPinned,
  MessageCircle,
  Package,
  Search,
  Settings,
  Tag,
  Truck,
  UserRound,
} from "lucide-react";
import { auth } from "@/auth";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { Container } from "@/components/Wrap";
import {
  fetchAddressBookServer,
  fetchProfileBookingsServer,
  fetchProfileUserServer,
  type AddressBook,
  type ProfileBooking,
  type ProfileUser,
} from "@/lib/api/profile-client";
import { computeProfileBookingStats } from "@/lib/profile-booking-stats";
import { normalizeUserRole } from "@/lib/user-role";
import { publicClass, publicUi } from "@/components/public/public-ui";
import { ProfileAccountSnapshot } from "./ProfileAccountSnapshot";
import { ProfileEditForm } from "./editpro";
import { ProfileAddressBookPanel } from "./ProfileAddressBookPanel";
import { ProfileBookingsPanel } from "./ProfileBookingsPanel";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your Quadrato Cargo account details.",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});
type ProfileUserView = Omit<ProfileUser, "createdAt"> & { createdAt: Date };
type ProfileBookingView = Omit<ProfileBooking, "createdAt"> & { createdAt: Date };

function profileInitials(name: string | null, email: string) {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/public/login?callbackUrl=/public/profile");
  }

  const cookieHeader = (await cookies()).toString();
  const [userRes, bookingsRes, addressBookRes] = await Promise.all([
    fetchProfileUserServer(cookieHeader),
    fetchProfileBookingsServer(cookieHeader, { summary: true }),
    fetchAddressBookServer(cookieHeader),
  ]);

  const user: ProfileUserView | null =
    userRes.ok && userRes.data.user
      ? {
          ...userRes.data.user,
          createdAt: new Date(userRes.data.user.createdAt || "1970-01-01T00:00:00.000Z"),
        }
      : null;

  if (!user) {
    redirect("/public/login?callbackUrl=/public/profile");
  }

  const ur = normalizeUserRole(user.role);
  if (ur === "staff") {
    redirect("/admin/dashboard");
  }
  if (ur === "courier") {
    redirect("/courier");
  }
  if (ur === "agency") {
    redirect("/agency");
  }

  const bookings: ProfileBookingView[] = bookingsRes.ok
    ? (bookingsRes.data.bookings || []).map((b) => ({
        ...b,
        createdAt: new Date(b.createdAt),
      }))
    : [];
  const addressBookInitial: AddressBook =
    addressBookRes.ok && addressBookRes.data.ok
      ? addressBookRes.data.addressBook ?? { sender: null, recipient: null }
      : { sender: null, recipient: null };
  const latestBooking = bookings[0] || null;
  const stats = computeProfileBookingStats(bookings);

  const bookingRowsForPanel = bookings.map((b) => ({
    id: b.id,
    routeType: b.routeType,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    consignmentNumber: b.consignmentNumber ?? null,
    estimatedDeliveryAt: b.estimatedDeliveryAt ?? null,
    customerTrackingNote: b.customerTrackingNote ?? null,
    courierName: b.courierName ?? null,
    courierEmail: b.courierEmail ?? null,
  }));
  const initials = profileInitials(user.name, user.email);
  const displayName = user.name?.trim() || "Welcome back";
  const memberSinceLabel = dateFmt.format(user.createdAt);

  const statItems = [
    { label: "All bookings", value: stats.total, icon: Package },
    { label: "In progress", value: stats.active, icon: Truck },
    { label: "Delivered", value: stats.completed, icon: MapPin },
    { label: "Cancelled", value: stats.cancelled, icon: Inbox },
  ] as const;

  return (
    <div className={publicUi.page}>
      <section className="relative overflow-hidden border-b border-border-strong/70 bg-linear-to-b from-teal/[0.1] via-canvas to-canvas pb-12 pt-10 sm:pb-16 sm:pt-12">
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-teal/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative max-w-5xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 lg:contents">
              <div
                className="flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center rounded-3xl bg-linear-to-br from-teal/30 via-teal/15 to-teal/5 text-2xl font-bold tracking-tight text-teal ring-2 ring-teal/25 shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--color-teal)_45%,transparent)] sm:h-28 sm:w-28 sm:text-3xl"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 lg:col-span-1">
                <p className="section-eyebrow mb-2">Customer hub</p>
                <h1 className="type-display-premium text-3xl sm:text-4xl">{displayName}</h1>
                <p className="mt-2 break-all text-sm text-muted sm:text-base">{user.email}</p>
                <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-border-strong bg-surface-elevated/70 px-4 py-2 text-xs text-muted-soft shadow-sm backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-teal" strokeWidth={2} aria-hidden />
                  Member since {memberSinceLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {statItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className={publicUi.profileStatTile}>
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal/12 text-teal ring-1 ring-teal/15">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <p className="mt-3 font-display text-2xl font-bold tabular-nums tracking-tight text-ink">
                  {value}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-soft">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <PublicPageSection className="!pt-10 sm:!pt-12">
        <Container className="max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
            <div className="space-y-8 lg:col-span-7">
              <PublicCard className="p-5 shadow-md ring-1 ring-border-strong/35 sm:p-8">
                <h2 className={publicUi.sectionTitle}>Quick links</h2>
                <p className={publicUi.profileSectionDesc}>
                  Book, track, and explore services — everything you use most often.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        href: "/public/book",
                        title: "New booking",
                        desc: "Schedule domestic or international pickup",
                        Icon: Truck,
                      },
                      {
                        href: "/public/profile#saved-addresses",
                        title: "Saved addresses",
                        desc: "Edit pickup & delivery — reuse when booking",
                        Icon: MapPinned,
                      },
                      {
                        href: "/public/tsking",
                        title: "Track shipment",
                        desc: "Status with your booking or tracking ID",
                        Icon: Search,
                      },
                      {
                        href: "/public/contact",
                        title: "Contact dispatch",
                        desc: "Quotes, changes, and support",
                        Icon: MessageCircle,
                      },
                      {
                        href: "/public/price",
                        title: "Pricing",
                        desc: "Rates and service options",
                        Icon: Tag,
                      },
                      {
                        href: "/public/howwork",
                        title: "How it works",
                        desc: "Pickup to delivery in plain steps",
                        Icon: BookOpen,
                      },
                      {
                        href: "/public/service",
                        title: "Services",
                        desc: "What we ship and where we operate",
                        Icon: Package,
                      },
                    ] as const
                  ).map(({ href, title, desc, Icon }) => (
                    <Link key={href} href={href} prefetch={false} className={publicUi.profileActionTile}>
                      <span className={publicUi.profileIconWell}>
                        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-ink group-hover:text-teal">{title}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-soft">{desc}</span>
                      </span>
                      <ChevronRight
                        className="mt-1 h-5 w-5 shrink-0 text-muted-soft transition group-hover:translate-x-0.5 group-hover:text-teal"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </Link>
                  ))}
                </div>
                {latestBooking ? (
                  <Link
                    href={`/public/profile/booksdetels/${latestBooking.id}`}
                    prefetch={false}
                    className={publicClass(publicUi.profileActionTile, "mt-3")}
                  >
                    <span className={publicUi.profileIconWell}>
                      <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink group-hover:text-teal">Latest booking</span>
                      <span className="mt-0.5 block text-xs text-muted-soft">
                        Open details, timeline, and documents
                      </span>
                    </span>
                    <ChevronRight
                      className="mt-1 h-5 w-5 shrink-0 text-muted-soft transition group-hover:translate-x-0.5 group-hover:text-teal"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                ) : (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-border-strong bg-canvas/25 p-4 sm:p-5">
                    <span className="inline-flex shrink-0 rounded-xl bg-canvas/80 p-2.5 text-muted-soft ring-1 ring-border">
                      <Inbox className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">No bookings yet</p>
                      <p className="mt-1 text-sm text-muted">
                        When you book, your shipments will show up here and in{" "}
                        <span className="font-medium text-ink">Your bookings</span>.
                      </p>
                      <Link
                        href="/public/book"
                        className={publicClass(publicUi.btnPrimary, "mt-4 inline-flex")}
                      >
                        Book courier
                      </Link>
                    </div>
                  </div>
                )}
              </PublicCard>

              <PublicCard className="p-5 sm:p-8">
                <ProfileAddressBookPanel initialBook={addressBookInitial} />
              </PublicCard>

              <PublicCard className="p-5 sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className={publicUi.sectionTitle}>Your bookings</h2>
                    <p className={publicUi.profileSectionDesc}>
                      Filter by status, then search by reference or consignment number.
                    </p>
                  </div>
                  <Link
                    href="/public/book"
                    className={publicClass(
                      publicUi.btnPrimary,
                      "shrink-0 justify-center sm:px-6",
                    )}
                  >
                    New booking
                  </Link>
                </div>
                <div className="mt-8">
                  <ProfileBookingsPanel rows={bookingRowsForPanel} />
                </div>
              </PublicCard>
            </div>

            <aside className="space-y-6 lg:col-span-5 lg:sticky lg:top-24">
              <PublicCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 border-b border-border-strong/60 pb-4">
                  <span className={publicUi.profileIconWell}>
                    <UserRound className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                      Account details
                    </h2>
                    <p className="text-xs text-muted-soft">For support and verification</p>
                  </div>
                </div>
                <div className="mt-5">
                  <ProfileAccountSnapshot
                    email={user.email}
                    userId={user.id}
                    memberSinceLabel={memberSinceLabel}
                  />
                </div>
              </PublicCard>

              <PublicCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 border-b border-border-strong/60 pb-4">
                  <span className={publicUi.profileIconWell}>
                    <Settings className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                      Profile &amp; security
                    </h2>
                    <p className="text-xs text-muted-soft">Name, password, and session</p>
                  </div>
                </div>
                <div className="mt-5">
                  <ProfileEditForm key={user.id} initialName={user.name} />
                </div>
              </PublicCard>

              <PublicCard className="border-dashed border-teal/25 bg-teal/[0.03] p-5 sm:p-6">
                <h2 className="font-display text-base font-bold text-ink">More on the site</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <Link
                      href="/public/about"
                      prefetch={false}
                      className="font-medium text-teal underline-offset-2 transition hover:underline"
                    >
                      About Quadrato Cargo
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/public"
                      prefetch={false}
                      className="font-medium text-teal underline-offset-2 transition hover:underline"
                    >
                      Home page
                    </Link>
                  </li>
                </ul>
                <Link
                  href="/public"
                  prefetch={false}
                  className={publicClass(
                    publicUi.btnSecondary,
                    "mt-6 w-full justify-center gap-2 font-bold",
                  )}
                >
                  <Home className="h-4 w-4 text-teal" strokeWidth={2} aria-hidden />
                  Back to home
                </Link>
              </PublicCard>
            </aside>
          </div>
        </Container>
      </PublicPageSection>
    </div>
  );
}
