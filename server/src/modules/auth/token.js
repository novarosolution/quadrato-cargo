import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

function parseJwtTtlToMs(ttlValue) {
  const raw = String(ttlValue ?? "").trim();
  if (!raw) return 7 * 24 * 60 * 60 * 1000;
  const asNumber = Number.parseInt(raw, 10);
  if (Number.isFinite(asNumber) && String(asNumber) === raw) {
    return Math.max(1000, asNumber * 1000);
  }
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const factors = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return Math.max(1000, amount * factors[unit]);
}

const authCookieMaxAgeMs = parseJwtTtlToMs(env.jwtTtl);

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role ?? "customer",
      name: user.name ?? null
    },
    env.jwtSecret,
    { expiresIn: env.jwtTtl }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function setAuthCookie(res, token) {
  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    domain: env.cookieDomain,
    path: "/",
    maxAge: authCookieMaxAgeMs
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    domain: env.cookieDomain,
    path: "/"
  });
}

export function signAdminToken(payload) {
  return jwt.sign(
    {
      ...payload,
      scope: "admin"
    },
    env.jwtSecret,
    { expiresIn: env.jwtTtl }
  );
}

export function verifyAdminToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload?.scope !== "admin") {
    throw new Error("Invalid admin token");
  }
  return payload;
}

export function setAdminCookie(res, token) {
  res.cookie(env.adminCookieName, token, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    domain: env.cookieDomain,
    path: "/",
    maxAge: authCookieMaxAgeMs
  });
}

export function clearAdminCookie(res) {
  res.clearCookie(env.adminCookieName, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    domain: env.cookieDomain,
    path: "/"
  });
}
