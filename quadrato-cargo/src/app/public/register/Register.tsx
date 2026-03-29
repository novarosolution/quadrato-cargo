"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { authFieldClass } from "@/components/auth/authStyles";
import { emailLocalMinPattern, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { postRegisterApi } from "@/lib/api/auth-client";
type RegisterState = {
  ok: boolean;
  message: string;
  fieldErrors: Partial<
    Record<"name" | "email" | "password" | "confirmPassword", string>
  >;
};

const initial: RegisterState = {
  ok: false,
  message: "",
  fieldErrors: {},
};

export function RegisterForm({ redirectTo = "/public/profile" }: { redirectTo?: string }) {
  const [state, setState] = useState<RegisterState>(initial);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
    };

    setPending(true);
    const result = await postRegisterApi(body);
    if (result.ok) {
      setState({
        ok: true,
        message: result.message,
        fieldErrors: {},
      });
      window.location.assign(redirectTo);
    } else {
      setState({
        ok: false,
        message: result.message,
        fieldErrors: result.fieldErrors,
      });
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label htmlFor="reg-name" className="text-sm font-medium text-ink">
          Full name <span className="text-teal">*</span>
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={8}
          maxLength={120}
          className={authFieldClass}
          aria-invalid={Boolean(state.fieldErrors.name)}
          aria-describedby={state.fieldErrors.name ? "reg-name-err" : undefined}
        />
        {state.fieldErrors.name ? (
          <p id="reg-name-err" className="mt-1 text-sm text-rose-400" role="alert">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="reg-email" className="text-sm font-medium text-ink">
          Email <span className="text-teal">*</span>
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          pattern={emailLocalMinPattern.source}
          title="Email must have at least 5 characters before @."
          maxLength={320}
          required
          className={authFieldClass}
          aria-invalid={Boolean(state.fieldErrors.email)}
          aria-describedby={state.fieldErrors.email ? "reg-email-err" : undefined}
        />
        {state.fieldErrors.email ? (
          <p id="reg-email-err" className="mt-1 text-sm text-rose-400" role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="reg-password" className="text-sm font-medium text-ink">
          Password <span className="text-teal">*</span>
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={72}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}"
          title="Use 8-72 chars with uppercase, lowercase, number, and special character."
          required
          className={authFieldClass}
          aria-invalid={Boolean(state.fieldErrors.password)}
          aria-describedby={
            state.fieldErrors.password ? "reg-password-err" : undefined
          }
        />
        {state.fieldErrors.password ? (
          <p
            id="reg-password-err"
            className="mt-1 text-sm text-rose-400"
            role="alert"
          >
            {state.fieldErrors.password}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-soft">
            Minimum {MIN_PASSWORD_LENGTH} characters with uppercase and special character.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="reg-confirm"
          className="text-sm font-medium text-ink"
        >
          Confirm password <span className="text-teal">*</span>
        </label>
        <input
          id="reg-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={72}
          required
          className={authFieldClass}
          aria-invalid={Boolean(state.fieldErrors.confirmPassword)}
          aria-describedby={
            state.fieldErrors.confirmPassword ? "reg-confirm-err" : undefined
          }
        />
        {state.fieldErrors.confirmPassword ? (
          <p
            id="reg-confirm-err"
            className="mt-1 text-sm text-rose-400"
            role="alert"
          >
            {state.fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ scale: pending ? 1 : 1.02 }}
        whileTap={{ scale: pending ? 1 : 0.98 }}
        className="btn-primary w-full rounded-2xl border border-teal/70 bg-teal py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal/25 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </motion.button>

      {!state.ok && state.message ? (
        <p
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      {state.ok && state.message ? (
        <motion.p
          className="rounded-2xl border border-teal/25 bg-teal/10 px-4 py-3 text-sm text-teal"
          role="status"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {state.message}
        </motion.p>
      ) : null}

      <p className="text-center text-sm text-muted">
        Already registered?{" "}
        <Link
          href="/public/login"
          className="font-semibold text-teal underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
