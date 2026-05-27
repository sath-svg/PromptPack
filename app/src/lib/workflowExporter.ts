import { parseTemplateVariables } from './templateParser';

// ---------------------------------------------------------------------------
// Legacy single-format API — kept so existing callers (SavedPacks button,
// workspaceWorkflowSync) keep compiling. New code should call `generateSkill`.
// ---------------------------------------------------------------------------

export type WorkflowFormat = 'claude-skill';

export interface WorkflowExportOptions {
  format: WorkflowFormat;
  packTitle: string;
  prompts: Array<{ text: string; header?: string }>;
}

/**
 * Generate a single SKILL.md string for a Claude-Code workflow skill.
 *
 * Thin wrapper around the new multi-target `generateSkill()` for back-compat.
 * For new entry points use `generateSkill` directly — it returns the full
 * `{ relativePath, contents }[]` shape that supports folder-kind multi-file
 * outputs and non-Claude targets.
 */
export function generateWorkflow(options: WorkflowExportOptions): string {
  if (options.format !== 'claude-skill') {
    throw new Error(`Unsupported workflow format: ${options.format}`);
  }
  const files = generateSkill({
    target: 'claude-code',
    kind: 'flow',
    packTitle: options.packTitle,
    prompts: options.prompts,
  });
  // 'flow' kind always returns exactly one file.
  return files[0].contents;
}

// ---------------------------------------------------------------------------
// Multi-target / multi-kind skill generator
// ---------------------------------------------------------------------------

/**
 * Skill target ecosystem. Determines the on-disk path layout and the
 * frontmatter / file-extension convention used.
 *
 *  - 'claude-code' → `.claude/skills/<slug>/SKILL.md` (YAML frontmatter)
 *  - 'cursor'      → `.cursor/rules/<slug>.mdc` (Cursor MDC rules)
 *  - 'codex'       → `AGENTS.md` at project root (workflow)
 *                    or `.agents/skills/<slug>/SKILL.md` (folder)
 */
export type SkillTarget = 'claude-code' | 'cursor' | 'codex';

/**
 * Skill shape — what we're writing.
 *
 *  - 'flow'   → one skill, prompts run as a sequential chain.
 *  - 'folder' → parent catalog skill + one child skill per prompt.
 *  - 'preset' → image / video style preset. Parent catalog enumerates each
 *               generation surface (image/video/character/setting/mood) +
 *               recommended visual AI tools (Seedance, GPT-Image-1,
 *               Nanobanana, Higgsfield). Each child is one style-locked
 *               prompt template the agent invokes with the user's subject,
 *               with an HTML→JPG render fallback when no visual tool is
 *               available.
 */
export type SkillKind = 'flow' | 'folder' | 'preset';

/**
 * Visual AI tools the preset skill routes to. Listed in the catalog and
 * the per-surface child skills so the consuming agent knows which model
 * to call for which generation surface.
 *
 * Routing defaults:
 *  - Static images (image / character / setting / mood) → Leonardo.AI,
 *    which exposes a multi-model gateway (Flux, SDXL, Phoenix, Lightning,
 *    Kino XL, etc.) — one integration, many backend models.
 *  - Motion / video → Higgsfield, optimized for cinematic motion and
 *    character consistency across frames.
 *  - Nanobanana / GPT-Image-1 listed as fallbacks for character +
 *    high-fidelity static work when Leonardo is unavailable.
 */
export const PRESET_VISUAL_TOOLS = [
  'Leonardo.AI — primary for static images. Single endpoint exposes Flux, SDXL, Phoenix, Lightning, Kino XL, and other models; the agent can swap models per call without changing the prompt.',
  'Higgsfield — primary for video / motion. Cinematic motion + character consistency across frames.',
  'GPT-Image-1 (OpenAI) — fallback for high-fidelity static images when Leonardo is unavailable.',
  'Nanobanana (Google Gemini 2.5 Flash Image) — fallback for character / portrait edits.',
] as const;

export interface SkillExportOptions {
  target: SkillTarget;
  kind: SkillKind;
  packTitle: string;
  packDescription?: string;
  prompts: Array<{ text: string; header?: string }>;
}

export interface GeneratedSkillFile {
  /**
   * Path relative to the chosen project root (forward slashes).
   * Examples:
   *  - ".claude/skills/foo/SKILL.md"
   *  - ".cursor/rules/foo/intro.mdc"
   *  - "AGENTS.md"
   */
  relativePath: string;
  contents: string;
  /**
   * If true, the caller should append to an existing file at relativePath
   * (with a separator) rather than overwrite. Currently set for AGENTS.md
   * flow installs since users typically have an existing AGENTS.md.
   */
  appendIfExists?: boolean;
}

/**
 * Main entry point. Returns a list of files to write — always >= 1.
 * Workflow-kind always returns exactly 1 file; folder-kind returns
 * 1 parent + N children where N = prompts.length.
 */
