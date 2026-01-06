// src/content/chatgpt.ts
import { savePrompt } from "../shared/promptStore";
import { startThemeSync, detectThemeFromPage, chatgptTheme, type ThemeMode } from "../shared/theme";

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

  const areas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea")).filter(isVisible);
  if (areas.length) {
    areas.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return areas[0];
  }

  const ce = Array.from(document.querySelectorAll<HTMLElement>('[contenteditable="true"]')).filter(isVisible);
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

function findSendButton(): HTMLButtonElement | null {
  const selectors = [
    'button[data-testid="send-button"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="send"]',
    'button[type="submit"]',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLButtonElement) {
      const r = el.getBoundingClientRect();
      if (r.width > 10 && r.height > 10) return el;
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
  // Match ChatGPT send button style: white/light in dark mode, black in light mode
  const colors = theme === "dark" ? chatgptTheme.dark : chatgptTheme.light;

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
let isFirstPrompt = true; // Skip bubble for first prompt only
let processedUserBubbles = new Set<Element>(); // Track which user message bubbles we've added save icons to

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
      padding: 6px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      user-select: none;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
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
        source: "chatgpt",
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

    console.log("[PromptPack] Alt+Shift+S pressed");

    const composer = findComposer();
    if (composer) currentComposer = composer;

    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      if (!composer || (target !== composer && !composer.contains(target))) {
        console.log("[PromptPack] Not in composer, ignoring");
        return;
      }
    }

    const btn = ensureButton();
    if (!btn) {
      console.log("[PromptPack] No button found");
      return;
    }
    console.log("[PromptPack] Triggering save");
    e.preventDefault();
    e.stopPropagation();
    btn.click();
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
 */
function createBubbleSaveIcon(promptText: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "pp-bubble-save-icon";
  btn.type = "button";
  btn.setAttribute("aria-label", "Save prompt to PromptPack");
  btn.title = "Save to PromptPack";

  // Store the prompt text on the button
  (btn as any).__promptText = promptText;

  // Simple icon-only styling
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease, opacity 0.15s ease;
    border: none;
    background: transparent;
    opacity: 0.5;
    margin-left: 8px;
    vertical-align: middle;
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

    // Mark as processed
    processedUserBubbles.add(msg);

    // Find the bubble element (the rounded container with the text)
    // Look for the element that contains the user's text
    const bubble = msg.querySelector('.whitespace-pre-wrap') ||
                   msg.querySelector('[class*="break-words"]') ||
                   textContainer;

    if (!bubble || !bubble.parentElement) return;

    // Check if we already added an icon here
    if (bubble.parentElement.querySelector('.pp-bubble-save-icon')) return;

    // Create and insert the save icon after the bubble
    const saveIcon = createBubbleSaveIcon(promptText);
    bubble.parentElement.style.display = "flex";
    bubble.parentElement.style.alignItems = "center";
    bubble.parentElement.appendChild(saveIcon);
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
    isFirstPrompt = true; // Reset for new conversation
    processedUserBubbles.clear(); // Clear processed bubbles on navigation
  }

  // Always inject save icons next to user message bubbles (regardless of composer state)
  injectBubbleSaveIcons();

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
  } else if (generating) {
    // Mark first prompt as done when we START generating, not after
    if (text && !wasGenerating && isFirstPrompt) {
      isFirstPrompt = false;
    }
    wasGenerating = true;
  }

  // Hide while ChatGPT is generating a response
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
