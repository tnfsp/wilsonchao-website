import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ensure JSON content under /content is bundled for server functions (Vercel).
    outputFileTracingIncludes: {
      "*": ["./content/**/*"],
    },
  },
};

export default nextConfig;
