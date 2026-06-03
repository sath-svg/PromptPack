//! Agent runtime: file ops, shell, and LSP plumbing for Skill Chat.
//!
//! Designed for use by an in-app coding agent. All file ops are scoped to a
//! caller-supplied workspace root; LSP servers communicate over stdio with
//! JSON-RPC + Content-Length framing, and incoming messages are surfaced to
//! the frontend via Tauri events `lsp:<handle>:msg`.

use globset::Glob;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::Mutex;
use walkdir::WalkDir;

#[allow(unused_imports)]
use tauri::Manager;

/// Suppresses the transient console window Windows would otherwise pop
/// for each spawned child process when the parent is a windowed (no
/// console) app like a Tauri release build. Without this, every
/// `git status` poll, LSP spawn, and `agent_bash` flashes a black
/// rectangle on screen.
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Windows resolves shims like `npx.cmd` only when the file extension is
/// explicit; tokio's Command does not auto-append. For known node/python
/// shim commands, prepend `cmd /C` so cmd handles PATHEXT lookup.
#[cfg(target_os = "windows")]
fn build_command(program: &str, args: &[String]) -> Command {
    const NEEDS_CMD: &[&str] = &["npx", "npm", "pnpm", "yarn", "bun", "pip", "pip3", "rustup", "go"];
    let mut c = if NEEDS_CMD.iter().any(|n| n.eq_ignore_ascii_case(program)) {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(program);
        for a in args {
            c.arg(a);
        }
        c
    } else {
        let mut c = Command::new(program);
        c.args(args);
        c
    };
    c.creation_flags(CREATE_NO_WINDOW);
    c
}

#[cfg(not(target_os = "windows"))]
fn build_command(program: &str, args: &[String]) -> Command {
    let mut c = Command::new(program);
    c.args(args);
    c
}

// ---------------------------------------------------------------------------
// Path safety
// ---------------------------------------------------------------------------

fn resolve_in_workspace(workspace: &str, p: &str) -> Result<PathBuf, String> {
    let root = PathBuf::from(workspace);
    let root = root
        .canonicalize()
        .map_err(|e| format!("workspace not found: {}", e))?;

    let target = if Path::new(p).is_absolute() {
        PathBuf::from(p)
    } else {
        root.join(p)
    };

    // Canonicalize parent first to allow not-yet-existing files (writes)
    let canon = if target.exists() {
        target
            .canonicalize()
            .map_err(|e| format!("path resolve failed: {}", e))?
    } else {
        let parent = target
            .parent()
            .ok_or_else(|| "invalid path".to_string())?;
        let parent_canon = parent
            .canonicalize()
            .map_err(|e| format!("parent dir not found: {}", e))?;
        parent_canon.join(target.file_name().unwrap_or_default())
    };

    if !canon.starts_with(&root) {
        return Err(format!(
            "path escapes workspace: {} not under {}",
            canon.display(),
            root.display()
        ));
    }
    Ok(canon)
}

// ---------------------------------------------------------------------------
// File ops
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct ReadResult {
    pub content: String,
    pub line_count: usize,
}

#[tauri::command]
pub async fn agent_read(workspace: String, path: String) -> Result<ReadResult, String> {
    let p = resolve_in_workspace(&workspace, &path)?;
    let content = tokio::fs::read_to_string(&p)
        .await
        .map_err(|e| format!("read {}: {}", p.display(), e))?;
    let line_count = content.lines().count();
    Ok(ReadResult { content, line_count })
}

#[tauri::command]
pub async fn agent_write(workspace: String, path: String, content: String) -> Result<(), String> {
    let p = resolve_in_workspace(&workspace, &path)?;
    if let Some(parent) = p.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("mkdir parent: {}", e))?;
    }
    tokio::fs::write(&p, content)
        .await
        .map_err(|e| format!("write {}: {}", p.display(), e))
}

#[derive(Debug, Deserialize)]
pub struct EditInput {
    pub workspace: String,
    pub path: String,
    pub old_string: String,
    pub new_string: String,
    #[serde(default)]
    pub replace_all: bool,
}

#[derive(Debug, Serialize)]
pub struct EditResult {
    pub replaced: usize,
    pub before: String,
    pub after: String,
}

