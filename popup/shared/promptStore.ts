import { safeGet, safeSet, atomicUpdate } from "./safeStorage";
import { getSession, type UserSession } from "./db";
import { api } from "./api";
import {
  FREE_PROMPT_LIMIT,
  PRO_PROMPT_LIMIT,
  MAX_PROMPTS,
  MAX_IMPORTED_PACKS,
  PROMPTS_STORAGE_KEY,
} from "./config";

// Re-export for backwards compatibility
export { FREE_PROMPT_LIMIT, PRO_PROMPT_LIMIT, MAX_PROMPTS, MAX_IMPORTED_PACKS };

export type PromptSource = "chatgpt" | "claude" | "gemini";

export type PromptItem = {
  id: string;
  text: string;
  source: PromptSource;
  url: string;
  createdAt: number;
  packName?: string; // Optional: name of imported pack (e.g., "Funny", "Work Tips")
  header?: string; // Optional: AI-generated 1-2 word header
  headerGeneratedAt?: number; // Optional: Timestamp when header was generated
  classifying?: boolean; // Optional: True while header is being generated
  classifyingAt?: number; // Optional: Timestamp when classification started
};

const KEY = PROMPTS_STORAGE_KEY;
const CLASSIFY_TIMEOUT_MS = 25 * 1000;
const STALE_CLASSIFY_RETRY_MS = 30 * 1000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });

  const result = await Promise.race([promise, timeoutPromise]);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  return result as T | null;
}

export async function listPrompts(): Promise<PromptItem[]> {
  const arr = await safeGet<PromptItem[]>(KEY);
  // ensure newest first (helps UI consistency)
  return (arr ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
}

export async function listPromptsBySource(source: PromptSource): Promise<PromptItem[]> {
  const all = await listPrompts();
  return all.filter((p) => p.source === source);
}

export type PromptGroup = {
  name: string;
  displayName: string;
  prompts: PromptItem[];
};

/**
 * Check if user is pro from the current session
 */
export async function isProUser(): Promise<boolean> {
  const session = await getActiveSession();
  return session?.tier === "paid";
}

/**
 * Get prompts for a source, grouped by pack (for pro users) or flat (for free users)
 * Returns: regular prompts (no packName) + imported packs (with packName)
 */
export async function listPromptsBySourceGrouped(source: PromptSource): Promise<PromptGroup[]> {
  const all = await listPrompts();
  const sourcePrompts = all.filter((p) => p.source === source);

  // Separate regular prompts from imported packs
  const regular = sourcePrompts.filter((p) => !p.packName);
  const packsMap = new Map<string, PromptItem[]>();

  // Group imported packs across all sources (always show if present)
  for (const p of all) {
    if (p.packName) {
      const existing = packsMap.get(p.packName) || [];
      existing.push(p);
      packsMap.set(p.packName, existing);
    }
  }

  const groups: PromptGroup[] = [];

  // Add regular prompts group
  const sourceTitle = source === "chatgpt" ? "ChatGPT" : source === "claude" ? "Claude" : "Gemini";
  groups.push({
    name: source,
    displayName: `${sourceTitle} Prompts`,
    prompts: regular,
  });

  // Add imported pack groups
  for (const [packName, prompts] of packsMap) {
    groups.push({
      name: packName,
      displayName: `"${packName}" Prompts`,
      prompts,
    });
  }

  return groups;
}

function decodeJwtExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    const data = JSON.parse(json) as { exp?: number };
    if (typeof data.exp === "number") {
      return data.exp * 1000;
    }
  } catch {
    // Ignore decode errors
  }
  return null;
}

async function getActiveSession(): Promise<UserSession | null> {
  const session = await getSession();
  if (!session?.accessToken) return null;
  const jwtExpiry = decodeJwtExpiry(session.accessToken);
  if (jwtExpiry && jwtExpiry <= Date.now()) return null;
  if (session.expiresAt <= Date.now()) return null;
  return session;
}

