"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFieldClass } from "@/components/auth/authStyles";
import { publicClass, publicUi } from "@/components/public/public-ui";
import {
  updateAddressBookApi,
  type AddressBook,
  type SavedAddress,
} from "@/lib/api/profile-client";
import { RegionFieldByCountry } from "@/components/public/RegionFieldByCountry";
import { COUNTRY_OPTIONS } from "@/lib/booking-country-options";
import { getRegionOptionsForCountry } from "@/lib/country-state-options";

const empty: SavedAddress = {
  name: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postal: "",
  country: "",
};

function digitsPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 15);
}

function fromSaved(a: SavedAddress | null): SavedAddress {
  if (!a) return { ...empty };
  return { ...empty, ...a, phone: digitsPhone(a.phone), state: a.state ?? "" };
}

function validate(d: SavedAddress): string | null {
  if (!d.name.trim()) return "Full name is required.";
  if (!d.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
    return "A valid email is required.";
  }
  const p = digitsPhone(d.phone);
  if (p.length < 7 || p.length > 15) return "Phone must be 7–15 digits.";
  if (!d.street.trim()) return "Street address is required.";
  if (!d.city.trim()) return "City is required.";
  if (!d.postal.trim()) return "Postal / ZIP code is required.";
  if (!d.country.trim()) return "Country is required.";
  return null;
}

function toPayload(d: SavedAddress): SavedAddress {
  const state = d.state?.trim() ?? "";
  return {
    name: d.name.trim(),
    email: d.email.trim().toLowerCase(),
    phone: digitsPhone(d.phone),
    street: d.street.trim(),
    city: d.city.trim(),
    ...(state ? { state } : {}),
    postal: d.postal.trim(),
    country: d.country.trim(),
  };
}

