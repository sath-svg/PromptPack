import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Cloudflare Pages deployment
  output: "standalone",
  // Exclude convex folder from typescript checking until convex dev is run
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable Next.js devtools to avoid SegmentViewNode bundler errors
  devIndicators: false,
  // Suppress preload warnings for CSS
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Reduce console noise in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
