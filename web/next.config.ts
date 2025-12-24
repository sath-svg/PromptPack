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
};

export default nextConfig;
