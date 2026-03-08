import type { NextConfig } from "next";

const proxyOrigin = (process.env.VM_API_ORIGIN ?? "http://40.81.226.235").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${proxyOrigin}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;