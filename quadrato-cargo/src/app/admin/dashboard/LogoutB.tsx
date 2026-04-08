"use client";

import { useState } from "react";
import { adminUi } from "@/components/admin/admin-ui";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { csrfHeaderRecord } from "@/lib/api/csrf-headers";

export function AdminLogoutButton({ className = "" }: { className?: string }) {
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
      className={`${adminUi.btnLogout} disabled:opacity-60 ${className}`.trim()}
    >
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  );
}
