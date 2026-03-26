import jwt from "jsonwebtoken";
import { env, isProd } from "../../config/env.js";

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
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
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
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

export function clearAdminCookie(res) {
  res.clearCookie(env.adminCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/"
  });
}
