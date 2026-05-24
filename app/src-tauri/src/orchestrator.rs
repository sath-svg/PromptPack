// Tauri commands for the Skill Chat orchestrator persistence layer.
//
// Tables created in db.rs:
//   - skills          (workflow definitions, may sync to Convex via cloud_id)
//   - runs            (one execution of a skill or ad-hoc goal)
//   - subtasks        (planner-emitted units of work, FK to runs)
//   - task_memory     (canonical TaskState JSON, 1-to-1 with runs)
//
// All persistence is local-first; only `skills` rows sync to Convex when the
// user explicitly saves. Runs and subtasks stay on the device.

use crate::db;
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

fn now() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

// ─── Skills ────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Skill {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub goal_template: Option<String>,
    pub planner_model_id: Option<String>,
    /// JSON: { maxSubtasks, allowedTools[], defaultTier, seedSteps?[] }
    pub planner_hints: Option<String>,
    pub source_pack_id: Option<String>,
    pub workflow_json: Option<String>,
    pub cloud_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpsertSkillInput {
    pub id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub goal_template: Option<String>,
    pub planner_model_id: Option<String>,
    pub planner_hints: Option<String>,
    pub source_pack_id: Option<String>,
    pub workflow_json: Option<String>,
    pub cloud_id: Option<String>,
}

