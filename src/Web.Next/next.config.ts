import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage production image (standalone server.js).
  output: "standalone",
};

export default nextConfig;
