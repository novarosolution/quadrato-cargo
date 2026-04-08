import type { ReactNode } from "react";
import { adminClass, adminUi } from "./admin-ui";

type SectionTag = "section" | "aside" | "div" | "article";

export function AdminPageBody({
  children,
  className,
  narrow,
}: {
  children: ReactNode;
  className?: string;
  /** Settings-style narrow column */
  narrow?: boolean;
}) {
  return (
    <div className={adminClass(narrow ? adminUi.pageNarrow : adminUi.page, className)}>
      {children}
    </div>
  );
}

type PanelVariant = "default" | "accent" | "muted";

export function AdminPanel({
  children,
  className,
  variant = "default",
  padding = true,
  as,
  id,
  "aria-labelledby": ariaLabelledby,
}: {
  as?: SectionTag;
  variant?: PanelVariant;
  padding?: boolean;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
}) {
  const Tag = as ?? "section";
  const shell =
    variant === "accent"
      ? adminUi.panelAccent
      : variant === "muted"
        ? adminUi.panelMuted
        : adminUi.panel;
  const padClass =
    !padding
      ? ""
      : variant === "muted" || variant === "accent"
        ? "p-5"
        : adminUi.panelPadding;

  return (
    <Tag
      className={adminClass(shell, padClass, className)}
      id={id}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </Tag>
  );
}

export function AdminStepHeader({
  step,
  title,
  description,
  accent = false,
  id,
}: {
  step: string | number;
  title: string;
  description?: ReactNode;
  accent?: boolean;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className={accent ? adminUi.stepTeal : adminUi.stepNeutral} aria-hidden>
        {step}
      </span>
      <div className="min-w-0">
        <h2 id={id} className={adminUi.sectionTitleSm}>
          {title}
        </h2>
        {description ? <div className={adminUi.sectionDescSm}>{description}</div> : null}
      </div>
    </div>
  );
}

export function AdminEmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={adminClass(adminUi.empty, className)}>{children}</div>;
}

export function AdminTableShell({
  children,
  className,
  plain,
}: {
  children: ReactNode;
  className?: string;
  /** No shadow (e.g. contacts list) */
  plain?: boolean;
}) {
  return (
    <div className={adminClass(plain ? adminUi.tableScrollPlain : adminUi.tableScroll, className)}>
      {children}
    </div>
  );
}
