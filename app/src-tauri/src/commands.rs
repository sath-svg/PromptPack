use crate::auth::{self, AuthSession};
use crate::crypto;
use crate::db;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

// ============================================================================
// CENTRALIZED CONFIGURATION
// ============================================================================
// UPDATE THESE FOR PRODUCTION DEPLOYMENT.
// ============================================================================

/// Web app URL for OAuth redirects
/// - DEV: http://localhost:3000 (local Next.js dev server)
/// - PROD: https://pmtpk.com
const WEB_APP_URL: &str = "https://pmtpk.com";

/// Desktop auth page URL - where the OAuth popup opens for sign-in
const DESKTOP_AUTH_URL: &str = const_format::concatcp!(WEB_APP_URL, "/desktop-auth");

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Prompt {
    pub id: String,
    pub text: String,
    pub header: Option<String>,
    pub source: String,
    pub url: Option<String>,
    pub folder_id: Option<String>,
    pub is_favorite: bool,
    pub use_count: i32,
    pub created_at: i64,
    pub updated_at: i64,
    pub sync_status: String,
    pub cloud_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub parent_id: Option<String>,
    pub sort_order: i32,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePromptInput {
    pub text: String,
    pub header: Option<String>,
    pub source: Option<String>,
    pub url: Option<String>,
    pub folder_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePromptInput {
    pub text: Option<String>,
    pub header: Option<String>,
    pub source: Option<String>,
    pub url: Option<String>,
    pub folder_id: Option<String>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFolderInput {
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportPackInput {
    pub prompt_ids: Vec<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub prompts: Vec<Prompt>,
    pub count: usize,
}

// ============ Prompt Commands ============

#[tauri::command]
pub fn get_prompts(app_handle: AppHandle) -> Result<Vec<Prompt>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, text, header, source, url, folder_id, is_favorite, use_count,
                    created_at, updated_at, sync_status, cloud_id
             FROM prompts ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let prompts = stmt
        .query_map([], |row| {
            Ok(Prompt {
                id: row.get(0)?,
                text: row.get(1)?,
                header: row.get(2)?,
                source: row.get(3)?,
                url: row.get(4)?,
                folder_id: row.get(5)?,
                is_favorite: row.get::<_, i32>(6)? != 0,
                use_count: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                sync_status: row.get(10)?,
                cloud_id: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(prompts)
}

#[tauri::command]
pub fn get_prompt(app_handle: AppHandle, id: String) -> Result<Option<Prompt>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, text, header, source, url, folder_id, is_favorite, use_count,
                    created_at, updated_at, sync_status, cloud_id
             FROM prompts WHERE id = ?",
        )
        .map_err(|e| e.to_string())?;

    let prompt = stmt
        .query_row([&id], |row| {
            Ok(Prompt {
                id: row.get(0)?,
                text: row.get(1)?,
                header: row.get(2)?,
                source: row.get(3)?,
                url: row.get(4)?,
                folder_id: row.get(5)?,
                is_favorite: row.get::<_, i32>(6)? != 0,
                use_count: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                sync_status: row.get(10)?,
                cloud_id: row.get(11)?,
            })
        })
        .ok();

    Ok(prompt)
}

#[tauri::command]
pub fn create_prompt(app_handle: AppHandle, input: CreatePromptInput) -> Result<Prompt, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    let source = input.source.unwrap_or_else(|| "manual".to_string());

    conn.execute(
        "INSERT INTO prompts (id, text, header, source, url, folder_id, is_favorite, use_count, created_at, updated_at, sync_status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 0, ?7, ?7, 'local-only')",
        rusqlite::params![id, input.text, input.header, source, input.url, input.folder_id, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Prompt {
        id,
        text: input.text,
        header: input.header,
        source,
        url: input.url,
        folder_id: input.folder_id,
        is_favorite: false,
        use_count: 0,
        created_at: now,
        updated_at: now,
        sync_status: "local-only".to_string(),
        cloud_id: None,
    })
}

#[tauri::command]
pub fn update_prompt(
    app_handle: AppHandle,
    id: String,
    input: UpdatePromptInput,
) -> Result<Prompt, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();

    // Build dynamic update query
    let mut updates = vec!["updated_at = ?1".to_string()];
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(now)];

    if let Some(text) = &input.text {
        updates.push(format!("text = ?{}", params.len() + 1));
        params.push(Box::new(text.clone()));
    }
    if let Some(header) = &input.header {
        updates.push(format!("header = ?{}", params.len() + 1));
        params.push(Box::new(header.clone()));
    }
    if let Some(source) = &input.source {
        updates.push(format!("source = ?{}", params.len() + 1));
        params.push(Box::new(source.clone()));
    }
    if let Some(url) = &input.url {
        updates.push(format!("url = ?{}", params.len() + 1));
        params.push(Box::new(url.clone()));
    }
    if let Some(folder_id) = &input.folder_id {
        updates.push(format!("folder_id = ?{}", params.len() + 1));
        params.push(Box::new(folder_id.clone()));
    }
    if let Some(is_favorite) = input.is_favorite {
        updates.push(format!("is_favorite = ?{}", params.len() + 1));
        params.push(Box::new(if is_favorite { 1i32 } else { 0i32 }));
    }

    let sql = format!(
        "UPDATE prompts SET {} WHERE id = ?{}",
        updates.join(", "),
        params.len() + 1
    );
    params.push(Box::new(id.clone()));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;

    // Fetch and return the updated prompt
    get_prompt(app_handle, id)?.ok_or_else(|| "Prompt not found".to_string())
}

#[tauri::command]
pub fn delete_prompt(app_handle: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM prompts WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============ Folder Commands ============

#[tauri::command]
pub fn get_folders(app_handle: AppHandle) -> Result<Vec<Folder>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, icon, color, parent_id, sort_order, created_at FROM folders ORDER BY sort_order")
        .map_err(|e| e.to_string())?;

    let folders = stmt
        .query_map([], |row| {
            Ok(Folder {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                parent_id: row.get(4)?,
                sort_order: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(folders)
}

#[tauri::command]
pub fn create_folder(app_handle: AppHandle, input: CreateFolderInput) -> Result<Folder, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();

    // Get max sort_order
    let max_order: i32 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), 0) FROM folders", [], |row| {
            row.get(0)
        })
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO folders (id, name, icon, color, parent_id, sort_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![id, input.name, input.icon, input.color, input.parent_id, max_order + 1, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Folder {
        id,
        name: input.name,
        icon: input.icon,
        color: input.color,
        parent_id: input.parent_id,
        sort_order: max_order + 1,
        created_at: now,
    })
}

#[tauri::command]
pub fn update_folder(
    app_handle: AppHandle,
    id: String,
    name: Option<String>,
    icon: Option<String>,
    color: Option<String>,
) -> Result<Folder, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(n) = &name {
        updates.push(format!("name = ?{}", params.len() + 1));
        params.push(Box::new(n.clone()));
    }
    if let Some(i) = &icon {
        updates.push(format!("icon = ?{}", params.len() + 1));
        params.push(Box::new(i.clone()));
    }
    if let Some(c) = &color {
        updates.push(format!("color = ?{}", params.len() + 1));
        params.push(Box::new(c.clone()));
    }

    if !updates.is_empty() {
        let sql = format!(
            "UPDATE folders SET {} WHERE id = ?{}",
            updates.join(", "),
            params.len() + 1
        );
        params.push(Box::new(id.clone()));

        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        conn.execute(&sql, param_refs.as_slice())
            .map_err(|e| e.to_string())?;
    }

    // Fetch and return the updated folder
    let mut stmt = conn
        .prepare("SELECT id, name, icon, color, parent_id, sort_order, created_at FROM folders WHERE id = ?")
        .map_err(|e| e.to_string())?;

    stmt.query_row([&id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            color: row.get(3)?,
            parent_id: row.get(4)?,
            sort_order: row.get(5)?,
            created_at: row.get(6)?,
        })
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_folder(app_handle: AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    // Move prompts in this folder to no folder
    conn.execute(
        "UPDATE prompts SET folder_id = NULL WHERE folder_id = ?",
        [&id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM folders WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============ Import/Export Commands ============

#[tauri::command]
pub fn import_pack(
    app_handle: AppHandle,
    data: Vec<u8>,
    password: Option<String>,
) -> Result<ImportResult, String> {
    // Decode the pack file
    let json_str =
        crypto::decode_pack(&data, password.as_deref()).map_err(|e| e.to_string())?;

    // Parse JSON
    let pack_data: serde_json::Value =
        serde_json::from_str(&json_str).map_err(|e| e.to_string())?;

    let prompts_array = pack_data
        .get("prompts")
        .and_then(|p| p.as_array())
        .ok_or("Invalid pack format: missing prompts array")?;

    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();

    let mut imported_prompts = Vec::new();

    for prompt_value in prompts_array {
        let id = uuid::Uuid::new_v4().to_string();
        let text = prompt_value
            .get("text")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();
        let header = prompt_value
            .get("header")
            .and_then(|h| h.as_str())
            .map(|s| s.to_string());
        let source = prompt_value
            .get("source")
            .and_then(|s| s.as_str())
            .unwrap_or("manual")
            .to_string();

        if text.is_empty() {
            continue;
        }

        conn.execute(
            "INSERT INTO prompts (id, text, header, source, is_favorite, use_count, created_at, updated_at, sync_status)
             VALUES (?1, ?2, ?3, ?4, 0, 0, ?5, ?5, 'local-only')",
            rusqlite::params![id, text, header, source, now],
        )
        .map_err(|e| e.to_string())?;

        imported_prompts.push(Prompt {
            id,
            text,
            header,
            source,
            url: None,
            folder_id: None,
            is_favorite: false,
            use_count: 0,
            created_at: now,
            updated_at: now,
            sync_status: "local-only".to_string(),
            cloud_id: None,
        });
    }

    Ok(ImportResult {
        count: imported_prompts.len(),
        prompts: imported_prompts,
    })
}

#[tauri::command]
pub fn export_pack(app_handle: AppHandle, input: ExportPackInput) -> Result<Vec<u8>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    // Fetch selected prompts
    let placeholders: Vec<String> = input.prompt_ids.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "SELECT text, header, source, created_at FROM prompts WHERE id IN ({})",
        placeholders.join(", ")
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let params: Vec<&dyn rusqlite::ToSql> = input
        .prompt_ids
        .iter()
        .map(|id| id as &dyn rusqlite::ToSql)
        .collect();

    let prompts: Vec<serde_json::Value> = stmt
        .query_map(params.as_slice(), |row| {
            Ok(serde_json::json!({
                "text": row.get::<_, String>(0)?,
                "header": row.get::<_, Option<String>>(1)?,
                "source": row.get::<_, String>(2)?,
                "createdAt": row.get::<_, i64>(3)?,
            }))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let pack_data = serde_json::json!({
        "version": 1,
        "exportedAt": chrono::Utc::now().timestamp_millis(),
        "prompts": prompts,
    });

    let json_str = serde_json::to_string(&pack_data).map_err(|e| e.to_string())?;

    crypto::encode_pack(&json_str, input.password.as_deref()).map_err(|e| e.to_string())
}

// ============ Crypto Commands ============

#[tauri::command]
pub fn encrypt_data(data: String, password: String) -> Result<Vec<u8>, String> {
    crypto::encode_pack(&data, Some(&password)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn decrypt_data(data: Vec<u8>, password: Option<String>) -> Result<String, String> {
    crypto::decode_pack(&data, password.as_deref()).map_err(|e| e.to_string())
}

// ============ Auth State ============

pub struct AuthState {
    pub session: Mutex<Option<AuthSession>>,
}

impl Default for AuthState {
    fn default() -> Self {
        Self {
            session: Mutex::new(None),
        }
    }
}

// ============ Auth Commands ============

#[tauri::command]
pub fn verify_auth_token(
    token: String,
    auth_state: State<'_, AuthState>,
) -> Result<AuthSession, String> {
    // Verify the token
    let claims = auth::verify_session_token(&token).map_err(|e| e.to_string())?;

    // Create session from verified claims
    let session = AuthSession {
        user_id: claims.sub.clone(),
        email: claims.email.clone(),
        name: None,
        image_url: None,
        tier: "free".to_string(), // Default tier, can be updated from API
        session_token: token,
        expires_at: claims.exp,
    };

    // Store session in state
    let mut state_session = auth_state
        .session
        .lock()
        .map_err(|_| "Failed to acquire lock")?;
    *state_session = Some(session.clone());

    Ok(session)
}

#[tauri::command]
pub fn get_auth_session(auth_state: State<'_, AuthState>) -> Result<Option<AuthSession>, String> {
    let session = auth_state
        .session
        .lock()
        .map_err(|_| "Failed to acquire lock")?;

    // Check if session exists and is not expired
    if let Some(ref s) = *session {
        let now = chrono::Utc::now().timestamp();
        if s.expires_at < now {
            return Ok(None); // Session expired
        }
        return Ok(Some(s.clone()));
    }

    Ok(None)
}

#[tauri::command]
pub fn logout(auth_state: State<'_, AuthState>) -> Result<(), String> {
    let mut session = auth_state
        .session
        .lock()
        .map_err(|_| "Failed to acquire lock")?;
    *session = None;
    Ok(())
}

#[tauri::command]
pub async fn open_auth_window(app_handle: AppHandle) -> Result<(), String> {
    use tauri::{Emitter, WebviewUrl, WebviewWindowBuilder};

    // Check if auth window already exists
    if let Some(window) = app_handle.get_webview_window("auth") {
        let _ = window.set_focus();
        return Ok(());
    }

    // Build the auth URL - use dedicated desktop-auth page
    let auth_url = DESKTOP_AUTH_URL;

    let handle = app_handle.clone();

    // Create a new popup window for authentication
    let _auth_window =
        WebviewWindowBuilder::new(&app_handle, "auth", WebviewUrl::External(auth_url.parse().unwrap()))
            .title("Sign In - PromptPack")
            .inner_size(450.0, 650.0)
            .resizable(false)
            .center()
            .on_navigation(move |url| {
                let url_str = url.as_str();

                // Check for callback URL patterns with token
                // Expected: pmtpk.com/desktop-callback?token=xxx&name=xxx&email=xxx&image=xxx
                if url_str.contains("/desktop-callback") || url_str.contains("/auth/callback") {
                    if let Some(query) = url.query() {
                        let mut token = None;
                        let mut name = None;
                        let mut email = None;
                        let mut image = None;
                        let mut user_id = None;

                        // Helper to decode URL params (+ means space in query strings)
                        let decode_param = |v: &str| -> Option<String> {
                            let with_spaces = v.replace('+', " ");
                            urlencoding::decode(&with_spaces).ok().map(|s| s.to_string())
                        };

                        for pair in query.split('&') {
                            if let Some(v) = pair.strip_prefix("token=") {
                                token = decode_param(v);
                            } else if let Some(v) = pair.strip_prefix("name=") {
                                name = decode_param(v);
                            } else if let Some(v) = pair.strip_prefix("email=") {
                                email = decode_param(v);
                            } else if let Some(v) = pair.strip_prefix("image=") {
                                image = decode_param(v);
                            } else if let Some(v) = pair.strip_prefix("user_id=") {
                                user_id = decode_param(v);
                            }
                        }

                        if let Some(token_str) = token {
                            // Build auth data JSON
                            let auth_data = serde_json::json!({
                                "token": token_str,
                                "name": name,
                                "email": email,
                                "image_url": image,
                                "user_id": user_id,
                            });

                            // Emit the auth data to the main window
                            let _ = handle.emit("auth-callback", auth_data);

                            // Close the auth window
                            if let Some(auth_win) = handle.get_webview_window("auth") {
                                let _ = auth_win.close();
                            }
                            return false; // Prevent navigation to callback URL
                        }
                    }
                }

                // Allow all other navigation
                true
            })
            .build()
            .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn close_auth_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("auth") {
        let _ = window.close();
    }
    Ok(())
}