/**
 * Get the user's prompt limit from the current session
 */
async function getPromptLimitFromSession(): Promise<number> {
  const session = await getActiveSession();
  if (session?.entitlements?.promptLimit) return session.entitlements.promptLimit;
  if (session?.tier === "paid") return PRO_PROMPT_LIMIT;
  const backgroundLimit = await getPromptLimitViaBackground();
  if (typeof backgroundLimit === "number") return backgroundLimit;
  return FREE_PROMPT_LIMIT;
}

async function getPromptLimitViaBackground(): Promise<number | null> {
  if (!chrome?.runtime?.sendMessage) return null;
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "PP_GET_PROMPT_LIMIT" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      const limit = (response as { limit?: number } | undefined)?.limit;
      resolve(typeof limit === "number" ? limit : null);
    });
  });
}

/**
 * Classify prompt in background (non-blocking)
 * Called after savePrompt succeeds
 */
async function classifyPromptInBackground(promptId: string, promptText: string): Promise<void> {
  try {
    // Set classifying flag
    await atomicUpdate<PromptItem[]>(KEY, (existing) => {
      const arr = existing ?? [];
      const index = arr.findIndex(p => p.id === promptId);
      if (index === -1) return arr;
      const updatedArr = [...arr];
      updatedArr[index] = {
        ...updatedArr[index],
        classifying: true,
        classifyingAt: Date.now(),
      };
      return updatedArr;
    });

    // Call classify API
    const result = await withTimeout(api.classifyPrompt(promptText), CLASSIFY_TIMEOUT_MS);

    if (!result) {
      // Clear classifying flag on timeout
      await atomicUpdate<PromptItem[]>(KEY, (existing) => {
        const arr = existing ?? [];
        const index = arr.findIndex(p => p.id === promptId);
        if (index === -1) return arr;
        const updatedArr = [...arr];
        const { classifyingAt: _classifyingAt, ...rest } = updatedArr[index];
        updatedArr[index] = {
          ...rest,
          classifying: false,
        };
        return updatedArr;
      });
      console.warn(`[PromptPack] Classification timed out for prompt ${promptId}`);
      return;
    }

    if (result.success && result.header) {
      // Update prompt with header and clear classifying flag
      await atomicUpdate<PromptItem[]>(KEY, (existing) => {
        const arr = existing ?? [];
        const index = arr.findIndex(p => p.id === promptId);
        if (index === -1) return arr;
        const updatedArr = [...arr];
        const { classifyingAt: _classifyingAt, ...rest } = updatedArr[index];
        updatedArr[index] = {
          ...rest,
          header: result.header,
          headerGeneratedAt: Date.now(),
          classifying: false,
        };
        return updatedArr;
      });

    } else {
      // Clear classifying flag on error
      await atomicUpdate<PromptItem[]>(KEY, (existing) => {
        const arr = existing ?? [];
        const index = arr.findIndex(p => p.id === promptId);
        if (index === -1) return arr;
        const updatedArr = [...arr];
        const { classifyingAt: _classifyingAt, ...rest } = updatedArr[index];
        updatedArr[index] = {
          ...rest,
          classifying: false,
        };
        return updatedArr;
      });
      console.warn(`[PromptPack] Failed to classify prompt ${promptId}:`, result.error);
    }
  } catch (error) {
    // Clear classifying flag on error
    await atomicUpdate<PromptItem[]>(KEY, (existing) => {
      const arr = existing ?? [];
      const index = arr.findIndex(p => p.id === promptId);
      if (index === -1) return arr;
      const updatedArr = [...arr];
      const { classifyingAt: _classifyingAt, ...rest } = updatedArr[index];
      updatedArr[index] = {
        ...rest,
        classifying: false,
      };
      return updatedArr;
    });
    // Silently fail - classification is non-critical
    console.error(`[PromptPack] Classification error for prompt ${promptId}:`, error);
  }
}

