"use client";

import { useActionState, useState } from "react";
import {
  updateBookingInvoiceAdmin,
  type DataManageState,
} from "../dashboard/actions";

export type InvoiceFormInitial = {
  number: string;
  currency: string;
  subtotal: string;
  tax: string;
  insurance: string;
  customsDuties: string;
  discount: string;
  total: string;
  lineDescription: string;
  notes: string;
};

type Props = {
  bookingId: string;
  allowCustomerInvoicePdf: boolean;
  initial: InvoiceFormInitial;
};

export function AdminBookingInvoiceForm({
  bookingId,
  allowCustomerInvoicePdf,
  initial,
}: Props) {
  const [allowPdf, setAllowPdf] = useState(allowCustomerInvoicePdf);
  const [state, formAction, pending] = useActionState<
    DataManageState | undefined,
    FormData
  >(updateBookingInvoiceAdmin, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-canvas/30 p-3">
        <input type="hidden" name="invoicePdfReady" value={allowPdf ? "on" : "off"} />
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={allowPdf}
            onChange={(e) => setAllowPdf(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-ink">Allow customer invoice PDF</span>
            <span className="mt-0.5 block text-xs text-muted-soft">
              When enabled, the account holder can download the invoice PDF after pickup OTP
              is verified. Amounts below are merged into that PDF (by booking ID).
            </span>
          </span>
        </label>
      </div>
      <p className="text-xs text-muted-soft">
        Leave fields blank to fall back to booking declared value and contents on the PDF.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted-soft">
          Invoice number (optional)
          <input
            name="invoiceNumber"
            type="text"
            defaultValue={initial.number}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            placeholder="e.g. INV-2026-0042"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs font-medium text-muted-soft">
          Currency
          <input
            name="invoiceCurrency"
            type="text"
            defaultValue={initial.currency}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            placeholder="INR"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs font-medium text-muted-soft">
          Subtotal
          <input
            name="invoiceSubtotal"
            type="text"
            defaultValue={initial.subtotal}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            placeholder="e.g. 4500"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs font-medium text-muted-soft">
          Tax
          <input
            name="invoiceTax"
            type="text"
            defaultValue={initial.tax}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs font-medium text-muted-soft">
          Insurance
          <input
            name="invoiceInsurance"
            type="text"
            defaultValue={initial.insurance}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs font-medium text-muted-soft">
          Customs / duties
          <input
            name="invoiceCustomsDuties"
            type="text"
            defaultValue={initial.customsDuties}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs font-medium text-muted-soft">
          Discount
          <input
            name="invoiceDiscount"
            type="text"
            defaultValue={initial.discount}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs font-medium text-muted-soft">
          Total
          <input
            name="invoiceTotal"
            type="text"
            defaultValue={initial.total}
            className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
            placeholder="Final total shown on PDF"
            autoComplete="off"
          />
        </label>
      </div>
      <label className="block text-xs font-medium text-muted-soft">
        Line description (optional, appears with contents on PDF)
        <textarea
          name="invoiceLineDescription"
          rows={2}
          defaultValue={initial.lineDescription}
          className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
        />
      </label>
      <label className="block text-xs font-medium text-muted-soft">
        Billing notes (optional, printed on PDF)
        <textarea
          name="invoiceNotes"
          rows={3}
          defaultValue={initial.notes}
          className="mt-1 w-full rounded-lg border border-border-strong bg-canvas/40 px-3 py-2 text-sm text-ink"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save invoice & PDF settings"}
      </button>
      {state?.ok === false ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-teal">{state.message}</p>
      ) : null}
    </form>
  );
}