export function generateSkill(opts: SkillExportOptions): GeneratedSkillFile[] {
  const { target, kind, packTitle, prompts } = opts;

  if (prompts.length === 0) {
    throw new Error('Cannot generate skill: pack has no prompts');
  }

  if (kind === 'flow') {
    switch (target) {
      case 'claude-code': return [claudeCodeFlow(opts)];
      case 'cursor':      return [cursorFlow(opts)];
      case 'codex':       return [codexFlow(opts)];
    }
  }

  // kind === 'folder' | 'preset' — both emit parent catalog + one child per prompt
  const slug = slugify(packTitle);
  const childSlugs = makeUniqueChildSlugs(prompts);

  if (kind === 'preset') {
    switch (target) {
      case 'claude-code': return claudeCodePreset(opts, slug, childSlugs);
      case 'cursor':      return cursorPreset(opts, slug, childSlugs);
      case 'codex':       return codexPreset(opts, slug, childSlugs);
    }
  }

  // kind === 'folder'
  switch (target) {
    case 'claude-code': return claudeCodeFolder(opts, slug, childSlugs);
    case 'cursor':      return cursorFolder(opts, slug, childSlugs);
    case 'codex':       return codexFolder(opts, slug, childSlugs);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Slugify a string for use as a skill / rule / directory name.
 * Lowercase, hyphens, alphanumeric only, max `maxLen` chars.
 * Returns 'skill' (or 'workflow') as fallback when input slugifies to empty.
 */
export function slugify(s: string, maxLen = 64): string {
  return (
    s
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, maxLen) || 'skill'
  );
}

/**
 * Backwards-compatible alias retained for older callers
 * (workspaceWorkflowSync, SavedPacks). Same behavior as slugify() with the
 * legacy fallback string 'workflow'.
 */
export function getSkillDirName(packTitle: string): string {
  return (
    packTitle
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 64) || 'workflow'
  );
}

/** Build child-skill slugs from prompt headers; dedupe collisions with -2, -3, ... */
function makeUniqueChildSlugs(
  prompts: Array<{ text: string; header?: string }>,
): string[] {
  const seen = new Map<string, number>();
  const out: string[] = [];
  for (let i = 0; i < prompts.length; i++) {
    const base = slugify(prompts[i].header || `step-${i + 1}`);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    out.push(count === 0 ? base : `${base}-${count + 1}`);
  }
  return out;
}

/** Collect every unique `{var}` template placeholder across all prompts. */
function collectAllVariables(prompts: Array<{ text: string }>): string[] {
  const set = new Set<string>();
  for (const p of prompts) {
    for (const v of parseTemplateVariables(p.text)) set.add(v);
  }
  return Array.from(set);
}

/** Quote a description for YAML frontmatter — strip newlines, double-quote, escape `"`. */
function yamlString(s: string): string {
  return `"${s.replace(/\n/g, ' ').replace(/"/g, '\\"').trim()}"`;
}

// ---------------------------------------------------------------------------
// Claude Code generators (.claude/skills/...)
// ---------------------------------------------------------------------------

function claudeCodeFlow(opts: SkillExportOptions): GeneratedSkillFile {
  const { packTitle, prompts } = opts;
  const slug = slugify(packTitle);
  return {
    relativePath: `.claude/skills/${slug}/SKILL.md`,
    contents: renderFlowBody({ packTitle, prompts, target: 'claude-code', slug }),
  };
}

function claudeCodeFolder(
  opts: SkillExportOptions,
  slug: string,
  childSlugs: string[],
): GeneratedSkillFile[] {
  const { packTitle, prompts } = opts;
  const files: GeneratedSkillFile[] = [
    {
      relativePath: `.claude/skills/${slug}/SKILL.md`,
      contents: renderFolderCatalog({
        packTitle,
        prompts,
        childSlugs,
        target: 'claude-code',
        slug,
      }),
    },
  ];
  for (let i = 0; i < prompts.length; i++) {
    files.push({
      relativePath: `.claude/skills/${slug}/${childSlugs[i]}/SKILL.md`,
      contents: renderSingleSkill({
        packTitle,
        prompt: prompts[i],
        childSlug: childSlugs[i],
        index: i,
        target: 'claude-code',
      }),
    });
  }
  return files;
}

// ---------------------------------------------------------------------------
// Cursor generators (.cursor/rules/...mdc)
// ---------------------------------------------------------------------------

function cursorFlow(opts: SkillExportOptions): GeneratedSkillFile {
  const { packTitle, prompts } = opts;
  const slug = slugify(packTitle);
  return {
    relativePath: `.cursor/rules/${slug}.mdc`,
    contents: renderFlowBody({ packTitle, prompts, target: 'cursor', slug }),
  };
}

function cursorFolder(
  opts: SkillExportOptions,
  slug: string,
  childSlugs: string[],
): GeneratedSkillFile[] {
  const { packTitle, prompts } = opts;
  const files: GeneratedSkillFile[] = [
    {
      relativePath: `.cursor/rules/${slug}/index.mdc`,
      contents: renderFolderCatalog({
        packTitle,
        prompts,
        childSlugs,
        target: 'cursor',
        slug,
      }),
    },
  ];
  for (let i = 0; i < prompts.length; i++) {
    files.push({
      relativePath: `.cursor/rules/${slug}/${childSlugs[i]}.mdc`,
      contents: renderSingleSkill({
        packTitle,
        prompt: prompts[i],
        childSlug: childSlugs[i],
        index: i,
        target: 'cursor',
      }),
    });
  }
  return files;
}

// ---------------------------------------------------------------------------
// Codex / AGENTS.md generators
// ---------------------------------------------------------------------------

