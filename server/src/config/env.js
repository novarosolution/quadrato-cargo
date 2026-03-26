import "dotenv/config";

function required(name, fallback) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

function normalizeOrigin(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function parseOrigins(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);
}

function parseSameSite(value, fallback) {
  const raw = String(value ?? fallback ?? "").trim().toLowerCase();
  if (raw === "lax" || raw === "strict" || raw === "none") return raw;
  return fallback;
}

function parseBool(value, fallback) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") return true;
  if (raw === "0" || raw === "false" || raw === "no" || raw === "off") return false;
  return fallback;
}

const defaultOrigin = normalizeOrigin(process.env.FRONTEND_ORIGIN || "http://localhost:3000");
const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN || defaultOrigin);
const defaultCookieSameSite = process.env.NODE_ENV?.trim() === "production" ? "none" : "lax";

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || "development",
  port: Number.parseInt(process.env.PORT?.trim() || "4000", 10),
  mongoUri: required("MONGODB_URI"),
  mongoDb: required("MONGODB_DB", "quadrato_cargo"),
  jwtSecret: required("JWT_SECRET"),
  jwtTtl: required("JWT_TTL", "7d"),
  authCookieName: required("AUTH_COOKIE_NAME", "qc_auth"),
  adminCookieName: required("ADMIN_COOKIE_NAME", "qc_admin_auth"),
  frontendOrigin: normalizeOrigin(required("FRONTEND_ORIGIN", defaultOrigin)),
  corsOrigins: configuredOrigins.length > 0 ? configuredOrigins : [defaultOrigin],
  cookieSameSite: parseSameSite(process.env.COOKIE_SAMESITE, defaultCookieSameSite),
  cookieSecure: parseBool(process.env.COOKIE_SECURE, process.env.NODE_ENV?.trim() === "production"),
  cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
  adminApiSecret: required("ADMIN_API_SECRET", "dev-admin-secret"),
  adminEmail: required("ADMIN_EMAIL", "admin@example.com").toLowerCase(),
  adminPassword: required("ADMIN_PASSWORD", "change-this-admin-password")
};

export const isProd = env.nodeEnv === "production";
