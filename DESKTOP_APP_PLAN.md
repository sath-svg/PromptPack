# PromptPack Desktop App - Implementation Plan

## Overview

A cross-platform desktop application (Windows/Mac) that combines the best of the PromptPack popup extension and web dashboard, inspired by PromptNest's offline-first approach. The app serves as the central hub for prompt management, import/export, organization, and cloud sync.

---

## Tech Stack Recommendation

### Framework: **Tauri 2.0**
- **Why Tauri over Electron?**
  - 10-100x smaller bundle size (~5MB vs 150MB+)
  - Native performance with Rust backend
  - Lower memory footprint
  - Built-in updater, system tray, and native dialogs
  - Security-first architecture

### Frontend: **React + TypeScript + Vite**
- Reuse existing web dashboard components
- TailwindCSS for styling consistency
- Shared design system with web/extension

### Backend/Storage:
- **SQLite** (via Tauri's `tauri-plugin-sql`) for local database
- **R2 + Convex** for cloud sync (existing infrastructure)
- Local file system for `.pmtpk` exports

### State Management:
- **Zustand** for lightweight global state
- React Query for server state sync

---

## Core Features

### 1. Prompt Library (Main View)

| Feature | Description | Priority |
|---------|-------------|----------|
| Prompt Grid/List View | Toggle between card grid and compact list | P0 |
| Source Filtering | Filter by ChatGPT, Claude, Gemini, etc. | P0 |
| Search | Full-text search across all prompts | P0 |
| Folders/Projects | Organize prompts into custom folders | P0 |
| Tags | Add multiple tags to prompts | P1 |
| Favorites | Star important prompts | P1 |
| Sort Options | By date, name, source, frequency of use | P1 |

### 2. Prompt Editor

| Feature | Description | Priority |
|---------|-------------|----------|
| Rich Text Editor | Edit prompt content with formatting | P0 |
| Variable Templates | `{{variable}}` syntax with type hints | P0 |
| Variable Memory | Remember last used values | P1 |
| Dropdown Variables | `{{model:gpt-4,claude,gemini}}` syntax | P1 |
| Version History | Track changes over time | P2 |
| Notes/Comments | Attach context and tips | P1 |
| AI Classification | Auto-generate 1-2 word headers | P0 |

### 3. Import/Export Hub

| Feature | Description | Priority |
|---------|-------------|----------|
| Import .pmtpk | Load encrypted PromptPack files | P0 |
| Export .pmtpk | Create shareable pack files | P0 |
| Password Protection | AES-GCM encryption for exports | P0 |
| Import from Markdown | Load `.md` or `.prompt.md` files | P1 |
| Export to Markdown | Export individual or bulk to `.md` | P1 |
| Import from JSON | Generic prompt JSON import | P1 |
| Export to JSON | For integrations/backup | P1 |
| Bulk Operations | Select multiple for export/delete | P0 |
| Drag & Drop | Drop files to import | P0 |

### 4. Cloud Sync (Existing Infrastructure)

| Feature | Description | Priority |
|---------|-------------|----------|
| Convex Sync | Sync with web dashboard | P0 |
| Conflict Resolution | Handle merge conflicts gracefully | P1 |
| Offline Mode | Full functionality without internet | P0 |
| Sync Status | Visual indicator of sync state | P0 |
| Selective Sync | Choose which folders to sync | P2 |

### 5. Global Quick Access (PromptNest-inspired)

| Feature | Description | Priority |
|---------|-------------|----------|
| Global Hotkey | `Cmd/Ctrl + Shift + P` floating search | P0 |
| Floating Window | Minimal search UI overlay | P0 |
| One-Click Copy | Copy prompt to clipboard | P0 |
| Variable Form | Quick input for template variables | P0 |
| Recent Prompts | Show recently used | P1 |
| Pin to Top | System tray for quick access | P0 |

### 6. Settings & Preferences

| Feature | Description | Priority |
|---------|-------------|----------|
| Theme | Light/Dark/System | P0 |
| Hotkey Config | Customize global shortcut | P1 |
| Storage Location | Choose local data folder | P1 |
| Backup/Restore | Manual backup creation | P1 |
| Account Management | Login/logout, plan info | P0 |
| Subscription | Upgrade/manage plan | P1 |

---

## Architecture

```
promptpack-desktop/
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── main.rs            # Entry point
│   │   ├── commands/          # Tauri commands (IPC)
│   │   │   ├── prompts.rs     # CRUD operations
│   │   │   ├── sync.rs        # Cloud sync logic
│   │   │   ├── crypto.rs      # Encryption/decryption
│   │   │   └── files.rs       # File system operations
│   │   ├── db/                # SQLite schema & queries
│   │   └── state.rs           # App state management
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                        # React frontend
│   ├── components/
│   │   ├── Layout/            # App shell, sidebar, header
│   │   ├── PromptList/        # Grid/list views
│   │   ├── PromptEditor/      # Edit modal/page
│   │   ├── ImportExport/      # Import/export dialogs
│   │   ├── QuickAccess/       # Floating search window
│   │   └── Settings/          # Preferences UI
│   ├── hooks/
│   │   ├── usePrompts.ts      # Prompt data hooks
│   │   ├── useSync.ts         # Sync state
│   │   └── useHotkeys.ts      # Keyboard shortcuts
│   ├── lib/
│   │   ├── tauri.ts           # Tauri IPC wrappers
│   │   ├── crypto.ts          # Client-side crypto
│   │   └── api.ts             # Convex API client
│   ├── stores/
│   │   ├── promptStore.ts     # Zustand prompt state
│   │   ├── authStore.ts       # Auth state
│   │   └── settingsStore.ts   # User preferences
│   ├── pages/
│   │   ├── Library.tsx        # Main prompt library
│   │   ├── Editor.tsx         # Prompt editing
│   │   ├── Import.tsx         # Import wizard
│   │   ├── Export.tsx         # Export wizard
│   │   └── Settings.tsx       # App settings
│   └── App.tsx
│
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Database Schema (SQLite)

```sql
-- Prompts table
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  header TEXT,                    -- AI-generated 1-2 word summary
  source TEXT,                    -- chatgpt, claude, gemini, etc.
  url TEXT,                       -- Original source URL
  folder_id TEXT,                 -- FK to folders
  is_favorite INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'pending',  -- pending, synced, local-only
  cloud_id TEXT,                  -- Convex document ID
  FOREIGN KEY (folder_id) REFERENCES folders(id)
);

