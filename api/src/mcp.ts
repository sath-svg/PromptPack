// MCP (Model Context Protocol) handler for PromptPack
// Implements Streamable HTTP transport on Cloudflare Workers
// Exposes prompt packs as MCP tools for OpenClaw, Claude Desktop, etc.

import type { Env } from './index';
import { decodePack, encodePack, encryptPack, isEncrypted, type PackData } from './pmtpk';
import { parseTemplateVariables } from './templateParser';
import { generateMarkdownWorkflow, generateStructuredWorkflow } from './workflowExporter';

// --- Types ---

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface PackMeta {
  id: string;
  name: string;
  type: 'saved' | 'user';
  promptCount: number;
  isEncrypted: boolean;
  r2Key: string;
  description?: string;
  category?: string;
  headers?: Record<string, string>;
}

// --- Rate limiting ---

const MCP_RATE_LIMITS = {
  free:   { day: 50,   minute: 5  },
  pro:    { day: 500,  minute: 15 },
  studio: { day: 2000, minute: 30 },
} as const;

const MCP_CACHE_TTL = 300; // 5 minutes for decoded pack cache

// Pack limits for create_pack (mirrors app/src/lib/constants.ts:102-104)
const PACK_LIMITS = { free: 0, pro: 2, studio: 14 } as const;

// --- Helpers ---

