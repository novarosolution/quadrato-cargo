export function toPublicUser(doc) {
  if (!doc) return null;
  const role = doc.role ?? "customer";
  const agencyAddress =
    role === "agency" ? String(doc.agencyAddress ?? "").trim() || null : null;
  const agencyPhone =
    role === "agency" ? String(doc.agencyPhone ?? "").trim() || null : null;
  const agencyCity =
    role === "agency" ? String(doc.agencyCity ?? "").trim() || null : null;
  return {
    id: String(doc._id),
    email: doc.email ?? "",
    name: doc.name ?? null,
    addressBook: doc.addressBook ?? { sender: null, recipient: null },
    role,
    isActive: doc.isActive !== false,
    isOnDuty: doc.isOnDuty !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    agencyAddress,
    agencyPhone,
    agencyCity
  };
}

export function createUserDoc({
  email,
  name,
  passwordHash,
  role = "customer",
  agencyAddress = null,
  agencyPhone = null,
  agencyCity = null
}) {
  const now = new Date();
  const doc = {
    email: String(email ?? "").trim().toLowerCase(),
    name: String(name ?? "").trim() || null,
    addressBook: {
      sender: null,
      recipient: null
    },
    passwordHash,
    role,
    isActive: true,
    isOnDuty: true,
    createdAt: now,
    updatedAt: now
  };
  if (role === "agency") {
    const addr = agencyAddress != null ? String(agencyAddress).trim().slice(0, 500) : "";
    const phone = agencyPhone != null ? String(agencyPhone).trim().slice(0, 40) : "";
    const city = agencyCity != null ? String(agencyCity).trim().slice(0, 80) : "";
    doc.agencyAddress = addr || null;
    doc.agencyPhone = phone || null;
    doc.agencyCity = city || null;
  }
  return doc;
}

export const userModelSchema = {
  collectionName: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "passwordHash", "role", "isActive", "isOnDuty", "createdAt", "updatedAt"],
      additionalProperties: true,
      properties: {
        email: { bsonType: "string", minLength: 3, maxLength: 320 },
        passwordHash: { bsonType: "string", minLength: 10 },
        name: { bsonType: ["string", "null"] },
        role: { enum: ["customer", "staff", "courier", "agency"] },
        isActive: { bsonType: "bool" },
        isOnDuty: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  indexes: [
    { key: { email: 1 }, options: { unique: true, name: "ux_users_email" } },
    { key: { role: 1, createdAt: -1 }, options: { name: "ix_users_role_createdAt" } },
    { key: { isActive: 1, isOnDuty: 1 }, options: { name: "ix_users_status_flags" } }
  ]
};
