import { prisma } from "@/lib/prisma";

export type ContactInput = {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
};

export async function saveContactSubmission(data: ContactInput) {
  return prisma.contactSubmission.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      service: data.service,
      message: data.message,
    },
  });
}

/** One physical parcel / box in a booking (weight, contents, dims). */
export type ShipmentParcelPayload = {
  contentsDescription: string;
  weightKg: number;
  dimensionsCm?: { l: string; w: string; h: string };
  declaredValue?: string;
};

export type CourierPayload = {
  sender: Record<string, string>;
  recipient: Record<string, string>;
  shipment: {
    contentsDescription: string;
    weightKg: number;
    /** How many parcels in this booking (captured on step 1). */
    parcelCount?: number;
    /** Per-parcel detail; length should match parcelCount when both are set. */
    parcels?: ShipmentParcelPayload[];
    dimensionsCm?: { l: string; w: string; h: string };
    declaredValue?: string;
  };
  /** Instant (~10 min target at Postal Code / ZIP where serviceable) or scheduled window. */
  collectionMode: "instant" | "scheduled";
  /** Step-1 route hints; also used on Track when full addresses are not yet shown. */
  pickupCityHint?: string;
  deliveryCityHint?: string;
  pickupDate?: string;
  pickupTimeSlot?: string;
  pickupPreference: string;
  instructions?: string;
  agreedInternational?: boolean;
};

export async function saveCourierBooking(
  routeType: string,
  payload: CourierPayload,
  options?: { userId?: string | null },
) {
  return prisma.courierBooking.create({
    data: {
      routeType,
      payload,
      ...(options?.userId
        ? { user: { connect: { id: options.userId } } }
        : {}),
    },
  });
}