function jsonRpcOk(id: number | string | undefined, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id: number | string | undefined, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

function toResponse(rpc: JsonRpcResponse, status = 200): Response {
  return new Response(JSON.stringify(rpc), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function incrementMcpRate(key: string, ttlSeconds: number): Promise<number> {
  const cache = caches.default;
  const req = new Request(`https://rate.pmtpk.com/mcp/${encodeURIComponent(key)}`, { method: 'GET' });
  const hit = await cache.match(req);
  let count = 0;
  if (hit) {
    try {
      const data = await hit.json() as { count?: number };
      count = data.count ?? 0;
    } catch { count = 0; }
  }
  const next = count + 1;
  const res = new Response(JSON.stringify({ count: next }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttlSeconds}` },
  });
  await cache.put(req, res);
  return next;
}

async function getCachedPack(userId: string, r2Key: string): Promise<PackData | null> {
  const cache = caches.default;
  const hash = await sha256Short(r2Key);
  const req = new Request(`https://cache.pmtpk.com/mcp/pack/${userId}/${hash}`, { method: 'GET' });
  const hit = await cache.match(req);
  if (!hit) return null;
  try { return await hit.json() as PackData; } catch { return null; }
}

async function putCachedPack(userId: string, r2Key: string, data: PackData): Promise<void> {
  const cache = caches.default;
  const hash = await sha256Short(r2Key);
  const req = new Request(`https://cache.pmtpk.com/mcp/pack/${userId}/${hash}`, { method: 'GET' });
  const res = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${MCP_CACHE_TTL}` },
  });
  await cache.put(req, res);
}

async function invalidatePackCache(userId: string, r2Key: string): Promise<void> {
  const cache = caches.default;
  const hash = await sha256Short(r2Key);
  const req = new Request(`https://cache.pmtpk.com/mcp/pack/${userId}/${hash}`, { method: 'GET' });
  await cache.delete(req);
}

async function sha256Short(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf).slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Convex helpers ---

async function fetchConvexSavedPacks(clerkId: string, convexUrl: string): Promise<PackMeta[]> {
  const res = await fetch(`${convexUrl}/api/desktop/saved-packs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId }),
  });
  if (!res.ok) return [];
  const data = await res.json() as Array<{
    _id: string; source: string; r2Key: string; promptCount: number;
    fileSize: number; headers?: Record<string, string>;
  }>;
  return data.map(p => ({
    id: p._id,
    name: p.source,
    type: 'saved' as const,
    promptCount: p.promptCount,
    isEncrypted: false,
    r2Key: p.r2Key,
    headers: p.headers,
  }));
}

async function fetchConvexUserPacks(clerkId: string, convexUrl: string): Promise<PackMeta[]> {
  const res = await fetch(`${convexUrl}/api/desktop/user-packs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId }),
  });
  if (!res.ok) return [];
  const data = await res.json() as Array<{
    _id: string; title: string; description?: string; category?: string;
    r2Key: string; promptCount: number; isEncrypted?: boolean;
    headers?: Record<string, string>;
  }>;
  return data.map(p => ({
    id: p._id,
    name: p.title,
    type: 'user' as const,
    promptCount: p.promptCount,
    isEncrypted: p.isEncrypted ?? false,
    r2Key: p.r2Key,
    description: p.description,
    category: p.category,
    headers: p.headers,
  }));
}

async function fetchAllPacks(clerkId: string, convexUrl: string, type: string): Promise<PackMeta[]> {
  if (type === 'saved') return fetchConvexSavedPacks(clerkId, convexUrl);
  if (type === 'user') return fetchConvexUserPacks(clerkId, convexUrl);
  const [saved, user] = await Promise.all([
    fetchConvexSavedPacks(clerkId, convexUrl),
    fetchConvexUserPacks(clerkId, convexUrl),
  ]);
  return [...saved, ...user];
}

function findPackByName(packs: PackMeta[], name: string): PackMeta | undefined {
  const lower = name.toLowerCase();
  return packs.find(p => p.name.toLowerCase() === lower);
}

async function downloadAndDecodePack(
  env: Env, userId: string, meta: PackMeta, password?: string
): Promise<PackData> {
  // Check cache first (skip for encrypted packs)
  if (!meta.isEncrypted) {
    const cached = await getCachedPack(userId, meta.r2Key);
    if (cached) return cached;
  }

  const obj = await env.BUCKET.get(meta.r2Key);
  if (!obj) throw new Error(`Pack file not found in storage: ${meta.name}`);

  const bytes = new Uint8Array(await obj.arrayBuffer());
  const packData = await decodePack(bytes, password);

  // Cache decoded result (skip encrypted packs)
  if (!meta.isEncrypted) {
    await putCachedPack(userId, meta.r2Key, packData);
  }

  return packData;
}

// --- Tool definitions ---

const TOOL_DEFINITIONS = [
  {
    name: 'list_packs',
    description: 'List all prompt packs. Returns pack names, prompt counts, and metadata.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string', enum: ['saved', 'user', 'all'], description: 'Filter by pack type. Default: all' },
      },
    },
  },
  {
    name: 'get_pack',
    description: 'Get all prompts from a specific pack by name.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Pack name (e.g., "chatgpt" for saved packs, or user pack title)' },
        password: { type: 'string', description: 'Password for encrypted packs (optional)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_prompts',
    description: 'Search across all packs for prompts matching a query. Searches prompt headers/summaries.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'run_workflow',
    description: 'Get a formatted multi-step workflow from a pack. Returns sequential prompts for execution.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Pack name' },
        format: { type: 'string', enum: ['json', 'markdown'], description: 'Output format. Default: json' },
        password: { type: 'string', description: 'Password for encrypted packs (optional)' },
        variables: { type: 'object', description: 'Template variable values (e.g., {"Stock": "AAPL"})' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_pack',
    description: 'Create a new empty user pack. Respects tier limits (Free: 0, Pro: 2, Studio: 14 packs).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Pack title' },
        description: { type: 'string', description: 'Pack description (optional)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_prompt',
    description: 'Add a prompt to an existing user pack.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pack_name: { type: 'string', description: 'Name of the user pack to add to' },
        prompt_text: { type: 'string', description: 'The prompt text to add' },
      },
      required: ['pack_name', 'prompt_text'],
    },
  },
  {
    name: 'delete_prompt',
    description: 'Remove a prompt from a user pack by its index (0-based).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pack_name: { type: 'string', description: 'Name of the user pack' },
        prompt_index: { type: 'number', description: 'Index of the prompt to remove (0-based)' },
      },
      required: ['pack_name', 'prompt_index'],
    },
  },
  {
    name: 'delete_pack',
    description: 'Delete an entire user pack permanently.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pack_name: { type: 'string', description: 'Name of the user pack to delete' },
      },
      required: ['pack_name'],
    },
  },
  {
    name: 'export_pack',
    description: 'Export a pack as a .pmtpk file. Returns base64-encoded file data. Optionally encrypts with a password (AES-GCM).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Pack name to export' },
        password: { type: 'string', description: 'Password to encrypt the export with (optional). If omitted, uses XOR obfuscation.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'import_pack',
    description: 'Import a .pmtpk file as a new user pack. Accepts base64-encoded file data. Respects tier pack limits.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_data: { type: 'string', description: 'Base64-encoded .pmtpk file contents' },
        name: { type: 'string', description: 'Name for the imported pack' },
        password: { type: 'string', description: 'Password to decrypt the file (required if file is encrypted)' },
      },
      required: ['file_data', 'name'],
    },
  },
];

