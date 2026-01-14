// src/content/claude.ts
import { savePrompt, listPromptsBySourceGrouped } from "../shared/promptStore";
import { ENHANCE_API_URL } from "../shared/config";
import { startThemeSync, detectThemeFromPage, claudeTheme, type ThemeMode } from "../shared/theme";

type ComposerEl = HTMLTextAreaElement | HTMLElement;
type EnhanceMode = "structured" | "clarity" | "concise" | "strict";

const ENHANCE_OFFSET_RIGHT = 300;
const ENHANCE_OFFSET_BOTTOM = 64;

const SPARKLE_ICON = `
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3z"></path>
    <path d="M18 3l1 2.5L21.5 6l-2.5 1L18 9.5l-1-2.5L14.5 6l2.5-1L18 3z"></path>
  </svg>
`;

const SPINNER_ICON = `
  <svg class="pp-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12"></circle>
  </svg>
`;

function toast(msg: string, type: "success" | "error" = "success") {
  let el = document.getElementById("pp-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pp-toast";
    el.style.cssText = `
      position: absolute;
      z-index: 1000001;
      padding: 10px 12px;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
      pointer-events: none;
    `;
    document.body.appendChild(el);
  }

  // Set color based on type
  el.style.background = type === "error"
    ? "rgba(220, 38, 38, 0.92)"  // Red for errors
    : "rgba(59, 130, 246, 0.92)"; // Blue for success

  // Position next to composer
  const composer = findComposer();
  if (composer) {
    const rect = composer.getBoundingClientRect();
    const toastWidth = 200; // Approximate width
    const gap = 80; // Increased gap to avoid overlap with bubble

    // Position to the right of the composer
    el.style.position = "fixed";
    el.style.left = `${rect.right + gap}px`;
    el.style.top = `${rect.top}px`;

    // If toast would overflow right edge, position on the left instead
    if (rect.right + gap + toastWidth > window.innerWidth) {
      el.style.left = `${rect.left - toastWidth - gap}px`;
    }
  } else {
    // Fallback to fixed position if no composer found
    el.style.position = "fixed";
    el.style.right = "16px";
    el.style.bottom = "140px";
  }

  el.textContent = msg;
  el.style.opacity = "1";
  el.style.transform = "translateY(0)";
  window.setTimeout(() => {
    el!.style.opacity = "0";
    el!.style.transform = "translateY(6px)";
  }, 1400);
}

function isVisible(el: Element) {
  const r = (el as HTMLElement).getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  return (
    r.width > 10 &&
    r.height > 10 &&
    cs.display !== "none" &&
    cs.visibility !== "hidden" &&
    cs.opacity !== "0"
  );
}

function findComposer(): ComposerEl | null {
  // Claude uses a contenteditable div for the prompt input
  // Look for the specific Claude composer patterns first
  const claudeComposer = document.querySelector<HTMLElement>(
    '[contenteditable="true"][data-placeholder], ' +
    'div[contenteditable="true"].ProseMirror'
  );
  if (claudeComposer && isVisible(claudeComposer)) return claudeComposer;

  // Filter function to exclude settings/modal elements
  const isMainChatComposer = (el: HTMLElement): boolean => {
    // Exclude if inside modal/dialog/settings containers
    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 20) {
      const role = parent.getAttribute("role");
      const ariaModal = parent.getAttribute("aria-modal");

      // Skip if inside modal, dialog, or settings panel
      if (role === "dialog" || ariaModal === "true") return false;
      if (parent.classList.contains("modal") || parent.classList.contains("settings")) return false;

      // Skip if inside a form with settings-related classes or attributes
      if (parent.tagName === "FORM") {
        const formClasses = parent.className.toLowerCase();
        if (formClasses.includes("setting") || formClasses.includes("preference")) return false;
      }

      parent = parent.parentElement;
      depth++;
    }

    // Exclude by placeholder text (settings inputs, etc.)
    if (el instanceof HTMLTextAreaElement) {
      const placeholder = el.placeholder.toLowerCase();
      if (placeholder.includes("additional behavior") ||
          placeholder.includes("preference") ||
          placeholder.includes("custom instruction")) {
        return false;
      }
    }

    return true;
  };

  // Fallback: find largest contenteditable
  const ce = Array.from(document.querySelectorAll<HTMLElement>('[contenteditable="true"]'))
    .filter(isVisible)
    .filter(isMainChatComposer);
  if (ce.length) {
    // Find the largest one (the main composer)
    ce.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return ce[0];
  }

  // Fallback to textarea
  const areas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"))
    .filter(isVisible)
    .filter(isMainChatComposer);
  if (areas.length) {
    areas.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return areas[0];
  }

  return null;
}

