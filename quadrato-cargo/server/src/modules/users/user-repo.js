import { ObjectId } from "mongodb";
import { getDb } from "../../db/mongo.js";
import { createUserDoc, toPublicUser } from "../../models/user.model.js";

const USERS = "users";

export async function findUserByEmail(email) {
  const db = await getDb();
  return db.collection(USERS).findOne({ email: email.toLowerCase() });
}

export async function findUserById(userId) {
  const db = await getDb();
  if (!ObjectId.isValid(userId)) return null;
  return db.collection(USERS).findOne({ _id: new ObjectId(userId) });
}

export async function findUsersByIds(userIds = []) {
  const db = await getDb();
  const objectIds = Array.from(
    new Set(
      userIds
        .map((id) => String(id || "").trim())
        .filter((id) => ObjectId.isValid(id))
    )
  ).map((id) => new ObjectId(id));
  if (objectIds.length === 0) return [];
  return db.collection(USERS).find({ _id: { $in: objectIds } }).toArray();
}

export async function createUser({ email, name, passwordHash, role = "customer" }) {
  const db = await getDb();
  const payload = createUserDoc({ email, name, passwordHash, role });
  const result = await db.collection(USERS).insertOne(payload);
  return { ...payload, _id: result.insertedId };
}

export async function updateUserName(userId, name) {
  const db = await getDb();
  if (!ObjectId.isValid(userId)) return null;
  const _id = new ObjectId(userId);
  await db.collection(USERS).updateOne(
    { _id },
    {
      $set: {
        name: name?.trim() || null,
        updatedAt: new Date()
      }
    }
  );
  return db.collection(USERS).findOne({ _id });
}

export async function updateUserPasswordHash(userId, passwordHash) {
  const db = await getDb();
  if (!ObjectId.isValid(userId)) return null;
  const _id = new ObjectId(userId);
  await db.collection(USERS).updateOne(
    { _id },
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    }
  );
  return db.collection(USERS).findOne({ _id });
}

export async function updateUserDutyStatus(userId, isOnDuty) {
  const db = await getDb();
  if (!ObjectId.isValid(userId)) return null;
  const _id = new ObjectId(userId);
  await db.collection(USERS).updateOne(
    { _id },
    {
      $set: {
        isOnDuty: Boolean(isOnDuty),
        updatedAt: new Date()
      }
    }
  );
  return db.collection(USERS).findOne({ _id });
}

export async function updateAgencyPartnerProfile(userId, fields) {
  const db = await getDb();
  if (!ObjectId.isValid(userId)) return null;
  const _id = new ObjectId(userId);
  const $set = { updatedAt: new Date() };
  if (fields.name !== undefined) {
    $set.name = String(fields.name ?? "").trim() || null;
  }
  if (fields.agencyAddress !== undefined) {
    const a = String(fields.agencyAddress ?? "").trim();
    $set.agencyAddress = a ? a.slice(0, 500) : null;
  }
  if (fields.agencyPhone !== undefined) {
    const p = String(fields.agencyPhone ?? "").trim();
    $set.agencyPhone = p ? p.slice(0, 40) : null;
  }
  if (fields.agencyCity !== undefined) {
    const c = String(fields.agencyCity ?? "").trim();
    $set.agencyCity = c ? c.slice(0, 80) : null;
  }
  const res = await db.collection(USERS).updateOne({ _id, role: "agency" }, { $set });
  if (res.matchedCount === 0) return null;
  return db.collection(USERS).findOne({ _id });
}

export async function updateUserAddressBook(userId, addressBookPatch) {
  const db = await getDb();
  if (!ObjectId.isValid(userId)) return null;
  const _id = new ObjectId(userId);
  const patch = {
    ...(addressBookPatch?.sender !== undefined
      ? { "addressBook.sender": addressBookPatch.sender || null }
      : {}),
    ...(addressBookPatch?.recipient !== undefined
      ? { "addressBook.recipient": addressBookPatch.recipient || null }
      : {}),
    updatedAt: new Date()
  };
  if (Object.keys(patch).length === 1) return db.collection(USERS).findOne({ _id });
  await db.collection(USERS).updateOne({ _id }, { $set: patch });
  return db.collection(USERS).findOne({ _id });
}

export { toPublicUser };
