import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Search, Truck, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { PublicPageHeader } from "@/components/layout/AppPageHeader";
import { Container } from "@/components/Wrap";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  fetchProfileBookingsServer,
  fetchProfileUserServer,
  type ProfileBooking,
  type ProfileUser,
} from "@/lib/api/profile-client";
import { normalizeUserRole } from "@/lib/user-role";
import { ProfileEditForm } from "./editpro";

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

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/public/login?callbackUrl=/public/profile");
  }

  const cookieHeader = (await cookies()).toString();
  const [userRes, bookingsRes] = await Promise.all([
    fetchProfileUserServer(cookieHeader),
    fetchProfileBookingsServer(cookieHeader, { summary: true }),
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
  const activeCount = bookings.filter((b) => {
    const st = normalizeBookingStatus(b.status);
    return st !== "delivered" && st !== "cancelled";
  }).length;
  const deliveredCount = bookings.filter(
    (b) => normalizeBookingStatus(b.status) === "delivered",
  ).length;
  const latestBooking = bookings[0] || null;

  return (
    <div className="stack-page content-full">
      <section className="border-b border-border py-10 sm:py-14">
        <Container className="max-w-2xl">
          <PublicPageHeader
            eyebrow="Account"
            title="Your profile"
            description={
              <>
                Signed in as <span className="font-medium text-ink">{user.email}</span>. Manage bookings,
                tracking, and your profile here.
              </>
            }
          />
        </Container>
      </section>

      <PublicPageSection>
        <Container className="max-w-4xl stack-page gap-8 max-sm:gap-6">
          <PublicCard className="bg-linear-to-br from-surface-elevated/80 to-canvas/30 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
                  <UserRound className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-medium text-muted">Customer profile</p>
                  <p className="text-base font-semibold text-ink">
                    {user.name?.trim() || "Welcome back"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-soft">Member since {dateFmt.format(user.createdAt)}</p>
            </div>
          </PublicCard>

          <div className="grid gap-3 sm:grid-cols-3">
            <PublicCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-soft">Total bookings</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{bookings.length}</p>
            </PublicCard>
            <PublicCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-soft">Active</p>
              <p className="mt-2 text-2xl font-semibold text-teal">{activeCount}</p>
            </PublicCard>
            <PublicCard className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-soft">Delivered</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{deliveredCount}</p>
            </PublicCard>
          </div>

          <PublicCard className="sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">Quick actions</h2>
            <p className="mt-1 text-sm text-muted">Shortcuts for bookings and support.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/public/book"
                className="btn-secondary inline-flex items-center gap-2 px-4 py-3 text-sm font-medium"
              >
                <Truck className="h-4 w-4 text-teal" strokeWidth={2} />
                New booking
              </Link>
              <Link
                href="/public/tsking"
                className="btn-secondary inline-flex items-center gap-2 px-4 py-3 text-sm font-medium"
              >
                <Search className="h-4 w-4 text-teal" strokeWidth={2} />
                Track by reference
              </Link>
              <Link
                href="/public/contact"
                className="btn-secondary inline-flex items-center gap-2 px-4 py-3 text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4 text-teal" strokeWidth={2} />
                Contact dispatch
              </Link>
              {latestBooking ? (
                <Link
                  href={`/public/profile/booksdetels/${latestBooking.id}`}
                  className="btn-secondary px-4 py-3 text-sm font-medium"
                >
                  Open latest booking
                </Link>
              ) : (
                <span className="rounded-xl border border-border bg-canvas/40 px-4 py-3 text-sm text-muted-soft">
                  Latest booking link appears after first booking
                </span>
              )}
            </div>
          </PublicCard>

          <PublicCard className="sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">
              Edit profile
            </h2>
            <p className="mt-1 text-sm text-muted">
              Your email is your login and cannot be changed here.
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <ProfileEditForm key={user.id} initialName={user.name} />
            </div>
          </PublicCard>

          <PublicCard className="sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  Your courier bookings
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Status and Tracking ID updates from dispatch.
                </p>
              </div>
              <Link
                href="/public/book"
                className="btn-primary inline-flex shrink-0 items-center justify-center rounded-full border border-teal/70 bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/20"
              >
                New booking
              </Link>
            </div>

            {bookings.length === 0 ? (
              <p className="mt-8 text-sm text-muted">
                No bookings yet. Use{" "}
                <Link href="/public/book" className="text-teal hover:underline">
                  Book courier
                </Link>{" "}
                while logged in to attach shipments to this account.
              </p>
            ) : (
              <ul className="mt-8 space-y-3">
                {bookings.map((b) => {
                  const st = normalizeBookingStatus(b.status);
                  return (
                    <li key={b.id}>
                      <Link
                        href={`/public/profile/booksdetels/${b.id}`}
                        className="panel-card card-interactive block transition hover:border-teal/30"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium capitalize text-ink">
                            {b.routeType}
                          </span>
                          <span className="rounded-full bg-pill px-2.5 py-0.5 text-xs font-semibold text-teal">
                            {BOOKING_STATUS_LABELS[st]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-soft">
                          {dateFmt.format(b.createdAt)}
                          {b.consignmentNumber
                            ? ` · Tracking ID ${b.consignmentNumber}`
                            : ""}
                        </p>
                        {b.customerTrackingNote ? (
                          <p className="mt-2 line-clamp-2 text-sm text-muted">
                            {b.customerTrackingNote}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </PublicCard>

          <PublicCard className="sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">
              Account details
            </h2>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
                  Email
                </dt>
                <dd className="mt-1 text-lg font-medium text-ink">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-muted">
                  {dateFmt.format(user.createdAt)}
                </dd>
              </div>
            </dl>
            <details className="mt-6 border-t border-border pt-4">
              <summary className="cursor-pointer text-sm font-medium text-teal hover:underline">
                Technical reference
              </summary>
              <p className="mt-3 break-all font-mono text-xs text-muted-soft">{user.id}</p>
            </details>

            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:flex-wrap">
              <Link
                href="/public"
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-ghost-border bg-ghost-fill px-6 py-3.5 text-center text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover sm:flex-none"
              >
                Home
              </Link>
            </div>
          </PublicCard>

          <p className="text-center text-xs text-muted-soft">
            To change your password or delete your account, contact{" "}
            <Link
              href="/public/contact"
              className="text-teal underline-offset-2 hover:underline"
            >
              dispatch
            </Link>
            .
          </p>
        </Container>
      </PublicPageSection>
    </div>
  );
}