function codexFlow(opts: SkillExportOptions): GeneratedSkillFile {
  const { packTitle, prompts } = opts;
  const slug = slugify(packTitle);
  return {
    relativePath: 'AGENTS.md',
    appendIfExists: true,
    contents: renderFlowBody({ packTitle, prompts, target: 'codex', slug }),
  };
}

function codexFolder(
  opts: SkillExportOptions,
  slug: string,
  childSlugs: string[],
): GeneratedSkillFile[] {
  const { packTitle, prompts } = opts;
  const files: GeneratedSkillFile[] = [
    {
      relativePath: `.agents/skills/${slug}/SKILL.md`,
      contents: renderFolderCatalog({
        packTitle,
        prompts,
        childSlugs,
        target: 'codex',
        slug,
      }),
    },
  ];
  for (let i = 0; i < prompts.length; i++) {
    files.push({
      relativePath: `.agents/skills/${slug}/${childSlugs[i]}/SKILL.md`,
      contents: renderSingleSkill({
        packTitle,
        prompt: prompts[i],
        childSlug: childSlugs[i],
        index: i,
        target: 'codex',
      }),
    });
  }
  return files;
}

// ---------------------------------------------------------------------------
// Body renderers
// ---------------------------------------------------------------------------

interface RenderFlowArgs {
  packTitle: string;
  prompts: Array<{ text: string; header?: string }>;
  target: SkillTarget;
  slug: string;
}

/** Sequential-chain SKILL.md body (Claude Code / Cursor / Codex). */
function renderFlowBody({ packTitle, prompts, target, slug }: RenderFlowArgs): string {
  const lines: string[] = [];
  const stepSummary = prompts
    .map((p, i) => p.header || `Step ${i + 1}`)
    .join(' → ');
  const description = `Sequential prompt chain: ${stepSummary}. Each step receives the previous step's full output (text + any generated files) as context. Exported from Skillset.`;
  const allVars = collectAllVariables(prompts);

  // Frontmatter
  lines.push(...renderFrontmatter(target, slug, description));
  lines.push('');

  // Title
  lines.push(`# ${packTitle}`);
  lines.push('');
  lines.push(
    'A **Skill Flow** workflow. Prompts run sequentially. Each step has full knowledge of every previous step — including any files, code, data, or content the previous step produced. Treat the chain as one continuous task with shared memory.',
  );
  lines.push('');

  // Rules
  lines.push('## Skill Flow Rules');
  lines.push('');
  lines.push('Before running any step, internalize these rules:');
  lines.push('');
  lines.push('1. **Sequential execution** — Run steps strictly in order (1 → 2 → 3 → ...). Do not skip ahead or run in parallel.');
  lines.push('2. **Shared memory** — Each step inherits *everything* the previous steps produced: text output, generated files (PDFs, code, images, data), variable values, tool results, and any artifacts.');
  lines.push('3. **Reference previous outputs explicitly** — When step N runs, list which prior outputs/files it depends on at the top of its work (e.g. "Using `hello-world.pdf` from Step 1...").');
  lines.push('4. **Persist artifacts** — If a step creates a file (PDF, code, image, JSON, etc.), keep it accessible to subsequent steps by exact name/path. Do not regenerate or rename it in later steps.');
  lines.push('5. **Carry context forward** — Each step\'s response must include enough summary of its output that the next step\'s LLM can act on it without re-asking the user.');
  lines.push('6. **Fail loudly** — If a step needs a file/variable/output from a prior step that is missing, stop and report rather than guess.');
  lines.push('');

  // Variables
  if (allVars.length > 0) {
    lines.push('## Variables');
    lines.push('');
    lines.push('This workflow uses template variables. Before executing Step 1, ask the user to provide a value for each variable listed below.');
    lines.push('');
    lines.push('| Variable | Value |');
    lines.push('|----------|-------|');
    for (const v of allVars) lines.push(`| ${v} | _____ |`);
    lines.push('');
    lines.push('Replace every `{VariableName}` placeholder in the prompts below with the value the user provides. Variable values persist across all steps.');
    lines.push('');
  }

  // Steps
  lines.push('## Workflow Steps');
  lines.push('');
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const stepNum = i + 1;
    const title = prompt.header || `Step ${stepNum}`;
    const isFirst = i === 0;
    const prevTitle = i > 0 ? (prompts[i - 1].header || `Step ${i}`) : null;

    lines.push(`### Step ${stepNum}: ${title}`);
    lines.push('');

    if (isFirst) {
      lines.push('**Inputs:** user-provided variables (see above).');
      lines.push('');
      lines.push("Execute the prompt below. Record your full output — text response, any files created (with exact filenames + locations), any data produced. Step 2 will need it all.");
    } else {
      lines.push(`**Inputs:** the complete output of Step ${i} ("${prevTitle}") — text, generated files, data, and any intermediate artifacts.`);
      lines.push('');
      lines.push('Before executing this step:');
      lines.push(`1. State which Step ${i} outputs you are referencing (e.g. "Reading \`<file-from-step-${i}>\` produced earlier").`);
      lines.push('2. If those outputs are missing, stop and surface the gap.');
      lines.push('');
      lines.push('Then execute the prompt below using those prior outputs as primary context:');
    }

    lines.push('');
    lines.push('```');
    lines.push(prompt.text);
    lines.push('```');
    lines.push('');
    lines.push(
      `**After execution:** Record this step's output (text + filenames + data). Hand it to Step ${stepNum + 1}${stepNum === prompts.length ? ' (final step — no successor)' : ''}.`,
    );
    lines.push('');
  }

  lines.push('## Notes');
  lines.push('');
  lines.push('- This is Skill Flow: every prompt is a *link* in a chain. Treat the whole pack as one task with intermediate checkpoints, not as independent prompts.');
  lines.push('- Generated files persist across steps. Always reference them by exact name.');
  lines.push('- Generated by Skillset.');
  lines.push('');

  return lines.join('\n');
}

