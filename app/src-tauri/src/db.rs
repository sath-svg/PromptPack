use rusqlite::Connection;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Path error: {0}")]
    Path(String),
}

pub fn get_db_path(app_handle: &AppHandle) -> Result<PathBuf, DbError> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| DbError::Path(e.to_string()))?;

    std::fs::create_dir_all(&app_data_dir)?;
    Ok(app_data_dir.join("promptpack.db"))
}

pub async fn init_database(app_handle: &AppHandle) -> Result<(), DbError> {
    let db_path = get_db_path(app_handle)?;
    let conn = Connection::open(&db_path)?;

    // Create tables
    conn.execute_batch(
        r#"
        -- Prompts table
        CREATE TABLE IF NOT EXISTS prompts (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            header TEXT,
            source TEXT NOT NULL DEFAULT 'manual',
            url TEXT,
            folder_id TEXT,
            is_favorite INTEGER DEFAULT 0,
            use_count INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            sync_status TEXT DEFAULT 'local-only',
            cloud_id TEXT,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
        );

        -- Folders table
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            color TEXT,
            parent_id TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
        );

        -- Tags table
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT
        );

        -- Prompt-Tag junction table
        CREATE TABLE IF NOT EXISTS prompt_tags (
            prompt_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (prompt_id, tag_id),
            FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        -- Imported packs
        CREATE TABLE IF NOT EXISTS packs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            prompt_count INTEGER,
            file_path TEXT,
            imported_at INTEGER,
            created_at INTEGER NOT NULL
        );

        -- Variable memory for templates
        CREATE TABLE IF NOT EXISTS variable_memory (
            variable_name TEXT PRIMARY KEY,
            last_value TEXT,
            options TEXT,
            updated_at INTEGER
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_prompts_folder ON prompts(folder_id);
        CREATE INDEX IF NOT EXISTS idx_prompts_source ON prompts(source);
        CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);

        -- FTS for full-text search
        CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
            text, header,
            content='prompts',
            content_rowid='rowid'
        );

        -- Triggers to keep FTS in sync
        CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
            INSERT INTO prompts_fts(rowid, text, header) VALUES (NEW.rowid, NEW.text, NEW.header);
        END;

        CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
            INSERT INTO prompts_fts(prompts_fts, rowid, text, header) VALUES('delete', OLD.rowid, OLD.text, OLD.header);
        END;

        CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
            INSERT INTO prompts_fts(prompts_fts, rowid, text, header) VALUES('delete', OLD.rowid, OLD.text, OLD.header);
            INSERT INTO prompts_fts(rowid, text, header) VALUES (NEW.rowid, NEW.text, NEW.header);
        END;
        "#,
    )?;

    log::info!("Database initialized at {:?}", db_path);
    Ok(())
}

pub fn get_connection(app_handle: &AppHandle) -> Result<Connection, DbError> {
    let db_path = get_db_path(app_handle)?;
    let conn = Connection::open(&db_path)?;
    Ok(conn)
}
