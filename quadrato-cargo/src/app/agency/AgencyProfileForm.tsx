"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminUi } from "@/components/admin/admin-ui";
import { patchAgencyProfileApi } from "@/lib/api/agency-client";
import { agencyHubFormCopy, agencyProfileCopy } from "@/lib/agency-content";
import { agencyUi } from "@/lib/agency-ui";

type Props = {
  initialName: string;
  initialAddress: string;
  initialCity: string;
  initialPhone: string;
};

export function AgencyProfileForm({
  initialName,
  initialAddress,
  initialCity,
  initialPhone,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [agencyAddress, setAgencyAddress] = useState(initialAddress);
  const [agencyCity, setAgencyCity] = useState(initialCity);
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
      agencyCity: agencyCity.trim(),
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
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="rounded-lg border border-border-strong bg-canvas/30 px-3 py-2 text-xs text-muted-soft">
        {agencyHubFormCopy.bulkSaveHint}
      </p>
      <div className={agencyUi.formBlock}>
        <h3 className={agencyUi.formBlockTitle}>{agencyProfileCopy.blockIdentity}</h3>
        <p className={agencyUi.formBlockHint}>{agencyProfileCopy.blockIdentityHint}</p>
        <div className={agencyUi.fieldStack}>
          <div>
            <label htmlFor="agency-profile-name" className={adminUi.labelBlock}>
              {agencyProfileCopy.nameLabel}
            </label>
            <input
              id="agency-profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={8}
              required
              className={`${adminUi.input} mt-2`}
              autoComplete="organization"
            />
            <p className="mt-1.5 text-xs text-muted-soft">{agencyProfileCopy.nameHint}</p>
          </div>
        </div>
      </div>

      <div className={agencyUi.formBlock}>
        <h3 className={agencyUi.formBlockTitle}>{agencyProfileCopy.blockLocation}</h3>
        <p className={agencyUi.formBlockHint}>{agencyProfileCopy.blockLocationHint}</p>
        <div className={agencyUi.fieldStack}>
          <div>
            <label htmlFor="agency-profile-address" className={adminUi.labelBlock}>
              {agencyProfileCopy.addressLabel}
            </label>
            <textarea
              id="agency-profile-address"
              value={agencyAddress}
              onChange={(e) => setAgencyAddress(e.target.value)}
              rows={4}
              placeholder={agencyProfileCopy.addressPlaceholder}
              className={`${adminUi.input} mt-2 min-h-26 resize-y`}
              autoComplete="street-address"
            />
          </div>
          <div>
            <label htmlFor="agency-profile-city" className={adminUi.labelBlock}>
              {agencyProfileCopy.cityLabel}
            </label>
            <input
              id="agency-profile-city"
              value={agencyCity}
              onChange={(e) => setAgencyCity(e.target.value)}
              maxLength={80}
              placeholder={agencyProfileCopy.cityPlaceholder}
              className={`${adminUi.input} mt-2`}
              autoComplete="address-level2"
            />
            <p className="mt-1.5 text-xs text-muted-soft">{agencyProfileCopy.cityHint}</p>
          </div>
        </div>
      </div>

      <div className={agencyUi.formBlock}>
        <h3 className={agencyUi.formBlockTitle}>{agencyProfileCopy.blockContact}</h3>
        <p className={agencyUi.formBlockHint}>{agencyProfileCopy.blockContactHint}</p>
        <div className={agencyUi.fieldStack}>
          <div>
            <label htmlFor="agency-profile-phone" className={adminUi.labelBlock}>
              {agencyProfileCopy.phoneLabel}
            </label>
            <input
              id="agency-profile-phone"
              value={agencyPhone}
              onChange={(e) => setAgencyPhone(e.target.value)}
              type="tel"
              className={`${adminUi.input} mt-2`}
              autoComplete="tel"
            />
          </div>
        </div>
      </div>

      <div className={agencyUi.actionsBar}>
        <button type="submit" disabled={pending} className={agencyUi.btnPrimary}>
          {pending ? agencyProfileCopy.savePending : agencyProfileCopy.save}
        </button>
        <p className="text-xs text-muted-soft">{agencyProfileCopy.saveFooterHint}</p>
      </div>

      {error ? (
        <p className={agencyUi.messageErr} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className={agencyUi.messageOk} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