function AddressEditor({
  title,
  hint,
  role,
  saved,
  onUpdated,
}: {
  title: string;
  hint: string;
  role: "sender" | "recipient";
  saved: SavedAddress | null;
  onUpdated: (book: AddressBook) => void;
}) {
  const [fields, setFields] = useState<SavedAddress>(() => fromSaved(saved));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFields(fromSaved(saved));
  }, [saved]);

  const id = (k: string) => `profile-addr-${role}-${k}`;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(fields);
    if (err) {
      setMsg({ ok: false, text: err });
      return;
    }
    setPending(true);
    setMsg(null);
    const body = toPayload(fields);
    const res = await updateAddressBookApi(
      role === "sender" ? { sender: body } : { recipient: body },
    );
    setPending(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Saved. You can use this on Book courier with one tap." });
      onUpdated(res.addressBook);
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  async function onClear() {
    if (!saved && !fields.name.trim() && !fields.email.trim()) return;
    if (!window.confirm("Remove this saved address from your account?")) return;
    setPending(true);
    setMsg(null);
    const res = await updateAddressBookApi(
      role === "sender" ? { sender: null } : { recipient: null },
    );
    setPending(false);
    if (res.ok) {
      setFields({ ...empty });
      setMsg({ ok: true, text: "Removed." });
      onUpdated(res.addressBook);
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <form
      onSubmit={onSave}
      className="space-y-4 rounded-2xl border border-border-strong/70 bg-canvas/25 p-4 sm:p-5"
    >
      <div>
        <h3 className="font-display text-base font-bold tracking-tight text-ink">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-soft">{hint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={id("name")} className="text-sm font-medium text-ink">
            Full name <span className="text-teal">*</span>
          </label>
          <input
            id={id("name")}
            value={fields.name}
            onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
            autoComplete="name"
            className={publicClass(authFieldClass, "mt-1.5")}
          />
        </div>
        <div>
          <label htmlFor={id("email")} className="text-sm font-medium text-ink">
            Email <span className="text-teal">*</span>
          </label>
          <input
            id={id("email")}
            type="email"
            inputMode="email"
            value={fields.email}
            onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
            className={publicClass(authFieldClass, "mt-1.5")}
          />
        </div>
        <div>
          <label htmlFor={id("phone")} className="text-sm font-medium text-ink">
            Phone <span className="text-teal">*</span>
          </label>
          <input
            id={id("phone")}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{7,15}"
            minLength={7}
            maxLength={15}
            value={fields.phone}
            onChange={(e) =>
              setFields((f) => ({ ...f, phone: digitsPhone(e.target.value) }))
            }
            autoComplete="tel"
            className={publicClass(authFieldClass, "mt-1.5")}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id("street")} className="text-sm font-medium text-ink">
            Street address <span className="text-teal">*</span>
          </label>
          <input
            id={id("street")}
            value={fields.street}
            onChange={(e) => setFields((f) => ({ ...f, street: e.target.value }))}
            autoComplete="street-address"
            className={publicClass(authFieldClass, "mt-1.5")}
          />
        </div>
        <div>
          <label htmlFor={id("city")} className="text-sm font-medium text-ink">
            City <span className="text-teal">*</span>
          </label>
          <input
            id={id("city")}
            value={fields.city}
            onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))}
            autoComplete="address-level2"
            className={publicClass(authFieldClass, "mt-1.5")}
          />
        </div>
        <div>
          <label htmlFor={id("country")} className="text-sm font-medium text-ink">
            Country <span className="text-teal">*</span>
          </label>
          <select
            id={id("country")}
            value={fields.country}
            onChange={(e) => {
              const c = e.target.value;
              setFields((f) => {
                const ro = getRegionOptionsForCountry(c);
                let st = f.state ?? "";
                if (ro?.length && st && !ro.includes(st)) st = "";
                return { ...f, country: c, state: st };
              });
            }}
            autoComplete="country-name"
            className={publicClass(authFieldClass, "mt-1.5")}
          >
            <option value="">Select country</option>
            {(fields.country.trim() && !COUNTRY_OPTIONS.includes(fields.country)
              ? [...COUNTRY_OPTIONS, fields.country.trim()]
              : COUNTRY_OPTIONS
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("state")} className="text-sm font-medium text-ink">
            State / province
          </label>
          <RegionFieldByCountry
            id={id("state")}
            name={`profile-addr-${role}-state`}
            country={fields.country}
            value={fields.state ?? ""}
            onChange={(next) => setFields((f) => ({ ...f, state: next }))}
            className={publicClass(authFieldClass, "mt-1.5")}
            autoComplete="address-level1"
          />
        </div>
        <div>
          <label htmlFor={id("postal")} className="text-sm font-medium text-ink">
            Postal / ZIP <span className="text-teal">*</span>
          </label>
          <input
            id={id("postal")}
            value={fields.postal}
            onChange={(e) => setFields((f) => ({ ...f, postal: e.target.value }))}
            autoComplete="postal-code"
            className={publicClass(authFieldClass, "mt-1.5")}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={pending} className={publicUi.btnPrimary}>
          {pending ? "Saving…" : "Save address"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void onClear()}
          className={publicUi.btnSecondary}
        >
          Clear saved
        </button>
      </div>

      {msg ? (
        <p
          className={msg.ok ? "text-sm font-medium text-teal" : "text-sm text-rose-400"}
          role={msg.ok ? "status" : "alert"}
        >
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}

export function ProfileAddressBookPanel({ initialBook }: { initialBook: AddressBook }) {
  const router = useRouter();
  const [book, setBook] = useState<AddressBook>(initialBook);

  useEffect(() => {
    setBook(initialBook);
  }, [initialBook]);

  function handleUpdated(next: AddressBook) {
    setBook(next);
    router.refresh();
  }

  return (
    <div id="saved-addresses" className="scroll-mt-28">
      <h2 className={publicUi.sectionTitle}>Saved addresses</h2>
      <p className={publicUi.profileSectionDesc}>
        Keep pickup and delivery details on your account — edit here anytime. On{" "}
        <span className="font-medium text-ink">Book courier</span>, use &quot;Use saved sender&quot; or
        &quot;Use saved recipient&quot; to fill the form instantly.
      </p>
      <div className="mt-6 space-y-6">
        <AddressEditor
          title="Pickup (sender)"
          hint="Where we collect the parcel and who we contact."
          role="sender"
          saved={book.sender}
          onUpdated={handleUpdated}
        />
        <AddressEditor
          title="Delivery (recipient)"
          hint="Where the parcel should arrive and who receives it."
          role="recipient"
          saved={book.recipient}
          onUpdated={handleUpdated}
        />
      </div>
    </div>
  );
}
