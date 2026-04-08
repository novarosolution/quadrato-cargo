"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
import { roleUi } from "@/components/role/role-ui";
import { CourierLogoutButton } from "./Logoutb";

export function CourierNav({ email }: { email: string }) {
  const pathname = usePathname();
  const jobsActive = pathname === "/courier";

  return (
    <header className={roleUi.headerShell}>
      <div className={roleUi.headerInner}>
        <div className={roleUi.brandBlock}>
          <p className={roleUi.brandTitle}>Courier</p>
          <p className={roleUi.brandMeta}>Assigned deliveries · {email}</p>
        </div>
        <div className={roleUi.navCluster}>
          <Link
            href="/courier"
            prefetch={false}
            aria-current={jobsActive ? "page" : undefined}
            className={adminClass(
              adminUi.navPillBase,
              jobsActive ? adminUi.navPillActive : adminUi.navPill,
            )}
          >
            My jobs
          </Link>
          <CourierLogoutButton />
        </div>
      </div>
    </header>
  );
}
