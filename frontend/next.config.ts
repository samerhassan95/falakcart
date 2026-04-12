import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for PM2 deployment
  output: 'standalone',
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  // Disable ESLint during build to avoid build failures
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
  // Ensure static assets are properly copied
  trailingSlash: false,
  assetPrefix: '',
  // Fix font loading issues
  optimizeFonts: false,
};

export default nextConfig;
