import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { savePrompt, listPrompts, MAX_PROMPTS } from "../shared/promptStore";
import { resetDBInstance } from "../shared/db";

// Mock chrome.storage.local
const mockChromeStorage: Record<string, unknown> = {};

const mockChrome = {
  storage: {
    local: {
      get: vi.fn(async (key: string | string[]) => {
        if (typeof key === "string") {
          return { [key]: mockChromeStorage[key] };
        }
        const result: Record<string, unknown> = {};
        for (const k of key) {
          result[k] = mockChromeStorage[k];
        }
        return result;
      }),
      set: vi.fn(async (data: Record<string, unknown>) => {
        Object.assign(mockChromeStorage, data);
      }),
    },
  },
};

// Mock crypto.randomUUID
(globalThis as any).crypto = {
  randomUUID: () => `uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
};

(globalThis as any).chrome = mockChrome;

// Mock IndexedDB (reuse from pro-account test)
let mockDatabases: Record<string, Record<string, any[]>> = {};

const createMockIndexedDB = () => {
  return {
    open: vi.fn((name: string, version: number) => {
      if (!mockDatabases[name]) {
        mockDatabases[name] = { prompts: [], packs: [], session: [] };
      }
      const databases = mockDatabases;

      const request = {
        result: null as any,
        error: null,
        onsuccess: null as ((e: any) => void) | null,
        onerror: null as ((e: any) => void) | null,
        onupgradeneeded: null as ((e: any) => void) | null,
      };

      setTimeout(() => {
        const db = {
          objectStoreNames: {
            contains: (storeName: string) => databases[name].hasOwnProperty(storeName),
          },
          createObjectStore: vi.fn((storeName: string, _options: any) => {
            if (!databases[name][storeName]) {
              databases[name][storeName] = [];
            }
            return { createIndex: vi.fn() };
          }),
          transaction: vi.fn((_storeNames: string | string[], _mode: string) => {
            const tx = {
              objectStore: vi.fn((storeName: string) => {
                const storeData = databases[name][storeName] || [];
                return {
                  add: vi.fn((data: any) => {
                    const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
                    setTimeout(() => { storeData.push(data); if (req.onsuccess) req.onsuccess({ target: req }); }, 0);
                    return req;
                  }),
                  put: vi.fn((data: any) => {
                    const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
                    setTimeout(() => {
                      const idx = storeData.findIndex((item: any) => item.id === data.id);
                      if (idx >= 0) storeData[idx] = data; else storeData.push(data);
                      if (req.onsuccess) req.onsuccess({ target: req });
                    }, 0);
                    return req;
                  }),
                  get: vi.fn((key: string) => {
                    const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null, result: null as any };
                    setTimeout(() => { req.result = storeData.find((item: any) => item.id === key); if (req.onsuccess) req.onsuccess({ target: req }); }, 0);
                    return req;
                  }),
                  getAll: vi.fn(() => {
                    const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null, result: [...storeData] };
                    setTimeout(() => { if (req.onsuccess) req.onsuccess({ target: req }); }, 0);
                    return req;
                  }),
                  delete: vi.fn((key: string) => {
                    const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
                    setTimeout(() => {
                      const idx = storeData.findIndex((item: any) => item.id === key);
                      if (idx >= 0) storeData.splice(idx, 1);
                      if (req.onsuccess) req.onsuccess({ target: req });
                    }, 0);
                    return req;
                  }),
                  clear: vi.fn(() => {
                    const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
                    setTimeout(() => { storeData.length = 0; if (req.onsuccess) req.onsuccess({ target: req }); }, 0);
                    return req;
                  }),
                  count: vi.fn(() => {
                    const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null, result: storeData.length };
                    setTimeout(() => { if (req.onsuccess) req.onsuccess({ target: req }); }, 0);
                    return req;
                  }),
                  index: vi.fn((indexName: string) => ({
                    getAll: vi.fn((value?: any) => {
                      const req = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null, result: value !== undefined ? storeData.filter((item: any) => item[indexName] === value) : [...storeData] };
                      setTimeout(() => { if (req.onsuccess) req.onsuccess({ target: req }); }, 0);
                      return req;
                    }),
                  })),
                };
              }),
              oncomplete: null as ((e: any) => void) | null,
              onerror: null as ((e: any) => void) | null,
            };
            setTimeout(() => { if (tx.oncomplete) tx.oncomplete({}); }, 10);
            return tx;
          }),
        };

        request.result = db;
        if (request.onupgradeneeded) request.onupgradeneeded({ target: { result: db }, oldVersion: 0, newVersion: version });
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);

      return request;
    }),
  };
};

(globalThis as any).indexedDB = createMockIndexedDB();

/**
 * Auth-Based Functionality Tests
 *
 * Testing Requirements:
 * - Not signed in (guest): 10 prompts max, no save to dashboard button, no import
 * - Free account: 10 prompts max, no import button
 * - Pro account: Unlimited prompts, save to dashboard, import allowed
 *
 * NOTE: MAX_PROMPTS is set to 10 for guest and free users.
 */
describe("Popup Auth-Based Functionality", () => {
  beforeEach(() => {
    // Clear storage before each test
    Object.keys(mockChromeStorage).forEach((key) => delete mockChromeStorage[key]);
    mockDatabases = {};
    resetDBInstance();
    vi.clearAllMocks();
    (globalThis as any).indexedDB = createMockIndexedDB();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Not Signed In (Guest User)", () => {
    it("allows saving up to MAX_PROMPTS (10 prompts)", async () => {
      // Save MAX_PROMPTS prompts
      for (let i = 0; i < MAX_PROMPTS; i++) {
        const result = await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
        expect(result.ok).toBe(true);
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(MAX_PROMPTS);
    });

    it("prevents adding beyond MAX_PROMPTS limit", async () => {
      // Fill up to max
      for (let i = 0; i < MAX_PROMPTS; i++) {
        await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      // Try to exceed limit
      const result = await savePrompt({
        text: "Beyond limit",
        source: "chatgpt",
        url: "https://chatgpt.com/extra",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("limit");
        expect(result.max).toBe(MAX_PROMPTS);
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(MAX_PROMPTS);
    });

    it("shows correct MAX_PROMPTS in error message", async () => {
      // Fill storage
      for (let i = 0; i < MAX_PROMPTS; i++) {
        await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      const result = await savePrompt({
        text: "Extra",
        source: "chatgpt",
        url: "https://chatgpt.com",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.max).toBe(MAX_PROMPTS);
        expect(result.reason).toBe("limit");
      }
    });

    it("enforces prompt limit consistently across sources", async () => {
      // Split prompts across different sources
      const halfLimit = Math.floor(MAX_PROMPTS / 2);

      // Add half from ChatGPT
      for (let i = 0; i < halfLimit; i++) {
        await savePrompt({
          text: `ChatGPT ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      // Add remaining from Claude
      for (let i = 0; i < MAX_PROMPTS - halfLimit; i++) {
        await savePrompt({
          text: `Claude ${i}`,
          source: "claude",
          url: `https://claude.ai/${i}`,
        });
      }

      // Try to add from Gemini - should fail
      const result = await savePrompt({
        text: "Gemini prompt",
        source: "gemini",
        url: "https://gemini.google.com",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("limit");
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(MAX_PROMPTS);
    });
  });

  describe("Free Account Functionality", () => {
    // Free account has same prompt storage limits as guest
    it("free account has MAX_PROMPTS limit", async () => {
      // Fill to max
      for (let i = 0; i < MAX_PROMPTS; i++) {
        await savePrompt({
          text: `Free user prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      // Try to exceed
      const result = await savePrompt({
        text: "Extra prompt",
        source: "chatgpt",
        url: "https://chatgpt.com/extra",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("limit");
        expect(result.max).toBe(MAX_PROMPTS);
      }
    });

    it("free account cannot exceed MAX_PROMPTS", async () => {
      // Add exactly MAX_PROMPTS
      for (let i = 0; i < MAX_PROMPTS; i++) {
        const result = await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
        expect(result.ok).toBe(true);
      }

      // Next should fail
      const nextResult = await savePrompt({
        text: "One more",
        source: "claude",
        url: "https://claude.ai",
      });

      expect(nextResult.ok).toBe(false);
      if (!nextResult.ok) {
        expect(nextResult.reason).toBe("limit");
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(MAX_PROMPTS);
    });
  });

  describe("MAX_PROMPTS constant verification", () => {
    it("MAX_PROMPTS is set to 10", () => {
      // Guest and free users have a limit of 10 prompts
      expect(MAX_PROMPTS).toBe(10);
    });

    it("enforces exactly MAX_PROMPTS limit", async () => {
      for (let i = 0; i < MAX_PROMPTS; i++) {
        const result = await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
        expect(result.ok).toBe(true);
      }

      const afterMax = await savePrompt({
        text: "Beyond limit",
        source: "chatgpt",
        url: "https://chatgpt.com/beyond",
      });

      expect(afterMax.ok).toBe(false);
    });
  });

  describe("Edge Cases for Prompt Limits", () => {
    it("allows replacing duplicate prompt without exceeding limit", async () => {
      // Fill to max
      for (let i = 0; i < MAX_PROMPTS; i++) {
        await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      // Try to save duplicate (should replace, not add)
      const result = await savePrompt({
        text: "Prompt 5", // Duplicate text from earlier
        source: "chatgpt",
        url: "https://chatgpt.com/new",
      });

      expect(result.ok).toBe(true); // Should succeed (replacement)

      const prompts = await listPrompts();
      expect(prompts.length).toBe(MAX_PROMPTS); // Still at max, not over
    });

    it("handles whitespace-only text as empty (does not count towards limit)", async () => {
      const result = await savePrompt({
        text: "   ",
        source: "chatgpt",
        url: "https://chatgpt.com",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("empty");
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(0); // Nothing saved
    });
  });
});