/**
 * Extract plain text from composer, handling contenteditable quirks
 */
function getComposerText(el: ComposerEl): string {
  if (el instanceof HTMLTextAreaElement) {
    return el.value ?? "";
  }
  // For contenteditable, innerText handles newlines from block elements
  return el.innerText ?? "";
}

function setComposerText(el: ComposerEl, text: string): void {
  if (el instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (setter) {
      setter.call(el, text);
    } else {
      el.value = text;
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    return;
  }
  el.textContent = text;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
}

function positionControlsFixed(container: HTMLElement) {
  container.style.right = `${ENHANCE_OFFSET_RIGHT}px`;
  container.style.bottom = `${ENHANCE_OFFSET_BOTTOM}px`;
  container.style.left = "auto";
  container.style.top = "auto";
}

function ensureEnhanceStyles() {
  if (document.getElementById("pp-enhance-styles")) return;
  const style = document.createElement("style");
  style.id = "pp-enhance-styles";
  style.textContent = `
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }

    /* Claude dropdown styling with orange theme */
    #pp-enhance-mode option {
      background: #C15F3C;
      color: #ffffff;
    }
    #pp-enhance-mode:focus {
      outline: 2px solid rgba(193, 95, 60, 0.5);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
}

function setSelectArrow(select: HTMLSelectElement, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;
  select.style.setProperty("appearance", "none");
  select.style.setProperty("-webkit-appearance", "none");
  select.style.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  select.style.backgroundRepeat = "no-repeat";
  select.style.backgroundPosition = "right 6px center";
  select.style.backgroundSize = "10px 10px";
  select.style.paddingRight = "22px";
}

function applyEnhanceTheme(theme: ThemeMode) {
  const colors = theme === "dark" ? claudeTheme.dark : claudeTheme.light;

  const wrap = document.getElementById("pp-enhance-wrap") as HTMLDivElement | null;
  if (wrap) {
    wrap.style.background = colors.accent;
    wrap.style.border = "none";
    wrap.style.boxShadow = colors.shadow;
    wrap.style.borderRadius = "6px";
    wrap.style.fontFamily = colors.font;
    wrap.style.backdropFilter = "none";
    (wrap.style as any).webkitBackdropFilter = "none";
  }

  const saveBtn = document.getElementById("pp-save-btn") as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.style.background = "transparent";
    saveBtn.style.border = "none";
    saveBtn.style.color = "#ffffff";
    saveBtn.style.fontFamily = colors.font;
    saveBtn.style.borderRadius = "6px";
  }

  const enhanceBtn = document.getElementById("pp-enhance-btn") as HTMLButtonElement | null;
  if (enhanceBtn) {
    enhanceBtn.style.background = "transparent";
    enhanceBtn.style.border = "none";
    enhanceBtn.style.color = "#ffffff";
    enhanceBtn.style.fontFamily = colors.font;
    enhanceBtn.style.borderRadius = "6px";
  }

  const modeSelect = document.getElementById("pp-enhance-mode") as HTMLSelectElement | null;
  if (modeSelect) {
    modeSelect.style.background = "transparent";
    modeSelect.style.border = "none";
    modeSelect.style.color = "#ffffff";
    modeSelect.style.fontFamily = colors.font;
    setSelectArrow(modeSelect, "#ffffff");
  }

  const status = document.getElementById("pp-enhance-status") as HTMLSpanElement | null;
  if (status) {
    status.style.color = colors.text;
  }
}

let currentComposer: ComposerEl | null = null;
let currentTheme: ThemeMode = detectThemeFromPage();
let lastUrl = location.href;
let tickScheduled = false;
let observer: MutationObserver | null = null;
let wasGenerating = false;
let isFirstPrompt = true; // Skip bubble for first prompt only
let processedUserBubbles = new Set<Element>(); // Track which user message bubbles we've added save icons to
let enhanceMode: EnhanceMode = "structured";
let enhanceInFlight = false;
let lastCanEnhance = false;

function validateEnhanceControls(): HTMLDivElement | null {
  const wrap = document.getElementById("pp-enhance-wrap") as HTMLDivElement | null;
  if (wrap && document.body.contains(wrap)) return wrap;
  return null;
}


async function getEnhanceAuthToken(): Promise<string | null> {
  if (!chrome?.runtime?.sendMessage) return null;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "PP_GET_ENHANCE_TOKEN" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      const token = (response as { token?: string } | undefined)?.token;
      resolve(typeof token === "string" ? token : null);
    });
  });
}

function updateEnhanceAvailability(canEnhance: boolean) {
  lastCanEnhance = canEnhance;
  const saveBtn = document.getElementById("pp-save-btn") as HTMLButtonElement | null;
  const enhanceBtn = document.getElementById("pp-enhance-btn") as HTMLButtonElement | null;
  const disabled = !canEnhance || enhanceInFlight;
  if (saveBtn) {
    saveBtn.disabled = disabled;
    saveBtn.style.opacity = disabled ? "0.6" : "1";
    saveBtn.style.cursor = disabled ? "not-allowed" : "pointer";
  }
  if (enhanceBtn) {
    enhanceBtn.disabled = disabled;
    enhanceBtn.style.opacity = disabled ? "0.6" : "1";
    enhanceBtn.style.cursor = disabled ? "not-allowed" : "pointer";
  }
}

function setEnhanceLoading(loading: boolean) {
  enhanceInFlight = loading;
  const enhanceBtn = document.getElementById("pp-enhance-btn") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("pp-save-btn") as HTMLButtonElement | null;
  const status = document.getElementById("pp-enhance-status") as HTMLSpanElement | null;
  const modeSelect = document.getElementById("pp-enhance-mode") as HTMLSelectElement | null;

  if (enhanceBtn) {
    enhanceBtn.innerHTML = loading ? SPINNER_ICON : SPARKLE_ICON;
    enhanceBtn.setAttribute("aria-busy", loading ? "true" : "false");
    enhanceBtn.title = loading ? "Enhancing..." : "Enhance prompt";
  }
  if (saveBtn) {
    saveBtn.disabled = loading || !lastCanEnhance;
  }
  if (status) {
    status.textContent = loading ? "Enhancing..." : "";
    status.style.display = loading ? "inline-flex" : "none";
  }
  if (modeSelect) modeSelect.disabled = loading;

  updateEnhanceAvailability(lastCanEnhance);
}

async function handleSave() {
  if (!currentComposer) return;
  const text = getComposerText(currentComposer).trim();
  if (!text) return toast("Nothing to save", "error");

  const result = await savePrompt({
    text,
    source: "claude",
    url: location.href,
  });

  if (result.ok) {
    return toast(`Saved (${result.count}/${result.max})`, "success");
  }
  if (result.reason === "limit") return toast("Limit reached", "error");
  if (result.reason === "empty") return toast("Nothing to save", "error");
}

function showEnhancePreview(original: string, enhanced: string) {
  const existing = document.getElementById("pp-enhance-preview");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "pp-enhance-preview";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  const panelBg = currentTheme === "dark" ? "rgba(25, 25, 28, 0.98)" : "#ffffff";
  const panelText = currentTheme === "dark" ? "#f9fafb" : "#111827";
  const panelBorder = currentTheme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
  const fieldBg = currentTheme === "dark" ? "rgba(15, 15, 18, 0.95)" : "rgba(248, 248, 248, 0.98)";

  const panel = document.createElement("div");
  panel.style.cssText = `
    background: ${panelBg};
    color: ${panelText};
    border: 1px solid ${panelBorder};
    border-radius: 12px;
    width: min(900px, 100%);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
  `;

  const header = document.createElement("div");
  header.textContent = "Enhance preview";
  header.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    font-family: ${claudeTheme.light.font};
  `;

  const columns = document.createElement("div");
  columns.style.cssText = `
    display: flex;
    gap: 12px;
    flex: 1;
    overflow: auto;
  `;
  if (window.innerWidth < 720) {
    columns.style.flexDirection = "column";
  }

  const makeColumn = (label: string, value: string) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    `;
    const title = document.createElement("div");
    title.textContent = label;
    title.style.cssText = `font-size: 12px; opacity: 0.75;`;
    const area = document.createElement("textarea");
    area.readOnly = true;
    area.value = value;
    area.style.cssText = `
      flex: 1;
      min-height: 180px;
      resize: vertical;
      background: ${fieldBg};
      color: ${panelText};
      border: 1px solid ${panelBorder};
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
      line-height: 1.4;
      font-family: ${claudeTheme.light.font};
    `;
    wrapper.appendChild(title);
    wrapper.appendChild(area);
    return wrapper;
  };

  columns.appendChild(makeColumn("Before", original));
  columns.appendChild(makeColumn("After", enhanced));

  const actions = document.createElement("div");
  actions.style.cssText = `
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;

  const actionBtn = (label: string) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.style.cssText = `
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid ${panelBorder};
      background: ${fieldBg};
      color: ${panelText};
      font-size: 12px;
      cursor: pointer;
      font-family: ${claudeTheme.light.font};
    `;
    return btn;
  };

  const replaceBtn = actionBtn("Replace");
  const saveBtn = actionBtn("Save");
  const cancelBtn = actionBtn("Cancel");

  const cleanup = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") cleanup();
  };

  const actionColors = currentTheme === "dark" ? claudeTheme.dark : claudeTheme.light;
  replaceBtn.style.background = actionColors.accent;
  replaceBtn.style.color = "#ffffff";
  replaceBtn.style.border = "none";

  replaceBtn.addEventListener("click", () => {
    const composer = findComposer();
    if (!composer) return;
    currentComposer = composer;
    setComposerText(composer, enhanced);
    composer.focus();
    cleanup();
    toast("Prompt replaced", "success");
  });

  const saveIconUrl = chrome.runtime.getURL("img/icon-16.png");
  saveBtn.title = "Save to PromptPack";
  saveBtn.setAttribute("aria-label", "Save to PromptPack");
  saveBtn.innerHTML = `<img src="${saveIconUrl}" width="16" height="16" alt="">`;
  saveBtn.style.padding = "6px";
  saveBtn.style.width = "32px";
  saveBtn.style.height = "32px";
  saveBtn.style.display = "inline-flex";
  saveBtn.style.alignItems = "center";
  saveBtn.style.justifyContent = "center";
  saveBtn.addEventListener("click", async () => {
    const result = await savePrompt({
      text: enhanced,
      source: "claude",
      url: location.href,
    });

    if (result.ok) {
      toast(`Saved (${result.count}/${result.max})`, "success");
      return;
    }
    if (result.reason === "limit") return toast("Limit reached", "error");
    if (result.reason === "empty") return toast("Nothing to save", "error");
    toast("Failed to save", "error");
  });

  cancelBtn.addEventListener("click", cleanup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });
  document.addEventListener("keydown", onKeyDown);

  actions.appendChild(replaceBtn);
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  panel.appendChild(header);
  panel.appendChild(columns);
  panel.appendChild(actions);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

