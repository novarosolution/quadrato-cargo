"use client";

import { jsPDF } from "jspdf";

type PdfSettings = {
  companyName: string;
  companyAddress: string;
  logoText: string;
  primaryColor: string;
  footerNote: string;
};

type Props = {
  bookingId: string;
  bookingDateLabel: string;
  statusLabel: string;
  reference: string;
  fromCity: string;
  toCity: string;
  senderName: string;
  recipientName: string;
  amountLabel: string;
  agencyLabel: string;
  trackUrl: string;
  settings: PdfSettings;
};

function parseRgb(hexOrFallback: string) {
  const value = String(hexOrFallback || "").trim();
  const match = value.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return [15, 118, 110] as const;
  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ] as const;
}

export function DownloadBookingPdfButton({
  bookingId,
  bookingDateLabel,
  statusLabel,
  reference,
  fromCity,
  toCity,
  senderName,
  recipientName,
  amountLabel,
  agencyLabel,
  trackUrl,
  settings,
}: Props) {
  const onDownload = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const [r, g, b] = parseRgb(settings.primaryColor);

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(settings.companyName || "Quadrato Cargo", 18, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(settings.companyAddress || "International Courier", 18, 20);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.4);
    doc.roundedRect(155, 8, 36, 16, 2, 2);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(settings.logoText || "QR", 173, 18, { align: "center" });

    doc.setTextColor(32, 32, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    let y = 40;
    const leftX = 18;
    const rightX = 112;

    const writePair = (label: string, value: string, x: number, yy: number) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, x, yy);
      doc.setFont("helvetica", "normal");
      doc.text(value || "-", x + 32, yy);
    };

    writePair("Date:", bookingDateLabel, leftX, y);
    writePair("Status:", statusLabel, rightX, y);
    y += 9;
    writePair("From (City):", fromCity, leftX, y);
    writePair("To (City):", toCity, rightX, y);
    y += 9;
    writePair("Amount:", amountLabel, leftX, y);
    writePair("Agency:", agencyLabel, rightX, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Sender", leftX, y);
    doc.text("Recipient", rightX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(senderName || "-", leftX, y);
    doc.text(recipientName || "-", rightX, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Reference", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(reference, leftX + 32, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Booking ID", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(bookingId, leftX + 32, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Tracking URL", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const wrappedUrl = doc.splitTextToSize(trackUrl, 160);
    doc.text(wrappedUrl, leftX + 32, y);

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(
      settings.footerNote || "Thank you for choosing Quadrato Cargo.",
      105,
      286,
      { align: "center" },
    );

    doc.save(`courier-details-${reference || bookingId}.pdf`);
  };

  return (
    <button
      type="button"
      onClick={onDownload}
      className="inline-flex rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
    >
      Download PDF
    </button>
  );
}
