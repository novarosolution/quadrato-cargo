import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
import { bookingModelSchema } from "../models/booking.model.js";
import { contactModelSchema } from "../models/contact.model.js";
import { siteSettingsModelSchema } from "../models/site-settings.model.js";
import { userModelSchema } from "../models/user.model.js";

const client = new MongoClient(env.mongoUri);
const modelSchemas = [
  userModelSchema,
  bookingModelSchema,
  contactModelSchema,
  siteSettingsModelSchema
];

let dbPromise;

async function collectionExists(db, collectionName) {
  const cursor = db.listCollections({ name: collectionName }, { nameOnly: true });
  return cursor.hasNext();
}

async function ensureCollection(db, collectionName) {
  const exists = await collectionExists(db, collectionName);
  if (!exists) {
    await db.createCollection(collectionName);
  }
}

async function applyValidator(db, collectionName, validator) {
  await db.command({
    collMod: collectionName,
    validator,
    validationLevel: "moderate",
    validationAction: "error"
  });
}

function normalizeIndexKey(indexKey) {
  return JSON.stringify(indexKey ?? {});
}

async function ensureIndexes(db, collectionName, indexes = []) {
  if (indexes.length === 0) return;
  const collection = db.collection(collectionName);
  const existing = await collection.indexes();
  const existingKeys = new Set(existing.map((indexDoc) => normalizeIndexKey(indexDoc.key)));

  for (const indexDef of indexes) {
    const key = indexDef?.key ?? {};
    const options = indexDef?.options ?? {};
    if (existingKeys.has(normalizeIndexKey(key))) {
      continue;
    }
    await collection.createIndex(key, options);
    existingKeys.add(normalizeIndexKey(key));
  }
}

async function ensureModelSchemas(db) {
  for (const modelSchema of modelSchemas) {
    const collectionName = modelSchema.collectionName;
    await ensureCollection(db, collectionName);
    await applyValidator(db, collectionName, modelSchema.validator);
    await ensureIndexes(db, collectionName, modelSchema.indexes);
  }
}

export async function getDb() {
  if (!dbPromise) {
    dbPromise = client.connect().then(async (connected) => {
      const db = connected.db(env.mongoDb);
      await ensureModelSchemas(db);
      return db;
    });
  }
  return dbPromise;
}

export async function closeDb() {
  await client.close();
}