interface RenderFolderCatalogArgs {
  packTitle: string;
  prompts: Array<{ text: string; header?: string }>;
  childSlugs: string[];
  target: SkillTarget;
  slug: string;
}

/** Parent SKILL.md for folder-kind — lists each child skill as a sub-skill. */
function renderFolderCatalog({
  packTitle,
  prompts,
  childSlugs,
  target,
  slug,
}: RenderFolderCatalogArgs): string {
  const lines: string[] = [];
  const description = `Folder of ${prompts.length} independent skills from "${packTitle}". Each child is a standalone prompt — invoke whichever fits the current task. Exported from Skillset.`;

  lines.push(...renderFrontmatter(target, slug, description));
  lines.push('');
  lines.push(`# ${packTitle}`);
  lines.push('');
  lines.push(
    'A **Skill Folder** — each child below is an *independent* skill, not a sequential step. Pick whichever child matches the user\'s current task.',
  );
  lines.push('');
  lines.push('## Available skills');
  lines.push('');
  for (let i = 0; i < prompts.length; i++) {
    const child = childSlugs[i];
    const label = prompts[i].header || `Skill ${i + 1}`;
    const oneLine = firstSentence(prompts[i].text);
    lines.push(`- **${label}** (\`${child}\`) — ${oneLine}`);
  }
  lines.push('');
  lines.push('## How to use');
  lines.push('');
  lines.push(
    '1. Identify which child skill best matches the user\'s request.',
  );
  lines.push(
    '2. Invoke that child skill by name (each is registered as its own skill under this folder).',
  );
  lines.push(
    '3. Children are **independent** — do NOT chain them automatically. Each runs in isolation unless the user explicitly asks for a sequence.',
  );
  lines.push('');
  lines.push('- Generated by Skillset.');
  lines.push('');
  return lines.join('\n');
}

interface RenderSingleArgs {
  packTitle: string;
  prompt: { text: string; header?: string };
  childSlug: string;
  index: number;
  target: SkillTarget;
}

/** Single-prompt SKILL.md for one child of a folder-kind pack. */
function renderSingleSkill({
  packTitle,
  prompt,
  childSlug,
  index,
  target,
}: RenderSingleArgs): string {
  const lines: string[] = [];
  const label = prompt.header || `Skill ${index + 1}`;
  const description = `${label} (from ${packTitle}). Exported from Skillset.`;
  const vars = parseTemplateVariables(prompt.text);

  lines.push(...renderFrontmatter(target, childSlug, description));
  lines.push('');
  lines.push(`# ${label}`);
  lines.push('');
  lines.push(`Single-prompt skill. Part of the "${packTitle}" folder.`);
  lines.push('');

  if (vars.length > 0) {
    lines.push('## Variables');
    lines.push('');
    lines.push('Ask the user to provide values for these placeholders before running:');
    lines.push('');
    for (const v of vars) lines.push(`- \`{${v}}\``);
    lines.push('');
  }

  lines.push('## Prompt');
  lines.push('');
  lines.push('```');
  lines.push(prompt.text);
  lines.push('```');
  lines.push('');
  lines.push('- Generated by Skillset.');
  lines.push('');
  return lines.join('\n');
}

/** Per-target frontmatter renderer. Returns the frontmatter block as lines. */
function renderFrontmatter(
  target: SkillTarget,
  slug: string,
  description: string,
): string[] {
  switch (target) {
    case 'claude-code':
      return [
        '---',
        `name: ${slug}`,
        `description: ${yamlString(description)}`,
        'disable-model-invocation: true',
        '---',
      ];
    case 'cursor':
      // Cursor .mdc rules use a YAML head with description / globs / alwaysApply.
      // globs: '**/*' covers any file; alwaysApply false → manual invocation.
      return [
        '---',
        `description: ${yamlString(description)}`,
        "globs: '**/*'",
        'alwaysApply: false',
        '---',
      ];
    case 'codex':
      // AGENTS.md / nested skill files use a plain heading-based format; no
      // frontmatter convention exists, so emit nothing here.
      return [];
  }
}

// ---------------------------------------------------------------------------
// Preset generators (style preset → skill that calls visual AI tools)
// ---------------------------------------------------------------------------

function claudeCodePreset(
  opts: SkillExportOptions,
  slug: string,
  childSlugs: string[],
): GeneratedSkillFile[] {
  const { packTitle, prompts } = opts;
  const files: GeneratedSkillFile[] = [
    {
      relativePath: `.claude/skills/${slug}/SKILL.md`,
      contents: renderPresetCatalog({
        packTitle,
        prompts,
        childSlugs,
        target: 'claude-code',
        slug,
      }),
    },
  ];
  for (let i = 0; i < prompts.length; i++) {
    files.push({
      relativePath: `.claude/skills/${slug}/${childSlugs[i]}/SKILL.md`,
      contents: renderPresetSurface({
        packTitle,
        prompt: prompts[i],
        childSlug: childSlugs[i],
        index: i,
        target: 'claude-code',
      }),
    });
  }
  return files;
}

