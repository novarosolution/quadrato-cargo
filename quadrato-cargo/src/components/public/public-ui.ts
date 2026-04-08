/**
 * Public / marketing page tokens — shared width, section titles, and CTAs
 * so About, Contact, Book, auth, and profile stay visually aligned.
 */

export const publicUi = {
  /** Standard root under TopBar for full-bleed marketing flows. */
  page: "stack-page content-full",

  /** Auth (login/register) hero band above the card. */
  authHeroSection: "border-b border-border py-10 sm:py-14",

  /** Primary section headings inside cards or columns. */
  sectionTitle: "type-display-premium text-xl md:text-2xl",
  sectionTitleMd: "type-display-premium text-lg",

  /** Body copy blocks (about, legal, long form). */
  prose: "space-y-4 text-sm leading-relaxed text-muted md:text-base",

  /** Single paragraph body (cards, sidebars). */
  proseSingle: "text-sm leading-relaxed text-muted md:text-base",

  /** Large in-page section title (below hero). */
  sectionTitleDisplay: "type-display-premium text-2xl sm:text-3xl",

  /** Inline links on teal (descriptions, footnotes). */
  link: "font-medium text-teal underline-offset-2 transition hover:text-teal hover:underline",
  linkQuiet: "text-teal underline-offset-2 transition hover:text-teal hover:underline",

  /** Narrow centered column (auth, short forms). */
  narrowContainer: "max-w-lg",

  /** Primary CTA — matches admin teal button for brand consistency. */
  btnPrimary:
    "inline-flex items-center justify-center rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50",

  btnSecondary:
    "inline-flex items-center justify-center rounded-xl border border-border-strong bg-canvas/40 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-pill-hover",

  /** Muted footer line under auth cards. */
  authFooterNote: "mt-8 text-center text-xs text-muted-soft",

  /** Customer profile — section subtitle under h2. */
  profileSectionDesc: "mt-1.5 text-sm leading-relaxed text-muted",

  /** Icon well for profile quick actions / list rows. */
  profileIconWell:
    "inline-flex shrink-0 items-center justify-center rounded-xl bg-teal/12 p-2.5 text-teal ring-1 ring-teal/15",

  /** Quick-action tile (link). */
  profileActionTile:
    "group flex items-start gap-3 rounded-2xl border border-border-strong bg-surface-elevated/50 p-4 text-left transition hover:border-teal/35 hover:bg-pill-hover/50 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:p-5",

  /** Booking row on profile list. */
  profileBookingRow:
    "group flex gap-3 rounded-2xl border border-border-strong bg-surface-elevated/40 p-4 transition hover:border-teal/40 hover:bg-pill-hover/30 sm:gap-4 sm:p-5",

  /** Profile dashboard stat tile. */
  profileStatTile:
    "rounded-2xl border border-border-strong/80 bg-surface-elevated/50 p-4 text-center shadow-sm backdrop-blur-sm transition hover:border-teal/30 sm:p-5",
} as const;

export function publicClass(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
