import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next.js's client-side Router Cache doesn't reuse dynamic pages by
    // default (staleTimes.dynamic: 0), so revisiting a tab you were just on
    // always refetches from the server. Every dashboard route is dynamic
    // (per-tutor auth), so this makes repeat navigation within 30s instant —
    // matching the revalidate window our server-side data cache already
    // uses, so a mutation's redirect always lands on fresh data regardless.
    staleTimes: {
      dynamic: 30,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
