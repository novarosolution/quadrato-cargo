"use client";

import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { csrfHeaderRecord } from "@/lib/api/csrf-headers";
import {
  sanitizeHttpUrlForQr,
  sanitizePdfFileStem,
  saveBlobAsFile,
  stripPdfControlChars,
} from "@/lib/sanitize-url";

/** ISO 216 A6 — fixed page for tracking slip and invoice (jsPDF uses mm). */
const PDF_A6_MM: [number, number] = [105, 148];
const PDF_W_MM = PDF_A6_MM[0];
const PDF_H_MM = PDF_A6_MM[1];
const PDF_MARGIN = 5;
const PDF_TEXT_W = PDF_W_MM - PDF_MARGIN * 2;
const PDF_FOOTER_Y = PDF_H_MM - 4.5;
const PDF_SIZE_LINE_Y = PDF_H_MM - 8;

type PdfSettings = {
  companyName: string;
  companyAddress: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  cardColor: string;
  headerSubtitle: string;
  supportEmail: string;
  supportPhone: string;
  website: string;
  watermarkText: string;
  footerNote: string;
};

/** Admin invoice line items (ISO A6 105×148 mm, same page as tracking slip). */
export type InvoicePdfDetails = {
  number?: string | null;
  currency?: string | null;
  subtotal?: string | null;
  tax?: string | null;
  insurance?: string | null;
  customsDuties?: string | null;
  discount?: string | null;
  total?: string | null;
  lineDescription?: string | null;
  notes?: string | null;
};

type Props = {
  template?: "invoice" | "tracking";
  buttonLabel?: string;
  bookingId: string;
  /** When template is invoice, merged into PDF line items and totals. */
  invoiceDetails?: InvoicePdfDetails | null;
  bookingDateLabel: string;
  updatedAtLabel: string;
  reference: string;
  routeTypeLabel: string;
  consignmentNumber: string;
  fromCity: string;
  toCity: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone: string;
  recipientEmail: string;
  amountLabel: string;
  weightLabel: string;
  dimensionsLabel: string;
  contentsLabel: string;
  instructionsLabel: string;
  trackingNotesLabel: string;
  agencyLabel: string;
  courierNameLabel: string;
  trackUrl: string;
  settings: PdfSettings;
};

