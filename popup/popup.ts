import "./popup.css";
import { listPrompts, deletePrompt, deletePromptsBySource, bulkSavePrompts, removePromptsByIds, restorePrompts, deletePackPrompts, updatePromptHeader, updatePromptText, requeueStaleClassifications, requeueMissingHeaders, type PromptItem, type PromptSource } from "./shared/promptStore";
import { isStorageLow } from "./shared/safeStorage";
import { THEME_KEY, getSystemTheme, applyThemeFromStorageToRoot, type ThemeMode } from "./shared/theme";
import { encryptPmtpk, decryptPmtpk, encodePmtpk, decodePmtpk, isObfuscated, isEncrypted, SCHEMA_VERSION, PmtpkError } from "./shared/crypto";
import { getAuthState, verifyAuthStateBackground, type AuthState, login, logout } from "./shared/auth";
import { api } from "./shared/api";
import {
  FREE_PROMPT_LIMIT,
  PRO_PROMPT_LIMIT,
  PROMPTS_STORAGE_KEY,
  MAX_IMPORTED_PACKS,
  PASSWORD_MAX_LENGTH,
  isValidPassword,
  TOAST_DURATION_MS,
  DASHBOARD_URL,
  PACKS_CREATE_API,
  SIGN_OUT_URL,
} from "./shared/config";

// Helper to get prompt limit based on auth state
function getPromptLimit(state: AuthState): number {
  // Use billing info if available (most accurate)
  if (state.billing?.isPro) {
    return PRO_PROMPT_LIMIT;
  }
  // Fall back to entitlements if set
  if (state.entitlements?.promptLimit) {
    return state.entitlements.promptLimit;
  }
  // Fall back to tier
  if (state.user?.tier === "paid") {
    return PRO_PROMPT_LIMIT;
  }
  // Default to free limit
  return FREE_PROMPT_LIMIT;
}

// SVG Icons
const ICON = {
  import: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  undo: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10H4"/></svg>`,
  export: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  save: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  delete: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  chevron: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,0 10,5 2,10"/></svg>`,
  user: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
};

// Auth state
let authState: AuthState = { isAuthenticated: false };
let isSyncing = false;
let isLoadingAuth = true; // Show loading screen until auth is verified
const STALE_CLASSIFY_RETRY_MS = 30 * 1000;
const REQUEUE_ON_SIGNIN_KEY = "pp_header_requeue_user";
let storageListenerAttached = false;

// Pro status tracking (persisted to detect downgrades)
const PRO_STATUS_KEY = "pp_last_pro_status";
async function getLastProStatus(): Promise<boolean | null> {
  const result = await chrome.storage.local.get(PRO_STATUS_KEY);
  const value = result[PRO_STATUS_KEY];
  return value === true || value === false ? value : null;
}
async function setLastProStatus(isPro: boolean): Promise<void> {
  await chrome.storage.local.set({ [PRO_STATUS_KEY]: isPro });
}

// Cached prompts for instant rendering
let cachedPrompts: PromptItem[] | null = null;

// Helper to invalidate cache when prompts change
function invalidateCache() {
  cachedPrompts = null;
}

let editingPromptId: string | null = null;
let promptDraft = "";

function ensureStorageListenerOnce() {
  if (storageListenerAttached) return;
  storageListenerAttached = true;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes[PROMPTS_STORAGE_KEY]) {
      console.log("[PromptPack] Prompt storage updated, refreshing popup view");
      invalidateCache();
      void render(true);
    }
  });
}

async function retryStaleClassifications(): Promise<void> {
  const queued = await requeueStaleClassifications({
    staleMs: STALE_CLASSIFY_RETRY_MS,
    max: 5,
  });
  if (queued > 0) {
    await render(true);
  }
}

async function maybeRequeueMissingHeadersOnSignin(state: AuthState): Promise<void> {
  if (!state.isAuthenticated || !state.user?.id) return;
  const stored = await chrome.storage.local.get(REQUEUE_ON_SIGNIN_KEY);
  const lastUserId = stored[REQUEUE_ON_SIGNIN_KEY] as string | undefined;
  if (lastUserId === state.user.id) return;

  await chrome.storage.local.set({ [REQUEUE_ON_SIGNIN_KEY]: state.user.id });
  const queued = await requeueMissingHeaders({ max: 5 });
  if (queued > 0) {
    await render(true);
  }
}

// Undo state
type UndoAction = {
  type: "delete" | "delete-folder" | "import";
  prompts: PromptItem[];
  source?: PromptSource;
};
let undoStack: UndoAction[] = [];

