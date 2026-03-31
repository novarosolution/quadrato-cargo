"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { ADMIN_API_SECRET } from "@/lib/admin-api-secret";

export type DataManageState =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type BookingAdminUpdateState =
  | { ok: true; message: string; warning?: string }
  | { ok: false; error: string };

export type OpenBookingByRefState = { ok: false; error: string };

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
    if (res.ok && data.ok) return { ok: true, message: data.message };
    const fallback =
      res.status === 401
        ? "Unauthorized — check ADMIN_API_SECRET matches the server."
        : res.status === 404
          ? "Record not found."
          : res.status >= 500
            ? "Server error. Try again or check API logs."
            : "Request failed.";
    return {
      ok: false,
      message: (typeof data.message === "string" && data.message.trim()) || fallback,
    };
  } catch {
    return {
      ok: false,
      message: "Cannot connect to server. Start the API and try again.",
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
      agencyAddress: String(formData.get("agencyAddress") ?? "").trim(),
      agencyPhone: String(formData.get("agencyPhone") ?? "").trim(),
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
    agencyAddress: String(formData.get("agencyAddress") ?? "").trim(),
    agencyPhone: String(formData.get("agencyPhone") ?? "").trim(),
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
  revalidatePath("/public/tsking");
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

export async function openAdminBookingByReference(
  _prev: OpenBookingByRefState | undefined,
  formData: FormData,
): Promise<OpenBookingByRefState | undefined> {
  const reference = String(formData.get("reference") ?? "").trim();
  if (reference.length < 6) {
    return {
      ok: false,
      error:
        "Enter at least 6 characters (booking ID, Tracking ID, or QC barcode — letters, numbers, hyphens only).",
    };
  }
  const params = new URLSearchParams({ reference });
  let res: Response;
  try {
    res = await fetch(
      `${getApiBaseUrl()}/api/admin/bookings/resolve?${params.toString()}`,
      {
        headers: { "x-admin-secret": ADMIN_API_SECRET },
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, error: "Cannot connect to server. Start backend and try again." };
  }
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    bookingId?: string;
    message?: string;
  };
  if (!res.ok || !data.ok || !data.bookingId) {
    return {
      ok: false,
      error: data.message || "No booking found for that reference.",
    };
  }
  redirect(`/admin/bookings/${data.bookingId}`);
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
      operationalTrackingNotes: String(formData.get("operationalTrackingNotes") ?? ""),
      internalNotes: String(formData.get("internalNotes") ?? ""),
      assignedAgency: String(formData.get("assignedAgency") ?? ""),
      customerDisplayCreatedAt: String(formData.get("customerDisplayCreatedAt") ?? ""),
      customerDisplayUpdatedAt: String(formData.get("customerDisplayUpdatedAt") ?? ""),
      estimatedDeliveryAt: String(formData.get("estimatedDeliveryAt") ?? ""),
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to update booking controls." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  revalidatePath("/public/profile");
  return { ok: true, message: "Booking controls updated." };
}

/** Saves dispatch fields and courier assignment in one submit (controls first, then assign-courier). */
export async function saveManualTrackingAdmin(
  _prev: BookingAdminUpdateState | undefined,
  formData: FormData,
): Promise<BookingAdminUpdateState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const controlsResult = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/controls`,
    {
      status: String(formData.get("status") ?? ""),
      consignmentNumber: String(formData.get("consignmentNumber") ?? ""),
      publicTrackingNote: String(
        formData.get("publicTrackingNote") ?? formData.get("trackingNotes") ?? "",
      ),
      operationalTrackingNotes: String(formData.get("operationalTrackingNotes") ?? ""),
      internalNotes: String(formData.get("internalNotes") ?? ""),
      assignedAgency: String(formData.get("assignedAgency") ?? ""),
      customerDisplayCreatedAt: String(formData.get("customerDisplayCreatedAt") ?? ""),
      customerDisplayUpdatedAt: String(formData.get("customerDisplayUpdatedAt") ?? ""),
      estimatedDeliveryAt: String(formData.get("estimatedDeliveryAt") ?? ""),
    },
  );
  if (!controlsResult.ok) {
    return {
      ok: false,
      error: controlsResult.message || "Failed to update booking controls.",
    };
  }

  const assignResult = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/assign-courier`,
    {
      courierUserId: String(formData.get("courierUserId") ?? "__unassigned"),
    },
  );

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  revalidatePath("/public/profile");

  if (!assignResult.ok) {
    return {
      ok: true,
      message: "Your tracking form was saved (status, messages, agency, numbers, and notes).",
      warning:
        assignResult.message ||
        "The courier on this job could not be changed. Check they are active, on duty, and not already on another open job — then try again.",
    };
  }
  return {
    ok: true,
    message: "Saved. Tracking details and courier assignment are all up to date.",
  };
}

