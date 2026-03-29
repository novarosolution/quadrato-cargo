function toPublicInvoice(row) {
  const inv = row?.invoice;
  if (!inv || typeof inv !== "object") return null;
  const pick = (key) => {
    const v = String(inv[key] ?? "").trim();
    return v.length ? v : null;
  };
  const out = {
    number: pick("number"),
    currency: pick("currency"),
    subtotal: pick("subtotal"),
    tax: pick("tax"),
    insurance: pick("insurance"),
    customsDuties: pick("customsDuties"),
    discount: pick("discount"),
    total: pick("total"),
    lineDescription: pick("lineDescription"),
    notes: pick("notes")
  };
  return Object.values(out).some(Boolean) ? out : null;
}

export function toPublicBooking(row) {
  if (!row) return null;
  return {
    id: String(row._id),
    userId: row.userId ? String(row.userId) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
    routeType: row.routeType ?? "domestic",
    status: row.status ?? "submitted",
    consignmentNumber: row.consignmentNumber ?? null,
    trackingNotes: row.trackingNotes ?? null,
    internalNotes: row.internalNotes ?? null,
    assignedAgency: row.assignedAgency ?? null,
    pickupOtpVerifiedAt: row.pickupOtpVerifiedAt ?? null,
    agencyHandoverVerifiedAt: row.agencyHandoverVerifiedAt ?? null,
    payload: row.payload ?? null,
    courierId: row.courierId ? String(row.courierId) : null,
    invoicePdfReady: row.invoicePdfReady !== false,
    invoice: toPublicInvoice(row),
    publicBarcodeCode: row.publicBarcodeCode
      ? String(row.publicBarcodeCode).trim().toUpperCase()
      : null
  };
}

export function createBookingDoc({ routeType, payload, userId }) {
  const now = new Date();
  const safeRoute =
    routeType === "international" || routeType === "domestic"
      ? routeType
      : "domestic";

  return {
    routeType: safeRoute,
    payload: payload ?? {},
    status: "submitted",
    consignmentNumber: null,
    trackingNotes:
      "Booking received. Serviceability check at pickup PIN is pending. Logistics staff assignment and pickup confirmation will be updated manually.",
    internalNotes: null,
    serviceabilityStatus: "pending",
    workflowStage: "awaiting_serviceability_check",
    assignedAgency: null,
    pickupOtpCode: null,
    pickupOtpHash: null,
    pickupOtpExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    pickupOtpVerifiedAt: null,
    agencyHandoverOtpCode: null,
    agencyHandoverOtpHash: null,
    agencyHandoverOtpExpiresAt: null,
    agencyHandoverVerifiedAt: null,
    userId: userId ?? null,
    courierId: null,
    invoicePdfReady: false,
    invoice: null,
    createdAt: now,
    updatedAt: now
  };
}

export const bookingModelSchema = {
  collectionName: "bookings",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["routeType", "status", "payload", "createdAt", "updatedAt"],
      additionalProperties: true,
      properties: {
        routeType: { enum: ["domestic", "international"] },
        status: { bsonType: "string", minLength: 2, maxLength: 64 },
        consignmentNumber: { bsonType: ["string", "null"] },
        trackingNotes: { bsonType: ["string", "null"] },
        internalNotes: { bsonType: ["string", "null"] },
        assignedAgency: { bsonType: ["string", "null"] },
        payload: { bsonType: "object" },
        userId: { bsonType: ["objectId", "null"] },
        courierId: { bsonType: ["objectId", "null"] },
        pickupOtpCode: { bsonType: ["string", "null"] },
        pickupOtpHash: { bsonType: ["string", "null"] },
        pickupOtpExpiresAt: { bsonType: ["date", "null"] },
        pickupOtpVerifiedAt: { bsonType: ["date", "null"] },
        agencyHandoverOtpCode: { bsonType: ["string", "null"] },
        agencyHandoverOtpHash: { bsonType: ["string", "null"] },
        agencyHandoverOtpExpiresAt: { bsonType: ["date", "null"] },
        agencyHandoverVerifiedAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  indexes: [
    { key: { createdAt: -1 }, options: { name: "ix_bookings_createdAt" } },
    { key: { userId: 1, createdAt: -1 }, options: { name: "ix_bookings_user_createdAt" } },
    { key: { courierId: 1, status: 1 }, options: { name: "ix_bookings_courier_status" } },
    { key: { consignmentNumber: 1 }, options: { sparse: true, name: "ix_bookings_consignment" } },
    { key: { assignedAgency: 1, createdAt: -1 }, options: { name: "ix_bookings_agency_createdAt" } },
    {
      key: { publicBarcodeCode: 1 },
      options: { unique: true, sparse: true, name: "ix_bookings_publicBarcodeCode" }
    }
  ]
};
