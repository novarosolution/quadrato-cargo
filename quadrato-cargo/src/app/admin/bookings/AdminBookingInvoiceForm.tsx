"use client";

import { useActionState, useState } from "react";
import { AdminFormField, adminInputClassName } from "@/components/admin/AdminFormField";
import {
  updateBookingInvoiceAdmin,
  type DataManageState,
} from "../dashboard/actions";

export type InvoiceLineItemInitial = {
  description: string;
  amount: string;
  weightKg: string;
  sizeCm: string;
};

export type InvoiceFormInitial = {
  number: string;
  currency: string;
  subtotal: string;
  tax: string;
  customsDuties: string;
  insurancePremium: string;
  total: string;
  insurance: string;
  lineDescription: string;
  notes: string;
  lineItems: InvoiceLineItemInitial[];
  /** From booking parcel count — controls how many line rows are shown. */
  parcelLineCount: number;
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

  const lineSlotCount = Math.min(
    25,
    Math.max(initial.lineItems.length, initial.parcelLineCount, 1),
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="invoiceLineSlotCount" value={String(lineSlotCount)} />
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
            <span className="font-medium text-ink">Customer can download invoice</span>
            <span className="mt-0.5 block text-xs text-muted-soft">
              After pickup OTP. Same PDF size as tracking slip. Uses fields below.
            </span>
          </span>
        </label>
      </div>
      <p className="text-xs text-muted-soft">
        Enter each charge line: <strong className="font-medium text-ink">item</strong>, optional{" "}
        <strong className="font-medium text-ink">weight</strong> and <strong className="font-medium text-ink">size (cm)</strong>, and{" "}
        <strong className="font-medium text-ink">amt</strong> (line total). The customer PDF matches this table, then shows
        one <strong className="font-medium text-ink">grand total</strong> (currency + total below).
      </p>

      <div className="space-y-2 rounded-xl border border-border bg-canvas/20 p-3">
        <p className="text-xs font-semibold text-ink">Charges</p>
        <p className="text-xs text-muted-soft">
          One row per charge line (up to {lineSlotCount} rows, max 25). Booking has{" "}
          <span className="font-medium text-ink">{initial.parcelLineCount}</span> parcel(s); weight and size prefill
          when left empty.
        </p>
        <div className="-mx-1 overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[min(100%,40rem)] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-canvas/40 text-muted-soft">
                <th className="w-8 px-2 py-2 font-medium text-ink/80">#</th>
                <th className="min-w-32 px-2 py-2 font-medium text-ink/80">Item / service</th>
                <th className="w-24 px-2 py-2 font-medium text-ink/80">Wt (kg)</th>
                <th className="min-w-28 px-2 py-2 font-medium text-ink/80">Size (cm)</th>
                <th className="w-28 px-2 py-2 font-medium text-ink/80">Amt</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: lineSlotCount }, (_, i) => {
                const saved = initial.lineItems[i];
                const defaultDesc =
                  saved?.description ??
                  (i < initial.parcelLineCount ? `Item ${i + 1}` : "");
                return (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    <td className="px-2 py-2 align-middle text-muted-soft">{i + 1}</td>
                    <td className="px-2 py-1.5 align-middle">
                      <input
                        id={`admin-inv-line-d-${i}`}
                        name={`invoiceLineDesc_${i}`}
                        type="text"
                        defaultValue={defaultDesc}
                        className={inputClass}
                        placeholder="e.g. Freight — Mumbai to London"
                        autoComplete="off"
                        aria-label={`Invoice line ${i + 1} description`}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <input
                        id={`admin-inv-line-w-${i}`}
                        name={`invoiceLineWeight_${i}`}
                        type="text"
                        defaultValue={saved?.weightKg ?? ""}
                        className={inputClass}
                        placeholder="kg"
                        autoComplete="off"
                        aria-label={`Invoice line ${i + 1} weight kg`}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <input
                        id={`admin-inv-line-s-${i}`}
                        name={`invoiceLineSizeCm_${i}`}
                        type="text"
                        defaultValue={saved?.sizeCm ?? ""}
                        className={inputClass}
                        placeholder="L × W × H"
                        autoComplete="off"
                        aria-label={`Invoice line ${i + 1} size cm`}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <input
                        id={`admin-inv-line-a-${i}`}
                        name={`invoiceLineAmt_${i}`}
                        type="text"
                        defaultValue={saved?.amount ?? ""}
                        className={inputClass}
                        placeholder="e.g. 1200"
                        autoComplete="off"
                        aria-label={`Invoice line ${i + 1} line total`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 dark:bg-teal/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">Grand total (PDF)</p>
        <p className="mt-1 text-xs text-muted-soft">
          Currency and total print once under the line table. If total is empty, the PDF uses the sum of line totals
          when possible.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminFormField label="Invoice no. (optional)" htmlFor="admin-inv-number">
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
        <AdminFormField label="Subtotal (optional, PDF breakdown)" htmlFor="admin-inv-subtotal">
          <input
            id="admin-inv-subtotal"
            name="invoiceSubtotal"
            type="text"
            defaultValue={initial.subtotal}
            className={inputClass}
            placeholder="e.g. 9500"
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Tax (optional, PDF breakdown)" htmlFor="admin-inv-tax">
          <input
            id="admin-inv-tax"
            name="invoiceTax"
            type="text"
            defaultValue={initial.tax}
            className={inputClass}
            placeholder="e.g. 0"
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField label="Customs (optional, PDF breakdown)" htmlFor="admin-inv-customs">
          <input
            id="admin-inv-customs"
            name="invoiceCustomsDuties"
            type="text"
            defaultValue={initial.customsDuties}
            className={inputClass}
            placeholder="e.g. 0"
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField
          label="Insurance amount (optional, PDF breakdown row)"
          htmlFor="admin-inv-ins-premium"
        >
          <input
            id="admin-inv-ins-premium"
            name="invoiceInsurancePremium"
            type="text"
            defaultValue={initial.insurancePremium}
            className={inputClass}
            placeholder="e.g. 500.00"
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
            placeholder="Final total in TOTAL bar"
            autoComplete="off"
          />
        </AdminFormField>
      </div>
      <AdminFormField
        label="Insurance details (optional, narrative on PDF)"
        htmlFor="admin-inv-insurance"
      >
        <textarea
          id="admin-inv-insurance"
          name="invoiceInsurance"
          rows={2}
          defaultValue={initial.insurance}
          className={textareaClass}
          placeholder="Coverage notes, policy reference, carrier terms…"
        />
      </AdminFormField>
      <AdminFormField
        label="Service description (optional, PDF below line table)"
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
      <AdminFormField label="Notes (optional)" htmlFor="admin-inv-notes">
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
        {pending ? "Saving…" : "Save invoice"}
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
