import type { ReactNode } from "react";
import { adminUi } from "./admin-ui";

type Props = {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function adminInputClassName() {
  return adminUi.input;
}

export function adminSelectClassName() {
  return adminUi.selectMt;
}

/**
 * Consistent label + optional hint + control spacing for admin forms.
 */
export function AdminFormField({ label, htmlFor, hint, className = "", children }: Props) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={adminUi.labelBlock}>
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-muted-soft">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
