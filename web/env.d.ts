// Type declarations for Cloudflare Pages environment variables
// This extends the CloudflareEnv interface to include our custom env vars

interface CloudflareEnv {
  CLERK_SECRET_KEY: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_CONVEX_URL: string;
  NEXT_PUBLIC_R2_API_URL: string;
  R2_API_URL: string;
  RESEND_API_KEY: string;
}
