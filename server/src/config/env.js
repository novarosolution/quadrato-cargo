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

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || "development",
  port: Number.parseInt(process.env.PORT?.trim() || "4000", 10),
  mongoUri: required("MONGODB_URI"),
  mongoDb: required("MONGODB_DB", "quadrato_cargo"),
  jwtSecret: required("JWT_SECRET"),
  jwtTtl: required("JWT_TTL", "7d"),
  authCookieName: required("AUTH_COOKIE_NAME", "qc_auth"),
  adminCookieName: required("ADMIN_COOKIE_NAME", "qc_admin_auth"),
  frontendOrigin: normalizeOrigin(required("FRONTEND_ORIGIN", "http://localhost:3000")),
  adminApiSecret: required("ADMIN_API_SECRET", "dev-admin-secret"),
  adminEmail: required("ADMIN_EMAIL", "admin@example.com").toLowerCase(),
  adminPassword: required("ADMIN_PASSWORD", "change-this-admin-password")
};

export const isProd = env.nodeEnv === "production";
