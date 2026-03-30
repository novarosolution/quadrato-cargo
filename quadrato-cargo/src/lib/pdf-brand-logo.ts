import type { jsPDF } from "jspdf";

export function parseHexRgb(
  hex: string | undefined,
  fallback: [number, number, number],
): [number, number, number] {
  const h = String(hex ?? "").trim();
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h);
  if (!m) return fallback;
  let s = m[1];
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Quadrato Cargo grid from brand SVG: TL teal, TR orange, BL teal, BR teal.
 */
export function drawQuadratoMark(
  doc: jsPDF,
  xMm: number,
  yMm: number,
  cellMm: number,
  gapMm = 0.32,
) {
  const teal: [number, number, number] = [62, 213, 194];
  const orange: [number, number, number] = [237, 115, 4];
  doc.setFillColor(...teal);
  doc.rect(xMm, yMm, cellMm, cellMm, "F");
  doc.rect(xMm, yMm + cellMm + gapMm, cellMm, cellMm, "F");
  doc.setFillColor(...orange);
  doc.rect(xMm + cellMm + gapMm, yMm, cellMm, cellMm, "F");
  doc.setFillColor(...teal);
  doc.rect(xMm + cellMm + gapMm, yMm + cellMm + gapMm, cellMm, cellMm, "F");
}

export type PdfHeaderBrandingInput = {
  companyName: string;
  headerSubtitle: string;
  /** Shown as "Ref: …" */
  reference: string;
  primaryColorHex: string;
  accentColorHex: string;
};

export type PdfHeaderLogoOptions = {
  /** Rasterized PNG data URL of `invoice-brand-logo.svg` */
  logoPngDataUrl: string | null;
  logoAspect?: number;
};

/**
 * Header band with brand mark, company lines, tagline, and optional QR (invoice / tracking PDFs).
 */
export function drawBrandedPdfHeader(
  doc: jsPDF,
  branding: PdfHeaderBrandingInput,
  qrPngDataUrl: string | null,
  logo?: PdfHeaderLogoOptions | null,
) {
  const primary = parseHexRgb(branding.primaryColorHex, [15, 118, 110]);
  const accent = parseHexRgb(branding.accentColorHex, [249, 115, 22]);
  const headerH = 34;

  doc.setFillColor(...primary);
  doc.rect(0, 0, 210, headerH, "F");

  const name = String(branding.companyName || "").trim() || "Quadrato Cargo";
  const sub = String(branding.headerSubtitle || "").trim();
  const refLine = `Ref: ${String(branding.reference || "").trim() || "-"}`;

  const logoPng = logo?.logoPngDataUrl?.trim() || "";
  const aspect = logo?.logoAspect && logo.logoAspect > 0 ? logo.logoAspect : 378 / 96;

  if (logoPng) {
    const logoW = 78;
    const logoH = logoW / aspect;
    const yLogo = Math.max(4, (headerH - logoH) / 2);
    doc.addImage(logoPng, "PNG", 10, yLogo, logoW, logoH);
    const textX = 10 + logoW + 5;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (sub) doc.text(sub, textX, 13);
    doc.setFontSize(8);
    doc.text(refLine, textX, 20);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(10, 5, 15.5, 24, 2, 2, "F");

    const cell = 4.85;
    drawQuadratoMark(doc, 11.15, 7.1, cell, 0.3);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(name, 28, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (sub) doc.text(sub, 28, 17);
    doc.setFontSize(8);
    doc.text(refLine, 28, 22);

    doc.setTextColor(...accent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Fast Forward Rapid Reach", 28, 27);
  }

  if (qrPngDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(164, 5, 38, 24, 2, 2, "F");
    doc.addImage(qrPngDataUrl, "PNG", 170, 7, 18, 18);
    doc.setTextColor(...primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("SCAN", 190, 26, { align: "center" });
  }
}
