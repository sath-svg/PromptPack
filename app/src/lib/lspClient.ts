// LSP client wrapper over Tauri-spawned language servers.
// Inspired by sst/opencode's LSP layer — subset focused on diagnostics +
// hover/definition for the in-chat coding agent.
//
// Each spawned server gets a stable handle id (hash of root + serverId).
// Messages stream in via Tauri events `lsp:<handle>:msg`; we route responses
// by request id and broadcast notifications (e.g. publishDiagnostics).

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface LspDiagnostic {
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  severity?: 1 | 2 | 3 | 4; // 1=Error, 2=Warning, 3=Info, 4=Hint
  message: string;
  source?: string;
  code?: string | number;
}

interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

// Each server has up to two run modes: a one-shot `npx` form (no install,
// downloads on first use) and a managed install via a package manager.
// We pick the cheapest available path at spawn time.
export interface LspServerSpec {
  id: string;
  displayName: string;
  extensions: string[];
  // Direct binary if present on PATH
  binary?: { command: string; args: string[] };
  // npx-style fallback — works as long as Node is installed
  npx?: { package: string; args: string[] };
  // Optional managed install (only triggered after user opts in)
  installer?: {
    via: 'npm' | 'rustup' | 'go' | 'pip';
    package: string;
    requiresTool: string; // tool that must exist on PATH for installer to work
  };
  initializationOptions?: unknown;
}

// Built-in server configurations. User can extend later via settings.
export const DEFAULT_LSP_SERVERS: LspServerSpec[] = [
  {
    id: 'typescript',
    displayName: 'TypeScript / JavaScript',
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
    binary: { command: 'typescript-language-server', args: ['--stdio'] },
    npx: { package: 'typescript-language-server', args: ['--stdio'] },
    installer: { via: 'npm', package: 'typescript-language-server typescript', requiresTool: 'npm' },
  },
  {
    id: 'pyright',
    displayName: 'Python (Pyright)',
    extensions: ['.py'],
    binary: { command: 'pyright-langserver', args: ['--stdio'] },
    npx: { package: 'pyright', args: ['--stdio'] },
    installer: { via: 'npm', package: 'pyright', requiresTool: 'npm' },
  },
  {
    id: 'rust-analyzer',
    displayName: 'Rust',
    extensions: ['.rs'],
    binary: { command: 'rust-analyzer', args: [] },
    installer: { via: 'rustup', package: 'rust-analyzer', requiresTool: 'rustup' },
  },
  {
    id: 'gopls',
    displayName: 'Go',
    extensions: ['.go'],
    binary: { command: 'gopls', args: [] },
    installer: { via: 'go', package: 'golang.org/x/tools/gopls@latest', requiresTool: 'go' },
  },
];

function pickServer(file: string): LspServerSpec | undefined {
  const dot = file.lastIndexOf('.');
  if (dot < 0) return undefined;
  const ext = file.slice(dot).toLowerCase();
  return DEFAULT_LSP_SERVERS.find((s) => s.extensions.includes(ext));
}

export function getServerById(id: string): LspServerSpec | undefined {
  return DEFAULT_LSP_SERVERS.find((s) => s.id === id);
}

export function getServerForFile(file: string): LspServerSpec | undefined {
  return pickServer(file);
}

async function checkTool(name: string): Promise<boolean> {
  try {
    return await invoke<boolean>('agent_check_tool', { name });
  } catch {
    return false;
  }
}

export type LspAvailability =
  | { kind: 'ready'; command: string; args: string[] }              // direct binary on PATH
  | { kind: 'npx'; command: string; args: string[] }                // run via npx (Node available)
  | { kind: 'installable'; via: 'npm' | 'rustup' | 'go' | 'pip'; package: string }
  | { kind: 'unavailable'; reason: string };

/// Resolve the cheapest spawn strategy for a server. Caches per session
/// after first probe so we don't re-shell out on every file open.
const availabilityCache = new Map<string, LspAvailability>();

