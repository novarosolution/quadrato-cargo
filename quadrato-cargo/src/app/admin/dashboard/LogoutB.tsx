"use client";

import { useState } from "react";
import { adminUi } from "@/components/admin/admin-ui";
import { adminLogout } from "@/app/admin/login/actions";

export function AdminLogoutButton({ className = "" }: { className?: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function onLogout() {
    setIsLoggingOut(true);
    try {
      await adminLogout();
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