// --- Tool handlers ---

async function handleListPacks(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const type = (params.type as string) || 'all';
  const packs = await fetchAllPacks(userId, env.CONVEX_URL, type);
  return packs.map(p => ({
    name: p.name,
    type: p.type,
    prompt_count: p.promptCount,
    encrypted: p.isEncrypted,
    description: p.description,
    category: p.category,
  }));
}

async function handleGetPack(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const name = params.name as string;
  if (!name) return { error: 'Missing pack name' };

  const packs = await fetchAllPacks(userId, env.CONVEX_URL, 'all');
  const meta = findPackByName(packs, name);
  if (!meta) return { error: `Pack "${name}" not found` };

  const password = params.password as string | undefined;
  const packData = await downloadAndDecodePack(env, userId, meta, password);

  return {
    name: meta.name,
    type: meta.type,
    prompts: packData.prompts.map((p, i) => ({
      index: i,
      text: p.text,
      header: meta.headers?.[`prompt_${i}`] ?? p.header,
      variables: parseTemplateVariables(p.text),
    })),
  };
}

async function handleSearchPrompts(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const query = (params.query as string || '').toLowerCase();
  if (!query) return { error: 'Missing search query' };

  const packs = await fetchAllPacks(userId, env.CONVEX_URL, 'all');
  const results: Array<{ pack_name: string; pack_type: string; prompt_index: string; header: string }> = [];

  for (const pack of packs) {
    if (!pack.headers) continue;
    for (const [key, header] of Object.entries(pack.headers)) {
      if (header.toLowerCase().includes(query)) {
        results.push({
          pack_name: pack.name,
          pack_type: pack.type,
          prompt_index: key,
          header,
        });
      }
    }
  }

  return { query, results, total: results.length };
}

async function handleRunWorkflow(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const name = params.name as string;
  if (!name) return { error: 'Missing pack name' };

  const packs = await fetchAllPacks(userId, env.CONVEX_URL, 'all');
  const meta = findPackByName(packs, name);
  if (!meta) return { error: `Pack "${name}" not found` };

  const password = params.password as string | undefined;
  const packData = await downloadAndDecodePack(env, userId, meta, password);
  const variables = params.variables as Record<string, string> | undefined;
  const format = (params.format as string) || 'json';

  const prompts = packData.prompts.map((p, i) => ({
    text: p.text,
    header: meta.headers?.[`prompt_${i}`] ?? p.header,
  }));

  if (format === 'markdown') {
    return { format: 'markdown', content: generateMarkdownWorkflow(meta.name, prompts, variables) };
  }
  return { format: 'json', workflow: generateStructuredWorkflow(meta.name, prompts, variables) };
}