export async function resolveAvailability(spec: LspServerSpec): Promise<LspAvailability> {
  const cached = availabilityCache.get(spec.id);
  if (cached) return cached;

  // 1. Direct binary on PATH
  if (spec.binary) {
    if (await checkTool(spec.binary.command)) {
      const result: LspAvailability = {
        kind: 'ready',
        command: spec.binary.command,
        args: spec.binary.args,
      };
      availabilityCache.set(spec.id, result);
      return result;
    }
  }
  // 2. npx fallback (Node available). Rust spawn layer handles the
  // Windows .cmd shim so we always pass plain "npx".
  if (spec.npx && (await checkTool('npx'))) {
    const result: LspAvailability = {
      kind: 'npx',
      command: 'npx',
      args: ['-y', spec.npx.package, ...spec.npx.args],
    };
    availabilityCache.set(spec.id, result);
    return result;
  }
  // 3. Installable via package manager (user must opt in)
  if (spec.installer && (await checkTool(spec.installer.requiresTool))) {
    return { kind: 'installable', via: spec.installer.via, package: spec.installer.package };
  }
  // 4. Nothing we can do
  return {
    kind: 'unavailable',
    reason: spec.installer
      ? `Install ${spec.installer.requiresTool} to enable ${spec.displayName} LSP.`
      : `${spec.displayName} LSP not available.`,
  };
}

export function clearAvailabilityCache(serverId?: string): void {
  if (serverId) availabilityCache.delete(serverId);
  else availabilityCache.clear();
}

export async function installServer(
  spec: LspServerSpec,
  onProgress?: (line: string) => void,
): Promise<{ success: boolean; message: string }> {
  if (!spec.installer) return { success: false, message: 'no installer for this server' };
  const eventName = `lsp-install:${spec.id}:${Date.now()}`;
  const unlisten = onProgress
    ? await listen<string>(eventName, (e) => onProgress(e.payload))
    : null;
  try {
    const res = await invoke<{ success: boolean; stdout: string; stderr: string; code: number | null }>(
      'agent_install_tool',
      {
        input: {
          installer: spec.installer.via,
          package: spec.installer.package,
          progress_event: eventName,
        },
      },
    );
    if (res.success) {
      clearAvailabilityCache(spec.id);
      return { success: true, message: 'Installed.' };
    }
    return {
      success: false,
      message: res.stderr || res.stdout || `installer exited ${res.code ?? '?'}`,
    };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  } finally {
    unlisten?.();
  }
}

function pathToFileUri(p: string): string {
  // Windows: C:\foo\bar -> file:///C:/foo/bar
  const norm = p.replace(/\\/g, '/');
  if (/^[a-zA-Z]:/.test(norm)) return `file:///${norm}`;
  return `file://${norm}`;
}

interface LspClient {
  handle: string;
  spec: LspServerSpec;
  root: string;
  nextId: number;
  pending: Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>;
  diagnostics: Map<string, LspDiagnostic[]>;
  unlistenMsg?: UnlistenFn;
  unlistenStderr?: UnlistenFn;
  ready: boolean;
  openedFiles: Set<string>;
  diagnosticsListeners: Set<(file: string) => void>;
}

const clients = new Map<string, LspClient>();

function clientKey(serverId: string, root: string): string {
  return `${serverId}::${root}`;
}

async function ensureClient(spec: LspServerSpec, root: string): Promise<LspClient | null> {
  const key = clientKey(spec.id, root);
  const existing = clients.get(key);
  if (existing) return existing;

  const availability = await resolveAvailability(spec);
  if (availability.kind === 'installable' || availability.kind === 'unavailable') {
    // Caller decides whether to prompt for install
    return null;
  }

  const handle = `${spec.id}-${Math.random().toString(36).slice(2, 10)}`;
  const client: LspClient = {
    handle,
    spec,
    root,
    nextId: 1,
    pending: new Map(),
    diagnostics: new Map(),
    ready: false,
    openedFiles: new Set(),
    diagnosticsListeners: new Set(),
  };
  clients.set(key, client);

  client.unlistenMsg = await listen<JsonRpcMessage>(`lsp:${handle}:msg`, (event) => {
    const msg = event.payload;
    if (msg.id != null && (msg.result !== undefined || msg.error)) {
      const pending = client.pending.get(Number(msg.id));
      if (pending) {
        client.pending.delete(Number(msg.id));
        if (msg.error) pending.reject(new Error(msg.error.message));
        else pending.resolve(msg.result);
      }
    } else if (msg.method === 'textDocument/publishDiagnostics') {
      const params = msg.params as {
        uri: string;
        diagnostics: LspDiagnostic[];
      };
      const file = uriToPath(params.uri);
      client.diagnostics.set(file, params.diagnostics);
      for (const cb of client.diagnosticsListeners) cb(file);
    }
  });

  client.unlistenStderr = await listen<string>(`lsp:${handle}:stderr`, () => {
    // swallow — could log later
  });

  const command =
    availability.kind === 'ready' || availability.kind === 'npx' ? availability.command : '';
  const args =
    availability.kind === 'ready' || availability.kind === 'npx' ? availability.args : [];
  await invoke('lsp_spawn', {
    input: { handle, command, args, root },
  });

  // Initialize
  await sendRequest(client, 'initialize', {
    processId: null,
    rootUri: pathToFileUri(root),
    capabilities: {
      textDocument: {
        publishDiagnostics: { relatedInformation: true },
        synchronization: { didSave: true, willSave: false, willSaveWaitUntil: false },
        hover: { contentFormat: ['markdown', 'plaintext'] },
        definition: { linkSupport: false },
      },
      workspace: { configuration: false, workspaceFolders: false },
    },
    initializationOptions: spec.initializationOptions ?? {},
    workspaceFolders: [{ uri: pathToFileUri(root), name: 'workspace' }],
  });
  await sendNotification(client, 'initialized', {});
  client.ready = true;

  return client;
}

