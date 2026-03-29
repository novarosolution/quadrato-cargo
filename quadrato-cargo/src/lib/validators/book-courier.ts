import { isValidEmail } from "@/lib/auth-validation";
import type { CourierPayload } from "@/lib/db/submissions";

export type BookCourierRow = {
  routeType: string;
  collectionMode: string;
  pickupDate: string;
  pickupTimeSlot: string;
  pickupTimeSlotCustom: string;
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

function normalizePhone(raw: string) {
  return String(raw || "").trim();
}

function isPhoneLikeEmail(value: string) {
  return /^[\d+\-\s]+$/.test(String(value || "").trim());
}

function isStrictFutureDate(dateValue: string) {
  const raw = String(dateValue || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return parsed.getTime() >= todayStart.getTime();
}

export const BOOKING_STEP_FIELDS = {
  1: ["routeType", "collectionMode", "pickupDate", "pickupTimeSlot", "pickupTimeSlotCustom"],
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
  4: [
    "contentsDescription",
    "weightKg",
    "agreed",
    "instructions",
    "declaredValue",
    "lengthCm",
    "widthCm",
    "heightCm",
    "pickupPreference"
  ]
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
      "Choose instant collection or a scheduled pickup (with your Postal Code / ZIP).";
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
  else if (row.senderName.length < 2) fieldErrors.senderName = "Sender name is too short.";
  if (!row.senderEmail) fieldErrors.senderEmail = "Enter sender email.";
  else if (isPhoneLikeEmail(row.senderEmail))
    fieldErrors.senderEmail = "Email cannot be only numbers.";
  else if (!isValidEmail(row.senderEmail))
    fieldErrors.senderEmail = "Enter a valid email.";
  const senderPhoneDigits = normalizePhone(row.senderPhone);
  if (!row.senderPhone) fieldErrors.senderPhone = "Enter sender phone.";
  else if (!/^\d{7,15}$/.test(senderPhoneDigits))
    fieldErrors.senderPhone = "Phone must contain only numbers (7 to 15 digits).";
  if (!row.senderStreet) fieldErrors.senderStreet = "Enter pickup street address.";
  if (!row.senderCity) fieldErrors.senderCity = "Enter pickup city.";
  if (!row.senderPostal) fieldErrors.senderPostal = "Enter pickup postal / ZIP code.";
  else if (row.senderPostal.length < 3)
    fieldErrors.senderPostal = "Pickup postal / ZIP is too short.";
  if (!row.senderCountry) fieldErrors.senderCountry = "Enter pickup country.";

  if (!row.recipientName) fieldErrors.recipientName = "Enter recipient full name.";
  else if (row.recipientName.length < 2) fieldErrors.recipientName = "Recipient name is too short.";
  if (!row.recipientEmail) fieldErrors.recipientEmail = "Enter recipient email.";
  else if (isPhoneLikeEmail(row.recipientEmail))
    fieldErrors.recipientEmail = "Email cannot be only numbers.";
  else if (!isValidEmail(row.recipientEmail))
    fieldErrors.recipientEmail = "Enter a valid email.";
  const recipientPhoneDigits = normalizePhone(row.recipientPhone);
  if (!row.recipientPhone) fieldErrors.recipientPhone = "Enter recipient phone.";
  else if (!/^\d{7,15}$/.test(recipientPhoneDigits))
    fieldErrors.recipientPhone = "Phone must contain only numbers (7 to 15 digits).";
  if (!row.recipientStreet)
    fieldErrors.recipientStreet = "Enter delivery street address.";
  if (!row.recipientCity) fieldErrors.recipientCity = "Enter delivery city.";
  if (!row.recipientPostal)
    fieldErrors.recipientPostal = "Enter delivery postal / ZIP code.";
  else if (row.recipientPostal.length < 3)
    fieldErrors.recipientPostal = "Delivery postal / ZIP is too short.";
  if (!row.recipientCountry)
    fieldErrors.recipientCountry = "Enter delivery country.";

  if (!row.contentsDescription || row.contentsDescription.length < 5)
    fieldErrors.contentsDescription =
      "Describe contents (at least a few words) for customs and handling.";

  const w = parseFloat(row.weightKg.replace(",", "."));
  if (!row.weightKg || Number.isNaN(w) || w <= 0)
    fieldErrors.weightKg = "Enter total weight in kg (number greater than 0).";
  else if (w > 1000)
    fieldErrors.weightKg = "Weight is too high. Please contact support for heavy cargo.";

  const lengthRaw = row.lengthCm.trim();
  const widthRaw = row.widthCm.trim();
  const heightRaw = row.heightCm.trim();
  const hasAnyDimension = Boolean(lengthRaw || widthRaw || heightRaw);
  if (hasAnyDimension) {
    if (!lengthRaw || !widthRaw || !heightRaw) {
      fieldErrors.lengthCm = "Enter all dimensions (L, W, H) or leave all blank.";
    } else {
      const l = Number.parseFloat(lengthRaw.replace(",", "."));
      const wd = Number.parseFloat(widthRaw.replace(",", "."));
      const h = Number.parseFloat(heightRaw.replace(",", "."));
      if (!Number.isFinite(l) || l <= 0) fieldErrors.lengthCm = "Length must be a valid number.";
      if (!Number.isFinite(wd) || wd <= 0) fieldErrors.widthCm = "Width must be a valid number.";
      if (!Number.isFinite(h) || h <= 0) fieldErrors.heightCm = "Height must be a valid number.";
    }
  }

  const pickupTrim = row.pickupPreference.trim();
  if (row.collectionMode === "scheduled" && !pickupTrim) {
    fieldErrors.pickupPreference =
      "Enter the date and time window for scheduled pickup at your Postal Code / ZIP / address.";
  }
  if (row.collectionMode === "scheduled" && !row.pickupDate.trim()) {
    fieldErrors.pickupDate = "Select pickup date for scheduled collection.";
  } else if (row.collectionMode === "scheduled" && !isStrictFutureDate(row.pickupDate)) {
    fieldErrors.pickupDate = "Scheduled pickup date cannot be in the past.";
  }
  const pickupTimeSlot = row.pickupTimeSlot.trim();
  const pickupTimeSlotCustom = row.pickupTimeSlotCustom.trim();
  const effectivePickupTimeSlot =
    pickupTimeSlot === "custom" ? pickupTimeSlotCustom : pickupTimeSlot;
  if (row.collectionMode === "scheduled" && !pickupTimeSlot) {
    fieldErrors.pickupTimeSlot = "Select pickup time slot for scheduled collection.";
  }
  if (row.collectionMode === "scheduled" && pickupTimeSlot === "custom") {
    if (!pickupTimeSlotCustom) {
      fieldErrors.pickupTimeSlotCustom = "Enter your custom pickup time.";
    } else if (pickupTimeSlotCustom.length < 3 || pickupTimeSlotCustom.length > 64) {
      fieldErrors.pickupTimeSlotCustom = "Custom pickup time must be 3 to 64 characters.";
    }
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
    row.pickupDate && effectivePickupTimeSlot
      ? `${row.pickupDate} (${effectivePickupTimeSlot})`
      : "";
  const pickupPreference =
    collectionMode === "instant"
      ? pickupTrim ||
        `Instant collection requested at pickup Postal Code / ZIP ${row.senderPostal} (target ~10 minutes where area is serviceable).`
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
    pickupDate: row.pickupDate || undefined,
    pickupTimeSlot: effectivePickupTimeSlot || undefined,
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
    pickupTimeSlotCustom: s("pickupTimeSlotCustom"),
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
