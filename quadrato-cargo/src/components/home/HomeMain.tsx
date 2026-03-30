"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Boxes, Globe2, Truck } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Wrap";
import { SectionHeading } from "@/components/Heading";
import { easeOutExpo, scaleIn, springSoft } from "@/lib/motion";
import { useMotionPreferences } from "@/lib/motion-preferences";
import { getApiBaseUrl } from "@/lib/api/base-url";
import {
  homeHeroCallToActionData,
  homeHeroStatData,
  homeValueStoryData,
} from "@/lib/site-content";
import { HeroVisual } from "./HeroCards";

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

const statList = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const statItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease },
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

const secondaryCtaClass =
  "inline-flex items-center justify-center rounded-2xl border border-ghost-border bg-ghost-fill px-7 py-4 text-center text-sm font-semibold text-ink backdrop-blur-sm transition hover:border-teal/35 hover:bg-pill-hover";

type HeroCta = (typeof homeHeroCallToActionData)[number];

/** Literal `href` per route so static analysis does not treat CTA targets as untrusted URLs. */
function HeroCtaLink({
  cta,
  isLoggedIn,
}: {
  cta: HeroCta;
  isLoggedIn: boolean;
}) {
  const highlightLoggedInCta =
    isLoggedIn &&
    (cta.href === "/public/book" || cta.href === "/public/contact");
  const usePrimaryStyle =
    cta.kind === "primary" || highlightLoggedInCta;
  const className = `${
    usePrimaryStyle
      ? "btn-primary inline-flex items-center justify-center rounded-2xl border border-teal/70 bg-teal px-7 py-4 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-teal/25"
      : secondaryCtaClass
  } w-full`;

  switch (cta.href) {
    case "/public/register":
      return (
        <Link href="/public/register" prefetch={false} className={className}>
          {cta.label}
        </Link>
      );
    case "/public/book":
      return (
        <Link href="/public/book" prefetch={false} className={className}>
          {cta.label}
        </Link>
      );
    case "/public/contact":
      return (
        <Link href="/public/contact" prefetch={false} className={className}>
          {cta.label}
        </Link>
      );
    case "/public/service":
      return (
        <Link href="/public/service" prefetch={false} className={className}>
          {cta.label}
        </Link>
      );
    default:
      return (
        <Link href="/public/book" prefetch={false} className={className}>
          {cta.label}
        </Link>
      );
  }
}

