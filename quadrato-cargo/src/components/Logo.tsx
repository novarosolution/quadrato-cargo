"use client";

import { motion, useReducedMotion } from "framer-motion";

type LogoMarkProps = {
  className?: string;
  /** Soft idle pulse on the tracking dot (header only). */
  ambientPulse?: boolean;
};

/**
 * Quadrato Cargo wordmark icon — isometric parcel with route accent.
 * Uses currentColor (typically white on the brand gradient tile).
 */
export function LogoMark({ className = "", ambientPulse = false }: LogoMarkProps) {
  const reduce = useReducedMotion();
  // Respect reduced-motion globally so logo animation never becomes a distraction.
  const pulse = ambientPulse && !reduce;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M6 13.5 L16 7.5 L26 13.5 V23.5 C26 24.88 24.88 26 23.5 26 H8.5 C7.12 26 6 24.88 6 23.5 V13.5Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path
        d="M6 13.5 H26"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <path
        d="M16 7.5 V26"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity={0.88}
      />
      <path
        d="M10.5 18.5 H20.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.72}
      />
      <path
        d="M10.5 21.5 H17"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.55}
      />
      {pulse ? (
        <motion.circle
          cx="22.5"
          cy="17"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0.45 }}
          animate={{
            opacity: [0.45, 1, 0.45],
            scale: [0.92, 1.12, 0.92],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ) : (
        <circle cx="22.5" cy="17" r="2" fill="currentColor" opacity={0.72} />
      )}
      <path
        d="M24 9.5 L27.5 7.5 L27.5 11.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
    </svg>
  );
}