export async function saveCustomerTimelineAdmin(
  _prev: BookingAdminUpdateState | undefined,
  formData: FormData,
): Promise<BookingAdminUpdateState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const raw = String(formData.get("timelineJson") ?? "").trim();
  if (!bookingId) return { ok: false, error: "Missing booking." };
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return { ok: false, error: "Timeline data is not valid JSON." };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid timeline payload." };
  }
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/timeline-overrides`,
    body as Record<string, unknown>,
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to save customer timeline." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  return {
    ok: true,
    message: "All timeline changes saved.",
  };
}

/** Merges one timeline step into existing `publicTimelineOverrides` (does not replace other steps or the other route). */
export async function saveCustomerTimelineStepAdmin(
  _prev: BookingAdminUpdateState | undefined,
  formData: FormData,
): Promise<BookingAdminUpdateState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const modeKey = String(formData.get("modeKey") ?? "").trim();
  const stepIndex = String(formData.get("stepIndex") ?? "").trim();
  const raw = String(formData.get("stepPayloadJson") ?? "").trim();
  if (!bookingId) return { ok: false, error: "Missing booking." };
  if (modeKey !== "domestic" && modeKey !== "international") {
    return { ok: false, error: "Invalid timeline route." };
  }
  if (!/^\d+$/.test(stepIndex)) {
    return { ok: false, error: "Invalid step index." };
  }
  let stage: Record<string, unknown>;
  try {
    stage = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return { ok: false, error: "Step data is not valid JSON." };
  }
  if (!stage || typeof stage !== "object" || Array.isArray(stage)) {
    return { ok: false, error: "Invalid step payload." };
  }
  const body: Record<string, unknown> = {
    merge: true,
    [modeKey]: { [stepIndex]: stage },
  };
  const visRaw = String(formData.get("stepVisibilityJson") ?? "").trim();
  if (visRaw) {
    try {
      const sv = JSON.parse(visRaw) as unknown;
      if (sv && typeof sv === "object" && !Array.isArray(sv)) {
        body.stepVisibility = sv;
      }
    } catch {
      return { ok: false, error: "Step visibility data is not valid JSON." };
    }
  }
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/timeline-overrides`,
    body,
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to save this timeline step." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  return {
    ok: true,
    message: "Step text saved.",
  };
}

