/**
 * Agency partners are stored on bookings as their login email; customers should see the
 * partner account display name (or a generic label), not the email, on PDFs and profile UI.
 */

export function assignedAgencyLooksLikeEmail(value) {
  const s = String(value ?? "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Resolve one booking's assignedAgency for customer-facing output. */
export async function resolveAssignedAgencyDisplayName(db, assignedAgencyRaw) {
  const raw = String(assignedAgencyRaw ?? "").trim();
  if (!raw) return null;
  if (!assignedAgencyLooksLikeEmail(raw)) return raw;
  const agencyUser = await db.collection("users").findOne({
    role: "agency",
    email: raw.toLowerCase()
  });
  const name = String(agencyUser?.name ?? "").trim();
  return name || "Agency partner";
}

/**
 * Batch-resolve for booking lists (avoids N+1 queries). Replaces `assignedAgency` with the
 * display string on each row when it was an email.
 */
export async function mapBookingsAssignedAgencyForCustomer(db, bookingRows) {
  if (!bookingRows?.length) return bookingRows;
  const emails = [
    ...new Set(
      bookingRows
        .map((r) => String(r?.assignedAgency ?? "").trim())
        .filter((e) => assignedAgencyLooksLikeEmail(e))
        .map((e) => e.toLowerCase())
    )
  ];
  /** @type {Map<string, string>} */
  let emailToName = new Map();
  if (emails.length > 0) {
    const users = await db
      .collection("users")
      .find({ role: "agency", email: { $in: emails } })
      .project({ email: 1, name: 1 })
      .toArray();
    emailToName = new Map(
      users.map((u) => [
        String(u.email ?? "").toLowerCase(),
        String(u.name ?? "").trim() || "Agency partner"
      ])
    );
  }
  return bookingRows.map((row) => {
    const raw = String(row?.assignedAgency ?? "").trim();
    if (!raw) return { ...row, assignedAgency: null };
    if (!assignedAgencyLooksLikeEmail(raw)) return row;
    const name = emailToName.get(raw.toLowerCase()) || "Agency partner";
    return { ...row, assignedAgency: name };
  });
}
