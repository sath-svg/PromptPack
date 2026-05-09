/**
 * Final synthesis. Combines completed subtask outputs into a single
 * assistant message according to the planner's `merge` directive.
 *
 *  - "concat"      — paste outputs in topological order, separated by
 *                    headings.
 *  - "synthesize"  — call the inbuilt server (Llama 3.1 8B, free) to
 *                    weave them. Falls back to plain concat on failure
 *                    so a transient server hiccup never blocks the run.
 *  - "first"       — return only the last leaf subtask's output.
 *
 * Synth uses the same free server path as the planner so a workflow
 * never silently invokes a premium model the user didn't ask for.
 */

import { tauriFetch } from '../tauriFetch';
import type { PlannerOutput, TaskState } from './types';

const SERVER_OPENAI_COMPAT_URL = 'https://api.pmtpk.com/v1/chat/completions';
const SERVER_SYNTH_MODEL = 'llama-3.1-8b-instant';

export async function merge(
  plan: PlannerOutput,
  state: TaskState,
  deps: { jwt: string; signal?: AbortSignal },
): Promise<string> {
  // 1-subtask plans never need a merge step — the subtask's own output IS
  // the answer regardless of which merge strategy the planner picked.
  // Saves the synth LLM round-trip and avoids "## title" scaffold noise.
  if (plan.subtasks.length === 1) {
    return state.subtasks[plan.subtasks[0].id]?.output ?? '';
  }
  switch (plan.merge) {
    case 'first':
      return mergeFirst(plan, state);
    case 'concat':
      return mergeConcat(plan, state);
    case 'synthesize':
      return await mergeSynthesize(plan, state, deps);
  }
}

function mergeFirst(plan: PlannerOutput, state: TaskState): string {
  // Pick the last leaf — i.e. the subtask with no descendants depending on it.
  const ids = plan.subtasks.map((s) => s.id);
  const referenced = new Set<string>();
  for (const s of plan.subtasks) for (const d of s.depends_on) referenced.add(d);
  const leaves = ids.filter((id) => !referenced.has(id));
  const target = leaves[leaves.length - 1] ?? ids[ids.length - 1];
  const primary = (state.subtasks[target]?.output ?? '').trim();
  if (primary) return primary;
  // Fallback — the picked leaf was empty (common when the last subtask
  // only wrote a file via `write_file` and never followed up with text).
  // Walk the plan in reverse and return the most recent non-empty
  // output so the chat bubble shows *something* instead of going blank.
  for (let i = plan.subtasks.length - 1; i >= 0; i--) {
    const out = (state.subtasks[plan.subtasks[i].id]?.output ?? '').trim();
    if (out) return out;
  }
  return '';
}

function mergeConcat(plan: PlannerOutput, state: TaskState): string {
  // 1-subtask concat is just the subtask's raw output. The "## title"
  // scaffold only adds value when there are multiple sections to navigate.
  const completed = plan.subtasks
    .map((s) => ({ s, out: state.subtasks[s.id]?.output }))
    .filter((x): x is { s: typeof x.s; out: string } => Boolean(x.out));
  if (completed.length === 0) return '';
  if (completed.length === 1) return completed[0].out;
  return completed.map(({ s, out }) => `## ${s.title}\n\n${out}`).join('\n\n');
}

async function mergeSynthesize(
  plan: PlannerOutput,
  state: TaskState,
  deps: { jwt: string; signal?: AbortSignal },
): Promise<string> {
  const concat = mergeConcat(plan, state);
  const messages = [
    {
      role: 'system',
      content:
        'You synthesize partial outputs from a multi-step workflow into one cohesive answer. Be faithful to the source: do not invent facts. Match the user goal in tone and length.',
    },
    {
      role: 'user',
      content: `# GOAL\n${plan.goal}\n\n# PARTIAL OUTPUTS\n${concat}\n\nProduce the final consolidated answer.`,
    },
  ];

  // Free Llama 3.1 8B via the inbuilt server. Synthesis is a low-skill
  // task (combining already-written drafts) so 8B is plenty.
  try {
    const res = await tauriFetch(SERVER_OPENAI_COMPAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deps.jwt}`,
      },
      body: JSON.stringify({
        model: SERVER_SYNTH_MODEL,
        messages,
      }),
      signal: deps.signal,
    });
    if (!res.ok) return concat;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content || concat;
  } catch {
    // Never block the run on a synth failure — concat is a valid answer.
    return concat;
  }
}
