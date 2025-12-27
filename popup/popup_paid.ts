// Paid tier popup for PromptPack
// Features: Cloud sync, 40 prompt limit, 5 loaded packs, purchased packs

import "./popup.css";
import {
  getAllPrompts,
  getPrompt,
  savePrompt as dbSavePrompt,
  deletePrompt as dbDeletePrompt,
  deletePromptsBySource as dbDeleteBySource,
  getPromptCount,
  getLoadedPacks,
  getLoadedPackCount,
  getPurchasedPacks,
  migrateFromChromeStorage,
  type LocalPrompt,
  type PromptSource,
  type LocalPack,
} from "./shared/db";
import {
  getAuthState,
  login,
  logout,
  canSavePrompt,
  canLoadPack,
  openUpgradePage,
  openBillingPortal,
  refreshEntitlements,
  type AuthState,
} from "./shared/auth";
import { FREE_PROMPT_LIMIT, PRO_PROMPT_LIMIT } from "./shared/promptStore";
import { api } from "./shared/api";

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
import { THEME_KEY, getSystemTheme, applyThemeFromStorageToRoot, type ThemeMode } from "./shared/theme";
import { encryptPmtpk, decryptPmtpk, encodePmtpk, decodePmtpk, isObfuscated, isEncrypted, SCHEMA_VERSION, PmtpkError } from "./shared/crypto";

// SVG Icons
const ICON = {
  import: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  undo: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  export: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  delete: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  chevron: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,0 10,5 2,10"/></svg>`,
  sync: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>`,
  user: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  crown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18"/></svg>`,
  pack: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  logout: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

// State
type UndoAction = {
  type: "delete" | "delete-folder" | "import";
  prompts: LocalPrompt[];
  source?: PromptSource;
};
let undoStack: UndoAction[] = [];
let authState: AuthState = { isAuthenticated: false };
let currentTab: "prompts" | "packs" = "prompts";
let isSyncing = false;

// ============ Utilities ============

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    const m: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return m[c] ?? c;
  });
}

function toast(msg: string) {
  let el = document.getElementById("pp-popup-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pp-popup-toast";
    el.style.cssText = `
      position: fixed; left: 50%; bottom: 10px; transform: translateX(-50%);
      z-index: 999999; padding: 8px 10px; border-radius: 10px;
      background: var(--toast-bg); color: var(--toast-text); font-size: 12px;
      opacity: 0; transition: opacity 140ms ease; pointer-events: none;
      border: 1px solid var(--border); box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    `;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  setTimeout(() => (el!.style.opacity = "0"), 900);
}

function groupBySource(items: LocalPrompt[]) {
  const groups: Record<PromptSource, LocalPrompt[]> = { chatgpt: [], claude: [], gemini: [] };
  for (const p of items) groups[p.source]?.push(p);
  for (const k of Object.keys(groups) as PromptSource[]) {
    groups[k].sort((a, b) => b.createdAt - a.createdAt);
  }
  return groups;
}

function sectionTitle(source: PromptSource) {
  if (source === "chatgpt") return "ChatGPT";
  if (source === "claude") return "Claude";
  return "Gemini";
}

function isLongPrompt(text: string) {
  const t = text.trim();
  return t.length > 180 || t.includes("\n");
}

async function detectActiveSource(): Promise<PromptSource> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return "chatgpt";
    const url = tab.url.toLowerCase();
    if (url.includes("claude.ai")) return "claude";
    if (url.includes("gemini.google.com")) return "gemini";
    if (url.includes("chatgpt.com") || url.includes("chat.openai.com")) return "chatgpt";
    return "chatgpt";
  } catch {
    return "chatgpt";
  }
}

// ============ Sync ============

async function syncWithCloud() {
  if (!authState.isAuthenticated || isSyncing) return;

  isSyncing = true;
  const syncBtn = document.getElementById("pp-sync-btn");
  if (syncBtn) syncBtn.classList.add("pp-syncing");

  try {
    // Get local prompts that need syncing
    const localPrompts = await getAllPrompts();
    const pendingSync = localPrompts.filter(p => p.syncStatus === "pending");

    if (pendingSync.length > 0) {
      // Sync to cloud
      await api.syncPrompts(pendingSync);
    }

    // Refresh entitlements
    await refreshEntitlements();

    toast("Synced");
  } catch {
    toast("Sync failed");
  } finally {
    isSyncing = false;
    if (syncBtn) syncBtn.classList.remove("pp-syncing");
  }
}

