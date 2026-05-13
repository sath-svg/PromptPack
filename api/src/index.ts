/**
 * PromptPack Cloudflare Workers API
 *
 * Handles:
 * - R2 file uploads for .pmtpk files
 * - Auth token validation
 * - CORS for web + Tauri requests
 */

// Configuration is set in wrangler.toml
import { getGroqApiKey } from "./config";
import { handleLlmChat } from "./llm";
import { handleStyleAnalysis } from "./styleanalysis";
import { handleImageGen } from "./imagegen";
import { handleStyleRefine } from "./stylerefine";
import {
  modelsByTier,
  recommendedForTier,
  getManagedModel,
  byokModelForTier,
  type ManagedTier,
  type ByokProvider,
} from "./managed-models";

export interface Env {
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
  CONVEX_URL: string;
  ALLOWED_ORIGINS: string;
  OLLAMA_URL: string;
  GROQ_API_KEY: string;
  // Clerk (legacy, active until cutover)
  OPENROUTER_API_KEY: string;
  OPENAI_API_KEY?: string; // Optional. Enables DALL-E 3 image gen direct (better quality than Gemini fallback).
  SKILLSET_INTERNAL_KEY: string;
  JWT_SECRET?: string;
  // BetterAuth (new provider)
  BETTER_AUTH_ISSUER: string;
  BETTER_AUTH_JWKS_URL: string;
  BETTER_AUTH_AUDIENCE: string;
  // MCP tokens
}

type EnhanceMode = "clarity" | "structured" | "concise" | "strict";

const ENHANCE_DEFAULT_MODE: EnhanceMode = "structured";
// Model gating: Pro users get the bigger model, free users get the smaller one
const ENHANCE_PRO_MODEL = "llama-3.3-70b-versatile";
const ENHANCE_FREE_MODEL = "llama-3.1-8b-instant";
const ENHANCE_MAX_INPUT_CHARS = 6000;

// Rate limits - daily
const ENHANCE_FREE_DAY_LIMIT = 3;       // Free (logged in): 3/day (trial-only; upgrade for real usage)
const ENHANCE_PRO_DAY_LIMIT = 100;      // Pro: 100/day

// Web tool limits (anonymous + authenticated, for /api/web/* endpoints)
const WEB_ENHANCE_ANON_DAY = 1;         // Anonymous: 1/day
const WEB_ENHANCE_FREE_DAY = 3;         // Free logged in: 3/day (trial-only)
const WEB_ENHANCE_PRO_DAY = 100;        // Pro: 100/day
const WEB_EVALUATE_ANON_DAY = 1;        // Anonymous: 1/day
const WEB_EVALUATE_FREE_DAY = 3;        // Free logged in: 3/day
const WEB_EVALUATE_PRO_DAY = 50;        // Pro: 50/day
const WEB_MIGRATE_ANON_DAY = 1;         // Anonymous: 1/day
const WEB_MIGRATE_FREE_DAY = 1;         // Free logged in: 1/day (migration is one-time use)
const WEB_MIGRATE_PRO_DAY = 3;          // Pro: 3/day
const MIGRATE_MAX_INPUT_CHARS = 15000;   // Memories + conversation excerpts
const MIGRATE_MODEL = "llama-3.3-70b-versatile";
const MIGRATE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30-day cache

// Rolling window limits (applies to all users)
const ENHANCE_MINUTE_LIMIT = 2;         // 2 requests/minute
const ENHANCE_10MIN_LIMIT = 10;         // 10 requests/10 minutes
const ENHANCE_IN_FLIGHT_TTL_SECONDS = 2 * 60; // 1 in-flight request per user

// Same-prompt spam guard (hash-based)
const ENHANCE_FREE_SAME_HASH_HOUR = 2;  // Free: max 2 same prompt/hour
const ENHANCE_PRO_SAME_HASH_HOUR = 5;   // Pro: max 5 same prompt/hour

// Output token caps per mode
const ENHANCE_FREE_MAX_TOKENS: Record<EnhanceMode, number> = {
  concise: 350,
  clarity: 400,
  strict: 450,
  structured: 450,
};
const ENHANCE_PRO_MAX_TOKENS: Record<EnhanceMode, number> = {
  concise: 600,
  clarity: 700,
  strict: 800,
  structured: 750,
};

const ENHANCE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
const CLASSIFY_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

// Rate limits for /classify endpoint
const CLASSIFY_FREE_DAY_LIMIT = 15;      // Free: 15/day (trial-only; upgrade for real usage)
const CLASSIFY_PRO_DAY_LIMIT = 500;      // Pro: 500/day
const CLASSIFY_MINUTE_LIMIT = 10;        // 10 requests/minute
const CLASSIFY_10MIN_LIMIT = 50;         // 50 requests/10 minutes
const CLASSIFY_IN_FLIGHT_TTL_SECONDS = 30; // 1 concurrent request per user

// === EVALUATION ENDPOINT CONSTANTS ===
// Rate limits for /api/evaluate endpoint (Pro/Studio only)
const EVAL_PRO_DAY_LIMIT = 100;          // Pro: 100/day
const EVAL_STUDIO_DAY_LIMIT = 500;       // Studio: 500/day
const EVAL_MINUTE_LIMIT = 5;             // 5 requests/minute
const EVAL_10MIN_LIMIT = 20;             // 20 requests/10 minutes
const EVAL_IN_FLIGHT_TTL_SECONDS = 60;   // 1 concurrent request per user
const EVAL_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30-day cache
const EVAL_MAX_INPUT_CHARS = 6000;       // Same as enhance
const EVAL_MODEL = "llama-3.3-70b-versatile"; // Use pro model for quality

// Tier descriptions for the evaluator's system prompt. Mirrors how chat
// already routes — see app/src/lib/classifier.ts.
const TIER_DESCRIPTIONS: Record<ManagedTier, string> = {
  cheap: "Small/fast models (~$0.30/M): everyday Q&A, summaries, simple rewrites, single-file code edits.",
  mid: "Balanced reasoning (~$3/M): multi-step analysis, refactors, longer writing, careful reasoning.",
  frontier: "Top reasoning (~$15/M): research-grade analysis, novel-length writing, multi-file architecture, hard math/proofs.",
};

const VALID_BYOK_PROVIDERS: readonly ByokProvider[] = [
  "anthropic",
  "openai",
  "gemini",
  "grok",
  "deepseek",
  "perplexity",
  "kimi",
];

// Models per tier inside the recommended-tier rank list. Models matching
// the user's `selectedManagedModels[tier]` are always included; otherwise
// we send the full managed allowlist for that tier to Groq.
function modelsCatalogForPrompt(tier: ManagedTier): string {
  return modelsByTier(tier)
    .map((m) => `${m.id} (${m.label})`)
    .join(", ");
}

function clampScore(n: unknown): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function isManagedTier(v: unknown): v is ManagedTier {
  return v === "cheap" || v === "mid" || v === "frontier";
}

function isClassifierTier(v: unknown): v is ManagedTier {
  // Client sends "cheap"|"mid"|"frontier" directly (already mapped from
  // classifierTierToManagedTier on the client). Treat unknown as null.
  return isManagedTier(v);
}

function isClassifierEffort(v: unknown): v is "low" | "medium" | "high" | null {
  return v === null || v === "low" || v === "medium" || v === "high";
}

type OriginRule = { suffix: string; scheme?: string };

function parseAllowedOrigins(env: Env): {
  exact: Set<string>;
  suffixes: OriginRule[];
} {
  const raw = env.ALLOWED_ORIGINS || "";
  const entries = raw.split(",").map((entry) => entry.trim()).filter(Boolean);
  const exact = new Set<string>();
  const suffixes: OriginRule[] = [];

  for (const entry of entries) {
    if (entry.startsWith("http://*.")) {
      suffixes.push({ scheme: "http", suffix: entry.slice("http://*.".length) });
      continue;
    }
    if (entry.startsWith("https://*.")) {
      suffixes.push({ scheme: "https", suffix: entry.slice("https://*.".length) });
      continue;
    }
    if (entry.startsWith("*.")) {
      suffixes.push({ suffix: entry.slice(2) });
      continue;
    }
    try {
      exact.add(new URL(entry).origin);
    } catch {
      // Ignore invalid entries.
    }
  }

  return { exact, suffixes };
}

function isOriginAllowed(origin: string, env: Env): boolean {
  // Allow null origin for Tauri production builds (file:// protocol sends null)
  // This is safe because these endpoints require auth tokens
  if (origin === "null") return true;
  if (!origin) return false;

  // Allow Tauri desktop app + local dev origins:
  //   tauri://, http://tauri.localhost, https://tauri.localhost
  //   Tauri v2 dev server: http://localhost:1420
  //   Local dev: http://localhost:*, http://127.0.0.1:*
  if (
    origin.startsWith("tauri://") ||
    origin.startsWith("http://tauri.localhost") ||
    origin.startsWith("https://tauri.localhost") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    return true;
  }

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  const rules = parseAllowedOrigins(env);
  if (rules.exact.has(origin)) return true;

  const scheme = url.protocol.replace(":", "");
  const host = url.hostname;
  for (const rule of rules.suffixes) {
    if (rule.scheme && rule.scheme !== scheme) continue;
    if (host === rule.suffix || host.endsWith(`.${rule.suffix}`)) return true;
  }

  return false;
}

function buildCorsHeaders(origin: string, methods: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

// CORS headers for web + Tauri requests
function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin") || "";
  if (!isOriginAllowed(origin, env)) return {};
  return buildCorsHeaders(origin, "GET, POST, PUT, DELETE, OPTIONS");
}

