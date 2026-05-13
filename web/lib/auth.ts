import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import bcrypt from "bcrypt";
import { Pool } from "pg";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "https://skillset.so",
  trustedOrigins: ["https://skillset.so"],
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  account: {
    // Store OAuth state in encrypted cookie instead of the `verification` table.
    // The Postgres adapter migration hasn't been run, so DB-strategy lookups
    // return null on callback and BetterAuth bounces users to
    // /?error=please_restart_the_process.
    storeStateStrategy: "cookie",
  },
  plugins: [
    dash(),
  ],
  emailAndPassword: {
    enabled: true,
    password: {
      // Clerk uses bcrypt — need compat for migrated password hashes
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
  },
  session: {
    // Long-lived sessions — the whole reason for this migration
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Refresh session every 24 hours
  },
});