export async function savePrompt(item: Omit<PromptItem, "id" | "createdAt">) {
  const text = item.text.trim();
  if (!text) return { ok: false as const, reason: "empty" as const };

  // Get user's prompt limit from the current session
  const promptLimit = await getPromptLimitFromSession();

  // Use atomic update to prevent race conditions
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    const arr = existing ?? [];

    const isDuplicate = arr.some(
      (p) => p.text === text && p.source === item.source
    );

    // Hard cap (allow duplicates to "refresh" even at cap)
    if (!isDuplicate && arr.length >= promptLimit) {
      // Return unchanged - we'll handle this below
      return arr;
    }

    const deduped = arr.filter(
      (p) => !(p.text === text && p.source === item.source)
    );

    return [
      {
        id: crypto.randomUUID(),
        text,
        source: item.source,
        url: item.url,
        createdAt: Date.now(),
      },
      ...deduped,
    ].slice(0, promptLimit);
  });

  if (!result.ok) {
    return { ok: false as const, reason: "storage_error" as const, error: result.error };
  }

  // Check if we hit the limit (length unchanged and not a duplicate refresh)
  const existing = await listPrompts();
  if (existing.length >= promptLimit && !existing.some(p => p.text === text && p.source === item.source)) {
    return { ok: false as const, reason: "limit" as const, max: promptLimit };
  }

  // Get the saved prompt ID to trigger classification (only for authenticated users)
  const isAuthed = await api.verifyAuthSession();
  if (isAuthed) {
    const savedPrompts = result.data;
    const savedPrompt = savedPrompts.find(p => p.text === text && p.source === item.source);

    if (savedPrompt) {
      // Trigger classification in background (non-blocking)
      classifyPromptInBackground(savedPrompt.id, text).catch((err) => {
        // Silently fail - don't block save operation
        console.error('[PromptPack] Classification failed:', err);
      });
    } else {
      console.warn('[PromptPack] Could not find saved prompt to classify. Text:', text.substring(0, 50));
    }
  } else {
  }

  return { ok: true as const, count: result.data.length, max: promptLimit };
}

export async function requeueStaleClassifications(options?: {
  staleMs?: number;
  max?: number;
  perSource?: boolean;
}): Promise<number> {
  const staleMs = options?.staleMs ?? STALE_CLASSIFY_RETRY_MS;
  const max = options?.max ?? 5;
  const perSource = options?.perSource ?? true;
  if (max <= 0) return 0;

  const isAuthed = await api.verifyAuthSession();
  if (!isAuthed) return 0;

  const prompts = await listPrompts();
  const now = Date.now();
  const stale = prompts.filter(
    (p) =>
      !p.packName &&
      p.header == null &&
      p.classifying === true &&
      (!p.classifyingAt || now - p.classifyingAt > staleMs)
  );

  if (!stale.length) {
    return 0;
  }

  let toProcess: typeof stale;

  if (perSource) {
    // Process up to `max` stale prompts from EACH source
    const sources: PromptSource[] = ["chatgpt", "claude", "gemini"];
    toProcess = [];
    for (const source of sources) {
      const sourcePrompts = stale.filter(p => p.source === source).slice(0, max);
      toProcess.push(...sourcePrompts);
    }
  } else {
    toProcess = stale.slice(0, max);
  }

  toProcess.forEach((prompt) => {
    void classifyPromptInBackground(prompt.id, prompt.text);
  });

  return toProcess.length;
}

