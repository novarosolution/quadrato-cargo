/**
 * Public backend client (no auth required).
 */
import { getApiBaseUrl } from "@/lib/api/base-url";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export type HealthResponse = {
  ok: boolean;
  service: string;
  time: string;
};

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/health`, { cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        service: "quadrato-cargo",
        time: new Date().toISOString(),
      };
    }
    return (await res.json()) as HealthResponse;
  } catch {
    return {
      ok: false,
      service: "quadrato-cargo",
      time: new Date().toISOString(),
    };
  }
}

export type ContactApiBody = {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
};

export type ContactFormResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors: Partial<
        Record<"name" | "email" | "phone" | "message" | "service", string>
      >;
    };

export async function postContactApi(
  body: ContactApiBody,
): Promise<ContactFormResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/contact`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as ContactFormResult;
    if (res.ok && data.ok) return data;
    return {
      ok: false,
      message:
        ("message" in data && data.message) || "Unable to submit your contact request.",
      fieldErrors: "fieldErrors" in data ? data.fieldErrors || {} : {},
    };
  } catch {
    return {
      ok: false,
      message: "Cannot connect to server. Start backend and try again.",
      fieldErrors: {},
    };
  }
}

export type BookCourierFormResult =
  | { ok: true; message: string; bookingReference?: string }
  | {
      ok: false;
      message: string;
      fieldErrors: Record<string, string>;
    };

export async function postBookCourierApi(
  body: Record<string, unknown>,
): Promise<BookCourierFormResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/bookings`, {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as BookCourierFormResult;
    if (res.ok && data.ok) return data;
    return {
      ok: false,
      message:
        ("message" in data && data.message) ||
        "Unable to submit booking right now. Please try again.",
      fieldErrors: "fieldErrors" in data ? data.fieldErrors || {} : {},
    };
  } catch {
    return {
      ok: false,
      message: "Cannot connect to server. Start backend and try again.",
      fieldErrors: {},
    };
  }
}

export type PublicTrackingResponse =
  | {
      ok: true;
      tracking: {
        id: string;
        routeType: string;
        status: string;
        consignmentNumber: string | null;
        trackingNotes: string | null;
        customerTrackingNote: string | null;
        courierName: string | null;
        agencyName: string | null;
        senderName: string | null;
        senderAddress: string | null;
        recipientName: string | null;
        recipientAddress: string | null;
        createdAt: string;
      };
    }
  | { ok: false; message: string };

export async function fetchPublicTracking(
  reference: string,
): Promise<PublicTrackingResponse> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/public/track/${encodeURIComponent(reference.trim())}`,
      { cache: "no-store" },
    );
    const data = (await res.json().catch(() => ({}))) as
      | PublicTrackingResponse
      | { message?: string; error?: string };
    const hasOk =
      typeof data === "object" && data !== null && "ok" in data && data.ok === true;
    if (res.ok && hasOk) return data as PublicTrackingResponse;
    const message =
      typeof data === "object" && data !== null
        ? ("message" in data && data.message) || ("error" in data && data.error)
        : undefined;
    return {
      ok: false,
      message: message || "Tracking not found for this reference.",
    };
  } catch {
    return {
      ok: false,
      message: "Cannot connect to server. Start backend and try again.",
    };
  }
}

export type SiteSettings = {
  announcementEnabled: boolean;
  announcementText: string;
  announcementCtaLabel: string;
  announcementCtaHref: string;
  pdfCompanyName: string;
  pdfCompanyAddress: string;
  pdfLogoText: string;
  pdfPrimaryColor: string;
  pdfAccentColor: string;
  pdfCardColor: string;
  pdfHeaderSubtitle: string;
  pdfSupportEmail: string;
  pdfSupportPhone: string;
  pdfWebsite: string;
  pdfWatermarkText: string;
  pdfFooterNote: string;
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/site-settings`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        announcementEnabled: false,
        announcementText: "",
        announcementCtaLabel: "",
        announcementCtaHref: "",
        pdfCompanyName: "Quadrato Cargo",
        pdfCompanyAddress: "",
        pdfLogoText: "QR",
        pdfPrimaryColor: "#0f766e",
        pdfAccentColor: "#f97316",
        pdfCardColor: "#f8fafc",
        pdfHeaderSubtitle: "International courier service",
        pdfSupportEmail: "support@quadratocargo.com",
        pdfSupportPhone: "+1 (555) 010-0199",
        pdfWebsite: "https://quadratocargo.com",
        pdfWatermarkText: "Quadrato Cargo",
        pdfFooterNote: "Thank you for choosing Quadrato Cargo.",
      };
    }
    const data = (await res.json()) as { ok?: boolean; settings?: SiteSettings };
    return (
      data.settings || {
        announcementEnabled: false,
        announcementText: "",
        announcementCtaLabel: "",
        announcementCtaHref: "",
        pdfCompanyName: "Quadrato Cargo",
        pdfCompanyAddress: "",
        pdfLogoText: "QR",
        pdfPrimaryColor: "#0f766e",
        pdfAccentColor: "#f97316",
        pdfCardColor: "#f8fafc",
        pdfHeaderSubtitle: "International courier service",
        pdfSupportEmail: "support@quadratocargo.com",
        pdfSupportPhone: "+1 (555) 010-0199",
        pdfWebsite: "https://quadratocargo.com",
        pdfWatermarkText: "Quadrato Cargo",
        pdfFooterNote: "Thank you for choosing Quadrato Cargo.",
      }
    );
  } catch {
    return {
      announcementEnabled: false,
      announcementText: "",
      announcementCtaLabel: "",
      announcementCtaHref: "",
      pdfCompanyName: "Quadrato Cargo",
      pdfCompanyAddress: "",
      pdfLogoText: "QR",
      pdfPrimaryColor: "#0f766e",
      pdfAccentColor: "#f97316",
      pdfCardColor: "#f8fafc",
      pdfHeaderSubtitle: "International courier service",
      pdfSupportEmail: "support@quadratocargo.com",
      pdfSupportPhone: "+1 (555) 010-0199",
      pdfWebsite: "https://quadratocargo.com",
      pdfWatermarkText: "Quadrato Cargo",
      pdfFooterNote: "Thank you for choosing Quadrato Cargo.",
    };
  }
}