// ============ Import/Export ============

async function importPmtpk(file: File) {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check file type
    const encrypted = isEncrypted(bytes);
    const obfuscated = isObfuscated(bytes);

    let jsonString: string;

    if (encrypted) {
      const password = prompt("Enter password (5 characters):");
      if (!password) {
        toast("Import cancelled");
        return;
      }
      if (password.length !== 5) {
        toast("Password must be 5 characters");
        return;
      }
      jsonString = await decryptPmtpk(bytes, password);
    } else if (obfuscated) {
      jsonString = await decodePmtpk(bytes);
    } else {
      jsonString = new TextDecoder().decode(bytes);
    }

    const data = JSON.parse(jsonString);

    if (!data.prompts || !Array.isArray(data.prompts)) {
      toast("Invalid .pmtpk file");
      return;
    }

    const source = (data.source as PromptSource) || "chatgpt";

    const currentCount = await getPromptCount();
    const { limit, remaining } = await canSavePrompt(currentCount);

    if (data.prompts.length > remaining) {
      toast(`Can only import ${remaining} more (limit: ${limit})`);
      return;
    }

    const imported: LocalPrompt[] = [];
    for (const p of data.prompts) {
      const newPrompt = await dbSavePrompt({
        text: p.text,
        source,
        url: p.url || "",
      });
      imported.push(newPrompt);
    }

    undoStack.push({ type: "import", prompts: imported });
    toast(`Imported ${imported.length} prompt${imported.length !== 1 ? "s" : ""}`);
    await render();
  } catch (e) {
    if (e instanceof PmtpkError) {
      switch (e.code) {
        case 'WRONG_PASSWORD': toast("Wrong password"); break;
        case 'CORRUPTED': toast("File is corrupted"); break;
        case 'UNSUPPORTED_VERSION': toast("Please update PromptPack"); break;
        case 'INVALID_FORMAT': toast("Invalid file format"); break;
        default: toast("Failed to import file");
      }
    } else {
      toast("Failed to import file");
    }
  }
}

// ============ Undo ============

async function performUndo() {
  const action = undoStack.pop();
  if (!action) { toast("Nothing to undo"); return; }

  if (action.type === "delete" || action.type === "delete-folder") {
    for (const p of action.prompts) {
      await dbSavePrompt({ text: p.text, source: p.source, url: p.url });
    }
    toast(`Restored ${action.prompts.length} prompt${action.prompts.length !== 1 ? "s" : ""}`);
  } else if (action.type === "import") {
    for (const p of action.prompts) {
      await dbDeletePrompt(p.id);
    }
    toast(`Removed ${action.prompts.length} imported prompt${action.prompts.length !== 1 ? "s" : ""}`);
  }

  await render();
}

// ============ Render Functions ============

function renderPromptRow(p: LocalPrompt) {
  const full = p.text.trim();
  const preview = full.replace(/\s+/g, " ").trim();
  const shown = preview.length > 160 ? preview.slice(0, 160) + "..." : preview;
  const long = isLongPrompt(full);
  const syncIcon = p.syncStatus === "synced" ? "☁️" : p.syncStatus === "pending" ? "⏳" : "";

  if (!long) {
    return `
      <div class="pp-row">
        <div class="pp-text" title="${esc(full)}">${syncIcon} ${esc(full)}</div>
        <div class="pp-actions">
          <button class="pp-btn" data-copy="${esc(p.id)}" type="button">Copy</button>
          <button class="pp-icon-btn" data-del="${esc(p.id)}" type="button" aria-label="Delete" title="Delete">${ICON.delete}</button>
        </div>
      </div>
    `;
  }

  return `
    <details class="pp-item" data-id="${esc(p.id)}">
      <summary class="pp-item-sum">
        <div class="pp-item-left">
          <span class="pp-item-arrow">${ICON.chevron}</span>
          <span class="pp-item-preview">${syncIcon} ${esc(shown)}</span>
        </div>
        <div class="pp-actions">
          <button class="pp-btn" data-copy="${esc(p.id)}" type="button">Copy</button>
          <button class="pp-icon-btn" data-del="${esc(p.id)}" type="button" aria-label="Delete" title="Delete">${ICON.delete}</button>
        </div>
      </summary>
      <div class="pp-item-body">
        <pre class="pp-full">${esc(full)}</pre>
      </div>
    </details>
  `;
}

