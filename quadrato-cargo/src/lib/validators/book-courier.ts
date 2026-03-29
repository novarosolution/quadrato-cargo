import { isValidEmail } from "@/lib/auth-validation";
import type { CourierPayload } from "@/lib/db/submissions";

export type BookCourierRow = {
  routeType: string;
  collectionMode: string;
  pickupDate: string;
  pickupTimeSlot: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderStreet: string;
  senderCity: string;
  senderPostal: string;
  senderCountry: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientStreet: string;
  recipientCity: string;
  recipientPostal: string;
  recipientCountry: string;
  contentsDescription: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  pickupPreference: string;
  instructions: string;
  agreed: boolean;
};

export const BOOKING_STEP_FIELDS = {
  1: ["routeType", "collectionMode", "pickupDate", "pickupTimeSlot", "pickupPreference"],
  2: [
    "senderName",
    "senderEmail",
    "senderPhone",
    "senderStreet",
    "senderCity",
    "senderPostal",
    "senderCountry"
  ],
  3: [
    "recipientName",
    "recipientEmail",
    "recipientPhone",
    "recipientStreet",
    "recipientCity",
    "recipientPostal",
    "recipientCountry"
  ],
  4: ["contentsDescription", "weightKg", "agreed", "instructions", "declaredValue", "lengthCm", "widthCm", "heightCm"]
} as const;

export type BookCourierStep = keyof typeof BOOKING_STEP_FIELDS;

