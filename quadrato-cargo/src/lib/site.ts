export const siteName = "Quadrato Cargo";

/** Used in metadata and key page intros */
export const siteDescription =
  "International courier at your doorstep: book with your Postal Code / ZIP, choose instant collection (we target ~10 minutes where your area is serviceable) or a scheduled pickup, then our backend team and field staff handle everything until handoff to the partner carrier — Tracking ID after acceptance, QR-ready delivery receipt for status.";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://quadratocargo.com"
  );
}
