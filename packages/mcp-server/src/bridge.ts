// stdio ↔ HTTP bridge
// Proxies MCP JSON-RPC messages from stdin/stdout to api.pmtpk.com/mcp

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { API_BASE, getToken } from './config.js';

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

async function callCloud(method: string, params?: unknown): Promise<unknown> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated. Run `promptpack-mcp login` first.');
  }

  const res = await fetch(`${API_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  const data = await res.json() as JsonRpcResponse;
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.result;
}

export async function startBridge(): Promise<void> {
  const server = new Server(
    { name: 'promptpack', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  // Forward tools/list to cloud
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const result = await callCloud('tools/list') as { tools: unknown[] };
    return result;
  });

  // Forward tools/call to cloud
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await callCloud('tools/call', {
      name: request.params.name,
      arguments: request.params.arguments,
    });
    return result as { content: Array<{ type: string; text: string }>; isError?: boolean };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
