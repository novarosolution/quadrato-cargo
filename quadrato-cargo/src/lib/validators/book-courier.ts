import { isValidEmail } from "@/lib/auth-validation";
import type { CourierPayload, ShipmentParcelPayload } from "@/lib/db/submissions";

/** One row of parcel fields from the book form (per box). */
export type BookCourierParcelRow = {
  contentsDescription: string;
  weightKg: string;
  declaredValue: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
};

export type BookCourierRow = {
  routeType: string;
  parcelCount: string;
  pickupCountryHint: string;
  pickupCityHint: string;
  deliveryCountryHint: string;
  deliveryCityHint: string;
  collectionMode: string;
  pickupDate: string;
  pickupTimeSlot: string;
  pickupTimeSlotCustom: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderStreet: string;
  senderCity: string;
  senderState: string;
  senderPostal: string;
  senderCountry: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientStreet: string;
  recipientCity: string;
  recipientState: string;
  recipientPostal: string;
  recipientCountry: string;
  /** Legacy single-parcel fields; kept in sync with first parcel for compatibility. */
  contentsDescription: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  /** Populated from parcel_0_… parcel_N_… (length matches parcel count). */
  parcels: BookCourierParcelRow[];
  pickupPreference: string;
  instructions: string;
  agreed: boolean;
};

function normalizePhoneDigits(raw: string) {
  return String(raw || "")
    .replace(/\D/g, "")
    .slice(0, 15);
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
  1: [
    "parcelCount",
    "pickupCountryHint",
    "pickupCityHint",
    "deliveryCountryHint",
    "deliveryCityHint",
    "routeType",
    "collectionMode",
    "pickupDate",
    "pickupTimeSlot",
    "pickupTimeSlotCustom",
  ],
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
    "pickupPreference",
    "pickupDate",
    "pickupTimeSlot",
    "pickupTimeSlotCustom"
  ]
} as const;

export type BookCourierStep = keyof typeof BOOKING_STEP_FIELDS;

function readParcelsFromFormData(formData: FormData, parcelN: number): BookCourierParcelRow[] {
  const g = (key: string) => String(formData.get(key) ?? "").trim();
  const out: BookCourierParcelRow[] = [];
  const n = Math.min(99, Math.max(1, parcelN));
  for (let i = 0; i < n; i++) {
    const pre = `parcel_${i}_`;
    let contents = g(`${pre}contentsDescription`);
    let weightKg = g(`${pre}weightKg`);
    let declaredValue = g(`${pre}declaredValue`);
    let lengthCm = g(`${pre}lengthCm`);
    let widthCm = g(`${pre}widthCm`);
    let heightCm = g(`${pre}heightCm`);
    if (n === 1) {
      if (!contents) contents = g("contentsDescription");
      if (!weightKg) weightKg = g("weightKg");
      if (!declaredValue) declaredValue = g("declaredValue");
      if (!lengthCm) lengthCm = g("lengthCm");
      if (!widthCm) widthCm = g("widthCm");
      if (!heightCm) heightCm = g("heightCm");
    }
    out.push({ contentsDescription: contents, weightKg, declaredValue, lengthCm, widthCm, heightCm });
  }
  return out;
}

