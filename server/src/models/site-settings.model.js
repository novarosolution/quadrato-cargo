/** Public tracking page: `false` in DB hides; missing/`true` shows (backward compatible). */
function trackShowFlag(value) {
  return value !== false;
}

export function normalizeSiteSettings(row) {
  return {
    announcementEnabled: Boolean(row?.announcementEnabled),
    announcementText: String(row?.announcementText ?? "").trim(),
    announcementCtaLabel: String(row?.announcementCtaLabel ?? "").trim(),
    announcementCtaHref: String(row?.announcementCtaHref ?? "").trim(),
    pdfCompanyName: String(row?.pdfCompanyName ?? "Quadrato Cargo").trim(),
    pdfCompanyAddress: String(row?.pdfCompanyAddress ?? "").trim(),
    pdfLogoText: String(row?.pdfLogoText ?? "QR").trim(),
    pdfPrimaryColor: String(row?.pdfPrimaryColor ?? "#0f766e").trim(),
    pdfAccentColor: String(row?.pdfAccentColor ?? "#f97316").trim(),
    pdfCardColor: String(row?.pdfCardColor ?? "#f8fafc").trim(),
    pdfHeaderSubtitle: String(row?.pdfHeaderSubtitle ?? "International courier service").trim(),
    pdfSupportEmail: String(row?.pdfSupportEmail ?? "support@quadratocargo.com").trim(),
    pdfSupportPhone: String(row?.pdfSupportPhone ?? "+1 (555) 010-0199").trim(),
    publicInfoEmail: String(row?.publicInfoEmail ?? "").trim(),
    pdfWebsite: String(row?.pdfWebsite ?? "https://quadratocargo.com").trim(),
    pdfWatermarkText: String(row?.pdfWatermarkText ?? "Quadrato Cargo").trim(),
    pdfFooterNote: String(row?.pdfFooterNote ?? "Thank you for choosing Quadrato Cargo.").trim(),
    trackShowStatusBadge: trackShowFlag(row?.trackShowStatusBadge),
    trackShowRouteAndDates: trackShowFlag(row?.trackShowRouteAndDates),
    trackShowOperationalLog: trackShowFlag(row?.trackShowOperationalLog),
    trackShowAssignmentSection: trackShowFlag(row?.trackShowAssignmentSection),
    trackShowShipmentCard: trackShowFlag(row?.trackShowShipmentCard),
    trackShowTimeline: trackShowFlag(row?.trackShowTimeline),
    trackShowInternationalHelp: trackShowFlag(row?.trackShowInternationalHelp),
    trackShowOnHoldBanner: trackShowFlag(row?.trackShowOnHoldBanner)
  };
}

/** Shape returned next to public tracking payload (camelCase for clients). */
export function publicTrackUiFromSettings(normalized) {
  return {
    showStatusBadge: normalized.trackShowStatusBadge,
    showRouteAndDates: normalized.trackShowRouteAndDates,
    showOperationalLog: normalized.trackShowOperationalLog,
    showAssignmentSection: normalized.trackShowAssignmentSection,
    showShipmentCard: normalized.trackShowShipmentCard,
    showTimeline: normalized.trackShowTimeline,
    showInternationalHelp: normalized.trackShowInternationalHelp,
    showOnHoldBanner: normalized.trackShowOnHoldBanner
  };
}

export const siteSettingsModelSchema = {
  collectionName: "settings",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["key"],
      additionalProperties: true,
      properties: {
        key: { bsonType: "string", minLength: 1, maxLength: 100 },
        announcementEnabled: { bsonType: ["bool", "null"] },
        announcementText: { bsonType: ["string", "null"] },
        announcementCtaLabel: { bsonType: ["string", "null"] },
        announcementCtaHref: { bsonType: ["string", "null"] },
        pdfCompanyName: { bsonType: ["string", "null"] },
        pdfCompanyAddress: { bsonType: ["string", "null"] },
        pdfLogoText: { bsonType: ["string", "null"] },
        pdfPrimaryColor: { bsonType: ["string", "null"] },
        pdfAccentColor: { bsonType: ["string", "null"] },
        pdfCardColor: { bsonType: ["string", "null"] },
        pdfHeaderSubtitle: { bsonType: ["string", "null"] },
        pdfSupportEmail: { bsonType: ["string", "null"] },
        pdfSupportPhone: { bsonType: ["string", "null"] },
        publicInfoEmail: { bsonType: ["string", "null"] },
        pdfWebsite: { bsonType: ["string", "null"] },
        pdfWatermarkText: { bsonType: ["string", "null"] },
        pdfFooterNote: { bsonType: ["string", "null"] },
        trackShowStatusBadge: { bsonType: ["bool", "null"] },
        trackShowRouteAndDates: { bsonType: ["bool", "null"] },
        trackShowOperationalLog: { bsonType: ["bool", "null"] },
        trackShowAssignmentSection: { bsonType: ["bool", "null"] },
        trackShowShipmentCard: { bsonType: ["bool", "null"] },
        trackShowTimeline: { bsonType: ["bool", "null"] },
        trackShowInternationalHelp: { bsonType: ["bool", "null"] },
        trackShowOnHoldBanner: { bsonType: ["bool", "null"] },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  },
  indexes: [{ key: { key: 1 }, options: { unique: true, name: "ux_settings_key" } }]
};
