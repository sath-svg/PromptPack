import "./popup.css";
import { listPrompts, deletePrompt, deletePromptsBySource, type PromptItem, type PromptSource } from "./shared/promptStore";
import { THEME_KEY, getSystemTheme, applyThemeFromStorageToRoot, type ThemeMode } from "./shared/theme";
import { encryptPmtpk, decryptPmtpk, encodePmtpk, decodePmtpk, isObfuscated, isEncrypted, SCHEMA_VERSION, PmtpkError } from "./shared/crypto";
import { getAuthState, type AuthState } from "./shared/auth";
import { clearSession } from "./shared/db";

// SVG Icons
const ICON = {
  import: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  undo: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  export: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  save: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  delete: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  chevron: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,0 10,5 2,10"/></svg>`,
  user: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
};

// Auth state
let authState: AuthState = { isAuthenticated: false };
let isSyncing = false;

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

  const KEY = "promptpack_prompts";
  const res = await chrome.storage.local.get(KEY);
  const existing = (res[KEY] as PromptItem[] | undefined) ?? [];

  if (action.type === "delete" || action.type === "delete-folder") {
    // Restore deleted prompts
    const restored = [...action.prompts, ...existing];
    await chrome.storage.local.set({ [KEY]: restored });
    toast(`Restored ${action.prompts.length} prompt${action.prompts.length !== 1 ? "s" : ""}`);
  } else if (action.type === "import") {
    // Remove imported prompts
    const importedIds = new Set(action.prompts.map(p => p.id));
    const filtered = existing.filter(p => !importedIds.has(p.id));
    await chrome.storage.local.set({ [KEY]: filtered });
    toast(`Removed ${action.prompts.length} imported prompt${action.prompts.length !== 1 ? "s" : ""}`);
  }

  await render();
}