async function performUndo() {
  const action = undoStack.pop();
  if (!action) {
    toast("Nothing to undo");
    return;
  }

  if (action.type === "delete" || action.type === "delete-folder") {
    // Restore deleted prompts using safe storage
    const result = await restorePrompts(action.prompts);
    if (!result.ok) {
      toast("Failed to restore prompts. Please try again.");
      // Put action back on stack so user can retry
      undoStack.push(action);
      return;
    }
    invalidateCache();
    toast(`Restored ${action.prompts.length} prompt${action.prompts.length !== 1 ? "s" : ""}`);
  } else if (action.type === "import") {
    // Remove imported prompts using safe storage
    const ids = action.prompts.map(p => p.id);
    const result = await removePromptsByIds(ids);
    if (!result.ok) {
      toast("Failed to remove imported prompts. Please try again.");
      undoStack.push(action);
      return;
    }
    invalidateCache();
    toast(`Removed ${action.prompts.length} imported prompt${action.prompts.length !== 1 ? "s" : ""}`);
  }

  await render();
}

async function importPmtpk(file: File) {
  try {
    // Check if user has reached the imported pack limit
    const items = await listPrompts();
    const importedPackNames = new Set(items.filter(p => p.packName).map(p => `${p.source}:${p.packName}`));
    const importedPackCount = importedPackNames.size;

    if (importedPackCount >= MAX_IMPORTED_PACKS) {
      toast(`Pack limit reached (${importedPackCount}/${MAX_IMPORTED_PACKS}). Delete a pack to import new ones.`);
      return;
    }

    // Check if user can accommodate more prompts (based on billing tier)
    const currentPromptCount = items.length;
    const promptLimit = getPromptLimit(authState);

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check file type
    const encrypted = isEncrypted(bytes);
    const obfuscated = isObfuscated(bytes);

    let jsonString: string;

    if (encrypted) {
      // Encrypted file - prompt for password
      const password = prompt(`Enter password (letters and numbers only, max ${PASSWORD_MAX_LENGTH} characters):`);
      if (!password) {
        toast("Import cancelled");
        return;
      }
      if (!isValidPassword(password)) {
        toast(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only`);
        return;
      }
      jsonString = await decryptPmtpk(bytes, password);
    } else if (obfuscated) {
      // Obfuscated file (unencrypted but protected)
      jsonString = await decodePmtpk(bytes);
    } else {
      // Legacy plain JSON (for backwards compatibility)
      jsonString = new TextDecoder().decode(bytes);
    }

    const data = JSON.parse(jsonString);

    if (!data.prompts || !Array.isArray(data.prompts)) {
      toast("Invalid .pmtpk file");
      return;
    }

    const source = (data.source as PromptSource) || "chatgpt";
    const packTitle = data.title || file.name.replace(/\.pmtpk$/, "");

    // Check if importing this pack would exceed the prompt limit
    const packPromptCount = data.prompts.length;
    const newTotalPrompts = currentPromptCount + packPromptCount;

    if (newTotalPrompts > promptLimit) {
      toast(`Cannot import: would exceed ${promptLimit} prompt limit (${currentPromptCount} + ${packPromptCount} = ${newTotalPrompts})`);
      return;
    }

    // Check storage health before importing
    const storageLow = await isStorageLow(90);
    if (storageLow) {
      toast("Warning: Storage is nearly full. Import may fail.");
    }

    // Prepare prompts for bulk import
    const promptsToImport = data.prompts.map((p: {
      text: string;
      url?: string;
      createdAt?: number;
      header?: string;
      headerGeneratedAt?: number;
    }) => ({
      text: p.text,
      source,
      url: p.url || "",
      ...(p.header && { header: p.header }),
      ...(p.headerGeneratedAt && { headerGeneratedAt: p.headerGeneratedAt }),
    }));

    // Use safe bulk save with verification and retry
    const result = await bulkSavePrompts(promptsToImport, packTitle);

    if (!result.ok) {
      toast(`Import failed: ${result.error || "Storage error"}. Please try again.`);
      return;
    }

    invalidateCache();

    // Push to undo stack with the actual saved prompts (includes IDs)
    undoStack.push({ type: "import", prompts: result.imported });

    toast(`Imported ${result.imported.length} prompt${result.imported.length !== 1 ? "s" : ""} from "${packTitle}"`);
    await render();
  } catch (e) {
    if (e instanceof PmtpkError) {
      switch (e.code) {
        case 'WRONG_PASSWORD':
          toast("Wrong password");
          break;
        case 'CORRUPTED':
          toast("File is corrupted");
          break;
        case 'UNSUPPORTED_VERSION':
          toast("Please update PromptPack");
          break;
        case 'INVALID_FORMAT':
          toast("Invalid file format");
          break;
        default:
          toast("Failed to import file");
      }
    } else {
      toast("Failed to import file");
    }
  }
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    const m: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return m[c] ?? c;
  });
}

function toast(msg: string) {
  let el = document.getElementById("pp-popup-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pp-popup-toast";
    el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
      z-index: 999999;
      padding: 8px 10px;
      border-radius: 10px;
      background: var(--toast-bg);
      color: var(--toast-text);
      font-size: 12px;
      opacity: 0;
      transition: opacity 140ms ease;
      pointer-events: none;
      border: 1px solid var(--border);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    `;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  setTimeout(() => (el!.style.opacity = "0"), TOAST_DURATION_MS);
}

type GroupedPrompts = {
  type: "source" | "pack";
  key: string;
  displayName: string;
  source: PromptSource;
  prompts: PromptItem[];
};

function groupPrompts(items: PromptItem[]): GroupedPrompts[] {
  const groups: GroupedPrompts[] = [];

  // Separate imported packs from regular prompts
  const importedPacks = new Map<string, PromptItem[]>();
  const regularPrompts: Record<PromptSource, PromptItem[]> = {
    chatgpt: [],
    claude: [],
    gemini: [],
  };

  for (const p of items) {
    if (p.packName) {
      // Group by pack name
      const packKey = `${p.source}:${p.packName}`;
      if (!importedPacks.has(packKey)) {
        importedPacks.set(packKey, []);
      }
      importedPacks.get(packKey)!.push(p);
    } else {
      // Regular prompt saved from extension
      regularPrompts[p.source]?.push(p);
    }
  }

  // Add imported packs first (sorted by most recent)
  const packEntries = Array.from(importedPacks.entries())
    .map(([key, prompts]) => {
      const [source, packName] = key.split(":");
      return {
        type: "pack" as const,
        key,
        displayName: packName,
        source: source as PromptSource,
        prompts: prompts.sort((a, b) => b.createdAt - a.createdAt),
        mostRecent: Math.max(...prompts.map(p => p.createdAt))
      };
    })
    .sort((a, b) => b.mostRecent - a.mostRecent);

  groups.push(...packEntries);

  // Add regular source groups (always show all three sources)
  const sourceOrder: PromptSource[] = ["chatgpt", "claude", "gemini"];
  for (const source of sourceOrder) {
    const prompts = regularPrompts[source];
    groups.push({
      type: "source",
      key: source,
      displayName: sectionTitle(source),
      source,
      prompts: prompts.sort((a, b) => b.createdAt - a.createdAt),
    });
  }

  return groups;
}

function sectionTitle(source: PromptItem["source"]) {
  if (source === "chatgpt") return "ChatGPT";
  if (source === "claude") return "Claude";
  return "Gemini";
}

function isLongPrompt(text: string) {
  const t = text.trim();
  return t.length > 180 || t.includes("\n");
}

function renderPromptRow(p: PromptItem) {
  const full = p.text.trim();
  const preview = full.replace(/\s+/g, " ").trim();
  const shown = preview.length > 160 ? preview.slice(0, 160) + "..." : preview;
  const long = isLongPrompt(full);
  const isEditing = editingPromptId === p.id;
  const editValue = isEditing ? promptDraft || p.text : p.text;

    const headerHtml = p.header
    ? `<div class="pp-header-wrapper">
         <div class="pp-header-tag" data-prompt-id="${esc(p.id)}">${esc(p.header)}</div>
         <button class="pp-header-edit-btn" data-edit-header="${esc(p.id)}" type="button" title="Edit header">✎</button>
       </div>`
    : p.classifying
      ? `<div class="pp-header-wrapper">
           <div class="pp-header-loading">
             <span class="pp-header-spinner"></span>
             <span class="pp-header-loading-text">Generating header...</span>
           </div>
         </div>`
      : `<div class="pp-header-wrapper">
           <button class="pp-add-header-btn" data-edit-header="${esc(p.id)}" type="button">+ Add header</button>
         </div>`;

  if (isEditing) {
    return `
      <div class="pp-row">
        ${headerHtml}
        <div class="pp-edit">
          <textarea class="pp-edit-text" data-edit-input="${esc(p.id)}">${esc(editValue)}</textarea>
          <div class="pp-edit-actions">
            <button class="pp-btn" data-save-prompt="${esc(p.id)}" type="button">Save</button>
            <button class="pp-btn" data-cancel-edit="${esc(p.id)}" type="button">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  if (!long) {
    return `
      <div class="pp-row">
        ${headerHtml}
        <div class="pp-text" title="${esc(full)}">${esc(full)}</div>
        <div class="pp-actions">
          <button class="pp-btn" data-copy="${esc(p.id)}" type="button">Copy</button>
          <button class="pp-icon-btn" data-edit-prompt="${esc(p.id)}" type="button" aria-label="Edit" title="Edit">${ICON.edit}</button>
          <button class="pp-icon-btn" data-del="${esc(p.id)}" type="button" aria-label="Delete" title="Delete">${ICON.delete}</button>
        </div>
      </div>
    `;
  }

  return `
    <details class="pp-item" data-id="${esc(p.id)}">
      <summary class="pp-item-sum">
        ${headerHtml}
        <div class="pp-item-content">
          <div class="pp-item-left">
            <span class="pp-item-arrow">${ICON.chevron}</span>
            <span class="pp-item-preview">${esc(shown)}</span>
          </div>
          <div class="pp-actions">
            <button class="pp-btn" data-copy="${esc(p.id)}" type="button">Copy</button>
            <button class="pp-icon-btn" data-edit-prompt="${esc(p.id)}" type="button" aria-label="Edit" title="Edit">${ICON.edit}</button>
            <button class="pp-icon-btn" data-del="${esc(p.id)}" type="button" aria-label="Delete" title="Delete">${ICON.delete}</button>
          </div>
        </div>
      </summary>

      <div class="pp-item-body">
        <pre class="pp-full">${esc(full)}</pre>
      </div>
    </details>
  `;
}

let storageListenerRegistered = false;
let delegationSetup = false;
function ensureThemeListenerOnce() {
  if (storageListenerRegistered) return;
  storageListenerRegistered = true;

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;

    // Re-render on theme changes
    const themeChange = changes[THEME_KEY];
    if (themeChange) {
      const newTheme = (themeChange.newValue as ThemeMode) ?? getSystemTheme();
      document.documentElement.dataset.theme = newTheme;
      await render();
      return;
    }

    // Re-render on prompt changes (for classifying state updates)
    const promptsChange = changes[PROMPTS_STORAGE_KEY];
    if (promptsChange) {
      invalidateCache();
      await render();
      return;
    }
  });
}

async function detectActiveSource(): Promise<PromptItem["source"] | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;

    const url = tab.url.toLowerCase();
    if (url.includes("claude.ai")) return "claude";
    if (url.includes("gemini.google.com")) return "gemini";
    if (url.includes("chatgpt.com") || url.includes("chat.openai.com")) return "chatgpt";

    return null;
  } catch {
    return null;
  }
}

function setupEventDelegation() {
  if (delegationSetup) return;
  delegationSetup = true;

  const app = document.getElementById("app");
  if (!app) return;

  // Single delegated click handler for all button actions
  app.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest("button") as HTMLButtonElement | null;
    if (!btn) return;

    // Copy button
    if (btn.dataset.copy) {
      e.preventDefault();
      e.stopPropagation();

      const id = btn.dataset.copy;
      const items = await listPrompts();
      const p = items.find((x) => x.id === id);
      if (!p) return;

      try {
        await navigator.clipboard.writeText(p.text);
        toast("Copied");
      } catch {
        toast("Copy failed");
      }
      return;
    }

    // Delete single prompt
    if (btn.dataset.del) {
      e.preventDefault();
      e.stopPropagation();

      const id = btn.dataset.del;
      const items = await listPrompts();
      const prompt = items.find((x) => x.id === id);
      if (prompt) {
        undoStack.push({ type: "delete", prompts: [prompt] });
      }
      await deletePrompt(id);
      invalidateCache();
      toast("Deleted");
      await render();
      return;
    }

    // Delete folder (all prompts from a source)
    if (btn.dataset.deleteFolder) {
      e.preventDefault();
      e.stopPropagation();

      const source = btn.dataset.deleteFolder as PromptSource;
      const items = await listPrompts();
      const sourcePrompts = items.filter(p => p.source === source && !p.packName);

      if (sourcePrompts.length === 0) {
        toast("No prompts to delete");
        return;
      }

      undoStack.push({ type: "delete-folder", prompts: sourcePrompts, source });
      await deletePromptsBySource(source);
      invalidateCache();
      toast(`Deleted ${sourcePrompts.length} prompt${sourcePrompts.length !== 1 ? "s" : ""}`);
      await render();
      return;
    }

    // Delete pack (all prompts from an imported pack)
    if (btn.dataset.deletePack) {
      e.preventDefault();
      e.stopPropagation();

      const packKey = btn.dataset.deletePack;
      const [source, packName] = packKey.split(":");

      // Use safe storage to delete pack prompts
      const result = await deletePackPrompts(packName, source as PromptSource);

      if (!result.ok) {
        toast(`Failed to delete pack: ${result.error || "Storage error"}`);
        return;
      }

      if (result.deleted.length === 0) {
        toast("No prompts to delete");
        return;
      }

      // Push to undo stack for recovery
      undoStack.push({ type: "delete-folder", prompts: result.deleted, source: source as PromptSource });
      invalidateCache();

      toast(`Deleted "${packName}" pack (${result.deleted.length} prompts)`);
      await render();
      return;
    }

    // Edit prompt text
    if (btn.dataset.editPrompt) {
      e.preventDefault();
      e.stopPropagation();

      const promptId = btn.dataset.editPrompt;
      const items = await listPrompts();
      const promptItem = items.find(p => p.id === promptId);
      if (!promptItem) return;

      editingPromptId = promptId;
      promptDraft = promptItem.text;
      await render();
      return;
    }

    // Save edited prompt text
    if (btn.dataset.savePrompt) {
      e.preventDefault();
      e.stopPropagation();

      const promptId = btn.dataset.savePrompt;
      const trimmed = promptDraft.trim();
      if (!trimmed) {
        toast("Prompt cannot be empty");
        return;
      }

      const result = await updatePromptText(promptId, trimmed);
      if (result.ok) {
        editingPromptId = null;
        promptDraft = "";
        invalidateCache();
        toast("Prompt updated");
        await render();
      } else {
        toast("Failed to update prompt");
      }
      return;
    }

    // Cancel prompt edit
    if (btn.dataset.cancelEdit) {
      e.preventDefault();
      e.stopPropagation();

      editingPromptId = null;
      promptDraft = "";
      await render();
      return;
    }

    // Edit header button
    if (btn.dataset.editHeader) {
      e.preventDefault();
      e.stopPropagation();

      const promptId = btn.dataset.editHeader;
      const items = await listPrompts();
      const promptItem = items.find(p => p.id === promptId);
      if (!promptItem) return;

      const newHeader = window.prompt("Edit header (1-2 words max):", promptItem.header || "");
      if (newHeader === null) return; // User cancelled

      const trimmedHeader = newHeader.trim();
      if (trimmedHeader === "") {
        // Delete header if empty
        const result = await updatePromptHeader(promptId, "");
        if (result.ok) {
          invalidateCache();
          toast("Header removed");
          await render();
        } else {
          toast("Failed to remove header");
        }
        return;
      }

      // Validate word count
      const words = trimmedHeader.split(/\s+/);
      if (words.length > 2) {
        toast("Header must be 1-2 words maximum");
        return;
      }

      const result = await updatePromptHeader(promptId, trimmedHeader);
      if (result.ok) {
        invalidateCache();
        toast("Header updated");
        await render();
      } else {
        toast("Failed to update header");
      }
      return;
    }

    // Export button
    if (btn.dataset.export) {
      e.preventDefault();
      e.stopPropagation();

      const source = btn.dataset.export as PromptItem["source"];
      const items = await listPrompts();
      const sourcePrompts = items.filter(p => p.source === source && !p.packName);

      if (sourcePrompts.length === 0) {
        toast("No prompts to export");
        return;
      }

      // Ask if user wants to encrypt
      const password = prompt(`Enter a password to encrypt (letters/numbers only, max ${PASSWORD_MAX_LENGTH} chars, or leave empty):`);

      // User cancelled
      if (password === null) {
        return;
      }

      // Validate password if provided
      if (password && !isValidPassword(password)) {
        toast(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only`);
        return;
      }

      // Map source to display title
      const sourceTitle = source === "chatgpt" ? "ChatGPT" : source === "claude" ? "Claude" : "Gemini";

      // Create export data with schema version
      const exportData = {
        version: SCHEMA_VERSION,
        source,
        title: sourceTitle, // Include title for display when imported
        exportedAt: new Date().toISOString(),
        prompts: sourcePrompts.map(p => ({
          text: p.text,
          url: p.url,
          createdAt: p.createdAt,
          ...(p.header && { header: p.header }),
          ...(p.headerGeneratedAt && { headerGeneratedAt: p.headerGeneratedAt }),
        }))
      };

      const jsonString = JSON.stringify(exportData);
      let fileData: Uint8Array;

      if (password) {
        // Encrypt with password
        fileData = await encryptPmtpk(jsonString, password);
      } else {
        // Obfuscate (not encrypted, but not readable as plain text)
        fileData = await encodePmtpk(jsonString);
      }

      const blob = new Blob([new Uint8Array(fileData)], { type: "application/octet-stream" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${source}-prompts-${Date.now()}.pmtpk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast(`Exported ${sourcePrompts.length} prompt${sourcePrompts.length !== 1 ? "s" : ""}${password ? " (encrypted)" : ""}`);
      return;
    }

    // Export pack button
    if (btn.dataset.exportPack) {
      e.preventDefault();
      e.stopPropagation();

      const packKey = btn.dataset.exportPack;
      const [source, packName] = packKey.split(":");
      const items = await listPrompts();
      const packPrompts = items.filter(p => p.packName === packName && p.source === source);

      if (packPrompts.length === 0) {
        toast("No prompts to export");
        return;
      }

      // Ask if user wants to encrypt
      const password = prompt(`Enter a password to encrypt (letters/numbers only, max ${PASSWORD_MAX_LENGTH} chars, or leave empty):`);

      // User cancelled
      if (password === null) {
        return;
      }

      // Validate password if provided
      if (password && !isValidPassword(password)) {
        toast(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only`);
        return;
      }

      // Create export data with pack name preserved
      const exportData = {
        version: SCHEMA_VERSION,
        source: source as PromptSource,
        title: packName, // Preserve original pack name
        exportedAt: new Date().toISOString(),
        prompts: packPrompts.map(p => ({
          text: p.text,
          url: p.url,
          createdAt: p.createdAt,
          ...(p.header && { header: p.header }),
          ...(p.headerGeneratedAt && { headerGeneratedAt: p.headerGeneratedAt }),
        }))
      };

      const jsonString = JSON.stringify(exportData);
      let fileData: Uint8Array;

      if (password) {
        fileData = await encryptPmtpk(jsonString, password);
      } else {
        fileData = await encodePmtpk(jsonString);
      }

      const blob = new Blob([new Uint8Array(fileData)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${packName.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.pmtpk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast(`Exported "${packName}" (${packPrompts.length} prompts)${password ? " (encrypted)" : ""}`);
      return;
    }

    // Import button
    if (btn.id === "pp-import-btn") {
      const importInput = document.getElementById("pp-import-input") as HTMLInputElement | null;
      if (importInput) {
        importInput.click();
      }
      return;
    }

    // Undo button
    if (btn.id === "pp-undo-btn") {
      await performUndo();
      return;
    }

    if (btn.id === "pp-login-btn" || btn.dataset.loginLink === "true") {
      e.preventDefault();
      e.stopPropagation();

      const success = await login();
      if (!success) {
        toast("Login failed. Please try again.");
        return;
      }

        authState = await getAuthState();
        await render(true);
        if (authState.isAuthenticated) {
          void retryStaleClassifications();
          void maybeRequeueMissingHeadersOnSignin(authState);
        }
        return;
      }

      if (btn.id === "pp-logout-btn") {
        e.preventDefault();
        e.stopPropagation();

        await logout();
        await chrome.storage.local.remove(REQUEUE_ON_SIGNIN_KEY);
        await chrome.tabs.create({ url: SIGN_OUT_URL, active: false });
        authState = await getAuthState();
        await render(true);
        return;
      }

    if (btn.id === "pp-dashboard-btn") {
      await chrome.tabs.create({ url: DASHBOARD_URL });
      return;
    }

    // Save to dashboard button (when logged in)
    if (btn.dataset.save) {
      e.preventDefault();
      e.stopPropagation();

      const source = btn.dataset.save as PromptSource;
      const items = await listPrompts();
      const sourcePrompts = items.filter(p => p.source === source && !p.packName);

      if (sourcePrompts.length === 0) {
        toast("No prompts to save");
        return;
      }

      // Check if user is authenticated
      if (!authState.isAuthenticated || !authState.user?.id) {
        toast("Not authenticated");
        return;
      }

      try {
        toast(`Saving ${sourcePrompts.length} prompt${sourcePrompts.length !== 1 ? "s" : ""} to dashboard...`);

        // Create export data for the prompts
        const exportData = {
          version: SCHEMA_VERSION,
          source,
          exportedAt: new Date().toISOString(),
          prompts: sourcePrompts.map(p => ({
            text: p.text,
            url: p.url,
            createdAt: p.createdAt
          }))
        };

        // Encode the data (no encryption for saved prompts, just obfuscation)
        const jsonString = JSON.stringify(exportData);
        const fileData = await encodePmtpk(jsonString);
        const base64FileData = btoa(String.fromCharCode(...fileData));

        // Save to dashboard via API
        const result = await api.savePromptsToDashboard({
          source,
          fileData: base64FileData,
          promptCount: sourcePrompts.length,
          clerkId: authState.user.id,
        });

        if (result.success) {
          toast("Saved to dashboard!");
        } else {
          toast(result.error || "Failed to save");
        }
      } catch {
        toast("Failed to save to dashboard");
      }
      return;
    }

    // Save pack to dashboard
    if (btn.dataset.savePack) {
      e.preventDefault();
      e.stopPropagation();

      const packKey = btn.dataset.savePack;
      const [source, packName] = packKey.split(":");
      const items = await listPrompts();
      const packPrompts = items.filter(p => p.packName === packName && p.source === source);

      if (packPrompts.length === 0) {
        toast("No prompts to save");
        return;
      }

      try {
        // Ask if user wants to encrypt (optional)
        const password = prompt(`Add a password to encrypt (letters/numbers only, max ${PASSWORD_MAX_LENGTH} chars, or leave empty):`);

        // User cancelled
        if (password === null) {
          return;
        }

        // Validate password if provided
        if (password && !isValidPassword(password)) {
          toast(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only`);
          return;
        }

        toast(`Saving "${packName}" pack (${packPrompts.length} prompts) to dashboard...`);

        // Create export data
        const exportData = {
          version: SCHEMA_VERSION,
          source: source as PromptSource,
          title: packName,
          exportedAt: new Date().toISOString(),
          prompts: packPrompts.map(p => ({
            text: p.text,
            url: p.url,
            createdAt: p.createdAt
          }))
        };

        const jsonString = JSON.stringify(exportData);
        let fileData: Uint8Array;

        // Encrypt or obfuscate based on password
        if (password) {
          fileData = await encryptPmtpk(jsonString, password);
        } else {
          fileData = await encodePmtpk(jsonString);
        }

        // Convert to base64 for storage
        const base64FileData = btoa(String.fromCharCode(...fileData));

        // Get user ID from auth state
        if (!authState.user?.id) {
          toast("Not logged in. Please log in first.");
          return;
        }

        // Call Convex API to create pack
        const response = await fetch(PACKS_CREATE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: packName,
            fileData: base64FileData,
            promptCount: packPrompts.length,
            version: "1.0",
            price: 0,
            isPublic: false,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save pack");
        }

        toast(`"${packName}" saved to dashboard!`);
      } catch {
        toast("Failed to save pack to dashboard");
      }
      return;
    }
  });

  app.addEventListener("input", (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLTextAreaElement)) return;
    const editId = target.dataset.editInput;
    if (!editId || editingPromptId !== editId) return;
    promptDraft = target.value;
  });

  // File input change handler (delegated to app level)
  app.addEventListener("change", async (e) => {
    const target = e.target as HTMLElement;
    if (target.id !== "pp-import-input") return;

    const input = target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      await importPmtpk(file);
      input.value = "";
    }
  });

  // Keybind handled in content scripts (website focus), not in popup.
}

