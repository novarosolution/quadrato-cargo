"use client";

import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { csrfHeaderRecord } from "@/lib/api/csrf-headers";

export function AdminLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function onLogout() {
    setIsLoggingOut(true);
    try {
      await fetch(`${getApiBaseUrl()}/api/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaderRecord(),
        },
        body: "{}",
      });
    } finally {
      setIsLoggingOut(false);
      window.location.assign("/admin/login");
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={isLoggingOut}
      className="rounded-lg border border-ghost-border px-3 py-2 text-sm font-medium text-muted transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-60"
    >
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  );
}
