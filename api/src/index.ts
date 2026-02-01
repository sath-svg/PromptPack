/**
 * PromptPack Cloudflare Workers API
 *
 * Handles:
 * - R2 file uploads for .pmtpk files
 * - Auth token validation
 * - CORS for extension requests
 */

// Configuration is set in wrangler.toml
import { getGroqApiKey } from "./config";

export interface Env {
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
  CONVEX_URL: string;
  ALLOWED_ORIGINS: string;
  OLLAMA_URL: string;
  GROQ_API_KEY: string;
  CLERK_ISSUER: string;
  CLERK_JWKS_URL: string;
  CLERK_AUDIENCE: string;
}

type EnhanceMode = "clarity" | "structured" | "concise" | "strict";

const ENHANCE_DEFAULT_MODE: EnhanceMode = "structured";
// Model gating: Pro users get the bigger model, free users get the smaller one
const ENHANCE_PRO_MODEL = "llama-3.3-70b-versatile";
const ENHANCE_FREE_MODEL = "llama-3.1-8b-instant";
const ENHANCE_MAX_INPUT_CHARS = 6000;

// Rate limits - daily
const ENHANCE_FREE_DAY_LIMIT = 10;      // Free (logged in): 10/day
const ENHANCE_PRO_DAY_LIMIT = 100;      // Pro: 100/day

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
const CLASSIFY_FREE_DAY_LIMIT = 50;      // Free: 50/day
const CLASSIFY_PRO_DAY_LIMIT = 500;      // Pro: 500/day
const CLASSIFY_MINUTE_LIMIT = 10;        // 10 requests/minute
const CLASSIFY_10MIN_LIMIT = 50;         // 50 requests/10 minutes
const CLASSIFY_IN_FLIGHT_TTL_SECONDS = 30; // 1 concurrent request per user

type OriginRule = { suffix: string; scheme?: string };

function parseAllowedOrigins(env: Env): {
  exact: Set<string>;
  suffixes: OriginRule[];
  allowChromeExtensionAny: boolean;
} {
  const raw = env.ALLOWED_ORIGINS || "";
  const entries = raw.split(",").map((entry) => entry.trim()).filter(Boolean);
  const exact = new Set<string>();
  const suffixes: OriginRule[] = [];
  let allowChromeExtensionAny = false;

  for (const entry of entries) {
    if (entry === "chrome-extension://*") {
      allowChromeExtensionAny = true;
      continue;
    }
    if (entry.startsWith("chrome-extension://")) {
      exact.add(entry);
      continue;
    }
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

  return { exact, suffixes, allowChromeExtensionAny };
}

function isOriginAllowed(origin: string, env: Env): boolean {
  if (!origin || origin === "null") return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  const rules = parseAllowedOrigins(env);
  if (rules.exact.has(origin)) return true;

  const scheme = url.protocol.replace(":", "");
  if (scheme === "chrome-extension" && rules.allowChromeExtensionAny) {
    return true;
  }

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

// CORS headers for extension and web requests
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

type ClerkJwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type ClerkJwtPayload = {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
};

async function getClerkJwks(jwksUrl: string): Promise<{ keys: JsonWebKey[] } | null> {
  const cache = caches.default;
  const req = new Request(jwksUrl, { method: "GET" });
  const cached = await cache.match(req);
  if (cached) {
    try {
      return await cached.json() as { keys: JsonWebKey[] };
    } catch {
      await cache.delete(req);
    }
  }

  const response = await fetch(req);
  if (!response.ok) return null;
  const data = await response.json() as { keys: JsonWebKey[] };
  const res = new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
  await cache.put(req, res);
  return data;
}

function isAudienceValid(payload: ClerkJwtPayload, expectedAudience: string | null): boolean {
  if (!expectedAudience) return true;
  const aud = payload.aud;
  if (!aud) return false;
  if (Array.isArray(aud)) {
    return aud.includes(expectedAudience);
  }
  return aud === expectedAudience;
}

async function verifyClerkJwt(token: string, env: Env): Promise<ClerkJwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const header = parseJwtPart<ClerkJwtHeader>(encodedHeader);
  const payload = parseJwtPart<ClerkJwtPayload>(encodedPayload);
  if (!header || !payload) return null;
  if (header.alg !== "RS256" || !header.kid) return null;

  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  if (payload.nbf && payload.nbf * 1000 > Date.now()) return null;
  if (env.CLERK_ISSUER && payload.iss !== env.CLERK_ISSUER) return null;
  if (!isAudienceValid(payload, env.CLERK_AUDIENCE || null)) return null;

  const jwksUrl = env.CLERK_JWKS_URL || (env.CLERK_ISSUER ? `${env.CLERK_ISSUER}/.well-known/jwks.json` : "");
  if (!jwksUrl) return null;
  const jwks = await getClerkJwks(jwksUrl);
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
async function checkUserBillingStatus(userId: string, convexUrl: string): Promise<{ isPro: boolean }> {
  try {
    const response = await fetch(`${convexUrl}/api/extension/billing-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId: userId }),
    });
    if (!response.ok) {
      return { isPro: false };
    }
    const data = await response.json() as { hasPro?: boolean };
    return { isPro: data.hasPro === true };
  } catch {
    return { isPro: false };
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

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: isEnhanceRoute ? corsHeadersForEnhance(request, env) : corsHeaders(request, env),
      });
    }

    // Add CORS headers to all responses
    const addCors = (response: Response, enhanceOnly = false): Response => {
      const headers = new Headers(response.headers);
      const cors = enhanceOnly ? corsHeadersForEnhance(request, env) : corsHeaders(request, env);
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

      // Health check
      if (path === "/health") {
        return addCors(new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        }));
      }

      // Auth status check (validates Clerk JWT)
      if (path === "/auth/status" && (method === "GET" || method === "POST")) {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        const payload = token ? await verifyClerkJwt(token, env) : null;
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
            user?: { clerkId: string; email: string; plan: string };
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
        // users/{userId}/userpacks/pack_{timestamp}_{random}.pmtpk
        if (!body.r2Key.match(/^users\/[^/]+\/userpacks\/pack_[0-9]+_[a-z0-9]+\.pmtpk$/)) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format for pack" }), {
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
        const isValidUserPack = body.r2Key.match(/^users\/[^/]+\/userpacks\/pack_[0-9]+_[a-z0-9]+\.pmtpk$/);

        if (!isValidSavedPack && !isValidUserPack) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format" }), {
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

        // Security: Verify the r2Key pattern matches expected format
        if (!body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini|perplexity|grok|deepseek|kimi)\.pmtpk$/)) {
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

          const ollamaUrl = env.OLLAMA_URL;
          if (!ollamaUrl) {
            return addCors(new Response(JSON.stringify({ error: "Ollama server not configured" }), {
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

          if (!ollamaResponse.ok) {
            return addCors(new Response(JSON.stringify({
              error: "Classification failed",
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }));
          }

          const ollamaData = await ollamaResponse.json() as { response: string };

          let header = ollamaData.response
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