#[tauri::command]
pub async fn agent_edit(input: EditInput) -> Result<EditResult, String> {
    let p = resolve_in_workspace(&input.workspace, &input.path)?;
    let before = tokio::fs::read_to_string(&p)
        .await
        .map_err(|e| format!("read {}: {}", p.display(), e))?;

    if input.old_string.is_empty() {
        return Err("old_string must not be empty".into());
    }

    let count = before.matches(&input.old_string).count();
    if count == 0 {
        return Err(format!(
            "old_string not found in {}",
            p.display()
        ));
    }
    if !input.replace_all && count > 1 {
        return Err(format!(
            "old_string matches {} times in {}; pass replace_all or include more context",
            count,
            p.display()
        ));
    }

    let after = if input.replace_all {
        before.replace(&input.old_string, &input.new_string)
    } else {
        before.replacen(&input.old_string, &input.new_string, 1)
    };
    tokio::fs::write(&p, &after)
        .await
        .map_err(|e| format!("write {}: {}", p.display(), e))?;

    Ok(EditResult {
        replaced: if input.replace_all { count } else { 1 },
        before,
        after,
    })
}

#[derive(Debug, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[tauri::command]
pub async fn agent_list(workspace: String, path: String) -> Result<Vec<DirEntry>, String> {
    let p = resolve_in_workspace(&workspace, &path)?;
    let mut rd = tokio::fs::read_dir(&p)
        .await
        .map_err(|e| format!("readdir {}: {}", p.display(), e))?;
    let root = PathBuf::from(&workspace).canonicalize().unwrap_or_default();
    let mut out = Vec::new();
    while let Some(entry) = rd.next_entry().await.map_err(|e| e.to_string())? {
        let ft = entry.file_type().await.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let abs = entry.path();
        let rel = abs
            .strip_prefix(&root)
            .map(|x| x.to_string_lossy().replace('\\', "/"))
            .unwrap_or_else(|_| name.clone());
        out.push(DirEntry {
            name,
            path: rel,
            is_dir: ft.is_dir(),
        });
    }
    out.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.cmp(&b.name),
    });
    Ok(out)
}

#[tauri::command]
pub async fn agent_glob(workspace: String, pattern: String) -> Result<Vec<String>, String> {
    let root = PathBuf::from(&workspace)
        .canonicalize()
        .map_err(|e| format!("workspace not found: {}", e))?;
    let glob = Glob::new(&pattern)
        .map_err(|e| format!("invalid glob: {}", e))?
        .compile_matcher();

    let mut out = Vec::new();
    for entry in WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            !e.file_name()
                .to_str()
                .map(|n| n.starts_with('.') && n != ".")
                .unwrap_or(false)
                && e.file_name() != "node_modules"
                && e.file_name() != "target"
                && e.file_name() != "dist"
        })
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() {
            continue;
        }
        let rel = entry
            .path()
            .strip_prefix(&root)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or_default();
        if glob.is_match(&rel) {
            out.push(rel);
        }
        if out.len() >= 200 {
            break;
        }
    }
    Ok(out)
}

#[derive(Debug, Serialize)]
pub struct GrepHit {
    pub path: String,
    pub line: usize,
    pub text: String,
}

#[tauri::command]
pub async fn agent_grep(
    workspace: String,
    pattern: String,
    glob_filter: Option<String>,
) -> Result<Vec<GrepHit>, String> {
    let root = PathBuf::from(&workspace)
        .canonicalize()
        .map_err(|e| format!("workspace not found: {}", e))?;
    let re = Regex::new(&pattern).map_err(|e| format!("bad regex: {}", e))?;
    let glob = if let Some(g) = glob_filter {
        Some(
            Glob::new(&g)
                .map_err(|e| format!("invalid glob: {}", e))?
                .compile_matcher(),
        )
    } else {
        None
    };

    let mut hits: Vec<GrepHit> = Vec::new();
    for entry in WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            !e.file_name()
                .to_str()
                .map(|n| n.starts_with('.') && n != ".")
                .unwrap_or(false)
                && e.file_name() != "node_modules"
                && e.file_name() != "target"
                && e.file_name() != "dist"
        })
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() {
            continue;
        }
        let rel = entry
            .path()
            .strip_prefix(&root)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or_default();
        if let Some(g) = &glob {
            if !g.is_match(&rel) {
                continue;
            }
        }
        let Ok(content) = tokio::fs::read_to_string(entry.path()).await else {
            continue;
        };
        for (i, line) in content.lines().enumerate() {
            if re.is_match(line) {
                hits.push(GrepHit {
                    path: rel.clone(),
                    line: i + 1,
                    text: line.to_string(),
                });
                if hits.len() >= 200 {
                    return Ok(hits);
                }
            }
        }
    }
    Ok(hits)
}

// ---------------------------------------------------------------------------
// Bash
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct BashResult {
    pub stdout: String,
    pub stderr: String,
    pub code: Option<i32>,
}

