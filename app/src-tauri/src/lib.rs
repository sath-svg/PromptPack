mod agent;
mod auth;
mod commands;
mod crypto;
mod db;
mod orchestrator;
mod telemetry;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // Focus the existing window when a second instance launches
            // (e.g. via deep link). Deep link plugin handles the URL itself.
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.unminimize();
                let _ = win.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(commands::AuthState::default())
        .manage(agent::LspState::default())
        .manage(commands::HttpClient(
            reqwest::Client::builder()
                // Reasoning-capable models can spend several minutes
                // thinking before emitting a single token, especially
                // GPT-5 / Opus on multi-round tool loops. The previous
                // 180s budget tripped on the second-pass GPT-5 call in
                // pack runs (Stock Analyzer eval timed out mid-thought).
                // 600s ≈ 10 minutes — covers the worst single round we've
                // observed without leaving runaway requests dangling
                // forever.
                .timeout(std::time::Duration::from_secs(600))
                .connect_timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("failed to create HTTP client"),
        ))
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::init_database(&app_handle).await {
                    log::error!("Failed to initialize database: {}", e);
                }
            });

            // Register deep link handler for auth callback
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;

                // Register `promptpack://` URI scheme in OS so the browser
                // hands off auth callback URLs to this app. Production
                // installers do this via NSIS/MSI; dev runs need it explicit.
                #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
                {
                    let _ = app.deep_link().register_all();
                }

                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    let urls = event.urls();
                    for url in urls {
                        if url.scheme() == "promptpack" && url.host_str() == Some("auth") {
                            if let Some(query) = url.query() {
                                let decode = |v: &str| -> String {
                                    let with_spaces = v.replace('+', " ");
                                    urlencoding::decode(&with_spaces)
                                        .map(|s| s.into_owned())
                                        .unwrap_or(with_spaces)
                                };

                                let mut token = None;
                                let mut name = None;
                                let mut email = None;
                                let mut image_url = None;
                                let mut user_id = None;

                                for pair in query.split('&') {
                                    if let Some((k, v)) = pair.split_once('=') {
                                        match k {
                                            "token"     => token    = Some(decode(v)),
                                            "name"      => name     = Some(decode(v)),
                                            "email"     => email    = Some(decode(v)),
                                            "image_url" => image_url = Some(decode(v)),
                                            "user_id"   => user_id  = Some(decode(v)),
                                            _ => {}
                                        }
                                    }
                                }

                                if let Some(token_str) = token {
                                    let auth_data = serde_json::json!({
                                        "token": token_str,
                                        "name": name,
                                        "email": email,
                                        "image_url": image_url,
                                        "user_id": user_id,
                                    });
                                    let _ = handle.emit("auth-callback", auth_data);
                                }
                            }
                        }
                    }
                });
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_prompts,
            commands::get_prompt,
            commands::create_prompt,
            commands::update_prompt,
            commands::delete_prompt,
            commands::get_folders,
            commands::create_folder,
            commands::update_folder,
            commands::delete_folder,
            commands::import_pack,
            commands::export_pack,
            commands::encrypt_data,
            commands::decrypt_data,
            commands::verify_auth_token,
            commands::get_auth_session,
            commands::logout,
            commands::open_auth_window,
            commands::close_auth_window,
            commands::proxy_fetch,
            agent::agent_read,
            agent::agent_write,
            agent::agent_edit,
            agent::agent_list,
            agent::agent_glob,
            agent::agent_grep,
            agent::agent_bash,
            agent::agent_web_fetch,
            agent::agent_http,
            agent::agent_pdf_generate,
            agent::agent_attach_files,
            agent::agent_init_workspace_doc,
            agent::agent_git_status,
            agent::agent_check_tool,
            agent::agent_install_tool,
            agent::lsp_spawn,
            agent::lsp_send,
            agent::lsp_stop,
            orchestrator::skill_upsert,
            orchestrator::skill_list,
            orchestrator::skill_delete,
            orchestrator::run_create,
            orchestrator::run_update,
            orchestrator::run_get,
            orchestrator::run_cancel,
            orchestrator::subtask_upsert,
            orchestrator::subtask_list,
            orchestrator::task_memory_get,
            orchestrator::task_memory_set,
            telemetry::telemetry_log_route,
            telemetry::telemetry_settle_route,
            telemetry::telemetry_export_route,
            telemetry::telemetry_get_route,
            telemetry::telemetry_clear_route,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
