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
  const isApp = variant === "app";

  return (
    <header className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${className}`.trim()}>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className={`section-eyebrow ${isPublic ? "mb-2" : "mb-1.5"}`}>{eyebrow}</p>
        ) : null}
        <h1
          className={
            isPublic
              ? "type-display-premium text-3xl sm:text-4xl md:text-5xl"
              : "admin-page-title type-display-premium text-2xl sm:text-3xl lg:text-[1.85rem] lg:tracking-tight"
          }
        >
          {title}
        </h1>
        {description ? (
          <div
            className={
              isPublic
                ? "mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
                : isApp
                  ? "mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-[0.9375rem]"
                  : "mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-[0.9375rem]"
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
