// Routing telemetry — logs every dispatch decision with predicted route,
// confidence, fallback usage, and outcome signal. Feeds the Phase 2
// retraining loop in `ml/retrain_from_telemetry.py`.
//
// All data stays local. Users export the table to JSONL on demand and
// run the retrain script offline; nothing ships to a server unless the
// user explicitly chooses to.

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RouteTelemetry {
    pub id: String,
    pub prompt: String,
    pub word_count: Option<i64>,
    pub predicted_route: String,
    pub confidence: f64,
    pub fallback_used: i64,
    pub fallback_route: Option<String>,
    pub actual_route: Option<String>,
    pub completed: Option<i64>,
    pub reprompt_within: Option<i64>,
    pub user_signal: Option<String>,
    pub created_at: i64,
    pub settled_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogRouteInput {
    pub prompt: String,
    pub word_count: Option<i64>,
    pub predicted_route: String,
    pub confidence: f64,
    pub fallback_used: Option<bool>,
    pub fallback_route: Option<String>,
    pub actual_route: Option<String>,
}

#[tauri::command]
pub async fn telemetry_log_route(
    app_handle: AppHandle,
    input: LogRouteInput,
) -> Result<String, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let ts = now();
    let id = format!("rt_{}_{}", ts, uuid::Uuid::new_v4().simple());
    conn.execute(
        "INSERT INTO route_telemetry (
            id, prompt, word_count, predicted_route, confidence,
            fallback_used, fallback_route, actual_route, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            &id,
            &input.prompt,
            input.word_count,
            &input.predicted_route,
            input.confidence,
            if input.fallback_used.unwrap_or(false) { 1i64 } else { 0i64 },
            &input.fallback_route,
            &input.actual_route,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SettleRouteInput {
    pub id: String,
    /// 1 = success, -1 = failed/cancelled, null = leave unchanged.
    pub completed: Option<i64>,
    pub reprompt_within: Option<i64>,
    pub user_signal: Option<String>,
    pub actual_route: Option<String>,
}

#[tauri::command]
pub async fn telemetry_settle_route(
    app_handle: AppHandle,
    input: SettleRouteInput,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let ts = now();
    conn.execute(
        "UPDATE route_telemetry SET
            completed       = COALESCE(?1, completed),
            reprompt_within = COALESCE(?2, reprompt_within),
            user_signal     = COALESCE(?3, user_signal),
            actual_route    = COALESCE(?4, actual_route),
            settled_at      = ?5
         WHERE id = ?6",
        params![
            input.completed,
            input.reprompt_within,
            &input.user_signal,
            &input.actual_route,
            ts,
            &input.id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportRouteInput {
    pub since: Option<i64>,
    pub limit: Option<i64>,
    pub only_signaled: Option<bool>,
}

#[tauri::command]
pub async fn telemetry_export_route(
    app_handle: AppHandle,
    input: ExportRouteInput,
) -> Result<Vec<RouteTelemetry>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let since = input.since.unwrap_or(0);
    let limit = input.limit.unwrap_or(10_000);
    let only_signaled = input.only_signaled.unwrap_or(false);

    let sql = if only_signaled {
        // Most useful slice for retraining: rows with strong outcome signal.
        // Thumbs-up/down OR reprompt-within-30s OR explicit failure.
        "SELECT id, prompt, word_count, predicted_route, confidence,
                fallback_used, fallback_route, actual_route,
                completed, reprompt_within, user_signal,
                created_at, settled_at
         FROM route_telemetry
         WHERE created_at >= ?1
           AND (user_signal IS NOT NULL OR reprompt_within < 30 OR completed = -1)
         ORDER BY created_at DESC
         LIMIT ?2"
    } else {
        "SELECT id, prompt, word_count, predicted_route, confidence,
                fallback_used, fallback_route, actual_route,
                completed, reprompt_within, user_signal,
                created_at, settled_at
         FROM route_telemetry
         WHERE created_at >= ?1
         ORDER BY created_at DESC
         LIMIT ?2"
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![since, limit], |r| {
            Ok(RouteTelemetry {
                id: r.get(0)?,
                prompt: r.get(1)?,
                word_count: r.get(2)?,
                predicted_route: r.get(3)?,
                confidence: r.get(4)?,
                fallback_used: r.get(5)?,
                fallback_route: r.get(6)?,
                actual_route: r.get(7)?,
                completed: r.get(8)?,
                reprompt_within: r.get(9)?,
                user_signal: r.get(10)?,
                created_at: r.get(11)?,
                settled_at: r.get(12)?,
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
pub async fn telemetry_get_route(
    app_handle: AppHandle,
    id: String,
) -> Result<Option<RouteTelemetry>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let row = conn
        .query_row(
            "SELECT id, prompt, word_count, predicted_route, confidence,
                    fallback_used, fallback_route, actual_route,
                    completed, reprompt_within, user_signal,
                    created_at, settled_at
             FROM route_telemetry WHERE id = ?1",
            params![&id],
            |r| {
                Ok(RouteTelemetry {
                    id: r.get(0)?,
                    prompt: r.get(1)?,
                    word_count: r.get(2)?,
                    predicted_route: r.get(3)?,
                    confidence: r.get(4)?,
                    fallback_used: r.get(5)?,
                    fallback_route: r.get(6)?,
                    actual_route: r.get(7)?,
                    completed: r.get(8)?,
                    reprompt_within: r.get(9)?,
                    user_signal: r.get(10)?,
                    created_at: r.get(11)?,
                    settled_at: r.get(12)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub async fn telemetry_clear_route(app_handle: AppHandle) -> Result<usize, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let n = conn
        .execute("DELETE FROM route_telemetry", [])
        .map_err(|e| e.to_string())?;
    Ok(n)
}
