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
