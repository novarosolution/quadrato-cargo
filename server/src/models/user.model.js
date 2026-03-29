export function toPublicUser(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    email: doc.email ?? "",
    name: doc.name ?? null,
    addressBook: doc.addressBook ?? { sender: null, recipient: null },
    role: doc.role ?? "customer",
    isActive: doc.isActive !== false,
    isOnDuty: doc.isOnDuty !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export function createUserDoc({ email, name, passwordHash, role = "customer" }) {
  const now = new Date();
  return {
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
