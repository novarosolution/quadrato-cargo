"use client";

import { Loader2, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return "dark";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Read after mount to avoid server/client theme mismatch flashes.
    const id = requestAnimationFrame(() => setTheme(readTheme()));
    return () => cancelAnimationFrame(id);
  }, []);

  const apply = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    const current = readTheme();
    apply(current === "dark" ? "light" : "dark");
  }, [apply]);

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={theme === null}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-ghost-fill text-ink transition hover:bg-pill-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:pointer-events-none disabled:opacity-40 ${className}`}
      aria-label={
        theme === null
          ? "Theme"
          : isLight
            ? "Switch to dark mode"
            : "Switch to light mode"
      }
      aria-pressed={theme === null ? undefined : isLight}
    >
      {theme === null ? (
        <Loader2
          className="h-5 w-5 animate-spin text-muted"
          strokeWidth={2}
          aria-hidden
        />
      ) : isLight ? (
        <Moon className="h-5 w-5" strokeWidth={2} aria-hidden />
      ) : (
        <Sun className="h-5 w-5" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