export function HomeView() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { allowHoverMotion } = useMotionPreferences();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trackingReference, setTrackingReference] = useState("");
  const [trackingError, setTrackingError] = useState("");
  // Keep one source of truth for motion gating so every section degrades consistently.
  const hoverMotion = allowHoverMotion && !reduce;
  const ctaHoverUp = hoverMotion ? { y: -3 } : undefined;
  const ctaTapScale = hoverMotion ? { scale: 0.98 } : undefined;
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
  const heroCtas = useMemo(
    () =>
      isLoggedIn
        ? homeHeroCallToActionData.filter(
            (cta) => cta.href !== "/public/register" && cta.href !== "/public/service"
          )
        : homeHeroCallToActionData.filter((cta) => cta.href !== "/public/service"),
    [isLoggedIn],
  );

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
      <section className="relative border-b border-border page-section">
        <div
          className="pointer-events-none absolute right-0 top-0 h-[min(520px,90vw)] w-[min(520px,90vw)] translate-x-1/4 rounded-full bg-accent/10 blur-[90px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-teal/7 blur-[80px] sm:left-8 sm:h-96 sm:w-96"
          aria-hidden
        />
        <Container wide className="relative">
          <motion.form
            initial="hidden"
            animate="visible"
            variants={heroContainer}
            onSubmit={onGetStartedSubmit}
            className="mx-auto mb-10 w-full max-w-5xl rounded-[1.75rem] border border-border-strong bg-surface-elevated/90 p-5 shadow-xl shadow-black/15 backdrop-blur-md dark:shadow-black/35 sm:p-6"
            noValidate
          >
            <motion.label
              variants={heroItem}
              htmlFor="hero-postal-code"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-soft sm:text-sm"
            >
              Track shipment
            </motion.label>
            <motion.div
              variants={heroItem}
              className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <input
                id="hero-postal-code"
                type="text"
                value={trackingReference}
                onChange={(ev) => setTrackingReference(ev.target.value)}
                placeholder="Booking or tracking ID"
                className="h-16 w-full rounded-2xl border border-border-strong bg-canvas/80 px-5 text-base text-ink placeholder:text-muted-soft focus:border-teal/45 focus:outline-none focus:ring-2 focus:ring-teal/20 sm:text-lg"
                inputMode="text"
                maxLength={40}
                pattern="[A-Za-z0-9-]{6,40}"
              />
              <button
                type="submit"
                className="btn-primary inline-flex h-16 items-center justify-center rounded-2xl border border-teal/70 bg-teal px-8 text-lg font-semibold text-slate-950 shadow-lg shadow-teal/25 transition hover:-translate-y-0.5 hover:bg-teal/90 sm:min-w-[190px]"
              >
                Track Now
              </button>
            </motion.div>
            {trackingError ? (
              <p className="mt-3 text-sm text-rose-300">{trackingError}</p>
            ) : null}
          </motion.form>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroContainer}
            >
              <motion.p
                variants={heroItem}
                className="inline-flex items-center gap-2.5 rounded-full border border-border-strong bg-ghost-fill px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal/50 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
                </span>
                International courier
              </motion.p>
              <motion.h1
                variants={heroItem}
                className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]"
              >
                <span className="text-ink">
                  International Courier from Your Door in 10 Minutes.
                </span>
              </motion.h1>
              <motion.p
                variants={heroItem}
                className="mt-4 max-w-xl text-base leading-relaxed text-muted"
              >
                Fast booking, quick pickup, and global tracking in one clean flow.
              </motion.p>
              <motion.div
                variants={heroItem}
                className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3"
              >
                {heroCtas.map((heroCallToAction) => (
                  <motion.div
                    key={heroCallToAction.href}
                    className="inline-flex w-full"
                    whileHover={ctaHoverUp}
                    whileTap={ctaTapScale}
                    transition={springSoft}
                  >
                    <HeroCtaLink cta={heroCallToAction} isLoggedIn={isLoggedIn} />
                  </motion.div>
                ))}
              </motion.div>
              <motion.ul
                variants={statList}
                className="mt-10 flex flex-wrap gap-8 border-t border-border pt-8"
              >
                {homeHeroStatData.map((s) => (
                  <motion.li key={s.value} variants={statItem}>
                    <p className="font-display text-lg font-semibold text-ink">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-soft">{s.label}</p>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
            <HeroVisual />
          </div>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <SectionHeading
            eyebrow="Why us"
            title="Doorstep collection, global handoffs"
            description="Fast pickup where we serve, clear updates, reliable handoff to delivery."
          />
          <motion.ul
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
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
                className="card-interactive rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-sm"
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
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {valueStory.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {valueStory.body}
                </p>
              </motion.li>
            ))}
          </motion.ul>
        </Container>
      </section>

      <section className="page-section border-y border-border bg-surface/80 backdrop-blur-md">
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
                className="inline-flex items-center justify-center rounded-2xl border border-ghost-border bg-ghost-fill px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover"
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
                className="rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-sm"
              >
                <motion.div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-teal to-teal/70 text-slate-950 shadow-lg shadow-teal/20"
                  whileHover={processStepHover}
                  transition={springSoft}
                >
                  <s.Icon className="h-6 w-6" aria-hidden />
                </motion.div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </motion.li>
            ))}
          </motion.ul>
        </Container>
      </section>

      <section className="page-section">
        <Container>
          <motion.div
            className="shimmer-border relative overflow-hidden rounded-[1.75rem] px-6 py-16 text-center sm:px-12 sm:py-20"
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
