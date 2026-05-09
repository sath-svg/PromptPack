// Tool catalog + dispatcher for the in-chat coding agent.
// Tool schemas use the JSON-Schema variant accepted by Anthropic & OpenAI.
// Anthropic uses `input_schema`; OpenAI uses `parameters` — adapter per
// provider lives in chatStore.

import { invoke } from '@tauri-apps/api/core';
import { useAgentStore } from '../stores/agentStore';
import { lspOpenFile, lspGetDiagnostics } from './lspClient';

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const AGENT_TOOLS: ToolSpec[] = [
  {
    name: 'read_file',
    description:
      'Read the contents of a file inside the workspace. Returns the full text and line count. Path is relative to the workspace root.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path inside the workspace.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      'Create or overwrite a file with the given content. Stages the change as a pending edit; the user must accept it before subsequent reads see the new content. Use for new files or full rewrites.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description:
      'Replace exact text inside an existing file. old_string must match uniquely (or pass replace_all: true). Stages a pending edit for user acceptance. Prefer this over write_file for partial edits.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        old_string: { type: 'string' },
        new_string: { type: 'string' },
        replace_all: { type: 'boolean' },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'list_dir',
    description: 'List immediate children of a directory inside the workspace.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path; "." for workspace root.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'glob',
    description:
      'Find files by glob pattern (e.g. "**/*.ts"). Returns up to 200 matches, skipping node_modules/target/dist and dotfiles.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep',
    description:
      'Regex search across files in the workspace. Returns up to 200 matches with path/line/text.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern.' },
        glob_filter: { type: 'string', description: 'Optional glob to limit which files are searched.' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'bash',
    description:
      'Run a shell command from the workspace root. Returns stdout, stderr, and exit code. Use for builds, tests, git status, npm/cargo commands. 60s timeout.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
      },
      required: ['command'],
    },
  },
  {
    name: 'check_template_vars',
    description:
      'Scan a string for unfilled {variable} placeholders left over from a Skill pack template. Returns the list of unique variable names. If the result is non-empty, STOP and ask the user to provide values — never invent them.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The prompt text to scan.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'lsp_diagnostics',
    description:
      'Fetch current LSP diagnostics (errors/warnings) for a file. Spawns the appropriate language server lazily. Returns an empty list if no LSP is configured for the file type.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
];

function makeId(): string {
  return Math.random().toString(36).slice(2, 12);
}

/**
 * Detect whether the user prompt explicitly asks the assistant to save
 * content to a file. When this returns a path, the agent runner should
 * force `tool_choice: write_file` on the first model round so the model
 * physically cannot reply in chat without calling the tool.
 *
 * Conservative — false positives cause an awkward forced call, false
 * negatives just leave the existing system-prompt nudge in place.
 */
export function detectWriteFileIntent(text: string): string | null {
  // Match common explicit save phrasings + a filename with extension.
  // Order: longest / most specific patterns first.
  const patterns: RegExp[] = [
    /(?:output|save|write)\s+(?:it|the\s+\w+(?:\s+\w+)?)\s+(?:as|to|into)\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:output|save|write)\s+(?:it|the\s+\w+(?:\s+\w+)?)?\s*as\s+a\s+\w+\s+file\s+(?:named|called)\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:save|write|output)\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:save\s+(?:the\s+)?(?:corrected\s+)?(?:version\s+)?)?back\s+to\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:produce\s+(?:a\s+)?(?:pdf\s+)?(?:report\s+)?saved\s+as)\s+([\w./\\-]+\.\w{1,6})\b/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m && m[1]) return m[1];
  }
  return null;
}

interface ToolContext {
  workspace: string;
}