async function handleCreatePack(
  userId: string, env: Env, params: Record<string, unknown>, tier: string
): Promise<unknown> {
  const name = (params.name as string)?.trim();
  if (!name) return { error: 'Missing pack name' };

  const limit = PACK_LIMITS[tier as keyof typeof PACK_LIMITS] ?? 0;
  if (limit === 0) return { error: `Your ${tier} plan does not support creating packs. Upgrade to Pro or Studio.` };

  // Count existing user packs
  const userPacks = await fetchConvexUserPacks(userId, env.CONVEX_URL);
  if (userPacks.length >= limit) {
    return { error: `Pack limit reached (${userPacks.length}/${limit}). Upgrade your plan for more.` };
  }

  // Create empty pack file
  const packData: PackData = { version: 1, exportedAt: Date.now(), prompts: [] };
  const fileBytes = await encodePack(packData);
  const rand = crypto.randomUUID().slice(0, 8);
  const r2Key = `users/${userId}/userpacks/pack_${Date.now()}_${rand}.pmtpk`;

  await env.BUCKET.put(r2Key, fileBytes, {
    customMetadata: { userId, promptCount: '0', uploadedAt: String(Date.now()) },
  });

  // Register in Convex
  const description = (params.description as string) || '';
  const convexRes = await fetch(`${env.CONVEX_URL}/api/desktop/create-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clerkId: userId,
      title: name,
      description,
      r2Key,
      promptCount: 0,
      fileSize: fileBytes.length,
      version: '1.0',
      price: 0,
      isPublic: false,
    }),
  });

  if (!convexRes.ok) {
    // Clean up R2 on failure
    await env.BUCKET.delete(r2Key);
    return { error: 'Failed to register pack metadata' };
  }

  return { success: true, name, message: `Pack "${name}" created` };
}

async function handleAddPrompt(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const packName = (params.pack_name as string)?.trim();
  const promptText = (params.prompt_text as string)?.trim();
  if (!packName) return { error: 'Missing pack_name' };
  if (!promptText) return { error: 'Missing prompt_text' };

  const userPacks = await fetchConvexUserPacks(userId, env.CONVEX_URL);
  const meta = findPackByName(userPacks, packName);
  if (!meta) return { error: `User pack "${packName}" not found. Only user-created packs can be modified.` };

  const packData = await downloadAndDecodePack(env, userId, meta);
  packData.prompts.push({ text: promptText, createdAt: Date.now() });
  packData.exportedAt = Date.now();

  const fileBytes = await encodePack(packData);
  await env.BUCKET.put(meta.r2Key, fileBytes, {
    customMetadata: { userId, promptCount: String(packData.prompts.length), uploadedAt: String(Date.now()) },
  });

  // Update Convex metadata
  await fetch(`${env.CONVEX_URL}/api/desktop/update-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId: userId, packId: meta.id, promptCount: packData.prompts.length, fileSize: fileBytes.length }),
  });

  await invalidatePackCache(userId, meta.r2Key);

  return {
    success: true,
    pack_name: packName,
    prompt_count: packData.prompts.length,
    message: `Prompt added to "${packName}" (${packData.prompts.length} total)`,
  };
}

async function handleDeletePrompt(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const packName = (params.pack_name as string)?.trim();
  const promptIndex = params.prompt_index as number;
  if (!packName) return { error: 'Missing pack_name' };
  if (typeof promptIndex !== 'number') return { error: 'Missing prompt_index' };

  const userPacks = await fetchConvexUserPacks(userId, env.CONVEX_URL);
  const meta = findPackByName(userPacks, packName);
  if (!meta) return { error: `User pack "${packName}" not found` };

  const packData = await downloadAndDecodePack(env, userId, meta);
  if (promptIndex < 0 || promptIndex >= packData.prompts.length) {
    return { error: `Invalid index ${promptIndex}. Pack has ${packData.prompts.length} prompts (0-${packData.prompts.length - 1}).` };
  }

  const removed = packData.prompts.splice(promptIndex, 1)[0];
  packData.exportedAt = Date.now();

  const fileBytes = await encodePack(packData);
  await env.BUCKET.put(meta.r2Key, fileBytes, {
    customMetadata: { userId, promptCount: String(packData.prompts.length), uploadedAt: String(Date.now()) },
  });

  await fetch(`${env.CONVEX_URL}/api/desktop/update-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId: userId, packId: meta.id, promptCount: packData.prompts.length, fileSize: fileBytes.length }),
  });

  await invalidatePackCache(userId, meta.r2Key);

  return {
    success: true,
    removed_header: removed.header || `Prompt ${promptIndex}`,
    prompt_count: packData.prompts.length,
    message: `Removed prompt ${promptIndex} from "${packName}" (${packData.prompts.length} remaining)`,
  };
}

async function handleDeletePack(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const packName = (params.pack_name as string)?.trim();
  if (!packName) return { error: 'Missing pack_name' };

  const userPacks = await fetchConvexUserPacks(userId, env.CONVEX_URL);
  const meta = findPackByName(userPacks, packName);
  if (!meta) return { error: `User pack "${packName}" not found` };

  // Delete R2 file
  await env.BUCKET.delete(meta.r2Key);

  // Delete Convex metadata
  await fetch(`${env.CONVEX_URL}/api/desktop/delete-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId: userId, packId: meta.id }),
  });

  await invalidatePackCache(userId, meta.r2Key);

  return { success: true, message: `Pack "${packName}" deleted` };
}

