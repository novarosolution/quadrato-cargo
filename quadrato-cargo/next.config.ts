import type { NextConfig } from "next";
import path from "node:path";

/** App root (required when another lockfile exists higher in the tree, e.g. ~/package-lock.json). */
const tracingRoot = path.resolve(__dirname);

const isProd = process.env.NODE_ENV === "production";
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline' https:;"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;";
const connectSrc = isProd
  ? "connect-src 'self' https:;"
  : "connect-src 'self' https: ws: wss:;";

const nextConfig: NextConfig = {
  reactCompiler: true,
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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https:; ${scriptSrc} font-src 'self' data: https:; ${connectSrc} frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`
          }
        ]
      }
    ];
  },
  async rewrites() {
    const backendBaseRaw =
      process.env.BACKEND_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const backendBase = backendBaseRaw?.replace(/\/+$/, "");
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