/** Updates only which steps appear on public Track (admin checkbox). Does not change card title/location text. */
export async function saveCustomerTimelineStepVisibilityOnly(
  _prev: BookingAdminUpdateState | undefined,
  formData: FormData,
): Promise<BookingAdminUpdateState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const raw = String(formData.get("stepVisibilityOnlyJson") ?? "").trim();
  if (!bookingId) return { ok: false, error: "Missing booking." };
  let stepVisibility: unknown;
  try {
    stepVisibility = raw ? JSON.parse(raw) : null;
  } catch {
    return { ok: false, error: "Step visibility data is not valid JSON." };
  }
  if (!stepVisibility || typeof stepVisibility !== "object" || Array.isArray(stepVisibility)) {
    return { ok: false, error: "Invalid step visibility payload." };
  }
  const body: Record<string, unknown> = {
    merge: true,
    stepVisibility,
  };
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/timeline-overrides`,
    body,
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to save step visibility." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  return {
    ok: true,
    message: "Visibility saved.",
  };
}

type LocationStagePatch = Record<string, { location: string }>;

/** Merges location lines for every timeline step in one request (current route only). Empty string clears an override. */
export async function saveCustomerTimelineLocationsAdmin(
  _prev: BookingAdminUpdateState | undefined,
  formData: FormData,
): Promise<BookingAdminUpdateState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const modeKey = String(formData.get("modeKey") ?? "").trim();
  const raw = String(formData.get("locationsJson") ?? "").trim();
  if (!bookingId) return { ok: false, error: "Missing booking." };
  if (modeKey !== "domestic" && modeKey !== "international") {
    return { ok: false, error: "Invalid timeline route." };
  }
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return { ok: false, error: "Location data is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Invalid location payload." };
  }
  const inner: LocationStagePatch = {};
  for (const [idx, val] of Object.entries(parsed as Record<string, unknown>)) {
    if (!/^\d+$/.test(idx)) continue;
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const loc = (val as { location?: unknown }).location;
    inner[idx] = { location: typeof loc === "string" ? loc : "" };
  }
  if (Object.keys(inner).length === 0) {
    return {
      ok: false,
      error: "Tick at least one step (Apply checkboxes).",
    };
  }
  const body: Record<string, unknown> = {
    merge: true,
    [modeKey]: inner,
  };
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/timeline-overrides`,
    body,
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to save timeline locations." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  return {
    ok: true,
    message: "Locations saved.",
  };
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
  revalidatePath("/public/tsking");
  return { ok: true, message: "Booking route and payload updated." };
}

/** Deep-merge only sender/recipient name, email, phone into booking payload. */
export async function updateBookingContactAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const routeTypeRaw = String(formData.get("routeType") ?? "domestic").trim();
  const routeType = routeTypeRaw === "international" ? "international" : "domestic";
  const pick = (name: string) => String(formData.get(name) ?? "").trim();
  const sender = {
    name: pick("senderName"),
    email: pick("senderEmail"),
    phone: pick("senderPhone"),
  };
  const recipient = {
    name: pick("recipientName"),
    email: pick("recipientEmail"),
    phone: pick("recipientPhone"),
    street: pick("recipientStreet"),
    city: pick("recipientCity"),
    postal: pick("recipientPostal"),
    country: pick("recipientCountry"),
  };
  if (!bookingId) return { ok: false, error: "Missing booking." };
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/data`,
    {
      merge: true,
      routeType,
      payload: { sender, recipient },
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to update contacts." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  revalidatePath("/courier/bookings");
  revalidatePath(`/courier/bookings/${bookingId}`);
  return { ok: true, message: "Sender and recipient contact details saved." };
}

export async function updateBookingShipmentAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const routeTypeRaw = String(formData.get("routeType") ?? "domestic").trim();
  const routeType = routeTypeRaw === "international" ? "international" : "domestic";
  const pick = (name: string) => String(formData.get(name) ?? "").trim();
  if (!bookingId) return { ok: false, error: "Missing booking." };

  const payload: Record<string, unknown> = {
    shipment: {
      contentsDescription: pick("contentsDescription"),
      declaredValue: pick("declaredValue"),
      weightKg: pick("weightKg"),
      dimensionsCm: {
        l: pick("dimL"),
        w: pick("dimW"),
        h: pick("dimH"),
      },
    },
  };

  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/data`,
    {
      merge: true,
      routeType,
      payload,
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to update shipment details." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  revalidatePath("/public/profile");
  return { ok: true, message: "Shipment details saved (weight, dimensions, contents)." };
}

