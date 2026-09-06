import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL;

    if (!backendUrl) {
      throw new Error(
        "BACKEND_URL is not configured"
      );
    }

    return [
      {
        source: "/api/:path*",
        destination:
          `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;