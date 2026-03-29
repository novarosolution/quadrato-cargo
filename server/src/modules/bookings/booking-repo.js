import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../../db/mongo.js";
import {
  createBookingDoc,
  toPublicBooking,
  toPublicBookingSummary
} from "../../models/booking.model.js";
import {
  computePublicBarcodeCode,
  isPublicBarcodeCodeFormat
} from "../../shared/public-barcode-code.js";

const BOOKINGS = "bookings";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeReference(value) {
  const compact = String(value ?? "")
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return compact;
}

function buildAgencyAssignmentFilter(agencyUser) {
  const email = String(agencyUser?.email ?? "").trim().toLowerCase();
  const name = String(agencyUser?.name ?? "").trim();
  const terms = [email, name].filter((term) => term.length >= 3);
  if (terms.length === 0) return null;

  const rules = [];
  for (const term of terms) {
    const escaped = escapeRegex(term);
    rules.push({ assignedAgency: { $regex: `^${escaped}$`, $options: "i" } });
    rules.push({ assignedAgency: { $regex: escaped, $options: "i" } });
  }
  return { $or: rules };
}

function buildReferenceCandidates(reference) {
  const ref = String(reference ?? "").trim();
  if (!ref) return [];
  const normalizedRef = normalizeReference(ref);

  const candidates = [];
  if (isPublicBarcodeCodeFormat(normalizedRef)) {
    candidates.push({ publicBarcodeCode: normalizedRef.toUpperCase() });
  }

  candidates.push(
    { consignmentNumber: ref },
    { consignmentNumber: { $regex: `^${escapeRegex(ref)}$`, $options: "i" } }
  );
  if (normalizedRef && normalizedRef.toLowerCase() !== ref.toLowerCase()) {
    candidates.push({ consignmentNumber: normalizedRef });
    candidates.push({
      consignmentNumber: { $regex: `^${escapeRegex(normalizedRef)}$`, $options: "i" }
    });
  }
  if (ObjectId.isValid(ref)) candidates.push({ _id: new ObjectId(ref) });
  return candidates;
}

export async function backfillPublicBarcodeCodes() {
  const db = await getDb();
  const cursor = db.collection(BOOKINGS).find({
    $or: [{ publicBarcodeCode: { $exists: false } }, { publicBarcodeCode: null }, { publicBarcodeCode: "" }]
  });
  let updated = 0;
  for await (const doc of cursor) {
    const code = computePublicBarcodeCode(String(doc._id));
    try {
      const res = await db.collection(BOOKINGS).updateOne(
        { _id: doc._id, $or: [{ publicBarcodeCode: { $exists: false } }, { publicBarcodeCode: null }, { publicBarcodeCode: "" }] },
        { $set: { publicBarcodeCode: code, updatedAt: new Date() } }
      );
      if (res.modifiedCount) updated += 1;
    } catch (e) {
      if (e && e.code === 11000) continue;
      throw e;
    }
  }
  if (updated > 0) {
    console.info(`[bookings] Backfilled publicBarcodeCode on ${updated} booking(s).`);
  }
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function generatePickupOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateUniqueAgencyOtpCode(db, currentBookingId) {
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const code = generatePickupOtpCode();
    const codeHash = hashOtp(code);
    const existing = await db.collection(BOOKINGS).findOne({
      _id: { $ne: currentBookingId },
      agencyHandoverOtpHash: codeHash,
      agencyHandoverVerifiedAt: null,
      agencyHandoverOtpExpiresAt: { $gt: now }
    });
    if (!existing) {
      return code;
    }
  }
  return generatePickupOtpCode();
}