async function importPmtpk(file: File) {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let jsonString: string;

    if (isEncrypted(bytes)) {
      // Encrypted file - prompt for password
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
    } else if (isObfuscated(bytes)) {
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
    const KEY = "promptpack_prompts";
    const res = await chrome.storage.local.get(KEY);
    const existing = (res[KEY] as PromptItem[] | undefined) ?? [];

    const imported: PromptItem[] = [];
    for (const p of data.prompts) {
      const newPrompt: PromptItem = {
        id: crypto.randomUUID(),
        text: p.text,
        source,
        url: p.url || "",
        createdAt: p.createdAt || Date.now()
      };
      imported.push(newPrompt);
    }

    const merged = [...imported, ...existing];
    await chrome.storage.local.set({ [KEY]: merged });

    // Push to undo stack
    undoStack.push({ type: "import", prompts: imported });

    toast(`Imported ${imported.length} prompt${imported.length !== 1 ? "s" : ""}`);
    await render();
  } catch (e) {
    console.error("Import error:", e);
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
  setTimeout(() => (el!.style.opacity = "0"), 900);
}

function groupBySource(items: PromptItem[]) {
  const groups: Record<PromptItem["source"], PromptItem[]> = {
    chatgpt: [],
    claude: [],
    gemini: [],
  };
  for (const p of items) groups[p.source]?.push(p);
  for (const k of Object.keys(groups) as Array<PromptItem["source"]>) {
    groups[k].sort((a, b) => b.createdAt - a.createdAt);
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

  if (!long) {
    return `
      <div class="pp-row">
        <div class="pp-text" title="${esc(full)}">${esc(full)}</div>
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
          <span class="pp-item-preview">${esc(shown)}</span>
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

    // Update the theme attribute
    document.documentElement.dataset.theme = newTheme;

    // Also re-render to update active source in case user switched tabs
    await render();
  });
}

async function detectActiveSource(): Promise<PromptItem["source"]> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return "chatgpt";

    const url = tab.url.toLowerCase();
    if (url.includes("claude.ai")) return "claude";
    if (url.includes("gemini.google.com")) return "gemini";
    if (url.includes("chatgpt.com") || url.includes("chat.openai.com")) return "chatgpt";

    return "chatgpt"; // default
  } catch {
    return "chatgpt"; // fallback
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
      const sourcePrompts = items.filter(p => p.source === source);

      if (sourcePrompts.length === 0) {
        toast("No prompts to delete");
        return;
      }

      undoStack.push({ type: "delete-folder", prompts: sourcePrompts, source });
      await deletePromptsBySource(source);
      toast(`Deleted ${sourcePrompts.length} prompt${sourcePrompts.length !== 1 ? "s" : ""}`);
      await render();
      return;
    }

    // Export button
    if (btn.dataset.export) {
      e.preventDefault();
      e.stopPropagation();

      const source = btn.dataset.export as PromptItem["source"];
      const items = await listPrompts();
      const sourcePrompts = items.filter(p => p.source === source);

      if (sourcePrompts.length === 0) {
        toast("No prompts to export");
        return;
      }

      // Ask if user wants to encrypt
      const password = prompt("Enter a 5-character password to encrypt (or leave empty for no encryption):");

      // User cancelled
      if (password === null) {
        return;
      }

      // Validate password if provided
      if (password && password.length !== 5) {
        toast("Password must be exactly 5 characters");
        return;
      }

      // Create export data with schema version
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

    // Dashboard/Login button - opens dashboard or sign-in
    // After opening, we'll detect where they land and update auth state
    if (btn.id === "pp-dashboard-btn" || btn.id === "pp-login-btn") {
      const targetUrl = btn.id === "pp-dashboard-btn"
        ? "http://localhost:3000/dashboard"
        : "http://localhost:3000/sign-in";

      // Open the tab
      const tab = await chrome.tabs.create({ url: targetUrl });

      if (tab.id) {
        // Listen for navigation to detect where they actually land
        const listener = (tabId: number, changeInfo: { url?: string; status?: string }, tab: chrome.tabs.Tab) => {
          if (tabId !== tab.id) return;

          // Check both URL changes and when page finishes loading
          const shouldCheck = changeInfo.url || (changeInfo.status === "complete" && tab.url);
          if (!shouldCheck) return;

          const url = (changeInfo.url || tab.url || "").toLowerCase();
          if (!url) return;

          // If any button led to sign-in page, user is logged out
          if (url.includes("/sign-in")) {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.storage.local.set({ pp_auth_check_needed: "logged_out" });
          }

          // If any button led to dashboard, user is logged in
          if (url.includes("/dashboard")) {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.storage.local.set({ pp_auth_check_needed: "logged_in" });
          }
        };

        chrome.tabs.onUpdated.addListener(listener);

        // Clean up listener after 10 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
        }, 10000);
      }

      return;
    }

    // Save to dashboard button (when logged in)
    if (btn.dataset.save) {
      e.preventDefault();
      e.stopPropagation();

      const source = btn.dataset.save as PromptItem["source"];
      const items = await listPrompts();
      const sourcePrompts = items.filter(p => p.source === source);

      if (sourcePrompts.length === 0) {
        toast("No prompts to save");
        return;
      }

      // TODO: Implement actual cloud save via Convex API
      toast(`Saving ${sourcePrompts.length} prompt${sourcePrompts.length !== 1 ? "s" : ""} to dashboard...`);
      // For now, just show a message - actual implementation would call api.savePrompts()
      setTimeout(() => toast("Saved to dashboard!"), 500);
      return;
    }
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
}

async function syncAuthState(): Promise<AuthState> {
  // Check if we have a pending auth check from button navigation
  const checkResult = await chrome.storage.local.get("pp_auth_check_needed");
  if (checkResult.pp_auth_check_needed) {
    // Clear the flag
    await chrome.storage.local.remove("pp_auth_check_needed");

    // Update auth state based on where the user landed
    if (checkResult.pp_auth_check_needed === "logged_out") {
      // User clicked button but landed on sign-in, so they're logged out
      await clearSession();
      return { isAuthenticated: false };
    } else if (checkResult.pp_auth_check_needed === "logged_in") {
      // User clicked button but landed on dashboard, so they're logged in
      // Get the full auth state from local session or web API
      return await getAuthState();
    }
  }

  // Check auth state by making a lightweight request
  // This runs every time popup opens to verify against Clerk's session
  try {
    const response = await fetch("http://localhost:3000/api/auth/status", {
      method: "GET",
      credentials: "include", // Include cookies for Clerk session
    });

    const data = await response.json() as {
      isAuthenticated: boolean;
      user?: {
        id: string;
        email: string;
      };
    };

    if (data.isAuthenticated && data.user) {
      // User is logged in on web - return auth state with user info from API
      return {
        isAuthenticated: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          tier: "free", // Default, will be updated from local session if available
        },
      };
    } else {
      // User is logged out on web
      await clearSession();
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    // Fallback to local session check
    return await getAuthState();
  }
}

async function render() {
  await applyThemeFromStorageToRoot();
  ensureThemeListenerOnce();

  const isLoggedIn = authState.isAuthenticated;

  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app in popup index.html");

  const items = await listPrompts();
  const groups = groupBySource(items);
  const order: PromptItem["source"][] = ["chatgpt", "claude", "gemini"];
  const activeSource = await detectActiveSource();

  // Set active source on root element for styling
  document.documentElement.dataset.activeSource = activeSource;

  // Render auth button based on state
  const syncIndicator = isSyncing ? `<span class="pp-sync-hint" title="Syncing...">•</span>` : "";
  const authButton = isLoggedIn
    ? `<button class="pp-icon-btn pp-logged-in" id="pp-dashboard-btn" title="Logged in - Go to Dashboard">${ICON.user}</button>`
    : `<button class="pp-icon-btn" id="pp-login-btn" title="Login">${ICON.user}</button>`;

  app.innerHTML = `
    <div class="pp-wrap">
      <div class="pp-header">
        <div class="pp-title">PromptPack${syncIndicator}</div>
        <div class="pp-header-actions">
          <button class="pp-icon-btn" id="pp-import-btn" title="Import .pmtpk">${ICON.import}</button>
          <button class="pp-icon-btn" id="pp-undo-btn" title="Undo">${ICON.undo}</button>
          ${authButton}
        </div>
      </div>
      <input type="file" id="pp-import-input" accept=".pmtpk" style="display:none">
      <div class="pp-sub">${isLoggedIn ? `Logged in as ${authState.user?.email}` : "Powered by PmtPk.ai. Click to expand"}</div>

      ${order
        .map((src) => {
          const arr = groups[src] ?? [];
          const openAttr = src === activeSource ? "open" : "";
          // Show save button if logged in, export button if not
          const saveOrExportBtn = isLoggedIn
            ? `<button class="pp-icon-btn" data-save="${src}" title="Save ${sectionTitle(src)} prompts to dashboard">${ICON.save}</button>`
            : `<button class="pp-icon-btn" data-export="${src}" title="Export ${sectionTitle(src)} prompts">${ICON.export}</button>`;
          return `
            <details class="pp-sec" ${openAttr} data-source="${src}">
              <summary>
                <div class="pp-sum-left">
                  <span class="pp-arrow">${ICON.chevron}</span>
                  <span>${sectionTitle(src)}</span>
                </div>
                <div class="pp-actions">
                  ${saveOrExportBtn}
                  <button class="pp-icon-btn" data-delete-folder="${src}" title="Delete all ${sectionTitle(src)} prompts">${ICON.delete}</button>
                  <span class="pp-count">${arr.length}</span>
                </div>
              </summary>
              <div class="pp-list">
                ${
                  arr.length
                    ? arr.map(renderPromptRow).join("")
                    : `<div class="pp-empty">No prompts saved for ${sectionTitle(src)} yet.</div>`
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

// Initial render with local state
render();

// Sync auth state in background
(async () => {
  isSyncing = true;
  await render(); // Show syncing indicator

  const newAuthState = await syncAuthState();
  const stateChanged = newAuthState.isAuthenticated !== authState.isAuthenticated;

  authState = newAuthState;
  isSyncing = false;

  // Only re-render if state actually changed
  if (stateChanged) {
    await render();
  } else {
    // Just remove sync indicator
    await render();
  }
})();
