import { ObjectId } from "mongodb";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "../db/mongo.js";
import { requireAdminApi } from "../modules/admin/admin-middleware.js";
import { createUserDoc, toPublicUser } from "../models/user.model.js";
import { toPublicBooking } from "../models/booking.model.js";
import { toPublicContact } from "../models/contact.model.js";
import { normalizeSiteSettings } from "../models/site-settings.model.js";
import { sendError, sendNotFound, sendOk } from "../components/api-response.js";

const router = Router();
const PAGE_SIZE = 25;

const bookingInvoiceSchema = z.object({
  invoicePdfReady: z.boolean(),
  invoice: z
    .object({
      number: z.string().trim().max(120).optional().default(""),
      currency: z.string().trim().max(12).optional().default("INR"),
      subtotal: z.string().trim().max(500).optional().default(""),
      tax: z.string().trim().max(500).optional().default(""),
      insurance: z.string().trim().max(500).optional().default(""),
      customsDuties: z.string().trim().max(500).optional().default(""),
      discount: z.string().trim().max(500).optional().default(""),
      total: z.string().trim().max(500).optional().default(""),
      lineDescription: z.string().trim().max(4000).optional().default(""),
      notes: z.string().trim().max(4000).optional().default("")
    })
    .default({})
});

function normalizeBookingInvoiceForDb(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  const keys = [
    "number",
    "currency",
    "subtotal",
    "tax",
    "insurance",
    "customsDuties",
    "discount",
    "total",
    "lineDescription",
    "notes"
  ];
  for (const k of keys) {
    let v = String(raw[k] ?? "").trim();
    if (!v) continue;
    if (k === "currency") {
      out[k] = v.toUpperCase().slice(0, 12);
    } else if (k === "lineDescription" || k === "notes") {
      out[k] = v.slice(0, 4000);
    } else {
      out[k] = v.slice(0, 500);
    }
  }
  return Object.keys(out).length ? out : null;
}
const USER_ROLES = ["customer", "staff", "courier", "agency"];
const USER_ROLES_SET = new Set(USER_ROLES);
const ALLOWED_BOOKING_STATUSES = new Set([
  "submitted",
  "confirmed",
  "serviceability_check",
  "serviceable",
  "pickup_scheduled",
  "out_for_pickup",
  "picked_up",
  "agency_processing",
  "in_transit",
  "out_for_delivery",
  "delivery_attempted",
  "on_hold",
  "delivered",
  "cancelled"
]);
const COURIER_OPEN_STATUSES = [
  "submitted",
  "confirmed",
  "serviceability_check",
  "serviceable",
  "pickup_scheduled",
  "out_for_pickup"
];

function toMonthKey(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthsRange(count) {
  const safeCount = Math.max(1, Math.min(24, Number.parseInt(String(count ?? "6"), 10) || 6));
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (safeCount - 1), 1, 0, 0, 0, 0));
  const monthKeys = [];
  for (let i = 0; i < safeCount; i += 1) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1, 0, 0, 0, 0));
    monthKeys.push(toMonthKey(d));
  }
  return { start, monthKeys };
}

function normalizePage(rawPage) {
  return Math.max(1, Number.parseInt(String(rawPage ?? "1"), 10) || 1);
}