function toBase64(bytes: Uint8Array): string {
  // Chunked conversion to avoid stack overflow on large packs
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

async function handleExportPack(
  userId: string, env: Env, params: Record<string, unknown>
): Promise<unknown> {
  const name = params.name as string;
  if (!name) return { error: 'Missing pack name' };

  const packs = await fetchAllPacks(userId, env.CONVEX_URL, 'all');
  const meta = findPackByName(packs, name);
  if (!meta) return { error: `Pack "${name}" not found` };

  const password = params.password as string | undefined;

  // Download raw bytes from R2
  const obj = await env.BUCKET.get(meta.r2Key);
  if (!obj) return { error: `Pack file not found in storage: ${meta.name}` };
  const rawBytes = new Uint8Array(await obj.arrayBuffer());

  let exportBytes: Uint8Array;
  let encrypted = false;

  if (password) {
    // Decode R2 bytes (may be obfuscated or encrypted) then re-encrypt with user's password
    const packData = await decodePack(rawBytes, meta.isEncrypted ? password : undefined);
    exportBytes = await encryptPack(packData, password);
    encrypted = true;
  } else if (meta.isEncrypted) {
    // Pack is encrypted in storage but no password provided — can't export
    return { error: 'This pack is encrypted. Provide a password to export it.' };
  } else {
    // Pack is XOR obfuscated in R2 — use raw bytes directly
    exportBytes = rawBytes;
  }

  // Size guard: reject if > 10MB
  if (exportBytes.length > 10 * 1024 * 1024) {
    return { error: 'Pack file is too large to export via MCP (>10MB)' };
  }

  const base64 = toBase64(exportBytes);
  const fileName = sanitizeFilename(meta.name) + '.pmtpk';

  return {
    success: true,
    name: meta.name,
    file_name: fileName,
    encrypted,
    size: exportBytes.length,
    data: base64,
  };
}

async function handleImportPack(
  userId: string, env: Env, params: Record<string, unknown>, tier: string
): Promise<unknown> {
  const fileData = (params.file_data as string)?.trim();
  const name = (params.name as string)?.trim();
  if (!fileData) return { error: 'Missing file_data (base64-encoded .pmtpk file)' };
  if (!name) return { error: 'Missing pack name' };

  // Check pack limits (same as create_pack)
  const limit = PACK_LIMITS[tier as keyof typeof PACK_LIMITS] ?? 0;
  if (limit === 0) return { error: `Your ${tier} plan does not support creating packs. Upgrade to Pro or Studio.` };

  const userPacks = await fetchConvexUserPacks(userId, env.CONVEX_URL);
  if (userPacks.length >= limit) {
    return { error: `Pack limit reached (${userPacks.length}/${limit}). Upgrade your plan for more.` };
  }

  // Decode base64 → bytes
  let fileBytes: Uint8Array;
  try {
    fileBytes = fromBase64(fileData);
  } catch {
    return { error: 'Invalid base64 data' };
  }

  // Decode the .pmtpk file
  const password = params.password as string | undefined;
  let packData: PackData;
  try {
    packData = await decodePack(fileBytes, password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to decode pack file';
    return { error: msg };
  }

  // Validate decoded data
  if (!Array.isArray(packData.prompts)) {
    return { error: 'Invalid pack file: missing prompts array' };
  }

  // Re-encode as obfuscated for R2 storage
  const storeData: PackData = { version: 1, exportedAt: Date.now(), prompts: packData.prompts };
  const storeBytes = await encodePack(storeData);
  const rand = crypto.randomUUID().slice(0, 8);
  const r2Key = `users/${userId}/userpacks/pack_${Date.now()}_${rand}.pmtpk`;

  await env.BUCKET.put(r2Key, storeBytes, {
    customMetadata: { userId, promptCount: String(storeData.prompts.length), uploadedAt: String(Date.now()) },
  });

  // Register in Convex
  const convexRes = await fetch(`${env.CONVEX_URL}/api/desktop/create-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clerkId: userId,
      title: name,
      description: 'Imported from .pmtpk file',
      r2Key,
      promptCount: storeData.prompts.length,
      fileSize: storeBytes.length,
      version: '1.0',
      price: 0,
      isPublic: false,
    }),
  });

  if (!convexRes.ok) {
    await env.BUCKET.delete(r2Key);
    return { error: 'Failed to register pack metadata' };
  }

  return {
    success: true,
    name,
    prompt_count: storeData.prompts.length,
    message: `Pack "${name}" imported with ${storeData.prompts.length} prompts`,
  };
}

// --- Main handler ---

// Import verifyClerkJwt and checkUserBillingStatus types - these are called from index.ts
// The handler receives pre-validated auth info

export async function handleMcpRequest(
  request: Request,
  env: Env,
  verifyJwt: (token: string, env: Env) => Promise<{ sub?: string } | null>,
  checkBilling: (userId: string, convexUrl: string) => Promise<{ tier: string }>,
): Promise<Response> {
  // Parse auth
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return toResponse(jsonRpcError(undefined, -32000, 'Authentication required. Provide a Bearer token.'), 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyJwt(token, env);
  const userId = payload?.sub;
  if (!userId) {
    return toResponse(jsonRpcError(undefined, -32000, 'Invalid or expired token'), 401);
  }

  // Parse JSON-RPC body
  let rpc: JsonRpcRequest;
  try {
    rpc = await request.json() as JsonRpcRequest;
  } catch {
    return toResponse(jsonRpcError(undefined, -32700, 'Parse error'), 400);
  }

  if (rpc.jsonrpc !== '2.0' || !rpc.method) {
    return toResponse(jsonRpcError(rpc.id, -32600, 'Invalid JSON-RPC request'), 400);
  }

  // Route non-rate-limited methods
  if (rpc.method === 'initialize') {
    return toResponse(jsonRpcOk(rpc.id, {
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
      serverInfo: { name: 'pmtpk', version: '1.0.0' },
    }));
  }

  if (rpc.method === 'notifications/initialized') {
    // Client acknowledgement — no response needed for notifications
    return new Response(null, { status: 204 });
  }

  if (rpc.method === 'ping') {
    return toResponse(jsonRpcOk(rpc.id, {}));
  }

  if (rpc.method === 'tools/list') {
    return toResponse(jsonRpcOk(rpc.id, { tools: TOOL_DEFINITIONS }));
  }

  // Rate limit tool calls
  if (rpc.method === 'tools/call') {
    const billing = await checkBilling(userId, env.CONVEX_URL);
    const tier = billing.tier as keyof typeof MCP_RATE_LIMITS;
    const limits = MCP_RATE_LIMITS[tier] || MCP_RATE_LIMITS.free;

    const dayKey = `mcp:${userId}:day:${new Date().toISOString().slice(0, 10)}`;
    const minuteKey = `mcp:${userId}:min:${Math.floor(Date.now() / 60000)}`;

    const dayCount = await incrementMcpRate(dayKey, 86400);
    if (dayCount > limits.day) {
      return toResponse(jsonRpcError(rpc.id, -32000, `Daily rate limit exceeded (${limits.day}/day for ${tier} tier)`));
    }

    const minCount = await incrementMcpRate(minuteKey, 60);
    if (minCount > limits.minute) {
      return toResponse(jsonRpcError(rpc.id, -32000, `Rate limit exceeded (${limits.minute}/minute for ${tier} tier)`));
    }

    const toolName = (rpc.params as { name?: string })?.name;
    const toolArgs = ((rpc.params as { arguments?: Record<string, unknown> })?.arguments) || {};

    try {
      let result: unknown;
      switch (toolName) {
        case 'list_packs':
          result = await handleListPacks(userId, env, toolArgs);
          break;
        case 'get_pack':
          result = await handleGetPack(userId, env, toolArgs);
          break;
        case 'search_prompts':
          result = await handleSearchPrompts(userId, env, toolArgs);
          break;
        case 'run_workflow':
          result = await handleRunWorkflow(userId, env, toolArgs);
          break;
        case 'create_pack':
          result = await handleCreatePack(userId, env, toolArgs, tier);
          break;
        case 'add_prompt':
          result = await handleAddPrompt(userId, env, toolArgs);
          break;
        case 'delete_prompt':
          result = await handleDeletePrompt(userId, env, toolArgs);
          break;
        case 'delete_pack':
          result = await handleDeletePack(userId, env, toolArgs);
          break;
        case 'export_pack':
          result = await handleExportPack(userId, env, toolArgs);
          break;
        case 'import_pack':
          result = await handleImportPack(userId, env, toolArgs, tier);
          break;
        default:
          return toResponse(jsonRpcError(rpc.id, -32601, `Unknown tool: ${toolName}`));
      }

      // MCP tools/call expects result in content array format
      return toResponse(jsonRpcOk(rpc.id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tool execution failed';
      return toResponse(jsonRpcOk(rpc.id, {
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
        isError: true,
      }));
    }
  }

  return toResponse(jsonRpcError(rpc.id, -32601, `Method not found: ${rpc.method}`));
}
