"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUpTight, staggerContainer } from "@/lib/motion";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  // Keep alignment class local here so page sections can stay copy-focused.
  const alignCls = align === "center" ? "mx-auto text-center" : "";

  return (
    <motion.div
      className={`max-w-3xl ${alignCls} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainer(0.11, 0)}
    >
      <motion.p variants={fadeUpTight} className="section-eyebrow">
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUpTight}
        className="type-display-premium mt-3 text-balance text-3xl sm:text-4xl lg:text-[2.5rem] lg:leading-[1.12] xl:text-[2.75rem]"
      >
        {title}
      </motion.h2>
      {description ? (
        <motion.p
          variants={fadeUpTight}
          className="mt-4 text-base leading-relaxed text-muted sm:text-lg"
        >
          {description}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
