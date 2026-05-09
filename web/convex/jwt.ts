/**
 * HS256 JWT minting for desktop access tokens.
 *
 * Convex `/api/extension/exchange-code` + `/api/extension/refresh-token`
 * issue these alongside the long-lived refresh token. Workers validate
 * them in `api/src/index.ts` (HS256 branch in `verifyClerkSession`).
 *
 * Why a custom JWT instead of relying on Clerk's session token:
 *  - Clerk session tokens default to 60s exp; templates cap around an
 *    hour. Desktop runs (multi-subtask packs, long agent loops) blow
 *    past that and 401 mid-run.
 *  - Refreshing Clerk tokens server-side requires Clerk Backend API
 *    keys held by Convex; we don't carry that secret.
 *  - HS256 + a shared `JWT_SECRET` lets Convex mint and Worker verify
 *    without hitting Clerk per request.
 *
 * Pairs with the existing 7-day rotating refresh token (UUID, stored
 * in Convex `refreshTokens` table). Access token = 1h. Client refreshes
 * before expiry; on 401 mid-call, retries once after refresh.
 */

const ENCODER = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeStr(s: string): string {
  return base64UrlEncode(ENCODER.encode(s));
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENCODER.encode(data));
  return new Uint8Array(sig);
}

export interface DesktopAccessTokenClaims {
  sub: string;          // clerkId
  iss: "promptpack-desktop";
  iat: number;
  exp: number;
}

/**
 * Mint an HS256 JWT scoped to the desktop client.
 * @param clerkId  user's Clerk id (becomes `sub`)
 * @param secret   shared HMAC secret (Convex env `JWT_SECRET`)
 * @param ttlSec   lifetime in seconds (default 3600 = 1h)
 */
export async function mintDesktopAccessToken(
  clerkId: string,
  secret: string,
  ttlSec = 3600,
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const payload: DesktopAccessTokenClaims = {
    sub: clerkId,
    iss: "promptpack-desktop",
    iat: now,
    exp: now + ttlSec,
  };
  const headerEncoded = base64UrlEncodeStr(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const payloadEncoded = base64UrlEncodeStr(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;
  const sig = await hmacSha256(secret, signingInput);
  const sigEncoded = base64UrlEncode(sig);
  return {
    token: `${signingInput}.${sigEncoded}`,
    expiresAt: payload.exp * 1000, // ms for parity with refreshTokenExpiresAt
  };
}
