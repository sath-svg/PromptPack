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
  const CYAN = '\x1b[36m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const DIM = '\x1b[2m';
  const BOLD = '\x1b[1m';
  const RESET = '\x1b[0m';

  console.log(`
${BOLD}pmtpk${RESET} - PromptPack MCP Server & CLI
Access your prompt packs from AI assistants or the command line.

${BOLD}USAGE${RESET}
  ${CYAN}pmtpk${RESET}                                          Start MCP server ${DIM}(stdio, for AI clients)${RESET}
  ${CYAN}pmtpk${RESET} ${GREEN}<command>${RESET} [options]                       Run a CLI command

${BOLD}AUTH${RESET}
  ${GREEN}login${RESET}                                            Sign in via browser (device auth flow)
  ${GREEN}logout${RESET}                                           Sign out and clear stored tokens

${BOLD}COMMANDS${RESET}
  ${GREEN}list${RESET}                                             List all your prompt packs
  ${GREEN}run${RESET} <pack>                                       Run a pack as a multi-step workflow
  ${GREEN}create${RESET} <name>                                    Create a new empty user pack
  ${GREEN}add${RESET} <pack> <prompt>                               Add a prompt to a user pack
  ${GREEN}del${RESET} <pack>                                       Delete an entire user pack
  ${GREEN}del${RESET} <pack> <index>                                Remove a single prompt by index (0-based)
  ${GREEN}export${RESET} <pack> [--password <pw>] [--output <file>] Export a pack to a .pmtpk file
  ${GREEN}import${RESET} <file> [--name <name>] [--password <pw>]   Import a .pmtpk file as a new pack
  ${GREEN}help${RESET}                                             Show this help message

${BOLD}MCP TOOLS${RESET} ${DIM}(available to AI assistants when running as MCP server)${RESET}
  ${YELLOW}list_packs${RESET}        List all packs with metadata
                    ${DIM}options: type ("saved" | "user" | "all", default: "all")${RESET}

  ${YELLOW}get_pack${RESET}          Get all prompts from a pack
                    ${DIM}required: name${RESET}
                    ${DIM}options:  password (for encrypted packs)${RESET}

  ${YELLOW}search_prompts${RESET}    Search prompt headers across all packs
                    ${DIM}required: query${RESET}

  ${YELLOW}run_workflow${RESET}      Get formatted multi-step workflow from a pack
                    ${DIM}required: name${RESET}
                    ${DIM}options:  format ("json" | "markdown"), password, variables${RESET}

  ${YELLOW}create_pack${RESET}       Create a new empty user pack
                    ${DIM}required: name${RESET}
                    ${DIM}options:  description${RESET}

  ${YELLOW}add_prompt${RESET}        Add a prompt to a user pack
                    ${DIM}required: pack_name, prompt_text${RESET}

  ${YELLOW}delete_prompt${RESET}     Remove a prompt by index (0-based)
                    ${DIM}required: pack_name, prompt_index${RESET}

  ${YELLOW}delete_pack${RESET}       Delete an entire user pack
                    ${DIM}required: pack_name${RESET}

  ${YELLOW}export_pack${RESET}       Export a pack as base64-encoded .pmtpk data
                    ${DIM}required: name${RESET}
                    ${DIM}options:  password (encrypts with AES-GCM)${RESET}

  ${YELLOW}import_pack${RESET}       Import a base64-encoded .pmtpk file as a new pack
                    ${DIM}required: file_data (base64), name${RESET}
                    ${DIM}options:  password (if file is encrypted)${RESET}

${BOLD}TEMPLATE VARIABLES${RESET}
  Prompts can contain {{variables}}. Pass values with the "variables" option
  when running a workflow. Example: ${DIM}variables: {"Stock": "AAPL"}${RESET}

${BOLD}RATE LIMITS${RESET}  ${DIM}(MCP tool calls)${RESET}
  Free    50/day    5/min
  Pro     500/day   15/min
  Studio  2000/day  30/min

${BOLD}PACK LIMITS${RESET}
  Free    0 custom packs    10 prompts/pack
  Pro     2 custom packs    40 prompts/pack
  Studio  14 custom packs   200 prompts/pack

${BOLD}SETUP${RESET}
  ${DIM}# Claude Desktop (claude_desktop_config.json)${RESET}
  { "mcpServers": { "pmtpk": { "command": "npx", "args": ["-y", "pmtpk"] } } }

  ${DIM}# OpenClaw (openclaw.json)${RESET}
  { "name": "pmtpk", "command": "npx", "args": ["-y", "pmtpk"] }

  ${DIM}# Claude Code (.mcp.json)${RESET}
  { "mcpServers": { "pmtpk": { "type": "stdio", "command": "npx", "args": ["-y", "pmtpk"] } } }

${BOLD}EXAMPLES${RESET}
  ${CYAN}pmtpk login${RESET}                                      Sign in to PromptPack
  ${CYAN}pmtpk list${RESET}                                       Show all your packs
  ${CYAN}pmtpk run "SEO Pack"${RESET}                              Run pack as workflow
  ${CYAN}pmtpk create "Code Review"${RESET}                        Create a new pack
  ${CYAN}pmtpk add "Code Review" "Review this: {{code}}"${RESET}   Add a templated prompt
  ${CYAN}pmtpk del "Code Review" 0${RESET}                         Remove first prompt
  ${CYAN}pmtpk del "Code Review"${RESET}                           Delete entire pack
  ${CYAN}pmtpk export "My Pack" -p secret -o my.pmtpk${RESET}     Export encrypted
  ${CYAN}pmtpk import my.pmtpk -n "Imported" -p secret${RESET}    Import encrypted file

${DIM}Docs: https://pmtpk.com    API: https://api.pmtpk.com/mcp${RESET}
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