function cursorPreset(
  opts: SkillExportOptions,
  slug: string,
  childSlugs: string[],
): GeneratedSkillFile[] {
  const { packTitle, prompts } = opts;
  const files: GeneratedSkillFile[] = [
    {
      relativePath: `.cursor/rules/${slug}/index.mdc`,
      contents: renderPresetCatalog({
        packTitle,
        prompts,
        childSlugs,
        target: 'cursor',
        slug,
      }),
    },
  ];
  for (let i = 0; i < prompts.length; i++) {
    files.push({
      relativePath: `.cursor/rules/${slug}/${childSlugs[i]}.mdc`,
      contents: renderPresetSurface({
        packTitle,
        prompt: prompts[i],
        childSlug: childSlugs[i],
        index: i,
        target: 'cursor',
      }),
    });
  }
  return files;
}

function codexPreset(
  opts: SkillExportOptions,
  slug: string,
  childSlugs: string[],
): GeneratedSkillFile[] {
  const { packTitle, prompts } = opts;
  const files: GeneratedSkillFile[] = [
    {
      relativePath: `.agents/skills/${slug}/SKILL.md`,
      contents: renderPresetCatalog({
        packTitle,
        prompts,
        childSlugs,
        target: 'codex',
        slug,
      }),
    },
  ];
  for (let i = 0; i < prompts.length; i++) {
    files.push({
      relativePath: `.agents/skills/${slug}/${childSlugs[i]}/SKILL.md`,
      contents: renderPresetSurface({
        packTitle,
        prompt: prompts[i],
        childSlug: childSlugs[i],
        index: i,
        target: 'codex',
      }),
    });
  }
  return files;
}

/**
 * Classify a prompt as one of the standard preset generation surfaces
 * (image / video / character / setting / mood) by sniffing its header
 * label. Drives which visual AI tools are recommended in the surface
 * SKILL.md. Falls back to 'image' when nothing matches.
 */
function detectPresetSurface(header: string | undefined): PresetSurface {
  const h = (header ?? '').toLowerCase();
  if (/(video|motion|clip|animation|animate)/.test(h)) return 'video';
  if (/(character|portrait|figure|persona|avatar)/.test(h)) return 'character';
  if (/(setting|background|environment|scene|landscape)/.test(h)) return 'setting';
  if (/(mood|atmosphere|tone|lighting|overlay|ambient)/.test(h)) return 'mood';
  return 'image';
}

type PresetSurface = 'image' | 'video' | 'character' | 'setting' | 'mood';

/**
 * Ordered list of recommended visual tools per surface. First = best fit.
 *
 * Image-family surfaces (image / character / setting / mood) default to
 * Leonardo.AI because it fronts many image models behind one API — the
 * agent can swap backbones (Flux, SDXL, Phoenix, …) per call without
 * changing the prompt. Motion / video defaults to Higgsfield for
 * cinematic motion + character consistency.
 */
const SURFACE_TOOLS: Record<PresetSurface, string[]> = {
  image:     ['Leonardo.AI', 'GPT-Image-1', 'Nanobanana'],
  video:     ['Higgsfield', 'Seedance'],
  character: ['Leonardo.AI', 'Nanobanana', 'GPT-Image-1'],
  setting:   ['Leonardo.AI', 'GPT-Image-1'],
  mood:      ['Leonardo.AI', 'GPT-Image-1'],
};

interface RenderPresetCatalogArgs {
  packTitle: string;
  prompts: Array<{ text: string; header?: string }>;
  childSlugs: string[];
  target: SkillTarget;
  slug: string;
}

/**
 * Parent SKILL.md for preset-kind packs. Catalogs every generation surface,
 * names the recommended visual AI tools, and explains the HTML→JPG render
 * fallback the agent can use when no visual tool is wired up.
 */
