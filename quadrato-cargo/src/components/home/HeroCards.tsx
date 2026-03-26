"use client";

import { motion, useReducedMotion } from "framer-motion";
import { springSoft } from "@/lib/motion";
import { useMotionPreferences } from "@/lib/motion-preferences";
import { homeHeroCardData } from "@/lib/site-content";

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroVisual() {
  const reduce = useReducedMotion();
  const { allowAmbientMotion, allowHoverMotion } = useMotionPreferences();
  // Reuse the same motion contract as the hero copy block to avoid mixed UX signals.
  const canAnimateAmbient = allowAmbientMotion && !reduce;
  const canAnimateHover = allowHoverMotion && !reduce;

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-teal/10 via-transparent to-accent/5 blur-2xl"
        aria-hidden
        animate={canAnimateAmbient ? { scale: [1, 1.025, 1], y: [0, -6, 0] } : undefined}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg
        className="absolute left-4 top-8 hidden h-[calc(100%-4rem)] w-8 text-teal/30 md:block"
        viewBox="0 0 32 200"
        fill="none"
        aria-hidden
      >
        <motion.path
          d="M16 0 V200"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 8"
          initial={reduce ? undefined : { pathLength: 0, opacity: 0.4 }}
          animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease, delay: 0.5 }}
        />
        <motion.circle
          cx="16"
          cy="36"
          r="5"
          className="fill-teal/60"
          initial={reduce ? undefined : { scale: 0, opacity: 0 }}
          animate={reduce ? undefined : { scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.85 }}
        />
        <motion.circle
          cx="16"
          cy="100"
          r="5"
          className="fill-accent/60"
          initial={reduce ? undefined : { scale: 0, opacity: 0 }}
          animate={reduce ? undefined : { scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 1.05 }}
        />
        <motion.circle
          cx="16"
          cy="164"
          r="5"
          className="fill-white/30"
          initial={reduce ? undefined : { scale: 0, opacity: 0 }}
          animate={reduce ? undefined : { scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 1.25 }}
        />
      </svg>

      <div className="relative flex flex-col gap-4 pl-0 md:pl-10">
        {homeHeroCardData.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, x: 28, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.35 + i * 0.12,
              ease,
            }}
            whileHover={canAnimateHover ? { y: -5, scale: 1.02, transition: springSoft } : undefined}
            className={[
              "glass-panel transform-gpu rounded-2xl border p-4 shadow-xl transition-shadow duration-300",
              card.tone === "teal" && "border-teal/25 hover:border-teal/40 hover:shadow-teal/10",
              card.tone === "accent" && "border-accent/25 hover:border-accent/40 hover:shadow-accent/10",
              card.tone === "muted" && "border-border-strong hover:border-border",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-soft">
                  {card.label}
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-ink">
                  {card.status}
                </p>
              </div>
              <motion.span
                className={[
                  "rounded-lg px-2.5 py-1 font-mono text-xs font-medium tabular-nums",
                  card.tone === "teal" && "bg-teal-dim text-teal",
                  card.tone === "accent" && "bg-accent/15 text-accent",
                  card.tone === "muted" && "bg-pill text-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
                whileHover={canAnimateHover ? { scale: 1.05 } : undefined}
                transition={springSoft}
              >
                {card.time}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