#[tauri::command]
pub async fn skill_upsert(
    app_handle: AppHandle,
    input: UpsertSkillInput,
) -> Result<Skill, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let ts = now();
    let id = input.id.unwrap_or_else(|| format!("sk_{}_{}", ts, uuid::Uuid::new_v4().simple()));

    let existing: Option<i64> = conn
        .query_row(
            "SELECT created_at FROM skills WHERE id = ?1",
            params![&id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let created_at = existing.unwrap_or(ts);

    conn.execute(
        "INSERT INTO skills (
            id, title, description, goal_template, planner_model_id,
            planner_hints, source_pack_id, workflow_json, cloud_id,
            created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
         ON CONFLICT(id) DO UPDATE SET
            title            = excluded.title,
            description      = excluded.description,
            goal_template    = excluded.goal_template,
            planner_model_id = excluded.planner_model_id,
            planner_hints    = excluded.planner_hints,
            source_pack_id   = excluded.source_pack_id,
            workflow_json    = excluded.workflow_json,
            cloud_id         = excluded.cloud_id,
            updated_at       = excluded.updated_at",
        params![
            &id,
            &input.title,
            &input.description,
            &input.goal_template,
            &input.planner_model_id,
            &input.planner_hints,
            &input.source_pack_id,
            &input.workflow_json,
            &input.cloud_id,
            created_at,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Skill {
        id,
        title: input.title,
        description: input.description,
        goal_template: input.goal_template,
        planner_model_id: input.planner_model_id,
        planner_hints: input.planner_hints,
        source_pack_id: input.source_pack_id,
        workflow_json: input.workflow_json,
        cloud_id: input.cloud_id,
        created_at,
        updated_at: ts,
    })
}

#[tauri::command]
pub async fn skill_list(app_handle: AppHandle) -> Result<Vec<Skill>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, description, goal_template, planner_model_id,
                    planner_hints, source_pack_id, workflow_json, cloud_id,
                    created_at, updated_at
             FROM skills
             ORDER BY updated_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(Skill {
                id: r.get(0)?,
                title: r.get(1)?,
                description: r.get(2)?,
                goal_template: r.get(3)?,
                planner_model_id: r.get(4)?,
                planner_hints: r.get(5)?,
                source_pack_id: r.get(6)?,
                workflow_json: r.get(7)?,
                cloud_id: r.get(8)?,
                created_at: r.get(9)?,
                updated_at: r.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub async fn skill_delete(app_handle: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skills WHERE id = ?1", params![&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Runs ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Run {
    pub id: String,
    pub skill_id: Option<String>,
    pub workspace: Option<String>,
    pub goal: String,
    pub status: String,
    pub total_credits: i64,
    pub reserve_id: Option<String>,
    pub error: Option<String>,
    pub created_at: i64,
    pub ended_at: Option<i64>,
    /// FK to conversations.id (SET NULL via app layer on conversation_delete).
    /// Required to route runStore updates to the correct conversation slice
    /// when multiple chats run in parallel. Optional for backwards-compat
    /// with rows written before the migration.
    pub conversation_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRunInput {
    pub skill_id: Option<String>,
    pub workspace: Option<String>,
    pub goal: String,
    pub conversation_id: Option<String>,
}

#[tauri::command]
pub async fn run_create(app_handle: AppHandle, input: CreateRunInput) -> Result<Run, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let ts = now();
    let id = format!("run_{}_{}", ts, uuid::Uuid::new_v4().simple());

    conn.execute(
        "INSERT INTO runs (id, skill_id, workspace, goal, status, total_credits, created_at, conversation_id)
         VALUES (?1, ?2, ?3, ?4, 'queued', 0, ?5, ?6)",
        params![&id, &input.skill_id, &input.workspace, &input.goal, ts, &input.conversation_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(Run {
        id,
        skill_id: input.skill_id,
        workspace: input.workspace,
        goal: input.goal,
        status: "queued".to_string(),
        total_credits: 0,
        reserve_id: None,
        error: None,
        created_at: ts,
        ended_at: None,
        conversation_id: input.conversation_id,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateRunInput {
    pub id: String,
    pub status: Option<String>,
    pub total_credits: Option<i64>,
    pub reserve_id: Option<String>,
    pub error: Option<String>,
    pub ended_at: Option<i64>,
}

#[tauri::command]
pub async fn run_update(app_handle: AppHandle, input: UpdateRunInput) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    // COALESCE keeps the existing value when the caller passes None, so the
    // command can patch a single field without round-tripping the whole row.
    conn.execute(
        "UPDATE runs SET
            status        = COALESCE(?1, status),
            total_credits = COALESCE(?2, total_credits),
            reserve_id    = COALESCE(?3, reserve_id),
            error         = COALESCE(?4, error),
            ended_at      = COALESCE(?5, ended_at)
         WHERE id = ?6",
        params![
            &input.status,
            &input.total_credits,
            &input.reserve_id,
            &input.error,
            &input.ended_at,
            &input.id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn run_get(app_handle: AppHandle, id: String) -> Result<Option<Run>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let row = conn
        .query_row(
            "SELECT id, skill_id, workspace, goal, status, total_credits,
                    reserve_id, error, created_at, ended_at, conversation_id
             FROM runs WHERE id = ?1",
            params![&id],
            |r| {
                Ok(Run {
                    id: r.get(0)?,
                    skill_id: r.get(1)?,
                    workspace: r.get(2)?,
                    goal: r.get(3)?,
                    status: r.get(4)?,
                    total_credits: r.get(5)?,
                    reserve_id: r.get(6)?,
                    error: r.get(7)?,
                    created_at: r.get(8)?,
                    ended_at: r.get(9)?,
                    conversation_id: r.get(10)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub async fn run_cancel(app_handle: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let ts = now();
    conn.execute(
        "UPDATE runs SET status = 'cancelled', ended_at = ?1
         WHERE id = ?2 AND status NOT IN ('done','failed','cancelled')",
        params![ts, &id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE subtasks SET status = 'failed', ended_at = ?1
         WHERE run_id = ?2 AND status NOT IN ('done','failed')",
        params![ts, &id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Subtasks ──────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subtask {
    pub id: String,
    pub run_id: String,
    pub parent_id: Option<String>,
    pub ord: i64,
    pub title: Option<String>,
    pub instruction: String,
    pub complexity_hint: Option<String>,
    pub reasoning_hint: Option<String>,
    pub needs_tools: Option<String>,
    pub depends_on: Option<String>,
    pub status: String,
    pub preset_json: Option<String>,
    pub effort: Option<String>,
    pub output: Option<String>,
    pub confidence: Option<f64>,
    pub credits: Option<i64>,
    pub reasoning_tokens: Option<i64>,
    pub retries: i64,
    pub error: Option<String>,
    pub started_at: Option<i64>,
    pub ended_at: Option<i64>,
}

#[tauri::command]
pub async fn subtask_upsert(app_handle: AppHandle, subtask: Subtask) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO subtasks (
            id, run_id, parent_id, ord, title, instruction,
            complexity_hint, reasoning_hint, needs_tools, depends_on,
            status, preset_json, effort, output, confidence, credits,
            reasoning_tokens, retries, error, started_at, ended_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                   ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)
         ON CONFLICT(id) DO UPDATE SET
            title            = excluded.title,
            instruction      = excluded.instruction,
            complexity_hint  = excluded.complexity_hint,
            reasoning_hint   = excluded.reasoning_hint,
            needs_tools      = excluded.needs_tools,
            depends_on       = excluded.depends_on,
            status           = excluded.status,
            preset_json      = excluded.preset_json,
            effort           = excluded.effort,
            output           = excluded.output,
            confidence       = excluded.confidence,
            credits          = excluded.credits,
            reasoning_tokens = excluded.reasoning_tokens,
            retries          = excluded.retries,
            error            = excluded.error,
            started_at       = excluded.started_at,
            ended_at         = excluded.ended_at",
        params![
            &subtask.id,
            &subtask.run_id,
            &subtask.parent_id,
            subtask.ord,
            &subtask.title,
            &subtask.instruction,
            &subtask.complexity_hint,
            &subtask.reasoning_hint,
            &subtask.needs_tools,
            &subtask.depends_on,
            &subtask.status,
            &subtask.preset_json,
            &subtask.effort,
            &subtask.output,
            &subtask.confidence,
            &subtask.credits,
            &subtask.reasoning_tokens,
            subtask.retries,
            &subtask.error,
            &subtask.started_at,
            &subtask.ended_at,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn subtask_list(app_handle: AppHandle, run_id: String) -> Result<Vec<Subtask>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, run_id, parent_id, ord, title, instruction,
                    complexity_hint, reasoning_hint, needs_tools, depends_on,
                    status, preset_json, effort, output, confidence, credits,
                    reasoning_tokens, retries, error, started_at, ended_at
             FROM subtasks WHERE run_id = ?1 ORDER BY ord ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![&run_id], |r| {
            Ok(Subtask {
                id: r.get(0)?,
                run_id: r.get(1)?,
                parent_id: r.get(2)?,
                ord: r.get(3)?,
                title: r.get(4)?,
                instruction: r.get(5)?,
                complexity_hint: r.get(6)?,
                reasoning_hint: r.get(7)?,
                needs_tools: r.get(8)?,
                depends_on: r.get(9)?,
                status: r.get(10)?,
                preset_json: r.get(11)?,
                effort: r.get(12)?,
                output: r.get(13)?,
                confidence: r.get(14)?,
                credits: r.get(15)?,
                reasoning_tokens: r.get(16)?,
                retries: r.get(17)?,
                error: r.get(18)?,
                started_at: r.get(19)?,
                ended_at: r.get(20)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

// ─── Task memory (canonical TaskState JSON) ────────────────────────────────

#[tauri::command]
pub async fn task_memory_get(
    app_handle: AppHandle,
    run_id: String,
) -> Result<Option<String>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let row: Option<String> = conn
        .query_row(
            "SELECT state_json FROM task_memory WHERE run_id = ?1",
            params![&run_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub async fn task_memory_set(
    app_handle: AppHandle,
    run_id: String,
    state_json: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let ts = now();
    conn.execute(
        "INSERT INTO task_memory (run_id, state_json, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(run_id) DO UPDATE SET
            state_json = excluded.state_json,
            updated_at = excluded.updated_at",
        params![&run_id, &state_json, ts],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
