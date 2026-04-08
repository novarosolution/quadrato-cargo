import type { ReactNode } from "react";
import { adminUi } from "@/components/admin/admin-ui";

type Props = {
  /** Optional step number shown in a teal circle */
  step?: number;
  title: string;
  description?: string;
  children: ReactNode;
  /**
   * `card` — bordered panel (forms, settings).
   * `plain` — heading only, then children (e.g. full-width table below).
   */
  variant?: "card" | "plain";
  className?: string;
};

export function RoleStepSection({
  step,
  title,
  description,
  children,
  variant = "card",
  className = "",
}: Props) {
  const header = (
    <div className="flex flex-wrap items-start gap-3">
      {step != null ? (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/15 text-sm font-bold tabular-nums text-teal"
          aria-hidden
        >
          {step}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );

  if (variant === "plain") {
    return (
      <section className={`space-y-4 ${className}`.trim()}>
        {header}
        {children}
      </section>
    );
  }

  return (
    <section className={`${adminUi.panel} ${adminUi.panelPadding} ${className}`.trim()}>
      {header}
      <div className="mt-6">{children}</div>
    </section>
  );
}
