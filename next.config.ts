import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1:3003", "localhost:3003"],
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