function renderPresetCatalog({
  packTitle,
  prompts,
  childSlugs,
  target,
  slug,
}: RenderPresetCatalogArgs): string {
  const lines: string[] = [];
  const description = `Style preset "${packTitle}". ${prompts.length} style-locked generation surface${prompts.length === 1 ? '' : 's'} (image / video / character / setting / mood). Static surfaces route to Leonardo.AI (multi-model gateway); video routes to Higgsfield. Exported from Skillset.`;

  lines.push(...renderFrontmatter(target, slug, description));
  lines.push('');
  lines.push(`# ${packTitle}`);
  lines.push('');
  lines.push(
    'A **Style Preset** skill. Every child below is one *style-locked prompt template* for a specific generation surface. The style — palette, line work, composition, signature elements — is baked into each template; the user only supplies a `{subject}` (or other free variables).',
  );
  lines.push('');
  lines.push('## How to use this preset');
  lines.push('');
  lines.push("1. Decide which surface fits the user's request — image, video, character, setting, or mood overlay.");
  lines.push('2. Invoke the matching child skill listed below.');
  lines.push("3. Fill the `{subject}` variable (and any others) with the user's input.");
  lines.push('4. **Execute the generation**, preferring the first available path:');
  lines.push('   - **MCP tool** if the host exposes `leonardo.generate` / `higgsfield.generate` (or similar). MCP is the cleanest bridge — credentials + result handling stay inside the host.');
  lines.push('   - **Direct HTTP API** via the curl recipe baked into each child SKILL.md (uses `LEONARDO_API_KEY` / `HIGGSFIELD_API_KEY` env vars).');
  lines.push('   - **HTML → JPG fallback** when neither is wired (see below).');
  lines.push('5. Save the returned artifact under `generated/` and surface the local path to the user.');
  lines.push('');
  lines.push('## This skill is a real bridge, not just a prompt');
  lines.push('');
  lines.push("Like an MCP server, each child skill below contains executable recipes — curl commands the agent runs against Leonardo.AI / Higgsfield, with response parsing and artifact-save steps. The agent doesn't just print a prompt; it actually performs the generation when keys are present.");
  lines.push('');
  lines.push('## Visual AI tool routing');
  lines.push('');
  lines.push('Each child surface lists its preferred tool(s). Defaults across the catalogue:');
  lines.push('');
  for (const t of PRESET_VISUAL_TOOLS) lines.push(`- ${t}`);
  lines.push('');
  lines.push('## Available surfaces');
  lines.push('');
  for (let i = 0; i < prompts.length; i++) {
    const child = childSlugs[i];
    const label = prompts[i].header || `Surface ${i + 1}`;
    const surface = detectPresetSurface(prompts[i].header);
    const tools = SURFACE_TOOLS[surface].join(', ');
    lines.push(`- **${label}** (\`${child}\`) — surface: \`${surface}\` · tools: ${tools}`);
  }
  lines.push('');
  lines.push('## HTML → JPG render fallback');
  lines.push('');
  lines.push(
    'When no visual AI tool is wired up — or the user explicitly wants a deterministic mock — render an **HTML mockup** that visually approximates the prompt (background colour from the palette, layout matching the composition, placeholder for the subject) and convert it to JPG using your screenshot / headless-browser tool (Playwright, Puppeteer, `wkhtmltoimage`, etc.). This is the default fallback for any surface above.',
  );
  lines.push('');
  lines.push('## Rules');
  lines.push('');
  lines.push('- Do **not** modify the style portion of any child prompt — palette hex codes, signature elements, and composition language are load-bearing.');
  lines.push('- Surfaces are **independent**, not sequential. Pick one per generation request unless the user asks for a multi-surface batch.');
  lines.push("- If the user's request crosses surfaces (e.g. \"animated character on a moody background\"), generate each surface separately then composite, rather than blending one mega-prompt.");
  lines.push('- Generated by Skillset.');
  lines.push('');
  return lines.join('\n');
}

interface RenderPresetSurfaceArgs {
  packTitle: string;
  prompt: { text: string; header?: string };
  childSlug: string;
  index: number;
  target: SkillTarget;
}

/**
 * Child SKILL.md for one preset generation surface. Includes the style-locked
 * template + variables + executable API integration block for the primary
 * visual AI tool (Leonardo.AI for static surfaces, Higgsfield for video) +
 * MCP-first preference note + HTML→JPG fallback.
 */
function renderPresetSurface({
  packTitle,
  prompt,
  childSlug,
  index,
  target,
}: RenderPresetSurfaceArgs): string {
  const lines: string[] = [];
  const label = prompt.header || `Surface ${index + 1}`;
  const surface = detectPresetSurface(prompt.header);
  const tools = SURFACE_TOOLS[surface];
  const description = `${label} (${surface} surface from ${packTitle}). Style-locked template — fill {subject} and route to ${tools[0]}. Exported from Skillset.`;
  const vars = parseTemplateVariables(prompt.text);
  const isVideo = surface === 'video';

  lines.push(...renderFrontmatter(target, childSlug, description));
  lines.push('');
  lines.push(`# ${label}`);
  lines.push('');
  lines.push(`Style-locked **${surface}** surface from the "${packTitle}" preset.`);
  lines.push('');

  // -- Execution order --------------------------------------------------
  lines.push('## How the agent runs this skill');
  lines.push('');
  lines.push('Try these execution paths in order. Stop at the first one that succeeds.');
  lines.push('');
  lines.push(`1. **MCP tool (preferred)** — If an MCP server exposes \`${isVideo ? 'higgsfield' : 'leonardo'}.generate\` (or equivalent), call it with the filled prompt. MCP keeps credentials + result handling inside the host; no manual API plumbing needed.`);
  lines.push(`2. **Direct HTTP API** — Execute the curl recipe in the *API integration* section below (requires \`${isVideo ? 'HIGGSFIELD_API_KEY' : 'LEONARDO_API_KEY'}\` env var).`);
  lines.push('3. **HTML → JPG fallback** — Last resort: render an HTML mockup of the prompt (palette + composition + subject placeholder), screenshot it with Playwright / Puppeteer / `wkhtmltoimage`, save as JPG.');
  lines.push('');

  // -- Tool list --------------------------------------------------------
  lines.push('## Recommended tools');
  lines.push('');
  lines.push(`- **Primary:** ${tools[0]}`);
  if (tools.length > 1) {
    lines.push(`- **Fallback:** ${tools.slice(1).join(' · ')}`);
  }
  lines.push('');

  // -- Variables --------------------------------------------------------
  if (vars.length > 0) {
    lines.push('## Variables');
    lines.push('');
    lines.push('Collect these from the user before sending the prompt:');
    lines.push('');
    for (const v of vars) {
      const hint =
        v.toLowerCase() === 'subject'
          ? ' — the thing being generated (character name, scene description, etc.)'
          : '';
      lines.push(`- \`{${v}}\`${hint}`);
    }
    lines.push('');
  }

  // -- Style-locked template -------------------------------------------
  lines.push('## Prompt template');
  lines.push('');
  lines.push('Replace every `{var}` with the user-supplied value. The resulting string is the `prompt` field sent to the API below.');
  lines.push('');
  lines.push('```');
  lines.push(prompt.text);
  lines.push('```');
  lines.push('');

  // -- API integration --------------------------------------------------
  lines.push('## API integration');
  lines.push('');
  if (isVideo) {
    lines.push(...renderHiggsfieldRecipe());
  } else {
    lines.push(...renderLeonardoRecipe(surface));
  }

  // -- Rules ------------------------------------------------------------
  lines.push('## Rules');
  lines.push('');
  lines.push('- Keep every style descriptor verbatim — palette hex codes, line-work spec, signature elements. Only the `{var}` slots are substitutable.');
  lines.push(`- If the user wants a different surface (e.g. ${isVideo ? 'image instead of video' : 'video instead of ' + surface}), switch to that child skill rather than editing this one.`);
  lines.push('- Always confirm the API key env var is set before invoking the curl recipe. If missing, prompt the user to export it.');
  lines.push('- Generated by Skillset.');
  lines.push('');
  return lines.join('\n');
}

