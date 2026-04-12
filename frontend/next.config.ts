import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for shared hosting
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable server-side features for static export
  experimental: {
    esmExternals: false
  }
};

export default nextConfig;
