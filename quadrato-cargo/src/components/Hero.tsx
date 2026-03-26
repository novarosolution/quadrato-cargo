"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Container } from "@/components/Wrap";
import { fadeUpItem, staggerContainer } from "@/lib/motion";
import { useMotionPreferences } from "@/lib/motion-preferences";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  const reduce = useReducedMotion();
  const { allowAmbientMotion } = useMotionPreferences();
  // Keep subtle ambient cues only when the user/device can afford motion.
  const canAnimateAmbient = allowAmbientMotion && !reduce;

  return (
    <section className="relative overflow-hidden border-b border-border">
      <motion.div
        className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-teal/10 blur-[70px]"
        aria-hidden
        initial={false}
        animate={canAnimateAmbient ? { scale: [1, 1.06, 1], y: [0, -8, 0] } : {}}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-accent/5 blur-[60px]"
        aria-hidden
        initial={false}
        animate={canAnimateAmbient ? { scale: [1, 1.05, 1], x: [0, 10, 0] } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.1, 0.06)}
        >
          {eyebrow ? (
            <motion.p variants={fadeUpItem} className="section-eyebrow">
              {eyebrow}
            </motion.p>
          ) : null}
          <motion.h1
            variants={fadeUpItem}
            className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
          >
            {title}
          </motion.h1>
          {description ? (
            <motion.div
              variants={fadeUpItem}
              className="mt-5 max-w-2xl text-lg leading-relaxed text-muted"
            >
              {description}
            </motion.div>
          ) : null}
        </motion.div>
      </Container>
    </section>
  );
}
