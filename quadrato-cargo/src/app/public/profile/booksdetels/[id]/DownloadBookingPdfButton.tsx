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
    const bottomReserve = 18;

    const safe = (value: string) => {
      const normalized = String(value ?? "").trim();
      return normalized.length > 0 ? normalized : "-";
    };

    const getLines = (value: string, width: number) =>
      doc.splitTextToSize(safe(value), width);

    const fitSingleLine = (
      value: string,
      maxWidth: number,
      size: number,
      style: "normal" | "bold" = "normal",
    ) => {
      const input = safe(value);
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      if (doc.getTextWidth(input) <= maxWidth) return input;
      let trimmed = input;
      while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}...`) > maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      return `${trimmed}...`;
    };

    const drawCard = (y: number, h: number, fillRgb?: [number, number, number]) => {
      if (fillRgb) {
        doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
      } else {
        doc.setFillColor(cr, cg, cb);
      }
      doc.roundedRect(marginX, y, contentWidth, h, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, y, contentWidth, h, 3, 3);
    };

    const rowHeight = (linesCount: number) => 4.8 + linesCount * 4.4 + 2.2;

    const drawPageFooter = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.2);
      doc.setTextColor(100, 116, 139);
      doc.text(safe(settings.footerNote), pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    };

    const drawSection = (
      yStart: number,
      title: string,
      rows: Array<{ label: string; value: string }>,
      fillRgb?: [number, number, number],
    ) => {
      const sectionPad = 4.6;
      const labelW = 30;
      const valueW = contentWidth - sectionPad * 2 - labelW - 2;
      const iconByTitle: Record<string, string> = {
        "Shipment Summary": "S",
        "Parcel Details": "P",
        "Tracking Details": "T",
        "Support & Contact": "C",
      };
      const sectionIcon = iconByTitle[title] || "I";
      const normalizedRows = rows.map((row) => ({
        label: row.label,
        lines: getLines(row.value, valueW),
      }));
      const bodyHeight = normalizedRows.reduce(
        (acc, row) => acc + rowHeight(row.lines.length),
        0,
      );
      const sectionHeight = 10 + bodyHeight + sectionPad;

      drawCard(yStart, sectionHeight, fillRgb);
      doc.setFillColor(255, 255, 255);
      doc.circle(marginX + sectionPad + 2.7, yStart + 5.5, 2.6, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      doc.text(sectionIcon, marginX + sectionPad + 2.7, yStart + 6.5, {
        align: "center",
      });
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.4);
      doc.text(title, marginX + sectionPad + 7.2, yStart + 6.5);
      doc.setDrawColor(223, 230, 237);
      doc.line(marginX + sectionPad, yStart + 8.4, pageWidth - marginX - sectionPad, yStart + 8.4);

      let yRow = yStart + 12.3;
      normalizedRows.forEach((row) => {
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(`${row.label}:`, marginX + sectionPad, yRow);

        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(row.lines, marginX + sectionPad + labelW, yRow);
        yRow += rowHeight(row.lines.length);
      });

      return yStart + sectionHeight;
    };

    const drawIconBubble = (x: number, y: number, glyph: string) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.circle(x, y, 2.6, "FD");
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(glyph, x, y + 0.6, { align: "center" });
    };

    const drawShipmentSummaryCard = (yStart: number) => {
      const sectionPad = 4.8;
      const topBandHeight = 26;
      const rows: Array<Array<{ icon: string; label: string; value: string }>> = [
        [
          { icon: "D", label: "Booked At", value: bookingDateLabel },
          { icon: "U", label: "Last Update", value: updatedAtLabel },
        ],
        [
          { icon: "S", label: "Status", value: statusLabel },
          { icon: "R", label: "Route", value: routeTypeLabel },
        ],
        [
          { icon: "F", label: "From City", value: fromCity },
          { icon: "T", label: "To City", value: toCity },
        ],
        [
          { icon: "SN", label: "Sender", value: senderName },
          { icon: "RN", label: "Recipient", value: recipientName },
        ],
        [{ icon: "A", label: "Agency", value: agencyLabel }],
      ];

      const colGap = 10;
      const colWidth = (contentWidth - sectionPad * 2 - colGap) / 2;
      const leftX = marginX + sectionPad;
      const rightX = leftX + colWidth + colGap;
      const labelW = 30;
      const valueW = colWidth - labelW - 4;
      const rowGap = 4.8;

      const rowHeights = rows.map((pair) => {
        if (pair.length === 1) {
          const lines = getLines(pair[0].value, contentWidth - sectionPad * 2 - labelW - 4);
          return 4.5 + lines.length * 4.4 + 2.4;
        }
        const leftLines = getLines(pair[0].value, valueW).length;
        const rightLines = getLines(pair[1].value, valueW).length;
        return 4.5 + Math.max(leftLines, rightLines) * 4.4 + 2.4;
      });

      const bodyHeight = rowHeights.reduce((acc, h) => acc + h + rowGap, 0);
      const cardHeight = 10 + topBandHeight + 6 + bodyHeight + sectionPad;

      drawCard(yStart, cardHeight, [255, 255, 255]);
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.8);
      doc.text("Shipment Summary", marginX + sectionPad + 8, yStart + 6.8);
      drawIconBubble(marginX + sectionPad + 2.7, yStart + 5.9, "S");

      const bandY = yStart + 10;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX + sectionPad, bandY, contentWidth - sectionPad * 2, topBandHeight, 2, 2, "F");

      const bandCenterX = pageWidth / 2;
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX + sectionPad + 55, bandY + 13, bandCenterX - 11, bandY + 13);
      doc.line(bandCenterX + 11, bandY + 13, pageWidth - marginX - sectionPad - 55, bandY + 13);

      drawIconBubble(marginX + sectionPad + 3, bandY + 8.8, "D");
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.text("Booked", marginX + sectionPad + 8.2, bandY + 7.4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      doc.text(fitSingleLine(bookingDateLabel, 44, 8.8), marginX + sectionPad + 8.2, bandY + 12.2);

      drawIconBubble(pageWidth - marginX - sectionPad - 49, bandY + 8.8, "U");
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.text("Last Update", pageWidth - marginX - sectionPad - 44, bandY + 7.4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      doc.text(fitSingleLine(updatedAtLabel, 44, 8.8), pageWidth - marginX - sectionPad - 44, bandY + 12.2);

      doc.setFillColor(236, 253, 245);
      doc.circle(bandCenterX, bandY + 13, 7, "F");
      doc.setDrawColor(187, 247, 208);
      doc.circle(bandCenterX, bandY + 13, 6, "D");
      doc.setTextColor(5, 150, 105);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.6);
      doc.text("S", bandCenterX, bandY + 13.7, { align: "center" });
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.2);
      doc.text(
        fitSingleLine(`Status: ${statusLabel}`, 60, 9.2, "bold"),
        bandCenterX,
        bandY + 20.4,
        { align: "center" },
      );

      doc.setDrawColor(226, 232, 240);
      doc.line(marginX + sectionPad, bandY + topBandHeight + 2.5, pageWidth - marginX - sectionPad, bandY + topBandHeight + 2.5);

      let rowY = bandY + topBandHeight + 8;
      rows.forEach((pair, idx) => {
        if (pair.length === 1) {
          const item = pair[0];
          drawIconBubble(leftX + 2.5, rowY - 0.2, item.icon);
          doc.setTextColor(31, 41, 55);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.7);
          doc.text(`${item.label}:`, leftX + 7.6, rowY);
          doc.setTextColor(17, 24, 39);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10.2);
          doc.text(getLines(item.value, contentWidth - sectionPad * 2 - labelW - 4), leftX + labelW + 2, rowY);
        } else {
          const left = pair[0];
          const right = pair[1];
          drawIconBubble(leftX + 2.5, rowY - 0.2, left.icon);
          drawIconBubble(rightX + 2.5, rowY - 0.2, right.icon);

          doc.setTextColor(31, 41, 55);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.7);
          doc.text(`${left.label}:`, leftX + 7.6, rowY);
          doc.text(`${right.label}:`, rightX + 7.6, rowY);

          const leftLines = getLines(left.value, valueW);
          const rightLines = getLines(right.value, valueW);
          doc.setTextColor(17, 24, 39);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10.2);
          doc.text(leftLines, leftX + labelW + 2, rowY);
          doc.text(rightLines, rightX + labelW + 2, rowY);
        }
        rowY += rowHeights[idx] + rowGap;
      });

      return yStart + cardHeight;
    };

    const drawFirstPageHeader = (qrDataUrl: string | null) => {
      const logoText = fitSingleLine(settings.logoText || "QC", 16, 8.6, "bold");
      const companyNameLines = doc.splitTextToSize(
        safe(settings.companyName || "Quadrato Cargo"),
        94,
      );
      const subtitleLine = fitSingleLine(
        settings.headerSubtitle || "International courier service",
        94,
        10.3,
        "normal",
      );
      const companyAddressLines = doc.splitTextToSize(
        safe(settings.companyAddress || "International courier service"),
        94,
      );
      const referenceLine = `Ref: ${safe(reference)}`;
      const headerTextHeight =
        companyNameLines.length * 7 +
        4.8 +
        companyAddressLines.length * 4.5 +
        18;
      const headerHeight = Math.max(56, headerTextHeight + 12);

      doc.setFillColor(r, g, b);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setFillColor(ar, ag, ab);
      doc.rect(0, headerHeight - 3, pageWidth, 3, "F");

      const logoCx = marginX + 10;
      const logoCy = 14;
      doc.setFillColor(241, 245, 249);
      doc.circle(logoCx, logoCy, 9.3, "F");
      doc.setFillColor(226, 232, 240);
      doc.circle(logoCx, logoCy, 7.8, "F");
      doc.setFillColor(203, 213, 225);
      doc.circle(logoCx, logoCy, 6.2, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.6);
      doc.text(logoText, logoCx, logoCy + 0.8, {
        align: "center",
      });

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(companyNameLines, marginX + 22, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.3);
      doc.text(subtitleLine, marginX + 22, 15 + companyNameLines.length * 7 + 1);
      doc.setFontSize(9.6);
      doc.text(
        companyAddressLines,
        marginX + 22,
        15 + companyNameLines.length * 7 + 6.8,
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.2);
      doc.text(
        referenceLine,
        marginX + 22,
        15 +
          companyNameLines.length * 7 +
          4.8 +
          companyAddressLines.length * 4.5 +
          8,
      );

      const chipY =
        15 +
        companyNameLines.length * 7 +
        4.8 +
        companyAddressLines.length * 4.5 +
        12;
      const statusChip = fitSingleLine(`STATUS ${statusLabel}`, 50, 8.4, "bold");
      const routeChip = fitSingleLine(`ROUTE ${routeTypeLabel}`, 50, 8.4, "bold");
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(marginX + 22, chipY - 4, 54, 8, 2, 2, "F");
      doc.roundedRect(marginX + 80, chipY - 4, 54, 8, 2, 2, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.4);
      doc.text(statusChip, marginX + 49, chipY + 1.2, { align: "center" });
      doc.text(routeChip, marginX + 107, chipY + 1.2, { align: "center" });

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
      doc.text(
        "SCAN TO TRACK",
        qrCardX + qrCardSize / 2,
        qrCardY + qrCardSize - 2.5,
        {
          align: "center",
        },
      );

      const wmText = safe(settings.watermarkText || "Quadrato Cargo");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(31);
      doc.text(wmText, pageWidth / 2, headerHeight + 38, {
        align: "center",
        angle: 24,
      });

      return headerHeight + 8;
    };

    const drawNextPageHeader = () => {
      doc.setFillColor(r, g, b);
      doc.rect(0, 0, pageWidth, 16, "F");
      doc.setFillColor(ar, ag, ab);
      doc.rect(0, 14, pageWidth, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(safe(settings.companyName || "Quadrato Cargo"), marginX, 10.5);
      return 22;
    };

    const ensureSpace = (y: number, neededHeight: number) => {
      if (y + neededHeight <= pageHeight - bottomReserve) {
        return y;
      }
      drawPageFooter();
      doc.addPage();
      return drawNextPageHeader();
    };

    const qrDataUrl = await QRCode.toDataURL(trackUrl, {
      width: 512,
      margin: 1,
      color: {
        dark: toHex(settings.primaryColor, "#0f766e"),
        light: "#ffffff",
      },
    }).catch(() => null);

    let y = drawFirstPageHeader(qrDataUrl);
    doc.setTextColor(32, 32, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    y = ensureSpace(y, 110);
    y = drawShipmentSummaryCard(y) + 6;

    y = ensureSpace(y, 74);
    y =
      drawSection(
        y,
        "Parcel Details",
        [
          { label: "Declared Value", value: amountLabel },
          { label: "Weight", value: weightLabel },
          { label: "Dimensions", value: dimensionsLabel },
          { label: "Contents", value: contentsLabel },
          { label: "Instructions", value: instructionsLabel },
        ],
        [255, 255, 255],
      ) + 6;

    y = ensureSpace(y, 74);
    y =
      drawSection(
        y,
        "Tracking Details",
        [
          { label: "Reference", value: reference },
          { label: "Booking ID", value: bookingId },
          { label: "Consignment No", value: consignmentNumber },
          { label: "Tracking URL", value: trackUrl },
          { label: "Dispatch Notes", value: trackingNotesLabel },
        ],
        [cr, cg, cb],
      ) + 6;

    y = ensureSpace(y, 60);
    drawSection(
      y,
      "Support & Contact",
      [
        { label: "Email", value: safe(settings.supportEmail) },
        { label: "Phone", value: safe(settings.supportPhone) },
        { label: "Website", value: safe(settings.website) },
      ],
      [255, 255, 255],
    );

    drawPageFooter();
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
