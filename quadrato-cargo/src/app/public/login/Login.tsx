"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { authFieldClass } from "@/components/auth/authStyles";
import { emailLocalMinPattern } from "@/lib/auth-validation";
import { postLoginApi } from "@/lib/api/auth-client";

type LoginState = {
  ok: boolean;
  message: string;
  fieldErrors: Partial<Record<"email" | "password", string>>;
};

const initial: LoginState = {
  ok: false,
  message: "",
  fieldErrors: {},
};

export function LoginForm({
  callbackError,
  redirectTo = "/public/profile",
}: {
  callbackError?: string;
  redirectTo?: string;
}) {
  const [state, setState] = useState<LoginState>(initial);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    };

    setPending(true);
    const result = await postLoginApi(body);
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
      {callbackError ? (
        <p
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          role="alert"
        >
          {callbackError}
        </p>
      ) : null}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <label htmlFor="login-email" className="text-sm font-medium text-ink">
          Email <span className="text-teal">*</span>
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          pattern={emailLocalMinPattern.source}
          title="Email must have at least 5 characters before @."
          maxLength={320}
          required
          className={authFieldClass}
          aria-invalid={Boolean(state.fieldErrors.email)}
          aria-describedby={state.fieldErrors.email ? "login-email-err" : undefined}
        />
        {state.fieldErrors.email ? (
          <p id="login-email-err" className="mt-1 text-sm text-rose-400" role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="login-password" className="text-sm font-medium text-ink">
            Password <span className="text-teal">*</span>
          </label>
          <Link
            href="/public/contact"
            className="text-xs font-medium text-teal underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          maxLength={72}
          required
          className={authFieldClass}
          aria-invalid={Boolean(state.fieldErrors.password)}
          aria-describedby={
            state.fieldErrors.password ? "login-password-err" : undefined
          }
        />
        {state.fieldErrors.password ? (
          <p
            id="login-password-err"
            className="mt-1 text-sm text-rose-400"
            role="alert"
          >
            {state.fieldErrors.password}
          </p>
        ) : null}
      </motion.div>

      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ scale: pending ? 1 : 1.02 }}
        whileTap={{ scale: pending ? 1 : 0.98 }}
        className="btn-primary w-full rounded-2xl bg-gradient-to-r from-accent-deep via-accent to-accent-hover py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Log in"}
      </motion.button>

      {!state.ok && state.message ? (
        <motion.p
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          role="alert"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {state.message}
        </motion.p>
      ) : null}

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link
          href={`/public/register?callbackUrl=${encodeURIComponent(redirectTo)}`}
          className="font-semibold text-teal underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
