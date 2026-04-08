/**
 * Agency partners are stored on bookings as their login email; customers should see the
 * partner account display name (or a generic label), not the email, on PDFs and profile UI.
 */

export function assignedAgencyLooksLikeEmail(value) {
  const s = String(value ?? "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Never show a login email to customers; fall back to a neutral label. */
export function sanitizeAgencyLabelForCustomer(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  return assignedAgencyLooksLikeEmail(s) ? "Agency partner" : s;
}

/**
 * Customer-facing agency label + optional hub city (never street address).
 * City is stored on the agency user when `assignedAgency` is their login email.
 */
export async function resolveAssignedAgencyForPublicTrack(db, assignedAgencyRaw) {
  const raw = String(assignedAgencyRaw ?? "").trim();
  if (!raw) return { agencyName: null, agencyCity: null };
  if (assignedAgencyLooksLikeEmail(raw)) {
    const agencyUser = await db.collection("users").findOne({
      role: "agency",
      email: raw.toLowerCase()
    });
    const name = String(agencyUser?.name ?? "").trim();
    const display = name || "Agency partner";
    let agencyName = sanitizeAgencyLabelForCustomer(display);
    if (agencyName && assignedAgencyLooksLikeEmail(agencyName)) agencyName = "Agency partner";
    const agencyCity = String(agencyUser?.agencyCity ?? "").trim() || null;
    return { agencyName, agencyCity };
  }
  return {
    agencyName: sanitizeAgencyLabelForCustomer(raw),
    agencyCity: null
  };
}

/** Resolve one booking's assignedAgency for customer-facing output. */
export async function resolveAssignedAgencyDisplayName(db, assignedAgencyRaw) {
  const { agencyName } = await resolveAssignedAgencyForPublicTrack(db, assignedAgencyRaw);
  return agencyName;
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
    if (!assignedAgencyLooksLikeEmail(raw)) {
      return { ...row, assignedAgency: sanitizeAgencyLabelForCustomer(raw) };
    }
    const name = emailToName.get(raw.toLowerCase()) || "Agency partner";
    return { ...row, assignedAgency: sanitizeAgencyLabelForCustomer(name) };
  });
}
