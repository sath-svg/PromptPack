#!/usr/bin/env node

// PromptPack MCP Server (pmtpk)
// - No args: starts as MCP stdio bridge (for OpenClaw/Claude Desktop)
// - With subcommand: runs CLI mode (login, logout, list, run, create, add, del)

import { login, logout } from './auth.js';
import { startBridge } from './bridge.js';
import { cliList, cliRun, cliCreate, cliAdd, cliDel, cliExport, cliImport } from './cli.js';

const args = process.argv.slice(2);
const command = args[0];

function printHelp(): void {
  console.log(`
pmtpk - PromptPack MCP Server

Usage:
  pmtpk                          Start MCP stdio server (for OpenClaw/Claude Desktop)
  pmtpk login                    Sign in to your PromptPack account
  pmtpk logout                   Sign out and clear stored tokens
  pmtpk list                     List all your prompt packs
  pmtpk run <pack-name>          Output a pack as a multi-step workflow
  pmtpk create <pack-name>       Create a new empty user pack
  pmtpk add <pack-name> <prompt> Add a prompt to a user pack
  pmtpk del <pack-name>          Delete an entire user pack
  pmtpk del <pack-name> <index>  Remove a prompt by index from a user pack
  pmtpk export <name> [--password <pw>] [--output <file>]   Export pack to .pmtpk file
  pmtpk import <file> [--name <name>] [--password <pw>]     Import .pmtpk file as new pack
  pmtpk help                     Show this help message

OpenClaw config (openclaw.json):
  { "name": "pmtpk", "command": "npx", "args": ["-y", "pmtpk"] }

Claude Desktop config (claude_desktop_config.json):
  { "mcpServers": { "pmtpk": { "command": "npx", "args": ["-y", "pmtpk"] } } }
`);
}

async function main(): Promise<void> {
  try {
    switch (command) {
      case 'login':
        await login();
        break;
      case 'logout':
        logout();
        break;
      case 'list':
        await cliList();
        break;
      case 'run': {
        const name = args[1];
        if (!name) { console.error('Usage: pmtpk run <pack-name>'); process.exit(1); }
        await cliRun(name);
        break;
      }
      case 'create': {
        const name = args[1];
        if (!name) { console.error('Usage: pmtpk create <pack-name>'); process.exit(1); }
        await cliCreate(name);
        break;
      }
      case 'add': {
        const name = args[1];
        const prompt = args.slice(2).join(' ');
        if (!name || !prompt) { console.error('Usage: pmtpk add <pack-name> <prompt>'); process.exit(1); }
        await cliAdd(name, prompt);
        break;
      }
      case 'del': {
        const name = args[1];
        if (!name) { console.error('Usage: pmtpk del <pack-name> [prompt-index]'); process.exit(1); }
        await cliDel(name, args[2]);
        break;
      }
      case 'export': {
        const name = args[1];
        if (!name) { console.error('Usage: pmtpk export <pack-name> [--password <pw>] [--output <file>]'); process.exit(1); }
        let password: string | undefined;
        let output: string | undefined;
        for (let i = 2; i < args.length; i++) {
          if ((args[i] === '--password' || args[i] === '-p') && args[i + 1]) { password = args[++i]; }
          else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) { output = args[++i]; }
        }
        await cliExport(name, password, output);
        break;
      }
      case 'import': {
        const file = args[1];
        if (!file) { console.error('Usage: pmtpk import <file> [--name <name>] [--password <pw>]'); process.exit(1); }
        let name: string | undefined;
        let password: string | undefined;
        for (let i = 2; i < args.length; i++) {
          if ((args[i] === '--name' || args[i] === '-n') && args[i + 1]) { name = args[++i]; }
          else if ((args[i] === '--password' || args[i] === '-p') && args[i + 1]) { password = args[++i]; }
        }
        await cliImport(file, name, password);
        break;
      }
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
      case undefined:
        // No command — start as MCP stdio bridge
        await startBridge();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : 'An error occurred');
    process.exit(1);
  }
}

main();
