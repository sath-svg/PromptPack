import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Token configuration
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ROTATION_COUNT = 1000; // Max refreshes before requiring re-auth
const MAX_ACTIVE_TOKENS_PER_USER = 10; // Max concurrent sessions

/**
 * Create a new refresh token for a user (called on login)
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ip, userAgent }) => {
    const now = Date.now();

    // Generate a new UUID token
    const token = crypto.randomUUID();

    // Clean up old revoked tokens for this user (keep DB clean)
    const oldTokens = await ctx.db
      .query("refreshTokens")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .collect();

    // Revoke and delete tokens that are expired or already revoked
    for (const oldToken of oldTokens) {
      if (oldToken.isRevoked || oldToken.expiresAt < now) {
        await ctx.db.delete(oldToken._id);
      }
    }

    // Check active token count (prevent too many sessions)
    const activeTokens = await ctx.db
      .query("refreshTokens")
      .withIndex("by_clerk_id_active", (q) => q.eq("clerkId", clerkId).eq("isRevoked", false))
      .collect();

    // If too many active tokens, revoke the oldest ones
    if (activeTokens.length >= MAX_ACTIVE_TOKENS_PER_USER) {
      const sortedByCreation = activeTokens.sort((a, b) => a.createdAt - b.createdAt);
      const tokensToRevoke = sortedByCreation.slice(0, activeTokens.length - MAX_ACTIVE_TOKENS_PER_USER + 1);
      for (const oldToken of tokensToRevoke) {
        await ctx.db.patch(oldToken._id, { isRevoked: true });
      }
    }

    // Create the new token
    await ctx.db.insert("refreshTokens", {
      clerkId,
      token,
      createdAt: now,
      expiresAt: now + REFRESH_TOKEN_EXPIRY_MS,
      lastUsedAt: now,
      lastUsedIp: ip,
      lastUsedUserAgent: userAgent,
      rotationCount: 0,
      isRevoked: false,
    });

    return {
      refreshToken: token,
      expiresAt: now + REFRESH_TOKEN_EXPIRY_MS,
    };
  },
});

/**
 * Validate a refresh token and rotate it (returns new tokens)
 * This is the core refresh endpoint logic
 */
export const rotateToken = mutation({
  args: {
    refreshToken: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { refreshToken, ip, userAgent }) => {
    const now = Date.now();

    // Find the token
    const tokenRecord = await ctx.db
      .query("refreshTokens")
      .withIndex("by_token", (q) => q.eq("token", refreshToken))
      .first();

    // Token not found
    if (!tokenRecord) {
      return { error: "INVALID_TOKEN", message: "Refresh token not found" };
    }

    // Token already revoked
    if (tokenRecord.isRevoked) {
      // Possible token reuse attack - revoke ALL tokens for this user
      console.warn(`[Security] Revoked token reuse detected for user ${tokenRecord.clerkId}`);
      const allUserTokens = await ctx.db
        .query("refreshTokens")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", tokenRecord.clerkId))
        .collect();
      for (const t of allUserTokens) {
        await ctx.db.patch(t._id, { isRevoked: true });
      }
      return { error: "TOKEN_REUSE", message: "Potential token reuse attack detected. All sessions revoked." };
    }

    // Token expired
    if (tokenRecord.expiresAt < now) {
      await ctx.db.patch(tokenRecord._id, { isRevoked: true });
      return { error: "TOKEN_EXPIRED", message: "Refresh token has expired" };
    }

    // Too many rotations (require re-auth)
    if (tokenRecord.rotationCount >= MAX_ROTATION_COUNT) {
      await ctx.db.patch(tokenRecord._id, { isRevoked: true });
      return { error: "MAX_ROTATIONS", message: "Maximum token rotations reached. Please sign in again." };
    }

    // Token is valid - rotate it
    // 1. Revoke the old token
    await ctx.db.patch(tokenRecord._id, { isRevoked: true });

    // 2. Create a new token with incremented rotation count
    const newToken = crypto.randomUUID();
    const newExpiresAt = now + REFRESH_TOKEN_EXPIRY_MS;

    await ctx.db.insert("refreshTokens", {
      clerkId: tokenRecord.clerkId,
      token: newToken,
      createdAt: now,
      expiresAt: newExpiresAt,
      lastUsedAt: now,
      lastUsedIp: ip,
      lastUsedUserAgent: userAgent,
      rotationCount: tokenRecord.rotationCount + 1,
      isRevoked: false,
    });

    return {
      success: true,
      clerkId: tokenRecord.clerkId,
      refreshToken: newToken,
      expiresAt: newExpiresAt,
      rotationCount: tokenRecord.rotationCount + 1,
    };
  },
});

