export function normalizeSiteSettings(row) {
  return {
    announcementEnabled: Boolean(row?.announcementEnabled),
    announcementText: String(row?.announcementText ?? "").trim(),
    announcementCtaLabel: String(row?.announcementCtaLabel ?? "").trim(),
    announcementCtaHref: String(row?.announcementCtaHref ?? "").trim()
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
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  },
  indexes: [{ key: { key: 1 }, options: { unique: true, name: "ux_settings_key" } }]
};