/**
 * Leonardo.AI integration recipe. Two-step flow: POST /generations starts
 * the job and returns `generationId`; GET /generations/{id} polls until
 * `status: COMPLETE` then yields image URLs in `generated_images`.
 *
 * `modelId` defaults to Flux Dev (general-purpose). Agent can swap to
 * SDXL Lightning, Phoenix, Kino XL, etc. by overriding modelId — same
 * endpoint, different backbone. That's why Leonardo is the routing
 * primary: one integration covers many models.
 */
function renderLeonardoRecipe(surface: PresetSurface): string[] {
  const lines: string[] = [];
  // Reasonable per-surface dimension defaults.
  const dims = {
    image:     { w: 1024, h: 1024, label: 'square hero' },
    character: { w: 768,  h: 1152, label: 'portrait 2:3' },
    setting:   { w: 1536, h: 832,  label: 'wide landscape 16:9' },
    mood:      { w: 1024, h: 1024, label: 'square overlay' },
    video:     { w: 1024, h: 1024, label: 'unused' },
  }[surface];

  lines.push('**Endpoint:** `POST https://cloud.leonardo.ai/api/rest/v1/generations`');
  lines.push('');
  lines.push('**Auth:** `Authorization: Bearer $LEONARDO_API_KEY`');
  lines.push('');
  lines.push('**Default model:** `b24e16ff-06e3-43eb-8d33-4416c2d75876` (Leonardo Flux Dev — general-purpose). Swap to any Leonardo-hosted model by overriding `modelId`:');
  lines.push('');
  lines.push('| Model | modelId |');
  lines.push('|---|---|');
  lines.push('| Flux Dev (default) | `b24e16ff-06e3-43eb-8d33-4416c2d75876` |');
  lines.push('| Flux Schnell | `1dd50843-d653-4516-a8e3-f0238ee453ff` |');
  lines.push('| Phoenix 1.0 | `de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3` |');
  lines.push('| SDXL Lightning | `b24e16ff-06e3-43eb-8d33-4416c2d75876` |');
  lines.push('| Kino XL (cinematic) | `aa77f04e-3eec-4034-9c07-d0f619684628` |');
  lines.push('');
  lines.push(`**Dimensions for this surface:** \`${dims.w} × ${dims.h}\` (${dims.label}). Override per user request.`);
  lines.push('');
  lines.push('**Step 1 — Start generation:**');
  lines.push('');
  lines.push('```bash');
  lines.push('PROMPT="<the filled style-locked prompt from above>"');
  lines.push('GEN_ID=$(curl -s -X POST https://cloud.leonardo.ai/api/rest/v1/generations \\');
  lines.push('  -H "Authorization: Bearer $LEONARDO_API_KEY" \\');
  lines.push('  -H "Content-Type: application/json" \\');
  lines.push('  -d "$(jq -n --arg p "$PROMPT" \'{');
  lines.push('        prompt: $p,');
  lines.push('        modelId: "b24e16ff-06e3-43eb-8d33-4416c2d75876",');
  lines.push(`        width: ${dims.w},`);
  lines.push(`        height: ${dims.h},`);
  lines.push('        num_images: 1,');
  lines.push('        guidance_scale: 7,');
  lines.push('        public: false');
  lines.push('      }\')" \\');
  lines.push("  | jq -r '.sdGenerationJob.generationId')");
  lines.push('echo "generationId: $GEN_ID"');
  lines.push('```');
  lines.push('');
  lines.push('**Step 2 — Poll until complete:**');
  lines.push('');
  lines.push('```bash');
  lines.push('while :; do');
  lines.push('  RESP=$(curl -s -H "Authorization: Bearer $LEONARDO_API_KEY" \\');
  lines.push('    "https://cloud.leonardo.ai/api/rest/v1/generations/$GEN_ID")');
  lines.push("  STATUS=$(echo \"$RESP\" | jq -r '.generations_by_pk.status')");
  lines.push('  echo "status: $STATUS"');
  lines.push('  [ "$STATUS" = "COMPLETE" ] && break');
  lines.push('  [ "$STATUS" = "FAILED" ] && { echo "Generation failed"; exit 1; }');
  lines.push('  sleep 3');
  lines.push('done');
  lines.push("IMG_URL=$(echo \"$RESP\" | jq -r '.generations_by_pk.generated_images[0].url')");
  lines.push('echo "image: $IMG_URL"');
  lines.push('```');
  lines.push('');
  lines.push('**Step 3 — Save artifact locally** so subsequent skills / steps can reference it:');
  lines.push('');
  lines.push('```bash');
  lines.push('mkdir -p generated');
  lines.push('OUT="generated/$(date +%s).jpg"');
  lines.push('curl -s -L "$IMG_URL" -o "$OUT"');
  lines.push('echo "saved: $OUT"');
  lines.push('```');
  lines.push('');
  lines.push('Surface the final local path back to the user (and to any successor skill).');
  lines.push('');
  return lines;
}