#[tauri::command]
pub async fn agent_bash(
    workspace: String,
    command: String,
    timeout_ms: Option<u64>,
) -> Result<BashResult, String> {
    let root = PathBuf::from(&workspace)
        .canonicalize()
        .map_err(|e| format!("workspace not found: {}", e))?;

    let timeout = std::time::Duration::from_millis(timeout_ms.unwrap_or(60_000));

    #[cfg(target_os = "windows")]
    let mut cmd = {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(&command);
        c.creation_flags(CREATE_NO_WINDOW);
        c
    };
    #[cfg(not(target_os = "windows"))]
    let mut cmd = {
        let mut c = Command::new("sh");
        c.arg("-c").arg(&command);
        c
    };

    cmd.current_dir(&root);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let fut = cmd.output();
    let output = tokio::time::timeout(timeout, fut)
        .await
        .map_err(|_| format!("command timed out after {:?}", timeout))?
        .map_err(|e| format!("spawn failed: {}", e))?;

    Ok(BashResult {
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        code: output.status.code(),
    })
}

// ---------------------------------------------------------------------------
// Workspace doc — Skillset usage instructions
// ---------------------------------------------------------------------------

/// skillset.md is dropped into the workspace root the first time a user
/// connects it. Gives the agent a stable place to read project-specific
/// conventions and tells the user how Skillset interacts with their code.
/// Filename is lowercase to match the pack-run loader (chatStore.ts) and
/// the system-prompt directive (agentTools.ts AGENT_SYSTEM_PROMPT).
const SKILLSET_DOC: &str = r#"# skillset.md

This file is auto-generated by Skillset when you connect a workspace. It
tells the in-app agent how to work inside this folder — and gives you a
single place to record project-specific rules the agent should follow.
Set Runs read this file and apply its "Project rules" section as a
top-level system directive to every step in the chain.

## How Skillset works in this folder

- All file edits the agent proposes are **staged** — you accept or
  reject each diff in the chat panel. Toggle "Accept edits: auto" if
  you want the agent to apply edits without prompting.
- Attachments are copied into `.skillset-attachments/`. Reference them
  by relative path in future messages instead of re-attaching.
- The agent has tools for `read_file`, `write_file`, `edit_file`,
  `list_dir`, `glob`, `grep`, `bash`, `lsp_diagnostics`, and
  `check_template_vars`.

## Skill packs

Skill packs (formerly "prompt packs") are reusable templates with
`{variable}` placeholders. When you run a pack:
- Variables in the prompt must be filled before sending. The chat UI
  collects values via a form; the agent can also call
  `check_template_vars` to detect unfilled placeholders mid-flow and
  ask you for them.
- If a prompt still contains `{name}` placeholders when the agent sees
  it, treat that as a missing input and stop to ask the user — never
  invent values for unfilled variables.

## Skilly (in-app mascot)

Skilly is a tamagotchi-style companion that lives in the Skillset
sidebar. The user can Feed / Play / Sleep / Wake Skilly from the Skilly
tab; stats decay over time and recover via those actions.

The agent receives Skilly's live stats (hunger / happy / energy / mode)
as a system-prompt block on every turn, so when the user asks "how is
Skilly?" / "what's Skilly's hunger?" / "is Skilly okay?", answer
directly from that snapshot — do not call any tools. Keep the reply
short and warm; flag any stat below 25 and suggest the matching action:
low hunger → Feed, low happy → Play, low energy → Sleep. If Skilly is
passed out, say so and mention the recovery paths (upgrade or wait for
the next monthly credit refresh).

## Project rules (edit this section)

<!-- Add anything you want the agent to always follow here:
     - Code style (e.g. "use tabs, not spaces")
     - Forbidden actions (e.g. "never run rm -rf")
     - Important files / entry points
     - Test commands -->

## Files / structure

<!-- Optional: short map of the workspace so the agent doesn't need to
     glob the whole tree on every session. -->
"#;

#[derive(Debug, Serialize)]
pub struct InitDocResult {
    pub created: bool,
    pub path: String,
}

#[tauri::command]
pub async fn agent_init_workspace_doc(workspace: String) -> Result<InitDocResult, String> {
    let root = PathBuf::from(&workspace)
        .canonicalize()
        .map_err(|e| format!("workspace not found: {}", e))?;
    let target = root.join("skillset.md");
    if target.exists() {
        return Ok(InitDocResult {
            created: false,
            path: "skillset.md".into(),
        });
    }
    tokio::fs::write(&target, SKILLSET_DOC)
        .await
        .map_err(|e| format!("write skillset.md: {}", e))?;
    Ok(InitDocResult {
        created: true,
        path: "skillset.md".into(),
    })
}

// ---------------------------------------------------------------------------
// Attachments — copy external files into the workspace
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct AttachmentResult {
    pub copied: Vec<String>, // workspace-relative paths
    pub failed: Vec<String>, // absolute paths that couldn't be copied
}

