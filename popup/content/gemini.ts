// src/content/gemini.ts
import { savePrompt } from "../shared/promptStore";
import { startThemeSync, detectThemeFromPage, geminiTheme, type ThemeMode } from "../shared/theme";

type ComposerEl = HTMLTextAreaElement | HTMLElement;

function toast(msg: string, type: "success" | "error" = "success") {
  let el = document.getElementById("pp-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pp-toast";
    el.style.cssText = `
      position: absolute;
      z-index: 999999;
      padding: 10px 12px;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: Google Sans, Roboto, ui-sans-serif, system-ui, -apple-system, Arial;
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
  // Gemini uses specific rich text editor patterns
  // Look for common Gemini composer patterns first
  const geminiComposer = document.querySelector<HTMLElement>(
    'div[contenteditable="true"][role="textbox"], ' +
    'div[contenteditable="true"][aria-label*="prompt"], ' +
    'div[contenteditable="true"][aria-label*="message"]'
  );
  if (geminiComposer && isVisible(geminiComposer)) return geminiComposer;

  // Gemini uses a contenteditable div for the prompt input
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
  const colors = theme === "dark" ? geminiTheme.dark : geminiTheme.light;

  btn.style.background = colors.buttonBg;
  btn.style.border = `1px solid ${colors.border}`;
  btn.style.color = colors.text;
  btn.style.boxShadow = colors.shadow;
  btn.style.fontFamily = colors.font;
}

let currentComposer: ComposerEl | null = null;
let currentTheme: ThemeMode = detectThemeFromPage();
let lastUrl = location.href;
let tickScheduled = false;
let observer: MutationObserver | null = null;
let wasGenerating = false;
let lastPromptText = "";
let isFirstPrompt = true; // Skip bubble for first prompt only
let processedResponses = new Set<Element>(); // Track which responses we've already added buttons to

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
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      line-height: 1;
      user-select: none;
      font-family: Google Sans, Roboto, ui-sans-serif, system-ui, -apple-system, Arial;
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
        source: "gemini",
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
      if (result.reason === "limit") return toast("Limit reached", "error");
      if (result.reason === "empty") return toast("Nothing to save", "error");
    });

    document.body.appendChild(btn);
  }

  applySaveButtonTheme(btn, currentTheme);
  return btn;
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
 * Create a save button for response action bars
 * @param promptText The user's prompt text to save
 */
function createResponseSaveButton(promptText: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "pp-response-save-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Save prompt to PromptPack");

  // Store the prompt text on the button element
  (btn as any).__promptText = promptText;

  // Match Gemini's action button styling with proper contrast
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    border: 1px solid ${currentTheme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"};
    background: transparent;
    color: ${currentTheme === "dark" ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 0, 0, 0.65)"};
    font-family: Google Sans, Roboto, ui-sans-serif, system-ui, -apple-system, Arial;
    gap: 6px;
    opacity: 0.9;
  `;

  // Add hover effect
  btn.addEventListener("mouseenter", () => {
    btn.style.background = currentTheme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)";
    btn.style.opacity = "1";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.background = "transparent";
    btn.style.opacity = "0.9";
  });

  // Use PromptPack logo
  const iconUrl = chrome.runtime.getURL("img/icon-16.png");
  btn.innerHTML = `
    <img src="${iconUrl}" width="16" height="16" style="opacity: 0.9;" alt="PromptPack">
    <span>Save</span>
  `;

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();

    // Get the prompt text stored on this button
    const text = (e.currentTarget as any).__promptText;
    if (!text) {
      toast("No prompt to save", "error");
      return;
    }

    const result = await savePrompt({
      text,
      source: "gemini",
      url: location.href,
    });

    if (result.ok) {
      // Update button to show saved state
      const span = btn.querySelector("span");
      if (span) {
        const originalText = span.textContent;
        span.textContent = "Saved!";
        setTimeout(() => {
          if (span) span.textContent = originalText || "Save";
        }, 2000);
      }
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
 * Inject save button into response action bars
 */
function injectResponseSaveButtons() {
  // Only inject if we have a prompt to save
  if (!lastPromptText) return;

  // Find all Copy buttons in Gemini responses
  const copyButtons = document.querySelectorAll('button[aria-label*="Copy"]');

  copyButtons.forEach((copyBtn) => {
    // Get the parent container of the copy button
    const container = copyBtn.parentElement;

    if (!container) return;

    // Skip if already processed
    if (processedResponses.has(container)) return;

    // Mark as processed
    processedResponses.add(container);

    // Check if we already have a save button in this container
    if (container.querySelector(".pp-response-save-btn")) return;

    // Create and inject save button with the current prompt text
    const saveBtn = createResponseSaveButton(lastPromptText);

    // Insert before the copy button (so it appears first)
    container.insertBefore(saveBtn, copyBtn);
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
    const btn = document.getElementById("pp-save-btn");
    if (btn) btn.remove();
    wasGenerating = false;
    lastPromptText = "";
    isFirstPrompt = true; // Reset for new conversation
    processedResponses.clear(); // Clear processed responses on navigation
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

  // Detect when generation stops
  const generating = isGenerating();
  if (wasGenerating && !generating) {
    // Generation just finished
    wasGenerating = false;

    // Inject save buttons into response action bars with delays
    // Gemini renders the copy button asynchronously, so retry a few times
    injectResponseSaveButtons();
    setTimeout(() => injectResponseSaveButtons(), 100);
    setTimeout(() => injectResponseSaveButtons(), 300);
    setTimeout(() => injectResponseSaveButtons(), 600);
  } else if (generating) {
    // Store the prompt text before it gets cleared
    if (text && !wasGenerating) {
      lastPromptText = text;

      // Mark first prompt as done when we START generating, not after
      if (isFirstPrompt) {
        isFirstPrompt = false;
      }
    }
    wasGenerating = true;
  }

  // Always try to inject save buttons into existing responses
  injectResponseSaveButtons();

  // Hide while Gemini is generating a response
  if (generating) {
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
