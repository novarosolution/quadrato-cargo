"use client";

import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api/base-url";

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
  recipientName: string;
  amountLabel: string;
  weightLabel: string;
  dimensionsLabel: string;
  contentsLabel: string;
  instructionsLabel: string;
  trackingNotesLabel: string;
  agencyLabel: string;
  trackUrl: string;
  settings: PdfSettings;
};

export function DownloadBookingPdfButton({
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
  recipientName,
  amountLabel,
  weightLabel,
  dimensionsLabel,
  contentsLabel,
  instructionsLabel,
  trackingNotesLabel,
  agencyLabel,
  trackUrl,
  settings,
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
          recipientName,
          amountLabel,
          weightLabel,
          dimensionsLabel,
          contentsLabel,
          instructionsLabel,
          trackingNotesLabel,
          agencyLabel,
          trackUrl,
          settings,
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
      setDownloadError(
        error instanceof Error ? error.message : "PDF download failed. Please try again.",
      );
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
        {isDownloading ? "Preparing PDF..." : "Download PDF"}
      </button>
      {downloadError ? (
        <p className="text-xs text-rose-400">{downloadError}</p>
      ) : null}
    </div>
  );
}
