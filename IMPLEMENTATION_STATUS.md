# Skillset desktop — implementation status

Living checklist of what's shipped vs pending against the multi-model
workflow plan in `~/.claude/plans/implementation-plan-multi-model-clever-toucan.md`.
Update at the end of each work session so the next one resumes without
re-deriving state.

Last updated: 2026-05-09

---

## Done

| Phase | What | Commit/notes |
|---|---|---|
| 1a | LR retraining w/ tier+effort+route heads | `ml/` artifacts, weights bundled |
| 1b | LR baked into desktop app, reasoning param translation | `app/src/lib/classifier*`, `reasoningParams.ts` |
| 2 | SQLite tables (`skills`/`runs`/`subtasks`/`task_memory`) + Tauri commands | `app/src-tauri/src/db.rs`, `commands.rs` |
| 3 | Orchestrator skeleton + planner JSON-mode + repair retry | `app/src/lib/orchestrator/{orchestrator,planner}.ts` |
| 4 | DAG-parallel executor (replaced original sequential plan) | `app/src/lib/orchestrator/executor.ts` |
| 7 | Run Trace UI + dev-mode toggle (friendly/technical) | `app/src/components/SkillChat/RunTrace/`, `settingsStore.developerMode` |
| extra | Token-based credit estimation per call | `api/src/managed-models.ts:estimateCreditsForCall` |
| extra | Pack runs through orchestrator (predefinedPlan) | chatStore `runPack` action |
| extra | Pack managed-proxy redirect (no Llama 8B for packs) | `agentSubtask.urlOverride` + chatStore wiring |
| extra | Real-time credit sync (`X-Credits-*` headers everywhere) | `app/src/lib/creditSync.ts` |
| extra | HS256 desktop access token + 7d refresh flow | Convex `web/convex/jwt.ts`, worker dual-path verify, `authStore.getValidAccessToken` |
| extra | `skillset.md` workspace file injects into pack TaskState | `runPack` reads via `agent_read`, seeds `summaries.rolling` |
| extra | OS notification on pending edit | `agentStore.notifyPendingEdit` (12cb2fc) |
| extra | Reqwest timeout 180s → 600s for slow reasoning rounds | `app/src-tauri/src/lib.rs` (8533b3e) |
| extra | Skipped-subtask render in Run Trace | chatStore `onSubtaskFailed` upsert (1f25577) |
| extra | Credit-rate model labels (`1 cr/K in · 3 cr/K out`) | `formatCreditRate` in `managed-models.ts` (12cb2fc) |
| extra | OS notification on pending edit (background popup) | `agentStore.notifyPendingEdit` (12cb2fc) |
| extra | Pack-tagged free-text auto-route + var extraction | `lib/packExtractor.ts` + SkillChat `handleSend` reroute. User types "do this for NVDA and 6 months" with pack tag → free Llama 8B extracts vars + extras → runs pack with both. Extras layer alongside `skillset.md` under unified "User instructions" block. |

---

## Pending — plan phases

### Phase 5 — Per-run credit reserve (partial)
Today every subtask creates its own per-call hold. Pack with 8 subtasks = 8 separate holds.
Missing:
- `POST /api/llm/run/reserve` worker endpoint that holds a single per-run estimate.
- Orchestrator passes `runId` per subtask call so settles draw down the run's hold.
- 402 → "Top up & resume" UX (toast + button that mints a fresh reserve).
- `creditTransactions.runId` index in Convex (schema field exists, no index).

Files: `api/src/credits.ts`, `api/src/llm.ts`, `web/convex/schema.ts`, `chatStore.runOrchestratorMessage`.

### Phase 6 — Confidence + 2-axis escalation (partial)
Tool subtasks ship. Missing:
- `app/src/lib/orchestrator/confidence.ts` — heuristic on `finish_reason`, output length vs `produces`, JSON validity if `produces=json`.
- Self-rating fast-tier call ("rate 0–1 how complete this answer is").
- Escalation: if `confidence < 0.55` and `effort === null` → retry same preset with `effort='medium'`. Still low → tier up at `effort='medium'`.
- Wire `subtasks.retries` increment into executor.

Files: new `confidence.ts`, `executor.ts` retry loop, `chatStore` onSubtaskDone.

