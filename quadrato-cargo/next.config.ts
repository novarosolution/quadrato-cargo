import type { NextConfig } from "next";
import path from "node:path";

/** App root (required when another lockfile exists higher in the tree, e.g. ~/package-lock.json). */
const tracingRoot = path.resolve(__dirname);

const isProd = process.env.NODE_ENV === "production";
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline' https:;"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;";

/** Dev: allow fetch to Express on http://localhost — connect-src https: does not cover http URLs. */
function devApiConnectOrigins(): string {
  const bases = [process.env.BACKEND_API_BASE_URL, process.env.NEXT_PUBLIC_API_BASE_URL]
    .map((s) => s?.trim())
    .filter((s): s is string => typeof s === "string" && s.length > 0 && !s.startsWith("/"));
  const origins = new Set<string>();
  for (const b of bases) {
    try {
      const u = new URL(b);
      if (u.protocol === "http:" || u.protocol === "https:") {
        origins.add(`${u.protocol}//${u.host}`);
      }
    } catch {
      /* ignore */
    }
  }
  origins.add("http://localhost:4010");
  origins.add("http://127.0.0.1:4010");
  return Array.from(origins).join(" ");
}

const connectSrc = isProd
  ? "connect-src 'self' https:;"
  : `connect-src 'self' https: ws: wss: ${devApiConnectOrigins()};`;

/**
 * CSP without upgrade-insecure-requests — required for `next dev` over http://localhost.
 * Otherwise the browser may rewrite chunk URLs to https:// and `_next/static/*.js` 404s;
 * the 404 body is text/plain, and with nosniff the console shows “MIME type … is not executable”.
 */
const cspBase =
  `default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https:; ${scriptSrc} font-src 'self' data: https:; ${connectSrc} frame-src 'self' https://www.google.com https://*.google.com https://maps.google.com https://www.openstreetmap.org; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`;

const contentSecurityPolicy = isProd ? `${cspBase}; upgrade-insecure-requests` : cspBase;

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** ESM `three` + R3F through webpack dev — avoids missing re-exports / stale parse errors. */
  transpilePackages: ["three", "@react-three/fiber"],
  /**
   * Dev: avoid webpack PackFileCacheStrategy ENOENT on missing pack shards under
   * `.next/dev/cache/webpack` (stale index after predev cleanup, Fast Refresh full reload, or interrupted writes).
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
  /**
   * Turbopack dev can corrupt `.next/dev` (SST / lockfiles / paths with spaces).
   * Default `npm run dev` uses webpack; use `npm run dev:turbo` only if you need Turbopack.
   */
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  outputFileTracingRoot: tracingRoot,
  turbopack: {
    root: tracingRoot,
  },
  async headers() {
    const baseHeaders: { key: string; value: string }[] = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
    ];
    if (isProd) {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }
    return [{ source: "/:path*", headers: baseHeaders }];
  },
  async rewrites() {
    const backendBaseRaw =
      process.env.BACKEND_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const backendBase =
      backendBaseRaw?.replace(/\/+$/, "") ||
      (process.env.NODE_ENV !== "production" ? "http://localhost:4010" : "");
    if (!backendBase || backendBase.startsWith("/")) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
