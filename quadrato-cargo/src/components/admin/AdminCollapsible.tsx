"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { adminClass, adminUi } from "./admin-ui";

type Props = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  /** Stable id prefix for aria; panel id derived internally */
  id?: string;
  className?: string;
  children: ReactNode;
};

export function AdminCollapsible({
  title,
  description,
  defaultOpen = false,
  id: idProp,
  className = "",
  children,
}: Props) {
  const reactId = useId();
  const baseId = idProp ?? `admin-panel-${reactId.replace(/:/g, "")}`;
  const regionId = `${baseId}-region`;
  const [open, setOpen] = useState(defaultOpen);
  const outerClass = adminClass(adminUi.collapsible, idProp ? "scroll-mt-6" : "", className);

  return (
    <div id={idProp} className={outerClass.trim()}>
      <button
        type="button"
        id={`${baseId}-trigger`}
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 rounded-2xl px-5 py-4 text-left transition hover:bg-canvas/20"
      >
        <span className="min-w-0">
          <span className={adminUi.sectionTitleSm}>{title}</span>
          {description ? (
            <span className="mt-1 block text-xs text-muted-soft">{description}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-muted-soft transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        id={regionId}
        role="region"
        aria-labelledby={`${baseId}-trigger`}
        className={`border-t border-border-strong px-5 pb-5 pt-4 ${open ? "" : "hidden"}`}
      >
        {children}
      </div>
    </div>
  );
}
