import type { LucideIcon } from "lucide-react";

type PublicCardIconProps = {
  Icon: LucideIcon;
  className?: string;
  size?: "md" | "sm";
};

/** Teal tile used above titles on marketing / profile cards. */
export function PublicCardIcon({ Icon, className, size = "md" }: PublicCardIconProps) {
  const tile =
    size === "sm"
      ? "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-teal to-teal/70 text-slate-950 shadow-sm shadow-teal/20"
      : "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-teal to-teal/70 text-slate-950 shadow-md shadow-teal/20";
  const iconClass = size === "sm" ? "h-4 w-4 shrink-0" : "h-5 w-5 shrink-0";
  return (
    <span className={[tile, className ?? ""].filter(Boolean).join(" ")}>
      <Icon className={iconClass} strokeWidth={2} aria-hidden />
    </span>
  );
}
