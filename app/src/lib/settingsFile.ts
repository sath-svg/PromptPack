/**
 * Centralized BYOK key storage in `{appConfigDir}/settings.json`.
 *
 * Why a file instead of relying on Zustand `persist`?
 *  - Editable by users without launching the app (paste keys in,
 *    sync between machines via cloud-synced folders, etc.).
 *  - Single source of truth visible at a known path
 *    (`%APPDATA%/com.promptpack.desktop/settings.json` on Windows,
 *    `~/Library/Application Support/com.promptpack.desktop/...` on
 *    macOS, `~/.config/com.promptpack.desktop/...` on Linux).
 *  - Easier to back up, share between teammates, or wipe on logout.
 *
 * Mechanics
 *  - On hydration: read the file, return the parsed `apiKeys` blob.
 *  - On save: serialise the current `apiKeys` blob and write it back.
 *  - Best-effort: a missing/corrupt file is treated as empty so the
 *    app never refuses to launch because of a JSON typo. Errors are
 *    logged and swallowed.
 *  - All writes are debounced by the caller (Zustand store) — this
 *    file just does the I/O.
 *
 * Schema:
 *  ```json
 *  {
 *    "version": 1,
 *    "apiKeys": { "openai": "...", "bedrock": { "apiKey": "...", "region": "us-east-1" } }
 *  }
 *  ```
 */
import { readTextFile, writeTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import type { ApiKeys } from '../stores/settingsStore';

const FILE_PATH = 'settings.json';
const SCHEMA_VERSION = 1;

interface SettingsFileShape {
  version: number;
  apiKeys: ApiKeys;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Read `apiKeys` from `{appConfigDir}/settings.json`. Returns `null` if
 * the file does not exist, cannot be read, or contains malformed JSON.
 * The caller should treat `null` as "keep whatever's already in the
 * store" — usually the Zustand `persist` fallback.
 */
export async function readSettingsFile(): Promise<ApiKeys | null> {
  try {
    const present = await exists(FILE_PATH, { baseDir: BaseDirectory.AppConfig });
    if (!present) return null;
    const raw = await readTextFile(FILE_PATH, { baseDir: BaseDirectory.AppConfig });
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlainObject(parsed)) return null;
    const apiKeys = (parsed as Partial<SettingsFileShape>).apiKeys;
    if (!isPlainObject(apiKeys)) return null;
    return apiKeys as ApiKeys;
  } catch (err) {
    console.warn('[settingsFile] read failed — falling back to localStorage:', err);
    return null;
  }
}

/**
 * Write `apiKeys` to `{appConfigDir}/settings.json`. The parent directory
 * is created on first run if it does not exist. Failures are logged but
 * never thrown — the in-memory store stays authoritative even if the
 * disk write fails (e.g. permissions, AV interference).
 */
export async function writeSettingsFile(apiKeys: ApiKeys): Promise<void> {
  try {
    // mkdir is best-effort — AppConfig usually exists already, but on a
    // fresh install the bundle creates it lazily on first write.
    try {
      await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
    } catch {
      /* ignore — directory likely exists */
    }
    const payload: SettingsFileShape = { version: SCHEMA_VERSION, apiKeys };
    await writeTextFile(FILE_PATH, JSON.stringify(payload, null, 2), {
      baseDir: BaseDirectory.AppConfig,
    });
  } catch (err) {
    console.warn('[settingsFile] write failed — in-memory store stays authoritative:', err);
  }
}
