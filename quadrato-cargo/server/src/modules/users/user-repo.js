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

export { toPublicUser };
