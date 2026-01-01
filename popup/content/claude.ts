// src/content/claude.ts
import { savePrompt } from "../shared/promptStore";
import { startThemeSync, detectThemeFromPage, claudeTheme, type ThemeMode } from "../shared/theme";

type ComposerEl = HTMLTextAreaElement | HTMLElement;

function toast(msg: string) {
  let el = document.getElementById("pp-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pp-toast";
    el.style.cssText = `
      position: fixed;
      right: 16px;
      bottom: 140px;
      z-index: 999999;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(220, 38, 38, 0.92);
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    `;
    document.body.appendChild(el);
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

  // Fallback: find largest contenteditable
  const ce = Array.from(document.querySelectorAll<HTMLElement>('[contenteditable="true"]')).filter(isVisible);
  if (ce.length) {
    // Find the largest one (the main composer)
    ce.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return ce[0];
  }

  // Fallback to textarea
  const areas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea")).filter(isVisible);
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

function findSendButton(): HTMLButtonElement | null {
  const selectors = [
    'button[aria-label*="Send"]',
    'button[aria-label*="send"]',
    'button[type="submit"]',
  ];

  for (const sel of selectors) {
    const buttons = document.querySelectorAll(sel);
    for (const el of buttons) {
      if (el instanceof HTMLButtonElement && isVisible(el)) {
        const r = el.getBoundingClientRect();
        if (r.width > 10 && r.height > 10) return el;
      }
    }
  }
  return null;
}

function positionButtonAboveAnchor(btn: HTMLButtonElement, anchor: HTMLElement) {
  const r = anchor.getBoundingClientRect();
  const gap = 8;
  const safePad = 8;

  const bw = btn.offsetWidth || 52;
  const bh = btn.offsetHeight || 28;

  let left = r.left + r.width / 2 - bw / 2;
  let top = r.top - bh - gap;

  left = Math.max(safePad, Math.min(window.innerWidth - bw - safePad, left));
  top = Math.max(safePad, Math.min(window.innerHeight - bh - safePad, top));

  btn.style.left = `${left}px`;
  btn.style.top = `${top}px`;
}

function applySaveButtonTheme(btn: HTMLButtonElement, theme: ThemeMode) {
  // Match Claude's orange send button
  const colors = theme === "dark" ? claudeTheme.dark : claudeTheme.light;

  btn.style.background = colors.accent; // Claude orange
  btn.style.border = "none";
  btn.style.color = "#ffffff"; // White text
  btn.style.boxShadow = colors.shadow;
  btn.style.fontFamily = colors.font;
}

let currentComposer: ComposerEl | null = null;
let currentTheme: ThemeMode = detectThemeFromPage();
let lastUrl = location.href;
let tickScheduled = false;
let observer: MutationObserver | null = null;

/**
 * Validates that our save button still exists in the DOM and is properly attached.
 * SPAs may remove/replace elements during navigation.
 */
function validateButton(): HTMLButtonElement | null {
  const btn = document.getElementById("pp-save-btn") as HTMLButtonElement | null;

  // Check if button exists and is still in the document
  if (btn && document.body.contains(btn)) {
    return btn;
  }

  // Button was removed (SPA navigation), need to recreate
  return null;
}

function ensureButton() {
  let btn = validateButton();

  if (!btn) {
    // Remove any orphaned button that might exist
    const orphan = document.getElementById("pp-save-btn");
    if (orphan) orphan.remove();

    btn = document.createElement("button");
    btn.id = "pp-save-btn";
    btn.type = "button";
    btn.textContent = "Save";
    btn.style.cssText = `
      position: fixed;
      z-index: 999999;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      user-select: none;
      font-family: 'Tiempos Text Regular', 'Tiempos Text', ui-serif, Georgia, serif;
      transition: transform 100ms ease, opacity 100ms ease;
    `;

    btn.addEventListener("mouseenter", () => (btn!.style.transform = "translateY(-1px)"));
    btn.addEventListener("mouseleave", () => (btn!.style.transform = "translateY(0)"));

    btn.addEventListener("click", async (e) => {
      // Prevent any event bubbling that could interfere with page
      e.stopPropagation();

      if (!currentComposer) return;

      const text = getComposerText(currentComposer).trim();
      if (!text) return; // don't save empty

      const result = await savePrompt({
        text,
        source: "claude",
        url: location.href,
      });

      if (result.ok) {
        btn!.textContent = `Saved (${result.count}/${result.max})`;
        setTimeout(() => {
          // Re-validate button still exists before updating
          const currentBtn = document.getElementById("pp-save-btn");
          if (currentBtn) currentBtn.textContent = "Save";
        }, 900);
        return;
      }
      if (result.reason === "limit") return toast("Limit reached");
      if (result.reason === "empty") return toast("Nothing to save");
    });

    document.body.appendChild(btn);
  }

  applySaveButtonTheme(btn, currentTheme);
  return btn;
}

function setupSaveKeybind() {
  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    if (!(e.ctrlKey || e.metaKey)) return;
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

    const btn = ensureButton();
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    btn.click();
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
    const btn = document.getElementById("pp-save-btn");
    if (btn) btn.remove();
  }

  const composer = findComposer();
  currentComposer = composer;

  const btn = ensureButton();
  if (!btn) return;

  // Hide if composer missing
  if (!composer) {
    btn.style.display = "none";
    return;
  }

  // Hide if no text in the prompt box
  const text = getComposerText(composer).trim();
  if (!text) {
    btn.style.display = "none";
    return;
  }

  // Hide while Claude is generating a response
  if (isGenerating()) {
    btn.style.display = "none";
    return;
  }

  // Otherwise show + position (prefer send button)
  btn.style.display = "block";
  const sendBtn = findSendButton();
  positionButtonAboveAnchor(btn, sendBtn ?? (composer as HTMLElement));
}

function boot() {
  // Theme sync
  startThemeSync({
    onChange: (t) => {
      currentTheme = t;
      const btn = document.getElementById("pp-save-btn") as HTMLButtonElement | null;
      if (btn) applySaveButtonTheme(btn, currentTheme);
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
}

// Initialize
boot();
