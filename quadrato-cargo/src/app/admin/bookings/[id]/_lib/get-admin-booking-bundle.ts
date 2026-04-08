import { cache } from "react";
import { notFound } from "next/navigation";
import {
  fetchAdminBookingDetail,
  fetchAdminSiteSettings,
  fetchAdminUsers,
  type AdminBooking,
  type AdminUser,
} from "@/lib/api/admin-server";
import type { BookingContactInitial } from "../../AdminBookingContactForm";
import type {
  BookingShipmentInitial,
  ShipmentParcelInitial,
} from "../../AdminBookingShipmentForm";
import type { BookingPickupInitial } from "../../AdminBookingPickupForm";
import type { InvoiceFormInitial } from "../../AdminBookingInvoiceForm";

export type AgencyOption = { email: string; name: string | null };

export type AdminBookingWithDates = Omit<AdminBooking, "createdAt"> & { createdAt: Date };

export type BookingBundle = {
  booking: AdminBookingWithDates;
  couriers: AdminUser[];
  agencyOptions: AgencyOption[];
  json: string;
  trackReference: string;
  pickupPin: string;
  contactInitial: BookingContactInitial;
  shipmentInitial: BookingShipmentInitial;
  pickupInitial: BookingPickupInitial;
  invoiceInitial: InvoiceFormInitial;
  senderAddressForTrack: string | null;
  recipientAddressForTrack: string | null;
  trackPreviewUpdatedIso: string;
  trackPreviewAgencyName: string | null;
  trackPreviewAgencyCity: string | null;
  trackPreviewDomesticHubCity: string;
  trackPreviewFromCity: string | null;
  trackPreviewToCity: string | null;
  trackPreviewSenderCountry: string | null;
  trackPreviewRecipientCountry: string | null;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

function formatSizeCmFromParcelDims(l: string, w: string, h: string): string {
  const parts = [l.trim(), w.trim(), h.trim()].filter(Boolean);
  if (parts.length === 3) return `${parts[0]} × ${parts[1]} × ${parts[2]} cm`;
  if (parts.length) return `${parts.join(" × ")} cm`;
  return "";
}

function joinAddr(...parts: string[]) {
  const s = parts.map((p) => p.trim()).filter(Boolean).join(", ");
  return s || null;
}

export const getAdminBookingBundle = cache(async (id: string): Promise<BookingBundle> => {
  const [res, agenciesRes, siteRes] = await Promise.all([
    fetchAdminBookingDetail(id),
    fetchAdminUsers({ role: "agency", page: 1 }),
    fetchAdminSiteSettings(),
  ]);
  const raw = res.booking;
  if (!raw) notFound();

  const booking: AdminBookingWithDates = {
    ...raw,
    createdAt: new Date(raw.createdAt),
  };

  const agencyOptions: AgencyOption[] = (agenciesRes.users || []).map((u) => ({
    email: u.email,
    name: u.name,
  }));

  const payload = (booking.payload && typeof booking.payload === "object"
    ? booking.payload
    : {}) as Record<string, unknown>;
  const sender = (payload.sender && typeof payload.sender === "object"
    ? payload.sender
    : {}) as Record<string, unknown>;
  const recipient = (payload.recipient && typeof payload.recipient === "object"
    ? payload.recipient
    : {}) as Record<string, unknown>;
  const shipmentRaw =
    payload.shipment && typeof payload.shipment === "object"
      ? (payload.shipment as Record<string, unknown>)
      : {};
  const dims =
    shipmentRaw.dimensionsCm && typeof shipmentRaw.dimensionsCm === "object"
      ? (shipmentRaw.dimensionsCm as Record<string, unknown>)
      : {};

  const weightFromPayload =
    typeof shipmentRaw.weightKg === "number" && Number.isFinite(shipmentRaw.weightKg)
      ? String(shipmentRaw.weightKg)
      : str(shipmentRaw.weightKg);

  const contactInitial = {
    senderName: str(sender.name),
    senderEmail: str(sender.email),
    senderPhone: str(sender.phone),
    recipientName: str(recipient.name),
    recipientEmail: str(recipient.email),
    recipientPhone: str(recipient.phone),
    recipientStreet: str(recipient.street),
    recipientCity: str(recipient.city),
    recipientState: str(recipient.state),
    recipientPostal: str(recipient.postal),
    recipientCountry: str(recipient.country),
  } satisfies BookingContactInitial;

  const parcelCountStr =
    typeof shipmentRaw.parcelCount === "number" && Number.isFinite(shipmentRaw.parcelCount)
      ? String(Math.round(shipmentRaw.parcelCount))
      : str(shipmentRaw.parcelCount) || "1";

  const pcRaw = shipmentRaw.parcelCount;
  const parcelN =
    typeof pcRaw === "number" && Number.isFinite(pcRaw)
      ? Math.round(pcRaw)
      : Number.parseInt(String(pcRaw ?? "1").trim(), 10) || 1;
  const nClamped = Math.min(25, Math.max(1, parcelN));

  const rawParcels = Array.isArray(shipmentRaw.parcels)
    ? (shipmentRaw.parcels as unknown[])
    : [];

  const toParcelRow = (o: Record<string, unknown>): ShipmentParcelInitial => {
    const d =
      o.dimensionsCm && typeof o.dimensionsCm === "object"
        ? (o.dimensionsCm as Record<string, unknown>)
        : {};
    const wk =
      typeof o.weightKg === "number" && Number.isFinite(o.weightKg)
        ? String(o.weightKg)
        : str(o.weightKg);
    return {
      contentsDescription: str(o.contentsDescription),
      weightKg: wk,
      declaredValue: str(o.declaredValue),
      dimL: str(d.l),
      dimW: str(d.w),
      dimH: str(d.h),
    };
  };

  let parcels: ShipmentParcelInitial[] = [];
  for (const pr of rawParcels) {
    if (!pr || typeof pr !== "object") continue;
    parcels.push(toParcelRow(pr as Record<string, unknown>));
  }
  if (parcels.length === 0) {
    parcels.push({
      contentsDescription: str(shipmentRaw.contentsDescription),
      weightKg: weightFromPayload,
      declaredValue: str(shipmentRaw.declaredValue),
      dimL: str(dims.l),
      dimW: str(dims.w),
      dimH: str(dims.h),
    });
  }
  while (parcels.length < nClamped) {
    parcels.push({
      contentsDescription: "",
      weightKg: "",
      declaredValue: "",
      dimL: "",
      dimW: "",
      dimH: "",
    });
  }
  parcels = parcels.slice(0, nClamped);

  const shipmentInitial = {
    parcelCount: parcelCountStr,
    parcels,
  } satisfies BookingShipmentInitial;

  const pickupPin = typeof sender.postal === "string" ? sender.postal : "";

  const pickupInitial = {
    collectionMode:
      typeof payload.collectionMode === "string" ? payload.collectionMode : "",
    pickupDate: str(payload.pickupDate),
    pickupTimeSlot: str(payload.pickupTimeSlot),
    pickupTimeSlotCustom: str(payload.pickupTimeSlotCustom),
    pickupPreference:
      typeof payload.pickupPreference === "string" ? payload.pickupPreference : "",
    instructions: str(payload.instructions),
    senderStreet: str(sender.street),
    senderCity: str(sender.city),
    senderState: str(sender.state),
    senderPostal: str(sender.postal),
    senderCountry: str(sender.country),
  } satisfies BookingPickupInitial;

  const inv =
    booking.invoice && typeof booking.invoice === "object"
      ? (booking.invoice as Record<string, unknown>)
      : {};

  const parcelLineCount = Math.min(25, Math.max(1, nClamped));

  const rawLineItems = Array.isArray(inv.lineItems) ? inv.lineItems : [];
  const savedRows: Array<{
    description: string;
    amount: string;
    weightKg: string;
    declaredValue: string;
    sizeCm: string;
  }> = [];
  for (const row of rawLineItems) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    savedRows.push({
      description: String(o.description ?? "").trim(),
      amount: String(o.amount ?? "").trim(),
      weightKg: String(o.weightKg ?? "").trim(),
      declaredValue: String(o.declaredValue ?? "").trim(),
      sizeCm: String(o.sizeCm ?? "").trim(),
    });
  }

  const rowCount = Math.min(25, Math.max(parcelLineCount, savedRows.length, 1));
  const lineItems: Array<{
    description: string;
    amount: string;
    weightKg: string;
    declaredValue: string;
    sizeCm: string;
  }> = [];
  for (let i = 0; i < rowCount; i++) {
    const saved = savedRows[i];
    const hint = parcels[i];
    const defaultDesc = i < parcelLineCount ? `Item ${i + 1}` : `Line ${i + 1}`;
    const desc = saved?.description?.trim() || defaultDesc;
    const hintW = (hint?.weightKg ?? "").trim();
    const hintSize = formatSizeCmFromParcelDims(
      str(hint?.dimL),
      str(hint?.dimW),
      str(hint?.dimH),
    );
    const hintDeclared = str(hint?.declaredValue).trim();
    lineItems.push({
      description: desc,
      amount: saved?.amount?.trim() || "",
      weightKg: saved?.weightKg?.trim() || hintW,
      declaredValue: saved?.declaredValue?.trim() || hintDeclared,
      sizeCm: saved?.sizeCm?.trim() || hintSize,
    });
  }

  const invoiceInitial = {
    number: String(inv.number ?? ""),
    currency: String(inv.currency ?? "INR"),
    subtotal: String(inv.subtotal ?? ""),
    tax: String(inv.tax ?? ""),
    customsDuties: String(inv.customsDuties ?? ""),
    insurancePremium: String(inv.insurancePremium ?? ""),
    total: String(inv.total ?? ""),
    insurance: String(inv.insurance ?? ""),
    lineDescription: String(inv.lineDescription ?? ""),
    notes: String(inv.notes ?? ""),
    lineItems,
    parcelLineCount,
  } satisfies InvoiceFormInitial;

  const trackReference =
    (booking.consignmentNumber && String(booking.consignmentNumber).trim()) ||
    (booking.publicBarcodeCode && String(booking.publicBarcodeCode).trim()) ||
    booking.id;

  const senderAddressForTrack = joinAddr(
    str(sender.street),
    str(sender.city),
    str(sender.state),
    str(sender.postal),
    str(sender.country),
  );
  const recipientAddressForTrack = joinAddr(
    str(recipient.street),
    str(recipient.city),
    str(recipient.state),
    str(recipient.postal),
    str(recipient.country),
  );

  const trackPreviewUpdatedIso = String(
    booking.customerFacingUpdatedAt ??
      (typeof booking.updatedAt === "string" ? booking.updatedAt : booking.createdAt.toISOString()),
  );

  const assignRaw = String(booking.assignedAgency ?? "").trim();
  const assignEmail = assignRaw.toLowerCase();
  const agencyMatch = (agenciesRes.users || []).find(
    (u) => u.email.toLowerCase() === assignEmail,
  );
  const trackPreviewAgencyName = agencyMatch?.name?.trim() || assignRaw || null;
  const trackPreviewAgencyCity = agencyMatch?.agencyCity?.trim() || null;
  const siteOk = siteRes.ok && siteRes.settings;
  const trackPreviewDomesticHubCity =
    (siteOk && siteRes.settings.domesticMainHubCity?.trim()) || "Quadrato Cargo";
  const trackPreviewFromCity = str(sender.city) || null;
  const trackPreviewToCity = str(recipient.city) || null;
  const trackPreviewSenderCountry = str(sender.country) || null;
  const trackPreviewRecipientCountry = str(recipient.country) || null;

  return {
    booking,
    couriers: res.couriers || [],
    agencyOptions,
    json: JSON.stringify(booking.payload, null, 2),
    trackReference,
    pickupPin,
    contactInitial,
    shipmentInitial,
    pickupInitial,
    invoiceInitial,
    senderAddressForTrack,
    recipientAddressForTrack,
    trackPreviewUpdatedIso,
    trackPreviewAgencyName,
    trackPreviewAgencyCity,
    trackPreviewDomesticHubCity,
    trackPreviewFromCity,
    trackPreviewToCity,
    trackPreviewSenderCountry,
    trackPreviewRecipientCountry,
  };
});
