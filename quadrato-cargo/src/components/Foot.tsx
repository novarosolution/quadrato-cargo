"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchAuthMeClient,
  postLogoutApi,
  type ApiUser,
} from "@/lib/api/auth-client";
import { fetchSiteSettings, type SiteSettings } from "@/lib/api/public-client";
import { useMotionPreferences } from "@/lib/motion-preferences";
import { QuadratoBrandLogo } from "@/components/QuadratoBrandLogo";
import { authNav, mainNav } from "@/lib/nav";

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

type FooterProps = {
  /** From server layout so phone/email match admin settings on first paint */
  initialSiteSettings?: SiteSettings | null;
};

export function Footer({ initialSiteSettings = null }: FooterProps) {
  const year = new Date().getFullYear();
  const router = useRouter();
  const reduce = useReducedMotion();
  const { allowHoverMotion } = useMotionPreferences();
  const canHoverMotion = allowHoverMotion && !reduce;
  const [authState, setAuthState] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [user, setUser] = useState<ApiUser | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(
    initialSiteSettings,
  );

  useEffect(() => {
    setSiteSettings(initialSiteSettings);
  }, [initialSiteSettings]);

  useEffect(() => {
    let cancelled = false;
    void fetchSiteSettings().then((s) => {
      if (!cancelled) setSiteSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAuthMeClient()
      .then((u) => {
        if (cancelled) return;
        if (u) {
          setUser(u);
          setAuthState("authenticated");
        } else {
          setUser(null);
          setAuthState("unauthenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setAuthState("unauthenticated");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="relative mt-auto border-t border-border bg-surface/90 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-teal/30"
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
              <motion.div
                className="relative w-full max-w-[260px] text-ink sm:max-w-[300px]"
                initial={reduce ? false : { scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 360, damping: 24 }}
                whileHover={canHoverMotion ? { scale: 1.02 } : undefined}
              >
                <QuadratoBrandLogo
                  variant="full"
                  className="h-12 w-auto max-w-full sm:h-14"
                  decorative={false}
                />
              </motion.div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              International courier service with simple booking and clear
              tracking updates.
            </p>
            <motion.div
              className="mt-8 inline-block"
              whileHover={canHoverMotion ? { y: -2 } : undefined}
              whileTap={canHoverMotion ? { scale: 0.98 } : undefined}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
            >
              <Link
                href="/public/contact"
                prefetch={false}
                className="btn-secondary inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
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
                      prefetch={false}
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
                {authState === "loading" ? (
                  <li className="text-sm text-muted-soft">…</li>
                ) : authState === "authenticated" && user ? (
                  <>
                    <motion.li
                      whileHover={canHoverMotion ? { x: 4 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <Link href="/public/profile" prefetch={false} className={footerLinkClass}>
                        Profile
                      </Link>
                    </motion.li>
                    <motion.li
                      whileHover={canHoverMotion ? { x: 4 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <button
                        type="button"
                        onClick={async () => {
                          await postLogoutApi();
                          setUser(null);
                          setAuthState("unauthenticated");
                          router.refresh();
                        }}
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
                      <Link href={item.href} prefetch={false} className={footerLinkClass}>
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
                  <dd className="mt-1 text-muted">
                    {siteSettings ? (
                      <a
                        href={`tel:${siteSettings.pdfSupportPhone.replace(/\s/g, "")}`}
                        className="transition hover:text-teal"
                      >
                        {siteSettings.pdfSupportPhone}
                      </a>
                    ) : (
                      <span className="text-muted-soft">…</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Email</dt>
                  <dd className="mt-1 space-y-1 text-muted">
                    {siteSettings ? (
                      <>
                        <a
                          href={`mailto:${siteSettings.pdfSupportEmail}`}
                          title={siteSettings.pdfSupportEmail}
                          className="block transition hover:text-teal"
                        >
                          {siteSettings.pdfSupportEmail}
                        </a>
                        {siteSettings.publicInfoEmail.trim() ? (
                          <a
                            href={`mailto:${siteSettings.publicInfoEmail.trim()}`}
                            title={siteSettings.publicInfoEmail.trim()}
                            className="block transition hover:text-teal"
                          >
                            {siteSettings.publicInfoEmail.trim()}
                          </a>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-muted-soft">…</span>
                    )}
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

        <div className="mt-14 border-t border-border pt-8">
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
        </div>
      </div>
    </footer>
  );
}
