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
  {
    name: 'web_fetch',
    description:
      'Fetch a public URL and return its body as text. Follows up to 10 redirects, caps at 5 MB, 60s timeout. Use for live web pages, RSS feeds, public APIs the model needs to read. URL must be http(s).',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Absolute http(s) URL to fetch.' },
      },
      required: ['url'],
    },
  },
  {
    name: 'http',
    description:
      'Generic HTTP request — choose method, set headers, send a body. Same caps as web_fetch (5 MB, 60s, http/https only). Use for JSON APIs that need POST/PUT, custom headers, or auth.',
    input_schema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          description: 'GET | POST | PUT | PATCH | DELETE | HEAD | OPTIONS',
        },
        url: { type: 'string', description: 'Absolute http(s) URL.' },
        headers: {
          type: 'object',
          description: 'Optional request headers as { name: value }.',
          additionalProperties: { type: 'string' },
        },
        body: {
          type: 'string',
          description: 'Optional request body (e.g. JSON-stringified payload).',
        },
      },
      required: ['method', 'url'],
    },
  },
  {
    name: 'pdf_generate',
    description:
      'Write a basic A4 PDF from plain text or lightly-formatted markdown to a workspace-relative path. Pure-Rust generator: no HTML/CSS/images, no embedded fonts. Use `# Heading` and `## Subheading` markdown for structure; blank lines for paragraph breaks. Output path MUST end in `.pdf`. Pass `title` for the document metadata; defaults to "Document".',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Workspace-relative output path. Must end in .pdf.',
        },
        content: {
          type: 'string',
          description:
            'Body text. Plain or lightly-marked-up markdown (`#` / `##` headings, blank lines for paragraphs).',
        },
        title: {
          type: 'string',
          description: 'Optional document title (PDF metadata + opener title).',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'attachment_read',
    description:
      'Read the contents of a file the user attached to this run via the attachment bar. Pass the workspace-relative path shown in the attachment list. Use for PDFs / docs the user dropped in instead of asking the user to paste content.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Workspace-relative path of the attached file (matches what list_attachments returns).',
        },
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
  // Pass 1: explicit filename + extension. Order: longest / most
  // specific patterns first.
  const namedPatterns: RegExp[] = [
    /(?:output|save|write)\s+(?:it|the\s+\w+(?:\s+\w+)?)\s+(?:as|to|into)\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:output|save|write)\s+(?:it|the\s+\w+(?:\s+\w+)?)?\s*as\s+a\s+\w+\s+file\s+(?:named|called)\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:save|write|output)\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:save\s+(?:the\s+)?(?:corrected\s+)?(?:version\s+)?)?back\s+to\s+([\w./\\-]+\.\w{1,6})\b/i,
    /(?:produce\s+(?:a\s+)?(?:pdf\s+)?(?:report\s+)?saved\s+as)\s+([\w./\\-]+\.\w{1,6})\b/i,
  ];
  for (const rx of namedPatterns) {
    const m = text.match(rx);
    if (m && m[1]) return m[1];
  }
  // Pass 2: implicit save intent without a filename. Triggered by
  // common phrasings like "save to workspace", "write a pdf file",
  // "create the report". Returns a synthetic placeholder so the
  // caller knows to switch to the agent path; the model picks an
  // actual filename + extension based on content.
  //
  // Looser than the earlier set — real users phrase saves with the
  // verb at the start of a clause and a destination keyword anywhere
  // after, e.g. "write a pdf file with content X and save to
  // workspace". Earlier strict patterns required a noun like
  // "it/that/this" between the verb and the target, which dropped
  // those phrasings.
  const implicitPatterns: RegExp[] = [
    // "save / put / drop / store … workspace" — anywhere in the same
    // clause (≤ 80 chars between verb and target).
    /\b(?:save|put|drop|store|persist)\b[^.\n]{0,80}\bworkspace\b/i,
    // "write … to / in / into workspace".
    /\bwrite\b[^.\n]{0,80}\b(?:to|in|into)\s+(?:the\s+)?workspace\b/i,
    // "save / write … to disk" / "save locally".
    /\b(?:save|write)\b[^.\n]{0,40}\b(?:to\s+disk|locally|on\s+disk)\b/i,
    // "write a pdf file" / "create a markdown file" — with or without
    // article. Catches the bare "create the file" / "make a document"
    // case too.
    /\b(?:write|create|make|generate|build|produce)\s+(?:the|a|an)?\s*(?:file|document|report|pdf|markdown|md|html|json|csv|txt|docx?)\b/i,
    // "write … as / in pdf|markdown|md|html|file".
    /\bwrite\b[^.\n]{0,80}\b(?:as|in|into)\s+(?:a\s+)?(?:pdf|markdown|md|html|file|json|csv|txt)\b/i,
    // "export / output … as pdf|markdown|md|html".
    /\b(?:export|output)\b[^.\n]{0,80}\bas\s+(?:a\s+)?(?:pdf|markdown|md|html|json|csv|txt)\b/i,
    // "put it in workspace" — the original specific shape.
    /\bput\s+(?:it|that|this|the\s+\w+(?:\s+\w+)?)\s+in\s+(?:the\s+)?workspace\b/i,
  ];
  for (const rx of implicitPatterns) {
    if (rx.test(text)) return '__implicit__';
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
      // Hard guard — write_file produces a plain-text file with the
      // requested extension. PDFs need a binary header (`%PDF-1.x`)
      // that this tool can't produce. Force the model to call
      // `pdf_generate` instead so the user gets a real, openable PDF
      // rather than a `.pdf`-named text file that every PDF reader
      // rejects.
      if (/\.pdf$/i.test(path)) {
        return {
          output:
            `ERROR: write_file refuses .pdf paths — the result would be a text file with a .pdf extension that PDF readers reject. ` +
            `Call \`pdf_generate\` with the same path and pass the body as \`content\` (plain text or simple #/## markdown).`,
        };
      }
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
      const autoAccept = useAgentStore.getState().autoAcceptEdits;
      // Auto-accept mode writes eagerly so `acceptEdit` only has to
      // push to the LSP. Ask mode stages — the user's click in the
      // DiffPanel is what triggers the actual `agent_write`. This
      // line is the difference between "did Accept actually do
      // something?" yes vs. no.
      if (autoAccept) {
        await invoke('agent_write', {
          workspace: ctx.workspace,
          path,
          content,
        });
      }
      const editId = makeId();
      useAgentStore.getState().addPendingEdit({
        id: editId,
        path,
        before,
        after: content,
        isStaged: !autoAccept,
      });
      // LSP probe / diagnostics only run when the file is actually on
      // disk. Staged edits defer LSP work to `acceptEdit`.
      if (autoAccept) {
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
        useAgentStore.getState().acceptEdit(editId).catch(() => {});
      }
      return {
        output: autoAccept
          ? `Wrote ${path} (${content.length} bytes).`
          : `Staged write to ${path} (${content.length} bytes). The user will accept/reject — file is NOT yet on disk.`,
        pendingEditId: editId,
      };
    }

    case 'edit_file': {
      const path = String(input.path);
      const oldString = String(input.old_string);
      const newString = String(input.new_string);
      const replaceAll = Boolean(input.replace_all);
      const autoAccept = useAgentStore.getState().autoAcceptEdits;

      // In ask mode we can't call `agent_edit` (Rust writes eagerly).
      // Read current content, compute `after` client-side, stage. The
      // accept handler will write `after` on click. In auto-accept
      // mode, keep the existing path through `agent_edit` so we
      // preserve its replace-count + error semantics.
      if (autoAccept) {
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
          isStaged: false,
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
        useAgentStore.getState().acceptEdit(editId).catch(() => {});
        return {
          output: `Replaced ${res.replaced} occurrence(s) in ${path}.`,
          pendingEditId: editId,
        };
      }

      // Ask mode — preview only, no filesystem write yet.
      let before = '';
      try {
        const cur = await invoke<{ content: string }>('agent_read', {
          workspace: ctx.workspace,
          path,
        });
        before = cur.content;
      } catch {
        return {
          output: `ERROR: edit_file requires the file to exist; ${path} not found. Use write_file to create new files.`,
        };
      }
      // Mirror Rust's match semantics: if old_string is empty, refuse.
      if (oldString.length === 0) {
        return {
          output: `ERROR: edit_file old_string is empty.`,
        };
      }
      let replaced = 0;
      let after = before;
      if (replaceAll) {
        // Count then split-join — JS string.replaceAll exists but the
        // count is needed for the user-facing message.
        const parts = before.split(oldString);
        replaced = parts.length - 1;
        after = parts.join(newString);
      } else {
        const idx = before.indexOf(oldString);
        if (idx >= 0) {
          replaced = 1;
          after = before.slice(0, idx) + newString + before.slice(idx + oldString.length);
        }
      }
      if (replaced === 0) {
        return {
          output: `ERROR: edit_file old_string not found in ${path}. No changes staged.`,
        };
      }
      const editId = makeId();
      useAgentStore.getState().addPendingEdit({
        id: editId,
        path,
        before,
        after,
        isStaged: true,
      });
      return {
        output: `Staged ${replaced} replacement(s) in ${path}. The user will accept/reject — file is NOT yet modified.`,
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

    case 'web_fetch': {
      const url = String(input.url);
      const res = await invoke<{
        status: number;
        url: string;
        content_type: string | null;
        body: string;
        truncated: boolean;
      }>('agent_web_fetch', { url });
      const header = `${res.status} ${res.url}${res.content_type ? ` (${res.content_type})` : ''}${res.truncated ? ' [TRUNCATED]' : ''}`;
      return { output: `${header}\n\n${truncate(res.body, 12000)}` };
    }

    case 'http': {
      const method = String(input.method ?? 'GET').toUpperCase();
      const url = String(input.url);
      const headersIn = (input.headers as Record<string, string> | undefined) ?? undefined;
      const bodyIn = input.body !== undefined ? String(input.body) : undefined;
      const res = await invoke<{
        status: number;
        headers: Record<string, string>;
        body: string;
        truncated: boolean;
      }>('agent_http', {
        input: { method, url, headers: headersIn, body: bodyIn },
      });
      const headerLines = Object.entries(res.headers)
        .slice(0, 20)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      const header = `${method} ${url} → ${res.status}${res.truncated ? ' [TRUNCATED]' : ''}`;
      return {
        output: `${header}\n${headerLines}\n\n${truncate(res.body, 12000)}`,
      };
    }

    case 'pdf_generate': {
      const path = String(input.path);
      const content = String(input.content ?? '');
      const title = input.title !== undefined ? String(input.title) : undefined;
      const autoAccept = useAgentStore.getState().autoAcceptEdits;

      if (autoAccept) {
        const res = await invoke<{ path: string; bytes: number; pages: number }>(
          'agent_pdf_generate',
          { workspace: ctx.workspace, path, content, title },
        );
        // Surface a pending-edit row so the user has the same
        // accept/reject UX as text edits. Auto-accept marks it
        // immediately so the badge clears in one tick.
        const editId = makeId();
        useAgentStore.getState().addPendingEdit({
          id: editId,
          path,
          before: '',
          after: content,
          isStaged: false,
          pdfPayload: { content, title },
        });
        useAgentStore.getState().acceptEdit(editId).catch(() => {});
        return {
          output: `Wrote PDF to ${res.path} (${res.pages} page${res.pages === 1 ? '' : 's'}, ${res.bytes} bytes).`,
          pendingEditId: editId,
        };
      }

      // Ask mode — stage. The Rust handler runs only after the user
      // clicks Accept in the DiffPanel.
      const editId = makeId();
      useAgentStore.getState().addPendingEdit({
        id: editId,
        path,
        before: '',
        after: content,
        isStaged: true,
        pdfPayload: { content, title },
      });
      return {
        output: `Staged PDF generation for ${path} (${content.length} chars source). The user will accept/reject — file is NOT yet on disk.`,
        pendingEditId: editId,
      };
    }

    case 'attachment_read': {
      // Attachments are copied into the workspace when the user drops
      // them in, so a normal `agent_read` against the relative path
      // serves the same bytes. We still tag the tool separately so the
      // model knows what surface to call when it needs a user-supplied
      // doc rather than a file it wrote earlier in the run.
      const path = String(input.path);
      const known = useAgentStore.getState().attachments;
      if (known.length > 0 && !known.includes(path)) {
        const list = known.map((p) => `- ${p}`).join('\n');
        return {
          output: `Path "${path}" is not in the user's attachment list.\nAvailable attachments:\n${list}`,
        };
      }
      const res = await invoke<{ content: string; line_count: number }>(
        'agent_read',
        { workspace: ctx.workspace, path },
      );
      return {
        output: `${path} (${res.line_count} lines)\n\n${truncate(res.content, 12000)}`,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export const AGENT_SYSTEM_PROMPT = `You are Skillset Agent, an AI coding assistant inside the Skillset desktop app, working within a user-selected workspace folder.

You have tools to read, edit, search, and run commands inside the workspace. Use them deliberately.

# Tool-use is mandatory for file artifacts

If the user's request mentions producing, saving, creating, writing, or outputting a file, you MUST call the right write tool — never paste contents into chat instead.

Pick the tool by extension:

- **\`.pdf\` → call \`pdf_generate\`.** \`write_file\` with a .pdf path produces a plain-text file with a .pdf extension; PDF readers reject it. Pass the body as \`content\` (plain text or simple \`#\`/\`##\` markdown) and the desired path. NEVER use \`write_file\` for a .pdf path.
- **All other text formats (\`.md\`, \`.txt\`, \`.json\`, \`.html\`, source code, etc.) → call \`write_file\`** for new content or \`edit_file\` for partial updates.

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
