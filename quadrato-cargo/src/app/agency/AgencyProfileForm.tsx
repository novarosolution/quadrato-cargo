"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { patchAgencyProfileApi } from "@/lib/api/agency-client";

type Props = {
  initialName: string;
  initialAddress: string;
  initialPhone: string;
};

export function AgencyProfileForm({ initialName, initialAddress, initialPhone }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [agencyAddress, setAgencyAddress] = useState(initialAddress);
  const [agencyPhone, setAgencyPhone] = useState(initialPhone);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const res = await patchAgencyProfileApi({
      name: name.trim(),
      agencyAddress: agencyAddress.trim(),
      agencyPhone: agencyPhone.trim(),
    });
    setPending(false);
    if (res.ok) {
      setMessage(res.message);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="agency-profile-name"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Agency / hub name
        </label>
        <input
          id="agency-profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={8}
          required
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
        <p className="mt-1 text-[11px] text-muted-soft">
          Shown to customers on tracking when this account is linked to a booking.
        </p>
      </div>
      <div>
        <label
          htmlFor="agency-profile-address"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Hub address
        </label>
        <textarea
          id="agency-profile-address"
          value={agencyAddress}
          onChange={(e) => setAgencyAddress(e.target.value)}
          rows={3}
          placeholder="Street, city, postal code, country"
          className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      <div>
        <label
          htmlFor="agency-profile-phone"
          className="text-xs font-semibold uppercase tracking-wide text-muted-soft"
        >
          Operations phone
        </label>
        <input
          id="agency-profile-phone"
          value={agencyPhone}
          onChange={(e) => setAgencyPhone(e.target.value)}
          type="tel"
          className="mt-2 w-full rounded-xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
      </div>
      {error ? (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-teal" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save agency details"}
      </button>
    </form>
  );
}
