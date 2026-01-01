# PromptPack Documentation

A Chrome extension and web dashboard for saving, organizing, and sharing LLM prompts from ChatGPT, Claude, and Gemini.

---

## Table of Contents

1. [Overview](#overview)
2. [Supported Platforms](#supported-platforms)
3. [Account Tiers](#account-tiers)
4. [Chrome Extension Features](#chrome-extension-features)
5. [Web Dashboard Features](#web-dashboard-features)
6. [PromptPack File Format (.pmtpk)](#promptpack-file-format-pmtpk)
7. [Authentication System](#authentication-system)
8. [Data Storage & Sync](#data-storage--sync)

---

## Overview

PromptPack consists of two main components:

- **Chrome Extension**: Adds a save button to supported LLM websites, allowing users to capture prompts with one click
- **Web Dashboard**: Provides a persistent view of saved prompts, prompt pack creation, and account management

---

## Supported Platforms

The extension works on **3 LLM websites**:

| Platform | URLs |
|----------|------|
| ChatGPT | `chatgpt.com`, `chat.openai.com` |
| Claude | `claude.ai` |
| Google Gemini | `gemini.google.com` |

Each platform has a dedicated content script that detects the input textarea and injects the PromptPack save button.

---

## Account Tiers

### Free Tier

| Feature | Limit |
|---------|-------|
| Saved prompts | 10 per source (ChatGPT/Claude/Gemini) |
| Import packs | No |
| Storage | Local browser storage only |
| Export packs | Unlimited |
| Dashboard access | No (Yes if signed in) |
| Create prompt packs | No |

### Pro Tier ($9/month)

| Feature | Limit |
|---------|-------|
| Saved prompts | 40 per source (4x increase) |
| Imported packs | Up to 2 packs |
| Loaded packs | 5 slots 3 LLMS + 2 custom PromptPacks |
| Storage | Cloud sync (R2 + Convex) |
| Export packs | Unlimited |
| Dashboard access | Yes |
| Create prompt packs | 2 packs maximum |

---

## Chrome Extension Features

### Saving Prompts

- **One-click save**: Click the PromptPack button next to the input field to save the current prompt
- **Automatic source detection**: Prompts are tagged with their source (ChatGPT, Claude, or Gemini)
- **URL capture**: The URL of the conversation is saved alongside the prompt
- **Duplicate detection**: Re-saving the same prompt refreshes its timestamp instead of creating a duplicate
- **Limit enforcement**: Cannot save beyond the tier limit (10 free / 40 pro)

### Viewing Prompts

- Prompts are organized by source in collapsible folders
- Imported packs appear as separate folders with a package icon
- Newest prompts appear first (sorted by creation date)
- Click any prompt to copy it to clipboard

### Importing Packs (.pmtpk)

1. Click the import button in the popup
2. Select a `.pmtpk` file
3. If encrypted, enter the password (exactly 5 characters)
4. Prompts are imported with the pack name as metadata
5. **Free tier**: Cannot import packs
6. **Pro tier**: Limited to 2 imported packs total

Import validation:
- Checks pack limit before importing
- Checks if importing would exceed prompt limit
- Validates file integrity via SHA-256 hash
- Supports both encrypted and obfuscated formats

### Exporting Packs

All users (free and pro) can export prompts:

1. Click the export button on any source folder or imported pack
2. Optionally set a 5-character password for encryption
3. Downloads as `{source}_{timestamp}.pmtpk` or `{packname}_{timestamp}.pmtpk`

Export options:
- **Without password**: Creates obfuscated file (XOR-based, not cryptographic)
- **With password**: Creates AES-GCM encrypted file (exactly 5 characters)

### Deleting Prompts

- **Single delete**: Click trash icon on individual prompt
- **Bulk delete**: Delete entire source folder or imported pack
- **Undo support**: Single-level undo for deletions and imports

### Theme Sync

The popup automatically matches the theme of the current LLM website:
- Follows ChatGPT/Claude/Gemini dark/light mode
- Stored preference persists across sessions

### Authentication Check

- Extension checks auth status **per session**
- Cached session stored in `pp_auth_cache` (session storage)
- Session tokens expire after **7 days**
- On popup open: Verifies billing status via Convex API
- Falls back to free tier if auth fails

### Pro Downgrade Handling

When a user downgrades from Pro to Free:
- Imported packs (items with `packName` metadata) are automatically deleted
- Regular saved prompts are preserved
- Uses `lastProStatus` tracking to detect genuine downgrade vs logout

---

## Web Dashboard Features

### Saved Prompts View

Pro users can view all prompts saved from the extension:
- Organized by source (ChatGPT, Claude, Gemini)
- Shows prompt count and storage usage
- Copy any prompt with one click

### Prompt Pack Creation (Pro Only)

Pro users can create up to **2 prompt packs** on the dashboard:

1. Click "+ New Pack"
2. Enter pack name
3. Add first prompt
4. Optionally set encryption password (exactly 5 characters)
5. Pack is stored in R2 with metadata in Convex

Pack management:
- Add/remove prompts from packs
- Export packs as `.pmtpk` files
- Delete packs (with undo support)
- View encrypted packs (requires password)

### Undo/Redo Support

Dashboard supports multi-level undo/redo:
- Restore deleted prompts
- Restore deleted packs
- Redo actions after undo

### Grace Period (Subscription Cancellation)

When Pro subscription is cancelled:
- Warning banner shows days remaining
- Packs are retained during grace period
- After grace period expires, packs are permanently deleted
- Resubscribing preserves packs

### Marketplace (Coming Soon)

Placeholder for community prompt pack marketplace:
- Browse and purchase packs from other users
- Price packs in cents
- Public/private visibility controls

---

## PromptPack File Format (.pmtpk)

### File Structure

```
Header (37 bytes):
├── Magic (4 bytes): "PPK" + type byte
│   - 0x00 = obfuscated (no password)
│   - 0x01 = encrypted (password required)
├── Version (1 byte): 0x01 = v1
└── Hash (32 bytes): SHA-256 of uncompressed JSON

Payload:
└── Gzip compressed + (XOR obfuscated OR AES encrypted)
```

### JSON Payload Schema

```json
{
  "version": "1.0",
  "source": "chatgpt",
  "title": "Pack Name",
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "prompts": [
    {
      "text": "prompt content",
      "url": "https://chatgpt.com/c/...",
      "createdAt": 1704067200000
    }
  ]
}
```

### Encryption Details

**Obfuscated (default export without password):**
- XOR with key "PromptPack"
- Not cryptographically secure
- Prevents casual text editor viewing

**Encrypted (with password):**
- Algorithm: AES-GCM (authenticated encryption)
- Key derivation: PBKDF2 with SHA-256
- Iterations: 100,000
- Salt: 16 bytes (random)
- IV: 12 bytes (random)
- Password requirement: **exactly 5 characters**

### Security Properties

- **Integrity**: SHA-256 hash verifies file hasn't been tampered with
- **Compression**: Gzip reduces file size before encryption
- **Authentication**: AES-GCM provides authenticated encryption (detects tampering)
- **Key stretching**: PBKDF2 makes brute-force attacks slower

---

## Authentication System

### Flow

1. User clicks "Login" in extension popup
2. Extension opens web app at `/extension-auth`
3. User signs in via Clerk (OAuth)
4. Clerk generates auth code
5. Redirects to `chrome-extension://<id>/auth-callback.html`
6. Extension exchanges code for session token via Convex
7. Session stored in IndexedDB with 7-day expiration

### Session Storage

| Storage | Purpose |
|---------|---------|
| `pp_auth_cache` (session storage) | Cached auth state for quick checks |
| IndexedDB | Persistent session with expiration |
| `pp_last_pro_status` (local storage) | Tracks Pro status for downgrade detection |

### Tier Detection Priority

```
1. billing.isPro (from Clerk Billing) - most accurate
2. entitlements.promptLimit (from session)
3. user.tier === "paid" (from Convex)
4. Default: FREE tier
```

---

## Data Storage & Sync

### Extension Storage

**Free Tier:**
- Chrome `storage.local` only
- Atomic updates with `safeStorage` wrapper
- Backup/restore for data integrity

**Pro Tier:**
- IndexedDB for local persistence
- Cloud sync to Cloudflare R2
- Convex for metadata

### R2 Storage Structure

```
users/
  {userId}/
    saved/
      chatgpt.pmtpk                        # Saved prompts from ChatGPT
      claude.pmtpk                         # Saved prompts from Claude
      gemini.pmtpk                         # Saved prompts from Gemini
    userpacks/
      pack_{timestamp}_{random}.pmtpk      # User-created packs
```

### Convex Database Schema

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts synced from Clerk | `clerkId`, `email`, `plan`, `packDeletionAt` |
| `userPacks` | User-created prompt packs (metadata) | `authorId`, `title`, `r2Key`, `promptCount`, `isEncrypted` |
| `purchasedPacks` | Purchased marketplace packs | `userId`, `packId`, `purchasedAt` |
| `savedPacks` | Extension-synced prompts by source | `userId`, `source`, `r2Key`, `promptCount` |

### Sync Status

Prompts have a `syncStatus` field:
- `pending`: Not yet synced to cloud
- `synced`: Successfully uploaded to R2
- `error`: Sync failed (will retry)

---

## Limits Summary

| Limit | Free | Pro |
|-------|------|-----|
| Prompts per source | 10 | 40 |
| Imported packs | 0 | 2 |
| Created packs (dashboard) | 0 | 2 |
| Loaded pack slots | 0 | 5 |
| Cloud sync | Yes (if signed in) | Yes |
| Password length | 5 chars | 5 chars |