/// Copy external files into `<workspace>/.skillset-attachments/<filename>`
/// so the agent can `read_file` them with locally-scoped tools instead of
/// inlining their contents into the LLM context. Conflicts are resolved
/// by appending a numeric suffix.
#[tauri::command]
pub async fn agent_attach_files(
    workspace: String,
    sources: Vec<String>,
) -> Result<AttachmentResult, String> {
    let root = PathBuf::from(&workspace)
        .canonicalize()
        .map_err(|e| format!("workspace not found: {}", e))?;

    let dest_dir = root.join(".skillset-attachments");
    tokio::fs::create_dir_all(&dest_dir)
        .await
        .map_err(|e| format!("create attachments dir: {}", e))?;

    let mut copied = Vec::new();
    let mut failed = Vec::new();

    for src in sources {
        let src_path = PathBuf::from(&src);
        let filename = match src_path.file_name() {
            Some(n) => n.to_string_lossy().into_owned(),
            None => {
                failed.push(src);
                continue;
            }
        };

        // Resolve filename collision: file.txt → file (1).txt → file (2).txt
        let stem = std::path::Path::new(&filename)
            .file_stem()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| filename.clone());
        let ext = std::path::Path::new(&filename)
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();

        let mut chosen = filename.clone();
        let mut i = 1;
        while dest_dir.join(&chosen).exists() {
            chosen = format!("{} ({}){}", stem, i, ext);
            i += 1;
            if i > 999 {
                break;
            }
        }
        let target = dest_dir.join(&chosen);
        match tokio::fs::copy(&src_path, &target).await {
            Ok(_) => {
                copied.push(format!(".skillset-attachments/{}", chosen));
            }
            Err(_) => {
                failed.push(src);
            }
        }
    }

    Ok(AttachmentResult { copied, failed })
}

// ---------------------------------------------------------------------------
// Git
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Default)]
pub struct GitStatus {
    pub branch: Option<String>,
    pub modified: u32,
    pub untracked: u32,
    pub ahead: u32,
    pub behind: u32,
    pub clean: bool,
    pub is_repo: bool,
}

/// Snapshot of the workspace's git state. Returns is_repo=false (no error)
/// when the workspace is not a git repository so the UI can hide git
/// affordances quietly.
#[tauri::command]
pub async fn agent_git_status(workspace: String) -> Result<GitStatus, String> {
    let root = PathBuf::from(&workspace)
        .canonicalize()
        .map_err(|e| format!("workspace not found: {}", e))?;

    // Quick is-repo check
    let mut is_repo_cmd = build_command("git", &["rev-parse".into(), "--is-inside-work-tree".into()]);
    is_repo_cmd.current_dir(&root);
    is_repo_cmd.stdout(Stdio::null());
    is_repo_cmd.stderr(Stdio::null());
    let repo_ok = match is_repo_cmd.status().await {
        Ok(s) => s.success(),
        Err(_) => false,
    };
    if !repo_ok {
        return Ok(GitStatus::default());
    }

    // Branch
    let mut branch_cmd = build_command(
        "git",
        &["rev-parse".into(), "--abbrev-ref".into(), "HEAD".into()],
    );
    branch_cmd.current_dir(&root);
    branch_cmd.stdout(Stdio::piped());
    branch_cmd.stderr(Stdio::null());
    let branch = branch_cmd
        .output()
        .await
        .ok()
        .and_then(|o| {
            if o.status.success() {
                Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
            } else {
                None
            }
        });

    // Status porcelain
    let mut st_cmd = build_command(
        "git",
        &["status".into(), "--porcelain=v1".into(), "--branch".into()],
    );
    st_cmd.current_dir(&root);
    st_cmd.stdout(Stdio::piped());
    st_cmd.stderr(Stdio::null());
    let out = st_cmd
        .output()
        .await
        .map_err(|e| format!("git status: {}", e))?;
    let text = String::from_utf8_lossy(&out.stdout);

    let mut modified = 0u32;
    let mut untracked = 0u32;
    let mut ahead = 0u32;
    let mut behind = 0u32;

    for line in text.lines() {
        if let Some(rest) = line.strip_prefix("## ") {
            // ## branch...origin/branch [ahead 1, behind 2]
            if let Some(start) = rest.find('[') {
                let bracket = &rest[start + 1..rest.len().saturating_sub(1)];
                for part in bracket.split(',').map(|p| p.trim()) {
                    if let Some(n) = part.strip_prefix("ahead ") {
                        ahead = n.parse().unwrap_or(0);
                    } else if let Some(n) = part.strip_prefix("behind ") {
                        behind = n.parse().unwrap_or(0);
                    }
                }
            }
        } else if line.starts_with("?? ") {
            untracked += 1;
        } else if !line.is_empty() {
            modified += 1;
        }
    }

    Ok(GitStatus {
        is_repo: true,
        branch,
        modified,
        untracked,
        ahead,
        behind,
        clean: modified == 0 && untracked == 0,
    })
}

