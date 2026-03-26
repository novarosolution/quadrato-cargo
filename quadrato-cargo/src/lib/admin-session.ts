import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminSecretRaw } from "@/lib/env-secrets";

export const ADMIN_COOKIE = "qc_admin";

const MAX_AGE_SEC = 60 * 60 * 12;

export type AdminSessionPayload =
  | { exp: number; v: 1; kind: "env" }
  | {
      exp: number;
      v: 1;
      kind: "staff";
      userId: string;
      /** Optional display hint (auth still checks DB role) */
      email?: string;
    };

function getSecret(): string | undefined {
  return getAdminSecretRaw();
}

function signPayload(payload: AdminSessionPayload): string {
  const secret = getSecret();
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SECRET must be set and at least 16 characters");
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

/** Legacy single admin from .env (ADMIN_EMAIL / ADMIN_PASSWORD). */
export function signEnvAdminSession(): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  return signPayload({ exp, v: 1, kind: "env" });
}

/** Team member: password verified against User with role staff. */
export function signStaffAdminSession(userId: string, email?: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  return signPayload({
    exp,
    v: 1,
    kind: "staff",
    userId,
    ...(email ? { email } : {}),
  });
}

/** @deprecated Use parseVerifiedAdminPayload + DB check for staff */
export function verifyAdminSession(token: string | undefined): boolean {
  return parseVerifiedAdminPayload(token) != null;
}

/** Verify HMAC + expiry only. Staff must still be checked against DB (role). */
export function parseVerifiedAdminPayload(
  token: string | undefined,
): AdminSessionPayload | null {
  const secret = getSecret();
  if (!token || !secret) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!encoded || !sig) return null;
  const expected = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  try {
    if (expected.length !== sig.length) return null;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  } catch {
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  return normalizeAdminPayload(data);
}

function normalizeAdminPayload(data: unknown): AdminSessionPayload | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.v !== 1 || typeof o.exp !== "number") return null;
  if (Math.floor(Date.now() / 1000) >= o.exp) return null;

  if (o.kind === "env") {
    return { exp: o.exp, v: 1, kind: "env" };
  }
  if (o.kind === "staff" && typeof o.userId === "string") {
    return {
      exp: o.exp,
      v: 1,
      kind: "staff",
      userId: o.userId,
      ...(typeof o.email === "string" ? { email: o.email } : {}),
    };
  }
  // Legacy tokens: only exp + v
  if (o.kind === undefined) {
    return { exp: o.exp, v: 1, kind: "env" };
  }
  return null;
}

export function adminCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE_SEC,
    path: "/",
  };
}

/** Constant-time string compare for passwords */
export function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) {
    try {
      timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1));
    } catch {
      /* ignore */
    }
    return false;
  }
  return timingSafeEqual(ba, bb);
}