export function validateBookCourier(row: BookCourierRow): {
  ok: true;
  routeType: "domestic" | "international";
  bookingPayload: CourierPayload;
} | {
  ok: false;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  const { routeType } = row;

  if (!routeType || !["domestic", "international"].includes(routeType)) {
    fieldErrors.routeType = "Select domestic or international.";
  }

  if (!row.collectionMode || !["instant", "scheduled"].includes(row.collectionMode)) {
    fieldErrors.collectionMode =
      "Choose instant collection or a scheduled pickup (with your PIN / postal code).";
  }

  if (
    routeType === "international" &&
    row.senderCountry &&
    row.recipientCountry &&
    row.senderCountry.toLowerCase() === row.recipientCountry.toLowerCase()
  ) {
    fieldErrors.recipientCountry =
      "International booking: delivery country should be outside the pickup country.";
  }

  if (!row.senderName) fieldErrors.senderName = "Enter sender full name.";
  if (!row.senderEmail) fieldErrors.senderEmail = "Enter sender email.";
  else if (!isValidEmail(row.senderEmail))
    fieldErrors.senderEmail = "Enter a valid email.";
  if (!row.senderPhone) fieldErrors.senderPhone = "Enter sender phone.";
  if (!row.senderStreet) fieldErrors.senderStreet = "Enter pickup street address.";
  if (!row.senderCity) fieldErrors.senderCity = "Enter pickup city.";
  if (!row.senderPostal) fieldErrors.senderPostal = "Enter pickup postal / ZIP code.";
  if (!row.senderCountry) fieldErrors.senderCountry = "Enter pickup country.";

  if (!row.recipientName) fieldErrors.recipientName = "Enter recipient full name.";
  if (!row.recipientEmail) fieldErrors.recipientEmail = "Enter recipient email.";
  else if (!isValidEmail(row.recipientEmail))
    fieldErrors.recipientEmail = "Enter a valid email.";
  if (!row.recipientPhone) fieldErrors.recipientPhone = "Enter recipient phone.";
  if (!row.recipientStreet)
    fieldErrors.recipientStreet = "Enter delivery street address.";
  if (!row.recipientCity) fieldErrors.recipientCity = "Enter delivery city.";
  if (!row.recipientPostal)
    fieldErrors.recipientPostal = "Enter delivery postal / ZIP code.";
  if (!row.recipientCountry)
    fieldErrors.recipientCountry = "Enter delivery country.";

  if (!row.contentsDescription || row.contentsDescription.length < 5)
    fieldErrors.contentsDescription =
      "Describe contents (at least a few words) for customs and handling.";

  const w = parseFloat(row.weightKg.replace(",", "."));
  if (!row.weightKg || Number.isNaN(w) || w <= 0)
    fieldErrors.weightKg = "Enter total weight in kg (number greater than 0).";

  const pickupTrim = row.pickupPreference.trim();
  if (row.collectionMode === "scheduled" && !pickupTrim) {
    fieldErrors.pickupPreference =
      "Enter the date and time window for scheduled pickup at your PIN / address.";
  }
  if (row.collectionMode === "scheduled" && !row.pickupDate.trim()) {
    fieldErrors.pickupDate = "Select pickup date for scheduled collection.";
  }
  if (row.collectionMode === "scheduled" && !row.pickupTimeSlot.trim()) {
    fieldErrors.pickupTimeSlot = "Select pickup time slot for scheduled collection.";
  }

  if (routeType === "international" && !row.agreed) {
    fieldErrors.agreed =
      "Confirm the details are accurate for export and customs processing.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const collectionMode = row.collectionMode as "instant" | "scheduled";
  const scheduledWindow =
    row.pickupDate && row.pickupTimeSlot
      ? `${row.pickupDate} (${row.pickupTimeSlot})`
      : "";
  const pickupPreference =
    collectionMode === "instant"
      ? pickupTrim ||
        `Instant collection requested at pickup PIN ${row.senderPostal} (target ~10 minutes where area is serviceable).`
      : pickupTrim || scheduledWindow;

  const bookingPayload: CourierPayload = {
    sender: {
      name: row.senderName,
      email: row.senderEmail,
      phone: row.senderPhone,
      street: row.senderStreet,
      city: row.senderCity,
      postal: row.senderPostal,
      country: row.senderCountry,
    },
    recipient: {
      name: row.recipientName,
      email: row.recipientEmail,
      phone: row.recipientPhone,
      street: row.recipientStreet,
      city: row.recipientCity,
      postal: row.recipientPostal,
      country: row.recipientCountry,
    },
    shipment: {
      contentsDescription: row.contentsDescription,
      weightKg: w,
      dimensionsCm:
        row.lengthCm && row.widthCm && row.heightCm
          ? { l: row.lengthCm, w: row.widthCm, h: row.heightCm }
          : undefined,
      declaredValue: row.declaredValue || undefined,
    },
    collectionMode,
    pickupPreference,
    instructions: row.instructions || undefined,
    agreedInternational: routeType === "international",
  };

  return {
    ok: true,
    routeType: routeType as "domestic" | "international",
    bookingPayload,
  };
}

export function validateBookCourierStep(
  row: BookCourierRow,
  step: BookCourierStep
): Record<string, string> {
  const validation = validateBookCourier(row);
  if (validation.ok) return {};
  const allowed = new Set<string>(BOOKING_STEP_FIELDS[step]);
  return Object.fromEntries(
    Object.entries(validation.fieldErrors).filter(([key]) => allowed.has(key))
  );
}

export function bookCourierRowFromFormData(formData: FormData): BookCourierRow {
  const s = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    routeType: s("routeType"),
    collectionMode: s("collectionMode"),
    pickupDate: s("pickupDate"),
    pickupTimeSlot: s("pickupTimeSlot"),
    senderName: s("senderName"),
    senderEmail: s("senderEmail"),
    senderPhone: s("senderPhone"),
    senderStreet: s("senderStreet"),
    senderCity: s("senderCity"),
    senderPostal: s("senderPostal"),
    senderCountry: s("senderCountry"),
    recipientName: s("recipientName"),
    recipientEmail: s("recipientEmail"),
    recipientPhone: s("recipientPhone"),
    recipientStreet: s("recipientStreet"),
    recipientCity: s("recipientCity"),
    recipientPostal: s("recipientPostal"),
    recipientCountry: s("recipientCountry"),
    contentsDescription: s("contentsDescription"),
    weightKg: s("weightKg"),
    lengthCm: s("lengthCm"),
    widthCm: s("widthCm"),
    heightCm: s("heightCm"),
    declaredValue: s("declaredValue"),
    pickupPreference: s("pickupPreference"),
    instructions: s("instructions"),
    agreed: formData.get("agreed") === "on",
  };
}