// ---------------------------------------------------------------------------
// Tool detection & install
// ---------------------------------------------------------------------------

/// Check whether a binary is reachable on PATH. Uses `where` on Windows
/// and `command -v` on Unix to avoid spawning the tool itself.
#[tauri::command]
pub async fn agent_check_tool(name: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    let mut cmd = {
        let mut c = Command::new("where");
        c.arg(&name);
        c.creation_flags(CREATE_NO_WINDOW);
        c
    };
    #[cfg(not(target_os = "windows"))]
    let mut cmd = {
        let mut c = Command::new("sh");
        c.arg("-c").arg(format!("command -v {}", shell_escape(&name)));
        c
    };
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());
    let status = cmd.status().await.map_err(|e| e.to_string())?;
    Ok(status.success())
}

#[cfg(not(target_os = "windows"))]
fn shell_escape(s: &str) -> String {
    if s.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | '/')) {
        s.to_string()
    } else {
        format!("'{}'", s.replace('\'', "'\\''"))
    }
}

#[derive(Debug, Deserialize)]
pub struct InstallInput {
    pub installer: String,        // "npm" | "rustup" | "go" | "pip"
    pub package: String,          // package name
    pub progress_event: String,   // event name to emit lines on
}

#[derive(Debug, Serialize)]
pub struct InstallResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub code: Option<i32>,
}

#[tauri::command]
pub async fn agent_install_tool(
    app: AppHandle,
    input: InstallInput,
) -> Result<InstallResult, String> {
    let (program, args): (&str, Vec<String>) = match input.installer.as_str() {
        "npm" => ("npm", vec!["install".into(), "-g".into(), input.package.clone()]),
        "pip" => ("pip", vec!["install".into(), "--user".into(), input.package.clone()]),
        "rustup" => (
            "rustup",
            vec!["component".into(), "add".into(), input.package.clone()],
        ),
        "go" => ("go", vec!["install".into(), input.package.clone()]),
        other => return Err(format!("unknown installer: {}", other)),
    };

    let mut cmd = build_command(program, &args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("spawn {}: {}", program, e))?;

    let stdout = child.stdout.take().ok_or("no stdout")?;
    let stderr = child.stderr.take().ok_or("no stderr")?;

    let event_name = input.progress_event.clone();
    let app_clone = app.clone();
    let stdout_handle = tokio::spawn(async move {
        let mut reader = BufReader::new(stdout);
        let mut buf = String::new();
        let mut combined = String::new();
        loop {
            buf.clear();
            match reader.read_line(&mut buf).await {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    let _ = app_clone.emit(&event_name, buf.trim_end());
                    combined.push_str(&buf);
                }
            }
        }
        combined
    });

    let event_name2 = input.progress_event.clone();
    let app_clone2 = app.clone();
    let stderr_handle = tokio::spawn(async move {
        let mut reader = BufReader::new(stderr);
        let mut buf = String::new();
        let mut combined = String::new();
        loop {
            buf.clear();
            match reader.read_line(&mut buf).await {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    let _ = app_clone2.emit(&event_name2, buf.trim_end());
                    combined.push_str(&buf);
                }
            }
        }
        combined
    });

    let status = child.wait().await.map_err(|e| e.to_string())?;
    let stdout_text = stdout_handle.await.unwrap_or_default();
    let stderr_text = stderr_handle.await.unwrap_or_default();

    Ok(InstallResult {
        success: status.success(),
        stdout: stdout_text,
        stderr: stderr_text,
        code: status.code(),
    })
}

// ---------------------------------------------------------------------------
// LSP
// ---------------------------------------------------------------------------

pub struct LspProcess {
    child: Child,
    stdin: ChildStdin,
}

#[derive(Default)]
pub struct LspState {
    pub processes: Mutex<HashMap<String, Arc<Mutex<LspProcess>>>>,
}

#[derive(Debug, Deserialize)]
pub struct LspSpawnInput {
    pub handle: String,
    pub command: String,
    pub args: Vec<String>,
    pub root: String,
}

