function cleanText(value) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

/** International macro timeline index 0–11; invalid / missing → null (derive from status). */
export function normalizeInternationalAgencyStage(raw) {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 11) return null;
  return n;
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
  void status;
  // Only show admin-curated public note on customer-facing surfaces.
  return cleanText(row?.publicTrackingNote);
}

const TIMELINE_STAGE_FIELDS = ["title", "location", "hint", "shownAt"];

/**
 * Deep-merge a partial timeline patch into existing overrides (per mode / stage / field).
 * Only keys present on each patch stage are applied; null or "" removes that field.
 * A stage patch of null removes the whole stage override.
 */
export function mergePublicTimelineOverrides(existingRaw, patchRaw) {
  const patch = patchRaw && typeof patchRaw === "object" ? patchRaw : {};
  const existing = existingRaw && typeof existingRaw === "object" ? existingRaw : {};

  const base = { domestic: {}, international: {} };
  for (const mode of ["domestic", "international"]) {
    const src = existing[mode];
    if (!src || typeof src !== "object") continue;
    for (const [k, v] of Object.entries(src)) {
      if (!/^\d+$/.test(k)) continue;
      if (!v || typeof v !== "object") continue;
      base[mode][k] = { ...v };
    }
  }

  for (const mode of ["domestic", "international"]) {
    const p = patch[mode];
    if (!p || typeof p !== "object") continue;
    for (const [k, v] of Object.entries(p)) {
      if (!/^\d+$/.test(k)) continue;
      if (v === null) {
        delete base[mode][k];
        continue;
      }
      if (!v || typeof v !== "object") continue;
      const prev =
        base[mode][k] && typeof base[mode][k] === "object" ? { ...base[mode][k] } : {};
      for (const field of TIMELINE_STAGE_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(v, field)) continue;
        const val = v[field];
        if (val === null || val === "") {
          delete prev[field];
        } else {
          prev[field] = String(val);
        }
      }
      if (Object.keys(prev).length) base[mode][k] = prev;
      else delete base[mode][k];
    }
  }

  return base;
}

/**
 * Optional per-stage copy for the public “professional” timeline (domestic / international).
 * Keys are string indices "0"… matching stage arrays in professional-tracking-stages.
 */
export function normalizePublicTimelineOverrides(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const mode of ["domestic", "international"]) {
    const src = raw[mode];
    if (!src || typeof src !== "object") continue;
    const dest = {};
    const maxIdx = mode === "domestic" ? 4 : 11;
    for (const [k, v] of Object.entries(src)) {
      if (!/^\d+$/.test(k)) continue;
      const idx = Number.parseInt(k, 10);
      if (idx < 0 || idx > maxIdx) continue;
      if (!v || typeof v !== "object") continue;
      const o = {};
      const title = String(v.title ?? "").trim();
      const location = String(v.location ?? "").trim();
      const hint = String(v.hint ?? "").trim();
      let shownAt = String(v.shownAt ?? "").trim();
      if (shownAt && Number.isNaN(new Date(shownAt).getTime())) shownAt = "";
      if (title) o.title = title.slice(0, 200);
      if (location) o.location = location.slice(0, 500);
      if (hint) o.hint = hint.slice(0, 2000);
      if (shownAt) o.shownAt = shownAt.slice(0, 64);
      if (Object.keys(o).length) dest[k] = o;
    }
    if (Object.keys(dest).length) out[mode] = dest;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Merge admin patches for which professional timeline steps are shown on public Track.
 * Stored shape keeps only hidden steps as `false`; missing index = visible.
 * Patch values: `false` = hide from customers, `true` = clear hide (show again).
 */
export function mergePublicTimelineStepVisibility(existingRaw, patchRaw) {
  const patch = patchRaw && typeof patchRaw === "object" ? patchRaw : {};
  const base = { domestic: {}, international: {} };

  function copyFalseKeys(from, to) {
    if (!from || typeof from !== "object") return;
    for (const [k, v] of Object.entries(from)) {
      if (!/^\d+$/.test(k)) continue;
      if (v === false) to[k] = false;
    }
  }

  copyFalseKeys(existingRaw?.domestic, base.domestic);
  copyFalseKeys(existingRaw?.international, base.international);

  for (const mode of ["domestic", "international"]) {
    const p = patch[mode];
    if (!p || typeof p !== "object") continue;
    for (const [k, v] of Object.entries(p)) {
      if (!/^\d+$/.test(k)) continue;
      if (v === true) delete base[mode][k];
      else if (v === false) base[mode][k] = false;
    }
  }
  return base;
}

/** Persist only hidden steps (`false`); omit if nothing hidden. */
export function normalizePublicTimelineStepVisibility(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const mode of ["domestic", "international"]) {
    const src = raw[mode];
    if (!src || typeof src !== "object") continue;
    const dest = {};
    const maxIdx = mode === "domestic" ? 4 : 11;
    for (const [k, v] of Object.entries(src)) {
      if (!/^\d+$/.test(k)) continue;
      const idx = Number.parseInt(k, 10);
      if (idx < 0 || idx > maxIdx) continue;
      if (v === false) dest[k] = false;
    }
    if (Object.keys(dest).length) out[mode] = dest;
  }
  return Object.keys(out).length ? out : null;
}

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