/**
 * Revoke a specific refresh token
 */
export const revoke = mutation({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, { refreshToken }) => {
    const tokenRecord = await ctx.db
      .query("refreshTokens")
      .withIndex("by_token", (q) => q.eq("token", refreshToken))
      .first();

    if (!tokenRecord) {
      return { success: false, message: "Token not found" };
    }

    await ctx.db.patch(tokenRecord._id, { isRevoked: true });
    return { success: true };
  },
});

/**
 * Revoke all refresh tokens for a user (sign out all devices)
 */
export const revokeAllForUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const allTokens = await ctx.db
      .query("refreshTokens")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .collect();

    let revokedCount = 0;
    for (const token of allTokens) {
      if (!token.isRevoked) {
        await ctx.db.patch(token._id, { isRevoked: true });
        revokedCount++;
      }
    }

    return { success: true, revokedCount };
  },
});

/**
 * Get active sessions for a user (for "manage sessions" UI)
 */
export const getActiveSessionsForUser = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const now = Date.now();
    const tokens = await ctx.db
      .query("refreshTokens")
      .withIndex("by_clerk_id_active", (q) => q.eq("clerkId", clerkId).eq("isRevoked", false))
      .collect();

    // Filter out expired tokens and return sanitized info
    return tokens
      .filter((t) => t.expiresAt > now)
      .map((t) => ({
        id: t._id,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
        lastUsedIp: t.lastUsedIp,
        expiresAt: t.expiresAt,
      }));
  },
});

/**
 * Validate a refresh token (check if valid without rotating)
 * Used for checking token validity before making API calls
 */
export const validate = query({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, { refreshToken }) => {
    const now = Date.now();

    const tokenRecord = await ctx.db
      .query("refreshTokens")
      .withIndex("by_token", (q) => q.eq("token", refreshToken))
      .first();

    if (!tokenRecord) {
      return { valid: false, reason: "TOKEN_NOT_FOUND" };
    }

    if (tokenRecord.isRevoked) {
      return { valid: false, reason: "TOKEN_REVOKED" };
    }

    if (tokenRecord.expiresAt < now) {
      return { valid: false, reason: "TOKEN_EXPIRED" };
    }

    return {
      valid: true,
      clerkId: tokenRecord.clerkId,
      expiresAt: tokenRecord.expiresAt,
    };
  },
});

/**
 * Internal: Cleanup expired tokens (run periodically via cron)
 */
export const cleanupExpiredTokens = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Find all tokens that are either:
    // 1. Expired more than 30 days ago
    // 2. Revoked more than 7 days ago
    const allTokens = await ctx.db.query("refreshTokens").collect();

    let deletedCount = 0;
    for (const token of allTokens) {
      const isOldExpired = token.expiresAt < thirtyDaysAgo;
      const isOldRevoked = token.isRevoked && token.lastUsedAt < now - 7 * 24 * 60 * 60 * 1000;

      if (isOldExpired || isOldRevoked) {
        await ctx.db.delete(token._id);
        deletedCount++;
      }
    }

    console.log(`[Token Cleanup] Deleted ${deletedCount} old tokens`);
    return { deletedCount };
  },
});
