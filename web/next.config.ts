import type { NextConfig } from "next";
import { withPlausibleProxy } from "next-plausible";

const nextConfig: NextConfig = {
  // SEO: Ensure consistent URLs (no trailing slashes)
  trailingSlash: false,

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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-49b572bd58734fa9bccbda52d7f46f55.r2.dev",
      },
      {
        protocol: "https",
        hostname: "storage.pmtpk.com",
      },
    ],
  },
};

export default withPlausibleProxy({
  customDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_URL,
})(nextConfig);
