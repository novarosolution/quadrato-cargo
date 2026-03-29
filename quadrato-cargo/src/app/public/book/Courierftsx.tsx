"use client";

import { motion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { postBookCourierApi } from "@/lib/api/public-client";
import { authFieldClass, authInputClass } from "@/components/auth/authStyles";
import {
  getAddressBookApi,
  type SavedAddress,
  updateAddressBookApi,
} from "@/lib/api/profile-client";
import {
  type BookCourierStep,
  bookCourierRowFromFormData,
  validateBookCourierStep,
  validateBookCourier,
} from "@/lib/validators/book-courier";

type BookCourierState = {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  bookingReference?: string;
};

const initial: BookCourierState = {
  ok: false,
  message: "",
  fieldErrors: {},
};

const COUNTRY_OPTIONS = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

function Err({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1 text-sm text-rose-400" role="alert">
      {msg}
    </p>
  );
}

export function BookCourierForm() {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<BookCourierState>(initial);
  const [step, setStep] = useState<BookCourierStep>(1);
  const [addressBook, setAddressBook] = useState<{
    sender: SavedAddress | null;
    recipient: SavedAddress | null;
  }>({ sender: null, recipient: null });
  const [addressHint, setAddressHint] = useState<string>("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const e = state.fieldErrors;
  const stepMeta: Record<BookCourierStep, { title: string; note: string }> = {
    1: { title: "Route and pickup mode", note: "Choose shipment type and collection preference." },
    2: { title: "Sender details", note: "Add pickup person and address details." },
    3: { title: "Recipient details", note: "Add delivery contact and destination address." },
    4: { title: "Parcel details", note: "Add package details and submit your booking." },
  };

  const canShow = (target: BookCourierStep) => step === target;

  useEffect(() => {
    let active = true;
    getAddressBookApi().then((res) => {
      if (!active || !res.ok) return;
      setAddressBook(res.addressBook);
    });
    return () => {
      active = false;
    };
  }, []);

  const setFormValue = (name: string, value: string) => {
    if (!formRef.current) return;
    const el = formRef.current.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | null;
    if (!el) return;
    el.value = value;
  };

  const applySavedAddress = (kind: "sender" | "recipient") => {
    const saved = addressBook[kind];
    if (!saved) return;
    const p = kind;
    setFormValue(`${p}Name`, saved.name);
    setFormValue(`${p}Email`, saved.email);
    setFormValue(`${p}Phone`, saved.phone);
    setFormValue(`${p}Street`, saved.street);
    setFormValue(`${p}City`, saved.city);
    setFormValue(`${p}Postal`, saved.postal);
    setFormValue(`${p}Country`, saved.country);
    setAddressHint(`Saved ${kind} address applied.`);
  };

  const saveCurrentAddress = async (kind: "sender" | "recipient") => {
    if (!formRef.current) return;
    const row = bookCourierRowFromFormData(new FormData(formRef.current));
    const draft: SavedAddress = {
      name: kind === "sender" ? row.senderName : row.recipientName,
      email: kind === "sender" ? row.senderEmail : row.recipientEmail,
      phone: kind === "sender" ? row.senderPhone : row.recipientPhone,
      street: kind === "sender" ? row.senderStreet : row.recipientStreet,
      city: kind === "sender" ? row.senderCity : row.recipientCity,
      postal: kind === "sender" ? row.senderPostal : row.recipientPostal,
      country: kind === "sender" ? row.senderCountry : row.recipientCountry,
    };
    if (!draft.name || !draft.email || !draft.phone || !draft.street || !draft.city || !draft.postal || !draft.country) {
      setAddressHint(`Please fill ${kind} fields before saving.`);
      return;
    }
    const res = await updateAddressBookApi(
      kind === "sender" ? { sender: draft } : { recipient: draft }
    );
    if (!res.ok) {
      setAddressHint(res.error);
      return;
    }
    setAddressBook(res.addressBook);
    setAddressHint(`${kind === "sender" ? "Sender" : "Recipient"} address saved.`);
  };

  const onNextStep = (target: BookCourierStep) => {
    if (!formRef.current) return;
    const row = bookCourierRowFromFormData(new FormData(formRef.current));
    const fieldErrors = validateBookCourierStep(row, step);
    if (Object.keys(fieldErrors).length > 0) {
      setState({
        ok: false,
        message: "Please complete this step before continuing.",
        fieldErrors,
      });
      return;
    }
    setState((prev) => ({ ...prev, message: "", fieldErrors: {} }));
    setStep(target);
  };

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const row = bookCourierRowFromFormData(new FormData(form));
    const parsed = validateBookCourier(row);
    if (!parsed.ok) {
      const firstInvalidStep = ([1, 2, 3, 4] as BookCourierStep[]).find(
        (candidate) =>
          Object.keys(validateBookCourierStep(row, candidate)).length > 0,
      );
      if (firstInvalidStep) setStep(firstInvalidStep);
      setState({
        ok: false,
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }

    setPending(true);
    setState(initial);

    const result = await postBookCourierApi({
      routeType: parsed.routeType,
      bookingPayload: parsed.bookingPayload,
    });
    setPending(false);

    if (result.ok) {
      setState({
        ok: true,
        message: result.message,
        fieldErrors: {},
        bookingReference: result.bookingReference,
      });
      form.reset();
      setStep(1);
    } else {
      setState({
        ok: false,
        message: result.message,
        fieldErrors: result.fieldErrors,
      });
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-3xl border border-border bg-canvas/10 p-4 shadow-sm backdrop-blur-md sm:p-6" noValidate>
      <div className="rounded-2xl border border-teal/25 bg-linear-to-r from-teal/10 via-canvas/30 to-canvas/20 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-soft">
            Booking steps
          </p>
          <p className="rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
            Step {step} of 4
          </p>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold text-ink">{stepMeta[step].title}</h3>
        <p className="mt-1 text-sm text-muted">{stepMeta[step].note}</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition ${
                step >= s ? "bg-teal" : "bg-border/70"
              }`}
            />
          ))}
        </div>
      </div>

      <fieldset
        className={`space-y-4 rounded-2xl border border-border bg-surface-elevated/70 p-5 shadow-sm backdrop-blur-md sm:p-6 ${
          canShow(1) ? "" : "hidden"
        }`}
      >
        <legend className="font-display text-lg font-semibold text-ink px-1">
          Step 1: Shipment route
        </legend>
        <p className="text-sm text-muted">
          Select domestic or international shipment and pickup mode.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-ghost-fill px-4 py-3 has-checked:border-teal/40 has-checked:bg-teal/5">
            <input
              type="radio"
              name="routeType"
              value="domestic"
              className="h-4 w-4 border-border-strong text-teal focus:ring-teal/40"
            />
            <span className="text-sm font-medium text-ink">Domestic</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-ghost-fill px-4 py-3 has-checked:border-teal/40 has-checked:bg-teal/5">
            <input
              type="radio"
              name="routeType"
              value="international"
              className="h-4 w-4 border-border-strong text-teal focus:ring-teal/40"
            />
            <span className="text-sm font-medium text-ink">
              International (out of country)
            </span>
          </label>
        </div>
        <Err id="routeType-err" msg={e.routeType} />
      </fieldset>

      <fieldset
        className={`space-y-4 rounded-2xl border border-border bg-surface-elevated/70 p-5 shadow-sm backdrop-blur-md sm:p-6 ${
          canShow(1) ? "" : "hidden"
        }`}
      >
        <legend className="font-display text-lg font-semibold text-ink px-1">
          Collection at your PIN / address
        </legend>
        <p className="text-sm text-muted">
          Choose instant or scheduled pickup. Scheduled mode requires date and
          time slot (24/7 available).
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-ghost-fill px-4 py-3 has-checked:border-teal/40 has-checked:bg-teal/5">
            <input
              type="radio"
              name="collectionMode"
              value="instant"
              defaultChecked
              className="h-4 w-4 border-border-strong text-teal focus:ring-teal/40"
            />
            <span className="text-sm font-medium text-ink">
              Instant collection (PIN / postal code)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-ghost-fill px-4 py-3 has-checked:border-teal/40 has-checked:bg-teal/5">
            <input
              type="radio"
              name="collectionMode"
              value="scheduled"
              className="h-4 w-4 border-border-strong text-teal focus:ring-teal/40"
            />
            <span className="text-sm font-medium text-ink">
              Schedule date &amp; time (PIN / postal code)
            </span>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pickupDate" className="text-sm font-medium text-ink">
              Pickup date (scheduled only)
            </label>
            <input
              id="pickupDate"
              name="pickupDate"
              type="date"
              className={authFieldClass}
              aria-invalid={Boolean(e.pickupDate)}
              aria-describedby={e.pickupDate ? "pickupDate-err" : undefined}
            />
            <Err id="pickupDate-err" msg={e.pickupDate} />
          </div>
          <div>
            <label htmlFor="pickupTimeSlot" className="text-sm font-medium text-ink">
              Pickup time slot (scheduled only)
            </label>
            <select
              id="pickupTimeSlot"
              name="pickupTimeSlot"
              className={authFieldClass}
              aria-invalid={Boolean(e.pickupTimeSlot)}
              aria-describedby={e.pickupTimeSlot ? "pickupTimeSlot-err" : undefined}
              defaultValue=""
            >
              <option value="">Select a slot</option>
              <option value="Any time (24/7)">Any time (24/7)</option>
              <option value="00:00-06:00">00:00-06:00</option>
              <option value="06:00-12:00">06:00-12:00</option>
              <option value="12:00-18:00">12:00-18:00</option>
              <option value="18:00-24:00">18:00-24:00</option>
            </select>
            <Err id="pickupTimeSlot-err" msg={e.pickupTimeSlot} />
          </div>
        </div>
        <Err id="collectionMode-err" msg={e.collectionMode} />
      </fieldset>

      <fieldset
        className={`space-y-4 rounded-2xl border border-border bg-surface-elevated/70 p-5 shadow-sm backdrop-blur-md sm:p-6 ${
          canShow(2) ? "" : "hidden"
        }`}
      >
        <legend className="font-display text-lg font-semibold text-ink px-1">
          Step 2: Sender &amp; pickup
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applySavedAddress("sender")}
            className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            disabled={!addressBook.sender}
          >
            Use saved sender
          </button>
          <button
            type="button"
            onClick={() => void saveCurrentAddress("sender")}
            className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
          >
            Save sender address
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="senderName" className="text-sm font-medium text-ink">
              Full name <span className="text-teal">*</span>
            </label>
            <input
              id="senderName"
              name="senderName"
              autoComplete="name"
              className={authFieldClass}
              aria-invalid={Boolean(e.senderName)}
              aria-describedby={e.senderName ? "senderName-err" : undefined}
            />
            <Err id="senderName-err" msg={e.senderName} />
          </div>
          <div>
            <label htmlFor="senderEmail" className="text-sm font-medium text-ink">
              Email <span className="text-teal">*</span>
            </label>
            <input
              id="senderEmail"
              name="senderEmail"
              type="email"
              autoComplete="email"
              inputMode="email"
              className={authFieldClass}
              aria-invalid={Boolean(e.senderEmail)}
              aria-describedby={e.senderEmail ? "senderEmail-err" : undefined}
            />
            <Err id="senderEmail-err" msg={e.senderEmail} />
          </div>
          <div>
            <label htmlFor="senderPhone" className="text-sm font-medium text-ink">
              Phone <span className="text-teal">*</span>
            </label>
            <input
              id="senderPhone"
              name="senderPhone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9]{7,15}"
              minLength={7}
              maxLength={15}
              onInput={(event) => {
                const input = event.currentTarget;
                input.value = input.value.replace(/\D/g, "").slice(0, 15);
              }}
              className={authFieldClass}
              aria-invalid={Boolean(e.senderPhone)}
              aria-describedby={e.senderPhone ? "senderPhone-err" : undefined}
            />
            <Err id="senderPhone-err" msg={e.senderPhone} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="senderStreet" className="text-sm font-medium text-ink">
              Street address (pickup) <span className="text-teal">*</span>
            </label>
            <input
              id="senderStreet"
              name="senderStreet"
              autoComplete="street-address"
              className={authFieldClass}
              aria-invalid={Boolean(e.senderStreet)}
              aria-describedby={e.senderStreet ? "senderStreet-err" : undefined}
            />
            <Err id="senderStreet-err" msg={e.senderStreet} />
          </div>
          <div>
            <label htmlFor="senderCity" className="text-sm font-medium text-ink">
              City <span className="text-teal">*</span>
            </label>
            <input
              id="senderCity"
              name="senderCity"
              autoComplete="address-level2"
              className={authFieldClass}
              aria-invalid={Boolean(e.senderCity)}
              aria-describedby={e.senderCity ? "senderCity-err" : undefined}
            />
            <Err id="senderCity-err" msg={e.senderCity} />
          </div>
          <div>
            <label htmlFor="senderPostal" className="text-sm font-medium text-ink">
              PIN / postal / ZIP <span className="text-teal">*</span>
            </label>
            <input
              id="senderPostal"
              name="senderPostal"
              autoComplete="postal-code"
              className={authFieldClass}
              aria-invalid={Boolean(e.senderPostal)}
              aria-describedby={e.senderPostal ? "senderPostal-err" : undefined}
            />
            <Err id="senderPostal-err" msg={e.senderPostal} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="senderCountry" className="text-sm font-medium text-ink">
              Country (pickup) <span className="text-teal">*</span>
            </label>
            <select
              id="senderCountry"
              name="senderCountry"
              autoComplete="country-name"
              className={authFieldClass}
              aria-invalid={Boolean(e.senderCountry)}
              aria-describedby={e.senderCountry ? "senderCountry-err" : undefined}
              defaultValue=""
            >
              <option value="" disabled>
                Select pickup country
              </option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <Err id="senderCountry-err" msg={e.senderCountry} />
          </div>
        </div>
      </fieldset>

      <fieldset
        className={`space-y-4 rounded-2xl border border-border bg-surface-elevated/70 p-5 shadow-sm backdrop-blur-md sm:p-6 ${
          canShow(3) ? "" : "hidden"
        }`}
      >
        <legend className="font-display text-lg font-semibold text-ink px-1">
          Step 3: Recipient &amp; delivery
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applySavedAddress("recipient")}
            className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            disabled={!addressBook.recipient}
          >
            Use saved recipient
          </button>
          <button
            type="button"
            onClick={() => void saveCurrentAddress("recipient")}
            className="rounded-lg border border-border-strong bg-canvas/40 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal/35 hover:bg-pill-hover"
          >
            Save recipient address
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="recipientName" className="text-sm font-medium text-ink">
              Full name <span className="text-teal">*</span>
            </label>
            <input
              id="recipientName"
              name="recipientName"
              autoComplete="shipping name"
              className={authFieldClass}
              aria-invalid={Boolean(e.recipientName)}
              aria-describedby={e.recipientName ? "recipientName-err" : undefined}
            />
            <Err id="recipientName-err" msg={e.recipientName} />
          </div>
          <div>
            <label htmlFor="recipientEmail" className="text-sm font-medium text-ink">
              Email <span className="text-teal">*</span>
            </label>
            <input
              id="recipientEmail"
              name="recipientEmail"
              type="email"
              autoComplete="email"
              inputMode="email"
              className={authFieldClass}
              aria-invalid={Boolean(e.recipientEmail)}
              aria-describedby={
                e.recipientEmail ? "recipientEmail-err" : undefined
              }
            />
            <Err id="recipientEmail-err" msg={e.recipientEmail} />
          </div>
          <div>
            <label htmlFor="recipientPhone" className="text-sm font-medium text-ink">
              Phone <span className="text-teal">*</span>
            </label>
            <input
              id="recipientPhone"
              name="recipientPhone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9]{7,15}"
              minLength={7}
              maxLength={15}
              onInput={(event) => {
                const input = event.currentTarget;
                input.value = input.value.replace(/\D/g, "").slice(0, 15);
              }}
              className={authFieldClass}
              aria-invalid={Boolean(e.recipientPhone)}
              aria-describedby={
                e.recipientPhone ? "recipientPhone-err" : undefined
              }
            />
            <Err id="recipientPhone-err" msg={e.recipientPhone} />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="recipientStreet"
              className="text-sm font-medium text-ink"
            >
              Street address <span className="text-teal">*</span>
            </label>
            <input
              id="recipientStreet"
              name="recipientStreet"
              autoComplete="shipping street-address"
              className={authFieldClass}
              aria-invalid={Boolean(e.recipientStreet)}
              aria-describedby={
                e.recipientStreet ? "recipientStreet-err" : undefined
              }
            />
            <Err id="recipientStreet-err" msg={e.recipientStreet} />
          </div>
          <div>
            <label htmlFor="recipientCity" className="text-sm font-medium text-ink">
              City <span className="text-teal">*</span>
            </label>
            <input
              id="recipientCity"
              name="recipientCity"
              autoComplete="shipping address-level2"
              className={authFieldClass}
              aria-invalid={Boolean(e.recipientCity)}
              aria-describedby={e.recipientCity ? "recipientCity-err" : undefined}
            />
            <Err id="recipientCity-err" msg={e.recipientCity} />
          </div>
          <div>
            <label
              htmlFor="recipientPostal"
              className="text-sm font-medium text-ink"
            >
              Postal / ZIP <span className="text-teal">*</span>
            </label>
            <input
              id="recipientPostal"
              name="recipientPostal"
              autoComplete="shipping postal-code"
              className={authFieldClass}
              aria-invalid={Boolean(e.recipientPostal)}
              aria-describedby={
                e.recipientPostal ? "recipientPostal-err" : undefined
              }
            />
            <Err id="recipientPostal-err" msg={e.recipientPostal} />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="recipientCountry"
              className="text-sm font-medium text-ink"
            >
              Country (delivery) <span className="text-teal">*</span>
            </label>
            <select
              id="recipientCountry"
              name="recipientCountry"
              autoComplete="shipping country"
              className={authFieldClass}
              aria-invalid={Boolean(e.recipientCountry)}
              aria-describedby={
                e.recipientCountry ? "recipientCountry-err" : undefined
              }
              defaultValue=""
            >
              <option value="" disabled>
                Select delivery country
              </option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <Err id="recipientCountry-err" msg={e.recipientCountry} />
          </div>
        </div>
      </fieldset>

      <fieldset
        className={`space-y-4 rounded-2xl border border-border bg-surface-elevated/70 p-5 shadow-sm backdrop-blur-md sm:p-6 ${
          canShow(4) ? "" : "hidden"
        }`}
      >
        <legend className="font-display text-lg font-semibold text-ink px-1">
          Step 4: Parcel details
        </legend>
        <div>
          <label htmlFor="contentsDescription" className="text-sm font-medium text-ink">
            Contents description <span className="text-teal">*</span>
          </label>
          <textarea
            id="contentsDescription"
            name="contentsDescription"
            rows={3}
            placeholder="e.g. Commercial samples, clothing, 2 books — for customs"
            className={authFieldClass}
            aria-invalid={Boolean(e.contentsDescription)}
            aria-describedby={
              e.contentsDescription ? "contentsDescription-err" : undefined
            }
          />
          <Err id="contentsDescription-err" msg={e.contentsDescription} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="weightKg" className="text-sm font-medium text-ink">
              Total weight (kg) <span className="text-teal">*</span>
            </label>
            <input
              id="weightKg"
              name="weightKg"
              inputMode="decimal"
              placeholder="e.g. 2.5"
              className={authFieldClass}
              aria-invalid={Boolean(e.weightKg)}
              aria-describedby={e.weightKg ? "weightKg-err" : undefined}
            />
            <Err id="weightKg-err" msg={e.weightKg} />
          </div>
          <div>
            <label htmlFor="declaredValue" className="text-sm font-medium text-ink">
              Declared value (optional)
            </label>
            <input
              id="declaredValue"
              name="declaredValue"
              placeholder="e.g. USD 150"
              className={authFieldClass}
            />
          </div>
          <div>
            <label htmlFor="lengthCm" className="text-sm font-medium text-ink">
              L × W × H (cm, optional)
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                name="lengthCm"
                placeholder="L"
                inputMode="numeric"
                className={authInputClass}
              />
              <input
                name="widthCm"
                placeholder="W"
                inputMode="numeric"
                className={authInputClass}
              />
              <input
                name="heightCm"
                placeholder="H"
                inputMode="numeric"
                className={authInputClass}
              />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset
        className={`space-y-4 rounded-2xl border border-border bg-surface-elevated/70 p-5 shadow-sm backdrop-blur-md sm:p-6 ${
          canShow(4) ? "" : "hidden"
        }`}
      >
        <legend className="font-display text-lg font-semibold text-ink px-1">
          Pickup timing &amp; notes
        </legend>
        <p className="text-sm text-muted">
          Add pickup preference and special instructions for handling.
        </p>
        <div>
          <label
            htmlFor="pickupPreference"
            className="text-sm font-medium text-ink"
          >
            Pickup window or notes
            <span className="block text-xs font-normal text-muted">
              Required if you chose scheduled pickup; optional for instant
              (ASAP at your PIN).
            </span>
          </label>
          <input
            id="pickupPreference"
            name="pickupPreference"
            placeholder="e.g. Instant — call on arrival · or · 28 Mar, 9am–12pm"
            className={authFieldClass}
            aria-invalid={Boolean(e.pickupPreference)}
            aria-describedby={
              e.pickupPreference ? "pickupPreference-err" : undefined
            }
          />
          <Err id="pickupPreference-err" msg={e.pickupPreference} />
        </div>
        <div>
          <label htmlFor="instructions" className="text-sm font-medium text-ink">
            Special instructions (optional)
          </label>
          <textarea
            id="instructions"
            name="instructions"
            rows={3}
            placeholder="Dock access, fragile, insurance, HS codes if known…"
            className={authFieldClass}
          />
        </div>
      </fieldset>

      <div
        className={`rounded-2xl border border-border bg-ghost-fill p-5 ${
          canShow(4) ? "" : "hidden"
        }`}
      >
        <label className="flex cursor-pointer gap-3 text-sm text-muted">
          <input
            type="checkbox"
            name="agreed"
            className="mt-0.5 h-4 w-4 rounded border-border-strong text-teal focus:ring-teal/40"
          />
          <span>
            <span className="font-medium text-ink">
              International bookings only:
            </span>{" "}
            I confirm sender, recipient, and contents details are accurate for
            export, customs, and carrier handoff. Required when you select
            international.
          </span>
        </label>
        <Err id="agreed-err" msg={e.agreed} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setState((prev) => ({ ...prev, message: "", fieldErrors: {} }));
              setStep((prev) => (prev - 1) as BookCourierStep);
            }}
            className="rounded-2xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={() => onNextStep((step + 1) as BookCourierStep)}
            className="btn-primary w-full rounded-2xl bg-linear-to-r from-accent-deep via-accent to-accent-hover py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-105"
          >
            Continue
          </button>
        ) : (
          <motion.button
            type="submit"
            disabled={pending}
            whileHover={{ scale: pending ? 1 : 1.01 }}
            whileTap={{ scale: pending ? 1 : 0.99 }}
            className="btn-primary w-full rounded-2xl bg-linear-to-r from-accent-deep via-accent to-accent-hover py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-105 disabled:opacity-60"
          >
            {pending ? "Submitting booking..." : "Submit booking"}
          </motion.button>
        )}
      </div>

      {state.ok && state.message ? (
        <motion.p
          className="rounded-2xl border border-teal/25 bg-teal/10 px-4 py-4 text-sm leading-relaxed text-teal"
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {state.message}
          {state.bookingReference ? (
            <span className="mt-2 block font-mono text-xs text-ink">
              Booking reference: {state.bookingReference}
            </span>
          ) : null}
        </motion.p>
      ) : null}
      {addressHint ? (
        <p className="rounded-xl border border-border bg-canvas/20 px-3 py-2 text-xs text-muted">
          {addressHint}
        </p>
      ) : null}
      {!state.ok && state.message ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-300" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
