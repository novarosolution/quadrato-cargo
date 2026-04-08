"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminClass, adminUi } from "@/components/admin/admin-ui";
import { adminNavSections } from "@/lib/admin-nav";

export function AdminNav({
  "aria-labelledby": ariaLabelledby,
  variant = "rail",
  onNavigate,
}: {
  "aria-labelledby"?: string;
  /** `drawer`: stacked links for mobile menu. */
  variant?: "rail" | "drawer";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isDrawer = variant === "drawer";

  return (
    <nav
      className={isDrawer ? "flex w-full flex-col gap-1" : adminUi.navRow}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabelledby ? undefined : "Admin sections"}
    >
      {adminNavSections.map((section, si) => (
        <Fragment key={section.id}>
          {si > 0 && !isDrawer ? (
            <span className={adminUi.navSectionDivider} aria-hidden />
          ) : null}
          {isDrawer && si > 0 ? (
            <div
              className="my-2 border-t border-border pt-2"
              aria-hidden
            />
          ) : null}
          {section.items.map(({ href, label, hint, Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                title={hint}
                aria-current={isActive ? "page" : undefined}
                onClick={onNavigate}
                className={adminClass(
                  adminUi.navPillBase,
                  isDrawer && "w-full justify-start",
                  isActive ? adminUi.navPillActive : adminUi.navPill,
                )}
              >
                <Icon
                  className={isActive ? adminUi.navIconActive : adminUi.navIconMuted}
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </Fragment>
      ))}
    </nav>
  );
}
