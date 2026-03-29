export const siteName = "Quadrato Cargo";

/** Used in metadata and key page intros */
export const siteDescription =
  "Doorstep courier: book by postal code, instant or scheduled pickup, tracking after handover.";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://quadratocargo.com"
  );
}
