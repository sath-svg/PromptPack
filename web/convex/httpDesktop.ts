import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// CORS headers for desktop and extension requests
export function corsHeaders(origin: string | null): HeadersInit {
  // Allow browser extensions (Chrome, Firefox, Safari), Tauri desktop app, and localhost for dev
  // Chrome extension: chrome-extension://
  // Firefox extension: moz-extension://
  // Safari extension: safari-web-extension:// (macOS 11+)
  // Tauri desktop app: tauri://, http://tauri.localhost, https://tauri.localhost
  const allowedOrigin =
    origin?.startsWith("chrome-extension://") ||
    origin?.startsWith("moz-extension://") ||
    origin?.startsWith("safari-web-extension://") ||
    origin?.startsWith("tauri://") ||
    origin?.startsWith("http://tauri.localhost") ||
    origin?.startsWith("https://tauri.localhost") ||
    origin?.includes("localhost");

  if (allowedOrigin) {
    return {
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }
  return {};
}

export function registerDesktopRoutes(http: ReturnType<typeof httpRouter>) {
  // Desktop/Extension: get user's saved packs (cloud prompts)
  // CORS preflight
  http.route({
    path: "/api/desktop/saved-packs",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop/Extension: get user's saved packs list
  http.route({
    path: "/api/desktop/saved-packs",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId } = body as { clerkId: string };

        if (!clerkId) {
          return new Response(
            JSON.stringify({ error: "Missing clerkId" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user from Convex
        const user = await ctx.runQuery(api.users.getByClerkId, {
          clerkId,
        });

        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get all saved packs for this user
        const savedPacks = await ctx.runQuery(api.savedPacks.listByUser, {
          userId: user._id,
        });

        // Return packs list with relevant info
        return new Response(
          JSON.stringify({
            success: true,
            packs: savedPacks.map((pack) => ({
              id: pack._id,
              source: pack.source,
              r2Key: pack.r2Key,
              promptCount: pack.promptCount,
              fileSize: pack.fileSize,
              headers: pack.headers,
              createdAt: pack.createdAt,
              updatedAt: pack.updatedAt,
            })),
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Get saved packs error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to get saved packs",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop/Extension: get user's created packs (userPacks)
  // CORS preflight
  http.route({
    path: "/api/desktop/user-packs",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop/Extension: get user's created packs list
  http.route({
    path: "/api/desktop/user-packs",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId } = body as { clerkId: string };

        if (!clerkId) {
          return new Response(
            JSON.stringify({ error: "Missing clerkId" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user's created packs using the query
        const userPacks = await ctx.runQuery(api.packs.listByClerkId, {
          clerkId,
        });

        // Return packs list with relevant info
        return new Response(
          JSON.stringify({
            success: true,
            packs: userPacks.map((pack) => ({
              id: pack._id,
              title: pack.title,
              description: pack.description,
              category: pack.category,
              icon: pack.icon,
              r2Key: pack.r2Key,
              promptCount: pack.promptCount,
              fileSize: pack.fileSize,
              version: pack.version,
              isPublic: pack.isPublic,
              isEncrypted: pack.isEncrypted,
              headers: pack.headers,
              createdAt: pack.createdAt,
              updatedAt: pack.updatedAt,
            })),
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Get user packs error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to get user packs",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop: update a userPack (upload new file data)
  // CORS preflight
  http.route({
    path: "/api/desktop/update-pack",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop: update a userPack
  http.route({
    path: "/api/desktop/update-pack",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { packId, fileData, promptCount } = body as {
          packId: string;
          fileData: string; // base64 encoded .pmtpk
          promptCount: number;
        };

        if (!packId || !fileData || promptCount === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get the pack to get its r2Key
        const pack = await ctx.runQuery(api.packs.get, { id: packId as any });
        if (!pack) {
          return new Response(
            JSON.stringify({ error: "Pack not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Upload to R2 via Cloudflare Workers API
        const R2_API_URL = process.env.R2_API_URL || "https://api.pmtpk.com";
        console.log("Uploading to R2:", `${R2_API_URL}/storage/pack-upload`, "r2Key:", pack.r2Key);

        let r2Response;
        try {
          r2Response = await fetch(`${R2_API_URL}/storage/pack-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              r2Key: pack.r2Key,
              fileData,
              metadata: {
                title: pack.title,
                promptCount: promptCount.toString(),
                version: pack.version,
              },
            }),
          });
        } catch (fetchError) {
          console.error("Fetch to R2 failed:", fetchError);
          throw new Error(`R2 fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }

        if (!r2Response.ok) {
          const errorText = await r2Response.text().catch(() => "no body");
          console.error("R2 upload failed:", r2Response.status, errorText);
          throw new Error(`R2 upload failed: ${r2Response.status} - ${errorText}`);
        }

        // Update pack metadata in Convex
        const fileSize = Math.ceil((fileData.length * 3) / 4);
        await ctx.runMutation(api.packs.update, {
          id: packId as any,
          promptCount,
          fileSize,
        });

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Update pack error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to update pack",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop: set header for a prompt in a userPack
  // CORS preflight
  http.route({
    path: "/api/desktop/set-header",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop: set header for a prompt
  http.route({
    path: "/api/desktop/set-header",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { packId, promptKey, header } = body as {
          packId: string;
          promptKey: string;
          header: string | null;
        };

        if (!packId || !promptKey) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Update the header using the packs mutation
        await ctx.runMutation(api.packs.setHeader, {
          id: packId as any, // Convex ID type
          promptKey,
          header: header || undefined,
        });

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Set header error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to set header",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop: update a savedPack (upload new file data)
  // CORS preflight
  http.route({
    path: "/api/desktop/update-saved-pack",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop: update a savedPack
  http.route({
    path: "/api/desktop/update-saved-pack",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { packId, fileData, promptCount } = body as {
          packId: string;
          fileData: string; // base64 encoded .pmtpk
          promptCount: number;
        };

        if (!packId || !fileData || promptCount === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get the saved pack to get its r2Key
        const pack = await ctx.runQuery(api.savedPacks.get, { id: packId as any });
        if (!pack) {
          return new Response(
            JSON.stringify({ error: "Saved pack not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Upload to R2 via Cloudflare Workers API
        const R2_API_URL = process.env.R2_API_URL || "https://api.pmtpk.com";
        console.log("Updating saved pack in R2:", `${R2_API_URL}/storage/pack-upload`, "r2Key:", pack.r2Key);

        let r2Response;
        try {
          r2Response = await fetch(`${R2_API_URL}/storage/pack-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              r2Key: pack.r2Key,
              fileData,
              metadata: {
                source: pack.source,
                promptCount: promptCount.toString(),
              },
            }),
          });
        } catch (fetchError) {
          console.error("Fetch to R2 failed:", fetchError);
          throw new Error(`R2 fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }

        if (!r2Response.ok) {
          const errorText = await r2Response.text().catch(() => "no body");
          console.error("R2 upload failed:", r2Response.status, errorText);
          throw new Error(`R2 upload failed: ${r2Response.status} - ${errorText}`);
        }

        // Update pack metadata in Convex
        const fileSize = Math.ceil((fileData.length * 3) / 4);
        await ctx.runMutation(api.savedPacks.update, {
          id: packId as any,
          promptCount,
          fileSize,
        });

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Update saved pack error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to update saved pack",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop: set header for a prompt in a savedPack
  // CORS preflight
  http.route({
    path: "/api/desktop/set-saved-pack-header",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop: set header for a prompt in a savedPack
  http.route({
    path: "/api/desktop/set-saved-pack-header",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { packId, promptKey, header } = body as {
          packId: string;
          promptKey: string;
          header: string | null;
        };

        if (!packId || !promptKey) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Update the header using the savedPacks mutation
        await ctx.runMutation(api.savedPacks.setHeader, {
          id: packId as any, // Convex ID type
          promptKey,
          header: header || undefined,
        });

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Set saved pack header error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to set header",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop: create or update a savedPack (sync local prompts to cloud)
  // CORS preflight
  http.route({
    path: "/api/desktop/sync-saved-pack",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop: sync local prompts to savedPacks (upsert by source)
  http.route({
    path: "/api/desktop/sync-saved-pack",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId, source, fileData, promptCount, headers: promptHeaders } = body as {
          clerkId: string;
          source: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "kimi";
          fileData: string; // base64 encoded .pmtpk
          promptCount: number;
          headers?: Record<string, string>;
        };

        if (!clerkId || !source || !fileData || promptCount === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user from Convex
        const user = await ctx.runQuery(api.users.getByClerkId, { clerkId });
        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Check if savedPack already exists for this user+source
        const existingPack = await ctx.runQuery(api.savedPacks.getByUserAndSource, {
          userId: user._id,
          source,
        });

        let r2Key: string;
        if (existingPack) {
          // Use existing r2Key
          r2Key = existingPack.r2Key;
        } else {
          // Generate new r2Key - must match R2 API validation pattern: users/{userId}/saved/{source}.pmtpk
          r2Key = `users/${user._id}/saved/${source}.pmtpk`;
        }

        // Upload to R2 via Cloudflare Workers API
        const R2_API_URL = process.env.R2_API_URL || "https://api.pmtpk.com";
        console.log("Syncing savedPack to R2:", `${R2_API_URL}/storage/pack-upload`, "r2Key:", r2Key);

        let r2Response;
        try {
          r2Response = await fetch(`${R2_API_URL}/storage/pack-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              r2Key,
              fileData,
              metadata: {
                source,
                promptCount: promptCount.toString(),
              },
            }),
          });
        } catch (fetchError) {
          console.error("Fetch to R2 failed:", fetchError);
          throw new Error(`R2 fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }

        if (!r2Response.ok) {
          const errorText = await r2Response.text().catch(() => "no body");
          console.error("R2 upload failed:", r2Response.status, errorText);
          throw new Error(`R2 upload failed: ${r2Response.status} - ${errorText}`);
        }

        // Upsert savedPack metadata in Convex
        const fileSize = Math.ceil((fileData.length * 3) / 4);
        const result = await ctx.runMutation(api.savedPacks.upsertByClerkId, {
          clerkId,
          source,
          r2Key,
          promptCount,
          fileSize,
          headers: promptHeaders,
        });

        // Get the updated/created pack
        const pack = existingPack
          ? { ...existingPack, promptCount, fileSize, r2Key, headers: { ...(existingPack.headers ?? {}), ...(promptHeaders ?? {}) } }
          : await ctx.runQuery(api.savedPacks.getByUserAndSource, { userId: user._id, source });

        return new Response(
          JSON.stringify({
            success: true,
            updated: result.updated,
            pack: pack ? {
              id: pack._id,
              source: pack.source,
              r2Key: pack.r2Key,
              promptCount: pack.promptCount,
              fileSize: pack.fileSize,
              headers: pack.headers,
              createdAt: pack.createdAt,
              updatedAt: pack.updatedAt,
            } : null,
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Sync savedPack error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to sync savedPack",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop: update pack icon
  // CORS preflight
  http.route({
    path: "/api/desktop/update-pack-icon",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop: update pack icon
  http.route({
    path: "/api/desktop/update-pack-icon",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { packId, icon } = body as {
          packId: string;
          icon: string | null;
        };

        if (!packId) {
          return new Response(
            JSON.stringify({ error: "Missing packId" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Update the icon using the packs mutation
        await ctx.runMutation(api.packs.updateIcon, {
          id: packId as any,
          icon: icon,
        });

        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Update pack icon error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to update icon",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });

  // Desktop: create a new userPack
  // CORS preflight
  http.route({
    path: "/api/desktop/create-pack",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
      const origin = request.headers.get("Origin");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }),
  });

  // Desktop: create a new userPack with file data
  http.route({
    path: "/api/desktop/create-pack",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin);

      try {
        const body = await request.json();
        const { clerkId, title, fileData, promptCount } = body as {
          clerkId: string;
          title: string;
          fileData: string; // base64 encoded .pmtpk
          promptCount: number;
        };

        if (!clerkId || !title || !fileData || promptCount === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Get user from Convex
        const user = await ctx.runQuery(api.users.getByClerkId, { clerkId });
        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            {
              status: 404,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }

        // Generate a unique R2 key for this pack
        const packId = `pack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const r2Key = `users/${user._id}/userpacks/${packId}.pmtpk`;

        // Upload to R2 via Cloudflare Workers API
        const R2_API_URL = process.env.R2_API_URL || "https://api.pmtpk.com";
        console.log("Creating pack in R2:", `${R2_API_URL}/storage/pack-upload`, "r2Key:", r2Key);

        let r2Response;
        try {
          r2Response = await fetch(`${R2_API_URL}/storage/pack-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              r2Key,
              fileData,
              metadata: {
                title,
                promptCount: promptCount.toString(),
                version: "1.0.0",
              },
            }),
          });
        } catch (fetchError) {
          console.error("Fetch to R2 failed:", fetchError);
          throw new Error(`R2 fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }

        if (!r2Response.ok) {
          const errorText = await r2Response.text().catch(() => "no body");
          console.error("R2 upload failed:", r2Response.status, errorText);
          throw new Error(`R2 upload failed: ${r2Response.status} - ${errorText}`);
        }

        // Create pack record in Convex
        const fileSize = Math.ceil((fileData.length * 3) / 4);
        const newPackId = await ctx.runMutation(api.packs.create, {
          authorId: user._id,
          title,
          r2Key,
          promptCount,
          fileSize,
          version: "1.0.0",
          price: 0,
          isPublic: false,
        });

        // Get the created pack to return full details
        const newPack = await ctx.runQuery(api.packs.get, { id: newPackId });

        return new Response(
          JSON.stringify({
            success: true,
            pack: newPack ? {
              id: newPack._id,
              title: newPack.title,
              description: newPack.description,
              category: newPack.category,
              r2Key: newPack.r2Key,
              promptCount: newPack.promptCount,
              fileSize: newPack.fileSize,
              version: newPack.version,
              isPublic: newPack.isPublic,
              isEncrypted: newPack.isEncrypted,
              headers: newPack.headers,
              createdAt: newPack.createdAt,
              updatedAt: newPack.updatedAt,
            } : null,
          }),
          {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Create pack error:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to create pack",
          }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }),
  });
}