async function render(forceRefresh = false) {
  await applyThemeFromStorageToRoot();
  ensureThemeListenerOnce();
  ensureStorageListenerOnce();

  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app in popup index.html");

  // Show loading screen while auth is being verified
  if (isLoadingAuth) {
    app.innerHTML = `
      <div class="pp-wrap pp-loading">
        <div class="pp-loading-content">
          <div class="pp-loading-spinner"></div>
          <div class="pp-loading-text">Loading...</div>
        </div>
      </div>
    `;
    return;
  }

  const isLoggedIn = authState.isAuthenticated;
  const isPro = authState.billing?.isPro ?? false;

  let items: PromptItem[];

  // Instant render with cache, background sync for updates
    if (cachedPrompts && !forceRefresh) {
      // Use cached data for instant render
      items = cachedPrompts;
    } else {
      // First render or forced refresh - fetch data
      items = await listPrompts();
      cachedPrompts = items;
    }

  // Remove imported packs from storage if user transitioned from pro to non-pro
  // Only run this cleanup when pro status actually changes (genuine downgrade)
  const lastProStatus = await getLastProStatus();

  // Only cleanup if:
  // 1. We have a recorded previous pro status (user was definitely pro before)
  // 2. User is now NOT pro
  // 3. User is authenticated (not just logged out)
  if (lastProStatus === true && !isPro && isLoggedIn) {
    const packPrompts = items.filter(p => p.packName);
    if (packPrompts.length > 0) {
      // Use safe storage to remove pack prompts
      const packIds = packPrompts.map(p => p.id);
      const result = await removePromptsByIds(packIds);
      if (result.ok) {
        invalidateCache();
        // Refresh items after removal
        items = await listPrompts();
        cachedPrompts = items;
      }
    }
  }

  // Update last pro status (but only if authenticated)
  if (isLoggedIn) {
    await setLastProStatus(isPro);
  }

  const groups = groupPrompts(items.filter(p => isPro || !p.packName));
  const activeSource = await detectActiveSource();

  // Set active source on root element for styling
  if (activeSource) {
    document.documentElement.dataset.activeSource = activeSource;
  } else {
    delete document.documentElement.dataset.activeSource;
  }

  // Render auth button based on state
  const syncIndicator = isSyncing ? `<span class="pp-sync-hint" title="Syncing...">•</span>` : "";
  const authButton = isLoggedIn
    ? `<button class="pp-icon-btn pp-logged-in" id="pp-dashboard-btn" title="Logged in - Go to Dashboard">${ICON.user}</button>`
    : `<button class="pp-icon-btn" id="pp-login-btn" title="Login">${ICON.user}</button>`;

  // Show import button only if user has pro billing and hasn't reached pack limit
  // Count unique imported packs (items with packName)
  const importedPackNames = new Set(items.filter(p => p.packName).map(p => `${p.source}:${p.packName}`));
  const importedPackCount = importedPackNames.size;
  const canImport = isPro && importedPackCount < MAX_IMPORTED_PACKS;

  const importButton = canImport
    ? `<button class="pp-icon-btn" id="pp-import-btn" title="Import .pmtpk (${importedPackCount}/${MAX_IMPORTED_PACKS})">${ICON.import}</button>`
    : isPro
      ? `<button class="pp-icon-btn" id="pp-import-btn-disabled" title="Pack limit reached (${importedPackCount}/${MAX_IMPORTED_PACKS})" disabled style="opacity: 0.4; cursor: not-allowed;">${ICON.import}</button>`
      : "";

  app.innerHTML = `
    <div class="pp-wrap">
      <div class="pp-header">
        <div class="pp-title">
          <img class="pp-logo" src="img/icon-48.png" alt="PromptPack" />
          PromptPack${syncIndicator}
        </div>
        <div class="pp-header-actions">
          ${importButton}
          <button class="pp-icon-btn" id="pp-undo-btn" title="Undo">${ICON.undo}</button>
          ${authButton}
        </div>
      </div>
      <input type="file" id="pp-import-input" accept=".pmtpk" style="display:none">
      <div class="pp-sub">${isLoggedIn ? `Logged in as ${authState.user?.email ?? "Unknown"} <button class="pp-auth-link" id="pp-logout-btn" type="button">Sign out</button>` : `Powered by PmtPk.ai.<button class="pp-auth-link pp-signin-link" type="button" data-login-link="true">Sign in</button> for AI generated headers.`}</div>

      ${groups
        .map((group) => {
          const openAttr = activeSource && group.source === activeSource && group.type === "source" ? "open" : "";
          const isPack = group.type === "pack";

          // For both packs and sources: show save/export based on login status
          const actionButtons = isPack
            ? isLoggedIn
              ? `<button class="pp-icon-btn" data-save-pack="${esc(group.key)}" title="Save ${esc(group.displayName)} pack to dashboard">${ICON.save}</button>`
              : `<button class="pp-icon-btn" data-export-pack="${esc(group.key)}" title="Export ${esc(group.displayName)}">${ICON.export}</button>`
            : isLoggedIn
              ? `<button class="pp-icon-btn" data-save="${group.source}" title="Save ${group.displayName} prompts to dashboard">${ICON.save}</button>`
              : `<button class="pp-icon-btn" data-export="${group.source}" title="Export ${group.displayName} prompts">${ICON.export}</button>`;

          const deleteButton = isPack
            ? `<button class="pp-icon-btn" data-delete-pack="${esc(group.key)}" title="Delete ${esc(group.displayName)} pack">${ICON.delete}</button>`
            : `<button class="pp-icon-btn" data-delete-folder="${group.source}" title="Delete all ${group.displayName} prompts">${ICON.delete}</button>`;

          return `
            <details class="pp-sec ${isPack ? 'pp-pack' : ''}" ${openAttr} data-source="${group.source}" data-group-key="${esc(group.key)}">
              <summary>
                <div class="pp-sum-left">
                  <span class="pp-arrow">${ICON.chevron}</span>
                  <span>${esc(group.displayName)}${isPack ? ' 📦' : ''}</span>
                </div>
                <div class="pp-actions">
                  ${actionButtons}
                  ${deleteButton}
                  <span class="pp-count">${group.prompts.length}</span>
                </div>
              </summary>
              <div class="pp-list">
                ${
                  group.prompts.length
                    ? group.prompts.map(renderPromptRow).join("")
                    : `<div class="pp-empty">No prompts in ${esc(group.displayName)} yet.</div>`
                }
              </div>
            </details>
          `;
        })
        .join("")}
    </div>
  `;

  // Setup event delegation once (persists across re-renders)
  setupEventDelegation();
}

// Get initial auth state
(async () => {
  // Show loading screen first
  await render();

  // Get auth state (cached or fresh)
  authState = await getAuthState();
  isLoadingAuth = false;

    // Re-render with actual content
    await render();
    if (authState.isAuthenticated) {
      void retryStaleClassifications();
      void maybeRequeueMissingHeadersOnSignin(authState);
    }

  // Background verification: check if auth state changed on server
  verifyAuthStateBackground(authState).then(async (newState) => {
    if (newState) {
      // Auth state changed - update and re-render
        authState = newState;
        await render();
        if (authState.isAuthenticated) {
          void retryStaleClassifications();
          void maybeRequeueMissingHeadersOnSignin(authState);
        }
      }
    });
})();
