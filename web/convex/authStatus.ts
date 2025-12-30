import { query } from "./_generated/server";

export const authStatus = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      isAuthenticated: !!identity,
      subject: identity?.subject ?? null,
      email: identity?.email ?? null,
    };
  },
});
