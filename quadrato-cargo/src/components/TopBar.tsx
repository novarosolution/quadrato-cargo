"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { authNav, mainNav } from "@/lib/nav";
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

function HeaderNavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      data-active={active ? "true" : "false"}
      onClick={onNavigate}
      className="nav-link shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal data-[active=true]:bg-pill data-[active=true]:text-ink lg:px-3.5 lg:py-2 lg:text-sm"
    >
      {label}
    </Link>
  );
}

const guestNavLinkClass =
  "shrink-0 rounded-full px-3 py-2 text-xs font-medium text-muted transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:px-3.5 lg:text-sm";

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
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-full items-center gap-1.5 rounded-2xl border border-border bg-pill/90 py-1 pl-1.5 pr-2 backdrop-blur-sm transition hover:bg-pill-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-dim text-sm font-bold text-teal"
          aria-hidden
        >
          {userInitial(displayName, email)}
        </span>
        <span className="hidden max-w-[6.5rem] truncate text-left text-xs font-semibold text-ink min-[900px]:inline lg:max-w-[9rem] lg:text-sm xl:max-w-[12rem]">
          {primaryLabel}
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
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<HeaderAuthStatus>("loading");
  const [user, setUser] = useState<ApiUser | null>(null);
  const isAccountLoading = status === "loading";
  const signedIn = status === "authenticated" && Boolean(user?.id);
  const displayName = user?.name ?? null;
  const email = user?.email ?? null;
  const primaryLabel = displayName || email || "Account";
  const closeMobileMenu = () => setOpen(false);
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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/75 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto grid h-[4.25rem] max-w-7xl grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex min-w-0 max-w-full items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:gap-2.5"
        >
          <motion.span
            className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal via-teal to-accent text-white shadow-lg shadow-teal/30 ring-1 ring-white/15 sm:h-10 sm:w-10"
            initial={reduce ? false : { scale: 0.88, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.02 }}
            whileHover={reduce ? undefined : { scale: 1.06, rotate: -2 }}
            whileTap={{ scale: 0.94 }}
          >
            <span
              className="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
            <LogoMark
              className="relative z-[1] h-[1.125rem] w-[1.125rem] drop-shadow-sm sm:h-5 sm:w-5"
              ambientPulse
            />
          </motion.span>
          <motion.span
            className="min-w-0 truncate font-display text-sm font-semibold tracking-tight text-ink sm:text-base lg:text-lg"
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            Quadrato Cargo
          </motion.span>
        </Link>

        <motion.nav
          className="glass-panel hidden min-h-0 min-w-0 justify-center justify-self-stretch overflow-x-auto overflow-y-hidden rounded-full border border-border px-1 py-1 [scrollbar-width:none] md:flex md:py-1.5 [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto flex w-max max-w-full items-center gap-0.5 px-0.5">
            {mainNav.map((primaryNavEntry) => (
              <HeaderNavLink
                key={primaryNavEntry.href}
                href={primaryNavEntry.href}
                label={primaryNavEntry.label}
                active={pathname === primaryNavEntry.href}
              />
            ))}
          </div>
        </motion.nav>

        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5 lg:gap-2">
          <div className="hidden items-center gap-1 sm:gap-1.5 md:flex lg:gap-2">
            <ThemeToggle />
            {isAccountLoading ? (
              <span className="w-8 px-1 text-center text-xs text-muted-soft" aria-hidden>
                …
              </span>
            ) : signedIn ? (
              <AccountMenu
                key={pathname}
                displayName={displayName}
                email={email}
                primaryLabel={primaryLabel}
                pathname={pathname}
                onSignOut={handleSignOut}
              />
            ) : (
              authNav.map((authNavEntry) => (
                <Link
                  key={authNavEntry.href}
                  href={authNavEntry.href}
                  className={
                    authNavEntry.href === "/public/register"
                      ? "btn-primary shrink-0 rounded-full bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-2.5 py-2 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal lg:px-3.5 lg:text-sm"
                      : guestNavLinkClass
                  }
                >
                  {authNavEntry.label}
                </Link>
              ))
            )}
            <Link
              href="/public/contact"
              aria-label="Get a quote"
              className="btn-primary inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-accent/20 sm:px-4 sm:py-2.5 sm:text-sm lg:px-5"
            >
              <span className="hidden lg:inline">Get a quote</span>
              <span className="lg:hidden" aria-hidden>
                Quote
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle className="h-9 w-9 rounded-xl" />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-ghost-fill p-2.5 text-ink transition hover:bg-pill-hover"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Toggle menu</span>
              {open ? (
                <X className="h-6 w-6" strokeWidth={2} aria-hidden />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-nav"
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <nav
              className="flex max-h-[min(70vh,calc(100dvh-5rem))] flex-col gap-1 overflow-y-auto bg-surface-elevated/98 px-4 py-5 backdrop-blur-xl"
              aria-label="Mobile main"
            >
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
                  authNav.map((authNavEntry, index) => (
                    <motion.div
                      key={authNavEntry.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
                    >
                      <Link
                        href={authNavEntry.href}
                        onClick={closeMobileMenu}
                        className="block rounded-full px-3.5 py-2.5 text-sm font-medium text-ink hover:bg-pill-hover"
                      >
                        {authNavEntry.label}
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>
              <Link
                href="/public/contact"
                className="btn-primary mt-1 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep to-accent px-4 py-3.5 text-sm font-semibold text-white"
                onClick={closeMobileMenu}
              >
                Get a quote
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
