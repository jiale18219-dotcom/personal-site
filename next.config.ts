import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1:3003", "localhost:3003"],
  images: {
    unoptimized: true,
  },
  output: "export",
};

export default nextConfig;
