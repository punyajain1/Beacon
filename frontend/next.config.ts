import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      // Proxy all /api/* requests to the Express backend
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
      // Proxy WebSocket upgrade path (HTTP side)
      {
        source: "/ws/:path*",
        destination: "http://localhost:3000/ws/:path*",
      },
    ];
  },
};

export default nextConfig;
