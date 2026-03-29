import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

const inputClass =
  "w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

export function adminInputClassName() {
  return inputClass;
}

/**
 * Consistent label + optional hint + control spacing for admin forms.
 */
export function AdminFormField({ label, htmlFor, hint, className = "", children }: Props) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wide text-muted-soft"
      >
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-muted-soft">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
