"use client";

import { useActionState } from "react";
import {
  updateContactSubmissionAdmin,
  type DataManageState,
} from "../dashboard/actions";

type Props = {
  contactId: string;
  initial: {
    name: string;
    email: string;
    phone: string | null;
    service: string;
    message: string;
  };
};

export function AdminContactEditForm({ contactId, initial }: Props) {
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateContactSubmissionAdmin, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="contactId" value={contactId} />
      <div>
        <label
          htmlFor="admin-contact-name"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Name
        </label>
        <input
          id="admin-contact-name"
          name="name"
          type="text"
          required
          defaultValue={initial.name}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      <div>
        <label
          htmlFor="admin-contact-email"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Email
        </label>
        <input
          id="admin-contact-email"
          name="email"
          type="email"
          required
          defaultValue={initial.email}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      <div>
        <label
          htmlFor="admin-contact-phone"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Phone
        </label>
        <input
          id="admin-contact-phone"
          name="phone"
          type="text"
          defaultValue={initial.phone ?? ""}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      <div>
        <label
          htmlFor="admin-contact-service"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Service interest
        </label>
        <input
          id="admin-contact-service"
          name="service"
          type="text"
          required
          defaultValue={initial.service}
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      <div>
        <label
          htmlFor="admin-contact-message"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Message
        </label>
        <textarea
          id="admin-contact-message"
          name="message"
          rows={6}
          required
          defaultValue={initial.message}
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      {state?.ok === false && state.error ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-teal" role="status">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save contact"}
      </button>
    </form>
  );
}
