"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { roleUi } from "@/components/role/role-ui";
import { postLogoutApi } from "@/lib/api/auth-client";
import { agencyLogoutCopy } from "@/lib/agency-content";

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
      className={`${roleUi.signOutBtn} disabled:opacity-50`}
    >
      {pending ? agencyLogoutCopy.pending : agencyLogoutCopy.label}
    </button>
  );
}
