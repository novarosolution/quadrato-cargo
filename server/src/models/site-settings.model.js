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
    pdfWebsite: String(row?.pdfWebsite ?? "https://quadratocargo.com").trim(),
    pdfWatermarkText: String(row?.pdfWatermarkText ?? "Quadrato Cargo").trim(),
    pdfFooterNote: String(row?.pdfFooterNote ?? "Thank you for choosing Quadrato Cargo.").trim()
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
        pdfWebsite: { bsonType: ["string", "null"] },
        pdfWatermarkText: { bsonType: ["string", "null"] },
        pdfFooterNote: { bsonType: ["string", "null"] },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  },
  indexes: [{ key: { key: 1 }, options: { unique: true, name: "ux_settings_key" } }]
};