#[tauri::command]
pub async fn lsp_spawn(
    app: AppHandle,
    state: State<'_, LspState>,
    input: LspSpawnInput,
) -> Result<(), String> {
    let mut cmd = build_command(&input.command, &input.args);
    cmd.current_dir(&input.root)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = cmd
        .spawn()
        .map_err(|e| format!("spawn {}: {}", input.command, e))?;

    let stdin = child.stdin.take().ok_or("no stdin")?;
    let stdout = child.stdout.take().ok_or("no stdout")?;
    let stderr = child.stderr.take().ok_or("no stderr")?;

    let handle_id = input.handle.clone();
    let app_clone = app.clone();
    let stdout_handle = handle_id.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout);
        loop {
            // Parse Content-Length headers
            let mut content_length: Option<usize> = None;
            loop {
                let mut header = String::new();
                let n = match reader.read_line(&mut header).await {
                    Ok(n) => n,
                    Err(_) => return,
                };
                if n == 0 {
                    return;
                }
                let trimmed = header.trim_end();
                if trimmed.is_empty() {
                    break;
                }
                if let Some(rest) = trimmed.strip_prefix("Content-Length:") {
                    content_length = rest.trim().parse().ok();
                }
            }
            let len = match content_length {
                Some(l) => l,
                None => continue,
            };
            let mut buf = vec![0u8; len];
            if reader.read_exact(&mut buf).await.is_err() {
                return;
            }
            if let Ok(text) = String::from_utf8(buf) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                    let _ = app_clone.emit(&format!("lsp:{}:msg", stdout_handle), json);
                }
            }
        }
    });

    let app_clone2 = app.clone();
    let stderr_handle = handle_id.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line).await {
                Ok(0) | Err(_) => return,
                Ok(_) => {
                    let _ =
                        app_clone2.emit(&format!("lsp:{}:stderr", stderr_handle), line.trim());
                }
            }
        }
    });

    let mut map = state.processes.lock().await;
    map.insert(
        handle_id,
        Arc::new(Mutex::new(LspProcess { child, stdin })),
    );
    Ok(())
}

#[tauri::command]
pub async fn lsp_send(
    state: State<'_, LspState>,
    handle: String,
    message: String,
) -> Result<(), String> {
    let proc = {
        let map = state.processes.lock().await;
        map.get(&handle)
            .cloned()
            .ok_or_else(|| format!("lsp handle not found: {}", handle))?
    };
    let mut p = proc.lock().await;
    let framed = format!(
        "Content-Length: {}\r\n\r\n{}",
        message.as_bytes().len(),
        message
    );
    p.stdin
        .write_all(framed.as_bytes())
        .await
        .map_err(|e| format!("lsp write: {}", e))?;
    p.stdin.flush().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn lsp_stop(state: State<'_, LspState>, handle: String) -> Result<(), String> {
    let proc = {
        let mut map = state.processes.lock().await;
        map.remove(&handle)
    };
    if let Some(proc) = proc {
        let mut p = proc.lock().await;
        let _ = p.child.kill().await;
    }
    Ok(())
}

// ─── Web tools (Phase 8) ───────────────────────────────────────────────────
//
// `agent_web_fetch` — fetch a URL, follow up to 10 redirects, cap response
// at 5 MB. Returns final URL + status + content-type + body. Used by the
// agent loop's `web_fetch` tool to pull live page text without exposing
// the user's full network stack to the model.
//
// `agent_http` — generic verb/headers/body request, same client. Same caps
// apply; intended for JSON APIs the model wants to talk to.
//
// Both build a fresh `reqwest::Client` per call so the global proxy_fetch
// allowlist + 600s read timeout don't bleed into web traffic. Web traffic
// uses a 60s timeout and a 5 MB body cap by default.

const WEB_FETCH_MAX_BYTES: usize = 5 * 1024 * 1024;
const WEB_FETCH_TIMEOUT_SECS: u64 = 60;

#[derive(Debug, Serialize)]
pub struct WebFetchResult {
    pub status: u16,
    /// Final URL after redirect chain.
    pub url: String,
    pub content_type: Option<String>,
    /// Body decoded as UTF-8 (lossy). Truncation note appended when the
    /// upstream payload exceeded `WEB_FETCH_MAX_BYTES`.
    pub body: String,
    pub truncated: bool,
}

fn build_web_client() -> Result<reqwest::Client, String> {
    // Browser-spoofed user-agent. The previous "Skillset/1.0 …" UA was
    // getting rejected by anti-bot layers (Cloudflare, Akamai) on
    // ~half the sites the agent tried, returning challenge HTML
    // instead of content — looked "empty" to the model and triggered
    // expensive retry loops. A real Chrome UA gets past most casual
    // filters; sites that still gate (CAPTCHA, JS challenge) need a
    // search-API based tool which is on the roadmap.
    //
    // gzip/brotli/deflate features (Cargo.toml) auto-decompress
    // responses; without them, servers like Yahoo Finance returned
    // gzipped bodies that we lossy-decoded into junk.
    const CHROME_UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
    let mut default_headers = reqwest::header::HeaderMap::new();
    default_headers.insert(
        reqwest::header::ACCEPT,
        reqwest::header::HeaderValue::from_static(
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        ),
    );
    default_headers.insert(
        reqwest::header::ACCEPT_LANGUAGE,
        reqwest::header::HeaderValue::from_static("en-US,en;q=0.9"),
    );
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(WEB_FETCH_TIMEOUT_SECS))
        .redirect(reqwest::redirect::Policy::limited(10))
        .user_agent(CHROME_UA)
        .default_headers(default_headers)
        .build()
        .map_err(|e| format!("client build: {}", e))
}

