/**
 * Convert a loaded pack into a Claude Skill markdown file.
 *
 * Claude's "skill" format is a single .md with YAML frontmatter +
 * markdown body. Agents (Claude Code, Claude.ai, etc.) read these to
 * learn how to perform a task. We materialize each cloud / user pack
 * as one such file under `<workspace>/.skillset/<slug>.md` so a Set
 * Run can hand the agent loop the same authoritative source the
 * cloud holds — and so users can grep / edit / version them like
 * any other workspace artifact.
 *
 * Shape:
 *
 *   ---
 *   name: <slug>
 *   description: <one-line>
 *   ---
 *
 *   # <Pack Title>
 *
 *   <optional description>
 *
 *   ## Variables
 *
 *   - `{ticker}` — appears in steps 1, 2, 3
 *   - `{duration}` — appears in step 2
 *
 *   ## Steps
 *
 *   ### Step 1 — <header>
 *
 *   <prompt body>
 *
 *   ### Step 2 — <header>
 *
 *   <prompt body>
 */

import type { CloudPrompt } from '../stores/syncStore';

export interface PackForSkill {
  title: string;
  description?: string;
  prompts: CloudPrompt[];
}

/**
 * Convert a pack title to a kebab-case slug usable as filename.
 * Reuses the same scheme as `workflowExporter.getSkillDirName` so
 * pack-level workflows + skill files land at consistent paths.
 */
export function packSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'skill'
  );
}

/** Extract all `{varname}` occurrences across every prompt. Returns deduped. */
function collectVariables(prompts: CloudPrompt[]): Array<{ name: string; steps: number[] }> {
  const map = new Map<string, Set<number>>();
  prompts.forEach((p, i) => {
    for (const m of p.text.matchAll(/\{([a-zA-Z][\w-]*)\}/g)) {
      const name = m[1];
      if (!map.has(name)) map.set(name, new Set());
      map.get(name)!.add(i + 1);
    }
  });
  return Array.from(map.entries()).map(([name, set]) => ({
    name,
    steps: Array.from(set).sort((a, b) => a - b),
  }));
}

export function buildClaudeSkill(pack: PackForSkill): string {
  const slug = packSlug(pack.title);
  const oneLine =
    pack.description?.split('\n')[0]?.trim() ||
    `${pack.prompts.length}-step skill: ${pack.title}`;
  const vars = collectVariables(pack.prompts);
  const varsBlock =
    vars.length > 0
      ? [
          '## Variables',
          '',
          ...vars.map((v) => {
            const stepList = v.steps.length > 0 ? ` (steps ${v.steps.join(', ')})` : '';
            return `- \`{${v.name}}\` — used in${stepList}`;
          }),
          '',
        ].join('\n')
      : '';
  const stepsBlock = pack.prompts
    .map((p, i) => {
      const heading = p.header?.trim() || `Step ${i + 1}`;
      const title = /^Step\s+\d/i.test(heading) ? heading : `Step ${i + 1} — ${heading}`;
      return `### ${title}\n\n${p.text.trim()}`;
    })
    .join('\n\n');
  // YAML frontmatter description must be a single line — strip newlines + escape colons.
  const safeDesc = oneLine.replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"');
  const parts = [
    '---',
    `name: ${slug}`,
    `description: "${safeDesc}"`,
    '---',
    '',
    `# ${pack.title}`,
    '',
    pack.description?.trim() ? `${pack.description.trim()}\n` : '',
    varsBlock,
    '## Steps',
    '',
    stepsBlock,
    '',
  ];
  return parts.filter((s) => s !== '').join('\n');
}
