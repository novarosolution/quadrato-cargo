"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { RegionFieldByCountry } from "@/components/public/RegionFieldByCountry";
import { COUNTRY_OPTIONS } from "@/lib/booking-country-options";
import { getRegionOptionsForCountry } from "@/lib/country-state-options";

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

function Err({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1 text-sm text-rose-400" role="alert">
      {msg}
    </p>
  );
}

const profileSavedAddressesHref = "/public/profile#saved-addresses";

const addressToolbarLinkClass =
  "inline-flex items-center justify-center rounded-xl border border-teal/35 bg-teal/10 px-3.5 py-2 text-xs font-semibold text-teal shadow-sm transition hover:border-teal/50 hover:bg-teal/15";

const STEP_NAV_LABELS: Record<BookCourierStep, string> = {
  1: "Route",
  2: "Pickup",
  3: "Delivery",
  4: "Parcel",
};

const radioCardClass =
  "flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border-strong/70 bg-canvas/25 p-4 transition has-checked:border-teal/50 has-checked:bg-teal/[0.07] has-checked:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-teal)_18%,transparent)] dark:has-checked:bg-teal/10";

export function BookCourierForm() {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<BookCourierState>(initial);
  const [step, setStep] = useState<BookCourierStep>(1);
  const [copiedRef, setCopiedRef] = useState(false);
  const [pickupTimeSlotValue, setPickupTimeSlotValue] = useState("");
  const [addressBook, setAddressBook] = useState<{
    sender: SavedAddress | null;
    recipient: SavedAddress | null;
  }>({ sender: null, recipient: null });
  const [addressHint, setAddressHint] = useState<string>("");
  const [senderCountryLive, setSenderCountryLive] = useState("");
  const [senderStateLive, setSenderStateLive] = useState("");
  const [recipientCountryLive, setRecipientCountryLive] = useState("");
  const [recipientStateLive, setRecipientStateLive] = useState("");
  /** Mirrors “Number of parcels” for step 4 (one field group per parcel). */
  const [parcelSlots, setParcelSlots] = useState(1);
  const todayDate = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();
  const formRef = useRef<HTMLFormElement | null>(null);
  const stepTopRef = useRef<HTMLDivElement | null>(null);
  const skipStepScrollRef = useRef(true);
  const e = state.fieldErrors;

  const stepPanelCls = (s: BookCourierStep) =>
    `book-step-panel space-y-4 p-5 sm:p-6 ${step === s ? "" : "hidden"}`;

  useEffect(() => {
    if (skipStepScrollRef.current) {
      skipStepScrollRef.current = false;
      return;
    }
    const el = stepTopRef.current;
    if (!el) return;
    el.scrollIntoView({
      behavior: reduceMotion ? "instant" : "smooth",
      block: "start",
    });
  }, [step, reduceMotion]);

  function goToStep(target: BookCourierStep) {
    if (target >= step) return;
    setState((prev) => ({ ...prev, message: "", fieldErrors: {} }));
    setStep(target);
  }

  async function copyBookingReference() {
    const ref = state.bookingReference?.trim();
    if (!ref || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      window.setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      setCopiedRef(false);
    }
  }
  const stepMeta: Record<BookCourierStep, { title: string; note: string }> = {
    1: { title: "Parcels & route", note: "Countries, route, and pickup time." },
    2: { title: "Sender", note: "Pickup contact and address." },
    3: { title: "Recipient", note: "Delivery contact and address." },
    4: { title: "Parcels", note: "Per-box contents, weight, and submit." },
  };

  const countryOptionsWithValue = (current: string) => {
    const c = current.trim();
    if (c && !COUNTRY_OPTIONS.includes(c)) return [...COUNTRY_OPTIONS, c];
    return COUNTRY_OPTIONS;
  };

  const reloadAddressBook = useCallback(() => {
    getAddressBookApi().then((res) => {
      if (res.ok) setAddressBook(res.addressBook);
    });
  }, []);

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

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") reloadAddressBook();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reloadAddressBook]);

  const setFormValue = useCallback((name: string, value: string) => {
    if (!formRef.current) return;
    const el = formRef.current.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | null;
    if (!el) return;
    el.value = value;
  }, []);

  useEffect(() => {
    const postal = String(searchParams.get("postal") ?? "").trim();
    if (!postal) return;
    setFormValue("senderPostal", postal.slice(0, 32));
  }, [searchParams, setFormValue]);

  useEffect(() => {
    if (step !== 4 || !formRef.current) return;
    const form = formRef.current;
    queueMicrotask(() => {
      if (!form) return;
      const fd = new FormData(form);
      const n = Math.min(
        99,
        Math.max(1, parseInt(String(fd.get("parcelCount") ?? "1"), 10) || 1),
      );
      setParcelSlots(n);
    });
  }, [step]);

  useEffect(() => {
    if (step !== 2 || !formRef.current) return;
    const form = formRef.current;
    queueMicrotask(() => {
      if (!form) return;
      const fd = new FormData(form);
      const hint = String(fd.get("pickupCountryHint") ?? "").trim();
      let country = String(fd.get("senderCountry") ?? "").trim();
      if (!country && hint) country = hint;
      setSenderCountryLive((prev) => country || prev);
      setSenderStateLive(String(fd.get("senderState") ?? "").trim());
      const cityHint = String(fd.get("pickupCityHint") ?? "").trim();
      const senderCity = String(fd.get("senderCity") ?? "").trim();
      if (cityHint && !senderCity) setFormValue("senderCity", cityHint);
    });
  }, [step, setFormValue]);

  useEffect(() => {
    if (step !== 3 || !formRef.current) return;
    const form = formRef.current;
    queueMicrotask(() => {
      if (!form) return;
      const fd = new FormData(form);
      const hint = String(fd.get("deliveryCountryHint") ?? "").trim();
      let country = String(fd.get("recipientCountry") ?? "").trim();
      if (!country && hint) country = hint;
      setRecipientCountryLive((prev) => country || prev);
      setRecipientStateLive(String(fd.get("recipientState") ?? "").trim());
      const cityHint = String(fd.get("deliveryCityHint") ?? "").trim();
      const recipientCity = String(fd.get("recipientCity") ?? "").trim();
      if (cityHint && !recipientCity) setFormValue("recipientCity", cityHint);
    });
  }, [step, setFormValue]);

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
    if (kind === "sender") {
      setSenderCountryLive(saved.country);
      setSenderStateLive(saved.state ?? "");
    } else {
      setRecipientCountryLive(saved.country);
      setRecipientStateLive(saved.state ?? "");
    }
    setAddressHint(`Saved ${kind} address applied.`);
  };

  const saveCurrentAddress = async (kind: "sender" | "recipient") => {
    if (!formRef.current) return;
    const row = bookCourierRowFromFormData(new FormData(formRef.current));
    const phoneRaw = kind === "sender" ? row.senderPhone : row.recipientPhone;
    const phoneDigits = phoneRaw.replace(/\D/g, "").slice(0, 15);
    const stateRaw = (kind === "sender" ? row.senderState : row.recipientState).trim();
    const draft: SavedAddress = {
      name: kind === "sender" ? row.senderName : row.recipientName,
      email: kind === "sender" ? row.senderEmail : row.recipientEmail,
      phone: phoneDigits,
      street: kind === "sender" ? row.senderStreet : row.recipientStreet,
      city: kind === "sender" ? row.senderCity : row.recipientCity,
      ...(stateRaw ? { state: stateRaw } : {}),
      postal: kind === "sender" ? row.senderPostal : row.recipientPostal,
      country: kind === "sender" ? row.senderCountry : row.recipientCountry,
    };
    if (
      !draft.name ||
      !draft.email ||
      phoneDigits.length < 7 ||
      !draft.street ||
      !draft.city ||
      !draft.postal ||
      !draft.country
    ) {
      setAddressHint(`Please fill ${kind} fields before saving (phone 7–15 digits).`);
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
      setPickupTimeSlotValue("");
      setSenderCountryLive("");
      setSenderStateLive("");
      setRecipientCountryLive("");
      setRecipientStateLive("");
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
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4 sm:space-y-5" noValidate>
      <datalist id="booking-country-options">
        {COUNTRY_OPTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div
        ref={stepTopRef}
        className="book-step-panel overflow-hidden p-4 sm:p-5"
      >
        <nav aria-label="Booking steps">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-soft">
            Step {step} of 4
          </p>
          <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-ink sm:text-xl">
            {stepMeta[step].title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{stepMeta[step].note}</p>
          <ol className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
            {([1, 2, 3, 4] as const).map((n) => {
              const done = step > n;
              const current = step === n;
              const canJumpBack = n < step;
              return (
                <li key={n} className="min-w-0">
                  <button
                    type="button"
                    disabled={n >= step}
                    onClick={() => n < step && goToStep(n)}
                    aria-current={current ? "step" : undefined}
                    title={
                      canJumpBack
                        ? `Go back to ${STEP_NAV_LABELS[n]}`
                        : current
                          ? `Current: ${STEP_NAV_LABELS[n]}`
                          : "Complete previous steps first"
                    }
                    className={`flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition sm:py-2.5 ${
                      current
                        ? "bg-teal/15 ring-2 ring-teal/40"
                        : done
                          ? "bg-canvas/40 hover:bg-teal/10"
                          : "cursor-not-allowed opacity-45"
                    } ${canJumpBack ? "cursor-pointer hover:ring-1 hover:ring-teal/25" : ""}`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:h-10 sm:w-10 sm:text-sm ${
                        done
                          ? "bg-teal text-slate-950"
                          : current
                            ? "bg-teal/25 text-teal"
                            : "bg-border-strong/40 text-muted-soft"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2.5} aria-hidden /> : n}
                    </span>
                    <span className="w-full truncate text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">
                      {STEP_NAV_LABELS[n]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-strong/40 sm:mt-4">
            <div
              className="h-full rounded-full bg-teal transition-[width] duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </nav>
      </div>

      <fieldset className={stepPanelCls(1)}>
        <legend className="font-display text-base font-semibold text-ink px-1">
          Step 1: Parcels &amp; route
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="parcelCount" className="text-sm font-medium text-ink">
              Number of parcels
            </label>
            <input
              id="parcelCount"
              name="parcelCount"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              defaultValue={1}
              className={`${authFieldClass} mt-1.5 w-full max-w-[12rem]`}
              aria-invalid={Boolean(e.parcelCount)}
              aria-describedby={e.parcelCount ? "parcelCount-err" : undefined}
            />
            <Err id="parcelCount-err" msg={e.parcelCount} />
          </div>
          <div>
            <label htmlFor="pickupCountryHint" className="text-sm font-medium text-ink">
              Pickup country
            </label>
            <input
              id="pickupCountryHint"
              name="pickupCountryHint"
              type="text"
              list="booking-country-options"
              autoComplete="country-name"
              placeholder="Where we collect"
              className={`${authFieldClass} mt-1.5 w-full`}
              aria-invalid={Boolean(e.pickupCountryHint)}
              aria-describedby={e.pickupCountryHint ? "pickupCountryHint-err" : undefined}
            />
            <Err id="pickupCountryHint-err" msg={e.pickupCountryHint} />
          </div>
          <div>
            <label htmlFor="pickupCityHint" className="text-sm font-medium text-ink">
              Pickup city
            </label>
            <input
              id="pickupCityHint"
              name="pickupCityHint"
              type="text"
              autoComplete="address-level2"
              placeholder="City we collect from"
              className={`${authFieldClass} mt-1.5 w-full`}
              aria-invalid={Boolean(e.pickupCityHint)}
              aria-describedby={e.pickupCityHint ? "pickupCityHint-err" : undefined}
            />
            <Err id="pickupCityHint-err" msg={e.pickupCityHint} />
          </div>
          <div>
            <label htmlFor="deliveryCountryHint" className="text-sm font-medium text-ink">
              Delivery country
            </label>
            <input
              id="deliveryCountryHint"
              name="deliveryCountryHint"
              type="text"
              list="booking-country-options"
              autoComplete="country-name"
              placeholder="Where it arrives"
              className={`${authFieldClass} mt-1.5 w-full`}
              aria-invalid={Boolean(e.deliveryCountryHint)}
              aria-describedby={e.deliveryCountryHint ? "deliveryCountryHint-err" : undefined}
            />
            <Err id="deliveryCountryHint-err" msg={e.deliveryCountryHint} />
          </div>
          <div>
            <label htmlFor="deliveryCityHint" className="text-sm font-medium text-ink">
              Delivery city
            </label>
            <input
              id="deliveryCityHint"
              name="deliveryCityHint"
              type="text"
              autoComplete="address-level2"
              placeholder="City it arrives in"
              className={`${authFieldClass} mt-1.5 w-full`}
              aria-invalid={Boolean(e.deliveryCityHint)}
              aria-describedby={e.deliveryCityHint ? "deliveryCityHint-err" : undefined}
            />
            <Err id="deliveryCityHint-err" msg={e.deliveryCityHint} />
          </div>
        </div>
        <div className="border-t border-border-strong/40 pt-5">
          <p className="mb-3 text-sm font-semibold text-ink">Route type</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <label className={radioCardClass}>
              <input
                type="radio"
                name="routeType"
                value="domestic"
                className="mt-0.5 h-4 w-4 shrink-0 border-border-strong text-teal focus:ring-teal/40"
              />
              <span className="text-sm font-medium text-ink">Domestic</span>
            </label>
            <label className={radioCardClass}>
              <input
                type="radio"
                name="routeType"
                value="international"
                className="mt-0.5 h-4 w-4 shrink-0 border-border-strong text-teal focus:ring-teal/40"
              />
              <span className="text-sm font-medium text-ink">International</span>
            </label>
          </div>
          <Err id="routeType-err" msg={e.routeType} />
        </div>
      </fieldset>

      <fieldset className={stepPanelCls(1)}>
        <legend className="font-display text-base font-semibold text-ink px-1">
          Collection at your Postal Code / ZIP / address
        </legend>
        <p className="text-sm text-muted">
          Instant uses your postal code; scheduled needs date and time.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <label className={radioCardClass}>
            <input
              type="radio"
              name="collectionMode"
              value="instant"
              defaultChecked
              className="mt-0.5 h-4 w-4 shrink-0 border-border-strong text-teal focus:ring-teal/40"
            />
            <span className="text-sm font-medium text-ink">
              Instant collection (Postal Code / ZIP)
            </span>
          </label>
          <label className={radioCardClass}>
            <input
              type="radio"
              name="collectionMode"
              value="scheduled"
              className="mt-0.5 h-4 w-4 shrink-0 border-border-strong text-teal focus:ring-teal/40"
            />
            <span className="text-sm font-medium text-ink">
              Schedule date &amp; time (Postal Code / ZIP)
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
              min={todayDate}
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
              value={pickupTimeSlotValue}
              onChange={(event) => setPickupTimeSlotValue(event.target.value)}
            >
              <option value="">Select a slot</option>
              <option value="Any time (24/7)">Any time (24/7)</option>
              <option value="00:00-06:00">00:00-06:00</option>
              <option value="06:00-12:00">06:00-12:00</option>
              <option value="12:00-18:00">12:00-18:00</option>
              <option value="18:00-24:00">18:00-24:00</option>
              <option value="00:00-02:00">00:00-02:00</option>
              <option value="02:00-04:00">02:00-04:00</option>
              <option value="04:00-06:00">04:00-06:00</option>
              <option value="06:00-08:00">06:00-08:00</option>
              <option value="08:00-10:00">08:00-10:00</option>
              <option value="10:00-12:00">10:00-12:00</option>
              <option value="12:00-14:00">12:00-14:00</option>
              <option value="14:00-16:00">14:00-16:00</option>
              <option value="16:00-18:00">16:00-18:00</option>
              <option value="18:00-20:00">18:00-20:00</option>
              <option value="20:00-22:00">20:00-22:00</option>
              <option value="22:00-24:00">22:00-24:00</option>
              <option value="custom">Custom time</option>
            </select>
            <Err id="pickupTimeSlot-err" msg={e.pickupTimeSlot} />
            {pickupTimeSlotValue === "custom" ? (
              <>
                <label
                  htmlFor="pickupTimeSlotCustom"
                  className="mt-3 block text-sm font-medium text-ink"
                >
                  Custom pickup time
                </label>
                <input
                  id="pickupTimeSlotCustom"
                  name="pickupTimeSlotCustom"
                  type="text"
                  placeholder="e.g. 11:30 PM to 12:30 AM"
                  className={`${authFieldClass} mt-2`}
                  aria-invalid={Boolean(e.pickupTimeSlotCustom)}
                  aria-describedby={
                    e.pickupTimeSlotCustom ? "pickupTimeSlotCustom-err" : undefined
                  }
                />
                <Err id="pickupTimeSlotCustom-err" msg={e.pickupTimeSlotCustom} />
              </>
            ) : null}
          </div>
        </div>
        <Err id="collectionMode-err" msg={e.collectionMode} />
      </fieldset>

      <fieldset className={stepPanelCls(2)}>
        <legend className="font-display text-base font-semibold text-ink px-1">
          Step 2: Sender &amp; pickup
        </legend>
        <div className="flex flex-col gap-3 rounded-xl border border-border-strong/50 bg-canvas/20 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applySavedAddress("sender")}
              className="rounded-xl border border-border-strong bg-surface-elevated/60 px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!addressBook.sender}
            >
              Use saved sender
            </button>
            <button
              type="button"
              onClick={() => void saveCurrentAddress("sender")}
              className="rounded-xl border border-border-strong bg-surface-elevated/60 px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              Save sender address
            </button>
          </div>
          <Link href={profileSavedAddressesHref} prefetch={false} className={addressToolbarLinkClass}>
            Edit saved addresses
          </Link>
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
              value={senderCountryLive}
              onChange={(ev) => {
                const v = ev.target.value;
                setSenderCountryLive(v);
                const ro = getRegionOptionsForCountry(v);
                if (ro?.length) {
                  setSenderStateLive((prev) =>
                    prev && ro.includes(prev) ? prev : "",
                  );
                }
              }}
            >
              <option value="">Select pickup country</option>
              {countryOptionsWithValue(senderCountryLive).map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <Err id="senderCountry-err" msg={e.senderCountry} />
          </div>
          <div>
            <label htmlFor="senderState" className="text-sm font-medium text-ink">
              State / province
            </label>
            <RegionFieldByCountry
              id="senderState"
              name="senderState"
              country={senderCountryLive}
              value={senderStateLive}
              onChange={setSenderStateLive}
              errorMsg={e.senderState}
              autoComplete="address-level1"
            />
            <Err id="senderState-err" msg={e.senderState} />
          </div>
          <div>
            <label htmlFor="senderPostal" className="text-sm font-medium text-ink">
              Postal Code / ZIP <span className="text-teal">*</span>
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
        </div>
      </fieldset>

      <fieldset className={stepPanelCls(3)}>
        <legend className="font-display text-base font-semibold text-ink px-1">
          Step 3: Recipient &amp; delivery
        </legend>
        <div className="flex flex-col gap-3 rounded-xl border border-border-strong/50 bg-canvas/20 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applySavedAddress("recipient")}
              className="rounded-xl border border-border-strong bg-surface-elevated/60 px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!addressBook.recipient}
            >
              Use saved recipient
            </button>
            <button
              type="button"
              onClick={() => void saveCurrentAddress("recipient")}
              className="rounded-xl border border-border-strong bg-surface-elevated/60 px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover"
            >
              Save recipient address
            </button>
          </div>
          <Link href={profileSavedAddressesHref} prefetch={false} className={addressToolbarLinkClass}>
            Edit saved addresses
          </Link>
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
              value={recipientCountryLive}
              onChange={(ev) => {
                const v = ev.target.value;
                setRecipientCountryLive(v);
                const ro = getRegionOptionsForCountry(v);
                if (ro?.length) {
                  setRecipientStateLive((prev) =>
                    prev && ro.includes(prev) ? prev : "",
                  );
                }
              }}
            >
              <option value="">Select delivery country</option>
              {countryOptionsWithValue(recipientCountryLive).map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <Err id="recipientCountry-err" msg={e.recipientCountry} />
          </div>
          <div>
            <label
              htmlFor="recipientState"
              className="text-sm font-medium text-ink"
            >
              State / province
            </label>
            <RegionFieldByCountry
              id="recipientState"
              name="recipientState"
              country={recipientCountryLive}
              value={recipientStateLive}
              onChange={setRecipientStateLive}
              errorMsg={e.recipientState}
              autoComplete="shipping address-level1"
            />
            <Err id="recipientState-err" msg={e.recipientState} />
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
        </div>
      </fieldset>

      <fieldset className={stepPanelCls(4)}>
        <legend className="font-display text-base font-semibold text-ink px-1">
          Step 4: Parcel details
        </legend>
        <p className="text-sm text-muted">
          You chose <span className="font-medium text-ink">{parcelSlots}</span> parcel
          {parcelSlots === 1 ? "" : "s"} in step 1 — fill each box below. Total weight we use is the sum of
          all parcels.
        </p>
        <div className="space-y-6">
          {Array.from({ length: parcelSlots }, (_, i) => {
            const pContents = e[`parcel_${i}_contentsDescription`];
            const pWeight = e[`parcel_${i}_weightKg`];
            const pLen = e[`parcel_${i}_lengthCm`];
            const pWid = e[`parcel_${i}_widthCm`];
            const pHt = e[`parcel_${i}_heightCm`];
            return (
              <div
                key={i}
                className="rounded-2xl border border-border-strong/80 bg-canvas/20 p-4 sm:p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-teal">
                  Parcel {i + 1} of {parcelSlots}
                </p>
                <div className="mt-3">
                  <label
                    htmlFor={`parcel_${i}_contentsDescription`}
                    className="text-sm font-medium text-ink"
                  >
                    Contents description <span className="text-teal">*</span>
                  </label>
                  <textarea
                    id={`parcel_${i}_contentsDescription`}
                    name={`parcel_${i}_contentsDescription`}
                    rows={3}
                    placeholder="e.g. Commercial samples, clothing — for customs"
                    className={authFieldClass}
                    aria-invalid={Boolean(pContents)}
                    aria-describedby={pContents ? `parcel_${i}_contents-err` : undefined}
                  />
                  <Err id={`parcel_${i}_contents-err`} msg={pContents} />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`parcel_${i}_weightKg`}
                      className="text-sm font-medium text-ink"
                    >
                      Weight (kg) <span className="text-teal">*</span>
                    </label>
                    <input
                      id={`parcel_${i}_weightKg`}
                      name={`parcel_${i}_weightKg`}
                      inputMode="decimal"
                      placeholder="e.g. 2.5"
                      className={authFieldClass}
                      aria-invalid={Boolean(pWeight)}
                      aria-describedby={pWeight ? `parcel_${i}_weight-err` : undefined}
                    />
                    <Err id={`parcel_${i}_weight-err`} msg={pWeight} />
                  </div>
                  <div>
                    <label
                      htmlFor={`parcel_${i}_declaredValue`}
                      className="text-sm font-medium text-ink"
                    >
                      Declared value (optional)
                    </label>
                    <input
                      id={`parcel_${i}_declaredValue`}
                      name={`parcel_${i}_declaredValue`}
                      placeholder="e.g. USD 150"
                      className={authFieldClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm font-medium text-ink">
                      L × W × H (cm, optional)
                    </span>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <input
                        name={`parcel_${i}_lengthCm`}
                        placeholder="L"
                        inputMode="numeric"
                        className={authInputClass}
                        aria-invalid={Boolean(pLen)}
                        aria-describedby={pLen ? `parcel_${i}_len-err` : undefined}
                      />
                      <input
                        name={`parcel_${i}_widthCm`}
                        placeholder="W"
                        inputMode="numeric"
                        className={authInputClass}
                        aria-invalid={Boolean(pWid)}
                        aria-describedby={pWid ? `parcel_${i}_wid-err` : undefined}
                      />
                      <input
                        name={`parcel_${i}_heightCm`}
                        placeholder="H"
                        inputMode="numeric"
                        className={authInputClass}
                        aria-invalid={Boolean(pHt)}
                        aria-describedby={pHt ? `parcel_${i}_ht-err` : undefined}
                      />
                    </div>
                    <Err id={`parcel_${i}_len-err`} msg={pLen} />
                    <Err id={`parcel_${i}_wid-err`} msg={pWid} />
                    <Err id={`parcel_${i}_ht-err`} msg={pHt} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={stepPanelCls(4)}>
        <legend className="font-display text-base font-semibold text-ink px-1">
          Pickup timing &amp; notes
        </legend>
        <p className="text-sm text-muted">Window or notes for the courier.</p>
        <div>
          <label
            htmlFor="pickupPreference"
            className="text-sm font-medium text-ink"
          >
            Pickup window or notes
            <span className="block text-xs font-normal text-muted">
              Required for scheduled; optional for instant (ASAP at your ZIP).
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
        className={`book-step-panel border-amber-500/20 bg-amber-500/[0.07] p-5 dark:bg-amber-500/10 ${
          step === 4 ? "" : "hidden"
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

      <div className="mt-8 flex flex-col-reverse gap-3 sm:mt-10 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setState((prev) => ({ ...prev, message: "", fieldErrors: {} }));
              setStep((prev) => (prev - 1) as BookCourierStep);
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-border-strong bg-canvas/40 px-5 py-3.5 text-sm font-semibold text-ink transition hover:border-teal/35 hover:bg-pill-hover"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Back
          </button>
        ) : (
          <span className="hidden min-h-0 sm:block" aria-hidden />
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={() => onNextStep((step + 1) as BookCourierStep)}
            className="btn-primary min-h-12 w-full rounded-2xl border border-teal/70 bg-teal py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/25 transition hover:bg-teal/90 sm:justify-self-end"
          >
            Continue
          </button>
        ) : (
          <motion.button
            type="submit"
            disabled={pending}
            whileHover={{ scale: pending ? 1 : 1.01 }}
            whileTap={{ scale: pending ? 1 : 0.99 }}
            className="btn-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-teal/70 bg-teal py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/25 transition hover:bg-teal/90 disabled:opacity-60 sm:justify-self-end"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Submitting…
              </>
            ) : (
              "Submit booking"
            )}
          </motion.button>
        )}
      </div>

      {state.ok && state.message ? (
        <motion.div
          className="rounded-2xl border border-teal/30 bg-linear-to-br from-teal/15 via-teal/8 to-canvas/30 p-5 shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--color-teal)_25%,transparent)] sm:p-6"
          role="status"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-display text-base font-semibold text-ink">{state.message}</p>
          {state.bookingReference ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border-strong/60 bg-canvas/40 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
                  Your booking reference
                </p>
                <p className="mt-1 break-all font-mono text-sm font-medium text-ink">
                  {state.bookingReference}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => void copyBookingReference()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated/70 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/40"
                >
                  {copiedRef ? (
                    <>
                      <Check className="h-4 w-4 text-teal" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 opacity-80" aria-hidden />
                      Copy reference
                    </>
                  )}
                </button>
                <Link
                  href={`/public/tsking?reference=${encodeURIComponent(state.bookingReference)}`}
                  prefetch={false}
                  className="btn-primary inline-flex items-center justify-center rounded-xl border border-teal/70 bg-teal px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-teal/20"
                >
                  Track this shipment
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-teal/30 hover:text-ink"
                  onClick={() => {
                    formRef.current?.reset();
                    setPickupTimeSlotValue("");
                    setSenderCountryLive("");
                    setSenderStateLive("");
                    setRecipientCountryLive("");
                    setRecipientStateLive("");
                    setCopiedRef(false);
                    setState(initial);
                    setStep(1);
                  }}
                >
                  Book another
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      ) : null}
      {addressHint ? (
        <p className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-xs leading-relaxed text-muted sm:text-sm">
          {addressHint}
        </p>
      ) : null}
      {!state.ok && state.message ? (
        <p
          className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-4 text-sm text-rose-700 dark:text-rose-200"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