-- Folders/Projects
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,                      -- Emoji or icon name
  color TEXT,                     -- Hex color
  parent_id TEXT,                 -- For nested folders
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES folders(id)
);

-- Tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT
);

-- Prompt-Tag junction
CREATE TABLE prompt_tags (
  prompt_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (prompt_id, tag_id),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Imported Packs (from .pmtpk files)
CREATE TABLE packs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prompt_count INTEGER,
  file_path TEXT,                 -- Original import path
  imported_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Prompt Variables (remembered values)
CREATE TABLE variable_memory (
  variable_name TEXT PRIMARY KEY,
  last_value TEXT,
  options TEXT,                   -- JSON array for dropdown options
  updated_at INTEGER
);

-- Sync queue for offline operations
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,        -- create, update, delete
  entity_type TEXT NOT NULL,      -- prompt, folder, tag
  entity_id TEXT NOT NULL,
  payload TEXT,                   -- JSON data
  created_at INTEGER NOT NULL,
  retries INTEGER DEFAULT 0
);

-- User session
CREATE TABLE user_session (
  id TEXT PRIMARY KEY DEFAULT 'current',
  user_id TEXT,
  email TEXT,
  tier TEXT,                      -- free, pro, studio
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER
);

-- FTS for search
CREATE VIRTUAL TABLE prompts_fts USING fts5(
  text, header,
  content='prompts',
  content_rowid='rowid'
);
```

---

## Key Differentiators from PromptNest

| Feature | PromptNest | PromptPack Desktop |
|---------|------------|-------------------|
| Cloud Sync | ❌ Local only | ✅ Convex + R2 |
| Extension Integration | ❌ Standalone | ✅ Syncs with browser extension |
| Encryption | ❌ Plain files | ✅ AES-GCM encrypted packs |
| AI Classification | ❌ Manual | ✅ Auto-generated headers |
| Pricing Tiers | Free only | Free + Pro + Studio |
| Source Tracking | ❌ None | ✅ ChatGPT, Claude, etc. |
| Web Dashboard | ❌ None | ✅ Full web app |

---

## Implementation Phases

### Phase 1: Core MVP (4-6 weeks)
- [ ] Tauri project setup with React + Vite
- [ ] SQLite database with basic schema
- [ ] Prompt CRUD operations
- [ ] Import/export .pmtpk files
- [ ] Basic folder organization
- [ ] Light/dark theme
- [ ] Windows & Mac builds

### Phase 2: Cloud Integration (2-3 weeks)
- [ ] Clerk authentication
- [ ] Convex sync integration
- [ ] Offline queue for sync
- [ ] Conflict resolution UI
- [ ] Sync status indicators

### Phase 3: Quick Access (2 weeks)
- [ ] Global hotkey registration
- [ ] Floating search window
- [ ] One-click copy with variable form
- [ ] System tray icon
- [ ] Recent prompts

### Phase 4: Advanced Features (2-3 weeks)
- [ ] Full-text search with FTS5
- [ ] Tags and advanced filtering
- [ ] Variable memory and dropdowns
- [ ] Version history

### Phase 5: Polish & Launch (2 weeks)
- [ ] Auto-updater
- [ ] Onboarding flow
- [ ] Keyboard shortcuts
- [ ] Error handling & recovery
- [ ] Analytics integration
- [ ] Documentation

---

## Code Reuse from Existing Projects

### From popup/ (extension)
- `crypto.ts` - Encryption/decryption logic (port to Rust + JS)
- `templateParser.ts` - Variable `{{placeholder}}` parsing
- UI patterns for prompt cards and source icons

### From web/ (dashboard)
- Component library (buttons, cards, modals)
- TailwindCSS configuration
- Convex queries and mutations
- Clerk authentication flow
- Stripe billing integration

---

## Platform-Specific Considerations

### Windows
- Use native Windows dialogs
- Support high DPI displays
- Windows defender allowlisting for updater
- Sign with EV certificate for SmartScreen

### macOS
- Native menu bar integration
- Dock icon with badge
- Notarization for Gatekeeper
- Universal binary (Intel + Apple Silicon)

---

## File Locations

### Windows
```
%APPDATA%\PromptPack\
├── promptpack.db          # SQLite database
├── settings.json          # User preferences
├── logs/                  # Application logs
└── exports/               # Default export folder
```

### macOS
```
~/Library/Application Support/PromptPack/
├── promptpack.db
├── settings.json
├── logs/
└── exports/
```

---

## Security Considerations

1. **Encryption at Rest**: SQLite database can be encrypted with SQLCipher
2. **Secure Token Storage**: Use OS keychain (macOS Keychain, Windows Credential Manager)
3. **Code Signing**: Required for distribution on both platforms
4. **Auto-Updates**: Signed updates only, verify checksums
5. **Sandboxing**: Tauri's security-first approach limits file system access

---

## Success Metrics

- **Download count** - Installations per platform
- **DAU/MAU** - Daily/Monthly active users
- **Sync usage** - % of users with cloud sync enabled
- **Import/export volume** - Files processed
- **Quick Access usage** - Hotkey triggers per user
- **Conversion rate** - Free → Pro → Studio upgrades

---

## Future Considerations (Post-Launch)

- **Pack Marketplace** - Browse/purchase community prompt packs
- **Team/Workspace sharing** - Shared prompt libraries for teams
- **Plugin system** - Extensibility for power users
- **CLI tool** - Command-line interface for automation

---

## Next Steps

1. Set up Tauri development environment
2. Create initial project structure
3. Port encryption logic to Rust
4. Build basic prompt CRUD UI
5. Implement .pmtpk import/export
6. Add Convex sync layer
7. Build floating quick access window
8. Set up CI/CD for cross-platform builds
