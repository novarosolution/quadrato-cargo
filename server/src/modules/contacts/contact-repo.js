import { ObjectId } from "mongodb";
import { getDb } from "../../db/mongo.js";
import { createContactDoc, toPublicContact } from "../../models/contact.model.js";

const CONTACTS = "contacts";

export async function createContactSubmission(data) {
  const db = await getDb();
  const payload = createContactDoc(data);
  const result = await db.collection(CONTACTS).insertOne(payload);
  return toPublicContact({ ...payload, _id: result.insertedId });
}

export async function listContacts({ q = "", page = 1, pageSize = 25 } = {}) {
  const db = await getDb();
  const where =
    q.trim().length > 0
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { service: { $regex: q, $options: "i" } },
            { message: { $regex: q, $options: "i" } }
          ]
        }
      : {};
  const [total, rows] = await Promise.all([
    db.collection(CONTACTS).countDocuments(where),
    db.collection(CONTACTS)
      .find(where)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray()
  ]);
  return { total, rows: rows.map(toPublicContact) };
}

export async function findContactById(id) {
  const db = await getDb();
  if (!ObjectId.isValid(id)) return null;
  const row = await db.collection(CONTACTS).findOne({ _id: new ObjectId(id) });
  return toPublicContact(row);
}
