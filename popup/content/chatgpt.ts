// src/content/chatgpt.ts
import { savePrompt, listPromptsBySourceGrouped } from "../shared/promptStore";
import { ENHANCE_API_URL } from "../shared/config";
import { startThemeSync, detectThemeFromPage, chatgptTheme, type ThemeMode } from "../shared/theme";

type ComposerEl = HTMLTextAreaElement | HTMLElement;
type EnhanceMode = "structured" | "clarity" | "concise" | "strict";

const ENHANCE_OFFSET_RIGHT = 200;
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
      border-radius: 12px;
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
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
    const gap = 80; // Gap to avoid overlap

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
  const byId = document.querySelector<HTMLTextAreaElement>("textarea#prompt-textarea");
  if (byId && isVisible(byId)) return byId;

  // Filter function to exclude settings/modal textareas
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

    // Exclude by placeholder text (Custom Instructions, etc.)
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

  const areas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"))
    .filter(isVisible)
    .filter(isMainChatComposer);
  if (areas.length) {
    areas.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return areas[0];
  }

  const ce = Array.from(document.querySelectorAll<HTMLElement>('[contenteditable="true"]'))
    .filter(isVisible)
    .filter(isMainChatComposer);
  if (ce.length) {
    ce.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return ce[0];
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

async function setComposerText(el: ComposerEl, text: string): Promise<void> {
  console.log("[PromptPack] setComposerText called", { el, text: text.substring(0, 50) });

  if (el instanceof HTMLTextAreaElement) {
    console.log("[PromptPack] Using textarea approach");
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (setter) {
      setter.call(el, text);
    } else {
      el.value = text;
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    return;
  }

  // For ProseMirror editor (ChatGPT's contenteditable)
  console.log("[PromptPack] Element classes:", el.className);
  console.log("[PromptPack] Element id:", el.id);
  console.log("[PromptPack] Element tagName:", el.tagName);

  // Method 0: Try to access ProseMirror view directly (most reliable)
  // ProseMirror often stores a reference to itself on the DOM node
  try {
    console.log("[PromptPack] Method 0: Looking for ProseMirror view...");

    // Check various ways ProseMirror might be attached
    const anyEl = el as any;
    const pmViewDesc = anyEl.pmViewDesc;
    const view = pmViewDesc?.view || anyEl.view || anyEl.editor?.view;

    console.log("[PromptPack] pmViewDesc:", pmViewDesc);
    console.log("[PromptPack] view:", view);

    if (view && view.state && view.dispatch) {
      console.log("[PromptPack] Found ProseMirror view! Using transaction.");

      // Create a transaction to replace all content
      const { state } = view;
      const tr = state.tr;

      // Delete all current content
      tr.delete(0, state.doc.content.size);

      // Insert new text at the beginning
      tr.insertText(text, 0);

      // Dispatch the transaction
      view.dispatch(tr);

      console.log("[PromptPack] ProseMirror transaction dispatched!");
      return;
    }
  } catch (e) {
    console.log("[PromptPack] Method 0 failed:", e);
  }

  // Ensure element is focused
  el.focus();
  await new Promise(r => setTimeout(r, 50));

  // Method 1: Use beforeinput event (preferred for ProseMirror)
  // ProseMirror listens for beforeinput events from the Input Events API
  try {
    console.log("[PromptPack] Method 1: Trying beforeinput with deleteContentBackward + insertText");

    // First, select all content
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Try to delete existing content first using beforeinput
    const deleteEvent = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "deleteContentBackward",
    });
    el.dispatchEvent(deleteEvent);

    // Clear selection and position cursor at start
    if (selection) {
      const range = document.createRange();
      range.setStart(el, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Now insert the new text using beforeinput
    const insertEvent = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    });
    const handled = !el.dispatchEvent(insertEvent);
    console.log("[PromptPack] beforeinput insertText dispatched, default prevented:", handled);

    // Give ProseMirror time to process
    await new Promise(r => setTimeout(r, 100));

    // Check if it worked
    const currentText = el.textContent || "";
    if (currentText.includes(text.substring(0, Math.min(20, text.length)))) {
      console.log("[PromptPack] Method 1 succeeded!");
      return;
    }
  } catch (e) {
    console.log("[PromptPack] Method 1 failed:", e);
  }

  // Method 2: Try insertText execCommand (still works in some browsers)
  try {
    console.log("[PromptPack] Method 2: Trying execCommand selectAll + insertText");

    el.focus();
    document.execCommand("selectAll", false);
    const inserted = document.execCommand("insertText", false, text);
    console.log("[PromptPack] insertText result:", inserted);

    if (inserted) {
      await new Promise(r => setTimeout(r, 50));
      const currentText = el.textContent || "";
      if (currentText.includes(text.substring(0, Math.min(20, text.length)))) {
        console.log("[PromptPack] Method 2 succeeded!");
        return;
      }
    }
  } catch (e) {
    console.log("[PromptPack] Method 2 failed:", e);
  }

  // Method 3: Direct DOM manipulation with proper ProseMirror structure
  // This modifies the DOM and then triggers events to sync ProseMirror
  try {
    console.log("[PromptPack] Method 3: Direct DOM + input event");

    // Clear existing content
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    // Create new paragraph with text (ProseMirror structure)
    const p = document.createElement("p");
    p.textContent = text;
    el.appendChild(p);

    // Dispatch input event to notify ProseMirror
    el.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    }));

    // Also try dispatching on the paragraph
    p.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    }));

    await new Promise(r => setTimeout(r, 100));

    // Verify
    if (el.textContent?.includes(text.substring(0, Math.min(20, text.length)))) {
      console.log("[PromptPack] Method 3 succeeded!");
      return;
    }
  } catch (e) {
    console.log("[PromptPack] Method 3 failed:", e);
  }

  // Method 4: DataTransfer paste simulation
  try {
    console.log("[PromptPack] Method 4: DataTransfer paste simulation");

    el.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const dt = new DataTransfer();
    dt.setData("text/plain", text);

    const pasteEvent = new ClipboardEvent("paste", {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
    });

    el.dispatchEvent(pasteEvent);

    await new Promise(r => setTimeout(r, 100));

    if (el.textContent?.includes(text.substring(0, Math.min(20, text.length)))) {
      console.log("[PromptPack] Method 4 succeeded!");
      return;
    }
  } catch (e) {
    console.log("[PromptPack] Method 4 failed:", e);
  }

  // Method 5: Last resort - modify innerHTML and dispatch compositionend
  // Some editors respond to composition events
  try {
    console.log("[PromptPack] Method 5: innerHTML + compositionend");

    el.innerHTML = `<p>${text}</p>`;

    // Try composition events (some editors use these)
    el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: text }));
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: text }));

    console.log("[PromptPack] Method 5 applied, innerHTML:", el.innerHTML.substring(0, 100));
  } catch (e) {
    console.log("[PromptPack] Method 5 failed:", e);
  }

  console.log("[PromptPack] All methods attempted. Final textContent:", el.textContent?.substring(0, 50));
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

    /* ChatGPT dropdown styling - light theme (dark bubble) */
    #pp-enhance-mode option {
      background: #2f2f2f !important;
      color: #ececec !important;
    }
    #pp-enhance-mode option:checked {
      background: #1a1a1a !important;
      color: #ffffff !important;
    }
    #pp-enhance-mode:focus {
      outline: 2px solid rgba(0, 0, 0, 0.14);
      outline-offset: 2px;
    }

    /* ChatGPT dropdown styling - dark theme (light bubble) */
    @media (prefers-color-scheme: dark) {
      #pp-enhance-mode option {
        background: #f7f7f8 !important;
        color: #0d0d0d !important;
      }
      #pp-enhance-mode option:checked {
        background: #ececec !important;
        color: #000000 !important;
      }
      #pp-enhance-mode:focus {
        outline: 2px solid rgba(0, 0, 0, 0.12);
        outline-offset: 2px;
      }
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
  const colors = theme === "dark" ? chatgptTheme.dark : chatgptTheme.light;

  const wrap = document.getElementById("pp-enhance-wrap") as HTMLDivElement | null;
  if (wrap) {
    wrap.style.background = colors.buttonBg;
    wrap.style.border = `1px solid ${colors.border}`;
    wrap.style.boxShadow = colors.shadow;
    wrap.style.borderRadius = "999px";
    wrap.style.fontFamily = colors.font;
    wrap.style.backdropFilter = "blur(10px)";
    (wrap.style as any).webkitBackdropFilter = "blur(10px)";
  }

  const saveBtn = document.getElementById("pp-save-btn") as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.style.background = "transparent";
    saveBtn.style.border = "none";
    saveBtn.style.color = colors.text;
    saveBtn.style.fontFamily = colors.font;
    saveBtn.style.borderRadius = "999px";
  }

  const enhanceBtn = document.getElementById("pp-enhance-btn") as HTMLButtonElement | null;
  if (enhanceBtn) {
    enhanceBtn.style.background = "transparent";
    enhanceBtn.style.border = "none";
    enhanceBtn.style.color = colors.text;
    enhanceBtn.style.fontFamily = colors.font;
    enhanceBtn.style.borderRadius = "999px";
  }

  const modeSelect = document.getElementById("pp-enhance-mode") as HTMLSelectElement | null;
  if (modeSelect) {
    // Use buttonBg to match bubble background for dropdown
    modeSelect.style.background = colors.buttonBg;
    modeSelect.style.border = "none";
    modeSelect.style.color = colors.text;
    modeSelect.style.fontFamily = colors.font;
    setSelectArrow(modeSelect, colors.text);
  }

  const status = document.getElementById("pp-enhance-status") as HTMLSpanElement | null;
  if (status) {
    status.style.color = theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(17, 24, 39, 0.9)";
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
    source: "chatgpt",
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

  const panelBg = currentTheme === "dark" ? "rgba(17, 24, 39, 0.98)" : "#ffffff";
  const panelText = currentTheme === "dark" ? "#f9fafb" : "#111827";
  const panelBorder = currentTheme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
  const fieldBg = currentTheme === "dark" ? "rgba(15, 23, 42, 0.95)" : "rgba(249, 250, 251, 0.98)";

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
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
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

  const copyEnhanced = async () => {
    try {
      await navigator.clipboard.writeText(enhanced);
      toast("Copied to clipboard", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
      return;
    }

    // Ctrl+C / Cmd+C to copy enhanced text
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      e.preventDefault();
      e.stopPropagation();
      void copyEnhanced();
      return;
    }

    // Alt+Shift+S to save to PromptPack
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      saveBtn.click();
      return;
    }

    // Enter to replace
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      replaceBtn.click();
      return;
    }
  };

  const actionColors = currentTheme === "dark" ? chatgptTheme.dark : chatgptTheme.light;
  replaceBtn.style.background = actionColors.buttonBg;
  replaceBtn.style.color = actionColors.text;
  replaceBtn.style.border = "none";

  replaceBtn.addEventListener("click", async () => {
    // Close the modal FIRST so findComposer doesn't find the preview textarea
    cleanup();

    // Small delay to ensure modal is fully removed from DOM
    await new Promise(r => setTimeout(r, 50));

    const composer = findComposer();
    console.log("[PromptPack] Replace clicked, composer:", composer);
    if (!composer) {
      console.log("[PromptPack] No composer found!");
      toast("Could not find input", "error");
      return;
    }
    currentComposer = composer;
    await setComposerText(composer, enhanced);
    composer.focus();
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
      source: "chatgpt",
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
  } catch (error) {
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
      width: 32px;
      height: 32px;
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
      color: rgba(17, 24, 39, 0.9);
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
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

function setupEnhanceKeybind() {
  // Listen for Alt+Shift+E keyboard shortcut to enhance prompt
  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    if (!e.shiftKey) return;
    if (e.key.toLowerCase() !== "e") return;
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
    void handleEnhance();
  });
}

