/**
 * Public backend client (no auth required).
 */
import { getApiBaseUrl } from "@/lib/api/base-url";
import { csrfHeaderRecord } from "@/lib/api/csrf-headers";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

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
      headers: { ...JSON_HEADERS, ...csrfHeaderRecord() },
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

/** Admin-editable copy for one professional timeline card (by stage index string "0"…"11" intl / "0"…"4" domestic). */
export type PublicTimelineStageOverride = {
  title?: string;
  location?: string;
  hint?: string;
  /** ISO datetime shown on the card instead of booking last-updated when set. */
  shownAt?: string;
};

export type PublicTimelineOverrides = {
  domestic?: Record<string, PublicTimelineStageOverride>;
  international?: Record<string, PublicTimelineStageOverride>;
};

/** Which professional timeline steps appear on public Track; only `false` is stored (hidden). */
export type PublicTimelineStepVisibility = {
  domestic?: Record<string, boolean>;
  international?: Record<string, boolean>;
};

export type PublicTrackingShipment = {
  contentsDescription: string | null;
  weightKg: number | null;
  declaredValue: string | null;
  dimensionsCm: { l: string | null; w: string | null; h: string | null } | null;
};

/** What customers see on /public/tsking (from admin site settings). */
export type PublicTrackUiSettings = {
  showStatusBadge: boolean;
  showRouteAndDates: boolean;
  showOperationalLog: boolean;
  showAssignmentSection: boolean;
  showShipmentCard: boolean;
  showTimeline: boolean;
  showInternationalHelp: boolean;
  showOnHoldBanner: boolean;
};

export const DEFAULT_PUBLIC_TRACK_UI: PublicTrackUiSettings = {
  showStatusBadge: true,
  showRouteAndDates: true,
  showOperationalLog: true,
  showAssignmentSection: true,
  showShipmentCard: true,
  showTimeline: true,
  showInternationalHelp: true,
  showOnHoldBanner: true,
};

export function mergePublicTrackUi(
  partial?: Partial<PublicTrackUiSettings> | null,
): PublicTrackUiSettings {
  return { ...DEFAULT_PUBLIC_TRACK_UI, ...partial };
}

export type PublicTrackingResponse =
  | {
      ok: true;
      trackUi?: Partial<PublicTrackUiSettings> | null;
      tracking: {
        id: string;
        routeType: string;
        status: string;
        consignmentNumber: string | null;
        publicBarcodeCode?: string | null;
        trackingNotes: string | null;
        publicTrackingNote?: string | null;
        customerTrackingNote: string | null;
        courierName: string | null;
        agencyName: string | null;
        senderName: string | null;
        senderAddress: string | null;
        recipientName: string | null;
        recipientAddress: string | null;
        createdAt: string;
        /** Last booking row change (status, notes, assignment, etc.). Present when API returns it. */
        updatedAt?: string;
        shipment: PublicTrackingShipment | null;
        publicTimelineOverrides?: PublicTimelineOverrides | null;
        /** Hidden steps are `false`; current status step is always shown regardless. */
        publicTimelineStepVisibility?: PublicTimelineStepVisibility | null;
        /** Admin-set EDD (ISO); international track still falls back to +10d from created if unset. */
        estimatedDeliveryAt?: string | null;
        /** Status history for progressive timeline; omit/null = show full milestone ladder (legacy). */
        publicTimelineStatusPath?: string[] | null;
        /** International: 0–11 = current macro card when set; else derived from status. */
        internationalAgencyStage?: number | null;
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
  /** Optional embed src from Google Maps Share → Embed (https://www.google.com/maps/embed?…). */
  googleMapsEmbedSrc: string;
  pdfLogoText: string;
  pdfPrimaryColor: string;
  pdfAccentColor: string;
  pdfCardColor: string;
  pdfHeaderSubtitle: string;
  pdfSupportEmail: string;
  pdfSupportPhone: string;
  /** Optional extra footer mailto (e.g. info@); primary public email is pdfSupportEmail. */
  publicInfoEmail: string;
  pdfWebsite: string;
  pdfWatermarkText: string;
  pdfFooterNote: string;
  trackShowStatusBadge: boolean;
  trackShowRouteAndDates: boolean;
  trackShowOperationalLog: boolean;
  trackShowAssignmentSection: boolean;
  trackShowShipmentCard: boolean;
  trackShowTimeline: boolean;
  trackShowInternationalHelp: boolean;
  trackShowOnHoldBanner: boolean;
};

const SITE_SETTINGS_FALLBACK: SiteSettings = {
  announcementEnabled: false,
  announcementText: "",
  announcementCtaLabel: "",
  announcementCtaHref: "",
  pdfCompanyName: "Quadrato Cargo",
  pdfCompanyAddress: "",
  googleMapsEmbedSrc: "",
  pdfLogoText: "QR",
  pdfPrimaryColor: "#0f766e",
  pdfAccentColor: "#f97316",
  pdfCardColor: "#f8fafc",
  pdfHeaderSubtitle: "International courier service",
  pdfSupportEmail: "support@quadratocargo.com",
  pdfSupportPhone: "+1 (555) 010-0199",
  publicInfoEmail: "",
  pdfWebsite: "https://quadratocargo.com",
  pdfWatermarkText: "Quadrato Cargo",
  pdfFooterNote: "Thank you for choosing Quadrato Cargo.",
  trackShowStatusBadge: true,
  trackShowRouteAndDates: true,
  trackShowOperationalLog: true,
  trackShowAssignmentSection: true,
  trackShowShipmentCard: true,
  trackShowTimeline: true,
  trackShowInternationalHelp: true,
  trackShowOnHoldBanner: true,
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const isBrowser = typeof window !== "undefined";
    const res = await fetch(`${getApiBaseUrl()}/api/public/site-settings`, {
      ...(isBrowser ? { cache: "no-store" as RequestCache } : { next: { revalidate: 30 } }),
    });
    if (!res.ok) {
      return { ...SITE_SETTINGS_FALLBACK };
    }
    const data = (await res.json()) as { ok?: boolean; settings?: SiteSettings };
    return data.settings ? { ...SITE_SETTINGS_FALLBACK, ...data.settings } : { ...SITE_SETTINGS_FALLBACK };
  } catch {
    return { ...SITE_SETTINGS_FALLBACK };
  }
}