async function handleEnhance() {
  if (enhanceInFlight) return;
  if (!currentComposer) return;

  const text = getComposerText(currentComposer).trim();
  if (!text) return;
  if (text.length > 6000) {
    toast("Prompt too long to enhance. Try shortening it.", "error");
    return;
  }

  // Check authentication - require sign in for enhance feature
  const authToken = await getEnhanceAuthToken();
  if (!authToken) {
    toast("Sign in to use enhance feature", "error");
    return;
  }

  setEnhanceLoading(true);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
    };

    const response = await fetch(ENHANCE_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, mode: enhanceMode }),
    });

    if (response.status === 429) {
      const error = await response.json().catch(() => ({ error: "" })) as { error?: string };
      const message = typeof error.error === "string" && error.error.trim()
        ? error.error
        : "You've hit the enhance limit. Try again later.";
      toast(message, "error");
      return;
    }

    if (response.status === 400) {
      const error = await response.json().catch(() => ({ error: "" })) as { error?: string };
      if (error.error?.toLowerCase().includes("too long")) {
        toast("Prompt too long to enhance. Try shortening it.", "error");
        return;
      }
    }

    if (!response.ok) {
      toast("Enhance failed. Try again.", "error");
      return;
    }

    const data = await response.json() as { enhanced?: string };
    if (!data.enhanced) {
      toast("Enhance failed. Try again.", "error");
      return;
    }

    showEnhancePreview(text, data.enhanced);
  } catch {
    toast("Enhance failed. Check your connection.", "error");
  } finally {
    setEnhanceLoading(false);
  }
}

