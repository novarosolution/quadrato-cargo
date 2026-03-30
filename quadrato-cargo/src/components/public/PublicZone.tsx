"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/base-url";

function isAuthPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/public/login" || pathname.startsWith("/public/register");
}

/**
 * Marks the public main column as either auth flow (login/register) or general site,
 * and whether the visitor is signed in — used for distinct surfaces in globals.css.
 */
export function PublicZone({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const zone = isAuthPublicPath(pathname) ? "auth" : "site";
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, { credentials: "include" });
        const body = (await res.json()) as { ok?: boolean; user?: { id?: string } | null };
        if (!cancelled) setSignedIn(Boolean(res.ok && body?.ok && body?.user?.id));
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div
      data-public-zone={zone}
      {...(signedIn !== null ? { "data-signed-in": signedIn ? "true" : "false" } : {})}
      className="public-zone min-w-0 flex flex-1 flex-col"
    >
      {children}
    </div>
  );
}
