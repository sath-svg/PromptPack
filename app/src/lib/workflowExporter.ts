import { parseTemplateVariables } from './templateParser';

export type WorkflowFormat = 'claude-skill';

export interface WorkflowExportOptions {
  format: WorkflowFormat;
  packTitle: string;
  prompts: Array<{ text: string; header?: string }>;
}

/**
 * Generate a workflow file from a pack's prompts
 */
export function generateWorkflow(options: WorkflowExportOptions): string {
  switch (options.format) {
    case 'claude-skill':
      return generateClaudeSkill(options);
    default:
      throw new Error(`Unsupported workflow format: ${options.format}`);
  }
}

/**
 * Get the skill directory name (slug) for a pack title
 * Follows Claude skill naming rules: lowercase, hyphens, max 64 chars
 */
export function getSkillDirName(packTitle: string): string {
  return packTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 64) || 'workflow';
}

function generateClaudeSkill({ packTitle, prompts }: WorkflowExportOptions): string {
  const lines: string[] = [];
  const slug = getSkillDirName(packTitle);

  // Build step summary for description
  const stepNames = prompts.map((p, i) => p.header || `Step ${i + 1}`);
  const stepSummary = stepNames.join(' → ');

  // YAML frontmatter
  lines.push('---');
  lines.push(`name: ${slug}`);
  lines.push(`description: "Sequential prompt chain: ${stepSummary}. Each step receives the previous step's full output (text + any generated files) as context. Exported from Skillset."`);
  lines.push('disable-model-invocation: true');
  lines.push('---');
  lines.push('');

  // Title
  lines.push(`# ${packTitle}`);
  lines.push('');
  lines.push(
    'A **Skill Flow** workflow. Prompts run sequentially. Each step has full knowledge of every previous step — including any files, code, data, or content the previous step produced. Treat the chain as one continuous task with shared memory.'
  );
  lines.push('');

  // Skill Flow core rules — these instructions apply to EVERY step
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

  // Collect all unique template variables across all prompts
  const allVars = new Set<string>();
  for (const prompt of prompts) {
    for (const v of parseTemplateVariables(prompt.text)) {
      allVars.add(v);
    }
  }

  // Variables section (before steps so agent sees them first)
  if (allVars.size > 0) {
    lines.push('## Variables');
    lines.push('');
    lines.push('This workflow uses template variables. Before executing Step 1, ask the user to provide a value for each variable listed below.');
    lines.push('');
    lines.push('| Variable | Value |');
    lines.push('|----------|-------|');
    for (const v of allVars) {
      lines.push(`| ${v} | _____ |`);
    }
    lines.push('');
    lines.push('Replace every `{VariableName}` placeholder in the prompts below with the value the user provides. Variable values persist across all steps.');
    lines.push('');
  }

  // Workflow steps with explicit dependency framing
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
      lines.push('Execute the prompt below. Record your full output — text response, any files created (with exact filenames + locations), any data produced. Step 2 will need it all.');
    } else {
      lines.push(`**Inputs:** the complete output of Step ${i} ("${prevTitle}") — text, generated files, data, and any intermediate artifacts.`);
      lines.push('');
      lines.push(`Before executing this step:`);
      lines.push(`1. State which Step ${i} outputs you are referencing (e.g. "Reading \`<file-from-step-${i}>\` produced earlier").`);
      lines.push(`2. If those outputs are missing, stop and surface the gap.`);
      lines.push('');
      lines.push('Then execute the prompt below using those prior outputs as primary context:');
    }

    lines.push('');
    lines.push('```');
    lines.push(prompt.text);
    lines.push('```');
    lines.push('');
    lines.push(`**After execution:** Record this step's output (text + filenames + data). Hand it to Step ${stepNum + 1}${stepNum === prompts.length ? ' (final step — no successor)' : ''}.`);
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
