"use client";

import { useActionState, useState } from "react";
import { AdminFormField, adminInputClassName } from "@/components/admin/AdminFormField";
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

const inputClass = adminInputClassName();
const textareaClass = `${inputClass} min-h-[4.5rem] resize-y`;

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
        <AdminFormField label="Invoice number (optional)" htmlFor="admin-inv-number">
          <input
            id="admin-inv-number"
            name="invoiceNumber"
            type="text"
            defaultValue={initial.number}
            className={inputClass}
            placeholder="e.g. INV-2026-0042"
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Currency" htmlFor="admin-inv-currency">
          <input
            id="admin-inv-currency"
            name="invoiceCurrency"
            type="text"
            defaultValue={initial.currency}
            className={inputClass}
            placeholder="INR"
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Subtotal" htmlFor="admin-inv-subtotal">
          <input
            id="admin-inv-subtotal"
            name="invoiceSubtotal"
            type="text"
            defaultValue={initial.subtotal}
            className={inputClass}
            placeholder="e.g. 4500"
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Tax" htmlFor="admin-inv-tax">
          <input
            id="admin-inv-tax"
            name="invoiceTax"
            type="text"
            defaultValue={initial.tax}
            className={inputClass}
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Insurance" htmlFor="admin-inv-insurance">
          <input
            id="admin-inv-insurance"
            name="invoiceInsurance"
            type="text"
            defaultValue={initial.insurance}
            className={inputClass}
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Customs / duties" htmlFor="admin-inv-customs">
          <input
            id="admin-inv-customs"
            name="invoiceCustomsDuties"
            type="text"
            defaultValue={initial.customsDuties}
            className={inputClass}
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Discount" htmlFor="admin-inv-discount">
          <input
            id="admin-inv-discount"
            name="invoiceDiscount"
            type="text"
            defaultValue={initial.discount}
            className={inputClass}
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Total" htmlFor="admin-inv-total">
          <input
            id="admin-inv-total"
            name="invoiceTotal"
            type="text"
            defaultValue={initial.total}
            className={inputClass}
            placeholder="Final total shown on PDF"
            autoComplete="off"
          />
        </AdminFormField>
      </div>
      <AdminFormField
        label="Line description (optional, appears with contents on PDF)"
        htmlFor="admin-inv-line"
      >
        <textarea
          id="admin-inv-line"
          name="invoiceLineDescription"
          rows={2}
          defaultValue={initial.lineDescription}
          className={textareaClass}
        />
      </AdminFormField>
      <AdminFormField label="Billing notes (optional, printed on PDF)" htmlFor="admin-inv-notes">
        <textarea
          id="admin-inv-notes"
          name="invoiceNotes"
          rows={3}
          defaultValue={initial.notes}
          className={textareaClass}
        />
      </AdminFormField>
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
