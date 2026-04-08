"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUpstreamBaseUrl } from "@/lib/api/base-url";

const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || "qc_admin_auth";

export type AdminLoginState = {
  ok: boolean;
  message: string;
};

/**
 * Copy Set-Cookie headers from the Express login response onto the Next.js response.
 * Domain is omitted so the session is scoped to the site the browser is using.
 */
function parseAndApplySetCookies(
  res: Response,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): void {
  const list =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const part of list) {
    const segments = part.split(";").map((s) => s.trim());
    const nv = segments[0];
    if (!nv) continue;
    const eq = nv.indexOf("=");
    if (eq === -1) continue;
    const name = nv.slice(0, eq).trim();
    let value = nv.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    try {
      value = decodeURIComponent(value);
    } catch {
      /* keep raw */
    }
    const options: {
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      maxAge?: number;
      sameSite?: "lax" | "strict" | "none";
    } = { path: "/" };
    for (let i = 1; i < segments.length; i++) {
      const a = segments[i];
      const al = a.toLowerCase();
      if (al === "httponly") options.httpOnly = true;
      else if (al === "secure") options.secure = true;
      else if (al.startsWith("max-age=")) {
        const n = Number.parseInt(al.slice(8).trim(), 10);
        if (Number.isFinite(n)) options.maxAge = n;
      } else if (al.startsWith("samesite=")) {
        const v = al.slice(9).trim().toLowerCase();
        if (v === "lax" || v === "strict" || v === "none") options.sameSite = v;
      } else if (al.startsWith("path=")) {
        options.path = a.slice(5).trim() || "/";
      }
    }
    cookieStore.set(name, value, options);
  }
}

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  let res: Response;
  try {
    res = await fetch(`${getApiUpstreamBaseUrl()}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      message:
        "Cannot reach the API. Start the backend and set BACKEND_API_BASE_URL / API_BASE_URL if it is not the default.",
    };
  }

  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };

  if (!res.ok || !data.ok) {
    const msg =
      typeof data.message === "string" && data.message.trim()
        ? data.message.trim()
        : "Invalid email or password.";
    return { ok: false, message: msg };
  }

  const cookieStore = await cookies();
  parseAndApplySetCookies(res, cookieStore);

  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!session?.value) {
    return {
      ok: false,
      message:
        "Sign-in succeeded but the session cookie was not applied. Ensure ADMIN_COOKIE_NAME matches the API and try again.",
    };
  }

  redirect("/admin/dashboard");
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  try {
    cookieStore.delete({ name: ADMIN_COOKIE_NAME, path: "/" });
  } catch {
    cookieStore.delete(ADMIN_COOKIE_NAME);
  }
}