### Phase 8 — Web tools (NOT shipped)
Unblocks real research packs (Stock Analyzer 3rd step currently fails because no way to fetch live data).
Missing:
- `agent_web_fetch` Rust handler — reqwest, 5MB cap, redirect-follow, charset detect.
- `http(method, url, headers, body)` generic tool, same Rust handler.
- `attachment_read(filename)` — expose `useAgentStore.attachments` as a tool.
- Tool schemas in `app/src/lib/agentTools.ts`.
- Icons in `ToolBlock.tsx`.

Files: `app/src-tauri/src/agent.rs`, `lib.rs`, `agentTools.ts`, `ToolBlock.tsx`.

### Phase 9 — Skill library (partial)
Pack→orchestrator path works. Missing:
- `skills` SQLite table (already in plan SQL but not deployed via `db.rs`).
- "Run as Skill" button in `PromptChat/index.tsx`.
- Skill editor: planner model dropdown, allowed tools multi-select, max subtasks, seed steps.
- Convex `skills` table for sync.
- `workflow.json` in `.skill` export.
- Frozen plan JSON support — orchestrator already supports `predefinedPlan`, just need persisted skills.

Files: `db.rs`, `commands.rs`, new `SkillEditor.tsx`, `web/convex/schema.ts`, `api/src/workflowExporter.ts`.

### Phase 10 — PDF, email, scheduling (NOT shipped)
Plan calls these "Later". Now relevant because Stock Analyzer asks for PDF.
Missing:
- `pdf_generate(html, path)` — Rust `printpdf` crate or chrome-headless print-to-pdf. Staged like `write_file`.
- `send_email(to, subject, body)` — Resend HTTP API via `tauriFetch`.
- Cron scheduler hook for skill runs.
- (Sibling parallelism already shipped via Promise-based DAG.)

Files: `app/src-tauri/src/agent.rs`, new `pdf.rs` Rust module, `agentTools.ts`.

---

## Pending — off-plan drift from this session

| Item | Status | What's missing |
|---|---|---|
| `tauriFetch` 401 retry wrapper | not shipped | Wrapper that catches 401 → `getValidAccessToken` refresh → retries once. Removes per-site `await getValidAccessToken()` boilerplate. |
| `MAX_TOOL_ROUNDS` per-model cap | not shipped | Currently 8 globally in `agentSubtask.ts`. GPT-5/Opus high-effort × 8 = 16min wall-time per subtask. Lower to 5 for managed-proxy redirect path. |
| Worker-side abort on client disconnect | not shipped | When user clicks Cancel mid-run, worker still completes the in-flight OpenRouter fetch + burns credits. Add `AbortController` wired to the inbound request signal. |
| Bigger-pack instruction guardrails | open | Stock Analyzer pack step 3 demands capabilities (web_fetch, PDF gen) that don't exist → model writes stub + asks questions. Either gate packs to declared tool surface or ship Phase 8/10. |

---

## Priority order (my recommendation)

1. **Phase 8 — web_fetch + http + attachment_read.** Highest user value per LOC. Unblocks every "fetch X then summarize" pack. ~150 LOC.
2. **Phase 6 — confidence/escalation.** Protects against silent stub-output regressions. Self-rating call cheap (~$0.0001/subtask).
3. **`tauriFetch` 401 retry wrapper.** Plumbing cleanup; removes the per-call `getValidAccessToken` boilerplate that's already growing.
4. **Phase 5 — per-run reserve.** Credit ergonomics + clean 402 mid-run flow.
5. **Phase 9 — skill library.** Largest scope; needs editor UI.
6. **Phase 10 — PDF/email/cron.** Nice-to-have, lean on Phase 8 first.

---

## Deploy gotchas (for future sessions)

- Convex code AND env must both be deployed before refresh flow works:
  - `cd web && npx convex deploy`  (pushes new `httpExtension.ts` + `jwt.ts`)
  - `cd web && npx convex env set JWT_SECRET <hex>`
- Worker must hold the SAME `JWT_SECRET`:
  - `cd api && npx wrangler secret put JWT_SECRET`
  - `cd api && npx wrangler deploy`
- Rust changes (`lib.rs` timeout, new tools) need full Tauri rebuild — `npm run tauri dev` or `npm run tauri build`. Hot reload only catches JS.
- Sign out + sign in after auth-related deploys — old session in localStorage doesn't have `refresh_token`.
