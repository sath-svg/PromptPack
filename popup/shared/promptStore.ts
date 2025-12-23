export type PromptSource = "chatgpt" | "claude" | "gemini";

export type PromptItem = {
  id: string;
  text: string;
  source: PromptSource;
  url: string;
  createdAt: number;
};

const KEY = "promptpack_prompts";
export const MAX_PROMPTS = 20;

export async function listPrompts(): Promise<PromptItem[]> {
  const res = await chrome.storage.local.get(KEY);
  const arr = (res[KEY] as PromptItem[] | undefined) ?? [];
  // ensure newest first (helps UI consistency)
  return arr.slice().sort((a, b) => b.createdAt - a.createdAt);
}

export async function savePrompt(item: Omit<PromptItem, "id" | "createdAt">) {
  const existing = await listPrompts();

  const text = item.text.trim();
  if (!text) return { ok: false as const, reason: "empty" as const };

  const isDuplicate = existing.some(
    (p) => p.text === text && p.source === item.source
  );

  // Hard cap (allow duplicates to "refresh" even at cap)
  if (!isDuplicate && existing.length >= MAX_PROMPTS) {
    return { ok: false as const, reason: "limit" as const, max: MAX_PROMPTS };
  }

  const deduped = existing.filter(
    (p) => !(p.text === text && p.source === item.source)
  );

  const next: PromptItem[] = [
    {
      id: crypto.randomUUID(),
      text,
      source: item.source,
      url: item.url,
      createdAt: Date.now(),
    },
    ...deduped,
  ].slice(0, MAX_PROMPTS);

  await chrome.storage.local.set({ [KEY]: next });
  return { ok: true as const, count: next.length, max: MAX_PROMPTS };
}

export async function deletePrompt(id: string) {
  const existing = await listPrompts();
  const next = existing.filter((p) => p.id !== id);
  await chrome.storage.local.set({ [KEY]: next });
  return { ok: true as const, count: next.length };
}

export async function deletePromptsBySource(source: PromptSource) {
  const existing = await listPrompts();
  const next = existing.filter((p) => p.source !== source);
  await chrome.storage.local.set({ [KEY]: next });
  return { ok: true as const, count: next.length };
}

export async function clearAllPrompts() {
  await chrome.storage.local.set({ [KEY]: [] as PromptItem[] });
  return { ok: true as const, count: 0 };
}
