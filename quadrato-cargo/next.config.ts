import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: path.resolve(__dirname),
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
