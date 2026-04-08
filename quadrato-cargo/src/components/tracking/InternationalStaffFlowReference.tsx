"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Route } from "lucide-react";
import {
  INTERNATIONAL_MACRO_STAFF_REFERENCE,
  INTERNATIONAL_SMART_FEATURES_TIP,
} from "@/lib/international-flow-staff-reference";

type Props = {
  /** When false, starts collapsed (e.g. agency panel). */
  defaultOpen?: boolean;
  className?: string;
};

export function InternationalStaffFlowReference({
  defaultOpen = true,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const headingId = useId();

  return (
    <section
      className={`rounded-2xl border border-teal/30 bg-linear-to-br from-teal/5 via-canvas to-canvas shadow-sm dark:from-teal/15 dark:via-canvas dark:to-canvas ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <button
        type="button"
        id={headingId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-teal/5 dark:hover:bg-teal/10"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Route className="size-4 shrink-0 text-teal" aria-hidden />
            <p className="text-sm font-bold text-ink">
              International professional flow · 12 Track macros
            </p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-soft">
            Same order as the customer timeline and the macro selector (0–11). Each block lists
            sub-checklist ideas, the <span className="font-semibold text-ink">default bulk map line</span>{" "}
            customers see when you have not set a per-card override, and a staff tip.
          </p>
        </div>
        {open ? (
          <ChevronUp className="size-5 shrink-0 text-muted-soft" aria-hidden />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-muted-soft" aria-hidden />
        )}
      </button>
      {open ? (
        <div className="border-t border-teal/20 px-4 pb-4 pt-3">
          <p className="mb-4 rounded-xl border border-border-strong bg-canvas/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted-soft dark:bg-canvas/30">
            <span className="font-bold text-ink">Customer view: </span>
            {INTERNATIONAL_SMART_FEATURES_TIP}
          </p>
          <ul className="max-h-[min(72vh,560px)] space-y-3 overflow-y-auto overscroll-contain pr-1">
            {INTERNATIONAL_MACRO_STAFF_REFERENCE.map((block) => (
              <li
                key={block.macroIndex}
                className="overflow-hidden rounded-xl border border-border-strong bg-canvas/70 shadow-sm dark:bg-canvas/40"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border-strong/70 bg-surface-highlight/50 px-3 py-2 dark:bg-surface-highlight/25">
                  <p className="text-xs font-bold text-ink">
                    <span className="tabular-nums text-teal">Macro {block.macroIndex}</span>
                    <span className="mx-1.5 text-muted-soft">·</span>
                    <span>{block.sectionLabel}</span>
                  </p>
                </div>
                <div className="space-y-3 px-3 py-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-soft">
                      Sub-flow checklist
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-muted">
                      {block.checklist.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-teal/20 bg-teal-dim/40 px-2.5 py-2 dark:bg-teal-dim/25">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      Default bulk location line
                    </p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-ink">
                      {block.bulkLocationLine}
                    </p>
                  </div>
                  <p className="border-t border-border-strong/60 pt-2 text-[10px] leading-snug text-muted-soft">
                    <span className="font-bold text-ink">Staff: </span>
                    {block.staffTip}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
