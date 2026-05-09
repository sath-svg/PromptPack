import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import bcrypt from "bcrypt";

export const auth = betterAuth({
  // BetterAuth Infra handles the database
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
