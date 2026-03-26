/** Shared easing & variants for Framer Motion (respect prefers-reduced-motion in components). */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export const springSoft = { type: "spring" as const, stiffness: 280, damping: 24 };

export const staggerContainer = (stagger = 0.09, delayChildren = 0.04) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const fadeUpItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

export const fadeUpTight = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: easeOutExpo },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.48, ease: easeOutExpo },
  },
};
