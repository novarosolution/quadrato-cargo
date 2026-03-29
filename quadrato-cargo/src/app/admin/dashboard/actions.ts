"use server";

import { revalidatePath } from "next/cache";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { ADMIN_API_SECRET } from "@/lib/admin-api-secret";

export type DataManageState =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type BookingAdminUpdateState =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function adminMutation(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PATCH" | "DELETE" = "PATCH",
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_API_SECRET,
      },
      body: method === "DELETE" ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
    };
    return { ok: Boolean(res.ok && data.ok), message: data.message };
  } catch {
    return {
      ok: false,
      message: "Cannot connect to server. Start backend and try again.",
    };
  }
}

export async function createStaffUserAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const result = await adminMutation(
    "/api/admin/users/staff",
    {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    },
    "POST",
  );
  if (!result.ok) return { ok: false, error: result.message || "Failed to create staff account." };
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return { ok: true, message: "Team account created." };
}

export async function createCourierUserAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const result = await adminMutation(
    "/api/admin/users/courier",
    {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    },
    "POST",
  );
  if (!result.ok) return { ok: false, error: result.message || "Failed to create courier account." };
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return { ok: true, message: "Courier account created." };
}

export async function createAgencyUserAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const result = await adminMutation(
    "/api/admin/users/agency",
    {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    },
    "POST",
  );
  if (!result.ok) return { ok: false, error: result.message || "Failed to create agency account." };
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return { ok: true, message: "Agency account created." };
}

export async function updateUserAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const userId = String(formData.get("userId") ?? "");
  const result = await adminMutation(`/api/admin/users/${encodeURIComponent(userId)}`, {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    role: String(formData.get("role") ?? "customer").trim(),
    isActive: String(formData.get("isActive") ?? "") === "on",
    isOnDuty: String(formData.get("isOnDuty") ?? "") === "on",
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!result.ok) return { ok: false, error: result.message || "Failed to update user." };
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, message: "User updated." };
}

export async function assignCourierToBookingAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/assign-courier`,
    {
      courierUserId: String(formData.get("courierUserId") ?? ""),
    },
  );
  if (!result.ok) return { ok: false, error: result.message || "Failed to assign courier." };
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true, message: "Courier assignment updated." };
}

export async function linkBookingToUserAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/link-user`,
    {
      customerEmail: String(formData.get("customerEmail") ?? "").trim(),
    },
  );
  if (!result.ok) return { ok: false, error: result.message || "Failed to link booking." };
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true, message: "Booking linked to user." };
}

export async function unlinkBookingFromUserAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/link-user`,
    {
      customerEmail: "",
    },
  );
  if (!result.ok) return { ok: false, error: result.message || "Failed to unlink booking." };
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true, message: "Booking unlinked from user." };
}

export async function updateCourierBookingAdmin(
  _prev: BookingAdminUpdateState | undefined,
  formData: FormData,
): Promise<BookingAdminUpdateState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/controls`,
    {
      status: String(formData.get("status") ?? ""),
      consignmentNumber: String(formData.get("consignmentNumber") ?? ""),
      publicTrackingNote: String(
        formData.get("publicTrackingNote") ?? formData.get("trackingNotes") ?? "",
      ),
      internalNotes: String(formData.get("internalNotes") ?? ""),
      assignedAgency: String(formData.get("assignedAgency") ?? ""),
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to update booking controls." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true, message: "Booking controls updated." };
}

export async function updateCourierBookingDataAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const routeType = String(formData.get("routeType") ?? "domestic");
  const payloadJson = String(formData.get("payloadJson") ?? "{}");
  let payload: unknown;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return { ok: false, error: "Payload JSON is invalid." };
  }
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Payload must be a JSON object." };
  }
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/data`,
    {
      routeType,
      payload,
    },
  );
  if (!result.ok) return { ok: false, error: result.message || "Failed to update booking data." };
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true, message: "Booking route and payload updated." };
}

export async function updateContactSubmissionAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const contactId = String(formData.get("contactId") ?? "");
  const result = await adminMutation(`/api/admin/contacts/${encodeURIComponent(contactId)}`, {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    service: String(formData.get("service") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  });
  if (!result.ok) return { ok: false, error: result.message || "Failed to update contact." };
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${contactId}`);
  return { ok: true, message: "Contact updated." };
}

export async function deleteCourierBooking(bookingId: string): Promise<void> {
  await adminMutation(`/api/admin/bookings/${encodeURIComponent(bookingId)}`, {}, "DELETE");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return;
}

export async function deleteUserAdmin(userId: string): Promise<void> {
  await adminMutation(`/api/admin/users/${encodeURIComponent(userId)}`, {}, "DELETE");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return;
}

export async function deleteContactSubmission(contactId: string): Promise<void> {
  await adminMutation(`/api/admin/contacts/${encodeURIComponent(contactId)}`, {}, "DELETE");
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${contactId}`);
  return;
}

export async function updateSiteSettingsAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const result = await adminMutation("/api/admin/settings/site", {
    announcementEnabled:
      String(formData.get("announcementEnabled") ?? "").trim() === "on",
    announcementText: String(formData.get("announcementText") ?? "").trim(),
    announcementCtaLabel: String(formData.get("announcementCtaLabel") ?? "").trim(),
    announcementCtaHref: String(formData.get("announcementCtaHref") ?? "").trim(),
    pdfCompanyName: String(formData.get("pdfCompanyName") ?? "").trim(),
    pdfCompanyAddress: String(formData.get("pdfCompanyAddress") ?? "").trim(),
    pdfLogoText: String(formData.get("pdfLogoText") ?? "").trim(),
    pdfPrimaryColor: String(formData.get("pdfPrimaryColor") ?? "").trim(),
    pdfAccentColor: String(formData.get("pdfAccentColor") ?? "").trim(),
    pdfCardColor: String(formData.get("pdfCardColor") ?? "").trim(),
    pdfHeaderSubtitle: String(formData.get("pdfHeaderSubtitle") ?? "").trim(),
    pdfSupportEmail: String(formData.get("pdfSupportEmail") ?? "").trim(),
    pdfSupportPhone: String(formData.get("pdfSupportPhone") ?? "").trim(),
    pdfWebsite: String(formData.get("pdfWebsite") ?? "").trim(),
    pdfWatermarkText: String(formData.get("pdfWatermarkText") ?? "").trim(),
    pdfFooterNote: String(formData.get("pdfFooterNote") ?? "").trim(),
  });

  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to update website settings." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true, message: "Website settings updated." };
}

