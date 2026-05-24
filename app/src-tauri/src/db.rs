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

        -- Skill Chat orchestrator: skills (workflow definitions, may sync to Convex)
        CREATE TABLE IF NOT EXISTS skills (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            goal_template TEXT,
            planner_model_id TEXT,
            planner_hints TEXT,        -- JSON: { maxSubtasks, allowedTools[], defaultTier, seedSteps?[] }
            source_pack_id TEXT,
            workflow_json TEXT,        -- frozen plan from a successful run, optional
            cloud_id TEXT,             -- Convex skills._id when synced
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_skills_cloud ON skills(cloud_id);

        -- Skill Chat orchestrator: runs (one execution of a skill or ad-hoc goal)
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            skill_id TEXT,
            workspace TEXT,
            goal TEXT NOT NULL,
            status TEXT NOT NULL,      -- queued|planning|running|merging|done|failed|cancelled
            total_credits INTEGER DEFAULT 0,
            reserve_id TEXT,           -- credit hold id (api/src/credits.ts)
            error TEXT,
            created_at INTEGER NOT NULL,
            ended_at INTEGER,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_runs_skill ON runs(skill_id);
        CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
        CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at DESC);

        -- Skill Chat orchestrator: subtasks (planner-emitted units of work)
        CREATE TABLE IF NOT EXISTS subtasks (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            parent_id TEXT,
            ord INTEGER NOT NULL,
            title TEXT,
            instruction TEXT NOT NULL,
            complexity_hint TEXT,      -- planner: easy|moderate|complex
            reasoning_hint TEXT,       -- planner: none|light|deep
            needs_tools TEXT,          -- JSON array of tool names
            depends_on TEXT,           -- JSON array of subtask ids
            status TEXT NOT NULL,      -- pending|routing|running|done|retry|escalated|failed
            preset_json TEXT,          -- chosen ModelPreset (JSON)
            effort TEXT,               -- low|medium|high|null
            output TEXT,
            confidence REAL,
            credits INTEGER,
            reasoning_tokens INTEGER,
            retries INTEGER DEFAULT 0,
            error TEXT,
            started_at INTEGER,
            ended_at INTEGER,
            FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES subtasks(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_subtasks_run ON subtasks(run_id, ord);
        CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);

        -- Skill Chat orchestrator: canonical TaskState per run
        CREATE TABLE IF NOT EXISTS task_memory (
            run_id TEXT PRIMARY KEY,
            state_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
        );

        -- Routing telemetry — feeds Phase 2 retraining of the LR route
        -- head. Logged on every classification; settled when the run
        -- completes (success/fail/cancel + thumbs-up/down + reprompt
        -- detection). Stays local; export via `telemetry_export`
        -- command before retraining offline.
        CREATE TABLE IF NOT EXISTS route_telemetry (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            word_count INTEGER,
            predicted_route TEXT NOT NULL,    -- chat | agent | workflow
            confidence REAL NOT NULL,         -- max softmax prob (Phase 3 sets this)
            fallback_used INTEGER DEFAULT 0,  -- 1 = LLM fallback fired
            fallback_route TEXT,              -- LLM's verdict (may differ)
            actual_route TEXT,                -- what dispatch actually used
            completed INTEGER,                -- 0 pending | 1 done | -1 failed/cancelled
            reprompt_within INTEGER,          -- seconds until next user msg, NULL if none
            user_signal TEXT,                 -- thumbs_up | thumbs_down
            created_at INTEGER NOT NULL,
            settled_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_route_telemetry_created ON route_telemetry(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_route_telemetry_route ON route_telemetry(predicted_route);

        -- Multi-conversation Skill Chat (max 3 concurrent, parallel runs).
        -- Each row keys an independent slice of chatStore/runStore/agentStore.
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            workspace TEXT,
            selected_pack_id TEXT,
            agent_mode INTEGER DEFAULT 0,
            auto_accept_edits INTEGER DEFAULT 0,
            last_active_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_conversations_last_active ON conversations(last_active_at DESC);

        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            blocks_json TEXT,
            model_id TEXT,
            tier TEXT,
            effort TEXT,
            pack_name TEXT,
            attachments_json TEXT,
            telemetry_id TEXT,
            user_signal TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_chat_messages_convo ON chat_messages(conversation_id, created_at);
        "#,
    )?;

    // Migration v1: add runs.conversation_id (FK SET NULL so historical runs
    // survive when their conversation is deleted). ADD COLUMN has no
    // IF NOT EXISTS, so gate via PRAGMA user_version.
    let user_version: i64 = conn
        .query_row("PRAGMA user_version", [], |r| r.get(0))
        .unwrap_or(0);
    if user_version < 1 {
        // SQLite ALTER ADD COLUMN does not support REFERENCES inline reliably
        // across versions; add the column plain + create an index. FK is
        // logical (enforced at application layer).
        let already_present: bool = conn
            .prepare("PRAGMA table_info(runs)")
            .and_then(|mut stmt| {
                let rows = stmt.query_map([], |r| r.get::<_, String>(1))?;
                let mut found = false;
                for name in rows.flatten() {
                    if name == "conversation_id" {
                        found = true;
                        break;
                    }
                }
                Ok(found)
            })
            .unwrap_or(false);
        if !already_present {
            conn.execute("ALTER TABLE runs ADD COLUMN conversation_id TEXT", [])?;
        }
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_runs_convo ON runs(conversation_id, created_at DESC)",
            [],
        )?;
        conn.execute("PRAGMA user_version = 1", [])?;
        log::info!("DB migration applied: user_version = 1 (runs.conversation_id)");
    }

    log::info!("Database initialized at {:?}", db_path);
    Ok(())
}

pub fn get_connection(app_handle: &AppHandle) -> Result<Connection, DbError> {
    let db_path = get_db_path(app_handle)?;
    let conn = Connection::open(&db_path)?;
    Ok(conn)
}
