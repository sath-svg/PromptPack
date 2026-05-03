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

export interface LspServerSpec {
  id: string;
  command: string;
  args: string[];
  extensions: string[];
  // Optional initialization options (e.g. tsserver expects {}, pyright {})
  initializationOptions?: unknown;
}

// Built-in server configurations. User can extend later via settings.
export const DEFAULT_LSP_SERVERS: LspServerSpec[] = [
  {
    id: 'typescript',
    command: 'typescript-language-server',
    args: ['--stdio'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  },
  {
    id: 'pyright',
    command: 'pyright-langserver',
    args: ['--stdio'],
    extensions: ['.py'],
  },
  {
    id: 'rust-analyzer',
    command: 'rust-analyzer',
    args: [],
    extensions: ['.rs'],
  },
  {
    id: 'gopls',
    command: 'gopls',
    args: [],
    extensions: ['.go'],
  },
];

function pickServer(file: string): LspServerSpec | undefined {
  const dot = file.lastIndexOf('.');
  if (dot < 0) return undefined;
  const ext = file.slice(dot).toLowerCase();
  return DEFAULT_LSP_SERVERS.find((s) => s.extensions.includes(ext));
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

async function ensureClient(spec: LspServerSpec, root: string): Promise<LspClient> {
  const key = clientKey(spec.id, root);
  const existing = clients.get(key);
  if (existing) return existing;

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

  await invoke('lsp_spawn', {
    input: {
      handle,
      command: spec.command,
      args: spec.args,
      root,
    },
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
  if (!client) return;
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
