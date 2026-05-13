/**
 * Shared types for the Skill Chat orchestrator. Mirrors:
 *   - Rust structs in app/src-tauri/src/orchestrator.rs (snake_case → camelCase
 *     handled by serde + tauri-invoke).
 *   - Convex skills schema (web/convex/schema.ts), once Phase 9 lands.
 */

import type { EffortLevel, ModelPreset, ModelTier } from '../classifier';

// ─── Persistence shapes (1-to-1 with SQLite rows) ──────────────────────────

export interface Skill {
  id: string;
  title: string;
  description?: string | null;
  goalTemplate?: string | null;
  plannerModelId?: string | null;
  /** JSON string per the Rust contract; parsed via {@link parsePlannerHints}. */
  plannerHints?: string | null;
  sourcePackId?: string | null;
  workflowJson?: string | null;
  cloudId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PlannerHints {
  maxSubtasks?: number;
  allowedTools?: string[];
  defaultTier?: ModelTier;
  /** Optional pre-authored seed steps; planner uses as hints, not a script. */
  seedSteps?: string[];
}

export type RunStatus =
  | 'queued'
  | 'planning'
  | 'running'
  | 'merging'
  | 'done'
  | 'failed'
  | 'cancelled';

export interface Run {
  id: string;
  skillId?: string | null;
  workspace?: string | null;
  goal: string;
  status: RunStatus;
  totalCredits: number;
  reserveId?: string | null;
  error?: string | null;
  createdAt: number;
  endedAt?: number | null;
}

export type SubtaskStatus =
  | 'pending'
  | 'routing'
  | 'running'
  | 'done'
  | 'retry'
  | 'escalated'
  | 'failed';

export interface Subtask {
  id: string;
  runId: string;
  parentId?: string | null;
  ord: number;
  title?: string | null;
  instruction: string;
  complexityHint?: 'easy' | 'moderate' | 'complex' | null;
  reasoningHint?: 'none' | 'light' | 'deep' | null;
  /** JSON string of `string[]` (tool names from agentTools.ts). */
  needsTools?: string | null;
  /** JSON string of `string[]` (subtask ids). */
  dependsOn?: string | null;
  status: SubtaskStatus;
  /** JSON-serialized {@link ModelPreset}. */
  presetJson?: string | null;
  effort?: EffortLevel | null;
  output?: string | null;
  confidence?: number | null;
  credits?: number | null;
  reasoningTokens?: number | null;
  retries: number;
  error?: string | null;
  startedAt?: number | null;
  endedAt?: number | null;
}

// ─── Planner output (LLM JSON) ─────────────────────────────────────────────

export interface PlannerSubtask {
  id: string;
  title: string;
  instruction: string;
  complexity_hint: 'easy' | 'moderate' | 'complex';
  reasoning_hint?: 'none' | 'light' | 'deep';
  needs_tools: string[];
  depends_on: string[];
  produces: 'text' | 'file' | 'json' | 'none';
}

export interface PlannerOutput {
  goal: string;
  subtasks: PlannerSubtask[];
  merge: 'concat' | 'synthesize' | 'first';
}

// ─── Canonical TaskState (in-memory + persisted to task_memory.state_json) ─

export interface SubtaskState {
  status: SubtaskStatus;
  instruction: string;
  output?: string;
  confidence?: number;
  modelId?: string;
  effort?: EffortLevel | null;
  reasoningTokens?: number;
  credits?: number;
}

export interface Fact {
  id: string;
  text: string;
  sourceSubtaskId: string;
}

export interface Artifact {
  kind: 'file' | 'url' | 'pdf';
  path: string;
  subtaskId: string;
}

export interface TaskState {
  goal: string;
  plan: PlannerOutput | null;
  subtasks: Record<string, SubtaskState>;
  summaries: { rolling: string; perSubtask: Record<string, string> };
  facts: Fact[];
  artifacts: Artifact[];
  open_questions: string[];
  /**
   * Verbatim contents of the workspace's `skillset.md` (when present)
   * captured at Set Run kickoff. Plumbed through the executor into every
   * subtask's *system prompt* as a "# Project Skill (MUST FOLLOW)" block,
   * giving the rules directive weight that the rolling summary's
   * "# CONTEXT SO FAR" framing can't carry — especially for cheap-tier
   * models. Persisted alongside the rest of TaskState; older blobs
   * deserialize with the field undefined.
   */
  projectInstructions?: string;
}

export function emptyTaskState(goal: string): TaskState {
  return {
    goal,
    plan: null,
    subtasks: {},
    summaries: { rolling: '', perSubtask: {} },
    facts: [],
    artifacts: [],
    open_questions: [],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

export function parsePlannerHints(s: string | null | undefined): PlannerHints {
  if (!s) return {};
  try {
    return JSON.parse(s) as PlannerHints;
  } catch {
    return {};
  }
}

export function parseStringArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function parsePreset(s: string | null | undefined): ModelPreset | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as ModelPreset;
  } catch {
    return null;
  }
}
