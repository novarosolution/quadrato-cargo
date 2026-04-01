"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
      className={`rounded-2xl border border-teal/30 bg-teal/5 dark:bg-teal/10 ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <button
        type="button"
        id={headingId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-ink">
            International professional flow (12 Track macros)
          </p>
          <p className="mt-0.5 text-[11px] text-muted-soft">
            Checklist per macro index — same order as the customer timeline and the admin/agency macro
            selector (0–11).
          </p>
        </div>
        {open ? (
          <ChevronUp className="size-5 shrink-0 text-muted-soft" aria-hidden />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-muted-soft" aria-hidden />
        )}
      </button>
      {open ? (
        <div className="border-t border-teal/20 px-4 pb-4 pt-2">
          <p className="mb-3 rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-[11px] leading-relaxed text-muted-soft">
            <span className="font-semibold text-ink">Smart features: </span>
            {INTERNATIONAL_SMART_FEATURES_TIP}
          </p>
          <ul className="max-h-[min(70vh,520px)] space-y-3 overflow-y-auto pr-1">
            {INTERNATIONAL_MACRO_STAFF_REFERENCE.map((block) => (
              <li
                key={block.macroIndex}
                className="rounded-xl border border-border-strong bg-canvas/50 px-3 py-2.5"
              >
                <p className="text-xs font-bold text-teal">
                  Macro {block.macroIndex}{" "}
                  <span className="font-semibold text-ink">· {block.sectionLabel}</span>
                </p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] text-muted">
                  {block.checklist.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-2 border-t border-border-strong/60 pt-2 text-[10px] leading-snug text-muted-soft">
                  <span className="font-semibold text-ink">Staff: </span>
                  {block.staffTip}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