function uriToPath(uri: string): string {
  if (!uri.startsWith('file://')) return uri;
  let p = decodeURIComponent(uri.slice(7));
  if (/^\/[a-zA-Z]:/.test(p)) p = p.slice(1); // strip leading / on Windows
  return p;
}

async function sendRequest(client: LspClient, method: string, params: unknown): Promise<unknown> {
  const id = client.nextId++;
  const promise = new Promise<unknown>((resolve, reject) => {
    client.pending.set(id, { resolve, reject });
  });
  await invoke('lsp_send', {
    handle: client.handle,
    message: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  // 15s timeout
  return Promise.race([
    promise,
    new Promise((_, rej) =>
      setTimeout(() => {
        client.pending.delete(id);
        rej(new Error(`lsp ${method} timed out`));
      }, 15000),
    ),
  ]);
}

async function sendNotification(client: LspClient, method: string, params: unknown): Promise<void> {
  await invoke('lsp_send', {
    handle: client.handle,
    message: JSON.stringify({ jsonrpc: '2.0', method, params }),
  });
}

function languageIdFor(ext: string): string {
  switch (ext) {
    case '.ts': return 'typescript';
    case '.tsx': return 'typescriptreact';
    case '.js': case '.mjs': case '.cjs': return 'javascript';
    case '.jsx': return 'javascriptreact';
    case '.py': return 'python';
    case '.rs': return 'rust';
    case '.go': return 'go';
    default: return 'plaintext';
  }
}

export async function lspOpenFile(root: string, file: string, content: string): Promise<void> {
  const spec = pickServer(file);
  if (!spec) return;
  const client = await ensureClient(spec, root).catch(() => null);
  if (!client) return; // unavailable or installable — caller surfaces UI separately
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  const uri = pathToFileUri(file);
  if (client.openedFiles.has(file)) {
    await sendNotification(client, 'textDocument/didChange', {
      textDocument: { uri, version: Date.now() },
      contentChanges: [{ text: content }],
    });
  } else {
    await sendNotification(client, 'textDocument/didOpen', {
      textDocument: {
        uri,
        languageId: languageIdFor(ext),
        version: 1,
        text: content,
      },
    });
    client.openedFiles.add(file);
  }
}

export async function lspGetDiagnostics(file: string): Promise<LspDiagnostic[]> {
  // Wait briefly for diagnostics to arrive (publishDiagnostics is async)
  await new Promise((r) => setTimeout(r, 600));
  for (const c of clients.values()) {
    const diags = c.diagnostics.get(file);
    if (diags) return diags;
  }
  return [];
}

export function lspOnDiagnostics(cb: (file: string, diagnostics: LspDiagnostic[]) => void): () => void {
  const wrappers: Array<[LspClient, (f: string) => void]> = [];
  for (const c of clients.values()) {
    const wrap = (f: string) => cb(f, c.diagnostics.get(f) ?? []);
    c.diagnosticsListeners.add(wrap);
    wrappers.push([c, wrap]);
  }
  return () => {
    for (const [c, wrap] of wrappers) c.diagnosticsListeners.delete(wrap);
  };
}

export async function lspShutdownAll(): Promise<void> {
  for (const c of Array.from(clients.values())) {
    try {
      await invoke('lsp_stop', { handle: c.handle });
      c.unlistenMsg?.();
      c.unlistenStderr?.();
    } catch {
      // ignore
    }
  }
  clients.clear();
}
