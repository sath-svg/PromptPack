// CLI command handlers
// Calls cloud MCP API directly and formats output for terminal

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { API_BASE, getToken } from './config.js';

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number | string;
  result?: { content?: Array<{ type: string; text: string }>; isError?: boolean };
  error?: { code: number; message: string };
}

async function callTool(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const token = getToken();
  if (!token) {
    console.error('Not authenticated. Run `pmtpk login` first.');
    process.exit(1);
  }

  const res = await fetch(`${API_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });

  const data = await res.json() as JsonRpcResponse;
  if (data.error) {
    console.error(`Error: ${data.error.message}`);
    process.exit(1);
  }

  const text = data.result?.content?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function cliList(): Promise<void> {
  const result = await callTool('list_packs') as Array<{
    name: string; type: string; prompt_count: number; encrypted: boolean;
  }> | null;

  if (!result || result.length === 0) {
    console.log('No packs found.');
    return;
  }

  console.log('\nYour PromptPacks:\n');
  console.log('  Name                    Type     Prompts  Encrypted');
  console.log('  ' + '-'.repeat(60));
  for (const pack of result) {
    const name = pack.name.padEnd(24);
    const type = pack.type.padEnd(8);
    const count = String(pack.prompt_count).padEnd(8);
    const enc = pack.encrypted ? 'Yes' : 'No';
    console.log(`  ${name}${type}${count}${enc}`);
  }
  console.log(`\n  Total: ${result.length} packs\n`);
}

export async function cliRun(packName: string): Promise<void> {
  const result = await callTool('run_workflow', { name: packName, format: 'markdown' }) as {
    format: string; content?: string; error?: string;
  } | null;

  if (!result) {
    console.error('Failed to get workflow');
    return;
  }

  if ('error' in result && result.error) {
    console.error(`Error: ${result.error}`);
    return;
  }

  if (result.content) {
    console.log(result.content);
  }
}

export async function cliCreate(packName: string): Promise<void> {
  const result = await callTool('create_pack', { name: packName }) as {
    success?: boolean; message?: string; error?: string;
  } | null;

  if (result?.error) {
    console.error(`Error: ${result.error}`);
    return;
  }

  console.log(result?.message || 'Pack created');
}

export async function cliAdd(packName: string, promptText: string): Promise<void> {
  const result = await callTool('add_prompt', { pack_name: packName, prompt_text: promptText }) as {
    success?: boolean; message?: string; error?: string;
  } | null;

  if (result?.error) {
    console.error(`Error: ${result.error}`);
    return;
  }

  console.log(result?.message || 'Prompt added');
}

export async function cliDel(packName: string, promptIndex?: string): Promise<void> {
  if (promptIndex !== undefined) {
    const index = parseInt(promptIndex, 10);
    if (isNaN(index)) {
      console.error('Invalid prompt index. Must be a number.');
      return;
    }
    const result = await callTool('delete_prompt', { pack_name: packName, prompt_index: index }) as {
      success?: boolean; message?: string; error?: string;
    } | null;

    if (result?.error) {
      console.error(`Error: ${result.error}`);
      return;
    }
    console.log(result?.message || 'Prompt deleted');
  } else {
    const result = await callTool('delete_pack', { pack_name: packName }) as {
      success?: boolean; message?: string; error?: string;
    } | null;

    if (result?.error) {
      console.error(`Error: ${result.error}`);
      return;
    }
    console.log(result?.message || 'Pack deleted');
  }
}

export async function cliExport(packName: string, password?: string, outputPath?: string): Promise<void> {
  const args: Record<string, unknown> = { name: packName };
  if (password) args.password = password;

  const result = await callTool('export_pack', args) as {
    success?: boolean; data?: string; file_name?: string;
    name?: string; encrypted?: boolean; size?: number; error?: string;
  } | null;

  if (result?.error) {
    console.error(`Error: ${result.error}`);
    return;
  }

  if (!result?.data) {
    console.error('Failed to export pack');
    return;
  }

  const fileName = outputPath
    ? resolve(outputPath)
    : resolve(process.cwd(), result.file_name || `${packName.replace(/[^a-z0-9_-]/gi, '_')}.pmtpk`);

  const bytes = Buffer.from(result.data, 'base64');
  writeFileSync(fileName, bytes);

  console.log(`Exported "${result.name || packName}" to ${fileName} (${bytes.length} bytes${result.encrypted ? ', encrypted' : ''})`);
}

export async function cliImport(filePath: string, name?: string, password?: string): Promise<void> {
  const resolvedPath = resolve(filePath);
  let fileBuffer: Buffer;
  try {
    fileBuffer = readFileSync(resolvedPath);
  } catch {
    console.error(`Error: Could not read file ${resolvedPath}`);
    return;
  }

  const base64Data = fileBuffer.toString('base64');
  const packName = name || basename(filePath, '.pmtpk');

  const args: Record<string, unknown> = { file_data: base64Data, name: packName };
  if (password) args.password = password;

  const result = await callTool('import_pack', args) as {
    success?: boolean; message?: string; prompt_count?: number; error?: string;
  } | null;

  if (result?.error) {
    console.error(`Error: ${result.error}`);
    return;
  }

  console.log(result?.message || 'Pack imported');
}
