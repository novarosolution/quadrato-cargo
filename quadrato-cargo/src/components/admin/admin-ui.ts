/**
 * Admin UI tokens — change these class strings to reskin every admin page that imports them.
 * Prefer importing from here (or AdminPrimitives) over copying long Tailwind chains into pages.
 */
export const adminUi = {
  page: "stack-page content-wide",
  pageNarrow: "stack-page content-narrow gap-10 max-sm:gap-8",

  panel:
    "rounded-2xl border border-border-strong/90 bg-linear-to-b from-surface-elevated/92 to-surface-elevated/58 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.28),0_12px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.06] backdrop-blur-md dark:from-surface-elevated/72 dark:to-surface-elevated/45 dark:shadow-black/40 dark:ring-white/[0.04]",
  panelPadding: "p-5 sm:p-6 md:p-7",
  panelMuted:
    "rounded-2xl border border-border-strong/80 bg-surface-elevated/50 backdrop-blur-md ring-1 ring-black/[0.03] dark:ring-white/[0.04]",
  panelAccent:
    "rounded-2xl border border-teal/30 bg-linear-to-br from-teal/[0.09] via-teal/[0.04] to-transparent shadow-[0_4px_28px_-10px_color-mix(in_oklab,var(--color-teal)_28%,transparent),0_0_0_1px_color-mix(in_oklab,var(--color-teal)_12%,transparent)] backdrop-blur-md dark:from-teal/15 dark:via-teal/8 dark:shadow-[0_8px_36px_-16px_rgba(0,0,0,0.5)]",

  collapsible:
    "rounded-2xl border border-border-strong/85 bg-linear-to-b from-surface-elevated/70 to-surface-elevated/45 shadow-sm backdrop-blur-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]",

  filterForm:
    "flex flex-col gap-4 rounded-2xl border border-border-strong/85 bg-linear-to-b from-surface-elevated/65 to-surface-elevated/40 p-4 shadow-sm backdrop-blur-sm ring-1 ring-black/[0.03] lg:flex-row lg:flex-wrap lg:items-end dark:ring-white/[0.04]",

  tableScroll:
    "overflow-x-auto rounded-2xl border border-border-strong/90 bg-surface-elevated/35 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] backdrop-blur-sm dark:bg-surface-elevated/25 dark:shadow-black/35 dark:ring-white/[0.05]",
  tableScrollPlain:
    "overflow-x-auto rounded-2xl border border-border-strong/90 bg-surface-elevated/30 backdrop-blur-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]",

  thead:
    "sticky top-0 z-10 border-b border-border-strong/90 bg-linear-to-b from-surface-elevated/98 to-surface-elevated/88 backdrop-blur-xl dark:from-surface-elevated/95 dark:to-surface-elevated/80",
  theadSimple: "border-b border-border-strong bg-surface-elevated/85 backdrop-blur-md",

  th: "px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-soft",
  thRelaxed: "px-4 py-3 font-medium text-muted-soft",

  label: "text-[11px] font-bold uppercase tracking-[0.14em] text-muted-soft",
  labelBlock: "block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-soft",

  input:
    "w-full rounded-xl border border-border-strong/90 bg-linear-to-b from-canvas/65 to-canvas/40 px-4 py-3 text-sm text-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition focus:border-teal/55 focus:outline-none focus:ring-2 focus:ring-teal/30 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
  /** Slightly shorter control for filter toolbars */
  inputFilter:
    "w-full rounded-xl border border-border-strong/90 bg-linear-to-b from-canvas/60 to-canvas/35 px-4 py-2.5 text-sm text-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition focus:border-teal/55 focus:outline-none focus:ring-2 focus:ring-teal/30",
  select:
    "w-full rounded-xl border border-border-strong/90 bg-linear-to-b from-canvas/60 to-canvas/35 px-3 py-2.5 text-sm text-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition focus:border-teal/55 focus:outline-none focus:ring-2 focus:ring-teal/30",
  selectMt:
    "mt-2 w-full rounded-xl border border-border-strong/90 bg-linear-to-b from-canvas/60 to-canvas/35 px-3 py-2.5 text-sm text-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition focus:border-teal/55 focus:outline-none focus:ring-2 focus:ring-teal/30",

  btnPrimary:
    "rounded-xl bg-linear-to-b from-teal to-teal/88 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_4px_20px_-4px_color-mix(in_oklab,var(--color-teal)_45%,transparent),0_0_0_1px_color-mix(in_oklab,var(--color-teal)_35%,transparent)] transition hover:brightness-[1.06] active:scale-[0.99] dark:text-slate-950",
  btnSecondary:
    "inline-flex items-center justify-center rounded-xl border border-border-strong/90 bg-linear-to-b from-canvas/55 to-canvas/30 px-4 py-2.5 text-sm font-medium text-muted shadow-sm transition hover:border-teal/35 hover:bg-pill-hover hover:text-ink hover:shadow-md",

  sectionTitle: "type-display-premium text-lg tracking-tight",
  sectionTitleSm: "type-display-premium text-base tracking-tight",
  sectionTitleXs: "type-display-premium text-sm tracking-tight",
  sectionDesc: "mt-1 text-xs leading-snug text-muted-soft",
  sectionDescSm: "mt-0.5 text-xs leading-snug text-muted-soft sm:text-sm",

  stepNeutral:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas font-bold text-muted-soft ring-1 ring-border-strong",
  stepTeal:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/20 text-sm font-bold text-teal",

  presetBase: "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition",
  presetActive: "border-teal/50 bg-teal/15 text-ink",
  presetIdle:
    "border-border-strong bg-canvas/40 text-muted hover:border-teal/35 hover:bg-pill-hover hover:text-ink",
  presetClear:
    "inline-flex items-center rounded-full border border-dashed border-border-strong px-3 py-1.5 text-xs font-medium text-muted-soft hover:border-teal/30 hover:text-ink",

  empty:
    "rounded-2xl border border-dashed border-border-strong/70 bg-surface-elevated/35 px-4 py-12 text-center text-sm text-muted backdrop-blur-sm",

  rowCard:
    "rounded-2xl border border-border-strong/85 bg-linear-to-b from-surface-elevated/65 to-surface-elevated/45 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm dark:ring-white/[0.04]",
  trHover: "transition-colors duration-200 hover:bg-pill-hover/90",
  trHoverBorder: "border-b border-border transition-colors duration-200 hover:bg-pill-hover/80",

  statCard:
    "group relative overflow-hidden rounded-2xl border border-border-strong/90 bg-linear-to-br from-surface-elevated/88 via-surface-elevated/65 to-surface-elevated/48 p-6 shadow-[0_8px_32px_-20px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.05] transition duration-300 hover:-translate-y-0.5 hover:border-teal/45 hover:shadow-[0_16px_48px_-24px_rgba(0,0,0,0.38),0_0_0_1px_color-mix(in_oklab,var(--color-teal)_22%,transparent),0_0_40px_-12px_color-mix(in_oklab,var(--color-teal)_18%,transparent)] dark:from-surface-elevated/75 dark:via-surface-elevated/55 dark:to-surface-elevated/38 dark:ring-white/[0.06]",
  /** Static summary tile (no hover chrome) */
  statTile:
    "rounded-2xl border border-border-strong/90 bg-linear-to-b from-surface-elevated/80 to-surface-elevated/55 p-6 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm dark:ring-white/[0.05]",

  divider: "border-t border-border-strong",
  dividerSoft: "border-t border-border",
  kicker: "text-xs font-semibold uppercase tracking-wide text-muted-soft",

  /** Global admin header chrome */
  headerShell:
    "sticky top-0 z-40 border-b border-border-strong/80 bg-linear-to-b from-surface-elevated/99 via-surface-elevated/96 to-surface-elevated/88 shadow-[0_1px_0_0_color-mix(in_oklab,var(--color-teal)_14%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.08),0_12px_40px_-18px_rgba(0,0,0,0.28)] backdrop-blur-xl dark:shadow-[0_1px_0_0_color-mix(in_oklab,var(--color-teal)_20%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.04),0_16px_48px_-22px_rgba(0,0,0,0.55)]",
  headerInner: "mx-auto max-w-7xl px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8 lg:py-5",
  /** One header bar: brand | sections+nav | toolbar on lg+; stacked on small screens */
  headerUnified:
    "flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4 xl:gap-6",
  headerBrandRow:
    "order-1 flex min-w-0 items-start justify-between gap-3 lg:max-w-[min(280px,34vw)] lg:shrink-0 xl:max-w-xs",
  headerBrandBlock: "min-w-0",
  /** Uses global `.section-eyebrow` (teal uppercase kicker) */
  headerEyebrow: "section-eyebrow mb-1 block",
  headerBrandTitle:
    "font-display text-xl font-bold tracking-tight text-ink sm:text-2xl sm:tracking-tighter",
  headerBrandSub: "mt-1.5 max-w-[22rem] text-xs leading-relaxed text-muted-soft",
  /** Nav block: sits between brand and toolbar on large screens */
  headerNavBlock:
    "order-3 min-w-0 border-t border-border pt-3 lg:order-2 lg:flex-1 lg:border-t-0 lg:pt-0",
  /** Wraps scroll row — inset rail on lg+; flat on small screens */
  navRail:
    "w-full min-w-0 flex-1 max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none rounded-2xl border border-border-strong/50 bg-linear-to-b from-canvas/50 to-canvas/18 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_20px_-12px_rgba(0,0,0,0.15)] dark:from-canvas/35 dark:to-canvas/12 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_6px_24px_-14px_rgba(0,0,0,0.4)]",
  headerNavScroll:
    "min-w-0 flex-1 overflow-x-auto overscroll-x-contain py-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:px-0.5",
  /** Desktop-only toolbar column (mobile uses headerToolbarMobile) */
  headerToolbarDesktop: "order-2 hidden shrink-0 items-center gap-2 lg:order-3 lg:flex",
  headerToolbarMobile: "flex shrink-0 gap-2 lg:hidden",
  navRow: "flex flex-nowrap items-center gap-1 sm:gap-1.5 pr-0.5",
  /** Between nav groups (Overview | Operations | …) */
  navSectionDivider:
    "mx-0.5 hidden h-7 w-px shrink-0 bg-linear-to-b from-transparent via-border-strong/55 to-transparent sm:block",
  navPillBase:
    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition sm:px-3.5 sm:py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
  navPill:
    "border-transparent bg-transparent text-muted ring-1 ring-transparent hover:border-border-strong/60 hover:bg-pill-hover hover:text-ink",
  navPillActive:
    "border-teal/55 bg-linear-to-b from-teal to-teal/90 text-slate-950 shadow-[0_4px_16px_-4px_color-mix(in_oklab,var(--color-teal)_50%,transparent)] ring-1 ring-white/25",
  navIconMuted: "h-4 w-4 shrink-0 opacity-80",
  navIconActive: "h-4 w-4 shrink-0 text-slate-950",

  /** Toolbar controls (theme, logout) */
  toolbarIconBtn:
    "h-10 w-10 shrink-0 rounded-xl border border-border-strong/85 bg-linear-to-b from-canvas/60 to-canvas/35 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] transition hover:border-teal/40 hover:bg-pill-hover hover:shadow-md dark:from-canvas/45 dark:to-canvas/25",
  btnLogout:
    "inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border-strong/85 bg-linear-to-b from-canvas/55 to-canvas/30 px-4 text-sm font-medium text-muted shadow-sm transition hover:border-rose-500/50 hover:bg-rose-500/12 hover:text-rose-200 hover:shadow-md dark:from-canvas/40 dark:to-canvas/22 dark:hover:text-rose-300",

  /** Dashboard / toolbar text buttons with icon */
  btnSecondaryIcon:
    "inline-flex items-center gap-2 rounded-xl border border-border-strong/90 bg-linear-to-b from-canvas/55 to-canvas/32 px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-teal/45 hover:bg-pill-hover hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",

  /** Small shortcut chips (same family as filter presets) */
  shortcutPill: "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
  shortcutPillIdle:
    "border-border-strong bg-canvas/45 text-muted hover:border-teal/35 hover:bg-pill-hover hover:text-ink",

  /** Admin database / connection error card */
  errorPanel:
    "rounded-2xl border border-rose-500/40 bg-linear-to-br from-rose-500/10 via-rose-500/[0.06] to-transparent p-6 text-ink shadow-[0_8px_32px_-16px_rgba(225,29,72,0.25)] backdrop-blur-sm sm:p-8 dark:from-rose-500/[0.12] dark:via-rose-500/[0.08]",
} as const;

export function adminClass(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
