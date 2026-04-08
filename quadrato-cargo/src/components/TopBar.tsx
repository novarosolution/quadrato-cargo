"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Loader2, Menu, X } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authNav, mainNav, portalLoginNav } from "@/lib/nav";
import { QuadratoBrandLogo } from "@/components/QuadratoBrandLogo";
import { siteName } from "@/lib/site";
import { ThemeToggle } from "@/components/ThemeBtn";
import { postLogoutApi, type ApiUser } from "@/lib/api/auth-client";
import { getApiBaseUrl } from "@/lib/api/base-url";

class SessionLookupError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "SessionLookupError";
    if (options?.cause !== undefined) {
      // Keep the original fetch/parse error for debugging while exposing a stable message.
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

type HeaderAuthStatus = "loading" | "authenticated" | "unauthenticated";

function userInitial(name?: string | null, email?: string | null) {
  const n = (name ?? "").trim();
  if (n.length > 0) return n.slice(0, 1).toUpperCase();
  const e = (email ?? "").trim();
  if (e.length > 0) return e.slice(0, 1).toUpperCase();
  return "?";
}

async function fetchHeaderSessionUser(): Promise<ApiUser | null> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      credentials: "include"
    });
  } catch (error) {
    throw new SessionLookupError("Unable to reach auth service.", { cause: error });
  }

  let payload: { ok?: boolean; user?: ApiUser | null } = {};
  try {
    payload = (await response.json()) as { ok?: boolean; user?: ApiUser | null };
  } catch (error) {
    throw new SessionLookupError("Auth service returned invalid JSON.", { cause: error });
  }

  if (!response.ok || !payload.ok || !payload.user?.id) return null;
  return payload.user;
}

function HeaderNavLinkLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="inline-flex items-center gap-1.5">
      {pending ? (
        <Loader2
          className="h-3.5 w-3.5 shrink-0 animate-spin text-teal"
          aria-hidden
        />
      ) : null}
      <span className={pending ? "opacity-85" : undefined}>{label}</span>
      {pending ? <span className="sr-only">Loading page</span> : null}
    </span>
  );
}

function HeaderNavLink({
  href,
  label,
  active,
  onNavigate,
  comfortableTouch,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  /** Larger tap target for mobile drawer (zoom-friendly). */
  comfortableTouch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      data-active={active ? "true" : "false"}
      onClick={onNavigate}
      className={`nav-link inline-flex shrink-0 items-center rounded-lg px-2.5 py-1.5 text-[13px] font-semibold leading-snug tracking-[-0.01em] text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal data-[active=true]:font-bold data-[active=true]:text-teal lg:px-3.5 lg:text-[0.8125rem] ${
        comfortableTouch
          ? "min-h-11 px-3 py-2.5 text-sm font-medium lg:min-h-0 lg:px-3 lg:py-2 lg:text-sm"
          : ""
      }`}
    >
      <HeaderNavLinkLabel label={label} />
    </Link>
  );
}

function PortalLoginsDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative hidden shrink-0 lg:block" ref={wrapRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Log in options"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-elevated/80 px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:px-3.5 lg:text-sm"
      >
        Log in
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-[60] mt-2 w-[min(100vw-2rem,15rem)] origin-top-right rounded-2xl border border-border bg-surface-elevated/98 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-soft">
              Log in to
            </p>
            <div className="py-0.5">
              {portalLoginNav.map((item) => (
                <Link
                  key={item.href}
                  role="menuitem"
                  href={item.href}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-pill-hover"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AccountMenu({
  displayName,
  email,
  primaryLabel,
  pathname,
  onSignOut,
}: {
  displayName: string | null;
  email: string | null;
  primaryLabel: string;
  pathname: string;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-2xl border border-border bg-pill/90 p-1 backdrop-blur-sm transition hover:bg-pill-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-dim text-sm font-bold text-teal"
          aria-hidden
        >
          {userInitial(displayName, email)}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-[60] mt-2 w-[min(100vw-2rem,16rem)] origin-top-right rounded-2xl border border-border bg-surface-elevated/98 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-ink">{primaryLabel}</p>
              {email ? (
                <p className="mt-0.5 truncate text-xs text-muted-soft" title={email}>
                  {email}
                </p>
              ) : null}
            </div>
            <div className="py-1">
              <Link
                role="menuitem"
                href="/public/profile"
                prefetch={false}
                onClick={() => setOpen(false)}
                className={
                  pathname === "/public/profile"
                    ? "block rounded-xl bg-teal-dim px-3 py-2.5 text-sm font-semibold text-teal"
                    : "block rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-pill-hover"
                }
              >
                Profile
              </Link>
              <button
                role="menuitem"
                type="button"
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-pill-hover"
                onClick={async () => {
                  await onSignOut();
                  setOpen(false);
                }}
              >
                Sign out
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<HeaderAuthStatus>("loading");
  const [user, setUser] = useState<ApiUser | null>(null);
  const isAccountLoading = status === "loading";
  const signedIn = status === "authenticated" && Boolean(user?.id);
  const displayName = user?.name ?? null;
  const email = user?.email ?? null;
  const primaryLabel = displayName || email || "Account";
  const closeMobileMenu = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      mobileMenuButtonRef.current?.focus();
    });
  };
  const handleSignOut = async () => {
    await postLogoutApi();
    setUser(null);
    setStatus("unauthenticated");
    window.location.assign("/public/login");
  };

  useEffect(() => {
    let isMounted = true;

    // Header auth should never block navigation; failures gracefully fall back to guest mode.
    async function syncHeaderSession() {
      try {
        const sessionUser = await fetchHeaderSessionUser();
        if (!isMounted) return;
        setUser(sessionUser);
        setStatus(sessionUser ? "authenticated" : "unauthenticated");
      } catch {
        if (!isMounted) return;
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    syncHeaderSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

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
    // If scroll was ever left locked (Fast Refresh, interrupted navigation), restore it.
    document.body.style.removeProperty("overflow");
  }, [pathname, open]);

  return (
    <header className="site-header sticky top-0 z-50 border-b border-border-strong/70 bg-canvas/90 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/[0.04] backdrop-blur-2xl backdrop-saturate-[1.4] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]">
      {/* Utility row — brand + quick Track + account / log in + quote */}
      <div className="border-b border-border-strong/50 bg-linear-to-r from-teal/[0.08] via-canvas/55 to-canvas/95 dark:from-teal/[0.06] dark:via-canvas/45">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Link
              href="/public"
              aria-label={`${siteName} — home`}
              className="group inline-flex min-w-0 max-w-full items-center justify-start overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:overflow-visible"
            >
              <motion.span
                className="relative flex h-7 w-auto max-w-full min-w-0 items-center justify-start overflow-hidden bg-transparent sm:h-9 lg:h-10 lg:overflow-visible"
                initial={reduce ? false : { scale: 0.88, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.02 }}
                whileHover={reduce ? undefined : { scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <QuadratoBrandLogo variant="wordmark" className="h-full w-auto max-w-full" />
              </motion.span>
            </Link>
          </div>

          <div
            role="group"
            aria-label="Site actions"
            className="flex shrink-0 items-center justify-end gap-1 sm:gap-2 lg:gap-2.5"
          >
            <Link
              href="/public/tsking"
              prefetch={false}
              className="hidden shrink-0 rounded-full px-2.5 py-2 text-xs font-semibold text-teal transition hover:bg-pill-hover hover:text-ink lg:inline-flex lg:px-3 lg:text-sm"
            >
              Track
            </Link>
            <div className="hidden h-5 w-px shrink-0 bg-border lg:block" aria-hidden />
            <ThemeToggle className="h-9 w-9 shrink-0 rounded-xl" />
            {isAccountLoading ? (
              <span
                className="hidden h-9 w-9 shrink-0 items-center justify-center text-muted lg:inline-flex"
                role="status"
                aria-label="Loading account"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              </span>
            ) : signedIn ? (
              <div className="hidden shrink-0 lg:block">
                <AccountMenu
                  key={pathname}
                  displayName={displayName}
                  email={email}
                  primaryLabel={primaryLabel}
                  pathname={pathname}
                  onSignOut={handleSignOut}
                />
              </div>
            ) : (
              <PortalLoginsDropdown />
            )}
            <Link
              href="/public/contact"
              prefetch={false}
              aria-label="Get a Quote"
              className="btn-primary hidden h-9 shrink-0 items-center justify-center rounded-full bg-teal px-3 text-xs font-semibold text-slate-950 shadow-md shadow-teal/20 transition hover:bg-teal/90 sm:inline-flex sm:px-3.5 sm:text-sm lg:h-10 lg:px-4"
            >
              Get a Quote
            </Link>
            <button
              ref={mobileMenuButtonRef}
              type="button"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-ghost-fill p-2.5 text-ink transition hover:bg-pill-hover lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
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
      </div>

      {/* Main navigation row — full site map (desktop); mobile uses drawer */}
      <motion.div
        className="hidden border-b border-border-strong/40 bg-canvas/75 backdrop-blur-md lg:block"
        initial={reduce ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          className="mx-auto flex h-12 max-w-7xl min-h-0 items-center gap-0.5 overflow-x-auto overflow-y-hidden px-6 [scrollbar-width:none] lg:gap-1 lg:px-8 [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {mainNav.map((primaryNavEntry) => (
            <HeaderNavLink
              key={primaryNavEntry.href}
              href={primaryNavEntry.href}
              label={primaryNavEntry.label}
              active={pathname === primaryNavEntry.href}
            />
          ))}
        </nav>
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-nav"
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border lg:hidden"
          >
            <nav
              className="flex min-h-0 max-h-[min(82dvh,calc(100dvh-5.5rem))] flex-col gap-1 overflow-y-auto overscroll-y-contain bg-surface-elevated/98 px-4 py-5 backdrop-blur-xl [touch-action:pan-y]"
              style={{ overscrollBehavior: "contain" }}
              aria-label="Mobile main"
            >
              <div className="mb-2 flex flex-col gap-1 border-b border-border pb-3">
                <Link
                  href="/public/tsking"
                  prefetch={false}
                  onClick={closeMobileMenu}
                  className="block rounded-full px-3.5 py-2.5 text-sm font-semibold text-teal hover:bg-pill-hover"
                >
                  Track shipment
                </Link>
                <Link
                  href="/public/contact"
                  prefetch={false}
                  onClick={closeMobileMenu}
                  className="block rounded-full px-3.5 py-2.5 text-sm font-medium text-ink hover:bg-pill-hover"
                >
                  Get a Quote
                </Link>
              </div>
              {mainNav.map((primaryNavEntry, index) => (
                <motion.div
                  key={primaryNavEntry.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                >
                  <HeaderNavLink
                    href={primaryNavEntry.href}
                    label={primaryNavEntry.label}
                    active={pathname === primaryNavEntry.href}
                    onNavigate={closeMobileMenu}
                    comfortableTouch
                  />
                </motion.div>
              ))}
              <div className="my-2 border-t border-border pt-3">
                <p className="px-3.5 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-soft">
                  Account
                </p>
                {isAccountLoading ? (
                  <p className="px-3.5 py-2 text-sm text-muted">Loading…</p>
                ) : signedIn ? (
                  <div className="space-y-1 px-3.5">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-pill px-3 py-2.5">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-dim text-sm font-bold text-teal"
                        aria-hidden
                      >
                        {userInitial(displayName, email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {primaryLabel}
                        </p>
                        {email ? (
                          <p
                            className="truncate text-xs text-muted-soft"
                            title={email}
                          >
                            {email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      href="/public/profile"
                      prefetch={false}
                      onClick={closeMobileMenu}
                      className="block rounded-full py-2.5 text-sm font-medium text-teal hover:bg-pill-hover"
                    >
                      Your profile
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSignOut();
                        closeMobileMenu();
                      }}
                      className="block w-full rounded-full py-2.5 text-left text-sm font-medium text-ink hover:bg-pill-hover"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <>
                    {authNav.map((authNavEntry, index) => (
                      <motion.div
                        key={authNavEntry.href}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
                      >
                        <Link
                          href={authNavEntry.href}
                          prefetch={false}
                          onClick={closeMobileMenu}
                          className="block rounded-full px-3.5 py-2.5 text-sm font-medium text-ink hover:bg-pill-hover"
                        >
                          {authNavEntry.label}
                        </Link>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
