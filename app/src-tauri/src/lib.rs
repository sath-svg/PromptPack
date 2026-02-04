mod auth;
mod commands;
mod crypto;
mod db;

use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(commands::AuthState::default())
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
                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    let urls = event.urls();
                    for url in urls {
                        if url.scheme() == "promptpack" && url.host_str() == Some("auth") {
                            // Extract token from URL query params
                            if let Some(query) = url.query() {
                                for pair in query.split('&') {
                                    if let Some(token) = pair.strip_prefix("token=") {
                                        let token = urlencoding::decode(token)
                                            .unwrap_or_else(|_| token.into())
                                            .to_string();
                                        // Emit event to frontend
                                        let _ = handle.emit("auth-callback", token);
                                    }
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
