"use client";

import { usePathname } from "next/navigation";

function isAuthPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/public/login" || pathname.startsWith("/public/register");
}

/** Marks the public main column as auth (login/register) vs general site — used in globals.css. */
export function PublicZone({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const zone = isAuthPublicPath(pathname) ? "auth" : "site";

  return (
    <div
      data-public-zone={zone}
      className="public-zone min-w-0 flex flex-1 flex-col leading-relaxed antialiased"
    >
      {children}
    </div>
  );
}
