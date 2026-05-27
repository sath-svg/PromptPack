//! Telegram desktop gateway (OpenClaw-style).
//!
//! Runs a long-poll loop against `getUpdates` while the app is open. Inbound
//! messages are emitted to the frontend as `messenger://incoming` Tauri events;
//! the frontend dispatches them into Skill Chat and calls `messenger_telegram_send_reply`
//! when the assistant turn completes.
//!
//! Slice B scope: Telegram only, text messages only, online path only.
//! Out of scope here: webhook handover on quit, image attachments, iMessage,
//! WhatsApp. Those land in follow-up slices.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

const TELEGRAM_API: &str = "https://api.telegram.org/bot";

#[derive(Default)]
pub struct TelegramState {
    inner: Arc<Mutex<TelegramInner>>,
}

#[derive(Default)]
struct TelegramInner {
    handle: Option<JoinHandle<()>>,
    token: Option<String>,
    last_offset: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IncomingMessagePayload {
    pub platform: &'static str,
    pub chat_id: i64,
    pub from_user_id: Option<i64>,
    pub from_username: Option<String>,
    pub from_display_name: Option<String>,
    pub text: String,
    pub message_id: i64,
    pub is_start_command: bool,
}

#[derive(Debug, Deserialize)]
struct TgResponse<T> {
    ok: bool,
    result: Option<T>,
    description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TgUpdate {
    update_id: i64,
    #[serde(default)]
    message: Option<TgMessage>,
}

#[derive(Debug, Deserialize)]
struct TgMessage {
    message_id: i64,
    #[serde(default)]
    from: Option<TgUser>,
    chat: TgChat,
    #[serde(default)]
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TgUser {
    id: i64,
    #[serde(default)]
    username: Option<String>,
    #[serde(default)]
    first_name: Option<String>,
    #[serde(default)]
    last_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TgChat {
    id: i64,
}

#[derive(Debug, Deserialize)]
struct TgGetMe {
    id: i64,
    #[serde(default)]
    username: Option<String>,
    #[serde(default)]
    first_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TokenValidation {
    pub ok: bool,
    pub bot_id: Option<i64>,
    pub bot_username: Option<String>,
    pub bot_name: Option<String>,
    pub error: Option<String>,
}

fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        // Long-poll requests sit open for up to ~30s; give a margin.
        .timeout(std::time::Duration::from_secs(60))
        .connect_timeout(std::time::Duration::from_secs(15))
        .build()
        .expect("telegram http client")
}

/// One-shot getMe — validates the token and surfaces bot identity to the UI.
#[tauri::command]
pub async fn messenger_telegram_test_token(token: String) -> Result<TokenValidation, String> {
    let token = token.trim().to_string();
    if token.is_empty() {
        return Ok(TokenValidation {
            ok: false,
            bot_id: None,
            bot_username: None,
            bot_name: None,
            error: Some("empty token".into()),
        });
    }
    let url = format!("{}{}/getMe", TELEGRAM_API, token);
    let client = http_client();
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("network: {e}"))?;
    let status = res.status();
    let body: TgResponse<TgGetMe> = res
        .json()
        .await
        .map_err(|e| format!("decode getMe ({status}): {e}"))?;
    if !body.ok {
        return Ok(TokenValidation {
            ok: false,
            bot_id: None,
            bot_username: None,
            bot_name: None,
            error: body.description.or_else(|| Some(format!("http {status}"))),
        });
    }
    let me = body.result.ok_or("missing result")?;
    Ok(TokenValidation {
        ok: true,
        bot_id: Some(me.id),
        bot_username: me.username,
        bot_name: me.first_name,
        error: None,
    })
}

/// Start the long-poll loop. Idempotent: if a loop is already running with the
/// same token, this is a no-op. If a different token is active, the previous
/// loop is aborted and replaced.
#[tauri::command]
pub async fn messenger_telegram_start(
    app: AppHandle,
    state: State<'_, TelegramState>,
    token: String,
) -> Result<(), String> {
    let token = token.trim().to_string();
    if token.is_empty() {
        return Err("empty token".into());
    }
    let mut inner = state.inner.lock().await;
    if let Some(existing) = inner.token.as_ref() {
        if existing == &token && inner.handle.as_ref().is_some_and(|h| !h.is_finished()) {
            return Ok(());
        }
    }
    if let Some(h) = inner.handle.take() {
        h.abort();
    }
    inner.token = Some(token.clone());
    inner.last_offset = 0;

    let inner_arc = state.inner.clone();
    let handle = tokio::spawn(run_loop(app, inner_arc, token));
    inner.handle = Some(handle);
    Ok(())
}

#[tauri::command]
pub async fn messenger_telegram_stop(state: State<'_, TelegramState>) -> Result<(), String> {
    let mut inner = state.inner.lock().await;
    if let Some(h) = inner.handle.take() {
        h.abort();
    }
    inner.token = None;
    Ok(())
}

#[tauri::command]
pub async fn messenger_telegram_is_running(state: State<'_, TelegramState>) -> Result<bool, String> {
    let inner = state.inner.lock().await;
    Ok(inner
        .handle
        .as_ref()
        .map(|h| !h.is_finished())
        .unwrap_or(false))
}

/// Register the bot's slash commands with Telegram so they appear in the
/// official client's command picker (the `/` autocomplete menu). Idempotent
/// — Telegram replaces the full command list on each call. Best-effort; we
/// log + swallow errors so a transient API failure doesn't block startup.
#[tauri::command]
pub async fn messenger_telegram_set_commands(
    state: State<'_, TelegramState>,
) -> Result<(), String> {
    let token = {
        let inner = state.inner.lock().await;
        inner.token.clone()
    };
    let token = token.ok_or("telegram not started")?;
    let commands = serde_json::json!([
        { "command": "help",      "description": "Show all commands" },
        { "command": "sets",      "description": "List your skill sets" },
        { "command": "run",       "description": "Run a skill set: /run <number|title>" },
        { "command": "workspace", "description": "Show or set the workspace folder" },
        { "command": "status",    "description": "Show agent + workspace + Skill Flow state" },
        { "command": "auto",      "description": "Toggle auto-accept edits: /auto on|off" },
        { "command": "accept",    "description": "Accept a staged edit: /accept <id|all>" },
        { "command": "reject",    "description": "Reject a staged edit: /reject <id|all>" },
        { "command": "edits",     "description": "List pending edits awaiting review" },
        { "command": "cancel",    "description": "Stop the in-flight run" },
        { "command": "new",       "description": "Start a fresh Skill Chat on next message" }
    ]);
    let body = serde_json::json!({
        "commands": commands,
        "scope": { "type": "default" }
    });
    let url = format!("{}{}/setMyCommands", TELEGRAM_API, token);
    let client = http_client();
    let res = client.post(&url).json(&body).send().await
        .map_err(|e| format!("setMyCommands network: {e}"))?;
    if !res.status().is_success() {
        let status = res.status();
        let body_text = res.text().await.unwrap_or_default();
        return Err(format!("setMyCommands http {status}: {body_text}"));
    }
    Ok(())
}

/// Send a text reply back to a Telegram chat. Used by the frontend after the
/// Skill Chat assistant turn completes.
///
/// `parse_mode` accepts the Telegram-defined values `HTML`, `MarkdownV2`, or
/// `Markdown`. When provided, the caller is responsible for producing valid
/// pre-escaped markup; we forward the string as-is. `None` sends plain text.
#[tauri::command]
pub async fn messenger_telegram_send_reply(
    state: State<'_, TelegramState>,
    chat_id: i64,
    text: String,
    reply_to_message_id: Option<i64>,
    parse_mode: Option<String>,
) -> Result<(), String> {
    let token = {
        let inner = state.inner.lock().await;
        inner.token.clone()
    };
    let token = token.ok_or("telegram not started")?;
    send_message(&token, chat_id, &text, reply_to_message_id, parse_mode.as_deref()).await
}

/// Send a sticker to a Telegram chat. We fetch the WebM bytes from R2
/// then upload them to Telegram via multipart/form-data.
///
/// Why multipart, not URL? The Bot API only accepts URLs for static
/// `.webp` stickers; animated `.webm` (and `.tgs`) stickers MUST be
/// uploaded as `InputFile`. When you pass a `.webm` URL to sendSticker
/// the API silently delivers it as a document attachment instead — what
/// we saw in early testing.
///
/// Used by `messenger/stickers.ts` to fire Skilly-themed stickers
/// (random ~once a day per chat, plus event-driven sad/passed-out).
#[tauri::command]
pub async fn messenger_telegram_send_sticker(
    state: State<'_, TelegramState>,
    chat_id: i64,
    sticker_url: String,
    reply_to_message_id: Option<i64>,
) -> Result<(), String> {
    let token = {
        let inner = state.inner.lock().await;
        inner.token.clone()
    };
    let token = token.ok_or("telegram not started")?;
    let client = http_client();

    // 1. Fetch the sticker WebM bytes from R2.
    let asset = client
        .get(&sticker_url)
        .send()
        .await
        .map_err(|e| format!("sticker fetch network: {e}"))?;
    if !asset.status().is_success() {
        return Err(format!(
            "sticker fetch http {} from {}",
            asset.status(),
            sticker_url
        ));
    }
    let mime = asset
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("video/webm")
        .to_string();
    let bytes = asset
        .bytes()
        .await
        .map_err(|e| format!("sticker fetch body: {e}"))?
        .to_vec();

    // 2. Derive a sensible filename so Telegram identifies the format.
    let file_name = sticker_url
        .rsplit('/')
        .next()
        .unwrap_or("sticker.webm")
        .to_string();

    // 3. Upload as multipart to Bot API sendSticker.
    let url = format!("{}{}/sendSticker", TELEGRAM_API, token);
    let part = reqwest::multipart::Part::bytes(bytes)
        .file_name(file_name)
        .mime_str(&mime)
        .map_err(|e| format!("sticker mime: {e}"))?;
    let mut form = reqwest::multipart::Form::new()
        .text("chat_id", chat_id.to_string())
        .text("allow_sending_without_reply", "true")
        .part("sticker", part);
    if let Some(rid) = reply_to_message_id {
        form = form.text("reply_to_message_id", rid.to_string());
    }

    let res = client
        .post(&url)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("sendSticker network: {e}"))?;
    if !res.status().is_success() {
        let status = res.status();
        let body_text = res.text().await.unwrap_or_default();
        return Err(format!("sendSticker http {status}: {body_text}"));
    }
    Ok(())
}

async fn send_message(
    token: &str,
    chat_id: i64,
    text: &str,
    reply_to: Option<i64>,
    parse_mode: Option<&str>,
) -> Result<(), String> {
    // Telegram caps message text at 4096 UTF-16 code units. Split conservatively
    // on byte length to avoid 400s on long agent replies. Keep ordering.
    //
    // NOTE: when `parse_mode` is set, the caller is expected to have already
    // chunked on tag-safe boundaries. This Rust-side splitter does NOT
    // understand HTML/Markdown structure and would corrupt formatted markup
    // if it kicked in. The 3800-byte threshold here is a fallback safety net
    // for plain-text callers.
    let chunks = if parse_mode.is_some() {
        vec![text.to_string()]
    } else {
        chunk_message(text, 3800)
    };
    let client = http_client();
    let url = format!("{}{}/sendMessage", TELEGRAM_API, token);
    for (i, chunk) in chunks.iter().enumerate() {
        let mut body = serde_json::json!({
            "chat_id": chat_id,
            "text": chunk,
            "disable_web_page_preview": true,
        });
        if let Some(mode) = parse_mode {
            body["parse_mode"] = serde_json::json!(mode);
        }
        if i == 0 {
            if let Some(rid) = reply_to {
                body["reply_to_message_id"] = serde_json::json!(rid);
                body["allow_sending_without_reply"] = serde_json::json!(true);
            }
        }
        let res = client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("sendMessage network: {e}"))?;
        if !res.status().is_success() {
            let status = res.status();
            let body_text = res.text().await.unwrap_or_default();
            return Err(format!("sendMessage http {status}: {body_text}"));
        }
    }
    Ok(())
}

fn chunk_message(text: &str, max: usize) -> Vec<String> {
    if text.len() <= max {
        return vec![text.to_string()];
    }
    let mut out = Vec::new();
    let mut buf = String::new();
    for line in text.split_inclusive('\n') {
        if buf.len() + line.len() > max && !buf.is_empty() {
            out.push(std::mem::take(&mut buf));
        }
        if line.len() > max {
            // Hard-split very long single lines.
            let bytes = line.as_bytes();
            let mut i = 0;
            while i < bytes.len() {
                let end = std::cmp::min(i + max, bytes.len());
                // Walk back to a char boundary.
                let mut safe_end = end;
                while safe_end > i && !line.is_char_boundary(safe_end) {
                    safe_end -= 1;
                }
                out.push(line[i..safe_end].to_string());
                i = safe_end;
            }
        } else {
            buf.push_str(line);
        }
    }
    if !buf.is_empty() {
        out.push(buf);
    }
    out
}

async fn run_loop(app: AppHandle, inner_arc: Arc<Mutex<TelegramInner>>, token: String) {
    let client = http_client();
    let mut backoff_secs: u64 = 1;
    loop {
        let offset = {
            let inner = inner_arc.lock().await;
            // If token was rotated out, exit.
            if inner.token.as_deref() != Some(token.as_str()) {
                return;
            }
            inner.last_offset
        };

        let url = format!(
            "{}{}/getUpdates?timeout=25&allowed_updates=%5B%22message%22%5D{}",
            TELEGRAM_API,
            token,
            if offset > 0 {
                format!("&offset={}", offset)
            } else {
                String::new()
            }
        );

        let response = client.get(&url).send().await;
        let updates = match response {
            Ok(r) => {
                let status = r.status();
                if !status.is_success() {
                    log::warn!("telegram getUpdates http {}", status);
                    let _ = sleep_with_backoff(&mut backoff_secs).await;
                    continue;
                }
                match r.json::<TgResponse<Vec<TgUpdate>>>().await {
                    Ok(parsed) => {
                        if !parsed.ok {
                            log::warn!("telegram getUpdates not ok: {:?}", parsed.description);
                            let _ = sleep_with_backoff(&mut backoff_secs).await;
                            continue;
                        }
                        backoff_secs = 1;
                        parsed.result.unwrap_or_default()
                    }
                    Err(e) => {
                        log::warn!("telegram getUpdates decode: {e}");
                        let _ = sleep_with_backoff(&mut backoff_secs).await;
                        continue;
                    }
                }
            }
            Err(e) => {
                log::warn!("telegram getUpdates network: {e}");
                let _ = sleep_with_backoff(&mut backoff_secs).await;
                continue;
            }
        };

        if updates.is_empty() {
            continue;
        }

        let mut max_seen: i64 = offset;
        for u in updates.iter() {
            if u.update_id >= max_seen {
                max_seen = u.update_id + 1;
            }
            let Some(msg) = u.message.as_ref() else { continue };
            let Some(text) = msg.text.as_ref() else { continue };
            let trimmed = text.trim();
            if trimmed.is_empty() {
                continue;
            }

            let from = msg.from.as_ref();
            let display = from.and_then(|u| {
                let f = u.first_name.clone().unwrap_or_default();
                let l = u.last_name.clone().unwrap_or_default();
                let joined = format!("{} {}", f, l).trim().to_string();
                if joined.is_empty() {
                    None
                } else {
                    Some(joined)
                }
            });

            let payload = IncomingMessagePayload {
                platform: "telegram",
                chat_id: msg.chat.id,
                from_user_id: from.map(|u| u.id),
                from_username: from.and_then(|u| u.username.clone()),
                from_display_name: display,
                text: trimmed.to_string(),
                message_id: msg.message_id,
                is_start_command: trimmed.starts_with("/start"),
            };

            if let Err(e) = app.emit("messenger://incoming", &payload) {
                log::warn!("telegram emit incoming failed: {e}");
            }
        }

        let mut inner = inner_arc.lock().await;
        if inner.token.as_deref() != Some(token.as_str()) {
            return;
        }
        if max_seen > inner.last_offset {
            inner.last_offset = max_seen;
        }
    }
}

async fn sleep_with_backoff(backoff_secs: &mut u64) -> () {
    let s = (*backoff_secs).min(30);
    tokio::time::sleep(std::time::Duration::from_secs(s)).await;
    *backoff_secs = (*backoff_secs * 2).min(30);
}
