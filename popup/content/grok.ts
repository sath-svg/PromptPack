// src/content/grok.ts
// Content script for Grok (X.com) - Pro users only
import { savePrompt, listPromptsBySourceGrouped } from "../shared/promptStore";
import { ENHANCE_API_URL } from "../shared/config";
import { startThemeSync } from "../shared/theme";
import { parseTemplateVariables, replaceTemplateVariables } from "../shared/templateParser";

type ComposerEl = HTMLTextAreaElement | HTMLElement;
type EnhanceMode = "structured" | "clarity" | "concise" | "strict";

const ENHANCE_OFFSET_RIGHT = 200;
const ENHANCE_OFFSET_BOTTOM = 64;

// Standard bubble theme (not dependent on page theme)
const bubbleTheme = {
  bg: "rgba(255, 255, 255, 0.95)",
  text: "rgba(0, 0, 0, 0.87)",
  border: "rgba(0, 0, 0, 0.12)",
  shadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
};

// Grok/X accent color (black/gray for X branding)
const ACCENT_COLOR = "#1D9BF0";

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
      position: fixed;
      z-index: 1000001;
      padding: 10px 12px;
      border-radius: 12px;
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: ${bubbleTheme.font};
      pointer-events: none;
      right: 16px;
      bottom: 140px;
    `;
    document.body.appendChild(el);
  }

  el.style.background = type === "error"
    ? "rgba(220, 38, 38, 0.92)"
    : ACCENT_COLOR;

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
  // Grok uses textarea or contenteditable for input
  const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"))
    .filter(isVisible)
    .filter(el => {
      const placeholder = el.placeholder?.toLowerCase() || "";
      if (placeholder.includes("setting") || placeholder.includes("preference")) return false;
      return true;
    });

  if (textareas.length) {
    textareas.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return textareas[0];
  }

  const ce = Array.from(document.querySelectorAll<HTMLElement>('[contenteditable="true"]'))
    .filter(isVisible);
  if (ce.length) {
    ce.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return ce[0];
  }

  return null;
}

function getComposerText(el: ComposerEl): string {
  if (el instanceof HTMLTextAreaElement) {
    return el.value ?? "";
  }
  return el.innerText ?? "";
}

async function setComposerText(el: ComposerEl, text: string): Promise<void> {
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

  el.focus();
  el.innerText = text;
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

function applyEnhanceTheme() {
  const wrap = document.getElementById("pp-enhance-wrap") as HTMLDivElement | null;
  if (wrap) {
    wrap.style.background = bubbleTheme.bg;
    wrap.style.border = `1px solid ${bubbleTheme.border}`;
    wrap.style.boxShadow = bubbleTheme.shadow;
    wrap.style.borderRadius = "999px";
    wrap.style.fontFamily = bubbleTheme.font;
  }

  const saveBtn = document.getElementById("pp-save-btn") as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.style.background = "transparent";
    saveBtn.style.border = "none";
    saveBtn.style.color = bubbleTheme.text;
    saveBtn.style.fontFamily = bubbleTheme.font;
    saveBtn.style.borderRadius = "999px";
  }

  const enhanceBtn = document.getElementById("pp-enhance-btn") as HTMLButtonElement | null;
  if (enhanceBtn) {
    enhanceBtn.style.background = "transparent";
    enhanceBtn.style.border = "none";
    enhanceBtn.style.color = bubbleTheme.text;
    enhanceBtn.style.fontFamily = bubbleTheme.font;
    enhanceBtn.style.borderRadius = "999px";
  }

  const modeSelect = document.getElementById("pp-enhance-mode") as HTMLSelectElement | null;
  if (modeSelect) {
    modeSelect.style.background = bubbleTheme.bg;
    modeSelect.style.border = "none";
    modeSelect.style.color = bubbleTheme.text;
    modeSelect.style.fontFamily = bubbleTheme.font;
    setSelectArrow(modeSelect, bubbleTheme.text);
  }
}

let currentComposer: ComposerEl | null = null;
let lastUrl = location.href;
let tickScheduled = false;
let observer: MutationObserver | null = null;
let processedUserBubbles = new Set<Element>();
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
    source: "grok",
    url: location.href,
  });

  if (result.ok) {
    return toast(`Saved (${result.count}/${result.max})`, "success");
  }
  if (result.reason === "limit") return toast("Limit reached", "error");
  if (result.reason === "empty") return toast("Nothing to save", "error");
}

async function handleEnhance() {
  if (enhanceInFlight) return;
  if (!currentComposer) return;

  const text = getComposerText(currentComposer).trim();
  if (!text) return;
  if (text.length > 6000) {
    toast("Prompt too long to enhance", "error");
    return;
  }

  const authToken = await getEnhanceAuthToken();
  if (!authToken) {
    toast("Sign in to use enhance feature", "error");
    return;
  }

  setEnhanceLoading(true);
  try {
    const response = await fetch(ENHANCE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({ text, mode: enhanceMode }),
    });

    if (response.status === 429) {
      toast("Enhance limit reached", "error");
      return;
    }

    if (!response.ok) {
      toast("Enhance failed", "error");
      return;
    }

    const data = await response.json() as { enhanced?: string };
    if (data.enhanced) {
      await setComposerText(currentComposer, data.enhanced);
      toast("Prompt enhanced", "success");
    }
  } catch {
    toast("Enhance failed", "error");
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
    enhanceBtn.addEventListener("click", () => void handleEnhance());

    const saveBtn = document.createElement("button");
    saveBtn.id = "pp-save-btn";
    saveBtn.type = "button";
    saveBtn.title = "Save prompt";
    saveBtn.textContent = "Save";
    saveBtn.style.cssText = `
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
    `;
    saveBtn.addEventListener("click", () => void handleSave());

    const status = document.createElement("span");
    status.id = "pp-enhance-status";
    status.style.cssText = `
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
    `;

    wrap.appendChild(modeSelect);
    wrap.appendChild(enhanceBtn);
    wrap.appendChild(saveBtn);
    wrap.appendChild(status);

    document.body.appendChild(wrap);
  }

  applyEnhanceTheme();
  updateEnhanceAvailability(lastCanEnhance);
  return wrap;
}

function setupSaveKeybind() {
  document.addEventListener("keydown", (e) => {
    if (!e.altKey || !e.shiftKey || e.key.toLowerCase() !== "s" || e.repeat) return;

    const composer = findComposer();
    if (composer) currentComposer = composer;

    e.preventDefault();
    e.stopPropagation();
    void handleSave();
  });
}

function setupEnhanceKeybind() {
  document.addEventListener("keydown", (e) => {
    if (!e.altKey || !e.shiftKey || e.key.toLowerCase() !== "e" || e.repeat) return;

    const composer = findComposer();
    if (composer) currentComposer = composer;

    e.preventDefault();
    e.stopPropagation();
    void handleEnhance();
  });
}

function scheduleTick() {
  if (tickScheduled) return;
  tickScheduled = true;
  requestAnimationFrame(() => {
    tickScheduled = false;
    tick();
  });
}

function tick() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    const wrap = document.getElementById("pp-enhance-wrap");
    if (wrap) wrap.remove();
    processedUserBubbles.clear();
  }

  const composer = findComposer();
  currentComposer = composer;

  if (!composer) {
    const controls = ensureEnhanceControls();
    controls.style.display = "none";
    return;
  }

  const text = getComposerText(composer).trim();
  const controls = ensureEnhanceControls();
  updateEnhanceAvailability(text.length > 0);

  controls.style.display = "flex";
  positionControlsFixed(controls);
}

function boot() {
  startThemeSync({
    persistToStorage: true,
  });

  tick();

  let pollCount = 0;
  const pollInterval = setInterval(() => {
    tick();
    pollCount++;
    if (pollCount >= 10) clearInterval(pollInterval);
  }, 200);

  observer = new MutationObserver(scheduleTick);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("resize", scheduleTick);
  window.addEventListener("scroll", scheduleTick, { passive: true });

  setupSaveKeybind();
  setupEnhanceKeybind();

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

  setupContextMenu();
}

// Context menu for quick-select
let contextMenu: HTMLElement | null = null;

function createContextMenu(): HTMLElement {
  const menu = document.createElement("div");
  menu.id = "pp-context-menu";
  menu.style.cssText = `
    position: fixed;
    z-index: 999999;
    background: ${bubbleTheme.bg};
    border: 1px solid ${bubbleTheme.border};
    border-radius: 8px;
    box-shadow: ${bubbleTheme.shadow};
    min-width: 200px;
    max-width: 300px;
    max-height: 400px;
    overflow: hidden;
    overflow-y: auto;
    padding: 0;
    font-family: ${bubbleTheme.font};
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

  const groups = await listPromptsBySourceGrouped("grok");
  const totalPrompts = groups.reduce((sum, g) => sum + g.prompts.length, 0);

  const colors = {
    bg: bubbleTheme.bg,
    border: bubbleTheme.border,
    text: bubbleTheme.text,
    hover: "rgba(0, 0, 0, 0.05)",
    secondary: "rgba(0, 0, 0, 0.5)",
  };

  if (totalPrompts === 0) {
    contextMenu.innerHTML = `
      <div style="padding: 12px 16px; color: ${colors.secondary}; text-align: center;">
        No saved Grok prompts yet
      </div>
    `;
  } else {
    const visibleGroups = groups
      .map((group, index) => ({ group, index }))
      .filter(({ group }) => group.prompts.length > 0);

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
              <span class="pp-arrow" style="transition: transform 0.2s; color: ${ACCENT_COLOR};">▶</span>
              ${group.displayName} (${group.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${index}" style="display: none;">
              ${group.prompts.map((p, i) => {
                const displayText = p.header || (p.text.length > 50 ? p.text.substring(0, 50) + "..." : p.text);
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

    // Add event handlers
    const headers = contextMenu.querySelectorAll(".pp-group-header");
    headers.forEach((header) => {
      const el = header as HTMLElement;
      el.addEventListener("mouseenter", () => el.style.background = colors.hover);
      el.addEventListener("mouseleave", () => el.style.background = "transparent");
      el.addEventListener("click", () => {
        const groupIndex = el.dataset.groupIndex;
        const itemsContainer = contextMenu!.querySelector(`.pp-group-items[data-group-index="${groupIndex}"]`) as HTMLElement;
        const arrow = el.querySelector(".pp-arrow") as HTMLElement;
        if (itemsContainer) {
          const isOpen = itemsContainer.style.display !== "none";
          itemsContainer.style.display = isOpen ? "none" : "block";
          if (arrow) arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
        }
      });
    });

    const items = contextMenu.querySelectorAll(".pp-menu-item");
    items.forEach((item) => {
      const el = item as HTMLElement;
      const groupIndex = parseInt(el.dataset.groupIndex || "0", 10);
      const promptIndex = parseInt(el.dataset.promptIndex || "0", 10);
      el.addEventListener("mouseenter", () => el.style.background = colors.hover);
      el.addEventListener("mouseleave", () => el.style.background = "transparent");
      el.addEventListener("click", () => {
        const group = groups[groupIndex];
        if (group && group.prompts[promptIndex]) {
          const promptText = group.prompts[promptIndex].text;
          hideContextMenu();

          const variables = parseTemplateVariables(promptText);
          if (variables.length > 0) {
            showTemplateInputDialog(variables, (values) => {
              const filledText = replaceTemplateVariables(promptText, values);
              insertPromptIntoComposer(filledText);
            });
          } else {
            insertPromptIntoComposer(promptText);
          }
        }
      });
    });
  }

  // Position menu
  let left = x;
  let top = y;
  if (left + 250 > window.innerWidth) left = window.innerWidth - 260;
  if (top + 300 > window.innerHeight) top = window.innerHeight - 310;

  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
  contextMenu.style.display = "block";
}

async function insertPromptIntoComposer(text: string) {
  const composer = findComposer();
  if (!composer) return;
  await setComposerText(composer, text);
  composer.focus();
}

function showTemplateInputDialog(
  variables: string[],
  onSubmit: (values: Record<string, string>) => void
) {
  const existing = document.getElementById("pp-template-dialog");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "pp-template-dialog";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const dialog = document.createElement("div");
  dialog.style.cssText = `
    background: ${bubbleTheme.bg};
    border: 1px solid ${bubbleTheme.border};
    border-radius: 8px;
    padding: 16px 20px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: ${bubbleTheme.shadow};
    font-family: ${bubbleTheme.font};
  `;

  const header = document.createElement("div");
  header.textContent = "Fill in values";
  header.style.cssText = `font-size: 14px; font-weight: 600; margin-bottom: 12px;`;
  dialog.appendChild(header);

  const inputs: HTMLInputElement[] = [];
  variables.forEach((varName) => {
    const fieldWrapper = document.createElement("div");
    fieldWrapper.style.cssText = "margin-bottom: 10px;";

    const label = document.createElement("label");
    label.textContent = varName;
    label.style.cssText = "display: block; font-size: 12px; color: rgba(0,0,0,0.5); margin-bottom: 4px;";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = varName;
    input.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${bubbleTheme.border};
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
    `;

    fieldWrapper.appendChild(label);
    fieldWrapper.appendChild(input);
    dialog.appendChild(fieldWrapper);
    inputs.push(input);
  });

  const btnWrapper = document.createElement("div");
  btnWrapper.style.cssText = "display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    padding: 8px 16px;
    border: 1px solid ${bubbleTheme.border};
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
  `;
  cancelBtn.addEventListener("click", () => overlay.remove());

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Insert";
  submitBtn.style.cssText = `
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: ${ACCENT_COLOR};
    color: white;
    cursor: pointer;
  `;
  submitBtn.addEventListener("click", () => {
    const values: Record<string, string> = {};
    variables.forEach((v, i) => {
      values[v] = inputs[i].value || "";
    });
    overlay.remove();
    onSubmit(values);
  });

  btnWrapper.appendChild(cancelBtn);
  btnWrapper.appendChild(submitBtn);
  dialog.appendChild(btnWrapper);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  if (inputs[0]) inputs[0].focus();
}

function setupContextMenu() {
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    const composer = findComposer();
    if (!composer) return;

    if (target === composer || composer.contains(target)) {
      e.preventDefault();
      void showContextMenu(e.clientX, e.clientY);
    }
  });

  document.addEventListener("click", (e) => {
    if (contextMenu && !contextMenu.contains(e.target as Node)) {
      hideContextMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideContextMenu();
  });
}

// Boot on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
