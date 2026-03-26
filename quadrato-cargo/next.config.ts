import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const backendBase = process.env.BACKEND_API_BASE_URL?.trim().replace(/\/+$/, "");
    if (!backendBase) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
