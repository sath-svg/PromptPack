// Multi-conversation Skill Chat persistence.
//
// Tables (db.rs):
//   - conversations  (max 3 active, enforced server-side as defense in depth)
//   - chat_messages  (FK conversations, blocks_json carries MessageBlock[])
//
// Each conversation is an independent slice of chatStore/runStore/agentStore
// keyed by id on the frontend. Runs link back via runs.conversation_id (FK
// SET NULL — historical runs survive conversation deletion for telemetry).

use crate::db;
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

pub const MAX_CONVERSATIONS: i64 = 3;

fn now() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

// ─── Types ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub workspace: Option<String>,
    pub selected_pack_id: Option<String>,
    pub agent_mode: bool,
    pub auto_accept_edits: bool,
    pub last_active_at: i64,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateConversationInput {
    pub title: Option<String>,
    pub workspace: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpdateConversationInput {
    pub id: String,
    pub title: Option<String>,
    /// Use `Some(None)` to clear workspace. JSON `null` deserializes as None,
    /// so partial updates omit the field entirely.
    pub workspace: Option<Option<String>>,
    pub selected_pack_id: Option<Option<String>>,
    pub agent_mode: Option<bool>,
    pub auto_accept_edits: Option<bool>,
    pub last_active_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessageRow {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub blocks_json: Option<String>,
    pub model_id: Option<String>,
    pub tier: Option<String>,
    pub effort: Option<String>,
    pub pack_name: Option<String>,
    pub attachments_json: Option<String>,
    pub telemetry_id: Option<String>,
    pub user_signal: Option<String>,
    pub created_at: i64,
}

// ─── Commands ──────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn conversation_list(app_handle: AppHandle) -> Result<Vec<Conversation>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, workspace, selected_pack_id, agent_mode,
                    auto_accept_edits, last_active_at, created_at
             FROM conversations
             ORDER BY last_active_at DESC
             LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![MAX_CONVERSATIONS], |r| {
            Ok(Conversation {
                id: r.get(0)?,
                title: r.get(1)?,
                workspace: r.get(2)?,
                selected_pack_id: r.get(3)?,
                agent_mode: r.get::<_, i64>(4)? != 0,
                auto_accept_edits: r.get::<_, i64>(5)? != 0,
                last_active_at: r.get(6)?,
                created_at: r.get(7)?,
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
pub async fn conversation_create(
    app_handle: AppHandle,
    input: CreateConversationInput,
) -> Result<Conversation, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    // Server-side cap. UI also blocks at 3, but a stale frontend state must
    // not slip a 4th past the DB.
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM conversations", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if count >= MAX_CONVERSATIONS {
        return Err("max_conversations_reached".to_string());
    }

    let ts = now();
    let id = format!("cnv_{}_{}", ts, uuid::Uuid::new_v4().simple());
    // Sole-convo case gets the bare label "Chat" — feels redundant to
    // number when there's only one. Sibling adds become "Chat 2" /
    // "Chat 3". Once the user sends a message, chatStore auto-renames
    // to a slugged preview anyway.
    let title = input.title.unwrap_or_else(|| {
        if count == 0 {
            "Chat".to_string()
        } else {
            format!("Chat {}", count + 1)
        }
    });

    conn.execute(
        "INSERT INTO conversations (
            id, title, workspace, selected_pack_id, agent_mode,
            auto_accept_edits, last_active_at, created_at
         ) VALUES (?1, ?2, ?3, NULL, 0, 0, ?4, ?4)",
        params![&id, &title, &input.workspace, ts],
    )
    .map_err(|e| e.to_string())?;

    Ok(Conversation {
        id,
        title,
        workspace: input.workspace,
        selected_pack_id: None,
        agent_mode: false,
        auto_accept_edits: false,
        last_active_at: ts,
        created_at: ts,
    })
}

#[tauri::command]
pub async fn conversation_update(
    app_handle: AppHandle,
    input: UpdateConversationInput,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    // Build dynamic UPDATE — only patch fields present in the input.
    let mut sets: Vec<&str> = Vec::new();
    if input.title.is_some() {
        sets.push("title = ?");
    }
    if input.workspace.is_some() {
        sets.push("workspace = ?");
    }
    if input.selected_pack_id.is_some() {
        sets.push("selected_pack_id = ?");
    }
    if input.agent_mode.is_some() {
        sets.push("agent_mode = ?");
    }
    if input.auto_accept_edits.is_some() {
        sets.push("auto_accept_edits = ?");
    }
    if input.last_active_at.is_some() {
        sets.push("last_active_at = ?");
    }
    if sets.is_empty() {
        return Ok(());
    }

    let sql = format!(
        "UPDATE conversations SET {} WHERE id = ?",
        sets.join(", ")
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let mut idx = 1;
    if let Some(t) = &input.title {
        stmt.raw_bind_parameter(idx, t).map_err(|e| e.to_string())?;
        idx += 1;
    }
    if let Some(w) = &input.workspace {
        stmt.raw_bind_parameter(idx, w.as_deref())
            .map_err(|e| e.to_string())?;
        idx += 1;
    }
    if let Some(p) = &input.selected_pack_id {
        stmt.raw_bind_parameter(idx, p.as_deref())
            .map_err(|e| e.to_string())?;
        idx += 1;
    }
    if let Some(a) = input.agent_mode {
        stmt.raw_bind_parameter(idx, if a { 1i64 } else { 0i64 })
            .map_err(|e| e.to_string())?;
        idx += 1;
    }
    if let Some(a) = input.auto_accept_edits {
        stmt.raw_bind_parameter(idx, if a { 1i64 } else { 0i64 })
            .map_err(|e| e.to_string())?;
        idx += 1;
    }
    if let Some(l) = input.last_active_at {
        stmt.raw_bind_parameter(idx, l).map_err(|e| e.to_string())?;
        idx += 1;
    }
    stmt.raw_bind_parameter(idx, &input.id)
        .map_err(|e| e.to_string())?;

    stmt.raw_execute().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn conversation_delete(app_handle: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    // SET NULL on runs.conversation_id so historical runs survive deletion
    // (FK enforced at app layer — see db.rs migration note). chat_messages
    // cascade via the FK ON DELETE CASCADE in db.rs.
    conn.execute(
        "UPDATE runs SET conversation_id = NULL WHERE conversation_id = ?1",
        params![&id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM conversations WHERE id = ?1", params![&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Chat messages ─────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct InsertChatMessageInput {
    pub id: Option<String>,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub blocks_json: Option<String>,
    pub model_id: Option<String>,
    pub tier: Option<String>,
    pub effort: Option<String>,
    pub pack_name: Option<String>,
    pub attachments_json: Option<String>,
    pub telemetry_id: Option<String>,
    pub user_signal: Option<String>,
    pub created_at: Option<i64>,
}

#[tauri::command]
pub async fn chat_message_insert(
    app_handle: AppHandle,
    input: InsertChatMessageInput,
) -> Result<ChatMessageRow, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let ts = input.created_at.unwrap_or_else(now);
    let id = input
        .id
        .unwrap_or_else(|| format!("msg_{}_{}", ts, uuid::Uuid::new_v4().simple()));

    conn.execute(
        "INSERT INTO chat_messages (
            id, conversation_id, role, content, blocks_json, model_id,
            tier, effort, pack_name, attachments_json, telemetry_id,
            user_signal, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
         ON CONFLICT(id) DO UPDATE SET
            content          = excluded.content,
            blocks_json      = excluded.blocks_json,
            model_id         = excluded.model_id,
            tier             = excluded.tier,
            effort           = excluded.effort,
            pack_name        = excluded.pack_name,
            attachments_json = excluded.attachments_json,
            telemetry_id     = excluded.telemetry_id,
            user_signal      = excluded.user_signal",
        params![
            &id,
            &input.conversation_id,
            &input.role,
            &input.content,
            &input.blocks_json,
            &input.model_id,
            &input.tier,
            &input.effort,
            &input.pack_name,
            &input.attachments_json,
            &input.telemetry_id,
            &input.user_signal,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(ChatMessageRow {
        id,
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        blocks_json: input.blocks_json,
        model_id: input.model_id,
        tier: input.tier,
        effort: input.effort,
        pack_name: input.pack_name,
        attachments_json: input.attachments_json,
        telemetry_id: input.telemetry_id,
        user_signal: input.user_signal,
        created_at: ts,
    })
}

#[tauri::command]
pub async fn chat_message_list(
    app_handle: AppHandle,
    conversation_id: String,
) -> Result<Vec<ChatMessageRow>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, conversation_id, role, content, blocks_json, model_id,
                    tier, effort, pack_name, attachments_json, telemetry_id,
                    user_signal, created_at
             FROM chat_messages
             WHERE conversation_id = ?1
             ORDER BY created_at ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![&conversation_id], |r| {
            Ok(ChatMessageRow {
                id: r.get(0)?,
                conversation_id: r.get(1)?,
                role: r.get(2)?,
                content: r.get(3)?,
                blocks_json: r.get(4)?,
                model_id: r.get(5)?,
                tier: r.get(6)?,
                effort: r.get(7)?,
                pack_name: r.get(8)?,
                attachments_json: r.get(9)?,
                telemetry_id: r.get(10)?,
                user_signal: r.get(11)?,
                created_at: r.get(12)?,
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
pub async fn chat_message_delete(app_handle: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM chat_messages WHERE id = ?1", params![&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn chat_message_update_signal(
    app_handle: AppHandle,
    id: String,
    signal: Option<String>,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE chat_messages SET user_signal = ?1 WHERE id = ?2",
        params![&signal, &id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Quick lookup used when the UI needs to confirm a conversation exists
/// before opening it (e.g. deep links, restoration after migration).
#[tauri::command]
pub async fn conversation_get(
    app_handle: AppHandle,
    id: String,
) -> Result<Option<Conversation>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, title, workspace, selected_pack_id, agent_mode,
                auto_accept_edits, last_active_at, created_at
         FROM conversations WHERE id = ?1",
        params![&id],
        |r| {
            Ok(Conversation {
                id: r.get(0)?,
                title: r.get(1)?,
                workspace: r.get(2)?,
                selected_pack_id: r.get(3)?,
                agent_mode: r.get::<_, i64>(4)? != 0,
                auto_accept_edits: r.get::<_, i64>(5)? != 0,
                last_active_at: r.get(6)?,
                created_at: r.get(7)?,
            })
        },
    )
    .optional()
    .map_err(|e| e.to_string())
}
