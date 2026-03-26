"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";

type PdfSettings = {
  companyName: string;
  companyAddress: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  cardColor: string;
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

function toHex(value: string, fallback: string) {
  const raw = String(value || "").trim();
  const match = raw.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1]}` : fallback;
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
    const [ar, ag, ab] = parseRgb(settings.accentColor);
    const [cr, cg, cb] = parseRgb(settings.cardColor);
    const qrDataUrl = await QRCode.toDataURL(trackUrl, {
      width: 512,
      margin: 1,
      color: {
        dark: toHex(settings.primaryColor, "#0f766e"),
        light: "#ffffff",
      },
    }).catch(() => null);

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 34, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(settings.companyName || "Quadrato Cargo", 16, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(settings.companyAddress || "International courier service", 16, 20);
    doc.text(`Ref: ${reference}`, 16, 27);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.4);
    doc.roundedRect(163, 8, 30, 20, 2, 2);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(settings.logoText || "QR", 178, 20, { align: "center" });

    doc.setTextColor(32, 32, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    let y = 44;
    const leftX = 18;
    const rightX = 106;

    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(14, y - 8, 182, 52, 3, 3, "F");
    doc.setDrawColor(224, 224, 224);
    doc.roundedRect(14, y - 8, 182, 52, 3, 3);

    const writePair = (label: string, value: string, x: number, yy: number) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, x, yy);
      doc.setFont("helvetica", "normal");
      doc.text(value || "-", x + 28, yy);
    };

    writePair("Date:", bookingDateLabel, leftX, y);
    writePair("Status:", statusLabel, rightX, y);
    y += 9;
    writePair("From (City):", fromCity, leftX, y);
    writePair("To (City):", toCity, rightX, y);
    y += 9;
    writePair("Amount:", amountLabel, leftX, y);
    writePair("Agency:", agencyLabel, rightX, y);

    y += 13;
    doc.setFont("helvetica", "bold");
    doc.text("Sender", leftX, y);
    doc.text("Recipient", rightX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(senderName || "-", leftX, y);
    doc.text(recipientName || "-", rightX, y);

    y += 14;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, y - 7, 182, 50, 3, 3, "F");
    doc.setDrawColor(224, 224, 224);
    doc.roundedRect(14, y - 7, 182, 50, 3, 3);

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
    doc.setFontSize(9.5);
    const wrappedUrl = doc.splitTextToSize(trackUrl, 114);
    doc.text(wrappedUrl, leftX + 32, y);

    if (qrDataUrl) {
      doc.setDrawColor(ar, ag, ab);
      doc.setLineWidth(0.6);
      doc.roundedRect(157, y - 4, 32, 32, 2, 2);
      doc.addImage(qrDataUrl, "PNG", 160, y - 1, 26, 26);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(ar, ag, ab);
      doc.text("SCAN TO TRACK", 173, y + 30, { align: "center" });
    }

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
