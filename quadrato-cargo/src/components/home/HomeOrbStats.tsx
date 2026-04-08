"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { homeOrbStatCenter, homeOrbStatFigures } from "@/lib/site-content";

const ease = [0.16, 1, 0.3, 1] as const;

const list = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease },
  },
};

const OrbGlobe3D = dynamic(() => import("./HomeOrbGlobeCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full min-h-[220px] w-full items-center justify-center rounded-full bg-linear-to-br from-teal/15 via-canvas to-accent/10 ring-1 ring-border-strong/40"
      aria-hidden
    >
      <div className="h-24 w-24 animate-pulse rounded-full bg-pill/80 opacity-60" />
    </div>
  ),
});

function StatBlock({
  value,
  label,
  align,
}: {
  value: string;
  label: string;
  align: "center" | "end" | "start";
}) {
  const alignCls =
    align === "center"
      ? "text-center"
      : align === "end"
        ? "text-right sm:text-right"
        : "text-left sm:text-left";
  return (
    <div className={`min-w-0 px-1 ${alignCls}`}>
      <p className="font-display text-lg font-bold tabular-nums tracking-tight text-accent drop-shadow-[0_0_20px_color-mix(in_oklab,var(--color-accent)_35%,transparent)] sm:text-xl md:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-semibold uppercase leading-snug tracking-[0.14em] text-muted sm:text-[10px] md:text-[11px]">
        {label}
      </p>
    </div>
  );
}

/**
 * Stats around a Three.js Earth (full texture wrap, clouds + atmosphere).
 */
export function HomeOrbStats() {
  const [top, left, right, bottom] = homeOrbStatFigures;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={list}
      className="mx-auto w-full max-w-3xl"
    >
      <div className="home-orb-panel rounded-[2.25rem] border border-border-strong/45 bg-linear-to-br from-surface-elevated/65 via-surface-elevated/40 to-canvas/28 px-4 py-8 shadow-[0_32px_80px_-34px_rgba(0,0,0,0.52),0_0_0_1px_color-mix(in_oklab,var(--color-teal)_10%,transparent)] ring-1 ring-white/[0.05] backdrop-blur-xl sm:px-6 sm:py-10 md:px-8 md:py-12 dark:border-teal/22 dark:from-surface-elevated/48 dark:via-surface-elevated/24 dark:to-canvas/20 dark:shadow-[0_36px_88px_-30px_rgba(0,0,0,0.58)] dark:ring-white/[0.07]">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
          <motion.div
            variants={item}
            className="relative w-full max-w-lg md:max-w-2xl"
            aria-label="Network stats and globe"
          >
            <div className="flex justify-center pb-2 md:pb-3">
              <StatBlock value={top.value} label={top.label} align="center" />
            </div>

            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_minmax(0,1fr)] items-center gap-x-1 gap-y-3 sm:gap-x-2 md:min-h-[15rem] md:gap-x-4">
              <div className="flex min-w-0 justify-end pr-1 sm:pr-2">
                <StatBlock value={left.value} label={left.label} align="end" />
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-[min(78vw,14rem)] overflow-hidden rounded-full bg-radial-[circle_at_45%_35%] from-teal/25 via-canvas/40 to-canvas shadow-[0_28px_56px_-12px_rgba(15,23,42,0.4),inset_0_0_0_1px_rgba(255,255,255,0.07)] md:max-w-[15.5rem] dark:from-teal/20 dark:via-canvas/30 dark:to-canvas dark:shadow-[0_32px_64px_-8px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                <div
                  className="pointer-events-none absolute inset-0 z-10 rounded-full ring-1 ring-inset ring-white/15 dark:ring-white/10"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -inset-[22%] z-0 rounded-full opacity-90 blur-[3rem]"
                  style={{
                    background:
                      "radial-gradient(circle at 48% 38%, color-mix(in oklab, var(--color-teal) 32%, transparent) 0%, color-mix(in oklab, var(--color-accent) 18%, transparent) 38%, transparent 72%)",
                  }}
                />
                <OrbGlobe3D className="relative z-10 h-full min-h-[220px] w-full md:min-h-[248px]" />
              </div>

              <div className="flex min-w-0 justify-start pl-1 sm:pl-2">
                <StatBlock value={right.value} label={right.label} align="start" />
              </div>
            </div>

            <div className="flex justify-center pt-2 md:pt-3">
              <StatBlock value={bottom.value} label={bottom.label} align="center" />
            </div>
          </motion.div>

          <motion.div variants={item} className="w-full max-w-72 sm:max-w-xs">
            <Link
              href={homeOrbStatCenter.ctaHref}
              prefetch={false}
              className="btn-primary flex min-h-12 w-full items-center justify-center rounded-2xl border border-accent-deep/90 bg-linear-to-b from-accent to-accent-deep px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_14px_36px_-8px_color-mix(in_oklab,var(--color-accent)_55%,transparent)] transition hover:brightness-[1.05] hover:shadow-[0_18px_44px_-10px_color-mix(in_oklab,var(--color-accent)_50%,transparent)] sm:text-base"
            >
              {homeOrbStatCenter.ctaLabel}
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
