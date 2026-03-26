"use client";

import { motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { postContactApi } from "@/lib/api/public-client";

const serviceOptions = [
  { value: "", label: "Select…" },
  { value: "same-day", label: "Same-day / rush" },
  { value: "scheduled", label: "Scheduled routes" },
  { value: "cargo", label: "Cargo / pallets" },
  { value: "intercity", label: "Inter-city linehaul" },
  { value: "other", label: "Other / not sure" },
];

const fieldClass =
  "mt-2 w-full rounded-2xl border border-border-strong bg-canvas/50 px-4 py-3 text-sm text-ink placeholder:text-muted-soft/70 shadow-inner transition focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/25";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{
    ok: boolean;
    message: string;
    fieldErrors: Partial<
      Record<"name" | "email" | "message" | "service", string>
    >;
  }>({ ok: false, message: "", fieldErrors: {} });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const phoneRaw = String(fd.get("phone") ?? "").trim();
    setPending(true);
    setState({ ok: false, message: "", fieldErrors: {} });

    const result = await postContactApi({
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: phoneRaw || undefined,
      service: String(fd.get("service") ?? ""),
      message: String(fd.get("message") ?? "").trim(),
    });

    setPending(false);
    if (result.ok) {
      setState({ ok: true, message: result.message, fieldErrors: {} });
      form.reset();
    } else {
      setState({
        ok: false,
        message: result.message,
        fieldErrors: result.fieldErrors,
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink">
          Name <span className="text-teal">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={fieldClass}
          aria-invalid={Boolean(state.fieldErrors.name)}
          aria-describedby={state.fieldErrors.name ? "name-error" : undefined}
        />
        {state.fieldErrors.name ? (
          <p id="name-error" className="mt-1 text-sm text-rose-400" role="alert">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          Email <span className="text-teal">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
          aria-invalid={Boolean(state.fieldErrors.email)}
          aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
        />
        {state.fieldErrors.email ? (
          <p id="email-error" className="mt-1 text-sm text-rose-400" role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-ink">
          Phone <span className="text-muted">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium text-ink">
          Service interest <span className="text-teal">*</span>
        </label>
        <select
          id="service"
          name="service"
          required
          className={fieldClass}
          aria-invalid={Boolean(state.fieldErrors.service)}
          aria-describedby={
            state.fieldErrors.service ? "service-error" : undefined
          }
          defaultValue=""
        >
          {serviceOptions.map((o) => (
            <option key={o.value || "empty"} value={o.value} disabled={o.value === ""}>
              {o.label}
            </option>
          ))}
        </select>
        {state.fieldErrors.service ? (
          <p id="service-error" className="mt-1 text-sm text-rose-400" role="alert">
            {state.fieldErrors.service}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink">
          Message <span className="text-teal">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={fieldClass}
          aria-invalid={Boolean(state.fieldErrors.message)}
          aria-describedby={
            state.fieldErrors.message ? "message-error" : undefined
          }
        />
        {state.fieldErrors.message ? (
          <p id="message-error" className="mt-1 text-sm text-rose-400" role="alert">
            {state.fieldErrors.message}
          </p>
        ) : null}
      </div>

      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ scale: pending ? 1 : 1.02 }}
        whileTap={{ scale: pending ? 1 : 0.98 }}
        className="btn-primary inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-accent-deep via-accent to-accent-hover px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Sending…" : "Send message"}
      </motion.button>

      {state.ok && state.message ? (
        <motion.p
          className="text-sm font-medium text-teal"
          role="status"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {state.message}
        </motion.p>
      ) : null}
      {!state.ok && state.message ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
