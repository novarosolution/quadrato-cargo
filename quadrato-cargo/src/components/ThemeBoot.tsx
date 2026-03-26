"use client";

import { useLayoutEffect } from "react";

export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        document.documentElement.setAttribute("data-theme", stored);
        return;
      }
    } catch {
      /* ignore */
    }
    // Match system preference before first paint when no explicit user choice exists.
    const light = window.matchMedia("(prefers-color-scheme: light)").matches;
    document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
  }, []);

  return null;
}