function setupModeKeybinds() {
  // Listen for Alt+1/2/3/4 to select enhance mode
  const modes: EnhanceMode[] = ["structured", "clarity", "concise", "strict"];

  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    if (e.shiftKey || e.ctrlKey || e.metaKey) return;
    if (e.repeat) return;

    const keyNum = parseInt(e.key, 10);
    if (keyNum < 1 || keyNum > 4) return;

    const composer = findComposer();
    if (!composer) return;

    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      if (target !== composer && !composer.contains(target)) {
        return;
      }
    }

    e.preventDefault();
    e.stopPropagation();

    const newMode = modes[keyNum - 1];
    enhanceMode = newMode;

    // Update the dropdown UI
    const modeSelect = document.getElementById("pp-enhance-mode") as HTMLSelectElement | null;
    if (modeSelect) {
      modeSelect.value = newMode;
    }

    toast(`Mode: ${newMode.charAt(0).toUpperCase() + newMode.slice(1)}`, "success");
  });
}

function isGenerating(): boolean {
  const selectors = [
    'button[data-testid="stop-button"]',
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
 * Hidden by default, shown on hover (like native ChatGPT buttons)
 */
function createBubbleSaveIcon(promptText: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "pp-bubble-save-icon";
  btn.type = "button";
  btn.setAttribute("aria-label", "Save prompt to PromptPack");
  btn.title = "Save to PromptPack";

  // Store the prompt text on the button
  (btn as any).__promptText = promptText;

  // Simple icon-only styling - hidden by default (opacity: 0)
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease, opacity 0.15s ease;
    border: none;
    background: transparent;
    opacity: 0;
  `;

  // Hover effect on button itself
  btn.addEventListener("mouseenter", () => {
    btn.style.background = currentTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
    btn.style.opacity = "1";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "transparent";
    // Don't hide on mouseleave - let the container hover handle visibility
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
      source: "chatgpt",
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
 * Places icon to the LEFT of the copy button with hover behavior
 */
function injectBubbleSaveIcons() {
  // Find all user message bubbles - they have data-message-author-role="user"
  const userMessages = document.querySelectorAll('[data-message-author-role="user"]');

  userMessages.forEach((msg) => {
    // Skip if already processed
    if (processedUserBubbles.has(msg)) return;

    // Find the text content container within the user message
    const textContainer = msg.querySelector('[data-message-id]') || msg;

    // Get the prompt text
    const promptText = textContainer.textContent?.trim() || "";
    if (!promptText) return;

    // Find the copy button by looking for the svg with sprite reference
    // The copy button is in a container near the user message
    // Search upward from the message to find the containing article or message group
    let container: HTMLElement | null = msg as HTMLElement;
    let copyButton: HTMLElement | null = null;
    let buttonContainer: HTMLElement | null = null;

    // Search up the DOM to find the message container that has the copy button
    for (let i = 0; i < 10 && container; i++) {
      // Look for the copy button with the sprite reference
      const svgUse = container.querySelector('svg use[href*="sprites-core"]');
      if (svgUse) {
        // Found the sprite, now find the button element
        const svg = svgUse.closest('svg');
        if (svg) {
          copyButton = svg.closest('button') as HTMLElement;
          if (!copyButton) {
            // Sometimes it's wrapped differently - look for clickable parent
            copyButton = svg.parentElement as HTMLElement;
          }
          if (copyButton) {
            buttonContainer = copyButton.parentElement as HTMLElement;
            break;
          }
        }
      }
      container = container.parentElement;
    }

    // If we couldn't find copy button, skip this message
    if (!copyButton || !buttonContainer) return;

    // Check if we already added an icon here
    if (buttonContainer.querySelector('.pp-bubble-save-icon')) return;

    // Mark as processed
    processedUserBubbles.add(msg);

    // Create and insert the save icon BEFORE the copy button (to the left)
    const saveIcon = createBubbleSaveIcon(promptText);
    buttonContainer.insertBefore(saveIcon, copyButton);

    // Add hover listeners to show/hide the save icon
    // Find the hoverable container (the message row or article)
    let hoverTarget: HTMLElement | null = msg as HTMLElement;
    for (let i = 0; i < 10 && hoverTarget; i++) {
      if (hoverTarget.tagName === 'ARTICLE' || hoverTarget.getAttribute('data-message-author-role')) {
        break;
      }
      hoverTarget = hoverTarget.parentElement;
    }

    if (hoverTarget) {
      // Show icon on hover
      hoverTarget.addEventListener("mouseenter", () => {
        saveIcon.style.opacity = "1";
      });
      hoverTarget.addEventListener("mouseleave", () => {
        saveIcon.style.opacity = "0";
      });
    }

    // Also show/hide based on button container hover
    buttonContainer.addEventListener("mouseenter", () => {
      saveIcon.style.opacity = "1";
    });
    buttonContainer.addEventListener("mouseleave", () => {
      saveIcon.style.opacity = "0";
    });
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

  // Hide while ChatGPT is generating a response
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
  setupEnhanceKeybind();
  setupModeKeybinds();

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

  // Fetch prompts grouped by pack for ChatGPT
  const groups = await listPromptsBySourceGrouped("chatgpt");
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
        No saved ChatGPT prompts yet
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

async function insertPromptIntoComposer(text: string) {
  const composer = findComposer();
  if (!composer) return;

  // Use the shared setComposerText function
  await setComposerText(composer, text);
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
