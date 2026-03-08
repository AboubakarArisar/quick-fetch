import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://40.81.226.235/api/:path*",
      },
    ];
  },
};

export default nextConfig;