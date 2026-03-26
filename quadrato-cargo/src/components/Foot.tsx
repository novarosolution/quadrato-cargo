"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api/public-client";
import { useMotionPreferences } from "@/lib/motion-preferences";
import { authNav, mainNav } from "@/lib/nav";

function ApiHealthLine() {
  const [label, setLabel] = useState("Checking API…");

  useEffect(() => {
    let cancelled = false;
    // Footer status is informational only; ignore failures to avoid noisy UI errors.
    fetchHealth()
      .then((h) => {
        if (!cancelled) {
          setLabel(
            h.ok ? `API online · ${h.service}` : "API responded unexpectedly",
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLabel("API unreachable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p className="text-xs text-muted-soft" aria-live="polite">
      {label}
    </p>
  );
}

const footerLinkClass =
  "text-sm font-medium text-muted transition hover:text-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

const colVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Footer() {
  const year = new Date().getFullYear();
  const reduce = useReducedMotion();
  const { allowHoverMotion } = useMotionPreferences();
  const canHoverMotion = allowHoverMotion && !reduce;
  const [status] = useState<"loading" | "authenticated" | "unauthenticated">(
    "unauthenticated",
  );
  const signedIn = false;

  return (
    <footer className="relative mt-auto border-t border-border bg-surface/90 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <motion.div
            className="lg:col-span-5"
            variants={colVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal via-teal to-accent text-white shadow-md shadow-teal/25 ring-1 ring-white/15"
                initial={reduce ? false : { scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 360, damping: 24 }}
                whileHover={canHoverMotion ? { scale: 1.08, rotate: -4 } : undefined}
              >
                <span
                  className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50"
                  aria-hidden
                />
                <LogoMark className="relative z-[1] h-5 w-5 drop-shadow-sm" />
              </motion.span>
              <motion.p
                className="font-display text-xl font-semibold tracking-tight text-ink"
                initial={reduce ? false : { opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                Quadrato Cargo
              </motion.p>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              International courier at your doorstep: book with your PIN, choose
              instant pickup (~10 minute target where we cover) or a scheduled
              window, then our team handles collection through partner handoff —
              consignment numbers and QR-ready receipts.
            </p>
            <motion.div
              className="mt-8 inline-block"
              whileHover={canHoverMotion ? { y: -2 } : undefined}
              whileTap={canHoverMotion ? { scale: 0.98 } : undefined}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
            >
              <Link
                href="/public/contact"
                className="btn-primary inline-flex rounded-full border border-ghost-border bg-ghost-fill px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/30 hover:bg-pill-hover"
              >
                Start a conversation
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="grid gap-10 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.12, delayChildren: 0.06 },
              },
            }}
          >
            <motion.nav variants={colVariants} aria-label="Footer">
              <p className="section-eyebrow text-muted-soft">Explore</p>
              <ul className="mt-4 flex flex-col gap-3">
                {mainNav.map((item) => (
                  <motion.li
                    key={item.href}
                    whileHover={canHoverMotion ? { x: 4 } : undefined}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  >
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-muted transition hover:text-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
            <motion.nav variants={colVariants} aria-label="Account">
              <p className="section-eyebrow text-muted-soft">Account</p>
              <ul className="mt-4 flex flex-col gap-3">
                {status === "loading" ? (
                  <li className="text-sm text-muted-soft">…</li>
                ) : signedIn ? (
                  <>
                    <motion.li
                      whileHover={canHoverMotion ? { x: 4 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <Link href="/public/profile" className={footerLinkClass}>
                        Profile
                      </Link>
                    </motion.li>
                    <motion.li
                      whileHover={canHoverMotion ? { x: 4 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <button
                        type="button"
                        onClick={() => {}}
                        className={`${footerLinkClass} text-left`}
                      >
                        Sign out
                      </button>
                    </motion.li>
                  </>
                ) : (
                  authNav.map((item) => (
                    <motion.li
                      key={item.href}
                      whileHover={canHoverMotion ? { x: 4 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <Link href={item.href} className={footerLinkClass}>
                        {item.label}
                      </Link>
                    </motion.li>
                  ))
                )}
              </ul>
            </motion.nav>
            <motion.div variants={colVariants}>
              <p className="section-eyebrow text-muted-soft">Dispatch</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-ink">Phone</dt>
                  <dd className="mt-1 text-muted">+1 (555) 010-0199</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Email</dt>
                  <dd className="mt-1 space-y-1 text-muted">
                    <a
                      href="mailto:info@quadratocargo.com"
                      title="info@quadratocargo.com"
                      className="block transition hover:text-teal"
                    >
                      info@quadratocargo.com
                    </a>
                    <a
                      href="mailto:support@quadratocargo.com"
                      className="block transition hover:text-teal"
                    >
                      support@quadratocargo.com
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Hours</dt>
                  <dd className="mt-1 text-muted">Mon–Fri 7:00–19:00 local</dd>
                </div>
              </dl>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-soft">
              © {year} Quadrato Cargo. All rights reserved.
            </p>
            <p className="mt-1 text-[11px] text-muted-soft/80">
              Developed by{" "}
              <a
                href="https://novarosolution.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="text-muted-soft underline-offset-2 transition hover:text-teal hover:underline"
              >
                NovaRo Solution
              </a>
              .
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <ApiHealthLine />
          </div>
        </div>
      </div>
    </footer>
  );
}
