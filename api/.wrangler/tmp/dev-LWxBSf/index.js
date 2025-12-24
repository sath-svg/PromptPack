var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-YqHFMa/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.ts
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (origin.startsWith("chrome-extension://")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
  }
  if (origin.includes("pmtpk.ai") || origin.includes("convex.site") || origin.includes("vercel.app")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
  }
  if (env.ENVIRONMENT === "development" && origin.includes("localhost")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
  }
  return {};
}
__name(corsHeaders, "corsHeaders");
function getUserIdFromToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = JSON.parse(atob(token));
    return decoded.userId || null;
  } catch {
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
__name(getUserIdFromToken, "getUserIdFromToken");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }
    const addCors = /* @__PURE__ */ __name((response) => {
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(request, env)).forEach(([k, v]) => {
        headers.set(k, v);
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }, "addCors");
    try {
      if (path === "/health") {
        return addCors(new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (path === "/storage/upload" && method === "POST") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const body = await request.json();
        if (!body.source || !body.fileData) {
          return addCors(new Response(JSON.stringify({ error: "Missing source or fileData" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const r2Key = `users/${userId}/saved/${body.source}.pmtpk`;
        const fileBuffer = Uint8Array.from(atob(body.fileData), (c) => c.charCodeAt(0));
        await env.BUCKET.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: "application/octet-stream"
          },
          customMetadata: {
            userId,
            source: body.source,
            promptCount: body.promptCount.toString(),
            uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        return addCors(new Response(JSON.stringify({
          success: true,
          r2Key,
          size: fileBuffer.length
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (path === "/storage/download" && method === "GET") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const source = url.searchParams.get("source");
        if (!source) {
          return addCors(new Response(JSON.stringify({ error: "Missing source parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const r2Key = `users/${userId}/saved/${source}.pmtpk`;
        const object = await env.BUCKET.get(r2Key);
        if (!object) {
          return addCors(new Response(JSON.stringify({ error: "File not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const arrayBuffer = await object.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return addCors(new Response(JSON.stringify({
          success: true,
          fileData: base64,
          metadata: object.customMetadata
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (path === "/storage/list" && method === "GET") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const prefix = `users/${userId}/saved/`;
        const listed = await env.BUCKET.list({ prefix });
        const files = listed.objects.map((obj) => ({
          key: obj.key,
          source: obj.key.replace(prefix, "").replace(".pmtpk", ""),
          size: obj.size,
          uploaded: obj.uploaded.toISOString()
        }));
        return addCors(new Response(JSON.stringify({
          success: true,
          files
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (path === "/storage/delete" && method === "DELETE") {
        const userId = getUserIdFromToken(request.headers.get("Authorization"));
        if (!userId) {
          return addCors(new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const source = url.searchParams.get("source");
        if (!source) {
          return addCors(new Response(JSON.stringify({ error: "Missing source parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const r2Key = `users/${userId}/saved/${source}.pmtpk`;
        await env.BUCKET.delete(r2Key);
        return addCors(new Response(JSON.stringify({
          success: true,
          deleted: r2Key
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (path === "/storage/fetch" && method === "POST") {
        const body = await request.json();
        if (!body.r2Key) {
          return addCors(new Response(JSON.stringify({ error: "Missing r2Key" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        if (!body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini)\.pmtpk$/)) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const object = await env.BUCKET.get(body.r2Key);
        if (!object) {
          return addCors(new Response(JSON.stringify({ error: "File not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const arrayBuffer = await object.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return addCors(new Response(JSON.stringify({
          success: true,
          fileData: base64,
          metadata: object.customMetadata
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (path === "/storage/remove" && method === "POST") {
        const body = await request.json();
        if (!body.r2Key) {
          return addCors(new Response(JSON.stringify({ error: "Missing r2Key" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        if (!body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini)\.pmtpk$/)) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        await env.BUCKET.delete(body.r2Key);
        return addCors(new Response(JSON.stringify({
          success: true,
          deleted: body.r2Key
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (path === "/storage/update" && method === "POST") {
        const body = await request.json();
        if (!body.r2Key || !body.fileData) {
          return addCors(new Response(JSON.stringify({ error: "Missing r2Key or fileData" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        if (!body.r2Key.match(/^users\/[^/]+\/saved\/(chatgpt|claude|gemini)\.pmtpk$/)) {
          return addCors(new Response(JSON.stringify({ error: "Invalid r2Key format" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }));
        }
        const fileBuffer = Uint8Array.from(atob(body.fileData), (c) => c.charCodeAt(0));
        const source = body.r2Key.match(/\/(chatgpt|claude|gemini)\.pmtpk$/)?.[1] || "unknown";
        await env.BUCKET.put(body.r2Key, fileBuffer, {
          httpMetadata: {
            contentType: "application/octet-stream"
          },
          customMetadata: {
            source,
            promptCount: body.promptCount.toString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        return addCors(new Response(JSON.stringify({
          success: true,
          r2Key: body.r2Key,
          size: fileBuffer.length
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
      return addCors(new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("API Error:", error);
      return addCors(new Response(JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-YqHFMa/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-YqHFMa/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
