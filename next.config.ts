import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "*": ["./content/**/*"],
  },
};

export default nextConfig;
// cache bust 1771922246