export async function updateBookingPickupAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const routeTypeRaw = String(formData.get("routeType") ?? "domestic").trim();
  const routeType = routeTypeRaw === "international" ? "international" : "domestic";
  const pick = (name: string) => String(formData.get(name) ?? "").trim();
  if (!bookingId) return { ok: false, error: "Missing booking." };

  const collectionMode = pick("collectionMode");
  const payload: Record<string, unknown> = {
    sender: {
      street: pick("senderStreet"),
      city: pick("senderCity"),
      postal: pick("senderPostal"),
      country: pick("senderCountry"),
    },
    pickupDate: pick("pickupDate"),
    pickupTimeSlot: pick("pickupTimeSlot"),
    pickupTimeSlotCustom: pick("pickupTimeSlotCustom"),
    pickupPreference: pick("pickupPreference"),
    instructions: pick("instructions"),
  };
  if (collectionMode === "instant" || collectionMode === "scheduled") {
    payload.collectionMode = collectionMode;
  } else if (collectionMode === "") {
    payload.collectionMode = "";
  }

  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/data`,
    {
      merge: true,
      routeType,
      payload,
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to update pickup details." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  revalidatePath("/courier/bookings");
  revalidatePath(`/courier/bookings/${bookingId}`);
  return { ok: true, message: "Pickup and sender address saved." };
}

export async function updateBookingInvoiceAdmin(
  _prev: DataManageState | undefined,
  formData: FormData,
): Promise<DataManageState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const invoicePdfReady = String(formData.get("invoicePdfReady") ?? "") === "on";
  const result = await adminMutation(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/invoice`,
    {
      invoicePdfReady,
      invoice: {
        number: String(formData.get("invoiceNumber") ?? "").trim(),
        currency: String(formData.get("invoiceCurrency") ?? "INR").trim(),
        subtotal: String(formData.get("invoiceSubtotal") ?? "").trim(),
        tax: String(formData.get("invoiceTax") ?? "").trim(),
        insurance: String(formData.get("invoiceInsurance") ?? "").trim(),
        customsDuties: String(formData.get("invoiceCustomsDuties") ?? "").trim(),
        discount: String(formData.get("invoiceDiscount") ?? "").trim(),
        total: String(formData.get("invoiceTotal") ?? "").trim(),
        lineDescription: String(formData.get("invoiceLineDescription") ?? "").trim(),
        notes: String(formData.get("invoiceNotes") ?? "").trim(),
      },
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to save invoice settings." };
  }
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/public/tsking");
  return { ok: true, message: "Invoice PDF settings saved." };
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
    googleMapsEmbedSrc: String(formData.get("googleMapsEmbedSrc") ?? "").trim(),
    pdfLogoText: String(formData.get("pdfLogoText") ?? "").trim(),
    pdfPrimaryColor: String(formData.get("pdfPrimaryColor") ?? "").trim(),
    pdfAccentColor: String(formData.get("pdfAccentColor") ?? "").trim(),
    pdfCardColor: String(formData.get("pdfCardColor") ?? "").trim(),
    pdfHeaderSubtitle: String(formData.get("pdfHeaderSubtitle") ?? "").trim(),
    pdfSupportEmail: String(formData.get("pdfSupportEmail") ?? "").trim(),
    pdfSupportPhone: String(formData.get("pdfSupportPhone") ?? "").trim(),
    publicInfoEmail: String(formData.get("publicInfoEmail") ?? "").trim(),
    pdfWebsite: String(formData.get("pdfWebsite") ?? "").trim(),
    pdfWatermarkText: String(formData.get("pdfWatermarkText") ?? "").trim(),
    pdfFooterNote: String(formData.get("pdfFooterNote") ?? "").trim(),
    trackShowStatusBadge: String(formData.get("trackShowStatusBadge") ?? "").trim() === "on",
    trackShowRouteAndDates: String(formData.get("trackShowRouteAndDates") ?? "").trim() === "on",
    trackShowOperationalLog: String(formData.get("trackShowOperationalLog") ?? "").trim() === "on",
    trackShowAssignmentSection: String(formData.get("trackShowAssignmentSection") ?? "").trim() === "on",
    trackShowShipmentCard: String(formData.get("trackShowShipmentCard") ?? "").trim() === "on",
    trackShowTimeline: String(formData.get("trackShowTimeline") ?? "").trim() === "on",
    trackShowInternationalHelp: String(formData.get("trackShowInternationalHelp") ?? "").trim() === "on",
    trackShowOnHoldBanner: String(formData.get("trackShowOnHoldBanner") ?? "").trim() === "on",
  });

  if (!result.ok) {
    return { ok: false, error: result.message || "Failed to update website settings." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/public/tsking");
  revalidatePath("/public/contact");
  revalidatePath("/public", "layout");
  return { ok: true, message: "Website settings updated." };
}

