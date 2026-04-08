"use client";

import { usePathname } from "next/navigation";
import { AdminAppHeader } from "./dashboard/AdminAppHeader";

/** Routes that render without the global admin header (standalone auth screens). */
const BARE_PATHS = new Set(["/admin/login"]);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname != null && BARE_PATHS.has(pathname);

  if (bare) {
    return (
      <div className="admin-login-shell min-h-screen bg-canvas text-ink leading-relaxed antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell admin-app-shell admin-shell-premium min-h-screen bg-canvas text-ink">
      <AdminAppHeader />
      <main className="admin-main relative z-1 mx-auto min-h-[50vh] max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 leading-relaxed antialiased">
        {children}
      </main>
    </div>
  );
}
