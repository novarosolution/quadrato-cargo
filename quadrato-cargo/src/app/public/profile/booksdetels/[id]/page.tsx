import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { PublicCard } from "@/components/public/PublicCard";
import { AppSurfacePageHeader } from "@/components/layout/AppPageHeader";
import { Container } from "@/components/Wrap";
import {
  BOOKING_STATUS_LABELS,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import { payloadPreview } from "@/lib/booking-payload-preview";
import {
  fetchProfileBookingDetailServer,
  fetchProfileBookingPickupOtpServer,
} from "@/lib/api/profile-client";
import { fetchSiteSettings } from "@/lib/api/public-client";
import { getSiteUrl } from "@/lib/site";
import {
  formatEddDisplay,
  resolveEstimatedDeliveryDate,
} from "@/lib/estimated-delivery";
import { CalendarDays } from "lucide-react";
import { DownloadBookingPdfButton } from "./DownloadBookingPdfButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "full",
  timeStyle: "short",
});

export default async function ProfileBookingDetailPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    redirect(`/public/login?callbackUrl=/public/profile/booksdetels/${id}`);
  }

  const cookieHeader = (await cookies()).toString();
  const [bookingRes, otpRes, siteSettings] = await Promise.all([
    fetchProfileBookingDetailServer(cookieHeader, id),
    fetchProfileBookingPickupOtpServer(cookieHeader, id),
    fetchSiteSettings(),
  ]);
  const row = bookingRes.ok
    ? {
        ...bookingRes.data.booking,
        createdAt: new Date(bookingRes.data.booking.createdAt),
        updatedAt: new Date(
          bookingRes.data.booking.updatedAt ||
            bookingRes.data.booking.createdAt,
        ),
      }
    : null;

  if (!row) notFound();

  const st = normalizeBookingStatus(row.status);
  const preview = payloadPreview(row.payload);
  const reference = row.consignmentNumber || row.id;
  const trackUrl = `${getSiteUrl()}/public/tsking?reference=${encodeURIComponent(reference)}`;
  const qrDataUrl = await QRCode.toDataURL(trackUrl, {
    margin: 1,
    width: 220
  }).catch(() => null);
  const pickupOtp = otpRes.ok ? otpRes.data.pickupOtp : null;
  const pickupVerified = Boolean(pickupOtp?.verifiedAt);
  const allowInvoicePdf = row.invoicePdfReady !== false;
  const canDownloadInvoicePdf = pickupVerified && allowInvoicePdf;
  const pdfSettings = {
    companyName: siteSettings.pdfCompanyName || "Quadrato Cargo",
    companyAddress: siteSettings.pdfCompanyAddress || "",
    logoText: siteSettings.pdfLogoText || "QR",
    primaryColor: siteSettings.pdfPrimaryColor || "#0f766e",
    accentColor: siteSettings.pdfAccentColor || "#f97316",
    cardColor: siteSettings.pdfCardColor || "#f8fafc",
    headerSubtitle:
      siteSettings.pdfHeaderSubtitle || "International courier service",
    supportEmail: siteSettings.pdfSupportEmail || "support@quadratocargo.com",
    supportPhone: siteSettings.pdfSupportPhone || "+1 (555) 010-0199",
    website: siteSettings.pdfWebsite || "https://quadratocargo.com",
    watermarkText: siteSettings.pdfWatermarkText || "Quadrato Cargo",
    footerNote:
      siteSettings.pdfFooterNote || "Thank you for choosing Quadrato Cargo.",
  };

  const routeLabel = row.routeType === "international" ? "International" : "Domestic";

  const inv = row.invoice && typeof row.invoice === "object" ? row.invoice : null;

  const profileEdd = resolveEstimatedDeliveryDate({
    routeType: row.routeType,
    createdAtIso: row.createdAt.toISOString(),
    estimatedDeliveryAt:
      typeof row.estimatedDeliveryAt === "string" ? row.estimatedDeliveryAt : null,
  });

  return (
    <div className="stack-page content-full">
      <section className="border-b border-border py-8 sm:py-10">
        <Container className="max-w-2xl">
          <Link
            href="/public/profile"
            className="text-sm text-teal hover:underline"
          >
            ← Back to profile
          </Link>
          <div className="mt-4">
            <AppSurfacePageHeader
              title={`${routeLabel} shipment`}
              description={`Booked ${dateFmt.format(row.createdAt)}`}
            />
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container className="max-w-2xl stack-page gap-8 max-sm:gap-6">
          <PublicCard className="sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
              Status
            </h2>
            <p className="mt-2 inline-flex rounded-full bg-teal-dim px-3 py-1 text-sm font-semibold text-teal">
              {BOOKING_STATUS_LABELS[st]}
            </p>
            <p className="mt-3 text-xs text-muted-soft">
              Last update: {dateFmt.format(row.updatedAt)}
            </p>
            {profileEdd ? (
              <div className="mt-5 rounded-xl border border-teal/25 bg-linear-to-br from-teal/10 to-canvas/60 px-4 py-3 ring-1 ring-teal/10 dark:from-teal/15">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 size-5 shrink-0 text-teal"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-soft">
                      Est. delivery (EDD)
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-ink">
                      {formatEddDisplay(profileEdd)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-soft">
                      {row.estimatedDeliveryAt
                        ? "Set by dispatch for this shipment."
                        : row.routeType === "international"
                          ? "Indicative estimate; may change as your parcel moves."
                          : null}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {row.consignmentNumber ? (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
                  Tracking ID
                </h3>
                <p className="mt-1 font-mono text-lg font-medium text-ink">
                  {row.consignmentNumber}
                </p>
              </div>
            ) : null}
            {row.customerTrackingNote ? (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
                  Updates from dispatch
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {row.customerTrackingNote}
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                No updates from dispatch yet. When there is news or a Tracking ID,
                it will appear here.
              </p>
            )}
          </PublicCard>

          <PublicCard className="sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink">
              Shipment summary
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              {preview.collectionMode ? (
                <div>
                  <dt className="text-muted-soft">Collection mode</dt>
                  <dd className="mt-0.5 font-medium capitalize text-ink">
                    {preview.collectionMode}
                  </dd>
                </div>
              ) : null}
              {preview.pickupPreference ? (
                <div>
                  <dt className="text-muted-soft">Pickup window / preference</dt>
                  <dd className="mt-0.5 text-ink">{preview.pickupPreference}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-soft">Pickup courier</dt>
                <dd className="mt-0.5 text-ink">{row.courierName || "Pending assignment"}</dd>
              </div>
              <div>
                <dt className="text-muted-soft">Agency</dt>
                <dd className="mt-0.5 text-ink">{row.assignedAgency || "Pending assignment"}</dd>
              </div>
              {preview.senderName ? (
                <div>
                  <dt className="text-muted-soft">Sender</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {preview.senderName}
                  </dd>
                  <dd className="mt-0.5 text-muted">
                    {[preview.senderStreet, preview.senderCity, preview.senderPostal, preview.senderCountry]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
              ) : null}
              {preview.recipientName ? (
                <div>
                  <dt className="text-muted-soft">Recipient</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {preview.recipientName}
                  </dd>
                  <dd className="mt-0.5 text-muted">
                    {[preview.recipientStreet, preview.recipientCity, preview.recipientPostal, preview.recipientCountry]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
              ) : null}
              {preview.contents ? (
                <div>
                  <dt className="text-muted-soft">Contents</dt>
                  <dd className="mt-0.5 text-ink">{preview.contents}</dd>
                </div>
              ) : null}
              {preview.weightKg != null ? (
                <div>
                  <dt className="text-muted-soft">Weight</dt>
                  <dd className="mt-0.5 text-ink">{preview.weightKg} kg</dd>
                </div>
              ) : null}
              {preview.dimensionsCm ? (
                <div>
                  <dt className="text-muted-soft">Dimensions (cm)</dt>
                  <dd className="mt-0.5 text-ink">
                    {preview.dimensionsCm.l || "?"} x {preview.dimensionsCm.w || "?"} x {preview.dimensionsCm.h || "?"}
                  </dd>
                </div>
              ) : null}
              {preview.instructions ? (
                <div>
                  <dt className="text-muted-soft">Special instructions</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-ink">{preview.instructions}</dd>
                </div>
              ) : null}
            </dl>
            <details className="mt-6 border-t border-border pt-4">
              <summary className="cursor-pointer text-sm font-medium text-teal hover:underline">
                Technical reference
              </summary>
              <p className="mt-3 break-all font-mono text-xs text-muted-soft">{row.id}</p>
              <p className="mt-2 text-xs text-muted-soft">
                For support only — use Tracking ID or QC code when contacting us.
              </p>
            </details>
          </PublicCard>

          <PublicCard className="sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink">Downloads</h2>
            <p className="mt-2 text-sm text-muted">
              A6 · 105 × 148 mm for both PDFs. Scan the QR to open tracking.
            </p>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt={`Tracking QR for ${reference}`}
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-xl border border-border bg-white p-2"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-border bg-canvas/40 text-xs text-muted-soft">
                  QR unavailable
                </div>
              )}
              <div className="space-y-2 text-sm">
                <p className="text-muted-soft">Reference</p>
                <p className="font-mono text-ink">{reference}</p>
                <Link
                  href={`/public/tsking?reference=${encodeURIComponent(reference)}`}
                  className="inline-flex rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
                >
                  Open tracking page
                </Link>
                {!pickupVerified ? (
                  <p className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-xs text-muted-soft">
                    Available after pickup OTP is verified.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 [&_button]:min-h-10 [&_button]:w-full [&_button]:sm:w-auto [&_button]:sm:min-w-[10.5rem]">
                    <DownloadBookingPdfButton
                      template="tracking"
                      buttonLabel="Download tracking"
                      bookingId={row.id}
                      bookingDateLabel={dateFmt.format(row.createdAt)}
                      updatedAtLabel={dateFmt.format(row.updatedAt)}
                      reference={reference}
                      routeTypeLabel={row.routeType || "-"}
                      consignmentNumber={row.consignmentNumber || "-"}
                      fromCity={preview.senderCity || "-"}
                      toCity={preview.recipientCity || "-"}
                      senderName={preview.senderName || "-"}
                      senderAddress={
                        [
                          preview.senderStreet,
                          preview.senderCity,
                          preview.senderPostal,
                          preview.senderCountry,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"
                      }
                      senderPhone={preview.senderPhone || "-"}
                      senderEmail={preview.senderEmail || "-"}
                      recipientName={preview.recipientName || "-"}
                      recipientAddress={
                        [
                          preview.recipientStreet,
                          preview.recipientCity,
                          preview.recipientPostal,
                          preview.recipientCountry,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"
                      }
                      recipientPhone={preview.recipientPhone || "-"}
                      recipientEmail={preview.recipientEmail || "-"}
                      amountLabel={preview.declaredValue || "-"}
                      weightLabel={preview.weightKg ? `${preview.weightKg} kg` : "-"}
                      dimensionsLabel={
                        preview.dimensionsCm
                          ? `${preview.dimensionsCm.l || "?"} x ${preview.dimensionsCm.w || "?"} x ${preview.dimensionsCm.h || "?"} cm`
                          : "-"
                      }
                      contentsLabel={preview.contents || "-"}
                      instructionsLabel={preview.instructions || "-"}
                      trackingNotesLabel={row.customerTrackingNote || "-"}
                      agencyLabel={row.assignedAgency || "-"}
                      courierNameLabel={row.courierName || "-"}
                      trackUrl={trackUrl}
                      settings={pdfSettings}
                    />
                    {canDownloadInvoicePdf ? (
                    <DownloadBookingPdfButton
                      template="invoice"
                      buttonLabel="Download invoice"
                      bookingId={row.id}
                      invoiceDetails={
                        inv
                          ? {
                              number: inv.number ?? null,
                              currency: inv.currency ?? null,
                              subtotal: inv.subtotal ?? null,
                              tax: inv.tax ?? null,
                              insurance: inv.insurance ?? null,
                              customsDuties: inv.customsDuties ?? null,
                              discount: inv.discount ?? null,
                              total: inv.total ?? null,
                              lineDescription: inv.lineDescription ?? null,
                              notes: inv.notes ?? null,
                            }
                          : null
                      }
                      bookingDateLabel={dateFmt.format(row.createdAt)}
                      updatedAtLabel={dateFmt.format(row.updatedAt)}
                      reference={reference}
                      routeTypeLabel={row.routeType || "-"}
                      consignmentNumber={row.consignmentNumber || "-"}
                      fromCity={preview.senderCity || "-"}
                      toCity={preview.recipientCity || "-"}
                      senderName={preview.senderName || "-"}
                      senderAddress={
                        [
                          preview.senderStreet,
                          preview.senderCity,
                          preview.senderPostal,
                          preview.senderCountry,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"
                      }
                      senderPhone={preview.senderPhone || "-"}
                      senderEmail={preview.senderEmail || "-"}
                      recipientName={preview.recipientName || "-"}
                      recipientAddress={
                        [
                          preview.recipientStreet,
                          preview.recipientCity,
                          preview.recipientPostal,
                          preview.recipientCountry,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"
                      }
                      recipientPhone={preview.recipientPhone || "-"}
                      recipientEmail={preview.recipientEmail || "-"}
                      amountLabel={preview.declaredValue || "-"}
                      weightLabel={preview.weightKg ? `${preview.weightKg} kg` : "-"}
                      dimensionsLabel={
                        preview.dimensionsCm
                          ? `${preview.dimensionsCm.l || "?"} x ${preview.dimensionsCm.w || "?"} x ${preview.dimensionsCm.h || "?"} cm`
                          : "-"
                      }
                      contentsLabel={preview.contents || "-"}
                      instructionsLabel={preview.instructions || "-"}
                      trackingNotesLabel={row.customerTrackingNote || "-"}
                      agencyLabel={row.assignedAgency || "-"}
                      courierNameLabel={row.courierName || "-"}
                      trackUrl={trackUrl}
                      settings={pdfSettings}
                    />
                    ) : (
                      <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-200">
                        Invoice is turned off for this booking. Ask support if you need a bill.
                      </p>
                    )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </PublicCard>

          <PublicCard className="sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink">
              Pickup OTP (share only at pickup)
            </h2>
            {pickupOtp?.verifiedAt ? (
              <p className="mt-3 text-sm text-teal">
                OTP verified on {dateFmt.format(new Date(pickupOtp.verifiedAt))}. Shipment is confirmed as picked up.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted">
                  Give this OTP to courier boy during pickup. When courier enters
                  it, status is automatically updated to picked up.
                </p>
                <p className="mt-4 inline-flex rounded-xl border border-border-strong bg-canvas/40 px-4 py-2 font-mono text-lg font-semibold tracking-[0.2em] text-ink">
                  {pickupOtp?.code ?? "------"}
                </p>
                {pickupOtp?.expiresAt ? (
                  <p className="mt-2 text-xs text-muted-soft">
                    Expires on {dateFmt.format(new Date(pickupOtp.expiresAt))}
                  </p>
                ) : null}
              </>
            )}
          </PublicCard>

          <Link
            href="/public/book"
            className="btn-primary inline-flex w-full items-center justify-center rounded-2xl border border-teal/70 bg-teal px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/25 sm:w-auto"
          >
            Book another courier
          </Link>
        </Container>
      </section>
    </div>
  );
}
