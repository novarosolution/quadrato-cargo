import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
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
  const canDownloadPdf = Boolean(pickupOtp?.verifiedAt);
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

  return (
    <div>
      <section className="border-b border-border py-8 sm:py-10">
        <Container className="max-w-2xl">
          <Link
            href="/public/profile"
            className="text-sm text-teal hover:underline"
          >
            ← Back to profile
          </Link>
          <h1 className="mt-4 font-display text-2xl font-semibold capitalize tracking-tight text-ink sm:text-3xl">
            {row.routeType} shipment
          </h1>
          <p className="mt-2 text-sm text-muted-soft">
            Booked {dateFmt.format(row.createdAt)}
          </p>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container className="max-w-2xl space-y-8">
          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-md sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
              Status
            </h2>
            <p className="mt-2 inline-flex rounded-full bg-teal-dim px-3 py-1 text-sm font-semibold text-teal">
              {BOOKING_STATUS_LABELS[st]}
            </p>
            <p className="mt-3 text-xs text-muted-soft">
              Last update: {dateFmt.format(row.updatedAt)}
            </p>
            {row.consignmentNumber ? (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
                  Consignment number
                </h3>
                <p className="mt-1 font-mono text-lg font-medium text-ink">
                  {row.consignmentNumber}
                </p>
              </div>
            ) : null}
            <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
              <p>
                <span className="font-semibold text-ink">Pickup courier:</span>{" "}
                {row.courierName || "Pending assignment"}
              </p>
              <p>
                <span className="font-semibold text-ink">Agency:</span>{" "}
                {row.assignedAgency || "Pending assignment"}
              </p>
              <p>
                <span className="font-semibold text-ink">Pickup address:</span>{" "}
                {row.senderAddress || "-"}
              </p>
              <p>
                <span className="font-semibold text-ink">Delivery address:</span>{" "}
                {row.recipientAddress || "-"}
              </p>
            </div>
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
                No public tracking notes yet. When dispatch adds updates or a
                consignment number, they will show here.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-md sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink">
              Shipment summary (all booking details)
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
              {preview.declaredValue ? (
                <div>
                  <dt className="text-muted-soft">Declared value</dt>
                  <dd className="mt-0.5 text-ink">{preview.declaredValue}</dd>
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
            <p className="mt-6 text-xs text-muted-soft">
              Reference ID:{" "}
              <span className="font-mono text-muted">{row.id}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-md sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink">
              Delivery receipt (QR status slip)
            </h2>
            <p className="mt-2 text-sm text-muted">
              Scan this QR to open tracking directly. This supports your
              QR-oriented receipt flow.
            </p>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
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
                {canDownloadPdf ? (
                  <>
                    <DownloadBookingPdfButton
                      template="invoice"
                      buttonLabel="Download Invoice PDF"
                      bookingId={row.id}
                      bookingDateLabel={dateFmt.format(row.createdAt)}
                      updatedAtLabel={dateFmt.format(row.updatedAt)}
                      statusLabel={BOOKING_STATUS_LABELS[st]}
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
                    <DownloadBookingPdfButton
                      template="tracking"
                      buttonLabel="Download Tracking PDF"
                      bookingId={row.id}
                      bookingDateLabel={dateFmt.format(row.createdAt)}
                      updatedAtLabel={dateFmt.format(row.updatedAt)}
                      statusLabel={BOOKING_STATUS_LABELS[st]}
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
                  </>
                ) : (
                  <p className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-xs text-muted-soft">
                    Invoice/Tracking PDF download unlocks after courier pickup OTP verification.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-6 backdrop-blur-md sm:p-8">
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
          </div>

          <Link
            href="/public/book"
            className="btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-accent-deep via-accent to-accent-hover px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 sm:w-auto"
          >
            Book another courier
          </Link>
        </Container>
      </section>
    </div>
  );
}
