/**
 * Thin Tauri-command wrappers for the orchestrator persistence layer
 * (`app/src-tauri/src/orchestrator.rs`). Responsibility:
 *   1. Bridge JS camelCase ↔ Rust snake_case via the field aliases below.
 *   2. Type-narrow Tauri's untyped `invoke` results to the shared interfaces
 *      in `types.ts`.
 *
 * Tauri serde renames serialize_all = "snake_case" by default for derive
 * Serialize, so the Rust struct fields arrive in JS as snake_case. We
 * normalize to camelCase here so the rest of the app speaks one dialect.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Run,
  Skill,
  Subtask,
  SubtaskStatus,
  RunStatus,
} from './types';

// ─── Skill ─────────────────────────────────────────────────────────────────

interface RustSkill {
  id: string;
  title: string;
  description: string | null;
  goal_template: string | null;
  planner_model_id: string | null;
  planner_hints: string | null;
  source_pack_id: string | null;
  workflow_json: string | null;
  cloud_id: string | null;
  created_at: number;
  updated_at: number;
}

function fromRustSkill(s: RustSkill): Skill {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    goalTemplate: s.goal_template,
    plannerModelId: s.planner_model_id,
    plannerHints: s.planner_hints,
    sourcePackId: s.source_pack_id,
    workflowJson: s.workflow_json,
    cloudId: s.cloud_id,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

export interface UpsertSkillInput {
  id?: string;
  title: string;
  description?: string;
  goalTemplate?: string;
  plannerModelId?: string;
  /** Already-stringified JSON. Use `JSON.stringify(plannerHints)` when calling. */
  plannerHints?: string;
  sourcePackId?: string;
  workflowJson?: string;
  cloudId?: string;
}

export async function skillUpsert(input: UpsertSkillInput): Promise<Skill> {
  const rust = await invoke<RustSkill>('skill_upsert', {
    input: {
      id: input.id,
      title: input.title,
      description: input.description ?? null,
      goal_template: input.goalTemplate ?? null,
      planner_model_id: input.plannerModelId ?? null,
      planner_hints: input.plannerHints ?? null,
      source_pack_id: input.sourcePackId ?? null,
      workflow_json: input.workflowJson ?? null,
      cloud_id: input.cloudId ?? null,
    },
  });
  return fromRustSkill(rust);
}

export async function skillList(): Promise<Skill[]> {
  const rows = await invoke<RustSkill[]>('skill_list');
  return rows.map(fromRustSkill);
}

export async function skillDelete(id: string): Promise<void> {
  await invoke('skill_delete', { id });
}

// ─── Run ───────────────────────────────────────────────────────────────────

interface RustRun {
  id: string;
  skill_id: string | null;
  workspace: string | null;
  goal: string;
  status: RunStatus;
  total_credits: number;
  reserve_id: string | null;
  error: string | null;
  created_at: number;
  ended_at: number | null;
}

function fromRustRun(r: RustRun): Run {
  return {
    id: r.id,
    skillId: r.skill_id,
    workspace: r.workspace,
    goal: r.goal,
    status: r.status,
    totalCredits: r.total_credits,
    reserveId: r.reserve_id,
    error: r.error,
    createdAt: r.created_at,
    endedAt: r.ended_at,
  };
}

export async function runCreate(input: {
  skillId?: string;
  workspace?: string;
  goal: string;
}): Promise<Run> {
  const rust = await invoke<RustRun>('run_create', {
    input: {
      skill_id: input.skillId ?? null,
      workspace: input.workspace ?? null,
      goal: input.goal,
    },
  });
  return fromRustRun(rust);
}

export async function runUpdate(input: {
  id: string;
  status?: RunStatus;
  totalCredits?: number;
  reserveId?: string;
  error?: string;
  endedAt?: number;
}): Promise<void> {
  await invoke('run_update', {
    input: {
      id: input.id,
      status: input.status ?? null,
      total_credits: input.totalCredits ?? null,
      reserve_id: input.reserveId ?? null,
      error: input.error ?? null,
      ended_at: input.endedAt ?? null,
    },
  });
}

export async function runGet(id: string): Promise<Run | null> {
  const rust = await invoke<RustRun | null>('run_get', { id });
  return rust ? fromRustRun(rust) : null;
}

export async function runCancel(id: string): Promise<void> {
  await invoke('run_cancel', { id });
}

// ─── Subtask ───────────────────────────────────────────────────────────────

interface RustSubtask {
  id: string;
  run_id: string;
  parent_id: string | null;
  ord: number;
  title: string | null;
  instruction: string;
  complexity_hint: 'easy' | 'moderate' | 'complex' | null;
  reasoning_hint: 'none' | 'light' | 'deep' | null;
  needs_tools: string | null;
  depends_on: string | null;
  status: SubtaskStatus;
  preset_json: string | null;
  effort: 'low' | 'medium' | 'high' | null;
  output: string | null;
  confidence: number | null;
  credits: number | null;
  reasoning_tokens: number | null;
  retries: number;
  error: string | null;
  started_at: number | null;
  ended_at: number | null;
}

function fromRustSubtask(s: RustSubtask): Subtask {
  return {
    id: s.id,
    runId: s.run_id,
    parentId: s.parent_id,
    ord: s.ord,
    title: s.title,
    instruction: s.instruction,
    complexityHint: s.complexity_hint,
    reasoningHint: s.reasoning_hint,
    needsTools: s.needs_tools,
    dependsOn: s.depends_on,
    status: s.status,
    presetJson: s.preset_json,
    effort: s.effort,
    output: s.output,
    confidence: s.confidence,
    credits: s.credits,
    reasoningTokens: s.reasoning_tokens,
    retries: s.retries,
    error: s.error,
    startedAt: s.started_at,
    endedAt: s.ended_at,
  };
}

function toRustSubtask(s: Subtask): RustSubtask {
  return {
    id: s.id,
    run_id: s.runId,
    parent_id: s.parentId ?? null,
    ord: s.ord,
    title: s.title ?? null,
    instruction: s.instruction,
    complexity_hint: s.complexityHint ?? null,
    reasoning_hint: s.reasoningHint ?? null,
    needs_tools: s.needsTools ?? null,
    depends_on: s.dependsOn ?? null,
    status: s.status,
    preset_json: s.presetJson ?? null,
    effort: s.effort ?? null,
    output: s.output ?? null,
    confidence: s.confidence ?? null,
    credits: s.credits ?? null,
    reasoning_tokens: s.reasoningTokens ?? null,
    retries: s.retries,
    error: s.error ?? null,
    started_at: s.startedAt ?? null,
    ended_at: s.endedAt ?? null,
  };
}

export async function subtaskUpsert(s: Subtask): Promise<void> {
  await invoke('subtask_upsert', { subtask: toRustSubtask(s) });
}

export async function subtaskList(runId: string): Promise<Subtask[]> {
  const rows = await invoke<RustSubtask[]>('subtask_list', { runId });
  return rows.map(fromRustSubtask);
}

// ─── Task memory (canonical TaskState JSON blob) ───────────────────────────

export async function taskMemoryGet(runId: string): Promise<string | null> {
  return invoke<string | null>('task_memory_get', { runId });
}

export async function taskMemorySet(runId: string, stateJson: string): Promise<void> {
  await invoke('task_memory_set', { runId, stateJson });
}
