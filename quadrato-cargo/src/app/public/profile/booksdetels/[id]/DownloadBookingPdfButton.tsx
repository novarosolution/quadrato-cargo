"use client";

import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { drawBrandedPdfHeader } from "@/lib/pdf-brand-logo";
import { fetchInvoiceLogoAsPng } from "@/lib/pdf-invoice-logo";

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

type Props = {
  template?: "invoice" | "tracking";
  buttonLabel?: string;
  bookingId: string;
  bookingDateLabel: string;
  updatedAtLabel: string;
  statusLabel: string;
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
  statusLabel,
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
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const runFallbackPdf = async () => {
    const [{ jsPDF }, QRCodeModule, invoiceLogo] = await Promise.all([
      import("jspdf"),
      import("qrcode"),
      fetchInvoiceLogoAsPng(),
    ]);
    const QRCode = QRCodeModule.default;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const safe = (value: string) => {
      const v = String(value ?? "").trim();
      return v.length ? v : "-";
    };
    const wrapped = (value: string, width: number) =>
      doc.splitTextToSize(safe(value), width);

    const qrDataUrl = await QRCode.toDataURL(trackUrl, { width: 240, margin: 1 }).catch(
      () => null,
    );

    drawBrandedPdfHeader(
      doc,
      {
        companyName: settings.companyName,
        headerSubtitle: settings.headerSubtitle,
        reference: safe(reference),
        primaryColorHex: settings.primaryColor,
        accentColorHex: settings.accentColor,
      },
      qrDataUrl,
      invoiceLogo
        ? {
            logoPngDataUrl: invoiceLogo.dataUrl,
            logoAspect: invoiceLogo.aspect,
          }
        : null,
    );

    let y = 40;
    if (template === "invoice") {
      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Invoice", 14, 38);
      y = 46;
    }
    const drawPair = (label: string, value: string, x: number, yy: number) => {
      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(label, x, yy);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(wrapped(value, 60), x + 28, yy);
    };

    drawPair("Booked:", bookingDateLabel, 14, y);
    drawPair("Update:", updatedAtLabel, 106, y);
    y += 10;
    drawPair("Status:", statusLabel, 14, y);
    drawPair("Route:", routeTypeLabel, 106, y);
    y += 10;
    drawPair("From:", fromCity, 14, y);
    drawPair("To:", toCity, 106, y);
    y += 10;
    drawPair("Sender:", senderName, 14, y);
    drawPair("Recipient:", recipientName, 106, y);
    y += 10;
    drawPair("Sender Addr:", senderAddress, 14, y);
    drawPair("Recipient Addr:", recipientAddress, 106, y);
    y += 10;
    drawPair("Sender Phone:", senderPhone, 14, y);
    drawPair("Recipient Phone:", recipientPhone, 106, y);
    y += 10;
    drawPair("Amount:", amountLabel, 14, y);
    drawPair("Agency:", agencyLabel, 106, y);
    y += 14;
    drawPair("Booking ID:", bookingId, 14, y);
    drawPair("Tracking ID:", consignmentNumber, 106, y);
    y += 10;
    drawPair("Weight:", weightLabel, 14, y);
    drawPair("Dimensions:", dimensionsLabel, 106, y);
    y += 10;
    drawPair("Sender Email:", senderEmail, 14, y);
    drawPair("Recipient Email:", recipientEmail, 106, y);
    y += 10;
    drawPair("Track URL:", trackUrl, 14, y);

    y += 20;
    drawPair("Contents:", contentsLabel, 14, y);
    y += 10;
    drawPair("Instructions:", instructionsLabel, 14, y);
    y += 10;
    drawPair("Tracking Update:", trackingNotesLabel, 14, y);
    y += 10;
    drawPair("Pickup Courier:", courierNameLabel, 14, y);
    drawPair("Agency:", agencyLabel, 106, y);

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(safe(settings.footerNote), 105, 286, { align: "center" });
    const fileStem = safe(reference || bookingId).replace(/[^a-zA-Z0-9-_]/g, "-");
    const prefix = template === "invoice" ? "invoice" : "tracking";
    doc.save(`${prefix}-${fileStem || "booking"}.pdf`);
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
      const fileNameSafe = (reference || bookingId)
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .trim();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `courier-details-${fileNameSafe || "booking"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
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
