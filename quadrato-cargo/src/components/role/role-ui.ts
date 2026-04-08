/**
 * Shared UI tokens for agency & courier portals — aligned with admin header rhythm
 * ([`admin-ui.ts`](../admin/admin-ui.ts)) without importing admin-specific nav structure.
 */
import { adminUi } from "@/components/admin/admin-ui";

export const roleUi = {
  /** Sticky bar; same border/gradient family as admin `headerShell`. */
  headerShell: `sticky top-0 z-30 ${adminUi.headerShell}`,

  /** Inner row: max width and horizontal padding match admin shell. */
  headerInner:
    "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8",

  brandBlock: "min-w-0 max-w-xl",
  brandTitle: "font-display text-lg font-semibold tracking-tight text-ink sm:text-xl",
  brandMeta: "text-xs text-muted-soft",
  brandDetail: "mt-1 text-xs leading-relaxed text-muted",
  brandHint: "mt-1 text-[11px] text-muted-soft",

  navCluster: "flex flex-wrap items-center gap-2",

  /** Use with `adminUi.navPillBase` + active/idle pills — see `AgencyNav` / `CourierNav`. */
  signOutBtn: adminUi.btnLogout,

  /** Main column — same width and padding as [`admin/layout.tsx`](../../app/admin/layout.tsx) `main`. */
  main: "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 leading-relaxed antialiased",

  /** Tables & wide data — matches admin `tableScrollPlain` for consistent chrome. */
  tableWrap: adminUi.tableScrollPlain,
} as const;

export function roleClass(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
