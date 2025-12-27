// src/shared/theme.ts
export type ThemeMode = "dark" | "light";
export const THEME_KEY = "promptpack_theme";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function parseRgb(css: string): { r: number; g: number; b: number } | null {
  // "rgb(r, g, b)" or "rgba(r, g, b, a)"
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function rgbToLuma(css: string): number | null {
  const rgb = parseRgb(css);
  if (!rgb) return null;

  const r = clamp01(rgb.r / 255);
  const g = clamp01(rgb.g / 255);
  const b = clamp01(rgb.b / 255);

  // perceived luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Generic: works across ChatGPT / Claude / Gemini by reading computed background.
 * Falls back to prefers-color-scheme.
 */
export function getSystemTheme(): ThemeMode {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function detectThemeFromPage(doc: Document = document): ThemeMode {
  const root = doc.documentElement;
  const body = doc.body;

  // Check for theme classes
  if (root.classList.contains('dark') || body?.classList.contains('dark')) {
    return 'dark';
  }
  if (root.classList.contains('light') || body?.classList.contains('light')) {
    return 'light';
  }

  // Check for data-theme attribute
  const dataTheme = root.getAttribute('data-theme') || body?.getAttribute('data-theme');
  if (dataTheme === 'dark') return 'dark';
  if (dataTheme === 'light') return 'light';

  // Fallback to background color detection
  const rootBg = root && getComputedStyle(root).backgroundColor;
  const bodyBg = body && getComputedStyle(body).backgroundColor;

  // Prefer body background, fall back to root only if body is transparent/invalid
  // This handles cases where root has transparent background
  let bg = bodyBg || rootBg || "";

  // If we got a transparent color (alpha = 0), try the other one
  if (bg.includes("rgba") && bg.includes(", 0)")) {
    bg = (bg === bodyBg ? rootBg : bodyBg) || bg;
  }

  const luma = rgbToLuma(bg);
  if (luma == null) {
    return getSystemTheme();
  }

  // Use a threshold of 0.6 for better light theme detection
  // Values closer to 1.0 are lighter (white backgrounds)
  return luma > 0.6 ? "light" : "dark";
}

export async function syncThemeToStorage(doc: Document = document): Promise<ThemeMode> {
  const theme = detectThemeFromPage(doc);
  await chrome.storage.local.set({ [THEME_KEY]: theme });
  return theme;
}

type ThemeSyncOptions = {
  /** called whenever theme changes */
  onChange?: (theme: ThemeMode) => void;
  /** also write to chrome.storage.local (default true) */
  persistToStorage?: boolean;
};

/**
 * Starts watching the page for theme flips (class/style changes + system changes).
 * Returns a stop() function.
 */
export function startThemeSync(options: ThemeSyncOptions = {}) {
  const { onChange, persistToStorage = true } = options;

  let last: ThemeMode | null = null;
  let rafPending = false;

  const emit = async () => {
    const next = detectThemeFromPage(document);
    if (next === last) return;
    last = next;

    if (persistToStorage) {
      await chrome.storage.local.set({ [THEME_KEY]: next });
    }
    onChange?.(next);
  };

  const schedule = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      void emit();
    });
  };

  // initial
  void emit();

  const obs = new MutationObserver(schedule);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  if (document.body) {
    obs.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
  }

  // also react to system changes
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onMql = () => schedule();
  mql?.addEventListener?.("change", onMql);

  return function stop() {
    obs.disconnect();
    mql?.removeEventListener?.("change", onMql);
  };
}

/**
 * Reads theme from storage and applies it to document.documentElement.dataset.theme.
 * Falls back to system theme if not found.
 */
export async function applyThemeFromStorageToRoot(): Promise<void> {
  const result = await chrome.storage.local.get(THEME_KEY);
  const storedTheme = result[THEME_KEY] as ThemeMode | undefined;
  const theme = storedTheme ?? getSystemTheme();
  document.documentElement.dataset.theme = theme;
}

/**
 * ChatGPT theme colors - matches ChatGPT's design system
 */
export const chatgptTheme = {
  light: {
    bg: "rgba(255, 255, 255, 0.92)",
    text: "rgba(255, 255, 255, 0.95)",
    border: "rgba(0, 0, 0, 0.14)",
    shadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
    buttonBg: "rgba(0, 0, 0, 0.95)", // Black button
    font: "'Open Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
  },
  dark: {
    bg: "rgba(255, 255, 255, 0.92)",
    text: "rgba(17, 24, 39, 0.95)",
    border: "rgba(0, 0, 0, 0.12)",
    shadow: "0 10px 28px rgba(0, 0, 0, 0.12)",
    buttonBg: "rgba(255, 255, 255, 0.92)", // White button
    font: "'Open Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
  },
};

/**
 * Claude theme colors - matches Claude.ai's design system
 * Orange accent: #C15F3C / rgb(193, 95, 60) - matches Claude logo
 */
export const claudeTheme = {
  light: {
    bg: "rgba(255, 255, 255, 0.95)",
    text: "rgba(0, 0, 0, 0.95)",
    border: "rgba(0, 0, 0, 0.1)",
    shadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    accent: "#C15F3C", // Claude orange
    font: "'Tiempos Text Regular', 'Tiempos Text', ui-serif, Georgia, serif",
  },
  dark: {
    bg: "rgba(25, 25, 28, 0.95)",
    text: "rgba(255, 255, 255, 0.95)",
    border: "rgba(255, 255, 255, 0.15)",
    shadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    accent: "#C15F3C", // Claude orange
    font: "'Tiempos Text Regular', 'Tiempos Text', ui-serif, Georgia, serif",
  },
};

/**
 * Gemini theme colors - matches Gemini's design system
 */
export const geminiTheme = {
  light: {
    bg: "rgba(255, 255, 255, 0.95)",
    text: "rgba(0, 0, 0, 0.87)",
    border: "rgba(0, 0, 0, 0.12)",
    shadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    buttonBg: "rgba(245, 245, 245, 0.95)", // Off-white button
    font: "Google Sans, Roboto, ui-sans-serif, system-ui, -apple-system, Arial",
  },
  dark: {
    bg: "rgba(0, 0, 0, 0.95)",
    text: "rgba(255, 255, 255, 0.87)",
    border: "rgba(255, 255, 255, 0.12)",
    shadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
    buttonBg: "rgba(255, 255, 255, 0.08)", // Transparent button
    font: "Google Sans, Roboto, ui-sans-serif, system-ui, -apple-system, Arial",
  },
};
