"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Boxes, Globe2, MessageCircle, Package, Truck, UserCircle } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Wrap";
import { SectionHeading } from "@/components/Heading";
import { easeOutExpo, scaleIn, springSoft } from "@/lib/motion";
import { useMotionPreferences } from "@/lib/motion-preferences";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { siteName } from "@/lib/site";
import { homeValueStoryData } from "@/lib/site-content";
import { HeroVisual } from "./HeroCards";
import { HomeOrbStats } from "./HomeOrbStats";

const ease = [0.16, 1, 0.3, 1] as const;

const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.04 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.48, ease },
  },
};

function HomeView() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { allowHoverMotion } = useMotionPreferences();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trackingReference, setTrackingReference] = useState("");
  const [trackingError, setTrackingError] = useState("");
  // Keep one source of truth for motion gating so every section degrades consistently.
  const hoverMotion = allowHoverMotion && !reduce;
  const valueCardHover = hoverMotion
    ? { y: -8, transition: { type: "spring" as const, stiffness: 360, damping: 22 } }
    : undefined;
  const valueIconHover = hoverMotion ? { scale: 1.08, rotate: [0, -4, 4, 0] } : undefined;
  const processCardHover = hoverMotion
    ? { y: -6, transition: { type: "spring" as const, stiffness: 320, damping: 24 } }
    : undefined;
  const processStepHover = hoverMotion ? { scale: 1.06, rotate: 3 } : undefined;
  const sectionLinkHover = hoverMotion ? { scale: 1.03 } : undefined;
  const sectionLinkTap = hoverMotion ? { scale: 0.98 } : undefined;
  const contactCtaHover = hoverMotion ? { scale: 1.04 } : undefined;
  const contactCtaTap = hoverMotion ? { scale: 0.97 } : undefined;
  const quickActions = useMemo(() => {
    return [
      {
        href: "/public/book",
        title: "Book courier",
        body: "Schedule domestic or international pickup.",
        Icon: Package,
        featured: false,
      },
      {
        href: isLoggedIn ? "/public/profile" : "/public/login",
        title: isLoggedIn ? "Your account" : "Log in",
        body: isLoggedIn
          ? "Bookings, profile, and tracking in one place."
          : "Sign in to manage bookings and tracking.",
        Icon: UserCircle,
        featured: true,
      },
      {
        href: "/public/contact",
        title: "Get a Quote",
        body: "Share your route — we confirm service and pricing.",
        Icon: MessageCircle,
        featured: false,
      },
    ] as const;
  }, [isLoggedIn]);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          user?: { id?: string } | null;
        };
        if (!active) return;
        setIsLoggedIn(Boolean(res.ok && data.ok && data.user?.id));
      } catch {
        if (!active) return;
        setIsLoggedIn(false);
      }
    }

    checkSession();
    return () => {
      active = false;
    };
  }, []);

  function onGetStartedSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const value = trackingReference.trim();
    if (!value) {
      setTrackingError("Enter your Booking ID or Tracking ID.");
      return;
    }
    if (!/^[a-zA-Z0-9-]{6,40}$/.test(value)) {
      setTrackingError("Use 6-40 letters, numbers, or hyphens.");
      return;
    }
    setTrackingError("");
    const search = new URLSearchParams();
    search.set("reference", value);
    router.push("/public/tsking?" + search.toString());
  }

  return (
    <>
      <section className="home-hero-surface relative border-b border-border-strong/50">
        <div className="relative z-[1] min-h-[min(60vh,560px)] overflow-hidden bg-linear-to-b from-surface-elevated via-canvas to-canvas px-4 pb-28 pt-16 sm:pb-36 sm:pt-[4.25rem] lg:min-h-[min(64vh,620px)] lg:pt-24">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_-12%,color-mix(in_oklab,var(--color-teal)_14%,transparent),transparent_58%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_80%_20%,color-mix(in_oklab,var(--color-accent)_8%,transparent),transparent_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-[min(480px,85vw)] w-[min(480px,85vw)] translate-x-1/3 rounded-full bg-accent/14 blur-[100px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-teal/14 blur-[88px] sm:left-6 sm:h-96 sm:w-96"
            aria-hidden
          />
          <Container wide className="relative z-[1]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroContainer}
              className="mx-auto max-w-3xl text-center"
            >
              <motion.p
                variants={heroItem}
                className="section-eyebrow text-[0.6875rem] tracking-[0.28em] text-teal sm:text-xs"
              >
                {siteName}
              </motion.p>
              <motion.h1
                variants={heroItem}
                className="type-display-premium mt-5 text-[1.95rem] leading-[1.1] tracking-tight sm:text-4xl md:text-[3.1rem]"
              >
                <span className="text-gradient inline-block max-w-full">Track your shipment</span>
                <span className="mt-3 block font-display text-xl font-semibold tracking-tight text-ink sm:mt-4 sm:text-2xl md:text-[1.65rem]">
                  Live status from pickup to delivery
                </span>
              </motion.h1>
              <motion.p
                variants={heroItem}
                className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted sm:mt-6 sm:text-base"
              >
                Enter your booking or tracking ID — same view customers use on the track page, updated as your parcel moves.
              </motion.p>
              <motion.form
                variants={heroItem}
                onSubmit={onGetStartedSubmit}
                className="mx-auto mt-10 w-full max-w-2xl sm:mt-12"
                noValidate
              >
                <div className="flex flex-col gap-2 rounded-2xl border border-border-strong/80 bg-surface-elevated/90 p-1.5 shadow-[0_28px_64px_-28px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.07),0_0_0_1px_color-mix(in_oklab,var(--color-teal)_14%,transparent)] backdrop-blur-xl dark:shadow-[0_32px_72px_-22px_rgba(0,0,0,0.62)] sm:flex-row sm:items-stretch sm:rounded-full sm:p-1.5 sm:pl-3">
                  <label htmlFor="hero-track-id" className="sr-only">
                    Booking or tracking ID
                  </label>
                  <input
                    id="hero-track-id"
                    type="text"
                    value={trackingReference}
                    onChange={(ev) => setTrackingReference(ev.target.value)}
                    placeholder="Enter your booking or tracking ID"
                    className="min-h-14 w-full flex-1 rounded-[1.05rem] border-0 bg-transparent px-5 py-3.5 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-teal/30 sm:min-h-0 sm:rounded-full sm:py-4 sm:text-lg"
                    inputMode="text"
                    maxLength={40}
                    autoComplete="off"
                    pattern="[A-Za-z0-9-]{6,40}"
                  />
                  <button
                    type="submit"
                    className="btn-primary inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-teal/70 bg-teal px-8 text-base font-semibold text-slate-950 shadow-lg shadow-teal/25 transition hover:bg-teal/90 sm:min-h-0 sm:min-w-[8.5rem] sm:py-4"
                  >
                    Track
                  </button>
                </div>
                {trackingError ? (
                  <p
                    className="mt-3 text-sm text-rose-600 dark:text-rose-300"
                    role="alert"
                  >
                    {trackingError}
                  </p>
                ) : null}
              </motion.form>
            </motion.div>
          </Container>
        </div>

        <Container wide className="relative z-[2] -mt-20 px-4 sm:-mt-28">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:items-stretch">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                prefetch={false}
                className={`home-quick-action-card group relative flex flex-col items-center gap-4 overflow-hidden px-6 py-10 text-center backdrop-blur-md ${
                  action.featured ? "home-quick-action-card--featured" : ""
                }`}
              >
                {action.featured ? (
                  <span
                    className="pointer-events-none absolute right-0 top-0 border-l-[44px] border-l-transparent border-t-[44px] border-t-teal opacity-95"
                    aria-hidden
                  />
                ) : null}
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal/25 bg-linear-to-br from-teal-dim to-teal-dim/35 text-teal shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition group-hover:scale-[1.06] group-hover:border-teal/40">
                  <action.Icon className="h-8 w-8" strokeWidth={1.65} aria-hidden />
                </span>
                <span className="font-display text-lg font-bold tracking-tight text-ink md:text-xl">
                  {action.title}
                </span>
                <span className="max-w-[18rem] text-sm leading-relaxed text-muted">
                  {action.body}
                </span>
              </Link>
            ))}
          </div>
        </Container>

        <Container wide className="relative pt-8 sm:pt-10 md:pt-12">
          <HomeOrbStats />
        </Container>

        <Container wide className="relative page-section">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20 lg:items-stretch">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroContainer}
              className="flex flex-col justify-center rounded-[1.85rem] border border-teal/15 bg-linear-to-br from-surface-elevated/55 via-surface-elevated/25 to-transparent p-6 shadow-[0_24px_56px_-36px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04] sm:p-8 lg:border-teal/10 lg:bg-linear-to-br lg:from-surface-elevated/35 lg:via-transparent lg:to-transparent lg:shadow-none lg:ring-0"
            >
              <motion.p
                variants={heroItem}
                className="inline-flex w-fit items-center gap-2.5 rounded-full border border-teal/25 bg-teal-dim/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal/50 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
                </span>
                International courier
              </motion.p>
              <motion.h2
                variants={heroItem}
                className="type-display-premium mt-6 max-w-2xl text-balance text-3xl sm:text-4xl lg:text-[2.75rem]"
              >
                Fast booking, quick pickup, and global tracking in one clean flow.
              </motion.h2>
            </motion.div>
            <div className="flex min-h-[min(22rem,50vh)] items-center rounded-[1.85rem] border border-border-strong/35 bg-canvas/20 p-4 ring-1 ring-inset ring-white/[0.03] lg:min-h-0 lg:border-0 lg:bg-transparent lg:p-0 lg:ring-0">
              <HeroVisual />
            </div>
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <div className="home-section-shell">
            <SectionHeading
              eyebrow="Why us"
              title="Doorstep collection, global handoffs"
              description="Fast pickup where we serve, clear updates, reliable handoff to delivery."
            />
            <motion.ul
              className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
            {homeValueStoryData.map((valueStory) => (
              <motion.li
                key={valueStory.title}
                variants={scaleIn}
                whileHover={valueCardHover}
                className="card-interactive rounded-3xl border border-border-strong/55 bg-surface-elevated/85 p-6 shadow-sm backdrop-blur-sm ring-1 ring-teal/[0.06] md:p-7"
              >
                <motion.div
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-dim text-teal"
                  whileHover={valueIconHover}
                  transition={{ duration: 0.45, ease: easeOutExpo }}
                >
                  <valueStory.Icon
                    className="h-6 w-6"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </motion.div>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">
                  {valueStory.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {valueStory.body}
                </p>
              </motion.li>
            ))}
            </motion.ul>
          </div>
        </Container>
      </section>

      <section className="home-process-band page-section border-y border-teal/10 backdrop-blur-md">
        <Container>
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <SectionHeading
              className="max-w-xl"
              eyebrow="Process"
              title="How it works"
              description="Book, pickup, track — in three steps."
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease }}
              whileHover={sectionLinkHover}
              whileTap={sectionLinkTap}
            >
              <Link
                href="/public/howwork"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-2xl border border-border-strong/60 bg-surface-elevated/90 px-6 py-3.5 text-sm font-bold text-ink shadow-md transition hover:border-teal/40 hover:bg-pill-hover hover:shadow-lg"
              >
                See full flow
              </Link>
            </motion.div>
          </div>

          <motion.ul
            className="mt-14 grid gap-5 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {[
              { title: "Book", body: "Details in, pickup confirmed.", Icon: Boxes },
              { title: "Pickup", body: "We dispatch fast where your area is serviceable.", Icon: Truck },
              { title: "Track", body: "Use your Tracking ID for status updates.", Icon: Globe2 },
            ].map((s) => (
              <motion.li
                key={s.title}
                variants={cardReveal}
                whileHover={processCardHover}
                className="rounded-3xl border border-border-strong/50 bg-surface-elevated/92 p-6 shadow-md backdrop-blur-sm ring-1 ring-white/[0.04] md:p-7"
              >
                <motion.div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-teal to-teal/75 text-slate-950 shadow-lg shadow-teal/25 ring-1 ring-white/15"
                  whileHover={processStepHover}
                  transition={springSoft}
                >
                  <s.Icon className="h-6 w-6" aria-hidden />
                </motion.div>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </motion.li>
            ))}
          </motion.ul>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <motion.div
            className="shimmer-border relative overflow-hidden rounded-[2.25rem] px-6 py-16 text-center shadow-[0_32px_80px_-36px_color-mix(in_oklab,var(--color-teal)_24%,transparent),0_0_0_1px_rgba(255,255,255,0.05)] sm:px-12 sm:py-20 md:py-24"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease }}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-accent/5 via-transparent to-teal/5"
              aria-hidden
            />
            <div className="relative">
              <motion.p
                className="section-eyebrow text-accent"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.4, ease }}
              >
                Quote
              </motion.p>
              <motion.h2
                className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18, duration: 0.45, ease }}
              >
                Need a quote?
              </motion.h2>
              <motion.p
                className="mx-auto mt-4 max-w-md text-base text-muted"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.26, duration: 0.45, ease }}
              >
                Tell us your route — we confirm serviceability and pricing quickly.
              </motion.p>
              <motion.div
                className="mt-10"
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.34, type: "spring", stiffness: 280, damping: 20 }}
                whileHover={contactCtaHover}
                whileTap={contactCtaTap}
              >
                <Link
                  href="/public/contact"
                  prefetch={false}
                  className="btn-primary inline-flex items-center justify-center rounded-2xl border border-teal/70 bg-teal px-10 py-4 text-sm font-semibold text-slate-950 shadow-xl shadow-teal/20"
                >
                  Contact Dispatch
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}

export { HomeView };
export default HomeView;
