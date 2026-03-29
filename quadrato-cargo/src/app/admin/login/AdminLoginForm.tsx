"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api/base-url";

type AdminLoginState = { ok: boolean; message: string };
const initial: AdminLoginState = { ok: true, message: "" };

export function AdminLoginForm() {
  const [state, setState] = useState<AdminLoginState>(initial);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setPending(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setState({
          ok: false,
          message: data.message || "Invalid admin credentials.",
        });
      } else {
        setState({ ok: true, message: "Login successful. Redirecting..." });
        window.location.assign("/admin/dashboard");
      }
    } catch {
      setState({
        ok: false,
        message: "Unable to reach admin server. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="admin-email" className="text-sm font-medium text-ink">
          Admin email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="admin@yourcompany.com"
          className="mt-2 w-full rounded-xl border border-ghost-border bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-muted-soft/70 focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-xl border border-ghost-border bg-canvas/60 px-4 py-3 text-sm text-ink focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>
      {!state.ok && state.message ? (
        <p className="text-sm text-rose-400" role="alert">
          {state.message}
        </p>
      ) : null}
      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ scale: pending ? 1 : 1.01 }}
        whileTap={{ scale: pending ? 1 : 0.99 }}
        className="w-full rounded-xl border border-teal/70 bg-teal py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal/90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in to admin"}
      </motion.button>
    </form>
  );
}
