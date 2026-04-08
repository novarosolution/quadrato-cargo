import { getApiBaseUrl } from "@/lib/api/base-url";
import { csrfHeaderRecord } from "@/lib/api/csrf-headers";
import type {
  PublicTimelineOverrides,
  PublicTimelineStepVisibility,
} from "@/lib/api/public-client";

export type AgencyBooking = {
  id: string;
  userId: string | null;
  createdAt: string;
  updatedAt?: string;
  routeType: string;
  status: string;
  consignmentNumber: string | null;
  trackingNotes: string | null;
  publicTrackingNote?: string | null;
  assignedAgency?: string | null;
  agencyHandoverVerifiedAt?: string | null;
  senderAddress?: string | null;
  recipientAddress?: string | null;
  publicTimelineOverrides?: PublicTimelineOverrides | null;
  publicTimelineStepVisibility?: PublicTimelineStepVisibility | null;
  publicTimelineStatusPath?: string[] | null;
  /** International: 0–11 macro stage on customer Track; null = auto from status. */
  internationalAgencyStage?: number | null;
  courierId?: string | null;
  /** Resolved from courier account (name, or email if name empty). */
  courierName?: string | null;
  payload: unknown;
};

type ServerFetchResult<T> = { ok: true; data: T } | { ok: false };

async function serverFetch<T>(
  path: string,
  cookieHeader: string,
): Promise<ServerFetchResult<T>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false };
  }
}

export async function fetchAgencyBookingsServer(cookieHeader: string) {
  return serverFetch<{ ok: boolean; bookings: AgencyBooking[] }>(
    "/api/agency/me/bookings",
    cookieHeader,
  );
}

export async function verifyAgencyHandoverApi(args: {
  reference: string;
  otpCode: string;
}): Promise<
  | { ok: true; message: string; booking?: AgencyBooking }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/agency/verify-handover`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaderRecord(),
      },
      body: JSON.stringify({
        reference: args.reference,
        otpCode: args.otpCode,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      booking?: AgencyBooking;
    };
    if (res.ok && data.ok) {
      return {
        ok: true,
        message: data.message || "Agency handover verified.",
        booking: data.booking,
      };
    }
    return { ok: false, error: data.message || "Failed to verify agency handover." };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again.",
    };
  }
}

export async function patchAgencyProfileApi(args: {
  name: string;
  agencyAddress: string;
  agencyPhone: string;
  agencyCity: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/agency/me/profile`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaderRecord(),
      },
      body: JSON.stringify({
        name: args.name,
        agencyAddress: args.agencyAddress,
        agencyPhone: args.agencyPhone,
        agencyCity: args.agencyCity,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, message: data.message || "Agency profile saved." };
    }
    return { ok: false, error: data.message || "Failed to save profile." };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again.",
    };
  }
}

export async function patchAgencyBookingTimelineApi(args: {
  bookingId: string;
  body: Record<string, unknown>;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/agency/me/bookings/${encodeURIComponent(args.bookingId)}/timeline-overrides`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaderRecord(),
        },
        body: JSON.stringify(args.body),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, message: data.message || "Timeline saved." };
    }
    return {
      ok: false,
      error: (typeof data.message === "string" && data.message.trim()) || "Failed to save timeline.",
    };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again.",
    };
  }
}

export async function updateAgencyBookingApi(args: {
  bookingId: string;
  status: string;
  publicTrackingNote: string;
  /** International only: 0–11 fixes Track macro card; null clears (follow status). Omit = leave unchanged. */
  internationalAgencyStage?: number | null;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/agency/me/bookings/${encodeURIComponent(args.bookingId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaderRecord(),
        },
        body: JSON.stringify({
          status: args.status,
          publicTrackingNote: args.publicTrackingNote,
          ...(args.internationalAgencyStage !== undefined
            ? { internationalAgencyStage: args.internationalAgencyStage }
            : {}),
        }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, message: data.message || "Agency update saved." };
    }
    return { ok: false, error: data.message || "Failed to update booking." };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again.",
    };
  }
}
