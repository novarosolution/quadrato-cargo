/**
 * Deterministic public barcode / track code (QC + 10 digits) from Mongo booking id string.
 * Must match values persisted on `bookings.publicBarcodeCode`.
 */
export function computePublicBarcodeCode(bookingIdStr) {
  const seed = String(bookingIdStr ?? "").trim() || "0";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 10000000000;
  }
  return `QC${String(hash).padStart(10, "0")}`;
}

export function isPublicBarcodeCodeFormat(value) {
  return /^QC\d{10}$/i.test(String(value ?? "").trim());
}
