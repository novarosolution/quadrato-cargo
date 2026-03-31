import { estimateInternationalEdd } from "@/lib/international-tracking-flow";

export function resolveEstimatedDeliveryDate(opts: {
  routeType: string;
  createdAtIso: string;
  estimatedDeliveryAt?: string | null;
}): Date | null {
  const raw = opts.estimatedDeliveryAt?.trim();
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (String(opts.routeType).toLowerCase() === "international") {
    return estimateInternationalEdd(opts.createdAtIso);
  }
  return null;
}

export function formatEddDisplay(d: Date | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(d);
  } catch {
    return "—";
  }
}

/** `YYYY-MM-DD` for `<input type="date" />`, from an ISO string or empty. */
export function isoToDateInputValue(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Noon local interpretation of calendar date → ISO for API. */
export function dateInputToIso(dateStr: string): string {
  const t = dateStr.trim();
  if (!t) return "";
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