function parseObjectId(value) {
  const id = String(value ?? "").trim();
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function requireObjectIdOrNotFound(res, rawValue, message) {
  const objectId = parseObjectId(rawValue);
  if (!objectId) {
    sendNotFound(res, message);
    return null;
  }
  return objectId;
}

function parseUserCreateInput(body) {
  const name = normalizeText(body?.name);
  const email = normalizeEmail(body?.email);
  const password = String(body?.password ?? "");
  const confirmPassword = String(body?.confirmPassword ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email and password are required." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  return { name, email, password };
}

function createUserByRoleHandler(role) {
  return async (req, res, next) => {
    try {
      const db = await getDb();
      const parsed = parseUserCreateInput(req.body);
      if ("error" in parsed) {
        return sendError(res, parsed.error);
      }

      const existing = await db.collection("users").findOne({ email: parsed.email });
      if (existing) {
        return sendError(res, "Email already exists.", 409);
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);
      const userDoc = createUserDoc({
        email: parsed.email,
        name: parsed.name,
        passwordHash,
        role
      });
      const result = await db.collection("users").insertOne(userDoc);
      return sendOk(res, { userId: String(result.insertedId) }, 201);
    } catch (error) {
      return next(error);
    }
  };
}

function buildUserListFilter(rawQuery, rawRole) {
  const query = String(rawQuery ?? "").trim();
  const role = String(rawRole ?? "").trim();
  const filter = {};

  if (query) {
    filter.$or = [
      { email: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } }
    ];
  }

  if (!USER_ROLES_SET.has(role)) {
    return filter;
  }

  if (role === "customer") {
    filter.role = { $in: ["customer", null] };
    return filter;
  }

  filter.role = role;
  return filter;
}

async function fetchUserBookingStats(db, userIds) {
  if (userIds.length === 0) {
    return {
      byCustomer: new Map(),
      byCourier: new Map(),
      courierOpen: new Map()
    };
  }

  const [customerBookingCounts, courierBookingCounts, courierOpenBookingCounts] =
    await Promise.all([
      db
        .collection("bookings")
        .aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 } } }
        ])
        .toArray(),
      db
        .collection("bookings")
        .aggregate([
          { $match: { courierId: { $in: userIds } } },
          { $group: { _id: "$courierId", count: { $sum: 1 } } }
        ])
        .toArray(),
      db
        .collection("bookings")
        .aggregate([
          {
            $match: {
              courierId: { $in: userIds },
              status: { $in: COURIER_OPEN_STATUSES }
            }
          },
          { $group: { _id: "$courierId", count: { $sum: 1 } } }
        ])
        .toArray()
    ]);

  return {
    byCustomer: new Map(customerBookingCounts.map((x) => [String(x._id), Number(x.count)])),
    byCourier: new Map(courierBookingCounts.map((x) => [String(x._id), Number(x.count)])),
    courierOpen: new Map(courierOpenBookingCounts.map((x) => [String(x._id), Number(x.count)]))
  };
}

router.use(requireAdminApi);

