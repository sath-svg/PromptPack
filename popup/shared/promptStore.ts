import { safeGet, safeSet, atomicUpdate } from "./safeStorage";

export type PromptSource = "chatgpt" | "claude" | "gemini";

export type PromptItem = {
  id: string;
  text: string;
  source: PromptSource;
  url: string;
  createdAt: number;
  packName?: string; // Optional: name of imported pack (e.g., "Funny", "Work Tips")
};

const KEY = "promptpack_prompts";
export const MAX_PROMPTS = 20;
export const MAX_IMPORTED_PACKS = 2; // Max number of imported packs for pro users

export async function listPrompts(): Promise<PromptItem[]> {
  const arr = await safeGet<PromptItem[]>(KEY);
  // ensure newest first (helps UI consistency)
  return (arr ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
}

export async function savePrompt(item: Omit<PromptItem, "id" | "createdAt">) {
  const text = item.text.trim();
  if (!text) return { ok: false as const, reason: "empty" as const };

  // Use atomic update to prevent race conditions
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    const arr = existing ?? [];

    const isDuplicate = arr.some(
      (p) => p.text === text && p.source === item.source
    );

    // Hard cap (allow duplicates to "refresh" even at cap)
    if (!isDuplicate && arr.length >= MAX_PROMPTS) {
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
    ].slice(0, MAX_PROMPTS);
  });

  if (!result.ok) {
    console.error("[PromptStore] Save failed:", result.error);
    return { ok: false as const, reason: "storage_error" as const, error: result.error };
  }

  // Check if we hit the limit (length unchanged and not a duplicate refresh)
  const existing = await listPrompts();
  if (existing.length >= MAX_PROMPTS && !existing.some(p => p.text === text && p.source === item.source)) {
    return { ok: false as const, reason: "limit" as const, max: MAX_PROMPTS };
  }

  return { ok: true as const, count: result.data.length, max: MAX_PROMPTS };
}

export async function deletePrompt(id: string) {
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return (existing ?? []).filter((p) => p.id !== id);
  });

  if (!result.ok) {
    console.error("[PromptStore] Delete failed:", result.error);
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, count: result.data.length };
}

export async function deletePromptsBySource(source: PromptSource) {
  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return (existing ?? []).filter((p) => p.source !== source);
  });

  if (!result.ok) {
    console.error("[PromptStore] Delete by source failed:", result.error);
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const, count: result.data.length };
}

export async function clearAllPrompts() {
  const result = await safeSet<PromptItem[]>(KEY, []);

  if (!result.ok) {
    console.error("[PromptStore] Clear failed:", result.error);
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
    });
  }

  const result = await atomicUpdate<PromptItem[]>(KEY, (existing) => {
    return [...imported, ...(existing ?? [])];
  });

  if (!result.ok) {
    console.error("[PromptStore] Bulk save failed:", result.error);
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
    console.error("[PromptStore] Remove by IDs failed:", result.error);
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
    console.error("[PromptStore] Delete pack failed:", result.error);
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
    console.error("[PromptStore] Restore failed:", result.error);
    return { ok: false, error: result.error };
  }

  return { ok: true };
}
