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

export type CourierPayload = {
  sender: Record<string, string>;
  recipient: Record<string, string>;
  shipment: {
    contentsDescription: string;
    weightKg: number;
    dimensionsCm?: { l: string; w: string; h: string };
    declaredValue?: string;
  };
  /** Instant (~10 min target at PIN where serviceable) or scheduled window. */
  collectionMode: "instant" | "scheduled";
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
