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
    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    const qrCardSize = 36;
    const qrImageSize = 28;
    const qrCardX = pageWidth - marginX - qrCardSize;
    const qrCardY = 14;

    const safe = (value: string) => {
      const normalized = String(value ?? "").trim();
      return normalized.length > 0 ? normalized : "-";
    };

    const getLines = (value: string, width: number) => doc.splitTextToSize(safe(value), width);

    const drawCard = (y: number, h: number) => {
      doc.setFillColor(cr, cg, cb);
      doc.roundedRect(marginX, y, contentWidth, h, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, y, contentWidth, h, 3, 3);
    };

    const qrDataUrl = await QRCode.toDataURL(trackUrl, {
      width: 512,
      margin: 1,
      color: {
        dark: toHex(settings.primaryColor, "#0f766e"),
        light: "#ffffff",
      },
    }).catch(() => null);

    const companyNameLines = doc.splitTextToSize(
      safe(settings.companyName || "Quadrato Cargo"),
      110,
    );
    const companyAddressLines = doc.splitTextToSize(
      safe(settings.companyAddress || "International courier service"),
      110,
    );
    const referenceLine = `Ref: ${safe(reference)}`;
    const headerTextHeight =
      companyNameLines.length * 7 + companyAddressLines.length * 4.6 + 11;
    const headerHeight = Math.max(48, headerTextHeight + 12);

    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, headerHeight, "F");
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, headerHeight - 3, pageWidth, 3, "F");
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX + 2, 8, 20, 8, 2, 2, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.text(safe(settings.logoText || "QR"), marginX + 12, 13.6, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(companyNameLines, marginX + 28, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(companyAddressLines, marginX + 28, 15 + companyNameLines.length * 7 + 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(
      referenceLine,
      marginX + 28,
      15 + companyNameLines.length * 7 + companyAddressLines.length * 4.6 + 4,
    );

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrCardX, qrCardY, qrCardSize, qrCardSize, 2.5, 2.5, "F");
    doc.setDrawColor(ar, ag, ab);
    doc.setLineWidth(0.6);
    doc.roundedRect(qrCardX, qrCardY, qrCardSize, qrCardSize, 2.5, 2.5);

    if (qrDataUrl) {
      doc.addImage(
        qrDataUrl,
        "PNG",
        qrCardX + (qrCardSize - qrImageSize) / 2,
        qrCardY + 2,
        qrImageSize,
        qrImageSize,
      );
    }

    doc.setTextColor(ar, ag, ab);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("SCAN TO TRACK", qrCardX + qrCardSize / 2, qrCardY + qrCardSize - 2.5, {
      align: "center",
    });

    doc.setTextColor(32, 32, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = headerHeight + 8;
    const sectionPad = 4.5;
    const labelW = 25;
    const colGap = 6;
    const colWidth = (contentWidth - sectionPad * 2 - colGap) / 2;
    const col1X = marginX + sectionPad;
    const col2X = col1X + colWidth + colGap;
    const valueW = colWidth - labelW - 1;

    const summaryRows = [
      [
        { label: "Date", value: bookingDateLabel },
        { label: "Status", value: statusLabel },
      ],
      [
        { label: "From", value: fromCity },
        { label: "To", value: toCity },
      ],
      [
        { label: "Amount", value: amountLabel },
        { label: "Agency", value: agencyLabel },
      ],
      [
        { label: "Sender", value: senderName },
        { label: "Recipient", value: recipientName },
      ],
    ];

    const summaryBodyHeight = summaryRows.reduce((acc, row) => {
      const leftLines = getLines(row[0].value, valueW).length;
      const rightLines = getLines(row[1].value, valueW).length;
      const lines = Math.max(leftLines, rightLines);
      return acc + 5 + lines * 4.5 + 2.8;
    }, 0);
    const summaryHeight = 9 + summaryBodyHeight + sectionPad;

    drawCard(y, summaryHeight);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text("Shipment Summary", col1X, y + 6.4);

    let rowY = y + 12.2;
    summaryRows.forEach((row) => {
      const leftLines = getLines(row[0].value, valueW);
      const rightLines = getLines(row[1].value, valueW);
      const lines = Math.max(leftLines.length, rightLines.length);

      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`${row[0].label}:`, col1X, rowY);
      doc.text(`${row[1].label}:`, col2X, rowY);

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(leftLines, col1X + labelW, rowY);
      doc.text(rightLines, col2X + labelW, rowY);

      rowY += 5 + lines * 4.5 + 2.8;
    });

    y += summaryHeight + 6;

    const detailsLabelW = 30;
    const detailsValueW = contentWidth - sectionPad * 2 - detailsLabelW - 2;
    const detailRows = [
      { label: "Reference", value: reference },
      { label: "Booking ID", value: bookingId },
      { label: "Tracking URL", value: trackUrl },
    ];
    const detailsBodyHeight = detailRows.reduce((acc, item) => {
      const lines = getLines(item.value, detailsValueW).length;
      return acc + 5 + lines * 4.5 + 2.8;
    }, 0);
    const detailsHeight = 9 + detailsBodyHeight + sectionPad;

    drawCard(y, detailsHeight);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text("Tracking Details", marginX + sectionPad, y + 6.4);

    let detailsY = y + 12.2;
    detailRows.forEach((item) => {
      const lines = getLines(item.value, detailsValueW);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`${item.label}:`, marginX + sectionPad, detailsY);

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(lines, marginX + sectionPad + detailsLabelW, detailsY);
      detailsY += 5 + lines.length * 4.5 + 2.8;
    });

    const footerY = Math.min(pageHeight - 10, y + detailsHeight + 10);
    doc.setFontSize(9.8);
    doc.setTextColor(90, 90, 90);
    doc.text(
      settings.footerNote || "Thank you for choosing Quadrato Cargo.",
      pageWidth / 2,
      footerY,
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