function toObjectIdOrNull(id) {
  if (!id || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

const COURIER_OPEN_STATUSES = new Set([
  "submitted",
  "confirmed",
  "serviceability_check",
  "serviceable",
  "pickup_scheduled",
  "out_for_pickup"
]);

export async function listBookingsByUserId(
  userId,
  userEmail = "",
  options = {}
) {
  const limit = Number.isFinite(Number(options?.limit))
    ? Math.max(1, Math.min(100, Number(options.limit)))
    : 100;
  const useSummary = Boolean(options?.summary);
  const shouldBackfill = Boolean(options?.backfill);
  const db = await getDb();
  if (!ObjectId.isValid(userId)) return [];
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  const emailRegex = normalizedEmail ? `^${escapeRegex(normalizedEmail)}$` : "";
  const where = {
    $or: [{ userId: new ObjectId(userId) }]
  };
  if (normalizedEmail) {
    where.$or.push({
      userId: null,
      "payload.sender.email": { $regex: emailRegex, $options: "i" }
    });
  }

  // Optional backfill for legacy guest bookings by sender email.
  if (shouldBackfill && normalizedEmail) {
    await db.collection(BOOKINGS).updateMany(
      {
        userId: null,
        "payload.sender.email": { $regex: emailRegex, $options: "i" }
      },
      { $set: { userId: new ObjectId(userId), updatedAt: new Date() } }
    );
  }

  const projection = useSummary
    ? {
        routeType: 1,
        status: 1,
        consignmentNumber: 1,
        publicBarcodeCode: 1,
        assignedAgency: 1,
        pickupOtpVerifiedAt: 1,
        courierId: 1,
        userId: 1,
        createdAt: 1,
        updatedAt: 1,
        "payload.sender": 1,
        "payload.recipient": 1
      }
    : undefined;
  const cursor = db.collection(BOOKINGS).find(where, projection ? { projection } : {})
    .sort({ createdAt: -1 })
    .limit(limit);
  const rows = await cursor.toArray();
  return rows.map(useSummary ? toPublicBookingSummary : toPublicBooking);
}

export async function findBookingByUserAndId(userId, bookingId, userEmail = "") {
  const db = await getDb();
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(bookingId)) return null;
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  const emailRegex = normalizedEmail ? `^${escapeRegex(normalizedEmail)}$` : "";
  const where = {
    _id: new ObjectId(bookingId),
    $or: [{ userId: new ObjectId(userId) }]
  };
  if (normalizedEmail) {
    where.$or.push({
      userId: null,
      "payload.sender.email": { $regex: emailRegex, $options: "i" }
    });
  }
  const row = await db.collection(BOOKINGS).findOne({
    ...where
  });
  return toPublicBooking(row);
}

export async function createBooking({
  routeType,
  payload,
  userId = null
}) {
  const db = await getDb();
  const created = createBookingDoc({
    routeType,
    payload,
    userId: toObjectIdOrNull(userId)
  });
  created.pickupOtpCode = generatePickupOtpCode();
  created.pickupOtpHash = hashOtp(created.pickupOtpCode);
  const result = await db.collection(BOOKINGS).insertOne(created);
  const idStr = String(result.insertedId);
  const publicBarcodeCode = computePublicBarcodeCode(idStr);
  await db.collection(BOOKINGS).updateOne(
    { _id: result.insertedId },
    { $set: { publicBarcodeCode, updatedAt: new Date() } }
  );
  return toPublicBooking({ ...created, _id: result.insertedId, publicBarcodeCode });
}

export async function findBookingByReference(reference) {
  const db = await getDb();
  const candidates = buildReferenceCandidates(reference);
  if (candidates.length === 0) return null;
  const row = await db
    .collection(BOOKINGS)
    .findOne({ $or: candidates }, { sort: { createdAt: -1 } });
  return toPublicBooking(row);
}

export async function listBookingsByCourierId(courierId, limit = 100) {
  const db = await getDb();
  if (!ObjectId.isValid(courierId)) return [];
  const rows = await db
    .collection(BOOKINGS)
    .find({ courierId: new ObjectId(courierId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map(toPublicBooking);
}

export async function findBookingByCourierAndId(courierId, bookingId) {
  const db = await getDb();
  if (!ObjectId.isValid(courierId) || !ObjectId.isValid(bookingId)) return null;
  const row = await db.collection(BOOKINGS).findOne({
    _id: new ObjectId(bookingId),
    courierId: new ObjectId(courierId)
  });
  if (!row) return null;
  const pub = toPublicBooking(row);
  return {
    ...pub,
    agencyHandoverOtpCode: row.agencyHandoverOtpCode ?? null,
    agencyHandoverOtpExpiresAt: row.agencyHandoverOtpExpiresAt ?? null
  };
}

export async function getPickupOtpForUserBooking(userId, bookingId, userEmail = "") {
  const db = await getDb();
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(bookingId)) return null;
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  const where = {
    _id: new ObjectId(bookingId),
    $or: [{ userId: new ObjectId(userId) }]
  };
  if (normalizedEmail) {
    where.$or.push({
      userId: null,
      "payload.sender.email": { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" }
    });
  }
  const row = await db.collection(BOOKINGS).findOne(where, {
    projection: {
      pickupOtpCode: 1,
      pickupOtpExpiresAt: 1,
      pickupOtpVerifiedAt: 1,
      status: 1
    }
  });
  if (!row) return null;
  return {
    code: row.pickupOtpCode ?? null,
    expiresAt: row.pickupOtpExpiresAt ?? null,
    verifiedAt: row.pickupOtpVerifiedAt ?? null,
    status: row.status ?? "submitted"
  };
}

export async function verifyPickupOtpByCourier(courierId, bookingId, code) {
  const db = await getDb();
  if (!ObjectId.isValid(courierId) || !ObjectId.isValid(bookingId)) {
    return { ok: false, reason: "not_found" };
  }
  const row = await db.collection(BOOKINGS).findOne({
    _id: new ObjectId(bookingId),
    courierId: new ObjectId(courierId)
  });
  if (!row) return { ok: false, reason: "not_found" };
  const lockedStatuses = new Set([
    "agency_processing",
    "in_transit",
    "out_for_delivery",
    "delivery_attempted",
    "on_hold",
    "delivered",
    "cancelled"
  ]);
  if (row.agencyHandoverVerifiedAt || lockedStatuses.has(String(row.status ?? ""))) {
    return { ok: false, reason: "handover_done" };
  }
  if (row.pickupOtpVerifiedAt) {
    return { ok: true, alreadyVerified: true, booking: toPublicBooking(row) };
  }

  const expiresAt = row.pickupOtpExpiresAt ? new Date(row.pickupOtpExpiresAt) : null;
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const expected = String(row.pickupOtpHash ?? "");
  const provided = hashOtp(String(code ?? "").trim());
  if (!expected || expected !== provided) {
    return { ok: false, reason: "invalid" };
  }

  const now = new Date();
  const agencyOtpCode = await generateUniqueAgencyOtpCode(db, row._id);
  const line = `[${now.toLocaleString()}] Pickup OTP verified by courier; parcel marked picked up.`;
  const nextNotes = row.trackingNotes ? `${row.trackingNotes}\n${line}` : line;
  const result = await db.collection(BOOKINGS).findOneAndUpdate(
    { _id: row._id, courierId: row.courierId },
    {
      $set: {
        status: "picked_up",
        pickupOtpVerifiedAt: now,
        agencyHandoverOtpCode: agencyOtpCode,
        agencyHandoverOtpHash: hashOtp(agencyOtpCode),
        agencyHandoverOtpExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        agencyHandoverVerifiedAt: null,
        trackingNotes: nextNotes,
        updatedAt: now
      }
    },
    { returnDocument: "after" }
  );
  const updated = result?.value ?? result;
  return {
    ok: true,
    alreadyVerified: false,
    booking: {
      ...toPublicBooking(updated),
      agencyHandoverOtpCode: updated?.agencyHandoverOtpCode ?? null,
      agencyHandoverOtpExpiresAt: updated?.agencyHandoverOtpExpiresAt ?? null
    }
  };
}

export async function startCourierJob(courierId, bookingId) {
  const db = await getDb();
  if (!ObjectId.isValid(courierId) || !ObjectId.isValid(bookingId)) {
    return { ok: false, reason: "not_found" };
  }

  const row = await db.collection(BOOKINGS).findOne({
    _id: new ObjectId(bookingId),
    courierId: new ObjectId(courierId)
  });
  if (!row) return { ok: false, reason: "not_found" };

  const status = String(row.status ?? "submitted");
  if (status === "out_for_pickup") {
    return { ok: true, alreadyStarted: true, booking: toPublicBooking(row) };
  }
  if (!COURIER_OPEN_STATUSES.has(status)) {
    return { ok: false, reason: "invalid_state" };
  }

  const now = new Date();
  const line = `[${now.toLocaleString()}] Courier started job and is now out for pickup.`;
  const nextNotes = row.trackingNotes ? `${row.trackingNotes}\n${line}` : line;
  const result = await db.collection(BOOKINGS).findOneAndUpdate(
    { _id: row._id, courierId: row.courierId },
    {
      $set: {
        status: "out_for_pickup",
        trackingNotes: nextNotes,
        updatedAt: now
      }
    },
    { returnDocument: "after" }
  );
  const updated = result?.value ?? result;
  return {
    ok: true,
    alreadyStarted: false,
    booking: toPublicBooking(updated)
  };
}

export async function listBookingsByAgency(agencyUser, limit = 100) {
  const db = await getDb();
  const agencyFilter = buildAgencyAssignmentFilter(agencyUser);
  if (!agencyFilter) return [];
  const rows = await db
    .collection(BOOKINGS)
    .find(agencyFilter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map(toPublicBooking);
}

export async function verifyAgencyHandoverOtp(agencyUser, reference, otpCode) {
  const db = await getDb();
  const ref = String(reference ?? "").trim();
  const code = String(otpCode ?? "").trim();
  if (!ref || !code) return { ok: false, reason: "invalid" };
  const candidates = buildReferenceCandidates(ref);

  const agencyFilter = buildAgencyAssignmentFilter(agencyUser);
  if (!agencyFilter) return { ok: false, reason: "not_found" };

  const row = await db.collection(BOOKINGS).findOne({
    $and: [{ $or: candidates }, agencyFilter]
  });
  if (!row) return { ok: false, reason: "not_found" };
  if (row.agencyHandoverVerifiedAt) {
    return { ok: true, alreadyVerified: true, booking: toPublicBooking(row) };
  }
  if (!row.agencyHandoverOtpHash) {
    return { ok: false, reason: "handover_not_ready" };
  }
  const expiresAt = row.agencyHandoverOtpExpiresAt ? new Date(row.agencyHandoverOtpExpiresAt) : null;
  if (expiresAt && expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.agencyHandoverOtpHash !== hashOtp(code)) {
    return { ok: false, reason: "invalid" };
  }
  const now = new Date();
  const line = `[${now.toLocaleString()}] Agency handover OTP verified; agency processing started.`;
  const nextNotes = row.trackingNotes ? `${row.trackingNotes}\n${line}` : line;
  const result = await db.collection(BOOKINGS).findOneAndUpdate(
    { _id: row._id },
    {
      $set: {
        status: "agency_processing",
        agencyHandoverVerifiedAt: now,
        trackingNotes: nextNotes,
        updatedAt: now
      }
    },
    { returnDocument: "after" }
  );
  const updated = result?.value ?? result;
  return { ok: true, alreadyVerified: false, booking: toPublicBooking(updated) };
}

export async function updateBookingByAgency(agencyUser, bookingId, update) {
  const db = await getDb();
  if (!ObjectId.isValid(bookingId)) return null;
  const _id = new ObjectId(bookingId);

  const agencyFilter = buildAgencyAssignmentFilter(agencyUser);
  if (!agencyFilter) return null;

  const status = String(update?.status ?? "").trim();
  const publicTrackingNote =
    String(update?.publicTrackingNote ?? update?.trackingNotes ?? "").trim() || null;
  const result = await db.collection(BOOKINGS).findOneAndUpdate(
    { _id, ...agencyFilter },
    {
      $set: {
        status,
        publicTrackingNote,
        updatedAt: new Date()
      }
    },
    { returnDocument: "after" }
  );
  const row = result?.value ?? result;
  return toPublicBooking(row);
}
