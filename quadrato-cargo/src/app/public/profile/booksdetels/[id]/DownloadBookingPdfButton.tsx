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

/** Admin invoice fields for A6 invoice PDF (ISO 105×148 mm). */
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
  /** When template is invoice, used for line items and totals on the A6 PDF. */
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

    /** Offline fallback: delivery receipt matches server A6 (105×148 mm). */
    if (template === "tracking") {
      const doc = new jsPDF({ unit: "mm", format: "a6" });
      const qrDataUrl = await QRCode.toDataURL(trackUrlSafe, {
        width: 180,
        margin: 1,
      }).catch(() => null);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(safe(settings.companyName).slice(0, 44), 5, 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      const sub = safe(settings.headerSubtitle);
      if (sub !== "-") {
        doc.text(sub.slice(0, 52), 5, 11);
      }
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", 72, 2, 28, 28);
      }
      let y = 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Track / scan ID", 5, y);
      y += 4;
      doc.setFont("courier", "normal");
      doc.setFontSize(10);
      doc.text(safe(consignmentNumber || reference).slice(0, 32), 5, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Booking: ${safe(bookingId).slice(0, 36)}`, 5, y);
      y += 4;
      doc.text(`Booked: ${safe(bookingDateLabel)}`, 5, y);
      y += 4;
      doc.text(`${safe(routeTypeLabel)} · ${safe(fromCity)} → ${safe(toCity)}`, 5, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Sender", 5, y);
      y += 3.5;
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(safe(senderName), 95)[0] || "—", 5, y);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("Recipient", 5, y);
      y += 3.5;
      doc.setFont("helvetica", "normal");
      const recBlock = doc.splitTextToSize(
        `${safe(recipientName)} — ${safe(recipientAddress)}`.slice(0, 200),
        95,
      );
      recBlock.slice(0, 4).forEach((line: string, i: number) => {
        doc.text(line, 5, y + i * 3.4);
      });
      y += Math.min(recBlock.length, 4) * 3.4 + 2;
      if (y < 132) {
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const note = safe(trackingNotesLabel);
        if (note !== "-") {
          doc.text(doc.splitTextToSize(`Update: ${note}`, 95)[0] || "", 5, y);
        }
      }
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(safe(settings.footerNote).slice(0, 72), 52.5, 143, { align: "center" });
      const fileStem = sanitizePdfFileStem(reference || bookingId);
      doc.save(`tracking-${fileStem}.pdf`);
      return;
    }

    /** Invoice: compact A6 (105×148 mm) with admin invoice lines + track QR. */
    const doc = new jsPDF({ unit: "mm", format: "a6" });
    const qrDataUrlInv = await QRCode.toDataURL(trackUrlSafe, {
      width: 160,
      margin: 1,
    }).catch(() => null);

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(safe(settings.companyName).slice(0, 42), 5, 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    let y = 9;
    const addrLines = doc.splitTextToSize(safe(settings.companyAddress), 62);
    addrLines.slice(0, 2).forEach((line: string) => {
      doc.text(line, 5, y);
      y += 3;
    });
    if (qrDataUrlInv) {
      doc.addImage(qrDataUrlInv, "PNG", 72, 2, 28, 28);
    }

    y = Math.max(y, 14) + 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Invoice", 5, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const inv = invoiceDetails ?? {};
    const invNum = inv.number != null && String(inv.number).trim() ? String(inv.number).trim() : "—";
    const cur =
      inv.currency != null && String(inv.currency).trim()
        ? String(inv.currency).trim().toUpperCase().slice(0, 12)
        : "INR";
    doc.text(`No. ${invNum.slice(0, 24)}`, 5, y);
    doc.text(`Date ${safe(bookingDateLabel).slice(0, 22)}`, 52, y);
    y += 3.8;
    doc.text(`Track ${safe(consignmentNumber || reference).slice(0, 30)}`, 5, y);
    y += 4.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("Bill to", 5, y);
    y += 3.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    const billBlock = doc.splitTextToSize(
      `${safe(senderName)} · ${safe(senderAddress)}`.slice(0, 220),
      95,
    );
    billBlock.slice(0, 3).forEach((line: string) => {
      doc.text(line, 5, y);
      y += 3.1;
    });
    y += 1;

    const lineDesc =
      inv.lineDescription != null && String(inv.lineDescription).trim()
        ? String(inv.lineDescription).trim()
        : contentsLabel;
    if (safe(lineDesc) !== "-") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text("Description", 5, y);
      y += 3;
      doc.setFont("helvetica", "normal");
      doc.splitTextToSize(safe(lineDesc), 95)
        .slice(0, 2)
        .forEach((line: string) => {
          doc.text(line, 5, y);
          y += 3;
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
      doc.setFontSize(6.5);
      doc.text(label, 5, y);
      doc.text(`${cur} ${value}`.slice(0, 28), 100, y, { align: "right" });
      y += 3.3;
    };

    drawMoney("Subtotal", money("subtotal"));
    drawMoney("Tax", money("tax"));
    drawMoney("Insurance", money("insurance"));
    drawMoney("Customs", money("customsDuties"));
    drawMoney("Discount", money("discount"));
    drawMoney("Total", money("total"), true);

    if (y < 128 && money("notes")) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(80, 88, 102);
      doc.splitTextToSize(`Note: ${money("notes")}`, 95)
        .slice(0, 2)
        .forEach((line: string) => {
          if (y < 136) {
            doc.text(line, 5, y);
            y += 2.8;
          }
        });
    }

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(safe(settings.footerNote).slice(0, 76), 52.5, 143, { align: "center" });

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
      saveBlobAsFile(blob, `courier-details-${stem}`);
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
        {isDownloading ? "Preparing PDF..." : buttonLabel}
      </button>
      {downloadError ? (
        <p className="text-xs text-rose-400">{downloadError}</p>
      ) : null}
    </div>
  );
}
