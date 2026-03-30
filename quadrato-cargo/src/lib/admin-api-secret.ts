const raw = process.env.ADMIN_API_SECRET?.trim();
if (!raw) {
  throw new Error("Missing required environment variable: ADMIN_API_SECRET");
}
export const ADMIN_API_SECRET = raw;
