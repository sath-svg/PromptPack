# Skillset desktop — implementation status

Living checklist of what's shipped vs pending against the multi-model
workflow plan in `~/.claude/plans/implementation-plan-multi-model-clever-toucan.md`.
Update at the end of each work session so the next one resumes without
re-deriving state.

Last updated: 2026-05-09 (session 2 — Phases 5/6/8 landed)

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
| 5 | **Per-run credit preflight + Top up & resume UX** | Worker `POST /api/llm/run/reserve` checks total balance vs envelope estimate; orchestrator hits it once at run start. Mid-run 402s now surface `__OUT_OF_CREDITS__` instead of generic error → SkillChat renders a "Top up · Resume" card with `chatStore.resumeOrchestratorRun()` action. Executor short-circuits subtasks already marked `done` so resume only re-runs pending/failed work. Per-call holds unchanged (no schema migration). |
| 6 | **Confidence + 2-axis escalation** | New `lib/orchestrator/confidence.ts` heuristic (empty / refusal / truncation / produces=json parse / produces=file path / length-vs-instruction). Score < 0.55 triggers one retry: bump `effort` first (`null → medium`), then tier (`fast → balanced → powerful`). `executor.ts` rewires the per-subtask try/catch to loop until confidence passes or `nextEscalation` returns null. Run Trace shows `↻ N` retry badge + confidence percentage chip; chatStore `onSubtaskRetry` flips chip to bumped (tier, effort) live. |
| 8 | **Web tools — `web_fetch`, `http`, `attachment_read`** | Rust `agent_web_fetch` + `agent_http` (reqwest, redirect-follow up to 10, 5 MB body cap, 60s timeout, http(s) only). `attachment_read` reuses `agent_read` against the user's attachment list with a guard. Tool schemas in `agentTools.ts`, dispatch cases, ToolBlock icons (Globe / Network / Paperclip), planner allowlist re-extended. |
| extra | Token spend visibility | Worker emits `X-Tokens-Input` / `-Output` / `-Reasoning` / `-Total` headers on every settled managed-proxy call. `creditSync.syncCreditsFromHeaders` rolls them into `settingsStore.tokenUsage` (input / output / reasoning / total / calls). Settings page renders a "Tokens this session" card with reset, only shown after the first managed call. Resets on logout. |
| 10 | **Phase 10 (partial) — `pdf_generate` tool** | Rust `agent_pdf_generate` via `printpdf` crate (pure Rust, no Chrome). Basic A4 portrait, Helvetica, `#` / `##` markdown headings, blank-line paragraph breaks, simple word-wrap. Returns `{path, bytes, pages}`. Skips DiffPanel review (binary content). Tool schema + dispatch case + planner allowlist + `FileType` icon shipped. `send_email` and cron scheduler still deferred. |
| extra | Context-aware LLM router fallback | `routeFallback.llmRouteFallback` now accepts `history: HistoryTurn[]` and feeds the last 4 conversation turns to the Llama tiebreaker so it can resolve references like "do that for X too". Threshold raised 0.6 → 0.75 so borderline-confident `workflow` predictions (most expensive on misroute) get the second-opinion check. Cache keyed on (history, prompt) pair. |
| extra | `detectWriteFileIntent` broadened | Added a Pass-2 implicit-intent regex set (no filename required): "put it in workspace", "create a file", "write a PDF", "export as markdown", etc. Returns `__implicit__` sentinel so the agent path engages even when the user doesn't supply a filename. Forces tool route on workspace-connected sessions regardless of agent-mode toggle. |

---

## Pending — plan phases

### Phase 5 — full per-run hold (deferred)
Preflight + resume UX shipped. Still on the wishlist:
- True per-run hold (one envelope, per-call settles draw down) — needs Convex `creditTransactions.runId` index + run-scoped `reserveCredits` variant.
- Settle path that prefers the run-hold over creating a fresh per-call hold (avoids the 8-subtask = 8-holds situation we have today).

Why we stopped: requires a Convex schema migration and a settle-path rewrite. Preflight + resume already deliver the user-facing promise ("don't blow up mid-run; let me top up and continue"). Real envelope-style reserve is a v2.

### Phase 6 — self-rating call (deferred)
Heuristic + 2-axis escalation shipped. Plan also calls for an optional fast-tier self-rating ("rate 0–1 how complete this answer is given the instruction") — skipped for now to keep the per-subtask cost flat. Heuristic is high-precision enough that the false-negative bias is acceptable. Revisit if confusion-matrix telemetry shows real product issues.

### Phase 8 — extras (deferred)
Web tools shipped. Plan also lists:
- `pdf_generate(html, path)` — staged like write_file, Rust `printpdf` or chrome-headless.
- `send_email(to, subject, body)` — Resend HTTP API.
- Cron scheduler for skill runs.

These are Phase 10 in the original plan and stay there.

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
