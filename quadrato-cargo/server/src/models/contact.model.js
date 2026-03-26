export function toPublicContact(row) {
  if (!row) return null;
  return {
    id: String(row._id),
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? null,
    service: row.service ?? "",
    message: row.message ?? "",
    createdAt: row.createdAt
  };
}

export function createContactDoc(data) {
  return {
    name: String(data?.name ?? "").trim(),
    email: String(data?.email ?? "").trim().toLowerCase(),
    phone: String(data?.phone ?? "").trim() || null,
    service: String(data?.service ?? "").trim(),
    message: String(data?.message ?? "").trim(),
    createdAt: new Date()
  };
}

export const contactModelSchema = {
  collectionName: "contacts",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "service", "message", "createdAt"],
      additionalProperties: true,
      properties: {
        name: { bsonType: "string", minLength: 1, maxLength: 200 },
        email: { bsonType: "string", minLength: 3, maxLength: 320 },
        phone: { bsonType: ["string", "null"] },
        service: { bsonType: "string", minLength: 1, maxLength: 200 },
        message: { bsonType: "string", minLength: 1, maxLength: 5000 },
        createdAt: { bsonType: "date" }
      }
    }
  },
  indexes: [
    { key: { createdAt: -1 }, options: { name: "ix_contacts_createdAt" } },
    { key: { email: 1, createdAt: -1 }, options: { name: "ix_contacts_email_createdAt" } }
  ]
};
