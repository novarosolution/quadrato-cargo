import type { ReactNode } from "react";

type PublicPageSectionProps = {
  children: ReactNode;
  className?: string;
  /** Use tighter vertical padding (matches `.page-section-compact`). */
  compact?: boolean;
};

export function PublicPageSection({
  children,
  className,
  compact,
}: PublicPageSectionProps) {
  return (
    <section
      className={[compact ? "page-section-compact" : "page-section", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