function customerFacingCreatedInstant(row) {
  return row?.customerDisplayCreatedAt ?? row?.createdAt ?? null;
}

function customerFacingUpdatedInstant(row) {
  const base = row?.updatedAt ?? row?.createdAt ?? null;
  return row?.customerDisplayUpdatedAt ?? base;
}

export function toPublicBooking(row) {
  if (!row) return null;
  const sender = row.payload?.sender ?? {};
  const recipient = row.payload?.recipient ?? {};
  const createdAt = row.createdAt;
  const updatedAt = row.updatedAt ?? row.createdAt;
  return {
    id: String(row._id),
    userId: row.userId ? String(row.userId) : null,
    createdAt,
    updatedAt,
    customerDisplayCreatedAt: row.customerDisplayCreatedAt ?? null,
    customerDisplayUpdatedAt: row.customerDisplayUpdatedAt ?? null,
    customerFacingCreatedAt: customerFacingCreatedInstant(row),
    customerFacingUpdatedAt: customerFacingUpdatedInstant(row),
    routeType: row.routeType ?? "domestic",
    status: row.status ?? "submitted",
    consignmentNumber: row.consignmentNumber ?? null,
    trackingNotes: row.trackingNotes ?? null,
    publicTrackingNote: row.publicTrackingNote ?? null,
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
    courierId: row.courierId ? String(row.courierId) : null,
    invoicePdfReady: row.invoicePdfReady !== false,
    invoice: toPublicInvoice(row),
    publicBarcodeCode: row.publicBarcodeCode
      ? String(row.publicBarcodeCode).trim().toUpperCase()
      : null,
    publicTimelineOverrides: normalizePublicTimelineOverrides(row?.publicTimelineOverrides),
    /** Per-step visibility on public Track; only `false` stored = hidden (except current step always shown). */
    publicTimelineStepVisibility: normalizePublicTimelineStepVisibility(
      row?.publicTimelineStepVisibility
    ),
    /** International: which of 12 Track cards is current; null = use coarse status mapping. */
    internationalAgencyStage: normalizeInternationalAgencyStage(row?.internationalAgencyStage),
    estimatedDeliveryAt: row.estimatedDeliveryAt ?? null,
    /** Status transition history for public timeline (omit = legacy full ladder). */
    publicTimelineStatusPath: Array.isArray(row?.publicTimelineStatusPath)
      ? row.publicTimelineStatusPath.map((s) => String(s ?? "").trim()).filter(Boolean)
      : null
  };
}

export function toPublicBookingSummary(row) {
  if (!row) return null;
  const sender = row.payload?.sender ?? {};
  const recipient = row.payload?.recipient ?? {};
  const createdAt = row.createdAt;
  const updatedAt = row.updatedAt ?? row.createdAt;
  return {
    id: String(row._id),
    userId: row.userId ? String(row.userId) : null,
    createdAt,
    updatedAt,
    customerDisplayCreatedAt: row.customerDisplayCreatedAt ?? null,
    customerDisplayUpdatedAt: row.customerDisplayUpdatedAt ?? null,
    customerFacingCreatedAt: customerFacingCreatedInstant(row),
    customerFacingUpdatedAt: customerFacingUpdatedInstant(row),
    routeType: row.routeType ?? "domestic",
    status: row.status ?? "submitted",
    consignmentNumber: row.consignmentNumber ?? null,
    trackingNotes: null,
    publicTrackingNote: row.publicTrackingNote ?? null,
    customerTrackingNote: buildCustomerTrackingNote(row.status, row),
    assignedAgency: row.assignedAgency ?? null,
    senderName: cleanText(sender.name),
    senderAddress: buildAddressLine(sender),
    recipientName: cleanText(recipient.name),
    recipientAddress: buildAddressLine(recipient),
    pickupOtpVerifiedAt: row.pickupOtpVerifiedAt ?? null,
    courierId: row.courierId ? String(row.courierId) : null,
    publicBarcodeCode: row.publicBarcodeCode
      ? String(row.publicBarcodeCode).trim().toUpperCase()
      : null,
    estimatedDeliveryAt: row.estimatedDeliveryAt ?? null,
    publicTimelineStatusPath: Array.isArray(row?.publicTimelineStatusPath)
      ? row.publicTimelineStatusPath.map((s) => String(s ?? "").trim()).filter(Boolean)
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
    trackingNotes: null,
    publicTrackingNote: null,
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
    publicTimelineStatusPath: ["submitted"],
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
        publicTrackingNote: { bsonType: ["string", "null"] },
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