function addParcelFieldErrors(
  row: BookCourierRow,
  parcelN: number,
  fieldErrors: Record<string, string>,
) {
  const n = Math.min(99, Math.max(1, parcelN));
  for (let i = 0; i < n; i++) {
    const p = row.parcels[i];
    const pre = `parcel_${i}_`;
    if (!p) continue;
    if (!p.contentsDescription || p.contentsDescription.length < 5) {
      fieldErrors[`${pre}contentsDescription`] =
        `Parcel ${i + 1}: describe contents (at least a few words) for customs and handling.`;
    }
    const w = parseFloat(String(p.weightKg).replace(",", "."));
    if (!p.weightKg || Number.isNaN(w) || w <= 0) {
      fieldErrors[`${pre}weightKg`] = `Parcel ${i + 1}: enter weight in kg (greater than 0).`;
    } else if (w > 1000) {
      fieldErrors[`${pre}weightKg`] =
        `Parcel ${i + 1}: weight is too high. Contact support for heavy cargo.`;
    }
    const lengthRaw = p.lengthCm.trim();
    const widthRaw = p.widthCm.trim();
    const heightRaw = p.heightCm.trim();
    const hasAnyDimension = Boolean(lengthRaw || widthRaw || heightRaw);
    if (hasAnyDimension) {
      if (!lengthRaw || !widthRaw || !heightRaw) {
        fieldErrors[`${pre}lengthCm`] =
          `Parcel ${i + 1}: enter all dimensions (L, W, H) or leave all blank.`;
      } else {
        const l = Number.parseFloat(lengthRaw.replace(",", "."));
        const wd = Number.parseFloat(widthRaw.replace(",", "."));
        const h = Number.parseFloat(heightRaw.replace(",", "."));
        if (!Number.isFinite(l) || l <= 0) {
          fieldErrors[`${pre}lengthCm`] = `Parcel ${i + 1}: length must be a valid number.`;
        }
        if (!Number.isFinite(wd) || wd <= 0) {
          fieldErrors[`${pre}widthCm`] = `Parcel ${i + 1}: width must be a valid number.`;
        }
        if (!Number.isFinite(h) || h <= 0) {
          fieldErrors[`${pre}heightCm`] = `Parcel ${i + 1}: height must be a valid number.`;
        }
      }
    }
  }
}

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

  const parcelN = parseInt(String(row.parcelCount || "").trim(), 10);
  if (!row.parcelCount?.trim() || Number.isNaN(parcelN) || parcelN < 1) {
    fieldErrors.parcelCount = "Enter how many parcels (at least 1).";
  } else if (parcelN > 99) {
    fieldErrors.parcelCount = "For more than 99 parcels, contact support.";
  }

  const pickC = String(row.pickupCountryHint || "").trim();
  if (!pickC || pickC.length < 2) {
    fieldErrors.pickupCountryHint = "Enter pickup (sender) country.";
  }
  const delC = String(row.deliveryCountryHint || "").trim();
  if (!delC || delC.length < 2) {
    fieldErrors.deliveryCountryHint = "Enter delivery (recipient) country.";
  }

  const pickCity = String(row.pickupCityHint || "").trim();
  if (!pickCity || pickCity.length < 2) {
    fieldErrors.pickupCityHint = "Enter pickup city.";
  } else if (pickCity.length > 120) {
    fieldErrors.pickupCityHint = "Pickup city is too long.";
  }
  const delCity = String(row.deliveryCityHint || "").trim();
  if (!delCity || delCity.length < 2) {
    fieldErrors.deliveryCityHint = "Enter delivery city.";
  } else if (delCity.length > 120) {
    fieldErrors.deliveryCityHint = "Delivery city is too long.";
  }

  const senderCountryEff = String(row.senderCountry || "").trim() || pickC;
  const recipientCountryEff = String(row.recipientCountry || "").trim() || delC;

  if (!routeType || !["domestic", "international"].includes(routeType)) {
    fieldErrors.routeType = "Select domestic or international.";
  }

  if (!row.collectionMode || !["instant", "scheduled"].includes(row.collectionMode)) {
    fieldErrors.collectionMode =
      "Choose instant collection or a scheduled pickup (with your Postal Code / ZIP).";
  }

  const hintSameCountry =
    pickC.length >= 2 &&
    delC.length >= 2 &&
    pickC.toLowerCase() === delC.toLowerCase();
  if (routeType === "international" && hintSameCountry) {
    fieldErrors.deliveryCountryHint =
      "International: delivery country must differ from pickup country.";
  }
  if (
    routeType === "international" &&
    senderCountryEff &&
    recipientCountryEff &&
    senderCountryEff.toLowerCase() === recipientCountryEff.toLowerCase() &&
    !hintSameCountry
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
  const senderPhoneDigits = normalizePhoneDigits(row.senderPhone);
  if (!row.senderPhone?.replace(/\D/g, "").length) fieldErrors.senderPhone = "Enter sender phone.";
  else if (!/^\d{7,15}$/.test(senderPhoneDigits))
    fieldErrors.senderPhone = "Phone must be 7 to 15 digits.";
  if (!row.senderStreet) fieldErrors.senderStreet = "Enter pickup street address.";
  if (!row.senderCity) fieldErrors.senderCity = "Enter pickup city.";
  if (!row.senderPostal) fieldErrors.senderPostal = "Enter pickup postal / ZIP code.";
  else if (row.senderPostal.length < 3)
    fieldErrors.senderPostal = "Pickup postal / ZIP is too short.";
  if (!senderCountryEff) fieldErrors.senderCountry = "Enter pickup country.";

  if (!row.recipientName) fieldErrors.recipientName = "Enter recipient full name.";
  else if (row.recipientName.length < 2) fieldErrors.recipientName = "Recipient name is too short.";
  if (!row.recipientEmail) fieldErrors.recipientEmail = "Enter recipient email.";
  else if (isPhoneLikeEmail(row.recipientEmail))
    fieldErrors.recipientEmail = "Email cannot be only numbers.";
  else if (!isValidEmail(row.recipientEmail))
    fieldErrors.recipientEmail = "Enter a valid email.";
  const recipientPhoneDigits = normalizePhoneDigits(row.recipientPhone);
  if (!row.recipientPhone?.replace(/\D/g, "").length) fieldErrors.recipientPhone = "Enter recipient phone.";
  else if (!/^\d{7,15}$/.test(recipientPhoneDigits))
    fieldErrors.recipientPhone = "Phone must be 7 to 15 digits.";
  if (!row.recipientStreet)
    fieldErrors.recipientStreet = "Enter delivery street address.";
  if (!row.recipientCity) fieldErrors.recipientCity = "Enter delivery city.";
  if (!row.recipientPostal)
    fieldErrors.recipientPostal = "Enter delivery postal / ZIP code.";
  else if (row.recipientPostal.length < 3)
    fieldErrors.recipientPostal = "Delivery postal / ZIP is too short.";
  if (!recipientCountryEff) fieldErrors.recipientCountry = "Enter delivery country.";

  const parcelCountNum =
    Number.isFinite(parcelN) && parcelN >= 1 && parcelN <= 99
      ? Math.floor(parcelN)
      : 1;
  if (!fieldErrors.parcelCount) {
    addParcelFieldErrors(row, parcelCountNum, fieldErrors);
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

  const parcelsPayload: ShipmentParcelPayload[] = [];
  let totalWeight = 0;
  for (let i = 0; i < parcelCountNum; i++) {
    const p = row.parcels[i];
    const w = parseFloat(String(p.weightKg).replace(",", "."));
    totalWeight += w;
    const lengthRaw = p.lengthCm.trim();
    const widthRaw = p.widthCm.trim();
    const heightRaw = p.heightCm.trim();
    const hasDims = lengthRaw && widthRaw && heightRaw;
    parcelsPayload.push({
      contentsDescription: p.contentsDescription.trim(),
      weightKg: w,
      declaredValue: p.declaredValue.trim() || undefined,
      dimensionsCm: hasDims
        ? { l: lengthRaw, w: widthRaw, h: heightRaw }
        : undefined,
    });
  }
  const joinedContents = parcelsPayload.map((x) => x.contentsDescription).join(" · ");
  const joinedDeclared = parcelsPayload
    .map((x) => x.declaredValue)
    .filter((x): x is string => Boolean(x && String(x).trim()))
    .join(" · ");

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

  const senderStateTrim = row.senderState.trim();
  const recipientStateTrim = row.recipientState.trim();
  const bookingPayload: CourierPayload = {
    sender: {
      name: row.senderName,
      email: row.senderEmail,
      phone: senderPhoneDigits,
      street: row.senderStreet,
      city: row.senderCity,
      ...(senderStateTrim ? { state: senderStateTrim } : {}),
      postal: row.senderPostal,
      country: senderCountryEff,
    },
    recipient: {
      name: row.recipientName,
      email: row.recipientEmail,
      phone: recipientPhoneDigits,
      street: row.recipientStreet,
      city: row.recipientCity,
      ...(recipientStateTrim ? { state: recipientStateTrim } : {}),
      postal: row.recipientPostal,
      country: recipientCountryEff,
    },
    shipment: {
      contentsDescription: joinedContents,
      weightKg: totalWeight,
      parcelCount: parcelCountNum,
      parcels: parcelsPayload,
      dimensionsCm:
        parcelCountNum === 1 && parcelsPayload[0]?.dimensionsCm
          ? parcelsPayload[0].dimensionsCm
          : undefined,
      declaredValue: joinedDeclared || undefined,
    },
    collectionMode,
    pickupCityHint: pickCity,
    deliveryCityHint: delCity,
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
  if (step === 4) {
    const allowed = new Set<string>([...BOOKING_STEP_FIELDS[4]]);
    const n = Math.min(
      99,
      Math.max(1, parseInt(String(row.parcelCount || "").trim(), 10) || 1),
    );
    for (let i = 0; i < n; i++) {
      allowed.add(`parcel_${i}_contentsDescription`);
      allowed.add(`parcel_${i}_weightKg`);
      allowed.add(`parcel_${i}_declaredValue`);
      allowed.add(`parcel_${i}_lengthCm`);
      allowed.add(`parcel_${i}_widthCm`);
      allowed.add(`parcel_${i}_heightCm`);
    }
    return Object.fromEntries(
      Object.entries(validation.fieldErrors).filter(([key]) => allowed.has(key))
    );
  }
  const allowed = new Set<string>(BOOKING_STEP_FIELDS[step]);
  return Object.fromEntries(
    Object.entries(validation.fieldErrors).filter(([key]) => allowed.has(key))
  );
}

export function bookCourierRowFromFormData(formData: FormData): BookCourierRow {
  const s = (key: string) => String(formData.get(key) ?? "").trim();
  const parcelNRaw = parseInt(s("parcelCount"), 10);
  const parcelN = Math.min(99, Math.max(1, Number.isFinite(parcelNRaw) ? parcelNRaw : 1));
  const parcels = readParcelsFromFormData(formData, parcelN);
  const first = parcels[0];
  return {
    routeType: s("routeType"),
    parcelCount: s("parcelCount"),
    pickupCountryHint: s("pickupCountryHint"),
    pickupCityHint: s("pickupCityHint"),
    deliveryCountryHint: s("deliveryCountryHint"),
    deliveryCityHint: s("deliveryCityHint"),
    collectionMode: s("collectionMode"),
    pickupDate: s("pickupDate"),
    pickupTimeSlot: s("pickupTimeSlot"),
    pickupTimeSlotCustom: s("pickupTimeSlotCustom"),
    senderName: s("senderName"),
    senderEmail: s("senderEmail"),
    senderPhone: s("senderPhone"),
    senderStreet: s("senderStreet"),
    senderCity: s("senderCity"),
    senderState: s("senderState"),
    senderPostal: s("senderPostal"),
    senderCountry: s("senderCountry"),
    recipientName: s("recipientName"),
    recipientEmail: s("recipientEmail"),
    recipientPhone: s("recipientPhone"),
    recipientStreet: s("recipientStreet"),
    recipientCity: s("recipientCity"),
    recipientState: s("recipientState"),
    recipientPostal: s("recipientPostal"),
    recipientCountry: s("recipientCountry"),
    contentsDescription: first?.contentsDescription ?? s("contentsDescription"),
    weightKg: first?.weightKg ?? s("weightKg"),
    lengthCm: first?.lengthCm ?? s("lengthCm"),
    widthCm: first?.widthCm ?? s("widthCm"),
    heightCm: first?.heightCm ?? s("heightCm"),
    declaredValue: first?.declaredValue ?? s("declaredValue"),
    parcels,
    pickupPreference: s("pickupPreference"),
    instructions: s("instructions"),
    agreed: formData.get("agreed") === "on",
  };
}
