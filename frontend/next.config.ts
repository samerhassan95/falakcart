import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for PM2 deployment
  output: 'standalone',
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  // Disable ESLint and TS errors during build to maximize compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Fix font loading and optimize for production
  optimizeFonts: false,
};

export default nextConfig;
