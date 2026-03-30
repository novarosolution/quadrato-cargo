import type { ReactNode } from "react";

type Variant = "admin" | "public" | "app";

type Props = {
  title: string;
  description?: ReactNode;
  /** Public/marketing kicker above the title */
  eyebrow?: string;
  actions?: ReactNode;
  variant?: Variant;
  className?: string;
};

export function AppPageHeader({
  title,
  description,
  eyebrow,
  actions,
  variant = "admin",
  className = "",
}: Props) {
  const isPublic = variant === "public";

  return (
    <header className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${className}`.trim()}>
      <div className="min-w-0 flex-1">
        {isPublic && eyebrow ? (
          <p className="section-eyebrow mb-2">{eyebrow}</p>
        ) : null}
        <h1
          className={
            isPublic
              ? "font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl"
              : "font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          }
        >
          {title}
        </h1>
        {description ? (
          <div
            className={
              isPublic
                ? "mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
                : "mt-2 max-w-2xl text-sm leading-relaxed text-muted"
            }
          >
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminPageHeader(props: Omit<Props, "variant">) {
  return <AppPageHeader variant="admin" {...props} />;
}

export function PublicPageHeader(props: Omit<Props, "variant">) {
  return <AppPageHeader variant="public" {...props} />;
}

export function AppSurfacePageHeader(props: Omit<Props, "variant">) {
  return <AppPageHeader variant="app" {...props} />;
}
