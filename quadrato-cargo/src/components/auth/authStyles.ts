/** Shared input styles for login / register / admin auth forms */
export const authFieldClass =
  "mt-2 w-full rounded-2xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink placeholder:text-muted-soft/70 shadow-inner transition focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

/** Same as authFieldClass without top margin (e.g. inputs inside a grid row) */
export const authInputClass =
  "w-full rounded-2xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink placeholder:text-muted-soft/70 shadow-inner transition focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

export const authLabelClass = "text-sm font-medium text-ink";

/** Inline validation / API error surface */
export const authAlertError =
  "rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300";