/**
 * Higgsfield integration recipe. Endpoint surface mirrors the public
 * docs at https://higgsfield.ai/docs (subject to change). Use the
 * `text-to-video` endpoint; result delivered via webhook OR async poll.
 * Kept conservative — the agent should confirm exact paths against
 * `$HIGGSFIELD_API_BASE` (env var override) before firing.
 */
function renderHiggsfieldRecipe(): string[] {
  const lines: string[] = [];
  lines.push('**Endpoint:** `POST $HIGGSFIELD_API_BASE/v1/video/generations`');
  lines.push('(`HIGGSFIELD_API_BASE` defaults to `https://api.higgsfield.ai` — override if Higgsfield issues you a custom base URL.)');
  lines.push('');
  lines.push('**Auth:** `Authorization: Bearer $HIGGSFIELD_API_KEY`');
  lines.push('');
  lines.push('**Defaults:** 5-second clip, 1024×576 (16:9), 24fps, motion preset `cinematic`. Override per user request.');
  lines.push('');
  lines.push('**Step 1 — Start generation:**');
  lines.push('');
  lines.push('```bash');
  lines.push('PROMPT="<the filled style-locked prompt from above>"');
  lines.push(': "${HIGGSFIELD_API_BASE:=https://api.higgsfield.ai}"');
  lines.push('JOB_ID=$(curl -s -X POST "$HIGGSFIELD_API_BASE/v1/video/generations" \\');
  lines.push('  -H "Authorization: Bearer $HIGGSFIELD_API_KEY" \\');
  lines.push('  -H "Content-Type: application/json" \\');
  lines.push('  -d "$(jq -n --arg p "$PROMPT" \'{');
  lines.push('        prompt: $p,');
  lines.push('        duration_seconds: 5,');
  lines.push('        width: 1024,');
  lines.push('        height: 576,');
  lines.push('        fps: 24,');
  lines.push('        motion: "cinematic"');
  lines.push('      }\')" \\');
  lines.push("  | jq -r '.id')");
  lines.push('echo "jobId: $JOB_ID"');
  lines.push('```');
  lines.push('');
  lines.push('**Step 2 — Poll until complete:**');
  lines.push('');
  lines.push('```bash');
  lines.push('while :; do');
  lines.push('  RESP=$(curl -s -H "Authorization: Bearer $HIGGSFIELD_API_KEY" \\');
  lines.push('    "$HIGGSFIELD_API_BASE/v1/video/generations/$JOB_ID")');
  lines.push("  STATUS=$(echo \"$RESP\" | jq -r '.status')");
  lines.push('  echo "status: $STATUS"');
  lines.push('  [ "$STATUS" = "succeeded" ] && break');
  lines.push('  [ "$STATUS" = "failed" ] && { echo "Generation failed"; exit 1; }');
  lines.push('  sleep 5');
  lines.push('done');
  lines.push("VIDEO_URL=$(echo \"$RESP\" | jq -r '.output.url')");
  lines.push('echo "video: $VIDEO_URL"');
  lines.push('```');
  lines.push('');
  lines.push('**Step 3 — Save artifact locally:**');
  lines.push('');
  lines.push('```bash');
  lines.push('mkdir -p generated');
  lines.push('OUT="generated/$(date +%s).mp4"');
  lines.push('curl -s -L "$VIDEO_URL" -o "$OUT"');
  lines.push('echo "saved: $OUT"');
  lines.push('```');
  lines.push('');
  lines.push('Surface the final local path back to the user.');
  lines.push('');
  return lines;
}

/** Pull a short preview sentence from a prompt body. */
function firstSentence(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(.{0,120}?[.!?])\s/);
  const preview = match ? match[1] : cleaned.slice(0, 120);
  return preview.length < cleaned.length && !preview.endsWith('…')
    ? preview + '…'
    : preview;
}