export function DownloadBookingPdfButton({
  template = "invoice",
  buttonLabel = "Download PDF",
  bookingId,
  bookingDateLabel,
  updatedAtLabel,
  reference,
  routeTypeLabel,
  consignmentNumber,
  fromCity,
  toCity,
  senderName,
  senderAddress,
  senderPhone,
  senderEmail,
  recipientName,
  recipientAddress,
  recipientPhone,
  recipientEmail,
  amountLabel,
  weightLabel,
  dimensionsLabel,
  contentsLabel,
  instructionsLabel,
  trackingNotesLabel,
  agencyLabel,
  courierNameLabel,
  trackUrl,
  settings,
  invoiceDetails = null,
}: Props) {
  void (
    updatedAtLabel,
    senderPhone,
    senderEmail,
    recipientPhone,
    recipientEmail,
    amountLabel,
    weightLabel,
    dimensionsLabel,
    instructionsLabel,
    agencyLabel,
    courierNameLabel
  );

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const runFallbackPdf = async () => {
    const [{ jsPDF }, QRCodeModule] = await Promise.all([import("jspdf"), import("qrcode")]);
    const QRCode = QRCodeModule.default;
    const trackFallback = `${window.location.origin}/public/tsking`;
    const trackUrlSafe = sanitizeHttpUrlForQr(trackUrl, trackFallback);
    const safe = (value: string) => {
      const v = stripPdfControlChars(String(value ?? "")).trim();
      return v.length ? v : "-";
    };

    /** Offline fallback: ISO A6 105×148 mm (explicit mm format). */
    if (template === "tracking") {
      const doc = new jsPDF({ unit: "mm", format: PDF_A6_MM, compress: true });
      const qrDataUrl = await QRCode.toDataURL(trackUrlSafe, {
        width: 160,
        margin: 1,
      }).catch(() => null);
      const x = PDF_MARGIN;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(safe(settings.companyName).slice(0, 48), x, 6.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      const sub = safe(settings.headerSubtitle);
      if (sub !== "-") {
        doc.text(sub.slice(0, 56), x, 10);
      }
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", PDF_W_MM - PDF_MARGIN - 26, 2, 26, 26);
      }
      let y = 17;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("Track / scan ID", x, y);
      y += 3.5;
      doc.setFont("courier", "normal");
      doc.setFontSize(8.5);
      doc.text(safe(consignmentNumber || reference).slice(0, 34), x, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(`Booking: ${safe(bookingId).slice(0, 38)}`, x, y);
      y += 3.5;
      doc.text(`Booked: ${safe(bookingDateLabel)}`, x, y);
      y += 3.5;
      doc.text(`${safe(routeTypeLabel)} · ${safe(fromCity)} → ${safe(toCity)}`, x, y);
      y += 4.5;
      doc.setFont("helvetica", "bold");
      doc.text("Sender", x, y);
      y += 3.2;
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(safe(senderName), PDF_TEXT_W)[0] || "—", x, y);
      y += 3.5;
      doc.setFont("helvetica", "bold");
      doc.text("Recipient", x, y);
      y += 3.2;
      doc.setFont("helvetica", "normal");
      const recBlock = doc.splitTextToSize(
        `${safe(recipientName)} — ${safe(recipientAddress)}`.slice(0, 200),
        PDF_TEXT_W,
      );
      recBlock.slice(0, 4).forEach((line: string, i: number) => {
        doc.text(line, x, y + i * 3);
      });
      y += Math.min(recBlock.length, 4) * 3 + 1.5;
      if (y < PDF_SIZE_LINE_Y - 6) {
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        const note = safe(trackingNotesLabel);
        if (note !== "-") {
          const lines = doc.splitTextToSize(`Update: ${note}`, PDF_TEXT_W);
          lines.slice(0, 2).forEach((line: string, i: number) => {
            doc.text(line, x, y + i * 2.8);
          });
        }
      }
      doc.setTextColor(130, 140, 155);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4);
      doc.text("ISO A6 · 105 × 148 mm", PDF_W_MM / 2, PDF_SIZE_LINE_Y, { align: "center" });
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5);
      doc.text(safe(settings.footerNote).slice(0, 68), PDF_W_MM / 2, PDF_FOOTER_Y, {
        align: "center",
      });
      const fileStem = sanitizePdfFileStem(reference || bookingId);
      doc.save(`tracking-${fileStem}.pdf`);
      return;
    }

    /** Invoice: ISO A6 105×148 mm (same as tracking slip). */
    const doc = new jsPDF({ unit: "mm", format: PDF_A6_MM, compress: true });
    const qrDataUrlInv = await QRCode.toDataURL(trackUrlSafe, {
      width: 150,
      margin: 1,
    }).catch(() => null);

    const x = PDF_MARGIN;
    const rightX = PDF_W_MM - PDF_MARGIN;

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(safe(settings.companyName).slice(0, 44), x, 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    let y = 8.5;
    const addrLines = doc.splitTextToSize(safe(settings.companyAddress), 58);
    addrLines.slice(0, 2).forEach((line: string) => {
      doc.text(line, x, y);
      y += 2.7;
    });
    if (qrDataUrlInv) {
      doc.addImage(qrDataUrlInv, "PNG", PDF_W_MM - PDF_MARGIN - 26, 2, 26, 26);
    }

    y = Math.max(y, 13) + 1.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Invoice", x, y);
    y += 4.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    const inv = invoiceDetails ?? {};
    const invNum = inv.number != null && String(inv.number).trim() ? String(inv.number).trim() : "—";
    const cur =
      inv.currency != null && String(inv.currency).trim()
        ? String(inv.currency).trim().toUpperCase().slice(0, 12)
        : "INR";
    doc.text(`No. ${invNum.slice(0, 22)}`, x, y);
    doc.text(`Date ${safe(bookingDateLabel).slice(0, 20)}`, 50, y);
    y += 3.4;
    doc.text(`Track ${safe(consignmentNumber || reference).slice(0, 28)}`, x, y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("Bill to", x, y);
    y += 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    const billBlock = doc.splitTextToSize(
      `${safe(senderName)} · ${safe(senderAddress)}`.slice(0, 220),
      PDF_TEXT_W,
    );
    billBlock.slice(0, 3).forEach((line: string) => {
      doc.text(line, x, y);
      y += 2.8;
    });
    y += 0.5;

    const lineDesc =
      inv.lineDescription != null && String(inv.lineDescription).trim()
        ? String(inv.lineDescription).trim()
        : contentsLabel;
    if (safe(lineDesc) !== "-") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text("Description", x, y);
      y += 2.8;
      doc.setFont("helvetica", "normal");
      doc.splitTextToSize(safe(lineDesc), PDF_TEXT_W)
        .slice(0, 2)
        .forEach((line: string) => {
          doc.text(line, x, y);
          y += 2.8;
        });
      y += 0.5;
    }

    const money = (k: keyof InvoicePdfDetails) => {
      const raw = inv[k];
      return raw != null && String(raw).trim() ? String(raw).trim() : "";
    };

    const drawMoney = (label: string, value: string, bold = false) => {
      if (!value) return;
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(6);
      doc.text(label, x, y);
      doc.text(`${cur} ${value}`.slice(0, 26), rightX, y, { align: "right" });
      y += 3;
    };

    drawMoney("Subtotal", money("subtotal"));
    drawMoney("Tax", money("tax"));
    drawMoney("Insurance", money("insurance"));
    drawMoney("Customs", money("customsDuties"));
    drawMoney("Discount", money("discount"));
    drawMoney("Total", money("total"), true);

    if (y < PDF_SIZE_LINE_Y - 8 && money("notes")) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(80, 88, 102);
      doc.splitTextToSize(`Note: ${money("notes")}`, PDF_TEXT_W)
        .slice(0, 2)
        .forEach((line: string) => {
          if (y < PDF_SIZE_LINE_Y - 2) {
            doc.text(line, x, y);
            y += 2.6;
          }
        });
    }

    doc.setTextColor(130, 140, 155);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4);
    doc.text("ISO A6 · 105 × 148 mm", PDF_W_MM / 2, PDF_SIZE_LINE_Y, { align: "center" });
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(5);
    doc.text(safe(settings.footerNote).slice(0, 68), PDF_W_MM / 2, PDF_FOOTER_Y, {
      align: "center",
    });

    const fileStem = sanitizePdfFileStem(reference || bookingId);
    doc.save(`invoice-${fileStem}.pdf`);
  };

  const onDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/public/bookings/pdf`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaderRecord(),
        },
        body: JSON.stringify({
          template,
          bookingId
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        throw new Error(data.message || data.error || "Unable to generate PDF right now.");
      }

      const blob = await response.blob();
      const stem = sanitizePdfFileStem(reference || bookingId);
      const prefix = template === "invoice" ? "invoice" : "tracking";
      saveBlobAsFile(blob, `${prefix}-${stem}.pdf`);
    } catch (error) {
      try {
        await runFallbackPdf();
        setDownloadError(null);
      } catch {
        setDownloadError(
          error instanceof Error ? error.message : "PDF download failed. Please try again.",
        );
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onDownload}
        disabled={isDownloading}
        className="inline-flex rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isDownloading ? "Preparing…" : buttonLabel}
      </button>
      {downloadError ? (
        <p className="text-xs text-rose-400">{downloadError}</p>
      ) : null}
    </div>
  );
}
