/**
 * Iframe src for Contact page: admin embed URL, or Google Maps search embed from address.
 */
export function contactPageMapIframeSrc(
  officeAddress: string,
  customEmbedSrc: string,
): string {
  const custom = String(customEmbedSrc ?? "").trim();
  if (custom) return custom;
  const addr = String(officeAddress ?? "").trim();
  if (!addr) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed&z=15`;
}

export function googleMapsPlaceSearchUrl(officeAddress: string): string {
  const addr = String(officeAddress ?? "").trim();
  if (!addr) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}
