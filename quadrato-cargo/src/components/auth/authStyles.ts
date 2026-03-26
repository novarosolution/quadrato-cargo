/** Shared input styles for login / register forms */
export const authFieldClass =
  "mt-2 w-full rounded-2xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink placeholder:text-muted-soft/70 shadow-inner transition focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

/** Same as authFieldClass without top margin (e.g. inputs inside a grid row) */
// Keeping these as exported constants avoids style drift across auth forms.
export const authInputClass =
  "w-full rounded-2xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink placeholder:text-muted-soft/70 shadow-inner transition focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";
