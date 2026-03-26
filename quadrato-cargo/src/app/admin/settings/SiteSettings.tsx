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
        Control a live banner visible to all site visitors.
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
