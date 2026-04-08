import type { ReactNode } from "react";

type Props = {
  step: string;
  title: string;
  children: ReactNode;
};

export function BookingSectionIntro({ step, title, children }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-strong/70 bg-linear-to-br from-surface-elevated/55 via-canvas/35 to-canvas/20 px-4 py-4 shadow-[0_8px_36px_-22px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.04] backdrop-blur-sm dark:from-surface-elevated/40 dark:via-canvas/25 dark:to-canvas/12 dark:shadow-black/40 sm:px-5 sm:py-4">
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-linear-to-b from-teal via-teal/85 to-teal/60"
        aria-hidden
      />
      <div className="pl-3.5 sm:pl-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal sm:text-[11px]">{step}</p>
        <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
        <div className="mt-2.5 max-w-3xl text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}