#[tauri::command]
pub async fn agent_web_fetch(url: String) -> Result<WebFetchResult, String> {
    let parsed = url::Url::parse(&url).map_err(|e| format!("invalid url: {}", e))?;
    match parsed.scheme() {
        "http" | "https" => {}
        s => return Err(format!("unsupported scheme: {}", s)),
    }
    let client = build_web_client()?;
    let response = client
        .get(parsed.clone())
        .send()
        .await
        .map_err(|e| format!("request: {}", e))?;
    let status = response.status().as_u16();
    let final_url = response.url().to_string();
    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("body read: {}", e))?;
    let truncated = bytes.len() > WEB_FETCH_MAX_BYTES;
    let slice: &[u8] = if truncated { &bytes[..WEB_FETCH_MAX_BYTES] } else { &bytes };
    let mut body = String::from_utf8_lossy(slice).into_owned();
    if truncated {
        body.push_str(&format!(
            "\n…[truncated; {} bytes total, kept first {}]",
            bytes.len(),
            WEB_FETCH_MAX_BYTES
        ));
    }
    Ok(WebFetchResult {
        status,
        url: final_url,
        content_type,
        body,
        truncated,
    })
}

#[derive(Debug, Deserialize)]
pub struct AgentHttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Option<HashMap<String, String>>,
    pub body: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AgentHttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub truncated: bool,
}

#[tauri::command]
pub async fn agent_http(input: AgentHttpRequest) -> Result<AgentHttpResponse, String> {
    let parsed = url::Url::parse(&input.url).map_err(|e| format!("invalid url: {}", e))?;
    match parsed.scheme() {
        "http" | "https" => {}
        s => return Err(format!("unsupported scheme: {}", s)),
    }
    let method: reqwest::Method = input
        .method
        .parse()
        .map_err(|_| format!("invalid method: {}", input.method))?;
    let client = build_web_client()?;
    let mut req_builder = client.request(method, parsed);
    if let Some(headers) = input.headers {
        for (k, v) in headers {
            req_builder = req_builder.header(k, v);
        }
    }
    if let Some(body) = input.body {
        req_builder = req_builder.body(body);
    }
    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("request: {}", e))?;
    let status = response.status().as_u16();
    let mut response_headers = HashMap::new();
    for (k, v) in response.headers() {
        if let Ok(value) = v.to_str() {
            response_headers.insert(k.as_str().to_string(), value.to_string());
        }
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("body read: {}", e))?;
    let truncated = bytes.len() > WEB_FETCH_MAX_BYTES;
    let slice: &[u8] = if truncated { &bytes[..WEB_FETCH_MAX_BYTES] } else { &bytes };
    let mut body = String::from_utf8_lossy(slice).into_owned();
    if truncated {
        body.push_str(&format!(
            "\n…[truncated; {} bytes total, kept first {}]",
            bytes.len(),
            WEB_FETCH_MAX_BYTES
        ));
    }
    Ok(AgentHttpResponse {
        status,
        headers: response_headers,
        body,
        truncated,
    })
}

// ─── PDF generation (Phase 10) ─────────────────────────────────────────────
//
// `agent_pdf_generate` — write a basic A4 PDF from plain text or
// lightly-formatted markdown to a workspace-relative path. Pure Rust
// via `printpdf`; no Chrome / wkhtmltopdf dependency. Layout is
// intentionally minimal (built-in Helvetica, fixed margins, simple
// word wrap, `#`/`##` headings, blank-line paragraph breaks). For
// rich HTML/CSS/images, ship the chrome-headless variant later.
//
// Output is binary so we DO NOT route through the DiffPanel
// accept/reject gate (that's text-only). Tool result returns the file
// path + byte count; user opens via OS default.

#[derive(Debug, Serialize)]
pub struct PdfGenerateResult {
    pub path: String,
    pub bytes: usize,
    pub pages: usize,
}