// Stricter CORS for Groq-enhance endpoint
function corsHeadersForEnhance(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin") || "";
  if (!isOriginAllowed(origin, env)) return {};
  return buildCorsHeaders(origin, "POST, OPTIONS");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseJwtPart<T>(input: string): T | null {
  try {
    const json = new TextDecoder().decode(decodeBase64Url(input));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type JwtPayload = {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
};

// Extends built-in JsonWebKey with standard JWK fields (kid, use) that TypeScript omits
interface JwksKey extends JsonWebKey {
  kid?: string;
  use?: string;
}

async function getJwks(jwksUrl: string): Promise<{ keys: JwksKey[] } | null> {
  const cache = caches.default;
  const req = new Request(jwksUrl, { method: "GET" });
  const cached = await cache.match(req);
  if (cached) {
    try {
      return await cached.json() as { keys: JwksKey[] };
    } catch {
      await cache.delete(req);
    }
  }

  const response = await fetch(req);
  if (!response.ok) return null;
  const data = await response.json() as { keys: JwksKey[] };
  const res = new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
  await cache.put(req, res);
  return data;
}

function isAudienceValid(payload: JwtPayload, expectedAudience: string | null): boolean {
  if (!expectedAudience) return true;
  const aud = payload.aud;
  if (!aud) return false;
  if (Array.isArray(aud)) {
    return aud.includes(expectedAudience);
  }
  return aud === expectedAudience;
}

// --- HMAC key helper (used by desktop access token + any future HS256 needs) ---

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function verifyBetterAuthJwt(token: string, env: Env): Promise<JwtPayload | null> {
  // BetterAuth uses RS256 JWTs.
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const header = parseJwtPart<JwtHeader>(encodedHeader);
  const payload = parseJwtPart<JwtPayload>(encodedPayload);
  if (!header || !payload) return null;
  if (header.alg !== "RS256" || !header.kid) return null;

  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  if (payload.nbf && payload.nbf * 1000 > Date.now()) return null;
  if (env.BETTER_AUTH_ISSUER && payload.iss !== env.BETTER_AUTH_ISSUER) return null;
  if (!isAudienceValid(payload, env.BETTER_AUTH_AUDIENCE || null)) return null;

  const jwksUrl = env.BETTER_AUTH_JWKS_URL || (env.BETTER_AUTH_ISSUER ? `${env.BETTER_AUTH_ISSUER}/.well-known/jwks.json` : "");
  if (!jwksUrl) return null;
  const jwks = await getJwks(jwksUrl); // Reuse JWKS fetching (generic RS256)
  if (!jwks?.keys?.length) return null;

  const jwk = jwks.keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = decodeBase64Url(encodedSignature);
  const verified = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data);
  if (!verified) return null;

  return payload;
}

async function verifyDesktopAccessToken(token: string, env: Env): Promise<{ sub?: string } | null> {
  if (!env.JWT_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const header = parseJwtPart<{ alg?: string; typ?: string }>(headerB64);
  if (!header || header.alg !== "HS256") return null;
  const payload = parseJwtPart<{ sub?: string; exp?: number; iss?: string }>(payloadB64);
  if (!payload || payload.iss !== "promptpack-desktop") return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  const key = await getHmacKey(env.JWT_SECRET);
  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = decodeBase64Url(sigB64);
  const valid = await crypto.subtle.verify("HMAC", key, signature, signingInput);
  if (!valid) return null;
  return { sub: payload.sub };
}

async function verifyAnyAuthJwt(token: string, env: Env): Promise<{ sub?: string } | null> {
  // Tries every supported auth scheme in order of frequency:
  //  1. Desktop HS256 access token (Tauri app)
  //  2. BetterAuth RS256 (all web + post-migration desktop users)
  const desktop = await verifyDesktopAccessToken(token, env);
  if (desktop) return desktop;
  const betterAuth = await verifyBetterAuthJwt(token, env);
  if (betterAuth) return betterAuth;
  return null;
}

function getEnhanceMode(input: unknown): EnhanceMode | null {
  if (typeof input !== "string") return ENHANCE_DEFAULT_MODE;
  const mode = input.toLowerCase();
  if (mode === "clarity" || mode === "structured" || mode === "concise" || mode === "strict") {
    return mode;
  }
  return null;
}

function getMaxOutputTokens(mode: EnhanceMode, isPro: boolean): number {
  return isPro ? ENHANCE_PRO_MAX_TOKENS[mode] : ENHANCE_FREE_MAX_TOKENS[mode];
}

function getModel(isPro: boolean): string {
  return isPro ? ENHANCE_PRO_MODEL : ENHANCE_FREE_MODEL;
}

function buildEnhanceSystemPrompt(mode: EnhanceMode): string {
  const modeGuidance: Record<EnhanceMode, string> = {
    structured: "organize it into clear sections with an explicit output format and constraints",
    clarity: "improve clarity and remove ambiguity while keeping the same intent",
    concise: "shorten it while preserving the core intent and key constraints",
    strict: "add explicit constraints, edge cases, and acceptance criteria",
  };

  return [
    "You are an expert prompt editor. Your ONLY job is to REWRITE and IMPROVE the user's prompt.",
    "CRITICAL: Do NOT answer or respond to the prompt. Do NOT provide the information the prompt is asking for.",
    "Do NOT execute the prompt's instructions. ONLY rewrite it to make it a better prompt.",
    `Rewrite the user's prompt to ${modeGuidance[mode]}.`,
    "Preserve the original intent and keep it as a question/request to an AI.",
    "If it is already good, do a light pass without overhauling.",
    "Output ONLY the enhanced prompt text (no commentary, no markdown, no code fences, no explanations).",
  ].join(" ");
}

function getRateLimitId(request: Request, userId: string | null): string {
  if (userId) return `user:${userId}`;
  const ip = request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "unknown";
  return `ip:${ip}`;
}

async function getCachedJson<T>(cacheKey: string): Promise<T | null> {
  const cache = caches.default;
  const req = new Request(`https://cache.pmtpk.com/enhance/${cacheKey}`, { method: "GET" });
  const hit = await cache.match(req);
  if (!hit) return null;
  try {
    return await hit.json() as T;
  } catch {
    return null;
  }
}

async function putCachedJson(cacheKey: string, payload: unknown, ttlSeconds: number): Promise<void> {
  const cache = caches.default;
  const req = new Request(`https://cache.pmtpk.com/enhance/${cacheKey}`, { method: "GET" });
  const res = new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${ttlSeconds}`,
    },
  });
  await cache.put(req, res);
}

async function getCachedClassify<T>(cacheKey: string): Promise<T | null> {
  const cache = caches.default;
  const req = new Request(`https://cache.pmtpk.com/classify/${cacheKey}`, { method: "GET" });
  const hit = await cache.match(req);
  if (!hit) return null;
  try {
    return await hit.json() as T;
  } catch {
    return null;
  }
}

async function putCachedClassify(cacheKey: string, payload: unknown, ttlSeconds: number): Promise<void> {
  const cache = caches.default;
  const req = new Request(`https://cache.pmtpk.com/classify/${cacheKey}`, { method: "GET" });
  const res = new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${ttlSeconds}`,
    },
  });
  await cache.put(req, res);
}

async function incrementRateCounter(key: string, ttlSeconds: number): Promise<number> {
  const cache = caches.default;
  const req = new Request(`https://rate.pmtpk.com/enhance/${encodeURIComponent(key)}`, { method: "GET" });
  const hit = await cache.match(req);
  let count = 0;
  if (hit) {
    try {
      const data = await hit.json() as { count?: number };
      count = data.count ?? 0;
    } catch {
      count = 0;
    }
  }
  const next = count + 1;
  const res = new Response(JSON.stringify({ count: next }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${ttlSeconds}`,
    },
  });
  await cache.put(req, res);
  return next;
}

async function acquireInFlightLock(key: string, ttlSeconds: number): Promise<boolean> {
  const cache = caches.default;
  const req = new Request(`https://rate.pmtpk.com/enhance/inflight/${encodeURIComponent(key)}`, { method: "GET" });
  const hit = await cache.match(req);
  if (hit) return false;
  const res = new Response(JSON.stringify({ locked: true, ts: Date.now() }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${ttlSeconds}`,
    },
  });
  await cache.put(req, res);
  return true;
}

async function releaseInFlightLock(key: string): Promise<void> {
  const cache = caches.default;
  const req = new Request(`https://rate.pmtpk.com/enhance/inflight/${encodeURIComponent(key)}`, { method: "GET" });
  await cache.delete(req);
}

// Strip preamble text that Groq sometimes adds despite system prompt instructions
// e.g., "Here is a rewritten version of the prompt with clear sections:"
function stripGroqPreamble(content: string): string {
  // Common preamble patterns from Groq
  const preamblePatterns = [
    /^Here(?:'s| is) (?:a |the )?(?:rewritten|enhanced|improved|revised|updated|optimized|refined|concise|structured|clarified|clearer) (?:version of (?:the|your) )?prompt[^:]*:\s*/i,
    /^Here(?:'s| is) (?:a |the )?(?:rewritten|enhanced|improved|revised|updated|optimized|refined|concise|structured|clarified|clearer) prompt[^:]*:\s*/i,
    /^(?:The )?(?:rewritten|enhanced|improved|revised|updated|optimized|refined|concise|structured|clarified|clearer) (?:version of (?:the|your) )?prompt[^:]*:\s*/i,
    /^(?:I've |I have )?(?:rewritten|enhanced|improved|revised|updated|optimized|refined) (?:the|your) prompt[^:]*:\s*/i,
    /^Below is (?:a |the )?(?:rewritten|enhanced|improved|revised|updated) (?:version of (?:the|your) )?prompt[^:]*:\s*/i,
  ];

  let result = content;
  for (const pattern of preamblePatterns) {
    result = result.replace(pattern, '');
  }

  return result.trim();
}

async function callGroqChatCompletion(params: {
  apiKey: string;
  model: string;
  mode: EnhanceMode;
  text: string;
  isPro: boolean;
}): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: buildEnhanceSystemPrompt(params.mode) },
        { role: "user", content: params.text },
      ],
      temperature: 0.25,
      max_tokens: getMaxOutputTokens(params.mode, params.isPro),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, status: response.status, error: errorText };
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  let content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { ok: false, status: 502, error: "Empty completion" };
  }

  // Strip any preamble text that Groq might have added
  content = stripGroqPreamble(content);

  return { ok: true, content };
}

// Check user's billing status from Convex
type BillingStatus = { isPro: boolean; isStudio: boolean; tier: "free" | "pro" | "studio" };

async function checkUserBillingStatus(userId: string, convexUrl: string): Promise<BillingStatus> {
  try {
    const response = await fetch(`${convexUrl}/api/extension/billing-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      return { isPro: false, isStudio: false, tier: "free" };
    }
    const data = await response.json() as { hasPro?: boolean; isStudio?: boolean; tier?: string };
    const isStudio = data.isStudio === true;
    const isPro = data.hasPro === true || isStudio;
    const tier = isStudio ? "studio" : isPro ? "pro" : "free";
    return { isPro, isStudio, tier };
  } catch {
    return { isPro: false, isStudio: false, tier: "free" };
  }
}

// Extract user ID from auth token (simplified for dev)
// Note: Consider adding proper JWT validation with Clerk for enhanced security
function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  // For development: token is the base64-encoded user info from auth flow
  try {
    const decoded = JSON.parse(atob(token));
    return decoded.userId || null;
  } catch {
    // Try to extract from JWT-like token (for production)
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload.sub || payload.userId || null;
      }
    } catch {
      return null;
    }
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const isEnhanceRoute = path === "/api/enhance";
    const isWebToolRoute = path === "/api/web/enhance" || path === "/api/web/evaluate" || path === "/api/web/migrate-memory";

    // Handle CORS preflight
    if (method === "OPTIONS") {
      const corsH = (isEnhanceRoute || isWebToolRoute)
        ? corsHeadersForEnhance(request, env)
        : corsHeaders(request, env);
      return new Response(null, { status: 204, headers: corsH });
    }

    // Add CORS headers to all responses
    const addCors = (response: Response, enhanceOnly = false): Response => {
      const headers = new Headers(response.headers);
      const cors = (enhanceOnly || isWebToolRoute) ? corsHeadersForEnhance(request, env) : corsHeaders(request, env);
      Object.entries(cors).forEach(([k, v]) => {
        headers.set(k, v);
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };

    try {
      // Managed-mode LLM proxy (credit-metered OpenRouter)
      if ((path === "/api/llm/chat" || path === "/api/llm/chat/completions") && method === "POST") {
        const res = await handleLlmChat(
          request,
          env as any,
          (token) => verifyAnyAuthJwt(token, env),
        );
        return addCors(res);
      }

      // Groq-enhanced prompt endpoint
      // POST /api/enhance
      if (path === "/api/enhance" && method === "POST") {
        const requestId = crypto.randomUUID();
        const start = Date.now();
        let cached = false;
        let modelUsed = ENHANCE_FREE_MODEL;
        let errorCode = "ok";
        let isPro = false;
        let inFlightKey: string | null = null;
        let inFlightLocked = false;

        try {
          const groqApiKey = getGroqApiKey(env);
          if (!groqApiKey) {
            errorCode = "missing_groq_key";
            return addCors(new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          const body = await request.json().catch(() => null) as { text?: string; mode?: string } | null;
          const text = body?.text?.trim();
          const mode = getEnhanceMode(body?.mode);

          if (!text) {
            errorCode = "missing_text";
            return addCors(new Response(JSON.stringify({ error: "Missing text" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          if (!mode) {
            errorCode = "invalid_mode";
            return addCors(new Response(JSON.stringify({ error: "Invalid mode" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          if (text.length > ENHANCE_MAX_INPUT_CHARS) {
            errorCode = "input_too_long";
            return addCors(new Response(JSON.stringify({ error: "Prompt too long to enhance" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // Get user ID from auth token (required for enhance)
          const userId = getUserIdFromToken(request.headers.get("Authorization"));
          if (!userId) {
            errorCode = "unauthorized";
            return addCors(new Response(JSON.stringify({ error: "Sign in required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // Check billing status to determine limits and model
          const billing = await checkUserBillingStatus(userId, env.CONVEX_URL);
          isPro = billing.isPro;

          const rateKey = `user:${userId}`;
          const model = getModel(isPro);
          modelUsed = model;

          inFlightKey = `${rateKey}:inflight`;
          inFlightLocked = await acquireInFlightLock(inFlightKey, ENHANCE_IN_FLIGHT_TTL_SECONDS);
          if (!inFlightLocked) {
            errorCode = "rate_limit_in_flight";
            return addCors(new Response(JSON.stringify({
              error: "Enhance already running. Please wait for it to finish.",
              code: "IN_FLIGHT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // === RATE LIMITING ===

          // 1. Daily limit (Free: 10/day, Pro: 100/day)
          const dayLimit = isPro ? ENHANCE_PRO_DAY_LIMIT : ENHANCE_FREE_DAY_LIMIT;
          const dayCount = await incrementRateCounter(`${rateKey}:day`, 24 * 60 * 60);
          if (dayCount > dayLimit) {
            errorCode = "rate_limit_day";
            return addCors(new Response(JSON.stringify({
              error: isPro ? "Daily enhance limit reached (100/day)" : "Daily enhance limit reached (10/day). Upgrade to Pro for more.",
              code: "DAILY_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // 2. Rolling window: 2 requests/minute
          const minuteCount = await incrementRateCounter(`${rateKey}:minute`, 60);
          if (minuteCount > ENHANCE_MINUTE_LIMIT) {
            errorCode = "rate_limit_minute";
            return addCors(new Response(JSON.stringify({
              error: "Too many requests. Please wait a moment.",
              code: "MINUTE_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // 3. Rolling window: 10 requests/10 minutes
          const tenMinCount = await incrementRateCounter(`${rateKey}:10min`, 10 * 60);
          if (tenMinCount > ENHANCE_10MIN_LIMIT) {
            errorCode = "rate_limit_10min";
            return addCors(new Response(JSON.stringify({
              error: "Too many requests. Please wait a few minutes.",
              code: "TEN_MIN_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // 4. Same-prompt spam guard (hash-based)
          const promptHash = await sha256Hex(`${text}${mode}`);
          const sameHashLimit = isPro ? ENHANCE_PRO_SAME_HASH_HOUR : ENHANCE_FREE_SAME_HASH_HOUR;
          const sameHashCount = await incrementRateCounter(`${rateKey}:hash:${promptHash}`, 60 * 60);
          if (sameHashCount > sameHashLimit) {
            errorCode = "rate_limit_same_prompt";
            return addCors(new Response(JSON.stringify({
              error: "Same prompt enhanced too many times. Try a different prompt.",
              code: "SAME_PROMPT_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // === CACHE LOOKUP ===
          const cacheKey = await sha256Hex(`${text}${mode}${model}`);
          const cachedResult = await getCachedJson<{ enhanced: string; mode: EnhanceMode; model: string }>(cacheKey);
          if (cachedResult?.enhanced) {
            cached = true;
            return addCors(new Response(JSON.stringify({
              enhanced: cachedResult.enhanced,
              mode,
              model,
              cached: true,
            }), {
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // === CALL GROQ ===
          const result = await callGroqChatCompletion({
            apiKey: groqApiKey,
            model,
            mode,
            text,
            isPro,
          });

          if (!result.ok) {
            errorCode = `groq_${result.status}`;
            return addCors(new Response(JSON.stringify({ error: "Enhance failed. Please try again." }), {
              status: 502,
              headers: { "Content-Type": "application/json" },
            }), true);
          }

          // Cache the result
          await putCachedJson(cacheKey, {
            enhanced: result.content,
            mode,
            model,
          }, ENHANCE_CACHE_TTL_SECONDS);

          return addCors(new Response(JSON.stringify({
            enhanced: result.content,
            mode,
            model,
            cached: false,
          }), {
            headers: { "Content-Type": "application/json" },
          }), true);
        } finally {
          if (inFlightLocked && inFlightKey) {
            try {
              await releaseInFlightLock(inFlightKey);
            } catch {
              // Ignore lock release failures.
            }
          }
          const durationMs = Date.now() - start;
        }
      }

      // POST /api/evaluate - Evaluate prompt quality across all LLMs
      // Pro/Studio only feature
      if (path === "/api/evaluate" && method === "POST") {
        let inFlightKey: string | null = null;
        let inFlightLocked = false;

        try {
          const groqApiKey = getGroqApiKey(env);
          if (!groqApiKey) {
            return addCors(new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }));
          }

          const body = (await request.json().catch(() => null)) as {
            text?: string;
            selectedManagedModels?: Partial<Record<ManagedTier, string>>;
            classifierTier?: unknown;
            classifierEffort?: unknown;
            byokProviders?: unknown;
          } | null;
          const text = body?.text?.trim();

          if (!text) {
            return addCors(new Response(JSON.stringify({ error: "Missing text" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }));
          }

          if (text.length > EVAL_MAX_INPUT_CHARS) {
            return addCors(new Response(JSON.stringify({ error: "Prompt too long to evaluate" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Get user ID from auth token (required)
          const userId = getUserIdFromToken(request.headers.get("Authorization"));
          if (!userId) {
            return addCors(new Response(JSON.stringify({ error: "Sign in required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Check billing status - must be Pro or Studio
          const billing = await checkUserBillingStatus(userId, env.CONVEX_URL);
          if (!billing.isPro) {
            return addCors(new Response(JSON.stringify({
              error: "Upgrade to Pro to evaluate prompts",
              code: "TIER_REQUIRED"
            }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }));
          }

          const rateKey = `user:${userId}:eval`;

          // In-flight lock
          inFlightKey = `${rateKey}:inflight`;
          inFlightLocked = await acquireInFlightLock(inFlightKey, EVAL_IN_FLIGHT_TTL_SECONDS);
          if (!inFlightLocked) {
            return addCors(new Response(JSON.stringify({
              error: "Evaluation already running. Please wait for it to finish.",
              code: "IN_FLIGHT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Daily limit based on tier
          const dayLimit = billing.isStudio ? EVAL_STUDIO_DAY_LIMIT : EVAL_PRO_DAY_LIMIT;
          const dayCount = await incrementRateCounter(`${rateKey}:day`, 24 * 60 * 60);
          if (dayCount > dayLimit) {
            return addCors(new Response(JSON.stringify({
              error: billing.isStudio
                ? "Daily evaluation limit reached (500/day)"
                : "Daily evaluation limit reached (100/day). Upgrade to Studio for more.",
              code: "DAILY_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Rolling window: 5 requests/minute
          const minuteCount = await incrementRateCounter(`${rateKey}:minute`, 60);
          if (minuteCount > EVAL_MINUTE_LIMIT) {
            return addCors(new Response(JSON.stringify({
              error: "Too many requests. Please wait a moment.",
              code: "MINUTE_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Rolling window: 20 requests/10 minutes
          const tenMinCount = await incrementRateCounter(`${rateKey}:10min`, 10 * 60);
          if (tenMinCount > EVAL_10MIN_LIMIT) {
            return addCors(new Response(JSON.stringify({
              error: "Too many requests. Please wait a few minutes.",
              code: "TEN_MIN_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Resolve selected managed models per tier (fallback to
          // recommended-for-tier when client sends an invalid id or omits
          // the tier entirely).
          const rawSelections = body?.selectedManagedModels ?? {};
          const resolveTierModel = (tier: ManagedTier) => {
            const sentId = rawSelections[tier];
            const m = sentId ? getManagedModel(sentId) : undefined;
            if (m && m.tier === tier) return m;
            return recommendedForTier(tier);
          };
          const tierSelections: Record<ManagedTier, { id: string; label: string }> = {
            cheap: { id: resolveTierModel("cheap").id, label: resolveTierModel("cheap").label },
            mid: { id: resolveTierModel("mid").id, label: resolveTierModel("mid").label },
            frontier: { id: resolveTierModel("frontier").id, label: resolveTierModel("frontier").label },
          };

          const classifierTier = isClassifierTier(body?.classifierTier) ? body!.classifierTier : null;
          const classifierEffort = isClassifierEffort(body?.classifierEffort) ? body!.classifierEffort : null;

          const rawByok = Array.isArray(body?.byokProviders) ? body!.byokProviders : [];
          const byokProviders: ByokProvider[] = [];
          for (const p of rawByok) {
            if (typeof p === "string" && VALID_BYOK_PROVIDERS.includes(p as ByokProvider)) {
              if (!byokProviders.includes(p as ByokProvider)) byokProviders.push(p as ByokProvider);
            }
          }

          // Cache lookup by prompt hash (v2 namespace — old `eval:` keys
          // are inert and expire naturally).
          const promptHash = await sha256Hex(text);
          const cacheKey = `eval:v2:${promptHash}`;
          type CachedV2 = {
            tiers: Record<ManagedTier, number>;
            bestTier: ManagedTier;
            modelsInBestTier: Record<string, number>;
            rationale?: string;
          };
          const cachedResult = await getCachedJson<CachedV2>(cacheKey);

          let groqTiers: Record<ManagedTier, number>;
          let groqBestTier: ManagedTier;
          let groqModelsInBestTier: Record<string, number>;
          let rationale: string | undefined;
          let cached = false;

          if (cachedResult && isManagedTier(cachedResult.bestTier) && cachedResult.tiers) {
            groqTiers = cachedResult.tiers;
            groqBestTier = cachedResult.bestTier;
            groqModelsInBestTier = cachedResult.modelsInBestTier ?? {};
            rationale = cachedResult.rationale;
            cached = true;
          } else {
            const evalSystemPrompt = `You are an expert prompt-routing evaluator. Score how three model tiers handle the user's prompt, then rank the candidate models inside the recommended tier.

Tiers:
- Cheap: ${TIER_DESCRIPTIONS.cheap}
- Mid: ${TIER_DESCRIPTIONS.mid}
- Frontier: ${TIER_DESCRIPTIONS.frontier}

Scoring rules (0-100):
- 0-30: tier struggles or fails.
- 40-65: tier is OK but suboptimal.
- 70-100: tier handles the prompt well.
- Penalize overkill: a trivial prompt should score ~95 on Cheap and 88-92 on Frontier (still high, but lower — cost/latency doesn't pay).
- Penalize underkill: a complex prompt should score 35-55 on Cheap.

Recommended tier defaults to the LR classifier's pick unless your tier scores show another tier at least 10 points higher.

You must also rank the candidate models inside the recommended tier on the same 0-100 scale, accounting for each model's strengths (reasoning, code, writing, multimodal, recency of data).

Return ONLY valid JSON, no markdown:
{
  "tiers": { "cheap": <int>, "mid": <int>, "frontier": <int> },
  "bestTier": "cheap"|"mid"|"frontier",
  "modelsInBestTier": { "<modelId>": <int>, ... },
  "rationale": "<one-line explanation, <=80 chars>"
}`;

            const userMessage = [
              `LR classifier prediction: tier=${classifierTier ?? "unknown"}, effort=${classifierEffort ?? "none"}`,
              "",
              "Candidate models in each tier:",
              `- Cheap: ${modelsCatalogForPrompt("cheap")}`,
              `- Mid: ${modelsCatalogForPrompt("mid")}`,
              `- Frontier: ${modelsCatalogForPrompt("frontier")}`,
              "",
              "Prompt:",
              text,
            ].join("\n");

            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqApiKey}`,
              },
              body: JSON.stringify({
                model: EVAL_MODEL,
                messages: [
                  { role: "system", content: evalSystemPrompt },
                  { role: "user", content: userMessage },
                ],
                temperature: 0.15,
                max_tokens: 400,
              }),
            });

            if (!groqResponse.ok) {
              console.error("Groq evaluation error:", groqResponse.status, await groqResponse.text().catch(() => ""));
              return addCors(new Response(JSON.stringify({ error: "Evaluation failed. Please try again." }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
              }));
            }

            const groqData = (await groqResponse.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const content = groqData.choices?.[0]?.message?.content?.trim() || "";

            try {
              // Greedy outer-brace match to allow nested objects.
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (!jsonMatch) throw new Error("No JSON found in response");
              const parsed = JSON.parse(jsonMatch[0]) as {
                tiers?: Record<string, number>;
                bestTier?: unknown;
                modelsInBestTier?: Record<string, number>;
                rationale?: unknown;
              };

              if (!parsed.tiers || typeof parsed.tiers !== "object") throw new Error("Missing tiers");
              groqTiers = {
                cheap: clampScore(parsed.tiers.cheap),
                mid: clampScore(parsed.tiers.mid),
                frontier: clampScore(parsed.tiers.frontier),
              };

              const llmPickedTier = isManagedTier(parsed.bestTier) ? parsed.bestTier : null;
              if (classifierTier && llmPickedTier && llmPickedTier !== classifierTier) {
                const lead = groqTiers[llmPickedTier] - groqTiers[classifierTier];
                groqBestTier = lead >= 10 ? llmPickedTier : classifierTier;
              } else {
                groqBestTier = llmPickedTier ?? classifierTier ?? (
                  // argmax fallback
                  groqTiers.frontier >= groqTiers.mid && groqTiers.frontier >= groqTiers.cheap
                    ? "frontier"
                    : groqTiers.mid >= groqTiers.cheap
                      ? "mid"
                      : "cheap"
                );
              }

              const candidateIds = new Set(modelsByTier(groqBestTier).map((m) => m.id));
              const rawModelScores = parsed.modelsInBestTier ?? {};
              groqModelsInBestTier = {};
              for (const id of Object.keys(rawModelScores)) {
                if (candidateIds.has(id)) {
                  groqModelsInBestTier[id] = clampScore(rawModelScores[id]);
                }
              }
              // Backfill any candidate missing a score with the tier's overall score.
              for (const id of candidateIds) {
                if (!(id in groqModelsInBestTier)) {
                  groqModelsInBestTier[id] = groqTiers[groqBestTier];
                }
              }

              if (typeof parsed.rationale === "string") {
                rationale = parsed.rationale.slice(0, 80);
              }
            } catch (parseError) {
              console.error("Failed to parse evaluation scores:", content, parseError);
              return addCors(new Response(JSON.stringify({ error: "Failed to parse evaluation. Please try again." }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
              }));
            }

            await putCachedJson(
              cacheKey,
              { tiers: groqTiers, bestTier: groqBestTier, modelsInBestTier: groqModelsInBestTier, rationale },
              EVAL_CACHE_TTL_SECONDS,
            );
          }

          // Build per-tier rows from selected models + Groq scores.
          const tiersOut = {
            cheap: {
              tier: "cheap" as const,
              score: groqTiers.cheap,
              selectedModelId: tierSelections.cheap.id,
              selectedModelLabel: tierSelections.cheap.label,
            },
            mid: {
              tier: "mid" as const,
              score: groqTiers.mid,
              selectedModelId: tierSelections.mid.id,
              selectedModelLabel: tierSelections.mid.label,
            },
            frontier: {
              tier: "frontier" as const,
              score: groqTiers.frontier,
              selectedModelId: tierSelections.frontier.id,
              selectedModelLabel: tierSelections.frontier.label,
            },
          };

          // Rank models inside the recommended tier; argmax = recommendedModel.
          const bestTierCatalog = modelsByTier(groqBestTier);
          const bestTierModels = bestTierCatalog
            .map((m) => ({
              modelId: m.id,
              label: m.label,
              score: groqModelsInBestTier[m.id] ?? groqTiers[groqBestTier],
            }))
            .sort((a, b) => b.score - a.score);
          const recommendedModel = bestTierModels[0] ?? {
            modelId: tierSelections[groqBestTier].id,
            label: tierSelections[groqBestTier].label,
            score: groqTiers[groqBestTier],
          };

          // Effort: classifier's pick, clamped to recommendedModel's
          // reasoning support. Worker doesn't carry model-level reasoning
          // flags (those live in the desktop catalog), so we apply a
          // simple rule: cheap tier => no effort; non-reasoning model
          // ids => no effort; otherwise pass through.
          //
          // The client is the only consumer that re-clamps against the
          // full ManagedModel record before display, so the worker's
          // value is advisory.
          let recommendedEffort: "low" | "medium" | "high" | null = classifierEffort;
          if (groqBestTier === "cheap") recommendedEffort = null;

          // BYOK rows: pin each configured provider to its canonical
          // model in the recommended tier. Skip providers without a
          // model at that tier.
          const byokRows = byokProviders
            .map((provider) => {
              const m = byokModelForTier(provider, groqBestTier);
              if (!m) return null;
              return {
                provider,
                modelId: m.modelId,
                modelLabel: m.label,
                tier: groqBestTier,
                score: groqTiers[groqBestTier],
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null);

          const evaluatedAt = Date.now();

          const responseBody = {
            promptHash,
            schemaVersion: 2 as const,
            tiers: tiersOut,
            recommendedTier: groqBestTier,
            recommendedModelId: recommendedModel.modelId,
            recommendedModelLabel: recommendedModel.label,
            recommendedEffort,
            bestTierModels,
            byok: byokRows.length > 0 ? byokRows : undefined,
            rationale,
            evaluatedAt,
            cached,
          };

          // Save to Convex (v2 shape). Failure is non-fatal.
          try {
            await fetch(`${env.CONVEX_URL}/api/desktop/save-evaluation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                promptHash,
                schemaVersion: 2,
                tiers: tiersOut,
                recommendedTier: groqBestTier,
                recommendedModelId: recommendedModel.modelId,
                recommendedModelLabel: recommendedModel.label,
                recommendedEffort,
                bestTierModels,
                byok: byokRows,
                rationale,
                evaluatedAt,
              }),
            });
          } catch (saveError) {
            console.error("Failed to save evaluation to Convex:", saveError);
          }

          return addCors(new Response(JSON.stringify(responseBody), {
            headers: { "Content-Type": "application/json" },
          }));

        } finally {
          if (inFlightLocked && inFlightKey) {
            try {
              await releaseInFlightLock(inFlightKey);
            } catch {
              // Ignore lock release failures
            }
          }
        }
      }

      // ── Web Tool: POST /api/web/enhance ────────────────────────────────
      // Public-facing enhance endpoint with IP-based rate limiting for anonymous users
      if (path === "/api/web/enhance" && method === "POST") {
        try {
          const groqApiKey = getGroqApiKey(env);
          if (!groqApiKey) {
            return addCors(new Response(JSON.stringify({ error: "Service unavailable" }), {
              status: 500, headers: { "Content-Type": "application/json" },
            }));
          }

          const body = await request.json().catch(() => null) as { text?: string; mode?: string } | null;
          const text = body?.text?.trim();
          const mode = getEnhanceMode(body?.mode);

          if (!text) {
            return addCors(new Response(JSON.stringify({ error: "Missing text" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }
          if (!mode) {
            return addCors(new Response(JSON.stringify({ error: "Invalid mode" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }
          if (text.length > ENHANCE_MAX_INPUT_CHARS) {
            return addCors(new Response(JSON.stringify({ error: "Prompt too long" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }

          // Optionally authenticate (not required)
          const userId = getUserIdFromToken(request.headers.get("Authorization"));
          let isPro = false;
          let dayLimit = WEB_ENHANCE_ANON_DAY;
          let rateKey: string;

          if (userId) {
            const billing = await checkUserBillingStatus(userId, env.CONVEX_URL);
            isPro = billing.isPro;
            dayLimit = isPro ? WEB_ENHANCE_PRO_DAY : WEB_ENHANCE_FREE_DAY;
            rateKey = `webuser:${userId}:enhance`;
          } else {
            const ip = request.headers.get("CF-Connecting-IP") || "unknown";
            rateKey = `webip:${ip}:enhance`;
          }

          // Burst limit: 1 req/min for anonymous
          if (!userId) {
            const minuteCount = await incrementRateCounter(`${rateKey}:minute`, 60);
            if (minuteCount > 1) {
              return addCors(new Response(JSON.stringify({
                error: "Please wait a moment before trying again.",
                code: "MINUTE_LIMIT",
              }), { status: 429, headers: { "Content-Type": "application/json" } }));
            }
          }

          // Daily limit
          const dayCount = await incrementRateCounter(`${rateKey}:day`, 24 * 60 * 60);
          if (dayCount > dayLimit) {
            const errorMsg = !userId
              ? "Sign up free for more daily uses."
              : isPro
                ? "Daily limit reached."
                : "Daily limit reached. Upgrade to Pro for more.";
            return addCors(new Response(JSON.stringify({
              error: errorMsg,
              code: "DAILY_LIMIT",
              remaining: 0,
            }), { status: 429, headers: { "Content-Type": "application/json" } }));
          }

          // Cache lookup
          const model = getModel(isPro);
          const cacheKey = await sha256Hex(`${text}${mode}${model}`);
          const cachedResult = await getCachedJson<{ enhanced: string; mode: EnhanceMode; model: string }>(cacheKey);
          if (cachedResult?.enhanced) {
            return addCors(new Response(JSON.stringify({
              enhanced: cachedResult.enhanced,
              mode,
              model,
              cached: true,
              remaining: Math.max(0, dayLimit - dayCount),
            }), { headers: { "Content-Type": "application/json" } }));
          }

          // Call Groq
          const result = await callGroqChatCompletion({ apiKey: groqApiKey, model, mode, text, isPro });
          if (!result.ok) {
            return addCors(new Response(JSON.stringify({ error: "Enhancement failed. Please try again." }), {
              status: 502, headers: { "Content-Type": "application/json" },
            }));
          }

          await putCachedJson(cacheKey, { enhanced: result.content, mode, model }, ENHANCE_CACHE_TTL_SECONDS);

          return addCors(new Response(JSON.stringify({
            enhanced: result.content,
            mode,
            model,
            cached: false,
            remaining: Math.max(0, dayLimit - dayCount),
          }), { headers: { "Content-Type": "application/json" } }));
        } catch {
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // ── Web Tool: POST /api/web/evaluate ───────────────────────────────
      // Public-facing evaluate endpoint with IP-based rate limiting for anonymous users
      if (path === "/api/web/evaluate" && method === "POST") {
        try {
          const groqApiKey = getGroqApiKey(env);
          if (!groqApiKey) {
            return addCors(new Response(JSON.stringify({ error: "Service unavailable" }), {
              status: 500, headers: { "Content-Type": "application/json" },
            }));
          }

          const body = await request.json().catch(() => null) as { text?: string } | null;
          const text = body?.text?.trim();

          if (!text) {
            return addCors(new Response(JSON.stringify({ error: "Missing text" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }
          if (text.length > EVAL_MAX_INPUT_CHARS) {
            return addCors(new Response(JSON.stringify({ error: "Prompt too long" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }

          // Optionally authenticate
          const userId = getUserIdFromToken(request.headers.get("Authorization"));
          let dayLimit = WEB_EVALUATE_ANON_DAY;
          let rateKey: string;

          if (userId) {
            const billing = await checkUserBillingStatus(userId, env.CONVEX_URL);
            dayLimit = billing.isPro ? WEB_EVALUATE_PRO_DAY : WEB_EVALUATE_FREE_DAY;
            rateKey = `webuser:${userId}:eval`;
          } else {
            const ip = request.headers.get("CF-Connecting-IP") || "unknown";
            rateKey = `webip:${ip}:eval`;
          }

          // Burst limit for anonymous
          if (!userId) {
            const minuteCount = await incrementRateCounter(`${rateKey}:minute`, 60);
            if (minuteCount > 1) {
              return addCors(new Response(JSON.stringify({
                error: "Please wait a moment before trying again.",
                code: "MINUTE_LIMIT",
              }), { status: 429, headers: { "Content-Type": "application/json" } }));
            }
          }

          // Daily limit
          const dayCount = await incrementRateCounter(`${rateKey}:day`, 24 * 60 * 60);
          if (dayCount > dayLimit) {
            const errorMsg = !userId
              ? "Sign up free for more daily uses."
              : "Daily limit reached. Upgrade to Pro for more.";
            return addCors(new Response(JSON.stringify({
              error: errorMsg,
              code: "DAILY_LIMIT",
              remaining: 0,
            }), { status: 429, headers: { "Content-Type": "application/json" } }));
          }

          // Cache lookup (v2 namespace)
          const promptHash = await sha256Hex(text);
          const cacheKey = `eval:web:v2:${promptHash}`;
          type WebCacheV2 = {
            tiers: Record<ManagedTier, number>;
            bestTier: ManagedTier;
            modelsInBestTier: Record<string, number>;
            rationale?: string;
          };
          const cachedResult = await getCachedJson<WebCacheV2>(cacheKey);

          let webTiers: Record<ManagedTier, number>;
          let webBestTier: ManagedTier;
          let webModelsInBestTier: Record<string, number>;
          let webRationale: string | undefined;
          let webCached = false;

          if (cachedResult && isManagedTier(cachedResult.bestTier) && cachedResult.tiers) {
            webTiers = cachedResult.tiers;
            webBestTier = cachedResult.bestTier;
            webModelsInBestTier = cachedResult.modelsInBestTier ?? {};
            webRationale = cachedResult.rationale;
            webCached = true;
          } else {
            const evalSystemPrompt = `You are an expert prompt-routing evaluator. Score how three model tiers handle the user's prompt, then rank the candidate models inside the recommended tier.

Tiers:
- Cheap: ${TIER_DESCRIPTIONS.cheap}
- Mid: ${TIER_DESCRIPTIONS.mid}
- Frontier: ${TIER_DESCRIPTIONS.frontier}

Scoring rules (0-100):
- 0-30: tier struggles or fails.
- 40-65: tier is OK but suboptimal.
- 70-100: tier handles the prompt well.
- Penalize overkill on trivial prompts.
- Penalize underkill on complex prompts.

Return ONLY valid JSON, no markdown:
{
  "tiers": { "cheap": <int>, "mid": <int>, "frontier": <int> },
  "bestTier": "cheap"|"mid"|"frontier",
  "modelsInBestTier": { "<modelId>": <int>, ... },
  "rationale": "<one-line explanation, <=80 chars>"
}`;

            const userMessage = [
              "Candidate models in each tier:",
              `- Cheap: ${modelsCatalogForPrompt("cheap")}`,
              `- Mid: ${modelsCatalogForPrompt("mid")}`,
              `- Frontier: ${modelsCatalogForPrompt("frontier")}`,
              "",
              "Prompt:",
              text,
            ].join("\n");

            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqApiKey}`,
              },
              body: JSON.stringify({
                model: EVAL_MODEL,
                messages: [
                  { role: "system", content: evalSystemPrompt },
                  { role: "user", content: userMessage },
                ],
                temperature: 0.15,
                max_tokens: 400,
              }),
            });

            if (!groqResponse.ok) {
              return addCors(new Response(JSON.stringify({ error: "Evaluation failed. Please try again." }), {
                status: 502, headers: { "Content-Type": "application/json" },
              }));
            }

            const groqData = (await groqResponse.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const content = groqData.choices?.[0]?.message?.content?.trim() || "";

            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (!jsonMatch) throw new Error("No JSON found");
              const parsed = JSON.parse(jsonMatch[0]) as {
                tiers?: Record<string, number>;
                bestTier?: unknown;
                modelsInBestTier?: Record<string, number>;
                rationale?: unknown;
              };
              if (!parsed.tiers || typeof parsed.tiers !== "object") throw new Error("Missing tiers");
              webTiers = {
                cheap: clampScore(parsed.tiers.cheap),
                mid: clampScore(parsed.tiers.mid),
                frontier: clampScore(parsed.tiers.frontier),
              };
              webBestTier = isManagedTier(parsed.bestTier)
                ? parsed.bestTier
                : webTiers.frontier >= webTiers.mid && webTiers.frontier >= webTiers.cheap
                  ? "frontier"
                  : webTiers.mid >= webTiers.cheap
                    ? "mid"
                    : "cheap";

              const candidateIds = new Set(modelsByTier(webBestTier).map((m) => m.id));
              const rawModelScores = parsed.modelsInBestTier ?? {};
              webModelsInBestTier = {};
              for (const id of Object.keys(rawModelScores)) {
                if (candidateIds.has(id)) {
                  webModelsInBestTier[id] = clampScore(rawModelScores[id]);
                }
              }
              for (const id of candidateIds) {
                if (!(id in webModelsInBestTier)) {
                  webModelsInBestTier[id] = webTiers[webBestTier];
                }
              }
              if (typeof parsed.rationale === "string") {
                webRationale = parsed.rationale.slice(0, 80);
              }
            } catch {
              return addCors(new Response(JSON.stringify({ error: "Failed to parse evaluation. Please try again." }), {
                status: 502, headers: { "Content-Type": "application/json" },
              }));
            }

            await putCachedJson(
              cacheKey,
              { tiers: webTiers, bestTier: webBestTier, modelsInBestTier: webModelsInBestTier, rationale: webRationale },
              EVAL_CACHE_TTL_SECONDS,
            );
          }

          // Web tool has no settings store — pick the recommended model
          // in each tier and the highest scorer within the best tier.
          const webTierSelections: Record<ManagedTier, { id: string; label: string }> = {
            cheap: { id: recommendedForTier("cheap").id, label: recommendedForTier("cheap").label },
            mid: { id: recommendedForTier("mid").id, label: recommendedForTier("mid").label },
            frontier: { id: recommendedForTier("frontier").id, label: recommendedForTier("frontier").label },
          };
          const webBestTierModels = modelsByTier(webBestTier)
            .map((m) => ({
              modelId: m.id,
              label: m.label,
              score: webModelsInBestTier[m.id] ?? webTiers[webBestTier],
            }))
            .sort((a, b) => b.score - a.score);
          const webRecommendedModel = webBestTierModels[0] ?? {
            modelId: webTierSelections[webBestTier].id,
            label: webTierSelections[webBestTier].label,
            score: webTiers[webBestTier],
          };

          return addCors(new Response(JSON.stringify({
            promptHash,
            schemaVersion: 2,
            tiers: {
              cheap: { tier: "cheap", score: webTiers.cheap, selectedModelId: webTierSelections.cheap.id, selectedModelLabel: webTierSelections.cheap.label },
              mid: { tier: "mid", score: webTiers.mid, selectedModelId: webTierSelections.mid.id, selectedModelLabel: webTierSelections.mid.label },
              frontier: { tier: "frontier", score: webTiers.frontier, selectedModelId: webTierSelections.frontier.id, selectedModelLabel: webTierSelections.frontier.label },
            },
            recommendedTier: webBestTier,
            recommendedModelId: webRecommendedModel.modelId,
            recommendedModelLabel: webRecommendedModel.label,
            recommendedEffort: webBestTier === "cheap" ? null : "medium",
            bestTierModels: webBestTierModels,
            rationale: webRationale,
            evaluatedAt: Date.now(),
            cached: webCached,
            remaining: Math.max(0, dayLimit - dayCount),
          }), { headers: { "Content-Type": "application/json" } }));
        } catch {
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // ── Web Tool: POST /api/web/migrate-memory ──────────────────────────
      // Public-facing ChatGPT-to-Claude memory migration endpoint
      if (path === "/api/web/migrate-memory" && method === "POST") {
        try {
          const groqApiKey = getGroqApiKey(env);
          if (!groqApiKey) {
            return addCors(new Response(JSON.stringify({ error: "Service unavailable" }), {
              status: 500, headers: { "Content-Type": "application/json" },
            }));
          }

          const body = await request.json().catch(() => null) as { text?: string; format?: string } | null;
          const text = body?.text?.trim();
          const format = body?.format === "claude-md" ? "claude-md" : "memory";

          if (!text) {
            return addCors(new Response(JSON.stringify({ error: "Missing text" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }
          if (text.length > MIGRATE_MAX_INPUT_CHARS) {
            return addCors(new Response(JSON.stringify({ error: "Text too long (max 15,000 characters)" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }

          // Optionally authenticate
          const userId = getUserIdFromToken(request.headers.get("Authorization"));
          let dayLimit = WEB_MIGRATE_ANON_DAY;
          let rateKey: string;

          if (userId) {
            const billing = await checkUserBillingStatus(userId, env.CONVEX_URL);
            dayLimit = billing.isPro ? WEB_MIGRATE_PRO_DAY : WEB_MIGRATE_FREE_DAY;
            rateKey = `webuser:${userId}:migrate`;
          } else {
            const ip = request.headers.get("CF-Connecting-IP") || "unknown";
            rateKey = `webip:${ip}:migrate`;
          }

          // Burst limit for anonymous
          if (!userId) {
            const minuteCount = await incrementRateCounter(`${rateKey}:minute`, 60);
            if (minuteCount > 1) {
              return addCors(new Response(JSON.stringify({
                error: "Please wait a moment before trying again.",
                code: "MINUTE_LIMIT",
              }), { status: 429, headers: { "Content-Type": "application/json" } }));
            }
          }

          // Daily limit
          const dayCount = await incrementRateCounter(`${rateKey}:day`, 24 * 60 * 60);
          if (dayCount > dayLimit) {
            const errorMsg = !userId
              ? "Sign up free for more daily uses."
              : "Daily limit reached. Upgrade to Pro for more.";
            return addCors(new Response(JSON.stringify({
              error: errorMsg,
              code: "DAILY_LIMIT",
              remaining: 0,
            }), { status: 429, headers: { "Content-Type": "application/json" } }));
          }

          // Cache lookup
          const promptHash = await sha256Hex(text + "|" + format);
          const cacheKey = `migrate:web:${promptHash}`;
          const cachedResult = await getCachedJson<{ organized: string }>(cacheKey);

          if (cachedResult?.organized) {
            return addCors(new Response(JSON.stringify({
              organized: cachedResult.organized,
              cached: true,
              remaining: Math.max(0, dayLimit - dayCount),
            }), { headers: { "Content-Type": "application/json" } }));
          }

          const migrateSystemPrompt = format === "claude-md"
            ? `You are an expert at analyzing AI conversation history and extracting durable, high-signal knowledge about a person.

The user will paste content from their ChatGPT history — this may be raw memories, conversation excerpts, or chat logs. Your job is to synthesize a comprehensive cognitive profile formatted as a CLAUDE.md file for use with Claude Code.

## OUTPUT FORMAT

Output a CLAUDE.md file with this structure:

# User Profile

## Identity & Background
Who they are professionally and personally. Role, industry, experience level.

## Personality & Thinking Style
How they approach problems, make decisions, process information.

## Communication Preferences
How they like to receive information. Preferred tone, length, detail level, formality.

## Technical Skills & Tools
Languages, frameworks, platforms, tools they use with proficiency levels.

## Active Projects & Interests
What they're currently working on. Domain expertise.

## Decision-Making Patterns
How they evaluate options, what they prioritize, recurring frameworks.

## Working Style
How they organize work, collaborate, manage time.

## Output Preferences
How they want AI responses formatted. Constraints and formatting preferences.

## RULES:
- Extract ONLY what is clearly supported by the input — never invent or assume
- Use second person ("You prefer...", "You tend to...")
- Be specific and concrete, not generic
- Merge overlapping signals into clear statements
- Prioritize durable traits over one-time mentions
- Skip sections with no supporting evidence
- Output clean markdown, no code fences around the whole output, no preamble, no commentary`
            : `You are an expert at analyzing AI conversation history and extracting durable, high-signal knowledge about a person.

The user will paste content from their ChatGPT history — this may be raw memories, conversation excerpts, or chat logs. Your job is to synthesize a comprehensive cognitive profile that captures who this person is, how they think, and how they work. This profile will be pasted into Claude's memory settings.

## OUTPUT STRUCTURE

Create a profile with these sections (skip any section with no supporting evidence):

### Identity & Background
Who they are professionally and personally. Role, industry, experience level, location.

### Personality & Thinking Style
How they approach problems, make decisions, and process information. Cognitive patterns and tendencies.

### Communication Preferences
How they like to receive information. Preferred tone, length, level of detail, formality.

### Technical Skills & Tools
Languages, frameworks, platforms, and tools they use. Proficiency levels where evident.

### Active Projects & Interests
What they're currently working on or care about. Domain expertise.

### Decision-Making Patterns
How they evaluate options, what they prioritize, recurring decision frameworks.

### Working Style
How they organize work, collaborate, manage time. Preferences for structure vs flexibility.

### Output Preferences
How they want AI responses formatted. Constraints, formatting preferences.

## RULES:
- Extract ONLY what is clearly supported by the input — never invent or assume
- Use second person ("You prefer...", "You tend to...")
- Be specific and concrete, not generic
- Merge overlapping signals into clear statements
- Prioritize durable traits over one-time mentions
- Output clean markdown, no code fences, no preamble, no commentary`;

          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: MIGRATE_MODEL,
              messages: [
                { role: "system", content: migrateSystemPrompt },
                { role: "user", content: text },
              ],
              temperature: 0.2,
              max_tokens: 2500,
            }),
          });

          if (!groqResponse.ok) {
            return addCors(new Response(JSON.stringify({ error: "Migration failed. Please try again." }), {
              status: 502, headers: { "Content-Type": "application/json" },
            }));
          }

          const groqData = await groqResponse.json() as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const organized = groqData.choices?.[0]?.message?.content?.trim() || "";

          if (!organized) {
            return addCors(new Response(JSON.stringify({ error: "Failed to generate profile. Please try again." }), {
              status: 502, headers: { "Content-Type": "application/json" },
            }));
          }

          await putCachedJson(cacheKey, { organized }, MIGRATE_CACHE_TTL_SECONDS);

          return addCors(new Response(JSON.stringify({
            organized,
            cached: false,
            remaining: Math.max(0, dayLimit - dayCount),
          }), { headers: { "Content-Type": "application/json" } }));
        } catch {
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // Health check
      if (path === "/health") {
        return addCors(new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Auth status check (validates any supported JWT)
      if (path === "/auth/status" && (method === "GET" || method === "POST")) {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        const payload = token ? await verifyAnyAuthJwt(token, env) : null;
        if (!payload?.sub) {
          return addCors(new Response(JSON.stringify({ error: "Sign in required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }));
        }

        return addCors(new Response(JSON.stringify({
          ok: true,
          userId: payload.sub,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Auth refresh (proxy to Convex for refresh token rotation)
      if (path === "/auth/refresh" && method === "POST") {
        try {
          const body = await request.json() as { refreshToken?: string };

          if (!body.refreshToken) {
            return addCors(new Response(JSON.stringify({ error: "Missing refreshToken" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Proxy to Convex refresh token endpoint
          const convexRefreshUrl = `${env.CONVEX_URL}/api/extension/refresh-token`;
          const refreshResponse = await fetch(convexRefreshUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Forward client info for security tracking
              ...(request.headers.get("CF-Connecting-IP") && {
                "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || "",
              }),
              ...(request.headers.get("User-Agent") && {
                "User-Agent": request.headers.get("User-Agent") || "",
              }),
            },
            body: JSON.stringify({ refreshToken: body.refreshToken }),
          });

          // Forward the response from Convex
          const refreshData = await refreshResponse.json() as {
            success?: boolean;
            error?: string;
            message?: string;
            user?: { userId: string; email: string; plan: string };
            refreshToken?: string;
            refreshTokenExpiresAt?: number;
          };

          if (!refreshResponse.ok || refreshData.error) {
            return addCors(new Response(JSON.stringify({
              error: refreshData.error || "Refresh failed",
              message: refreshData.message,
            }), {
              status: refreshResponse.status,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Return the new tokens
          // Note: Client will need to get a fresh Clerk JWT separately or we can include one
          return addCors(new Response(JSON.stringify({
            success: true,
            user: refreshData.user,
            refreshToken: refreshData.refreshToken,
            refreshTokenExpiresAt: refreshData.refreshTokenExpiresAt,
            // expiresIn is for compatibility with existing frontend
            expiresIn: refreshData.refreshTokenExpiresAt
              ? Math.floor((refreshData.refreshTokenExpiresAt - Date.now()) / 1000)
              : 7 * 24 * 60 * 60,
          }), {
            headers: { "Content-Type": "application/json" },
          }));
        } catch (error) {
          console.error("Auth refresh error:", error);
          return addCors(new Response(JSON.stringify({
            error: "Refresh failed",
            message: error instanceof Error ? error.message : "Unknown error",
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // Auth logout (revoke refresh token)
      if (path === "/auth/logout" && method === "POST") {
        try {
          const body = await request.json() as { refreshToken?: string };

          if (body.refreshToken) {
            // Revoke the refresh token in Convex
            const convexRevokeUrl = `${env.CONVEX_URL}/api/extension/revoke-token`;
            await fetch(convexRevokeUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: body.refreshToken }),
            });
          }

          return addCors(new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          }));
        } catch (error) {
          // Still return success - logout should not fail for the user
          return addCors(new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // ============ R2 File Storage Routes ============

      // Upload saved prompts to R2
      // POST /storage/upload
      if (path === "/storage/upload" && method === "POST") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const body = await request.json() as {
          source: string;
          fileData: string; // base64 encoded .pmtpk file
          promptCount: number;
        };

        if (!body.source || !body.fileData) {
          return addCors(new Response(JSON.stringify({ error: "Missing source or fileData" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Generate R2 key: users/{userId}/saved/{source}.pmtpk
        const r2Key = `users/${userId}/saved/${body.source}.pmtpk`;

        // Decode base64 and upload to R2
        const fileBuffer = Uint8Array.from(atob(body.fileData), c => c.charCodeAt(0));

        await env.BUCKET.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: "application/octet-stream",
          },
          customMetadata: {
            userId,
            source: body.source,
            promptCount: body.promptCount.toString(),
            uploadedAt: new Date().toISOString(),
          },
        });

        return addCors(new Response(JSON.stringify({
          success: true,
          r2Key,
          size: fileBuffer.length,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Download saved prompts from R2
      // GET /storage/download?source=chatgpt
      if (path === "/storage/download" && method === "GET") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const source = url.searchParams.get("source");
        if (!source) {
          return addCors(new Response(JSON.stringify({ error: "Missing source parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const r2Key = `users/${userId}/saved/${source}.pmtpk`;
        const object = await env.BUCKET.get(r2Key);

        if (!object) {
          return addCors(new Response(JSON.stringify({ error: "File not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const arrayBuffer = await object.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        return addCors(new Response(JSON.stringify({
          success: true,
          fileData: base64,
          metadata: object.customMetadata,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // List user's saved files
      // GET /storage/list
      if (path === "/storage/list" && method === "GET") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const prefix = `users/${userId}/saved/`;
        const listed = await env.BUCKET.list({ prefix });

        const files = listed.objects.map((obj) => ({
          key: obj.key,
          source: obj.key.replace(prefix, "").replace(".pmtpk", ""),
          size: obj.size,
          uploaded: obj.uploaded.toISOString(),
        }));

        return addCors(new Response(JSON.stringify({
          success: true,
          files,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Delete saved file
      // DELETE /storage/delete?source=chatgpt
      if (path === "/storage/delete" && method === "DELETE") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const source = url.searchParams.get("source");
        if (!source) {
          return addCors(new Response(JSON.stringify({ error: "Missing source parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const r2Key = `users/${userId}/saved/${source}.pmtpk`;
        await env.BUCKET.delete(r2Key);

        return addCors(new Response(JSON.stringify({
          success: true,
          deleted: r2Key,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Upload pack to R2 (for web dashboard pack creation)
      // POST /storage/pack-upload
      if (path === "/storage/pack-upload" && method === "POST") {
        const body = await request.json() as {
          r2Key: string;
          fileData: string; // base64
          metadata?: Record<string, string>;
        };

        if (!body.r2Key || !body.fileData) {
          return addCors(new Response(JSON.stringify({ error: "Missing r2Key or fileData" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Security: Verify the r2Key pattern for packs
        // users/{userId}/userpacks/pack_{timestamp}_{random}.pmtpk (or /versions/v{n}.pmtpk) OR users/{userId}/saved/{source}.pmtpk
        const isValidUserPack = body.r2Key.match(/^users\/[^/]+\/userpacks\/pack_[0-9]+_[a-z0-9]+(\/versions\/v[0-9]+)?\.pmtpk$/i);
        const isValidSavedPack = body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini|perplexity|grok|deepseek|kimi)\.pmtpk$/);
        if (!isValidUserPack && !isValidSavedPack) {
          console.error("Invalid r2Key format for pack:", body.r2Key);
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format for pack", r2Key: body.r2Key }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Decode base64 and upload to R2
        const fileBuffer = Uint8Array.from(atob(body.fileData), c => c.charCodeAt(0));

        await env.BUCKET.put(body.r2Key, fileBuffer, {
          httpMetadata: {
            contentType: "application/octet-stream",
          },
          customMetadata: {
            uploadedAt: new Date().toISOString(),
            ...body.metadata,
          },
        });

        return addCors(new Response(JSON.stringify({
          success: true,
          r2Key: body.r2Key,
          size: fileBuffer.length,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Download file by R2 key (for web dashboard)
      // POST /storage/fetch - uses POST to send r2Key in body
      if (path === "/storage/fetch" && method === "POST") {
        const body = await request.json() as { r2Key: string };

        if (!body.r2Key) {
          return addCors(new Response(JSON.stringify({ error: "Missing r2Key" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Security: Verify the r2Key pattern matches expected formats
        // users/{userId}/saved/{source}.pmtpk OR users/{userId}/userpacks/pack_{id}.pmtpk
        const isValidSavedPack = body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini|perplexity|grok|deepseek|kimi)\.pmtpk$/);
        // userPacks: pack_<timestamp>_<random> where random is base36 (lowercase + digits), optionally with /versions/v{n}
        const isValidUserPack = body.r2Key.match(/^users\/[^/]+\/userpacks\/pack_[0-9]+_[a-z0-9]+(\/versions\/v[0-9]+)?\.pmtpk$/i);

        if (!isValidSavedPack && !isValidUserPack) {
          console.error("Invalid r2Key format:", body.r2Key);
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format", r2Key: body.r2Key }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const object = await env.BUCKET.get(body.r2Key);

        if (!object) {
          return addCors(new Response(JSON.stringify({ error: "File not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }));
        }

        const arrayBuffer = await object.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        return addCors(new Response(JSON.stringify({
          success: true,
          fileData: base64,
          metadata: object.customMetadata,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Delete file by R2 key (for web dashboard)
      // POST /storage/remove - uses POST to send r2Key in body
      if (path === "/storage/remove" && method === "POST") {
        const body = await request.json() as { r2Key: string };

        if (!body.r2Key) {
          return addCors(new Response(JSON.stringify({ error: "Missing r2Key" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Security: Verify the r2Key pattern matches expected format (saved packs or user packs incl. versions)
        const isValidSavedKey = body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini|perplexity|grok|deepseek|kimi)\.pmtpk$/);
        const isValidUserPackKey = body.r2Key.match(/^users\/[^/]+\/userpacks\/pack_[0-9]+_[a-z0-9]+(\/versions\/v[0-9]+)?\.pmtpk$/i);
        if (!isValidSavedKey && !isValidUserPackKey) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        await env.BUCKET.delete(body.r2Key);

        return addCors(new Response(JSON.stringify({
          success: true,
          deleted: body.r2Key,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Update file by R2 key (for web dashboard - after prompt deletion)
      // POST /storage/update - uses POST to send r2Key and new fileData
      if (path === "/storage/update" && method === "POST") {
        const body = await request.json() as { r2Key: string; fileData: string; promptCount: number };

        if (!body.r2Key || !body.fileData) {
          return addCors(new Response(JSON.stringify({ error: "Missing r2Key or fileData" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Security: Verify the r2Key pattern matches expected format
        if (!body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini|perplexity|grok|deepseek|kimi)\.pmtpk$/)) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Decode base64 and upload to R2
        const fileBuffer = Uint8Array.from(atob(body.fileData), c => c.charCodeAt(0));
        const source = body.r2Key.match(/\/(chatgpt|claude|gemini|perplexity|grok|deepseek|kimi)\.pmtpk$/)?.[1] || "unknown";

        await env.BUCKET.put(body.r2Key, fileBuffer, {
          httpMetadata: {
            contentType: "application/octet-stream",
          },
          customMetadata: {
            source,
            promptCount: body.promptCount.toString(),
            updatedAt: new Date().toISOString(),
          },
        });

        return addCors(new Response(JSON.stringify({
          success: true,
          r2Key: body.r2Key,
          size: fileBuffer.length,
        }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Classify prompt using Ollama (POST /classify)
      // Uses userId in request body for rate limiting (no token auth required)
      // Security is handled by rate limits: 50/day free, 500/day pro
      if (path === "/classify" && method === "POST") {
        let inFlightKey: string | null = null;
        let inFlightLocked = false;

        try {
          const body = await request.json() as {
            promptText: string;
            maxWords?: number; // Optional, defaults to 2
            userId?: string; // User ID for rate limiting
          };

          // Get userId from request body
          const userId = body.userId;
          if (!userId) {
            return addCors(new Response(JSON.stringify({ error: "Sign in required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }));
          }

          if (!body.promptText || body.promptText.trim().length === 0) {
            return addCors(new Response(JSON.stringify({ error: "Missing promptText" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Get Ollama server URL from environment variable
          const ollamaUrl = env.OLLAMA_URL;
          if (!ollamaUrl) {
            return addCors(new Response(JSON.stringify({ error: "Ollama server not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Check cache first (before rate limiting to allow cached responses)
          const maxWords = body.maxWords || 2;
          const promptSnippet = body.promptText.trim().slice(0, 500);
          const cacheKey = await sha256Hex(`${maxWords}:${promptSnippet}`);
          const cachedHeader = await getCachedClassify<{ header: string }>(cacheKey);
          if (cachedHeader?.header) {
            return addCors(new Response(JSON.stringify({
              success: true,
              header: cachedHeader.header,
              cached: true,
            }), {
              headers: { "Content-Type": "application/json" },
            }));
          }

          // === RATE LIMITING (only for non-cached requests) ===
          const rateKey = `user:${userId}`;

          // Check billing status for limits
          const billing = await checkUserBillingStatus(userId, env.CONVEX_URL);
          const isPro = billing.isPro;

          // In-flight lock (prevent concurrent requests)
          inFlightKey = `${rateKey}:classify:inflight`;
          inFlightLocked = await acquireInFlightLock(inFlightKey, CLASSIFY_IN_FLIGHT_TTL_SECONDS);
          if (!inFlightLocked) {
            return addCors(new Response(JSON.stringify({
              error: "Classification already running. Please wait.",
              code: "IN_FLIGHT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Daily limit
          const dayLimit = isPro ? CLASSIFY_PRO_DAY_LIMIT : CLASSIFY_FREE_DAY_LIMIT;
          const dayCount = await incrementRateCounter(`${rateKey}:classify:day`, 24 * 60 * 60);
          if (dayCount > dayLimit) {
            return addCors(new Response(JSON.stringify({
              error: isPro
                ? `Daily classification limit reached (${CLASSIFY_PRO_DAY_LIMIT}/day)`
                : `Daily classification limit reached (${CLASSIFY_FREE_DAY_LIMIT}/day). Upgrade to Pro for more.`,
              code: "DAILY_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Minute limit
          const minuteCount = await incrementRateCounter(`${rateKey}:classify:minute`, 60);
          if (minuteCount > CLASSIFY_MINUTE_LIMIT) {
            return addCors(new Response(JSON.stringify({
              error: "Too many requests. Please wait a moment.",
              code: "MINUTE_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // 10-minute limit
          const tenMinCount = await incrementRateCounter(`${rateKey}:classify:10min`, 10 * 60);
          if (tenMinCount > CLASSIFY_10MIN_LIMIT) {
            return addCors(new Response(JSON.stringify({
              error: "Too many requests. Please wait a few minutes.",
              code: "TEN_MIN_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // === CALL OLLAMA ===
          const systemPrompt = `You are a prompt classifier. Given a user's prompt, generate a concise header of ${maxWords} words maximum that describes what the prompt is asking for. Examples:
- "Summarize how company makes money..." → "Executive Summary"
- "Assess revenue predictability..." → "Revenue Quality"
- "Write code to parse JSON..." → "JSON Parser"
- "Analyze market trends in..." → "Market Analysis"

Respond with ONLY the header text, nothing else. Keep it ${maxWords} words or less.`;

          const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama3.2",
              prompt: `${systemPrompt}\n\nPrompt to classify:\n${promptSnippet}`, // Limit to 500 chars for performance
              stream: false,
              options: {
                temperature: 0.3, // Lower temperature for more consistent results
                num_predict: 10,  // Max 10 tokens for header
              }
            }),
          });

          if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text();
            console.error("Ollama API error:", errorText);
            return addCors(new Response(JSON.stringify({
              error: "Classification failed",
              details: errorText
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }));
          }

          const ollamaData = await ollamaResponse.json() as { response: string };

          // Extract and clean the header (remove quotes, trim, limit words)
          let header = ollamaData.response
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .trim();

          // Limit to maxWords
          const words = header.split(/\s+/);
          if (words.length > maxWords) {
            header = words.slice(0, maxWords).join(' ');
          }

          // Capitalize first letter of each word
          header = header
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

          await putCachedClassify(cacheKey, { header }, CLASSIFY_CACHE_TTL_SECONDS);

          return addCors(new Response(JSON.stringify({
            success: true,
            header,
          }), {
            headers: { "Content-Type": "application/json" },
          }));

        } catch (error) {
          console.error("Classify error:", error);
          return addCors(new Response(JSON.stringify({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }));
        } finally {
          // Release in-flight lock
          if (inFlightKey && inFlightLocked) {
            await releaseInFlightLock(inFlightKey);
          }
        }
      }

      // Classify prompt for website (no auth required) - POST /classify-website
      if (path === "/classify-website" && method === "POST") {
        // Use a fixed userId for rate limiting website requests
        const userId = "website-user";

        let inFlightKey: string | null = null;
        let inFlightLocked = false;

        try {
          const body = await request.json() as {
            promptText: string;
            maxWords?: number;
          };

          if (!body.promptText || body.promptText.trim().length === 0) {
            return addCors(new Response(JSON.stringify({ error: "Missing promptText" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Prefer Groq Llama 3.1 8B (fast, free-tier). Fall back to
          // Ollama if Groq not configured.
          const groqKey = getGroqApiKey(env);
          const ollamaUrl = env.OLLAMA_URL;
          if (!groqKey && !ollamaUrl) {
            return addCors(new Response(JSON.stringify({ error: "No classifier configured (Groq or Ollama)" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Check cache first
          const maxWords = body.maxWords || 2;
          const promptSnippet = body.promptText.trim().slice(0, 500);
          const cacheKey = await sha256Hex(`${maxWords}:${promptSnippet}`);
          const cachedHeader = await getCachedClassify<{ header: string }>(cacheKey);
          if (cachedHeader?.header) {
            return addCors(new Response(JSON.stringify({
              success: true,
              header: cachedHeader.header,
              cached: true,
            }), {
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Rate limiting for website (shared across all website users)
          const rateKey = `user:${userId}`;

          // In-flight lock
          inFlightKey = `${rateKey}:classify:inflight`;
          inFlightLocked = await acquireInFlightLock(inFlightKey, CLASSIFY_IN_FLIGHT_TTL_SECONDS);
          if (!inFlightLocked) {
            return addCors(new Response(JSON.stringify({
              error: "Classification already running. Please wait.",
              code: "IN_FLIGHT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Website gets pro-level limits
          const dayCount = await incrementRateCounter(`${rateKey}:classify:day`, 24 * 60 * 60);
          if (dayCount > CLASSIFY_PRO_DAY_LIMIT) {
            return addCors(new Response(JSON.stringify({
              error: `Daily classification limit reached`,
              code: "DAILY_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          const minuteCount = await incrementRateCounter(`${rateKey}:classify:minute`, 60);
          if (minuteCount > CLASSIFY_MINUTE_LIMIT) {
            return addCors(new Response(JSON.stringify({
              error: "Too many requests. Please wait a moment.",
              code: "MINUTE_LIMIT"
            }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }));
          }

          // Call Ollama
          const systemPrompt = `You are a prompt classifier. Given a user's prompt, generate a concise header of ${maxWords} words maximum that describes what the prompt is asking for. Examples:
- "Summarize how company makes money..." → "Executive Summary"
- "Assess revenue predictability..." → "Revenue Quality"
- "Write code to parse JSON..." → "JSON Parser"
- "Analyze market trends in..." → "Market Analysis"

Respond with ONLY the header text, nothing else. Keep it ${maxWords} words or less.`;

          // Try Groq first (Llama 3.1 8B Instant — fast + free tier)
          let rawHeader: string | null = null;

          if (groqKey) {
            const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: `Prompt to classify:\n${promptSnippet}` },
                ],
                max_tokens: 20,
                temperature: 0.3,
              }),
            });

            if (groqResp.ok) {
              const groqData = (await groqResp.json()) as any;
              rawHeader = groqData?.choices?.[0]?.message?.content ?? null;
            } else {
              console.error("[classify-website] Groq failed:", await groqResp.text());
            }
          }

          // Fall back to Ollama if Groq missing/failed
          if (!rawHeader && ollamaUrl) {
            const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "llama3.2",
                prompt: `${systemPrompt}\n\nPrompt to classify:\n${promptSnippet}`,
                stream: false,
                options: {
                  temperature: 0.3,
                  num_predict: 10,
                }
              }),
            });
            if (ollamaResponse.ok) {
              const ollamaData = (await ollamaResponse.json()) as { response: string };
              rawHeader = ollamaData.response;
            }
          }

          if (!rawHeader) {
            return addCors(new Response(JSON.stringify({
              error: "Classification failed",
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }));
          }

          let header = rawHeader
            .replace(/^["']|["']$/g, '')
            .trim();

          const words = header.split(/\s+/);
          if (words.length > maxWords) {
            header = words.slice(0, maxWords).join(' ');
          }

          header = header
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

          await putCachedClassify(cacheKey, { header }, CLASSIFY_CACHE_TTL_SECONDS);

          return addCors(new Response(JSON.stringify({
            success: true,
            header,
          }), {
            headers: { "Content-Type": "application/json" },
          }));

        } catch (error) {
          return addCors(new Response(JSON.stringify({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }));
        } finally {
          if (inFlightKey && inFlightLocked) {
            await releaseInFlightLock(inFlightKey);
          }
        }
      }

      // POST /api/similar-styles — find presets similar to a given style via Groq
      if (path === "/api/similar-styles" && method === "POST") {
        try {
          const body = await request.json() as { presetId?: string; presetName?: string; presetCategory?: string };
          const { presetId, presetName, presetCategory } = body;
          if (!presetId || !presetName) {
            return addCors(new Response(JSON.stringify({ error: "presetId and presetName required" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }

          // Rate limit: 30 req/min per IP
          const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
          const rlKey = `similar-styles:${clientIp}`;
          const rlCacheReq = new Request(`https://rate.pmtpk.com/similar-styles/${encodeURIComponent(clientIp)}`, { method: "GET" });
          const rlCache = caches.default;
          const rlHit = await rlCache.match(rlCacheReq);
          if (rlHit) {
            const count = parseInt(await rlHit.text(), 10);
            if (count >= 30) {
              return addCors(new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
                status: 429, headers: { "Content-Type": "application/json" },
              }));
            }
            await rlCache.put(rlCacheReq, new Response(String(count + 1), {
              headers: { "Cache-Control": "max-age=60" },
            }));
          } else {
            await rlCache.put(rlCacheReq, new Response("1", {
              headers: { "Cache-Control": "max-age=60" },
            }));
          }

          // Check cache first (30-day TTL)
          const cacheKey = `similar:${presetId}`;
          const cacheReq = new Request(`https://cache.pmtpk.com/similar-styles/${encodeURIComponent(presetId)}`, { method: "GET" });
          const cached = await rlCache.match(cacheReq);
          if (cached) {
            return addCors(new Response(cached.body, {
              headers: { "Content-Type": "application/json" },
            }));
          }

          // All preset names for Groq to pick from
          const PRESET_LIST = [
            "south-park:South Park:cartoon", "simpsons:Simpsons:cartoon", "family-guy:Family Guy:cartoon",
            "rick-and-morty:Rick & Morty:cartoon", "adventure-time:Adventure Time:cartoon",
            "anime-chibi:Anime Chibi:cartoon", "disney-classic:Disney Classic:cartoon",
            "looney-tunes:Looney Tunes:cartoon", "studio-ghibli:Studio Ghibli:anime",
            "shonen-action:Shonen Action:anime", "seinen-dark:Seinen Dark:anime",
            "magical-girl:Magical Girl:anime", "mecha:Mecha:anime", "slice-of-life:Slice of Life:anime",
            "cyberpunk-neon:Cyberpunk Neon:digital", "pixel-art-retro:Pixel Art Retro:digital",
            "vaporwave:Vaporwave:digital", "isometric-3d:Isometric 3D:digital",
            "low-poly:Low Poly:digital", "glitch-art:Glitch Art:digital",
            "oil-renaissance:Oil Renaissance:painting", "impressionist:Impressionist:painting",
            "art-nouveau:Art Nouveau:painting", "surrealist:Surrealist:painting",
            "baroque:Baroque:painting", "expressionist:Expressionist:painting",
            "pop-art-comic:Pop Art Comic:illustration", "watercolor-botanical:Watercolor Botanical:illustration",
            "art-deco:Art Deco:illustration", "storybook:Storybook:illustration",
            "graphic-novel:Graphic Novel:illustration", "scientific:Scientific:illustration",
            "vintage-film-grain:Vintage Film Grain:photography", "cinematic-widescreen:Cinematic Widescreen:photography",
            "polaroid-instant:Polaroid Instant:photography", "double-exposure:Double Exposure:photography",
            "dark-fantasy:Dark Fantasy:atmospheric", "gothic-horror:Gothic Horror:atmospheric",
            "lovecraftian:Lovecraftian:atmospheric", "steampunk:Steampunk:atmospheric",
          ];

          const otherPresets = PRESET_LIST.filter(p => !p.startsWith(presetId + ":"));
          const presetListStr = otherPresets.map(p => {
            const [id, name, cat] = p.split(":");
            return `${id} (${name}, ${cat})`;
          }).join("\n");

          const groqApiKey = getGroqApiKey(env);
          if (!groqApiKey) {
            return addCors(new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
              status: 500, headers: { "Content-Type": "application/json" },
            }));
          }

          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: "You are a visual art style similarity expert. Given an art style, pick the 4 most visually similar styles from the provided list. Consider visual aesthetics, rendering technique, color palette, and overall mood. Return ONLY a JSON array of exactly 4 style IDs, nothing else. Example: [\"id1\",\"id2\",\"id3\",\"id4\"]",
                },
                {
                  role: "user",
                  content: `Art style: ${presetName} (category: ${presetCategory || "general"})\n\nAvailable styles:\n${presetListStr}\n\nReturn the 4 most visually similar style IDs as a JSON array:`,
                },
              ],
              temperature: 0.1,
              max_tokens: 200,
            }),
          });

          if (!groqRes.ok) {
            return addCors(new Response(JSON.stringify({ error: "Groq API error" }), {
              status: 502, headers: { "Content-Type": "application/json" },
            }));
          }

          const groqData = await groqRes.json() as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = groqData.choices?.[0]?.message?.content?.trim() || "[]";

          // Parse the JSON array from Groq response
          let similar: string[] = [];
          try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (Array.isArray(parsed)) {
                const validIds = PRESET_LIST.map(p => p.split(":")[0]);
                similar = parsed
                  .filter((id: unknown): id is string => typeof id === "string" && validIds.includes(id) && id !== presetId)
                  .slice(0, 4);
              }
            }
          } catch {
            // If parsing fails, return empty
          }

          const responseBody = JSON.stringify({ similar });

          // Cache for 30 days
          await rlCache.put(cacheReq, new Response(responseBody, {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "max-age=2592000",
            },
          }));

          return addCors(new Response(responseBody, {
            headers: { "Content-Type": "application/json" },
          }));

        } catch (error) {
          console.error("similar-styles error:", error);
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // POST /chat — PromptPack-hosted AI (Groq Llama 3.1 8B, free tier)
      // Body: { messages: [{role, content}][] }
      if (path === "/chat" && method === "POST") {
        try {
          const groqKey = getGroqApiKey(env);
          if (!groqKey) {
            return addCors(new Response(JSON.stringify({ error: "Service not configured" }), {
              status: 503, headers: { "Content-Type": "application/json" },
            }));
          }

          const body = await request.json().catch(() => null) as {
            messages?: { role: string; content: string }[];
          } | null;

          if (!body?.messages?.length) {
            return addCors(new Response(JSON.stringify({ error: "messages required" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }

          // Rate limit: 20 req/min per IP
          const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
          const rlReq = new Request(`https://rate.pmtpk.com/chat/${encodeURIComponent(clientIp)}`, { method: "GET" });
          const cache = caches.default;
          const rlHit = await cache.match(rlReq);
          if (rlHit) {
            const count = parseInt(await rlHit.text(), 10);
            if (count >= 20) {
              return addCors(new Response(JSON.stringify({ error: "Rate limit exceeded. Max 20 requests/minute." }), {
                status: 429, headers: { "Content-Type": "application/json" },
              }));
            }
            await cache.put(rlReq, new Response(String(count + 1), { headers: { "Cache-Control": "max-age=60" } }));
          } else {
            await cache.put(rlReq, new Response("1", { headers: { "Cache-Control": "max-age=60" } }));
          }

          const model = "llama-3.1-8b-instant";
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model, max_tokens: 4096, messages: body.messages }),
          });

          if (!groqRes.ok) {
            const errText = await groqRes.text().catch(() => "");
            console.error("Groq chat error:", groqRes.status, errText);
            return addCors(new Response(JSON.stringify({ error: `Model error: ${groqRes.status}` }), {
              status: 502, headers: { "Content-Type": "application/json" },
            }));
          }

          const data = await groqRes.json() as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data?.choices?.[0]?.message?.content ?? "";

          return addCors(new Response(JSON.stringify({ content, model }), {
            headers: { "Content-Type": "application/json" },
          }));

        } catch (error) {
          console.error("chat error:", error);
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // POST /style-analysis — Claude Vision analyzes artist's style from images
      if (path === "/style-analysis" && method === "POST") {
        try {
          return await handleStyleAnalysis(request, env);
        } catch (error) {
          console.error("style-analysis error:", error);
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // POST /generate-images — DALL-E 3 generates images with artist's style
      if (path === "/generate-images" && method === "POST") {
        try {
          return await handleImageGen(request, env);
        } catch (error) {
          console.error("generate-images error:", error);
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // POST /style-refine — Update style chars + prompts based on artist feedback
      if (path === "/style-refine" && method === "POST") {
        try {
          return await handleStyleRefine(request, env);
        } catch (error) {
          console.error("style-refine error:", error);
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // POST /v1/chat/completions — OpenAI-compatible alias around the
      // free-tier Groq Llama 3.1 8B model. Used by:
      //   - orchestrator's planner.ts (JSON-mode plan emission)
      //   - orchestrator's merge.ts (synthesis)
      //   - lib/routeFallback.ts (LR tiebreaker classifier)
      //   - lib/packExtractor.ts (free var extraction)
      // All four expect a real OpenAI-compat shape (model + messages →
      // choices[0].message.content). The legacy `/chat` endpoint
      // returns `{content, model}` not `{choices: …}`, so it can't
      // serve here. Auth via Skillset session JWT (HS256 desktop or
      // RS256 Clerk). Free, rate-limited per IP same as `/chat`.
      if (path === "/v1/chat/completions" && method === "POST") {
        try {
          const groqKey = getGroqApiKey(env);
          if (!groqKey) {
            return addCors(new Response(JSON.stringify({ error: "Service not configured" }), {
              status: 503, headers: { "Content-Type": "application/json" },
            }));
          }

          // Auth — accept any of: BetterAuth bearer, MCP long-lived
          // token, RS256 Clerk session JWT. Mirrors the managed-proxy
          // verifier surface so desktop, web, and MCP clients all work.
          const auth = request.headers.get("Authorization");
          const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
          const claims = token ? await verifyAnyAuthJwt(token, env) : null;
          if (!claims?.sub) {
            return addCors(new Response(JSON.stringify({ error: "unauthorized" }), {
              status: 401, headers: { "Content-Type": "application/json" },
            }));
          }

          const body = (await request.json().catch(() => null)) as {
            model?: string;
            messages?: Array<{ role: string; content: string }>;
            max_tokens?: number;
            temperature?: number;
            response_format?: unknown;
          } | null;
          if (!body?.messages?.length) {
            return addCors(new Response(JSON.stringify({ error: "messages required" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            }));
          }

          // Per-user rate limit: 30 req/min. Free-tier Llama is cheap
          // for us but a runaway client could still rack up Groq spend.
          const rlReq = new Request(
            `https://rate.pmtpk.com/v1chat/${encodeURIComponent(claims.sub)}`,
            { method: "GET" },
          );
          const cache = caches.default;
          const rlHit = await cache.match(rlReq);
          if (rlHit) {
            const count = parseInt(await rlHit.text(), 10);
            if (count >= 30) {
              return addCors(new Response(JSON.stringify({ error: "Rate limit exceeded. Max 30 requests/minute." }), {
                status: 429, headers: { "Content-Type": "application/json" },
              }));
            }
            await cache.put(rlReq, new Response(String(count + 1), { headers: { "Cache-Control": "max-age=60" } }));
          } else {
            await cache.put(rlReq, new Response("1", { headers: { "Cache-Control": "max-age=60" } }));
          }

          // Whitelist Groq-hosted Llama variants so a malicious caller
          // can't use this endpoint to hit any Groq model.
          const allowed = new Set([
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile",
          ]);
          const requestedModel = typeof body.model === "string" && allowed.has(body.model)
            ? body.model
            : "llama-3.1-8b-instant";

          const groqPayload: Record<string, unknown> = {
            model: requestedModel,
            messages: body.messages,
            max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 2048,
          };
          if (typeof body.temperature === "number") {
            groqPayload.temperature = body.temperature;
          }
          if (body.response_format) {
            groqPayload.response_format = body.response_format;
          }

          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(groqPayload),
          });

          if (!groqRes.ok) {
            const errText = await groqRes.text().catch(() => "");
            console.error("/v1/chat/completions Groq error:", groqRes.status, errText);
            return addCors(new Response(JSON.stringify({
              error: "upstream_error",
              upstreamStatus: groqRes.status,
            }), {
              status: 502, headers: { "Content-Type": "application/json" },
            }));
          }

          // Forward the Groq response as-is (already OpenAI-compat).
          const respBody = await groqRes.text();
          return addCors(new Response(respBody, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }));
        } catch (error) {
          console.error("/v1/chat/completions error:", error);
          return addCors(new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          }));
        }
      }

      // 404 for unknown routes
      return addCors(new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }));

    } catch (error) {
      console.error("API Error:", error);
      return addCors(new Response(JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }), isEnhanceRoute);
    }
  },
};
