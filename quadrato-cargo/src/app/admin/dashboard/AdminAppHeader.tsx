"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
import { QuadratoBrandLogo } from "@/components/QuadratoBrandLogo";
import { ThemeToggle } from "@/components/ThemeBtn";
import { siteName } from "@/lib/site";
import { AdminLogoutButton } from "./LogoutB";
import { AdminNav } from "./Nav";

function AdminBrandLink() {
  return (
    <Link
      href="/admin/dashboard"
      className="group inline-flex min-w-0 max-w-full items-center justify-start gap-3 overflow-hidden rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:overflow-visible"
    >
      <span className="shrink-0 rounded-none border border-border-strong/50 bg-canvas/30 p-1.5 opacity-90 transition group-hover:opacity-100">
        <QuadratoBrandLogo variant="mark" className="h-8 w-8 sm:h-9 sm:w-9" decorative />
      </span>
      <span className="min-w-0">
        <span className={adminUi.headerEyebrow}>Admin</span>
        <span className={`block truncate ${adminUi.headerBrandTitle}`}>{siteName}</span>
      </span>
    </Link>
  );
}

function AdminNavRail({ id }: { id?: string }) {
  return (
    <div className={adminClass(adminUi.navRail)}>
      <div className={adminUi.headerNavScroll}>
        <AdminNav aria-labelledby={id} />
      </div>
    </div>
  );
}

export function AdminAppHeader() {
  const reduce = useReducedMotion();
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const closeMobileMenu = () => {
    setOpen(false);
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (media.matches) setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (prev) document.body.style.overflow = prev;
      else document.body.style.removeProperty("overflow");
    };
  }, [open]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) return;
    document.body.style.removeProperty("overflow");
  }, [open]);

  return (
    <header className={adminUi.headerShell}>
      <div className={adminUi.headerInner}>
        {/* Phone / tablet: brand left — theme + menu right (matches public header) */}
        <div className="flex w-full min-w-0 items-center justify-between gap-3 lg:hidden">
          <div className="flex min-w-0 flex-1 items-center justify-start pr-2">
            <AdminBrandLink />
          </div>
          <div
            role="group"
            aria-label="Site actions"
            className="flex shrink-0 items-center justify-end gap-2"
          >
            <ThemeToggle className={adminUi.toolbarIconBtn} />
            <button
              ref={mobileMenuButtonRef}
              type="button"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl border border-border-strong/85 bg-linear-to-b from-canvas/60 to-canvas/35 p-2.5 text-ink shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] transition hover:border-teal/40 hover:bg-pill-hover dark:from-canvas/45 dark:to-canvas/25"
              aria-expanded={open}
              aria-controls="admin-mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <X className="h-6 w-6" strokeWidth={2} aria-hidden />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Desktop: brand | nav | theme + log out */}
        <div className="mt-4 hidden min-w-0 w-full items-center gap-4 lg:mt-0 lg:flex xl:gap-6">
          <div className="shrink-0 lg:max-w-[min(280px,34vw)] xl:max-w-xs">
            <AdminBrandLink />
          </div>
          <div className="min-w-0 flex-1 border-t-0 pt-0">
            <p className="sr-only" id="admin-main-nav-heading">
              Main navigation
            </p>
            <AdminNavRail id="admin-main-nav-heading" />
          </div>
          <div
            role="group"
            aria-label="Site actions"
            className="flex shrink-0 items-center justify-end gap-2"
          >
            <ThemeToggle className={adminUi.toolbarIconBtn} />
            <AdminLogoutButton />
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              key="admin-mobile-nav"
              id="admin-mobile-nav"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-border-strong lg:hidden"
            >
              <nav
                className="flex max-h-[min(82dvh,calc(100dvh-5.5rem))] min-h-0 flex-col gap-4 overflow-y-auto overscroll-y-contain bg-surface-elevated/95 px-3 py-4 backdrop-blur-xl"
                aria-label="Admin menu"
              >
                <p className="sr-only" id="admin-mobile-nav-heading">
                  Main navigation
                </p>
                <AdminNav
                  variant="drawer"
                  aria-labelledby="admin-mobile-nav-heading"
                  onNavigate={closeMobileMenu}
                />
                <div className="border-t border-border pt-3">
                  <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-soft">
                    Session
                  </p>
                  <div className="px-1">
                    <AdminLogoutButton className="w-full justify-center" />
                  </div>
                </div>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
