"use client";

import { useActionState } from "react";
import { type AdminSiteSettings } from "@/lib/api/admin-server";
import { type DataManageState, updateSiteSettingsAdmin } from "../dashboard/actions";

type Props = {
  initialSettings: AdminSiteSettings;
};

export function AdminSiteSettingsForm({ initialSettings }: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateSiteSettingsAdmin, undefined);

  return (
    <section className="rounded-2xl border border-border-strong bg-surface-elevated/40 p-6">
      <h2 className="font-display text-lg font-semibold">Website announcement bar</h2>
      <p className="mt-2 text-sm text-muted">
        Control live banner + customer PDF receipt style.
      </p>

      <form action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="announcementEnabled"
            type="checkbox"
            defaultChecked={initialSettings.announcementEnabled}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Enable announcement bar
        </label>

        <div className="md:col-span-2">
          <label
            htmlFor="announcement-text"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Announcement text
          </label>
          <input
            id="announcement-text"
            name="announcementText"
            type="text"
            defaultValue={initialSettings.announcementText}
            placeholder="e.g. New lane now open for same-day dispatch"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="announcement-cta-label"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Button label
          </label>
          <input
            id="announcement-cta-label"
            name="announcementCtaLabel"
            type="text"
            defaultValue={initialSettings.announcementCtaLabel}
            placeholder="Track now"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="announcement-cta-href"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Button link
          </label>
          <input
            id="announcement-cta-href"
            name="announcementCtaHref"
            type="text"
            defaultValue={initialSettings.announcementCtaHref}
            placeholder="/public/tsking"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div className="mt-2 border-t border-border-strong pt-5 md:col-span-2">
          <h3 className="font-display text-base font-semibold text-ink">
            Customer PDF receipt template
          </h3>
          <p className="mt-1 text-sm text-muted">
            These values appear when users download booking details PDF.
          </p>
        </div>

        <div>
          <label
            htmlFor="pdf-company-name"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Company name
          </label>
          <input
            id="pdf-company-name"
            name="pdfCompanyName"
            type="text"
            defaultValue={initialSettings.pdfCompanyName}
            placeholder="Quadrato Cargo"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-logo-text"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Logo text
          </label>
          <input
            id="pdf-logo-text"
            name="pdfLogoText"
            type="text"
            defaultValue={initialSettings.pdfLogoText}
            placeholder="QR"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="pdf-company-address"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Company address
          </label>
          <input
            id="pdf-company-address"
            name="pdfCompanyAddress"
            type="text"
            defaultValue={initialSettings.pdfCompanyAddress}
            placeholder="Company address line"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-primary-color"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Primary color
          </label>
          <input
            id="pdf-primary-color"
            name="pdfPrimaryColor"
            type="text"
            defaultValue={initialSettings.pdfPrimaryColor}
            placeholder="#0f766e"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-accent-color"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Accent color
          </label>
          <input
            id="pdf-accent-color"
            name="pdfAccentColor"
            type="text"
            defaultValue={initialSettings.pdfAccentColor}
            placeholder="#f97316"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="pdf-card-color"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Card background color
          </label>
          <input
            id="pdf-card-color"
            name="pdfCardColor"
            type="text"
            defaultValue={initialSettings.pdfCardColor}
            placeholder="#f8fafc"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="pdf-header-subtitle"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Header subtitle
          </label>
          <input
            id="pdf-header-subtitle"
            name="pdfHeaderSubtitle"
            type="text"
            defaultValue={initialSettings.pdfHeaderSubtitle}
            placeholder="International courier service"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-support-email"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Support email
          </label>
          <input
            id="pdf-support-email"
            name="pdfSupportEmail"
            type="text"
            defaultValue={initialSettings.pdfSupportEmail}
            placeholder="support@quadratocargo.com"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-support-phone"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Support phone
          </label>
          <input
            id="pdf-support-phone"
            name="pdfSupportPhone"
            type="text"
            defaultValue={initialSettings.pdfSupportPhone}
            placeholder="+1 (555) 010-0199"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-website"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Website
          </label>
          <input
            id="pdf-website"
            name="pdfWebsite"
            type="text"
            defaultValue={initialSettings.pdfWebsite}
            placeholder="https://quadratocargo.com"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-watermark-text"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Watermark text
          </label>
          <input
            id="pdf-watermark-text"
            name="pdfWatermarkText"
            type="text"
            defaultValue={initialSettings.pdfWatermarkText}
            placeholder="Quadrato Cargo"
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="pdf-footer-note"
            className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
          >
            Footer note
          </label>
          <input
            id="pdf-footer-note"
            name="pdfFooterNote"
            type="text"
            defaultValue={initialSettings.pdfFooterNote}
            placeholder="Thank you for choosing Quadrato Cargo."
            className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        </div>

        <div className="mt-2 border-t border-border-strong pt-5 md:col-span-2">
          <h3 className="font-display text-base font-semibold text-ink">
            Public tracking page (/track)
          </h3>
          <p className="mt-1 text-sm text-muted">
            Choose what customers see after they enter a booking or tracking ID. Uncheck to hide.
            Booking-level updates (status, public note) still apply; this only controls layout and
            extra sections.
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowStatusBadge"
            type="checkbox"
            defaultChecked={initialSettings.trackShowStatusBadge}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show status pill (e.g. In transit, Delivered)
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowRouteAndDates"
            type="checkbox"
            defaultChecked={initialSettings.trackShowRouteAndDates}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show route, created date, last updated, and international EDD
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowOperationalLog"
            type="checkbox"
            defaultChecked={initialSettings.trackShowOperationalLog}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show operational activity log (when it differs from the public note)
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowAssignmentSection"
            type="checkbox"
            defaultChecked={initialSettings.trackShowAssignmentSection}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show assignment block (barcode, courier, agency, pickup &amp; delivery addresses)
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowShipmentCard"
            type="checkbox"
            defaultChecked={initialSettings.trackShowShipmentCard}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show shipment details card (weight, dimensions, declared value, contents)
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowTimeline"
            type="checkbox"
            defaultChecked={initialSettings.trackShowTimeline}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show shipment timeline (stages / progress)
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowPdfButton"
            type="checkbox"
            defaultChecked={initialSettings.trackShowPdfButton}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show “Download PDF” on the latest timeline step (when timeline is on)
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowInternationalHelp"
            type="checkbox"
            defaultChecked={initialSettings.trackShowInternationalHelp}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show international “common delays &amp; customs” help panel
        </label>
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input
            name="trackShowOnHoldBanner"
            type="checkbox"
            defaultChecked={initialSettings.trackShowOnHoldBanner}
            className="h-4 w-4 rounded border-border-strong bg-canvas/50 text-teal focus:ring-teal/30"
          />
          Show on-hold notice for international shipments
        </label>

        {state?.ok === false ? (
          <p className="text-sm text-rose-400 md:col-span-2" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <p className="text-sm text-teal md:col-span-2" role="status">
            {state.message}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save website settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