function renderPackRow(pack: LocalPack) {
  return `
    <div class="pp-pack-row" data-pack-id="${esc(pack.id)}">
      <div class="pp-pack-info">
        <div class="pp-pack-title">${esc(pack.meta.title)}</div>
        <div class="pp-pack-meta">${pack.meta.promptCount} prompts • by ${esc(pack.meta.author)}</div>
      </div>
      <div class="pp-actions">
        ${pack.isLoaded
          ? `<button class="pp-btn pp-btn-secondary" data-unload-pack="${esc(pack.id)}" type="button">Unload</button>`
          : `<button class="pp-btn" data-load-pack="${esc(pack.id)}" type="button">Load</button>`
        }
      </div>
    </div>
  `;
}

function renderAuthHeader() {
  if (!authState.isAuthenticated) {
    return `
      <div class="pp-auth-bar">
        <button class="pp-btn pp-btn-primary" id="pp-login-btn" type="button">
          ${ICON.user} Sign In
        </button>
      </div>
    `;
  }

  const tierBadge = authState.user?.tier === "paid"
    ? `<span class="pp-badge pp-badge-pro">${ICON.crown} Pro</span>`
    : `<span class="pp-badge pp-badge-free">Free</span>`;

  return `
    <div class="pp-auth-bar">
      <div class="pp-user-info">
        ${tierBadge}
        <span class="pp-email">${esc(authState.user?.email || "")}</span>
      </div>
      <div class="pp-auth-actions">
        ${authState.user?.tier === "free"
          ? `<button class="pp-btn pp-btn-upgrade" id="pp-upgrade-btn" type="button">${ICON.crown} Upgrade</button>`
          : `<button class="pp-icon-btn" id="pp-billing-btn" type="button" title="Manage Subscription">${ICON.crown}</button>`
        }
        <button class="pp-icon-btn" id="pp-sync-btn" type="button" title="Sync">${ICON.sync}</button>
        <button class="pp-icon-btn" id="pp-logout-btn" type="button" title="Sign Out">${ICON.logout}</button>
      </div>
    </div>
  `;
}

function renderTabs() {
  return `
    <div class="pp-tabs">
      <button class="pp-tab ${currentTab === "prompts" ? "pp-tab-active" : ""}" data-tab="prompts" type="button">
        Prompts
      </button>
      <button class="pp-tab ${currentTab === "packs" ? "pp-tab-active" : ""}" data-tab="packs" type="button">
        ${ICON.pack} Packs
      </button>
    </div>
  `;
}

async function renderPromptsTab() {
  const items = await getAllPrompts();
  const groups = groupBySource(items);
  const order: PromptSource[] = ["chatgpt", "claude", "gemini"];
  const activeSource = await detectActiveSource();
  const count = items.length;
  const limit = getPromptLimit(authState);

  return `
    <div class="pp-usage-bar">
      <span>${count} / ${limit} prompts</span>
      <div class="pp-progress">
        <div class="pp-progress-fill" style="width: ${Math.min(100, (count / limit) * 100)}%"></div>
      </div>
    </div>
    ${order.map((src) => {
      const arr = groups[src] ?? [];
      const openAttr = src === activeSource ? "open" : "";
      return `
        <details class="pp-sec" ${openAttr} data-source="${src}">
          <summary>
            <div class="pp-sum-left">
              <span class="pp-arrow">${ICON.chevron}</span>
              <span>${sectionTitle(src)}</span>
            </div>
            <div class="pp-actions">
              <button class="pp-icon-btn" data-export="${src}" title="Export ${sectionTitle(src)} prompts">${ICON.export}</button>
              <button class="pp-icon-btn" data-delete-folder="${src}" title="Delete all ${sectionTitle(src)} prompts">${ICON.delete}</button>
              <span class="pp-count">${arr.length}</span>
            </div>
          </summary>
          <div class="pp-list">
            ${arr.length
              ? arr.map(renderPromptRow).join("")
              : `<div class="pp-empty">No prompts saved for ${sectionTitle(src)} yet.</div>`
            }
          </div>
        </details>
      `;
    }).join("")}
  `;
}

