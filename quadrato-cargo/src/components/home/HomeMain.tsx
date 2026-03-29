"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PackageCheck, Search } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/Wrap";
import { SectionHeading } from "@/components/Heading";
import { easeOutExpo, scaleIn, springSoft } from "@/lib/motion";
import { useMotionPreferences } from "@/lib/motion-preferences";
import { getApiBaseUrl } from "@/lib/api/base-url";
import {
  homeHeroCallToActionData,
  homeHeroStatData,
  homeProcessStepData,
  homeValueStoryData
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

export function HomeView() {
  const reduce = useReducedMotion();
  const { allowHoverMotion } = useMotionPreferences();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quickReference, setQuickReference] = useState("");
  const [quickTrackError, setQuickTrackError] = useState("");
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

  function onQuickTrackSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const value = quickReference.trim();
    if (!value) {
      setQuickTrackError("Enter your booking ID or consignment number.");
      return;
    }
    if (!/^[a-zA-Z0-9-]{6,40}$/.test(value)) {
      setQuickTrackError("Use 6-40 letters, numbers, or hyphens.");
      return;
    }
    setQuickTrackError("");
    window.location.assign(`/public/tsking?reference=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <nav
        aria-label="Quick actions"
        className="fixed bottom-5 right-4 z-40 flex flex-col gap-3"
      >
        <Link
          href="/public/book"
          title="Book Courier"
          className="group inline-flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-surface-elevated/80 text-ink shadow-2xl shadow-black/35 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-teal/45 hover:text-teal"
        >
          <PackageCheck className="h-6 w-6" strokeWidth={1.9} aria-hidden />
          <span className="sr-only">Book Courier</span>
        </Link>
        <Link
          href="/public/tsking"
          title="Track Courier"
          className="group inline-flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-surface-elevated/80 text-ink shadow-2xl shadow-black/35 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-accent/45 hover:text-accent-hover"
        >
          <Search className="h-6 w-6" strokeWidth={1.9} aria-hidden />
          <span className="sr-only">Track Courier</span>
        </Link>
      </nav>
      <section className="relative overflow-hidden border-b border-border page-section">
        <div
          className="pointer-events-none absolute -right-32 top-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[90px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal/10 blur-[70px]"
          aria-hidden
        />
        <Container wide className="relative">
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
                <span className="text-ink">At your</span>{" "}
                <span className="text-gradient">doorstep</span>
                <span className="text-ink">
                  {" "}
                  — international courier with quick pickup.
                </span>
              </motion.h1>
              <motion.p
                variants={heroItem}
                className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
              >
                Book with your PIN or postal code, choose instant or scheduled
                pickup, and track your shipment with clear status updates.
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
                    {(() => {
                      const highlightLoggedInCta =
                        isLoggedIn &&
                        (heroCallToAction.href === "/public/book" ||
                          heroCallToAction.href === "/public/contact");
                      const usePrimaryStyle =
                        heroCallToAction.kind === "primary" || highlightLoggedInCta;
                      return (
                    <Link
                      href={heroCallToAction.href}
                      className={`${
                        usePrimaryStyle
                          ? "btn-primary inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-7 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-accent/25"
                          : secondaryCtaClass
                      } w-full`}
                    >
                      {heroCallToAction.label}
                    </Link>
                      );
                    })()}
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
              <motion.form
                variants={heroItem}
                onSubmit={onQuickTrackSubmit}
                className="mt-8 rounded-2xl border border-border-strong bg-surface-elevated/65 p-4 backdrop-blur-sm"
                noValidate
              >
                <label
                  htmlFor="quick-track-reference"
                  className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-soft"
                >
                  Track consignment quickly
                </label>
                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                  <input
                    id="quick-track-reference"
                    type="text"
                    value={quickReference}
                    onChange={(ev) => setQuickReference(ev.target.value)}
                    placeholder="Enter booking ID or consignment number"
                    className="w-full rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-teal/45 focus:outline-none focus:ring-2 focus:ring-teal/20"
                    inputMode="text"
                    maxLength={40}
                    pattern="[A-Za-z0-9-]{6,40}"
                  />
                  <button
                    type="submit"
                    className="btn-primary inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Track Now
                  </button>
                </div>
                {quickTrackError ? (
                  <p className="mt-2 text-xs text-rose-300">{quickTrackError}</p>
                ) : null}
              </motion.form>
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
            description="Fast pickup where serviceable, clear status updates, and dependable handoff handling from booking to delivery."
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
              title="Book -> pickup -> shipment tracking"
              description="Submit your details, get pickup confirmation, and follow progress with one reference number."
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
                className="inline-flex items-center justify-center rounded-2xl border border-ghost-border bg-ghost-fill px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover"
              >
                See full flow
              </Link>
            </motion.div>
          </div>

          <div className="relative mt-16">
            <motion.div
              className="pointer-events-none absolute left-[6%] right-[6%] top-[2.25rem] hidden h-px bg-gradient-to-r from-transparent via-teal/40 to-transparent md:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease, delay: 0.15 }}
              style={{ transformOrigin: "left center" }}
              aria-hidden
            />
            <motion.ol
              className="relative grid gap-8 md:grid-cols-3 md:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              {homeProcessStepData.map((s) => (
                <motion.li
                  key={s.step}
                  variants={cardReveal}
                  whileHover={processCardHover}
                  className="relative rounded-2xl border border-border bg-surface-elevated/60 p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-teal/5 md:pt-8"
                >
                  <motion.span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal/70 text-sm font-bold text-slate-950 shadow-lg shadow-teal/20"
                    whileHover={processStepHover}
                    transition={springSoft}
                  >
                    {s.step}
                  </motion.span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </motion.li>
              ))}
            </motion.ol>
          </div>
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
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent/5 via-transparent to-teal/5"
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
                Next step
              </motion.p>
              <motion.h2
                className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18, duration: 0.45, ease }}
              >
                Ready for a quote?
              </motion.h2>
              <motion.p
                className="mx-auto mt-4 max-w-lg text-muted sm:text-lg"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.26, duration: 0.45, ease }}
              >
                Ask about serviceability, pickup options, and pricing. Our team
                confirms your route and next steps quickly.
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
                  className="btn-primary inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-10 py-4 text-sm font-semibold text-white shadow-xl shadow-accent/20"
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
