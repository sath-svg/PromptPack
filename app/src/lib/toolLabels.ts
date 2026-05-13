/**
 * Plain-English tool labels for non-developer users. Keyed off the
 * internal tool name (matches `AGENT_TOOLS` in `agentTools.ts`).
 * Falls back to the raw name when no friendly rendering exists.
 *
 * Used by ToolBlock (inline chat tool render) and the Run Trace
 * panel's user view. Developer mode keeps showing the raw name so
 * power users still get the wire-level signal.
 *
 * Kept short (verb-noun, ≤ 12 chars) so the Run Trace tool-call list
 * doesn't wrap in the narrow side panel. "Web fetcher" was wrapping
 * to two lines next to its URL — "Web fetch" fits cleanly.
 */
export const TOOL_FRIENDLY_LABELS: Record<string, string> = {
  read_file: 'Read file',
  write_file: 'Write file',
  edit_file: 'Edit file',
  list_dir: 'List dir',
  glob: 'Find files',
  grep: 'Search text',
  bash: 'Shell',
  lsp_diagnostics: 'Lint',
  web_fetch: 'Web fetch',
  http: 'HTTP',
  attachment_read: 'Attachment',
  pdf_generate: 'Make PDF',
  check_template_vars: 'Vars check',
};

export function friendlyToolName(name: string): string {
  return TOOL_FRIENDLY_LABELS[name] ?? name;
}
