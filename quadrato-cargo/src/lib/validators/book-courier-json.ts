import type { BookCourierParcelRow, BookCourierRow } from "./book-courier";

/** Build a row from JSON API body (snake_case or camelCase keys tolerated). */
export function bookCourierRowFromJson(body: unknown): BookCourierRow | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const str = (k: string) => String(o[k] ?? "").trim();

  const pickCountry =
    str("pickupCountryHint") || str("pickup_country_hint") || str("senderCountry") || str("sender_country");
  const delCountry =
    str("deliveryCountryHint") ||
    str("delivery_country_hint") ||
    str("recipientCountry") ||
    str("recipient_country");
  const pickCity =
    str("pickupCityHint") || str("pickup_city_hint") || str("senderCity") || str("sender_city");
  const delCity =
    str("deliveryCityHint") ||
    str("delivery_city_hint") ||
    str("recipientCity") ||
    str("recipient_city");

  const shipmentObj =
    o.shipment && typeof o.shipment === "object" && !Array.isArray(o.shipment)
      ? (o.shipment as Record<string, unknown>)
      : {};
  const parcelsRaw = shipmentObj.parcels;
  let parcels: BookCourierParcelRow[] = [];
  if (Array.isArray(parcelsRaw)) {
    for (const pr of parcelsRaw) {
      if (!pr || typeof pr !== "object") continue;
      const r = pr as Record<string, unknown>;
      const dims =
        r.dimensionsCm && typeof r.dimensionsCm === "object"
          ? (r.dimensionsCm as Record<string, unknown>)
          : {};
      parcels.push({
        contentsDescription: String(r.contentsDescription ?? "").trim(),
        weightKg: String(r.weightKg ?? "").trim(),
        declaredValue: String(r.declaredValue ?? "").trim(),
        lengthCm: String(dims.l ?? "").trim(),
        widthCm: String(dims.w ?? "").trim(),
        heightCm: String(dims.h ?? "").trim(),
      });
    }
  }
  if (parcels.length === 0) {
    parcels = [
      {
        contentsDescription: str("contentsDescription"),
        weightKg: str("weightKg"),
        lengthCm: str("lengthCm"),
        widthCm: str("widthCm"),
        heightCm: str("heightCm"),
        declaredValue: str("declaredValue"),
      },
    ];
  }
  const pc =
    str("parcelCount") ||
    str("parcel_count") ||
    String(shipmentObj.parcelCount ?? parcels.length) ||
    "1";
  const pcNum = Math.min(
    99,
    Math.max(1, Number.parseInt(String(pc).trim(), 10) || parcels.length || 1),
  );
  while (parcels.length < pcNum) {
    parcels.push({
      contentsDescription: "",
      weightKg: "",
      declaredValue: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
    });
  }
  if (parcels.length > pcNum) parcels = parcels.slice(0, pcNum);
  const first = parcels[0];

  return {
    routeType: str("routeType"),
    parcelCount: pc || "1",
    pickupCountryHint: pickCountry,
    pickupCityHint: pickCity,
    deliveryCountryHint: delCountry,
    deliveryCityHint: delCity,
    collectionMode: str("collectionMode") || "scheduled",
    pickupDate: str("pickupDate"),
    pickupTimeSlot: str("pickupTimeSlot"),
    pickupTimeSlotCustom: str("pickupTimeSlotCustom"),
    senderName: str("senderName"),
    senderEmail: str("senderEmail"),
    senderPhone: str("senderPhone"),
    senderStreet: str("senderStreet"),
    senderCity: str("senderCity"),
    senderState: str("senderState") || str("sender_state"),
    senderPostal: str("senderPostal"),
    senderCountry: str("senderCountry"),
    recipientName: str("recipientName"),
    recipientEmail: str("recipientEmail"),
    recipientPhone: str("recipientPhone"),
    recipientStreet: str("recipientStreet"),
    recipientCity: str("recipientCity"),
    recipientState: str("recipientState") || str("recipient_state"),
    recipientPostal: str("recipientPostal"),
    recipientCountry: str("recipientCountry"),
    contentsDescription: first?.contentsDescription ?? str("contentsDescription"),
    weightKg: first?.weightKg ?? str("weightKg"),
    lengthCm: first?.lengthCm ?? str("lengthCm"),
    widthCm: first?.widthCm ?? str("widthCm"),
    heightCm: first?.heightCm ?? str("heightCm"),
    declaredValue: first?.declaredValue ?? str("declaredValue"),
    parcels,
    pickupPreference: str("pickupPreference"),
    instructions: str("instructions"),
    agreed: Boolean(o.agreed === true || o.agreed === "true" || o.agreed === "on"),
  };
}
