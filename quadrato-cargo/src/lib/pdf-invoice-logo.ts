/** Same artwork as `public/invoice-brand-logo.svg` / server `src/assets/invoice-brand-logo.svg`. */
export const INVOICE_BRAND_LOGO_SVG_PATH = "/invoice-brand-logo.svg";

const VIEWBOX_W = 378;
const VIEWBOX_H = 96;

/**
 * Rasterize the invoice SVG for jsPDF (SVG addImage support is unreliable in browsers).
 */
export async function fetchInvoiceLogoAsPng(): Promise<{
  dataUrl: string;
  aspect: number;
} | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(INVOICE_BRAND_LOGO_SVG_PATH);
    if (!res.ok) return null;
    const svgText = await res.text();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("invoice logo failed to load"));
      img.src = objectUrl;
    });
    const naturalW = img.naturalWidth || VIEWBOX_W;
    const naturalH = img.naturalHeight || VIEWBOX_H;
    const maxPx = 960;
    const scale = Math.min(2, maxPx / naturalW);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(naturalW * scale);
    canvas.height = Math.round(naturalH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return null;
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(objectUrl);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      aspect: naturalW / naturalH,
    };
  } catch {
    return null;
  }
}
