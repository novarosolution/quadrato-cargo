/**
 * Agency portal form & layout tokens — align with admin `admin-ui` for a consistent edit experience.
 */
import { adminUi } from "@/components/admin/admin-ui";

export const agencyUi = {
  /** Primary actions (save, verify) — high contrast on teal */
  btnPrimary:
    "inline-flex min-h-11 items-center justify-center rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-teal/25 transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-50",
  /** Grouped block inside a panel (one topic per block) */
  formBlock:
    "rounded-2xl border border-border-strong/45 bg-gradient-to-b from-surface-elevated/35 to-canvas/25 p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] backdrop-blur-sm sm:p-5 dark:from-surface-elevated/25 dark:to-canvas/20",
  formBlockTitle: "font-display text-sm font-semibold tracking-tight text-ink",
  formBlockHint: "mt-1 text-xs leading-relaxed text-muted",
  fieldStack: "mt-4 space-y-4",
  /** Sidebar help card */
  asideCard: `${adminUi.panelAccent} ${adminUi.panelPadding}`,
  asideTitle: "font-display text-sm font-semibold text-ink",
  asideList: "mt-3 space-y-2.5 text-sm leading-relaxed text-muted",
  asideLi: "flex gap-2",
  asideBullet: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal/70",
  asideFooterLink:
    "mt-5 inline-flex text-sm font-semibold text-teal transition hover:text-teal/85 hover:underline",
  /** Single-column workspace (forms, guide) */
  pageGrid: "mx-auto w-full max-w-3xl",
  /** Premium surface for main panels */
  panelSurface: `rounded-2xl border border-border-strong/90 bg-linear-to-b from-surface-elevated/88 to-surface-elevated/52 p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.22),0_12px_40px_-28px_rgba(0,0,0,0.18)] ring-1 ring-white/[0.05] backdrop-blur-md sm:p-8 dark:from-surface-elevated/42 dark:to-surface-elevated/22 dark:shadow-black/40 dark:ring-white/[0.04]`,
  panelHeader: "mb-6 border-b border-border-strong/50 pb-5",
  panelTitle: adminUi.sectionTitleSm,
  panelSubtitle: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
  actionsBar:
    "mt-8 flex flex-col gap-3 border-t border-border-strong/70 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
  messageOk: "text-sm font-medium text-teal",
  messageErr: "text-sm font-medium text-rose-400 dark:text-rose-300",
  /** Intake / data table chrome (pair with overflow-x-auto on parent) */
  tableWrap:
    "rounded-2xl border border-border-strong/60 bg-surface-elevated/20 shadow-sm backdrop-blur-sm",
  tableHead: "border-b border-border-strong/80 bg-surface-elevated/90",
} as const;
