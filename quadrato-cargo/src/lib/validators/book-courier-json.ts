import type { BookCourierRow } from "./book-courier";

/** Build a row from JSON API body (snake_case or camelCase keys tolerated). */
export function bookCourierRowFromJson(body: unknown): BookCourierRow | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const str = (k: string) => String(o[k] ?? "").trim();

  return {
    routeType: str("routeType"),
    collectionMode: str("collectionMode") || "scheduled",
    pickupDate: str("pickupDate"),
    pickupTimeSlot: str("pickupTimeSlot"),
    senderName: str("senderName"),
    senderEmail: str("senderEmail"),
    senderPhone: str("senderPhone"),
    senderStreet: str("senderStreet"),
    senderCity: str("senderCity"),
    senderPostal: str("senderPostal"),
    senderCountry: str("senderCountry"),
    recipientName: str("recipientName"),
    recipientEmail: str("recipientEmail"),
    recipientPhone: str("recipientPhone"),
    recipientStreet: str("recipientStreet"),
    recipientCity: str("recipientCity"),
    recipientPostal: str("recipientPostal"),
    recipientCountry: str("recipientCountry"),
    contentsDescription: str("contentsDescription"),
    weightKg: str("weightKg"),
    lengthCm: str("lengthCm"),
    widthCm: str("widthCm"),
    heightCm: str("heightCm"),
    declaredValue: str("declaredValue"),
    pickupPreference: str("pickupPreference"),
    instructions: str("instructions"),
    agreed: Boolean(o.agreed === true || o.agreed === "true" || o.agreed === "on"),
  };
}