router.get("/overview", async (_req, res, next) => {
  try {
    const db = await getDb();
    const end = new Date();
    const dayAgo = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [userCount, contactCount, bookingCount, activeBookingCount] =
      await Promise.all([
        db.collection("users").countDocuments({}),
        db.collection("contacts").countDocuments({}),
        db.collection("bookings").countDocuments({}),
        db.collection("bookings").countDocuments({
          status: { $nin: ["delivered", "cancelled"] }
        })
      ]);

    const [bookingByStatusRaw, recentContactsRaw, recentBookingsRaw, recentUsersRaw] =
      await Promise.all([
        db
          .collection("bookings")
          .aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ])
          .toArray(),
        db
          .collection("contacts")
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        db
          .collection("bookings")
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        db
          .collection("users")
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray()
      ]);

    const [last24hUsers, last24hContacts, last24hBookings, last7dUsers, last7dContacts, last7dBookings] =
      await Promise.all([
        db.collection("users").countDocuments({ createdAt: { $gte: dayAgo } }),
        db.collection("contacts").countDocuments({ createdAt: { $gte: dayAgo } }),
        db.collection("bookings").countDocuments({ createdAt: { $gte: dayAgo } }),
        db.collection("users").countDocuments({ createdAt: { $gte: weekAgo } }),
        db.collection("contacts").countDocuments({ createdAt: { $gte: weekAgo } }),
        db.collection("bookings").countDocuments({ createdAt: { $gte: weekAgo } })
      ]);

    const userIds = recentUsersRaw.map((u) => u._id).filter(Boolean);
    const bookingCountsRaw =
      userIds.length === 0
        ? []
        : await db
            .collection("bookings")
            .aggregate([
              { $match: { userId: { $in: userIds } } },
              { $group: { _id: "$userId", count: { $sum: 1 } } }
            ])
            .toArray();
    const bookingCountMap = new Map(
      bookingCountsRaw.map((x) => [String(x._id), Number(x.count)])
    );

    return res.json({
      ok: true,
      snapshot: {
        userCount,
        contactCount,
        bookingCount,
        activeBookingCount,
        bookingByStatus: bookingByStatusRaw.map((x) => ({
          status: x._id ?? "unknown",
          count: Number(x.count)
        })),
        last24h: { users: last24hUsers, contacts: last24hContacts, bookings: last24hBookings },
        last7d: { users: last7dUsers, contacts: last7dContacts, bookings: last7dBookings },
        recentContacts: recentContactsRaw.map(toPublicContact),
        recentBookings: recentBookingsRaw.map(toPublicBooking),
        recentUsers: recentUsersRaw.map((u) => ({
          ...toPublicUser(u),
          bookingCount: bookingCountMap.get(String(u._id)) ?? 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/reports/monthly", async (req, res, next) => {
  try {
    const db = await getDb();
    const { start, monthKeys } = monthsRange(req.query.months);

    const [usersRaw, contactsRaw, bookingsRaw, byStatusRaw, byRouteRaw] =
      await Promise.all([
        db
          .collection("users")
          .aggregate([
            { $addFields: { createdAtDate: { $convert: { input: "$createdAt", to: "date", onError: null, onNull: null } } } },
            { $match: { createdAtDate: { $gte: start } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAtDate", timezone: "UTC" } }, count: { $sum: 1 } } }
          ])
          .toArray(),
        db
          .collection("contacts")
          .aggregate([
            { $addFields: { createdAtDate: { $convert: { input: "$createdAt", to: "date", onError: null, onNull: null } } } },
            { $match: { createdAtDate: { $gte: start } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAtDate", timezone: "UTC" } }, count: { $sum: 1 } } }
          ])
          .toArray(),
        db
          .collection("bookings")
          .aggregate([
            { $addFields: { createdAtDate: { $convert: { input: "$createdAt", to: "date", onError: null, onNull: null } } } },
            { $match: { createdAtDate: { $gte: start } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAtDate", timezone: "UTC" } }, count: { $sum: 1 } } }
          ])
          .toArray(),
        db
          .collection("bookings")
          .aggregate([
            { $addFields: { createdAtDate: { $convert: { input: "$createdAt", to: "date", onError: null, onNull: null } } } },
            { $match: { createdAtDate: { $gte: start } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ])
          .toArray(),
        db
          .collection("bookings")
          .aggregate([
            { $addFields: { createdAtDate: { $convert: { input: "$createdAt", to: "date", onError: null, onNull: null } } } },
            { $match: { createdAtDate: { $gte: start } } },
            { $group: { _id: "$routeType", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ])
          .toArray()
      ]);

    const usersMap = new Map(usersRaw.map((x) => [String(x._id), Number(x.count)]));
    const contactsMap = new Map(contactsRaw.map((x) => [String(x._id), Number(x.count)]));
    const bookingsMap = new Map(bookingsRaw.map((x) => [String(x._id), Number(x.count)]));

    const monthly = monthKeys.map((month) => ({
      month,
      users: usersMap.get(month) ?? 0,
      contacts: contactsMap.get(month) ?? 0,
      bookings: bookingsMap.get(month) ?? 0
    }));

    const totals = monthly.reduce(
      (acc, x) => ({
        users: acc.users + x.users,
        contacts: acc.contacts + x.contacts,
        bookings: acc.bookings + x.bookings
      }),
      { users: 0, contacts: 0, bookings: 0 }
    );

    const latest = monthly.at(-1) ?? { users: 0, contacts: 0, bookings: 0 };
    const prev = monthly.length > 1 ? monthly[monthly.length - 2] : null;
    const bookingTrend =
      prev && prev.bookings > 0
        ? Math.round(((latest.bookings - prev.bookings) / prev.bookings) * 100)
        : null;

    const topStatus = byStatusRaw[0]?._id ? String(byStatusRaw[0]._id) : "n/a";
    const topRoute = byRouteRaw[0]?._id ? String(byRouteRaw[0]._id) : "n/a";

    const insights = [
      `Top booking status is "${topStatus}".`,
      `Top route type is "${topRoute}".`,
      bookingTrend === null
        ? "Booking growth trend needs more monthly data."
        : bookingTrend >= 0
          ? `Bookings are up ${bookingTrend}% vs previous month.`
          : `Bookings are down ${Math.abs(bookingTrend)}% vs previous month.`
    ];

    return res.json({
      ok: true,
      report: {
        months: monthKeys.length,
        monthly,
        totals,
        bookingStatusBreakdown: byStatusRaw.map((x) => ({
          status: x._id ?? "unknown",
          count: Number(x.count)
        })),
        routeBreakdown: byRouteRaw.map((x) => ({
          routeType: x._id ?? "unknown",
          count: Number(x.count)
        })),
        insights
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const db = await getDb();
    const page = normalizePage(req.query.page);
    const filter = buildUserListFilter(req.query.q, req.query.role);

    const [total, usersRaw] = await Promise.all([
      db.collection("users").countDocuments(filter),
      db
        .collection("users")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray()
    ]);

    const userIds = usersRaw.map((u) => u._id);
    const bookingStats = await fetchUserBookingStats(db, userIds);

    return res.json({
      ok: true,
      total,
      page,
      pageSize: PAGE_SIZE,
      users: usersRaw.map((u) => ({
        ...toPublicUser(u),
        bookingCount: bookingStats.byCustomer.get(String(u._id)) ?? 0,
        courierJobCount: bookingStats.byCourier.get(String(u._id)) ?? 0,
        courierActiveJobCount: bookingStats.courierOpen.get(String(u._id)) ?? 0,
        readyForJob:
          (u.role ?? "customer") !== "courier"
            ? undefined
            : u.isActive !== false &&
              u.isOnDuty !== false &&
              (bookingStats.courierOpen.get(String(u._id)) ?? 0) === 0
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = parseObjectId(req.params.id);
    if (!_id) return sendNotFound(res, "User not found.");
    const [userRaw, bookingsRaw, assignmentsRaw] = await Promise.all([
      db.collection("users").findOne({ _id }),
      db.collection("bookings").find({ userId: _id }).sort({ createdAt: -1 }).toArray(),
      db.collection("bookings").find({ courierId: _id }).sort({ createdAt: -1 }).toArray()
    ]);
    if (!userRaw) return sendNotFound(res, "User not found.");
    return res.json({
      ok: true,
      user: {
        ...toPublicUser(userRaw),
        bookings: bookingsRaw.map(toPublicBooking),
        courierAssignments: assignmentsRaw.map(toPublicBooking)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/bookings", async (req, res, next) => {
  try {
    const db = await getDb();
    const bookingQuery = String(req.query.q ?? "").trim();
    const statusFilter = String(req.query.status ?? "").trim();
    const routeFilter = String(req.query.route ?? "").trim();
    const accountFilter = String(req.query.account ?? "").trim();
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);

    const bookingFilter = {};
    if (statusFilter) bookingFilter.status = statusFilter;
    if (routeFilter) bookingFilter.routeType = routeFilter;
    if (accountFilter === "guest") bookingFilter.userId = null;
    if (accountFilter === "linked") bookingFilter.userId = { $ne: null };
    if (bookingQuery) {
      const bookingSearchClauses = [
        { consignmentNumber: { $regex: bookingQuery, $options: "i" } },
        { routeType: { $regex: bookingQuery, $options: "i" } }
      ];
      const queryObjectId = parseObjectId(bookingQuery);
      if (queryObjectId) bookingSearchClauses.push({ _id: queryObjectId });
      bookingFilter.$or = bookingSearchClauses;
    }

    const [total, bookingRows] = await Promise.all([
      db.collection("bookings").countDocuments(bookingFilter),
      db
        .collection("bookings")
        .find(bookingFilter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray()
    ]);

    const userIds = bookingRows.map((bookingDoc) => bookingDoc.userId).filter(Boolean);
    const courierIds = bookingRows.map((bookingDoc) => bookingDoc.courierId).filter(Boolean);
    const relatedUsersRaw =
      userIds.length + courierIds.length === 0
        ? []
        : await db
            .collection("users")
            .find({ _id: { $in: [...userIds, ...courierIds] } })
            .toArray();
    const relatedMap = new Map(relatedUsersRaw.map((u) => [String(u._id), toPublicUser(u)]));

    const bookings = bookingRows.map((bookingDoc) => ({
      ...toPublicBooking(bookingDoc),
      user: bookingDoc.userId ? relatedMap.get(String(bookingDoc.userId)) ?? null : null,
      courier: bookingDoc.courierId ? relatedMap.get(String(bookingDoc.courierId)) ?? null : null
    }));

    return res.json({ ok: true, total, page, pageSize: PAGE_SIZE, bookings });
  } catch (error) {
    next(error);
  }
});

router.get("/bookings/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const bookingId = parseObjectId(req.params.id);
    if (!bookingId) return sendNotFound(res, "Booking not found.");
    const rowRaw = await db.collection("bookings").findOne({ _id: bookingId });
    if (!rowRaw) return sendNotFound(res, "Booking not found.");

    const [userRaw, courierRaw, couriersRaw] = await Promise.all([
      rowRaw.userId ? db.collection("users").findOne({ _id: rowRaw.userId }) : null,
      rowRaw.courierId ? db.collection("users").findOne({ _id: rowRaw.courierId }) : null,
      db.collection("users").find({ role: "courier" }).sort({ name: 1, email: 1 }).toArray()
    ]);

    const courierIds = couriersRaw.map((c) => c._id).filter(Boolean);
    const courierOpenCountsRaw =
      courierIds.length === 0
        ? []
        : await db
            .collection("bookings")
            .aggregate([
              {
                $match: {
                  courierId: { $in: courierIds },
                  status: { $in: COURIER_OPEN_STATUSES }
                }
              },
              { $group: { _id: "$courierId", count: { $sum: 1 } } }
            ])
            .toArray();
    const courierOpenMap = new Map(
      courierOpenCountsRaw.map((x) => [String(x._id), Number(x.count)])
    );

    return res.json({
      ok: true,
      booking: {
        ...toPublicBooking(rowRaw),
        user: toPublicUser(userRaw),
        courier: toPublicUser(courierRaw)
      },
      couriers: couriersRaw.map((c) => {
        const pub = toPublicUser(c);
        const activeJobs = courierOpenMap.get(String(c._id)) ?? 0;
        return {
          ...pub,
          courierActiveJobCount: activeJobs,
          readyForJob: c.isActive !== false && c.isOnDuty !== false && activeJobs === 0
        };
      })
    });
  } catch (error) {
    next(error);
  }
});

router.get("/contacts", async (req, res, next) => {
  try {
    const db = await getDb();
    const contactQuery = String(req.query.q ?? "").trim();
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const contactFilter =
      contactQuery.length > 0
        ? {
            $or: [
              { name: { $regex: contactQuery, $options: "i" } },
              { email: { $regex: contactQuery, $options: "i" } },
              { service: { $regex: contactQuery, $options: "i" } },
              { message: { $regex: contactQuery, $options: "i" } }
            ]
          }
        : {};
    const [total, contactRows] = await Promise.all([
      db.collection("contacts").countDocuments(contactFilter),
      db
        .collection("contacts")
        .find(contactFilter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray()
    ]);
    return res.json({
      ok: true,
      total,
      page,
      pageSize: PAGE_SIZE,
      contacts: contactRows.map(toPublicContact)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/contacts/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const contactId = parseObjectId(req.params.id);
    if (!contactId) return sendNotFound(res, "Contact not found.");
    const rowRaw = await db.collection("contacts").findOne({ _id: contactId });
    if (!rowRaw) return sendNotFound(res, "Contact not found.");
    return res.json({ ok: true, contact: toPublicContact(rowRaw) });
  } catch (error) {
    next(error);
  }
});

router.get("/settings/site", async (_req, res, next) => {
  try {
    const db = await getDb();
    const row = await db.collection("settings").findOne({ key: "site" });
    return res.json({ ok: true, settings: normalizeSiteSettings(row) });
  } catch (error) {
    next(error);
  }
});

router.patch("/settings/site", async (req, res, next) => {
  try {
    const db = await getDb();
    const settings = normalizeSiteSettings(req.body ?? {});
    await db.collection("settings").updateOne(
      { key: "site" },
      {
        $set: {
          key: "site",
          ...settings,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    return res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
});

router.post("/users/staff", createUserByRoleHandler("staff"));
router.post("/users/courier", createUserByRoleHandler("courier"));
router.post("/users/agency", createUserByRoleHandler("agency"));

router.patch("/users/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "User not found.");
    if (!_id) return;
    const name = normalizeText(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const role = normalizeText(req.body?.role || "customer");
    const isActive =
      typeof req.body?.isActive === "boolean" ? req.body.isActive : true;
    const hasIsOnDuty = typeof req.body?.isOnDuty === "boolean";
    const isOnDuty = req.body?.isOnDuty === true;
    const newPassword = String(req.body?.newPassword ?? "");
    const confirmPassword = String(req.body?.confirmPassword ?? "");
    if (!email) return sendError(res, "Email is required.");
    if (!USER_ROLES_SET.has(role)) {
      return sendError(res, "Invalid role.");
    }
    if (newPassword && newPassword !== confirmPassword) {
      return sendError(res, "Passwords do not match.");
    }
    const existing = await db.collection("users").findOne({ email, _id: { $ne: _id } });
    if (existing) return sendError(res, "Email already exists.", 409);

    const update = {
      name: name || null,
      email,
      role,
      isActive,
      updatedAt: new Date()
    };
    if (hasIsOnDuty) update.isOnDuty = isOnDuty;
    if (newPassword) {
      update.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    await db.collection("users").updateOne({ _id }, { $set: update });
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "User not found.");
    if (!_id) return;
    await Promise.all([
      db.collection("bookings").updateMany({ userId: _id }, { $set: { userId: null, updatedAt: new Date() } }),
      db.collection("bookings").updateMany({ courierId: _id }, { $set: { courierId: null, updatedAt: new Date() } }),
      db.collection("users").deleteOne({ _id })
    ]);
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.patch("/bookings/:id/controls", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "Booking not found.");
    if (!_id) return;
    const status = normalizeText(req.body?.status);
    const consignmentNumber = normalizeText(req.body?.consignmentNumber);
    const trackingNotes = normalizeText(req.body?.trackingNotes);
    const internalNotes = normalizeText(req.body?.internalNotes);
    const assignedAgency = normalizeText(req.body?.assignedAgency);
    if (!status) return sendError(res, "Status is required.");
    if (!ALLOWED_BOOKING_STATUSES.has(status)) {
      return sendError(res, "Invalid booking status.");
    }
    await db.collection("bookings").updateOne(
      { _id },
      {
        $set: {
          status,
          consignmentNumber: consignmentNumber || null,
          trackingNotes: trackingNotes || null,
          internalNotes: internalNotes || null,
          assignedAgency: assignedAgency || null,
          updatedAt: new Date()
        }
      }
    );
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.patch("/bookings/:id/data", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "Booking not found.");
    if (!_id) return;
    const routeType = normalizeText(req.body?.routeType || "domestic");
    const payload = req.body?.payload;
    if (!payload || typeof payload !== "object") {
      return sendError(res, "Payload must be a valid JSON object.");
    }
    await db.collection("bookings").updateOne(
      { _id },
      { $set: { routeType, payload, updatedAt: new Date() } }
    );
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.patch("/bookings/:id/invoice", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "Booking not found.");
    if (!_id) return;
    const parsed = bookingInvoiceSchema.safeParse(req.body ?? {});
    if (!parsed.success) return sendError(res, "Invalid invoice payload.");
    const invoiceDoc = normalizeBookingInvoiceForDb(parsed.data.invoice);
    await db.collection("bookings").updateOne(
      { _id },
      {
        $set: {
          invoicePdfReady: parsed.data.invoicePdfReady,
          invoice: invoiceDoc,
          updatedAt: new Date()
        }
      }
    );
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.patch("/bookings/:id/link-user", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "Booking not found.");
    if (!_id) return;
    const customerEmail = normalizeEmail(req.body?.customerEmail);
    if (!customerEmail) {
      await db.collection("bookings").updateOne({ _id }, { $set: { userId: null, updatedAt: new Date() } });
      return sendOk(res);
    }
    const user = await db.collection("users").findOne({ email: customerEmail });
    if (!user) return sendNotFound(res, "No user found with this email.");
    await db.collection("bookings").updateOne({ _id }, { $set: { userId: user._id, updatedAt: new Date() } });
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.patch("/bookings/:id/assign-courier", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "Booking not found.");
    if (!_id) return;
    const courierUserId = normalizeText(req.body?.courierUserId);
    if (!courierUserId || courierUserId === "__unassigned") {
      await db.collection("bookings").updateOne({ _id }, { $set: { courierId: null, updatedAt: new Date() } });
      return sendOk(res);
    }
    const courierId = parseObjectId(courierUserId);
    if (!courierId) {
      return sendError(res, "Invalid courier account.");
    }
    const courier = await db.collection("users").findOne({ _id: courierId, role: "courier" });
    if (!courier) {
      return sendNotFound(res, "Courier account not found.");
    }
    if (courier.isActive === false) {
      return sendError(res, "Selected courier is inactive. Activate courier account first.");
    }
    if (courier.isOnDuty === false) {
      return sendError(res, "Selected courier is off duty. Turn on duty status first.");
    }
    const openJobs = await db.collection("bookings").countDocuments({
      courierId,
      _id: { $ne: _id },
      status: { $in: COURIER_OPEN_STATUSES }
    });
    if (openJobs > 0) {
      return sendError(res, "Selected courier is busy with another active job. Assign only to ready courier.");
    }
    await db.collection("bookings").updateOne({ _id }, { $set: { courierId, updatedAt: new Date() } });
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.delete("/bookings/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const bookingId = requireObjectIdOrNotFound(res, req.params.id, "Booking not found.");
    if (!bookingId) return;
    await db.collection("bookings").deleteOne({ _id: bookingId });
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.patch("/contacts/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const _id = requireObjectIdOrNotFound(res, req.params.id, "Contact not found.");
    if (!_id) return;
    const update = {
      name: normalizeText(req.body?.name),
      email: normalizeEmail(req.body?.email),
      phone: normalizeText(req.body?.phone) || null,
      service: normalizeText(req.body?.service),
      message: normalizeText(req.body?.message)
    };
    if (!update.name || !update.email || !update.service || !update.message) {
      return sendError(res, "Name, email, service and message are required.");
    }
    await db.collection("contacts").updateOne({ _id }, { $set: update });
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

router.delete("/contacts/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const contactId = requireObjectIdOrNotFound(res, req.params.id, "Contact not found.");
    if (!contactId) return;
    await db.collection("contacts").deleteOne({ _id: contactId });
    return sendOk(res);
  } catch (error) {
    next(error);
  }
});

export default router;
