import { getApiBaseUrl } from "@/lib/api/base-url";

export type ProfileUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProfileBooking = {
  id: string;
  userId: string | null;
  createdAt: string;
  updatedAt?: string;
  routeType: string;
  status: string;
  consignmentNumber: string | null;
  trackingNotes: string | null;
  customerTrackingNote?: string | null;
  assignedAgency?: string | null;
  courierName?: string | null;
  senderName?: string | null;
  senderAddress?: string | null;
  recipientName?: string | null;
  recipientAddress?: string | null;
  pickupOtpVerifiedAt?: string | null;
  payload: unknown;
};

export async function updateProfileNameApi(
  name: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      error?: string;
    };

    if (res.ok && data.ok) {
      return { ok: true, message: data.message || "Profile updated successfully." };
    }
    return { ok: false, error: data.error || data.message || "Update failed." };
  } catch {
    return { ok: false, error: "Cannot connect to server. Start backend and try again." };
  }
}

export async function updateProfilePasswordApi(args: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/me/password`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      error?: string;
    };

    if (res.ok && data.ok) {
      return { ok: true, message: data.message || "Password updated successfully." };
    }
    return {
      ok: false,
      error: data.error || data.message || "Password update failed.",
    };
  } catch {
    return {
      ok: false,
      error: "Cannot connect to server. Start backend and try again.",
    };
  }
}

async function serverFetch<T>(
  path: string,
  cookieHeader: string,
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

export async function fetchProfileUserServer(cookieHeader: string) {
  return serverFetch<{ ok: boolean; user: ProfileUser | null }>(
    "/api/users/me",
    cookieHeader,
  );
}

export async function fetchProfileBookingsServer(cookieHeader: string) {
  return serverFetch<{ ok: boolean; bookings: ProfileBooking[] }>(
    "/api/users/me/bookings",
    cookieHeader,
  );
}

export async function fetchProfileBookingDetailServer(
  cookieHeader: string,
  id: string,
) {
  return serverFetch<{ ok: boolean; booking: ProfileBooking }>(
    `/api/users/me/bookings/${id}`,
    cookieHeader,
  );
}

export async function fetchProfileBookingPickupOtpServer(
  cookieHeader: string,
  id: string,
) {
  return serverFetch<{
    ok: boolean;
    pickupOtp: {
      code: string | null;
      expiresAt: string | null;
      verifiedAt: string | null;
      status: string;
    };
  }>(`/api/users/me/bookings/${id}/pickup-otp`, cookieHeader);
}