#[tauri::command]
pub async fn agent_pdf_generate(
    workspace: String,
    path: String,
    content: String,
    title: Option<String>,
) -> Result<PdfGenerateResult, String> {
    use printpdf::{BuiltinFont, Mm, PdfDocument};
    use std::io::BufWriter;

    let resolved = resolve_in_workspace(&workspace, &path)?;
    if !resolved
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.eq_ignore_ascii_case("pdf"))
        .unwrap_or(false)
    {
        return Err(format!(
            "agent_pdf_generate: path must end in .pdf, got {}",
            resolved.display()
        ));
    }

    if let Some(parent) = resolved.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("mkdir {}: {}", parent.display(), e))?;
    }

    // A4 portrait = 210 × 297 mm. Margins ~20mm each side.
    // printpdf's `Mm` and `use_text` font_size are `f32`, so all the
    // page-geometry constants stay in f32 to avoid casts at every
    // call site.
    const PAGE_W_MM: f32 = 210.0;
    const PAGE_H_MM: f32 = 297.0;
    const MARGIN_X_MM: f32 = 20.0;
    const MARGIN_TOP_MM: f32 = 25.0;
    const MARGIN_BOTTOM_MM: f32 = 20.0;
    const BODY_FONT_SIZE: f32 = 11.0;
    const H1_FONT_SIZE: f32 = 18.0;
    const H2_FONT_SIZE: f32 = 14.0;
    const LINE_HEIGHT_BODY_MM: f32 = 5.5;
    const LINE_HEIGHT_H1_MM: f32 = 9.0;
    const LINE_HEIGHT_H2_MM: f32 = 7.5;
    const PARA_GAP_MM: f32 = 3.0;

    let doc_title = title.as_deref().unwrap_or("Document");
    let (doc, page1, layer1) =
        PdfDocument::new(doc_title, Mm(PAGE_W_MM), Mm(PAGE_H_MM), "Layer 1");
    let body_font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| format!("font: {}", e))?;
    let bold_font = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| format!("font: {}", e))?;

    let mut current_layer = doc.get_page(page1).get_layer(layer1);
    let mut y = PAGE_H_MM - MARGIN_TOP_MM;
    let mut pages = 1usize;

    fn approx_char_width_mm(font_size_pt: f32) -> f32 {
        // Helvetica ≈ 0.5 of em-square width on average. 1pt = 0.353mm.
        font_size_pt * 0.5 * 0.353
    }
    let usable_width_mm = PAGE_W_MM - 2.0 * MARGIN_X_MM;

    fn wrap_line(line: &str, max_chars: usize) -> Vec<String> {
        if line.is_empty() {
            return vec![String::new()];
        }
        let mut out: Vec<String> = Vec::new();
        let mut buf = String::new();
        for word in line.split_whitespace() {
            if buf.is_empty() {
                buf.push_str(word);
                continue;
            }
            if buf.len() + 1 + word.len() <= max_chars {
                buf.push(' ');
                buf.push_str(word);
            } else {
                out.push(std::mem::take(&mut buf));
                buf.push_str(word);
            }
        }
        if !buf.is_empty() {
            out.push(buf);
        }
        if out.is_empty() {
            out.push(String::new());
        }
        out
    }

    let lines: Vec<&str> = content.split('\n').collect();
    let mut i = 0usize;
    while i < lines.len() {
        let raw = lines[i];
        let trimmed = raw.trim_end();
        i += 1;

        if trimmed.trim().is_empty() {
            y -= PARA_GAP_MM;
            continue;
        }

        let (text, font_size, line_height_mm, font) = if let Some(rest) =
            trimmed.strip_prefix("# ")
        {
            (rest, H1_FONT_SIZE, LINE_HEIGHT_H1_MM, &bold_font)
        } else if let Some(rest) = trimmed.strip_prefix("## ") {
            (rest, H2_FONT_SIZE, LINE_HEIGHT_H2_MM, &bold_font)
        } else {
            (trimmed, BODY_FONT_SIZE, LINE_HEIGHT_BODY_MM, &body_font)
        };

        let max_chars =
            (usable_width_mm / approx_char_width_mm(font_size)).floor() as usize;
        let max_chars = max_chars.max(20);
        let wrapped = wrap_line(text, max_chars);

        for chunk in wrapped {
            if y < MARGIN_BOTTOM_MM + line_height_mm {
                let (new_page, new_layer) = doc.add_page(
                    Mm(PAGE_W_MM),
                    Mm(PAGE_H_MM),
                    format!("Layer {}", pages + 1),
                );
                current_layer = doc.get_page(new_page).get_layer(new_layer);
                y = PAGE_H_MM - MARGIN_TOP_MM;
                pages += 1;
            }
            current_layer.use_text(chunk, font_size, Mm(MARGIN_X_MM), Mm(y), font);
            y -= line_height_mm;
        }
    }

    let file = std::fs::File::create(&resolved)
        .map_err(|e| format!("create {}: {}", resolved.display(), e))?;
    let mut writer = BufWriter::new(file);
    doc.save(&mut writer).map_err(|e| format!("pdf save: {}", e))?;

    let metadata = std::fs::metadata(&resolved)
        .map_err(|e| format!("stat {}: {}", resolved.display(), e))?;
    Ok(PdfGenerateResult {
        path: path.clone(),
        bytes: metadata.len() as usize,
        pages,
    })
}