function ensureEnhanceControls() {
  let wrap = validateEnhanceControls();

  if (!wrap) {
    const orphan = document.getElementById("pp-enhance-wrap");
    if (orphan) orphan.remove();

    ensureEnhanceStyles();

    wrap = document.createElement("div");
    wrap.id = "pp-enhance-wrap";
    wrap.style.cssText = `
      position: fixed;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 999px;
      user-select: none;
    `;

    const modeSelect = document.createElement("select");
    modeSelect.id = "pp-enhance-mode";
    modeSelect.title = "Enhance mode";
    modeSelect.style.cssText = `
      height: 32px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      max-width: 130px;
    `;

    const options: Array<{ value: EnhanceMode; label: string }> = [
      { value: "structured", label: "Structured" },
      { value: "clarity", label: "Clarity" },
      { value: "concise", label: "Concise" },
      { value: "strict", label: "Strict" },
    ];
    options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      modeSelect.appendChild(opt);
    });
    modeSelect.value = enhanceMode;
    modeSelect.addEventListener("change", () => {
      enhanceMode = modeSelect.value as EnhanceMode;
    });

    const enhanceBtn = document.createElement("button");
    enhanceBtn.id = "pp-enhance-btn";
    enhanceBtn.type = "button";
    enhanceBtn.title = "Enhance prompt";
    enhanceBtn.setAttribute("aria-label", "Enhance prompt");
    enhanceBtn.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;
    enhanceBtn.innerHTML = SPARKLE_ICON;
    enhanceBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      void handleEnhance();
    });

    const saveBtn = document.createElement("button");
    saveBtn.id = "pp-save-btn";
    saveBtn.type = "button";
    saveBtn.title = "Save prompt";
    saveBtn.setAttribute("aria-label", "Save prompt");
    saveBtn.textContent = "Save";
    saveBtn.style.cssText = `
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      font-family: ${claudeTheme.light.font};
    `;
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      void handleSave();
    });

    const status = document.createElement("span");
    status.id = "pp-enhance-status";
    status.style.cssText = `
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
      color: ${claudeTheme.light.text};
      font-family: ${claudeTheme.light.font};
    `;

    wrap.appendChild(modeSelect);
    wrap.appendChild(enhanceBtn);
    wrap.appendChild(saveBtn);
    wrap.appendChild(status);

    document.body.appendChild(wrap);
  }

  applyEnhanceTheme(currentTheme);
  updateEnhanceAvailability(lastCanEnhance);
  return wrap;
}