export async function requeueMissingHeaders(options?: {
  max?: number;
  perSource?: boolean;
}): Promise<number> {
  const max = options?.max ?? 5;
  const perSource = options?.perSource ?? true;
  if (max <= 0) return 0;

  const isAuthed = await api.verifyAuthSession();
  if (!isAuthed) return 0;

  const prompts = await listPrompts();
  const missing = prompts.filter(
    (p) => !p.packName && p.header == null
  );

  if (!missing.length) return 0;

  let toProcess: typeof missing;

  if (perSource) {
    // Process up to `max` prompts from EACH source
    const sources: PromptSource[] = ["chatgpt", "claude", "gemini"];
    toProcess = [];
    for (const source of sources) {
      const sourcePrompts = missing.filter(p => p.source === source).slice(0, max);
      toProcess.push(...sourcePrompts);
    }
  } else {
    toProcess = missing.slice(0, max);
  }

  toProcess.forEach((prompt) => {
    void classifyPromptInBackground(prompt.id, prompt.text);
  });

  return toProcess.length;
}

export async function deletePrompt(id: string) {
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return (existing ?? []).filter((p) => p.id !== id);
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, count: result.data.length };
}

export async function deletePromptsBySource(source: PromptSource) {
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return (existing ?? []).filter((p) => p.source !== source);
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, count: result.data.length };
}

export async function clearAllPrompts() {
  const result = await safeSet<PromptItem[]>(KEY, []);

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, count: 0 };
}

/**
 * Bulk save prompts (for imports) - uses atomic update
 * Returns the IDs of successfully imported prompts for undo functionality
 */
export async function bulkSavePrompts(
  items: Omit<PromptItem, "id" | "createdAt">[],
  packName?: string
): Promise<{ ok: boolean; imported: PromptItem[]; error?: string }> {
  const imported: PromptItem[] = [];
  const now = Date.now();

  // Create all prompt items with IDs upfront
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    imported.push({
      id: crypto.randomUUID(),
      text: item.text.trim(),
      source: item.source,
      url: item.url,
      createdAt: now + i, // Slight offset to maintain order
      packName,
      ...('header' in item && item.header && { header: item.header }),
      ...('headerGeneratedAt' in item && item.headerGeneratedAt && {
        headerGeneratedAt: item.headerGeneratedAt
      }),
    });
  }

  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return [...imported, ...(existing ?? [])];
  });

  if (!result.ok) {
    return { ok: false, imported: [], error: result.error };
  }

  return { ok: true, imported };
}

/**
 * Remove prompts by IDs (for undo of imports)
 */
export async function removePromptsByIds(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  const idSet = new Set(ids);

  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return (existing ?? []).filter((p) => !idSet.has(p.id));
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

/**
 * Delete all prompts from a specific pack
 */
export async function deletePackPrompts(
  packName: string,
  source: PromptSource
): Promise<{ ok: boolean; deleted: PromptItem[]; error?: string }> {
  let deleted: PromptItem[] = [];

  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    const arr = existing ?? [];
    deleted = arr.filter((p) => p.packName === packName && p.source === source);
    return arr.filter((p) => !(p.packName === packName && p.source === source));
  });

  if (!result.ok) {
    return { ok: false, deleted: [], error: result.error };
  }

  return { ok: true, deleted };
}

/**
 * Restore prompts (for undo functionality)
 */
export async function restorePrompts(prompts: PromptItem[]): Promise<{ ok: boolean; error?: string }> {
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return [...prompts, ...(existing ?? [])];
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

/**
 * Update a prompt's header after classification
 */
export async function updatePromptHeader(
  promptId: string,
  header: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    const arr = existing ?? [];
    const index = arr.findIndex(p => p.id === promptId);

    if (index === -1) {
      return arr; // Prompt not found, no change
    }

    // Update the prompt with header
    const updatedArr = [...arr];
    updatedArr[index] = {
      ...updatedArr[index],
      header,
      headerGeneratedAt: Date.now(),
    };

    return updatedArr;
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export async function updatePromptText(
  promptId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "empty" };
  }

  let found = false;
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    const arr = existing ?? [];
    const index = arr.findIndex(p => p.id === promptId);
    if (index === -1) {
      return arr;
    }
    found = true;
    const updatedArr = [...arr];
    updatedArr[index] = {
      ...updatedArr[index],
      text: trimmed,
    };
    return updatedArr;
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  if (!found) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true };
}
