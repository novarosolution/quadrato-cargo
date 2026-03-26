"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postLogoutApi } from "@/lib/api/auth-client";

export function AgencyLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    if (pending) return;
    setPending(true);
    await postLogoutApi();
    router.push("/public/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="rounded-lg border border-border-strong bg-canvas/50 px-3 py-2 text-sm font-medium text-muted transition hover:bg-pill-hover hover:text-ink disabled:opacity-50"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