function setupSaveKeybind() {
  // Listen for Alt+Shift+S keyboard shortcut
  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    if (!e.shiftKey) return;
    if (e.key.toLowerCase() !== "s") return;
    if (e.repeat) return;

    const composer = findComposer();
    if (composer) currentComposer = composer;

    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      if (!composer || (target !== composer && !composer.contains(target))) {
        return;
      }
    }

    e.preventDefault();
    e.stopPropagation();
    void handleSave();
  });
}

function isGenerating(): boolean {
  const selectors = [
    'button[aria-label*="Stop"]',
    'button[aria-label*="stop"]',
    'button[title*="Stop"]',
    'button[title*="stop"]',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && isVisible(el)) return true;
  }
  return false;
}

/**
 * Create a save icon button for user message bubbles
 */
function createBubbleSaveIcon(promptText: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "pp-bubble-save-icon";
  btn.type = "button";
  btn.setAttribute("aria-label", "Save prompt to PromptPack");
  btn.title = "Save to PromptPack";

  // Store the prompt text on the button
  (btn as any).__promptText = promptText;

  // Match Claude's button styling - hidden until hover
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 4px;
    margin: 0;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease, opacity 0.15s ease;
    border: none;
    background: transparent;
    opacity: 0;
    flex-shrink: 0;
  `;

  // Hover effect
  btn.addEventListener("mouseenter", () => {
    btn.style.background = currentTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
    btn.style.opacity = "1";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "transparent";
    btn.style.opacity = "0.5";
  });

  // Use PromptPack logo as icon
  const iconUrl = chrome.runtime.getURL("img/icon-16.png");
  btn.innerHTML = `<img src="${iconUrl}" width="16" height="16" alt="Save">`;

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const text = (e.currentTarget as any).__promptText;
    if (!text) {
      toast("No prompt to save", "error");
      return;
    }

    const result = await savePrompt({
      text,
      source: "claude",
      url: location.href,
    });

    if (result.ok) {
      // Brief visual feedback
      btn.style.opacity = "1";
      toast(`Saved! (${result.count}/${result.max})`, "success");
    } else if (result.reason === "limit") {
      toast("Limit reached", "error");
    } else if (result.reason === "empty") {
      toast("Nothing to save", "error");
    }
  });

  return btn;
}

/**
 * Find and inject save icons next to user message bubbles
 */
function injectBubbleSaveIcons() {
  // Find all user message containers first, then look for their copy buttons
  const userMessages = document.querySelectorAll('div[data-testid="user-message"]');

  userMessages.forEach((userMessage) => {
    // Skip if already processed
    if (processedUserBubbles.has(userMessage)) return;

    // Get the prompt text
    const textElement = userMessage.querySelector('p.whitespace-pre-wrap');
    const promptText = textElement?.textContent?.trim() || "";
    if (!promptText || promptText.length < 2) return;

    // Find the copy button that's associated with this user message
    // It should be in a sibling or parent container, not inside the message itself
    let container: HTMLElement | null = userMessage.parentElement;
    let copyButton: HTMLElement | null = null;

    // Search in parent containers for the copy button
    let depth = 0;
    while (container && depth < 5) {
      // Look for copy button with the specific SVG path
      const buttons = container.querySelectorAll('button');
      for (const btn of buttons) {
        const copyIconSvg = btn.querySelector('svg path[d*="M12.5 3C13.3284"]');
        if (copyIconSvg) {
          // Make sure this copy button is associated with a user message, not a response
          // Check if there's no assistant/model response in the immediate parent
          const btnParent = btn.closest('[data-testid]');
          if (!btnParent || btnParent.getAttribute('data-testid') !== 'user-message') {
            // Check if this button is in the same message group as our user message
            const messageGroup = container;
            const userMsgInGroup = messageGroup.querySelector('div[data-testid="user-message"]');
            if (userMsgInGroup === userMessage) {
              copyButton = btn;
              break;
            }
          }
        }
      }
      if (copyButton) break;
      container = container.parentElement;
      depth++;
    }

    if (!copyButton) {
      return;
    }

    // Skip if we already added our icon next to this button
    const buttonContainer = copyButton.parentElement;
    if (!buttonContainer) return;
    if (buttonContainer.querySelector('.pp-bubble-save-icon')) return;

    // Mark as processed
    processedUserBubbles.add(userMessage);


    // Create save icon
    const saveIcon = createBubbleSaveIcon(promptText);

    // Insert the save icon AFTER the copy button (to the right)
    if (copyButton.nextSibling) {
      buttonContainer.insertBefore(saveIcon, copyButton.nextSibling);
    } else {
      buttonContainer.appendChild(saveIcon);
    }

    // Make the button visible when hovering over the button container or message row
    const showButton = () => {
      saveIcon.style.opacity = '1';
    };
    const hideButton = () => {
      saveIcon.style.opacity = '0';
    };

    // Add hover listeners to the button container
    buttonContainer.addEventListener('mouseenter', showButton);
    buttonContainer.addEventListener('mouseleave', hideButton);

    // Also add to the user message element
    (userMessage as HTMLElement).addEventListener('mouseenter', showButton);
    (userMessage as HTMLElement).addEventListener('mouseleave', hideButton);

    // Store cleanup function
    (saveIcon as any).__cleanup = () => {
      buttonContainer.removeEventListener('mouseenter', showButton);
      buttonContainer.removeEventListener('mouseleave', hideButton);
      (userMessage as HTMLElement).removeEventListener('mouseenter', showButton);
      (userMessage as HTMLElement).removeEventListener('mouseleave', hideButton);
    };
  });
}

/**
 * Throttled tick function to prevent excessive updates
 */
function scheduleTick() {
  if (tickScheduled) return;
  tickScheduled = true;
  requestAnimationFrame(() => {
    tickScheduled = false;
    tick();
  });
}

function tick() {
  // Detect SPA navigation
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Force button recreation on route change
    const wrap = document.getElementById("pp-enhance-wrap");
    if (wrap) wrap.remove();
    wasGenerating = false;
    isFirstPrompt = true; // Reset for new conversation
    processedUserBubbles.clear(); // Clear processed bubbles on navigation
  }

  // Always inject save icons next to user message bubbles (regardless of composer state)
  injectBubbleSaveIcons();

  const composer = findComposer();
  currentComposer = composer;

  // Hide if composer missing
  if (!composer) {
    const controls = ensureEnhanceControls();
    controls.style.display = "none";
    return;
  }

  const text = getComposerText(composer).trim();
  const controls = ensureEnhanceControls();
  updateEnhanceAvailability(text.length > 0);

  // Detect when generation stops
  const generating = isGenerating();
  if (wasGenerating && !generating) {
    // Generation just finished
    wasGenerating = false;
  } else if (generating) {
    // Mark first prompt as done when we START generating, not after
    if (text && !wasGenerating && isFirstPrompt) {
      isFirstPrompt = false;
    }
    wasGenerating = true;
  }

  // Hide while Claude is generating a response
  if (generating) {
    controls.style.display = "none";
    return;
  }

  // Otherwise show + position (prefer send button)
  controls.style.display = "flex";
  positionControlsFixed(controls);
}

function boot() {
  // Theme sync
  startThemeSync({
    onChange: (t) => {
      currentTheme = t;
      applyEnhanceTheme(currentTheme);
    },
    persistToStorage: true,
  });

  // Initial tick
  tick();

  // Poll briefly on startup to catch late-loading composers
  let pollCount = 0;
  const pollInterval = setInterval(() => {
    tick();
    pollCount++;
    if (pollCount >= 10) clearInterval(pollInterval);
  }, 200);

  // Use throttled observer to handle DOM changes
  observer = new MutationObserver(scheduleTick);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Handle resize and scroll
  window.addEventListener("resize", scheduleTick);
  window.addEventListener("scroll", scheduleTick, { passive: true });

  setupSaveKeybind();

  // Handle SPA navigation via History API
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    scheduleTick();
  };

  history.replaceState = function (...args) {
    originalReplaceState(...args);
    scheduleTick();
  };

  window.addEventListener("popstate", scheduleTick);

  // Setup context menu for promptbox
  setupContextMenu();
}

/**
 * Create and show the PromptPack context menu
 */
let contextMenu: HTMLElement | null = null;

function createContextMenu(): HTMLElement {
  const menu = document.createElement("div");
  menu.id = "pp-context-menu";
  menu.style.cssText = `
    position: fixed;
    z-index: 999999;
    background: ${currentTheme === "dark" ? "#2d2d2d" : "#ffffff"};
    border: 1px solid ${currentTheme === "dark" ? "#444" : "#ddd"};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 200px;
    max-width: 300px;
    max-height: 400px;
    overflow: hidden;
    overflow-y: auto;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 13px;
    display: none;
  `;
  document.body.appendChild(menu);
  return menu;
}

function hideContextMenu() {
  if (contextMenu) {
    contextMenu.style.display = "none";
  }
}

async function showContextMenu(x: number, y: number) {
  if (!contextMenu) {
    contextMenu = createContextMenu();
  }

  // Fetch prompts grouped by pack for Claude
  const groups = await listPromptsBySourceGrouped("claude");
  const totalPrompts = groups.reduce((sum, g) => sum + g.prompts.length, 0);

  // Build menu content
  const colors = currentTheme === "dark"
    ? { bg: "#2d2d2d", border: "#444", text: "#e5e5e5", hover: "#3d3d3d", secondary: "#999" }
    : { bg: "#ffffff", border: "#ddd", text: "#333", hover: "#f5f5f5", secondary: "#666" };

  contextMenu.style.background = colors.bg;
  contextMenu.style.borderColor = colors.border;
  contextMenu.style.color = colors.text;

  if (totalPrompts === 0) {
    contextMenu.innerHTML = `
      <div style="padding: 12px 16px; color: ${colors.secondary}; text-align: center;">
        No saved Claude prompts yet
      </div>
    `;
  } else {
    const visibleGroups = groups
      .map((group, index) => ({ group, index }))
      .filter(({ group }) => group.prompts.length > 0);

    // Build expandable sections for each group
    contextMenu.innerHTML = `
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${colors.border}; display: flex; align-items: center; gap: 8px;">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${visibleGroups.map(({ group, index }, visibleIndex) => {
        const isLastGroup = visibleIndex === visibleGroups.length - 1;
        const headerBorder = isLastGroup ? "none" : `1px solid ${colors.border}`;
        return `
          <div class="pp-group" data-group-index="${index}">
            <div class="pp-group-header" data-group-index="${index}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${headerBorder};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span class="pp-arrow" style="transition: transform 0.2s;">▶</span>
              ${group.displayName} (${group.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${index}" style="display: none;">
              ${group.prompts.map((p, i) => {
                // Show header if available, otherwise truncated prompt text
                const displayText = p.header
                  ? p.header
                  : (p.text.length > 50 ? p.text.substring(0, 50) + "..." : p.text);
                return `
                <div class="pp-menu-item" data-group-index="${index}" data-prompt-index="${i}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${i < group.prompts.length - 1 ? `1px solid ${colors.border}` : "none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                " title="${p.text.replace(/"/g, '&quot;')}">
                  ${displayText}
                </div>
              `;
              }).join("")}
            </div>
          </div>
        `;
      }).join("")}
    `;

    // Add click handlers for group headers (expand/collapse)
    const headers = contextMenu.querySelectorAll(".pp-group-header");
    headers.forEach((header) => {
      const el = header as HTMLElement;
      el.addEventListener("mouseenter", () => {
        el.style.background = colors.hover;
      });
      el.addEventListener("mouseleave", () => {
        el.style.background = "transparent";
      });
      el.addEventListener("click", () => {
        const groupIndex = el.dataset.groupIndex;
        const itemsContainer = contextMenu!.querySelector(`.pp-group-items[data-group-index="${groupIndex}"]`) as HTMLElement;
        const arrow = el.querySelector(".pp-arrow") as HTMLElement;
        if (itemsContainer) {
          const isOpen = itemsContainer.style.display !== "none";
          itemsContainer.style.display = isOpen ? "none" : "block";
          if (arrow) {
            arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
          }
        }
      });
    });

    // Add hover effects and click handlers for prompt items
    const items = contextMenu.querySelectorAll(".pp-menu-item");
    items.forEach((item) => {
      const el = item as HTMLElement;
      const groupIndex = parseInt(el.dataset.groupIndex || "0", 10);
      const promptIndex = parseInt(el.dataset.promptIndex || "0", 10);
      el.addEventListener("mouseenter", () => {
        el.style.background = colors.hover;
      });
      el.addEventListener("mouseleave", () => {
        el.style.background = "transparent";
      });
      el.addEventListener("click", () => {
        const group = groups[groupIndex];
        if (group && group.prompts[promptIndex]) {
          insertPromptIntoComposer(group.prompts[promptIndex].text);
          hideContextMenu();
        }
      });
    });
  }

  // Position the menu
  const menuRect = { width: 250, height: 300 };
  let left = x;
  let top = y;

  // Adjust if menu would go off screen
  if (left + menuRect.width > window.innerWidth) {
    left = window.innerWidth - menuRect.width - 10;
  }
  if (top + menuRect.height > window.innerHeight) {
    top = window.innerHeight - menuRect.height - 10;
  }

  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
  contextMenu.style.display = "block";
}

function insertPromptIntoComposer(text: string) {
  const composer = findComposer();
  if (!composer) return;

  if (composer instanceof HTMLTextAreaElement) {
    composer.value = text;
    composer.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (composer.isContentEditable) {
    composer.innerText = text;
    composer.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Focus the composer
  composer.focus();
}

function setupContextMenu() {
  // Listen for right-click on composer
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    const composer = findComposer();

    // Check if right-click is on or inside the composer
    if (composer && (target === composer || composer.contains(target))) {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY);
    }
  });

  // Hide menu when clicking elsewhere
  document.addEventListener("click", (e) => {
    if (contextMenu && !contextMenu.contains(e.target as Node)) {
      hideContextMenu();
    }
  });

  // Hide menu on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideContextMenu();
    }
  });

  // Hide menu on scroll
  document.addEventListener("scroll", hideContextMenu, { passive: true });
}

// Initialize
boot();