async function renderPacksTab() {
  const loadedPacks = await getLoadedPacks();
  const purchasedPacks = await getPurchasedPacks();
  const loadedCount = loadedPacks.length;
  const limit = authState.entitlements?.loadedPackLimit ?? 2;

  // Filter purchased packs that aren't loaded
  const unloadedPurchased = purchasedPacks.filter(p => !p.isLoaded);

  return `
    <div class="pp-usage-bar">
      <span>${loadedCount} / ${limit} loaded packs</span>
      <div class="pp-progress">
        <div class="pp-progress-fill" style="width: ${Math.min(100, (loadedCount / limit) * 100)}%"></div>
      </div>
    </div>

    ${loadedPacks.length > 0 ? `
      <div class="pp-pack-section">
        <div class="pp-pack-section-title">Loaded Packs</div>
        ${loadedPacks.map(renderPackRow).join("")}
      </div>
    ` : ""}

    ${unloadedPurchased.length > 0 ? `
      <div class="pp-pack-section">
        <div class="pp-pack-section-title">Purchased Packs</div>
        ${unloadedPurchased.map(renderPackRow).join("")}
      </div>
    ` : ""}

    ${loadedPacks.length === 0 && unloadedPurchased.length === 0 ? `
      <div class="pp-empty-state">
        <div class="pp-empty-icon">${ICON.pack}</div>
        <div class="pp-empty-title">No packs yet</div>
        <div class="pp-empty-text">Browse the marketplace to discover prompt packs</div>
        <button class="pp-btn pp-btn-primary" id="pp-browse-marketplace-btn" type="button">
          Browse Marketplace
        </button>
      </div>
    ` : `
      <div class="pp-marketplace-link">
        <button class="pp-btn pp-btn-secondary" id="pp-browse-marketplace-btn" type="button">
          ${ICON.pack} Browse Marketplace
        </button>
      </div>
    `}
  `;
}

// ============ Main Render ============

let storageListenerRegistered = false;
let delegationSetup = false;

function ensureThemeListenerOnce() {
  if (storageListenerRegistered) return;
  storageListenerRegistered = true;

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    const c = changes[THEME_KEY];
    if (!c) return;
    const newTheme = (c.newValue as ThemeMode) ?? getSystemTheme();
    document.documentElement.dataset.theme = newTheme;
    await render();
  });
}

