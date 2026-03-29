function cleanText(value) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function buildAddressLine(address = {}) {
  const parts = [
    cleanText(address.street),
    cleanText(address.city),
    cleanText(address.postal),
    cleanText(address.country)
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function buildCustomerTrackingNote(status, row) {
  const normalizedStatus = String(status ?? "").trim() || "submitted";
  const statusMessages = {
    submitted: "Booking received and waiting for confirmation.",
    confirmed: "Shipment details have been confirmed by dispatch.",
    serviceability_check: "Pickup area serviceability is being verified.",
    serviceable: "Pickup location is serviceable.",
    pickup_scheduled: "Pickup has been scheduled.",
    out_for_pickup: "Courier partner is on the way for pickup.",
    picked_up: "Shipment has been picked up from sender.",
    agency_processing: "Shipment is under agency processing.",
    in_transit: "Shipment is in transit to destination.",
    out_for_delivery: "Shipment is out for delivery.",
    delivery_attempted: "A delivery attempt was recorded.",
    on_hold: "Shipment is currently on hold.",
    delivered: "Shipment has been delivered successfully.",
    cancelled: "Shipment has been cancelled."
  };

  const base = statusMessages[normalizedStatus] || "Shipment status has been updated.";
  const consignment = cleanText(row?.consignmentNumber);
  return consignment ? `${base} Consignment: ${consignment}.` : base;
}

export function toPublicBooking(row) {
  if (!row) return null;
  const sender = row.payload?.sender ?? {};
  const recipient = row.payload?.recipient ?? {};
  return {
    id: String(row._id),
    userId: row.userId ? String(row.userId) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
    routeType: row.routeType ?? "domestic",
    status: row.status ?? "submitted",
    consignmentNumber: row.consignmentNumber ?? null,
    trackingNotes: row.trackingNotes ?? null,
    customerTrackingNote: buildCustomerTrackingNote(row.status, row),
    internalNotes: row.internalNotes ?? null,
    assignedAgency: row.assignedAgency ?? null,
    senderName: cleanText(sender.name),
    senderAddress: buildAddressLine(sender),
    recipientName: cleanText(recipient.name),
    recipientAddress: buildAddressLine(recipient),
    pickupOtpVerifiedAt: row.pickupOtpVerifiedAt ?? null,
    agencyHandoverVerifiedAt: row.agencyHandoverVerifiedAt ?? null,
    payload: row.payload ?? null,
    courierId: row.courierId ? String(row.courierId) : null
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
    { key: { assignedAgency: 1, createdAt: -1 }, options: { name: "ix_bookings_agency_createdAt" } }
  ]
};
