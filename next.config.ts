import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "*": ["./content/**/*"],
  },
  async redirects() {
    return [
      { source: "/daily", destination: "/journal", permanent: false },
      { source: "/daily/:slug*", destination: "/journal/:slug*", permanent: false },
      { source: "/murmur", destination: "/stream", permanent: false },
      { source: "/links", destination: "/about", permanent: false },
      { source: "/projects", destination: "/journal", permanent: false },
      { source: "/projects/:slug*", destination: "/journal/:slug*", permanent: false },
    ];
  },
};

export default nextConfig;