function setupEventDelegation() {
  if (delegationSetup) return;
  delegationSetup = true;

  const app = document.getElementById("app");
  if (!app) return;

  app.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest("button") as HTMLButtonElement | null;
    if (!btn) return;

    // Tab switching
    if (btn.dataset.tab) {
      currentTab = btn.dataset.tab as "prompts" | "packs";
      await render();
      return;
    }

    // Auth actions
    if (btn.id === "pp-login-btn") {
      await login();
      return;
    }
    if (btn.id === "pp-logout-btn") {
      await logout();
      authState = { isAuthenticated: false };
      await render();
      return;
    }
    if (btn.id === "pp-upgrade-btn") {
      await openUpgradePage();
      return;
    }
    if (btn.id === "pp-billing-btn") {
      await openBillingPortal();
      return;
    }
    if (btn.id === "pp-sync-btn") {
      await syncWithCloud();
      return;
    }

    // Marketplace
    if (btn.id === "pp-browse-marketplace-btn") {
      await chrome.tabs.create({ url: "https://pmtpk.ai/marketplace" });
      return;
    }

    // Copy prompt
    if (btn.dataset.copy) {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.copy;
      const p = await getPrompt(id);
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
      const prompt = await getPrompt(id);
      if (prompt) {
        undoStack.push({ type: "delete", prompts: [prompt] });
        await dbDeletePrompt(id);
        // If authenticated, also delete from cloud
        if (authState.isAuthenticated && prompt.cloudId) {
          api.deletePrompt(prompt.cloudId).catch(() => {});
        }
      }
      toast("Deleted");
      await render();
      return;
    }

    // Delete folder
    if (btn.dataset.deleteFolder) {
      e.preventDefault();
      e.stopPropagation();
      const source = btn.dataset.deleteFolder as PromptSource;
      const items = await getAllPrompts();
      const sourcePrompts = items.filter(p => p.source === source);
      if (sourcePrompts.length === 0) {
        toast("No prompts to delete");
        return;
      }
      undoStack.push({ type: "delete-folder", prompts: sourcePrompts, source });
      await dbDeleteBySource(source);
      if (authState.isAuthenticated) {
        api.deletePromptsBySource(source).catch(() => {});
      }
      toast(`Deleted ${sourcePrompts.length} prompt${sourcePrompts.length !== 1 ? "s" : ""}`);
      await render();
      return;
    }

    // Export
    if (btn.dataset.export) {
      e.preventDefault();
      e.stopPropagation();
      const source = btn.dataset.export as PromptSource;
      const items = await getAllPrompts();
      const sourcePrompts = items.filter(p => p.source === source);
      if (sourcePrompts.length === 0) {
        toast("No prompts to export");
        return;
      }

      const password = prompt("Enter a 5-character password to encrypt (or leave empty for no encryption):");
      if (password === null) return;
      if (password && password.length !== 5) {
        toast("Password must be exactly 5 characters");
        return;
      }

      const exportData = {
        version: SCHEMA_VERSION,
        source,
        exportedAt: new Date().toISOString(),
        prompts: sourcePrompts.map(p => ({ text: p.text, url: p.url, createdAt: p.createdAt }))
      };

      const jsonString = JSON.stringify(exportData);
      const fileData = password
        ? await encryptPmtpk(jsonString, password)
        : await encodePmtpk(jsonString);

      const blob = new Blob([new Uint8Array(fileData)], { type: "application/octet-stream" });
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

    // Import button
    if (btn.id === "pp-import-btn") {
      const importInput = document.getElementById("pp-import-input") as HTMLInputElement | null;
      if (importInput) importInput.click();
      return;
    }

    // Undo button
    if (btn.id === "pp-undo-btn") {
      await performUndo();
      return;
    }

    // Load pack
    if (btn.dataset.loadPack) {
      const packId = btn.dataset.loadPack;
      const loadedCount = await getLoadedPackCount();
      const { allowed, limit } = await canLoadPack(loadedCount);

      if (!allowed) {
        toast(`Pack limit reached (${limit})`);
        if (authState.user?.tier === "free") {
          toast("Upgrade to load more packs");
        }
        return;
      }

      try {
        await api.loadPack(packId);
        toast("Pack loaded");
        await render();
      } catch {
        toast("Failed to load pack");
      }
      return;
    }

    // Unload pack
    if (btn.dataset.unloadPack) {
      const packId = btn.dataset.unloadPack;
      try {
        await api.unloadPack(packId);
        toast("Pack unloaded");
        await render();
      } catch {
        toast("Failed to unload pack");
      }
      return;
    }
  });

  // File input handler
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
}

async function render() {
  await applyThemeFromStorageToRoot();
  ensureThemeListenerOnce();

  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app in popup index.html");

  // Get auth state
  authState = await getAuthState();
  document.documentElement.dataset.activeSource = await detectActiveSource();

  const tabContent = currentTab === "prompts"
    ? await renderPromptsTab()
    : await renderPacksTab();

  // Show import button only if user has pro billing
  const isPro = authState.billing?.isPro ?? false;
  const importButton = isPro
    ? `<button class="pp-icon-btn" id="pp-import-btn" title="Import .pmtpk">${ICON.import}</button>`
    : "";

  app.innerHTML = `
    <div class="pp-wrap">
      <div class="pp-header">
        <div class="pp-title">PromptPack</div>
        <div class="pp-header-actions">
          ${importButton}
          <button class="pp-icon-btn" id="pp-undo-btn" title="Undo">${ICON.undo}</button>
        </div>
      </div>
      <input type="file" id="pp-import-input" accept=".pmtpk" style="display:none">

      ${renderAuthHeader()}
      ${renderTabs()}

      <div class="pp-tab-content">
        ${tabContent}
      </div>
    </div>
  `;

  setupEventDelegation();
}

// ============ Init ============

async function init() {
  // Migrate from chrome.storage if needed
  await migrateFromChromeStorage();

  await render();

  // Background sync if authenticated
  const state = await getAuthState();
  if (state.isAuthenticated) {
    syncWithCloud().catch(() => {});
  }
}

init();
