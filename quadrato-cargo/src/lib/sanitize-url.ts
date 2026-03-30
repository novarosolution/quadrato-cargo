/** Strip control characters from strings shown in generated PDFs. */
export function stripPdfControlChars(value: string): string {
  return String(value ?? "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
}

/**
 * Only http(s) URLs are passed to QR generation / PDF track lines so schemes
 * like javascript: cannot flow into client-side URL sinks.
 */
export function sanitizeHttpUrlForQr(input: string, fallback: string): string {
  const raw = stripPdfControlChars(String(input ?? "")).trim();
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
    return u.href;
  } catch {
    return fallback;
  }
}

/** Safe filename stem for PDF downloads (no path segments or odd characters). */
export function sanitizePdfFileStem(stem: string): string {
  const base = stripPdfControlChars(String(stem ?? ""))
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "booking";
}

/**
 * Triggers a file download from a Blob using a blob: URL (no user-controlled href schemes).
 */
export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const safeName = sanitizePdfFileStem(fileName.replace(/\.pdf$/i, "")) + ".pdf";
  const objectUrl = URL.createObjectURL(blob);
  if (!objectUrl.startsWith("blob:")) {
    throw new Error("Invalid blob URL");
  }
  const anchor = document.createElement("a");
  anchor.setAttribute("href", objectUrl);
  anchor.setAttribute("download", safeName);
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  queueMicrotask(() => {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  });
}