export interface ToolDispatchResult {
  output: string;
  pendingEditId?: string;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n…[truncated ${s.length - max} chars]`;
}

export async function dispatchTool(
  ctx: ToolContext,
  name: string,
  input: Record<string, unknown>,
): Promise<ToolDispatchResult> {
  switch (name) {
    case 'read_file': {
      const path = String(input.path);
      const res = await invoke<{ content: string; line_count: number }>('agent_read', {
        workspace: ctx.workspace,
        path,
      });
      return { output: `${path} (${res.line_count} lines)\n\n${truncate(res.content, 12000)}` };
    }

    case 'write_file': {
      const path = String(input.path);
      const content = String(input.content);
      // Snapshot current content (if exists) for diff
      let before = '';
      try {
        const cur = await invoke<{ content: string }>('agent_read', {
          workspace: ctx.workspace,
          path,
        });
        before = cur.content;
      } catch {
        // new file
      }
      await invoke('agent_write', {
        workspace: ctx.workspace,
        path,
        content,
      });
      const editId = makeId();
      useAgentStore.getState().addPendingEdit({
        id: editId,
        path,
        before,
        after: content,
      });
      // Push to LSP for diagnostics (probe first so UI can prompt install)
      try {
        const probe = await useAgentStore.getState().probeLspForFile(path);
        if (probe && (probe.kind === 'ready' || probe.kind === 'npx')) {
          await lspOpenFile(ctx.workspace, path, content);
          const diags = await lspGetDiagnostics(path);
          if (diags.length > 0) {
            useAgentStore.getState().setEditDiagnostics(editId, diags);
          }
        }
      } catch {
        // ignore
      }
      // Auto-accept short-circuits the user prompt for trusted refactors
      if (useAgentStore.getState().autoAcceptEdits) {
        useAgentStore.getState().acceptEdit(editId).catch(() => {});
      }
      return {
        output: `Staged write to ${path} (${content.length} bytes). Awaiting user accept/reject.`,
        pendingEditId: editId,
      };
    }

    case 'edit_file': {
      const path = String(input.path);
      const oldString = String(input.old_string);
      const newString = String(input.new_string);
      const replaceAll = Boolean(input.replace_all);
      const res = await invoke<{ replaced: number; before: string; after: string }>(
        'agent_edit',
        {
          input: {
            workspace: ctx.workspace,
            path,
            old_string: oldString,
            new_string: newString,
            replace_all: replaceAll,
          },
        },
      );
      const editId = makeId();
      useAgentStore.getState().addPendingEdit({
        id: editId,
        path,
        before: res.before,
        after: res.after,
      });
      try {
        await lspOpenFile(ctx.workspace, path, res.after);
        const diags = await lspGetDiagnostics(path);
        if (diags.length > 0) {
          useAgentStore.getState().setEditDiagnostics(editId, diags);
        }
      } catch {
        // ignore
      }
      return {
        output: `Replaced ${res.replaced} occurrence(s) in ${path}. Awaiting user accept/reject.`,
        pendingEditId: editId,
      };
    }

    case 'list_dir': {
      const path = String(input.path);
      const entries = await invoke<Array<{ name: string; path: string; is_dir: boolean }>>(
        'agent_list',
        { workspace: ctx.workspace, path },
      );
      return {
        output: entries.map((e) => `${e.is_dir ? 'd' : 'f'} ${e.path}`).join('\n') || '(empty)',
      };
    }

    case 'glob': {
      const pattern = String(input.pattern);
      const matches = await invoke<string[]>('agent_glob', {
        workspace: ctx.workspace,
        pattern,
      });
      return { output: matches.length ? matches.join('\n') : '(no matches)' };
    }

    case 'grep': {
      const pattern = String(input.pattern);
      const globFilter = input.glob_filter ? String(input.glob_filter) : null;
      const hits = await invoke<Array<{ path: string; line: number; text: string }>>(
        'agent_grep',
        {
          workspace: ctx.workspace,
          pattern,
          globFilter,
        },
      );
      return {
        output: hits.length
          ? hits.map((h) => `${h.path}:${h.line}: ${h.text}`).join('\n')
          : '(no matches)',
      };
    }

    case 'bash': {
      const command = String(input.command);
      const res = await invoke<{ stdout: string; stderr: string; code: number | null }>(
        'agent_bash',
        { workspace: ctx.workspace, command, timeoutMs: 60000 },
      );
      const parts = [];
      if (res.stdout) parts.push(`stdout:\n${truncate(res.stdout, 6000)}`);
      if (res.stderr) parts.push(`stderr:\n${truncate(res.stderr, 6000)}`);
      parts.push(`exit code: ${res.code ?? '?'}`);
      return { output: parts.join('\n\n') };
    }

    case 'check_template_vars': {
      const text = String(input.text ?? '');
      const matches = new Set<string>();
      const re = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) matches.add(m[1]);
      const list = Array.from(matches);
      return {
        output:
          list.length === 0
            ? 'No unfilled variables. Safe to proceed.'
            : `Unfilled template variables: ${list.map((v) => `{${v}}`).join(', ')}\n\nAsk the user for each value before continuing. Do not invent or guess.`,
      };
    }

    case 'lsp_diagnostics': {
      const path = String(input.path);
      const probe = await useAgentStore.getState().probeLspForFile(path);
      if (!probe) return { output: 'No LSP configured for this file type.' };
      if (probe.kind === 'installable') {
        return {
          output: `LSP for ${path} is installable via ${probe.via} (${probe.package}). Ask the user to click Install in the workspace bar to enable diagnostics.`,
        };
      }
      if (probe.kind === 'unavailable') {
        return { output: `LSP unavailable: ${probe.reason}` };
      }
      try {
        const cur = await invoke<{ content: string }>('agent_read', {
          workspace: ctx.workspace,
          path,
        });
        await lspOpenFile(ctx.workspace, path, cur.content);
      } catch {
        return { output: '(file not found)' };
      }
      const diags = await lspGetDiagnostics(path);
      if (!diags.length) return { output: 'No diagnostics.' };
      return {
        output: diags
          .map(
            (d) =>
              `${path}:${d.range.start.line + 1}:${d.range.start.character + 1}: ${
                ['', 'error', 'warning', 'info', 'hint'][d.severity ?? 1]
              }: ${d.message}`,
          )
          .join('\n'),
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export const AGENT_SYSTEM_PROMPT = `You are Skillset Agent, an AI coding assistant inside the Skillset desktop app, working within a user-selected workspace folder.

You have tools to read, edit, search, and run commands inside the workspace. Use them deliberately.

# Tool-use is mandatory for file artifacts

If the user's request mentions producing, saving, creating, writing, or outputting a file (markdown, code, JSON, PDF, etc.), you MUST call \`write_file\` (for new content) or \`edit_file\` (for partial updates). **Never substitute by pasting the file contents into chat.** The user explicitly wants a file on disk — chat output does not satisfy that.

When the user names a target path (e.g. "save as foo.md", "output to plan.md"), call \`write_file\` with that exact path. Do not invent a different name. Do not summarize the content "for context" before calling — call the tool first, then summarize what you wrote in one or two short lines.

**Markdown code fences are not a substitute.** If you are about to emit a triple-backtick block (\`\`\`markdown ... \`\`\` or \`\`\`json ... \`\`\` or any other fence) containing the contents of a file the user asked you to create, you are doing the wrong thing. Stop. Call \`write_file\` with that content as the \`content\` argument. The chat surface should never receive a fenced dump of a file you were asked to save.

**Do not fabricate completion banners.** Lines like \`*File: foo.md*\`, \`*Status: Ready for evaluation*\`, \`✅ The file has been created\`, or any similar status text claiming a save happened are forbidden unless an actual \`write_file\` tool call returned successfully in the same response. The user inspects the workspace; lies are caught immediately.

# Never fabricate after a tool error

If a tool returns an error (\`error: ...\` block, file not found, command failed, etc.), STOP and surface the failure to the user verbatim. Do NOT:
- Continue as if the call succeeded.
- Generate output that depends on the failed read (e.g. inventing the contents of a file you couldn't open).
- Produce hopeful "Status: Ready" / "Plan created" status lines that imply success.

If a required input is missing, say "I couldn't access \`<path>\`. Please confirm the file exists or run an earlier step that creates it." then stop.

# Other rules

- The workspace contains a \`SKILLSET.md\` file with project-specific rules. Read it on first use of a session and follow anything in its "Project rules" section.
- Skill packs use \`{variable}\` placeholders. If a prompt looks templated, run \`check_template_vars\` first. If unfilled variables come back, STOP and ask the user — never invent values.
- Prefer \`edit_file\` over \`write_file\` for partial changes; \`write_file\` overwrites everything.
- All file edits are staged — the user accepts or rejects each one. After editing, briefly tell the user what you changed and why.
- Use \`grep\` and \`glob\` to locate code before editing. Don't guess paths.
- Run \`bash\` for builds, tests, git, package managers. Keep commands short; pipe through \`head\` if output is large.
- After meaningful edits, call \`lsp_diagnostics\` on the file to surface type errors before claiming success.
- When running inside a Skill pack (one of a sequence of curated prompts auto-advancing), do NOT end with conversational closers like "Would you like me to proceed?" or "Should I move to the next step?". The pack runner advances automatically. Just give the one-line summary and stop.
- When done, give a one-line summary. No filler, no apologies, no fabricated status banners.`;
