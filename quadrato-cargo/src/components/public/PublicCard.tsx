import type { ReactNode } from "react";

export type PublicCardProps = {
  children: ReactNode;
  className?: string;
  /** Hover lift / sheen (see globals `.card-interactive`). */
  interactive?: boolean;
};

/**
 * Shared surface for marketing and customer-facing pages. Uses design tokens from `.panel-card`.
 */
export function PublicCard({ children, className, interactive }: PublicCardProps) {
  return (
    <div
      className={["panel-card", interactive ? "card-interactive" : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
