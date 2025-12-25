/**
 * PromptPack Cloudflare Workers API
 *
 * Handles:
 * - R2 file uploads for .pmtpk files
 * - Auth token validation
 * - CORS for extension requests
 */

// ============================================================================
// TODO-PRODUCTION: Configure these in wrangler.toml before deploying
// ============================================================================
// 1. Set ENVIRONMENT = "production"
// 2. Bind R2 bucket: BUCKET = "your-production-bucket"
// 3. Set CONVEX_URL = "https://your-project.convex.site"
// 4. Set ALLOWED_ORIGINS = "https://pmtpk.ai,chrome-extension://*"
// 5. Add proper JWT validation with Clerk
// 6. Add rate limiting
// ============================================================================

export interface Env {
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
  CONVEX_URL: string;
  ALLOWED_ORIGINS: string;
}

// CORS headers for extension and web requests
function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin") || "";

  // Allow chrome-extension:// origins
  if (origin.startsWith("chrome-extension://")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }

  // Allow pmtpk.ai and convex.site for web app
  if (origin.includes("pmtpk.ai") || origin.includes("convex.site") || origin.includes("vercel.app")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }

  // Development: allow localhost
  if (env.ENVIRONMENT === "development" && origin.includes("localhost")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  return {};
}

// Extract user ID from auth token (simplified for dev)
// TODO [PRODUCTION]: Validate JWT with Clerk properly
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

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      });
    }

    // Add CORS headers to all responses
    const addCors = (response: Response): Response => {
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(request, env)).forEach(([k, v]) => {
        headers.set(k, v);
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };

    try {
      // Health check
      if (path === "/health") {
        return addCors(new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        }));
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
        // packs/{userId}/pack_{timestamp}_{random}.pmtpk
        if (!body.r2Key.match(/^packs\/[^/]+\/pack_[0-9]+_[a-z0-9]+\.pmtpk$/)) {
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
        // users/{userId}/saved/{source}.pmtpk OR packs/{userId}/pack_{id}.pmtpk
        const isValidSavedPack = body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini)\.pmtpk$/);
        const isValidUserPack = body.r2Key.match(/^packs\/[^/]+\/pack_[0-9]+_[a-z0-9]+\.pmtpk$/);

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
        if (!body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini)\.pmtpk$/)) {
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
        if (!body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini)\.pmtpk$/)) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }));
        }

        // Decode base64 and upload to R2
        const fileBuffer = Uint8Array.from(atob(body.fileData), c => c.charCodeAt(0));
        const source = body.r2Key.match(/\/(chatgpt|claude|gemini)\.pmtpk$/)?.[1] || "unknown";

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
      }));
    }
  },
};
