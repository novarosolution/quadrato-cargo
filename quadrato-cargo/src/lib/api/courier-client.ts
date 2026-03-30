import { getApiBaseUrl } from "@/lib/api/base-url";
import { csrfHeaderRecord } from "@/lib/api/csrf-headers";

export type CourierBooking = {
  id: string;
  userId: string | null;
  createdAt: string;
  updatedAt?: string;
  routeType: string;
  status: string;
  consignmentNumber: string | null;
  trackingNotes: string | null;
  assignedAgency?: string | null;
  pickupOtpVerifiedAt?: string | null;
  agencyHandoverOtpCode?: string | null;
  agencyHandoverOtpExpiresAt?: string | null;
  agencyHandoverVerifiedAt?: string | null;
  payload: unknown;
};

export type CourierDutyStatus = {
  id: string;
  isActive: boolean;
  isOnDuty: boolean;
  openJobCount: number;
  readyForJob: boolean;
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

export async function fetchCourierBookingsServer(cookieHeader: string) {
  return serverFetch<{ ok: boolean; bookings: CourierBooking[] }>(
    "/api/courier/me/bookings",
    cookieHeader,
  );
}

export async function fetchCourierStatusServer(cookieHeader: string) {
  return serverFetch<{ ok: boolean; courier: CourierDutyStatus }>(
    "/api/courier/me/status",
    cookieHeader,
  );
}

export async function fetchCourierBookingDetailServer(
  cookieHeader: string,
  id: string,
) {
  return serverFetch<{ ok: boolean; booking: CourierBooking }>(
    `/api/courier/me/bookings/${encodeURIComponent(id)}`,
    cookieHeader,
  );
}

export async function verifyCourierPickupOtpApi(args: {
  bookingId: string;
  otpCode: string;
}): Promise<
  | {
      ok: true;
      message: string;
      agencyHandoverOtp?: string | null;
      agencyHandoverOtpExpiresAt?: string | null;
    }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/courier/me/bookings/${encodeURIComponent(args.bookingId)}/verify-pickup-otp`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaderRecord(),
        },
        body: JSON.stringify({ otpCode: args.otpCode }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      agencyHandoverOtp?: string | null;
      agencyHandoverOtpExpiresAt?: string | null;
    };
    if (res.ok && data.ok) {
      return {
        ok: true,
        message: data.message || "Pickup OTP verified.",
        agencyHandoverOtp: data.agencyHandoverOtp ?? null,
        agencyHandoverOtpExpiresAt: data.agencyHandoverOtpExpiresAt ?? null,
      };
    }
    return { ok: false, error: data.message || "Failed to verify pickup OTP." };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again.",
    };
  }
}

export async function startCourierJobApi(args: {
  bookingId: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/courier/me/bookings/${encodeURIComponent(args.bookingId)}/start-job`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeaderRecord(),
        },
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, message: data.message || "Job started." };
    }
    return { ok: false, error: data.message || "Failed to start courier job." };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again."
    };
  }
}

export async function updateCourierDutyStatusApi(args: {
  isOnDuty: boolean;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/courier/me/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaderRecord(),
      },
      body: JSON.stringify({ isOnDuty: args.isOnDuty }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, message: data.message || "Duty status updated." };
    }
    return { ok: false, error: data.message || "Failed to update duty status." };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again."
    };
  }
}
