import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "*": ["./content/**/*"],
  },
  async redirects() {
    return [
      { source: "/blog/fomo-anxiety", destination: "/blog/fomo-anxiety-2026-q1", permanent: true },
      { source: "/daily", destination: "/journal", permanent: false },
      { source: "/daily/:slug*", destination: "/journal/:slug*", permanent: false },
      { source: "/murmur", destination: "/stream", permanent: false },
      { source: "/projects", destination: "/journal", permanent: false },
      { source: "/projects/:slug*", destination: "/journal/:slug*", permanent: false },
    ];
  },
};

export default nextConfig;
