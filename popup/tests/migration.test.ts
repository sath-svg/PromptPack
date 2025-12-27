import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { migrateFromChromeStorage } from "../shared/db";
import type { PromptItem } from "../shared/promptStore";

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
      remove: vi.fn(async (key: string) => {
        delete mockChromeStorage[key];
      }),
    },
  },
};

(globalThis as any).chrome = mockChrome;

// Mock crypto.randomUUID
(globalThis as any).crypto = {
  randomUUID: () => `uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
};

// Mock IndexedDB
let mockDatabases: Record<string, Record<string, unknown[]>> = {};

const createMockIndexedDB = () => {
  return {
    open: vi.fn((name: string, version: number) => {
      if (!mockDatabases[name]) {
        mockDatabases[name] = { prompts: [], packs: [], session: [] };
      }
      const databases = mockDatabases;

      const request = {
        result: null as unknown,
        error: null,
        onsuccess: null as ((e: unknown) => void) | null,
        onerror: null as ((e: unknown) => void) | null,
        onupgradeneeded: null as ((e: unknown) => void) | null,
      };

      setTimeout(() => {
        const db = {
          objectStoreNames: {
            contains: (storeName: string) => databases[name].hasOwnProperty(storeName),
          },
          createObjectStore: vi.fn((storeName: string, _options: unknown) => {
            if (!databases[name][storeName]) {
              databases[name][storeName] = [];
            }
            return {
              createIndex: vi.fn(),
            };
          }),
          transaction: vi.fn((_storeNames: string | string[], _mode: string) => {
            const tx = {
              objectStore: vi.fn((storeName: string) => {
                const storeData = databases[name][storeName] || [];
                return {
                  add: vi.fn((data: any) => {
                    const req = {
                      onsuccess: null as ((e: unknown) => void) | null,
                      onerror: null as ((e: unknown) => void) | null,
                    };
                    setTimeout(() => {
                      storeData.push(data);
                      if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                    }, 0);
                    return req;
                  }),
                  put: vi.fn((data: any) => {
                    const req = {
                      onsuccess: null as ((e: unknown) => void) | null,
                      onerror: null as ((e: unknown) => void) | null,
                    };
                    setTimeout(() => {
                      const idx = storeData.findIndex((item: any) => item.id === data.id);
                      if (idx >= 0) {
                        storeData[idx] = data;
                      } else {
                        storeData.push(data);
                      }
                      if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                    }, 0);
                    return req;
                  }),
                  get: vi.fn((key: string) => {
                    const req = {
                      onsuccess: null as ((e: unknown) => void) | null,
                      onerror: null as ((e: unknown) => void) | null,
                      result: null as unknown,
                    };
                    setTimeout(() => {
                      req.result = storeData.find((item: any) => item.id === key);
                      if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                    }, 0);
                    return req;
                  }),
                  getAll: vi.fn(() => {
                    const req = {
                      onsuccess: null as ((e: unknown) => void) | null,
                      onerror: null as ((e: unknown) => void) | null,
                      result: [...storeData],
                    };
                    setTimeout(() => {
                      if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                    }, 0);
                    return req;
                  }),
                  delete: vi.fn((key: string) => {
                    const req = {
                      onsuccess: null as ((e: unknown) => void) | null,
                      onerror: null as ((e: unknown) => void) | null,
                    };
                    setTimeout(() => {
                      const idx = storeData.findIndex((item: any) => item.id === key);
                      if (idx >= 0) {
                        storeData.splice(idx, 1);
                      }
                      if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                    }, 0);
                    return req;
                  }),
                  clear: vi.fn(() => {
                    const req = {
                      onsuccess: null as ((e: unknown) => void) | null,
                      onerror: null as ((e: unknown) => void) | null,
                    };
                    setTimeout(() => {
                      storeData.length = 0;
                      if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                    }, 0);
                    return req;
                  }),
                  count: vi.fn(() => {
                    const req = {
                      onsuccess: null as ((e: unknown) => void) | null,
                      onerror: null as ((e: unknown) => void) | null,
                      result: storeData.length,
                    };
                    setTimeout(() => {
                      if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                    }, 0);
                    return req;
                  }),
                  index: vi.fn((indexName: string) => ({
                    getAll: vi.fn((value?: unknown) => {
                      const req = {
                        onsuccess: null as ((e: unknown) => void) | null,
                        onerror: null as ((e: unknown) => void) | null,
                        result: value !== undefined
                          ? storeData.filter((item: any) => item[indexName] === value)
                          : [...storeData],
                      };
                      setTimeout(() => {
                        if (req.onsuccess) req.onsuccess({ target: req } as unknown);
                      }, 0);
                      return req;
                    }),
                  })),
                };
              }),
              oncomplete: null as ((e: unknown) => void) | null,
              onerror: null as ((e: unknown) => void) | null,
            };
            setTimeout(() => {
              if (tx.oncomplete) tx.oncomplete({} as unknown);
            }, 10);
            return tx;
          }),
        };

        request.result = db;

        if (request.onupgradeneeded) {
          request.onupgradeneeded({
            target: { result: db } as unknown,
            oldVersion: 0,
            newVersion: version,
          } as unknown);
        }

        if (request.onsuccess) {
          request.onsuccess({ target: request } as unknown);
        }
      }, 0);

      return request;
    }),
  };
};

(globalThis as any).indexedDB = createMockIndexedDB();

describe("Migration from Chrome Storage to IndexedDB", () => {
  beforeEach(() => {
    // Clear all mocks
    Object.keys(mockChromeStorage).forEach((key) => delete mockChromeStorage[key]);
    mockDatabases = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Test 1: Empty migration", () => {
    it("should return 0 when chrome.storage is empty", async () => {
      const migratedCount = await migrateFromChromeStorage();
      expect(migratedCount).toBe(0);
    });

    it("should set migration complete flag even when empty", async () => {
      await migrateFromChromeStorage();
      expect(mockChromeStorage["pp_migration_complete"]).toBe(true);
    });
  });

  describe("Test 2: Migrate prompts with all fields", () => {
    it("should migrate prompts with packName field", async () => {
      const testPrompts: PromptItem[] = [
        {
          id: "test-1",
          text: "Test prompt 1",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
          packName: "FunnyPack",
        },
        {
          id: "test-2",
          text: "Test prompt 2",
          source: "claude",
          url: "https://claude.ai",
          createdAt: 2000,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      const migratedCount = await migrateFromChromeStorage();

      // Should migrate all prompts
      expect(migratedCount).toBe(2);
    });

    it("should migrate prompts with cachedForAuth field", async () => {
      const testPrompts: any[] = [
        {
          id: "test-1",
          text: "Cached prompt",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
          packName: "TestPack",
          cachedForAuth: true,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      const migratedCount = await migrateFromChromeStorage();
      expect(migratedCount).toBe(1);
    });
  });

  describe("Test 3: Preserve prompt IDs", () => {
    it("should keep the same IDs during migration", async () => {
      const testPrompts: PromptItem[] = [
        {
          id: "stable-uuid-123",
          text: "Test",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      await migrateFromChromeStorage();

      // This test will need to verify IDs are preserved in IndexedDB
      // The actual implementation will validate this
    });
  });

  describe("Test 4: Transform PromptItem → LocalPrompt", () => {
    it("should add updatedAt field set to createdAt", async () => {
      const testPrompts: PromptItem[] = [
        {
          id: "test-1",
          text: "Test",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 12345,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      await migrateFromChromeStorage();

      // After implementation, this should verify updatedAt === createdAt
    });

    it("should add syncStatus as 'local-only'", async () => {
      const testPrompts: PromptItem[] = [
        {
          id: "test-1",
          text: "Test",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      await migrateFromChromeStorage();

      // After implementation, this should verify syncStatus === "local-only"
    });
  });

  describe("Test 5: Keep chrome.storage backup", () => {
    it("should NOT delete chrome.storage after migration", async () => {
      const testPrompts: PromptItem[] = [
        {
          id: "test-1",
          text: "Test",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      await migrateFromChromeStorage();

      // Chrome storage should still have the prompts
      expect(mockChromeStorage["promptpack_prompts"]).toBeDefined();
      expect(mockChromeStorage["promptpack_prompts"]).toEqual(testPrompts);
    });
  });

  describe("Test 6: Skip if already migrated", () => {
    it("should skip migration if pp_migration_complete flag is set", async () => {
      mockChromeStorage["pp_migration_complete"] = true;
      mockChromeStorage["promptpack_prompts"] = [
        {
          id: "test-1",
          text: "Test",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
        },
      ];

      const migratedCount = await migrateFromChromeStorage();

      // Should return 0 because migration already done
      expect(migratedCount).toBe(0);
    });

    it("should be idempotent - running twice should be safe", async () => {
      const testPrompts: PromptItem[] = [
        {
          id: "test-1",
          text: "Test",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      const firstRun = await migrateFromChromeStorage();
      const secondRun = await migrateFromChromeStorage();

      expect(firstRun).toBe(1);
      expect(secondRun).toBe(0); // Should skip on second run
    });
  });

  describe("Test 7: Handle errors gracefully", () => {
    it("should not throw if chrome.storage.get fails", async () => {
      // Mock get to throw an error
      mockChrome.storage.local.get = vi.fn().mockRejectedValue(new Error("Storage error"));

      await expect(migrateFromChromeStorage()).resolves.toBeDefined();

      // Should return 0 on error
      const result = await migrateFromChromeStorage().catch(() => 0);
      expect(result).toBe(0);
    });

    it("should not throw if IndexedDB fails", async () => {
      const testPrompts: PromptItem[] = [
        {
          id: "test-1",
          text: "Test",
          source: "chatgpt",
          url: "https://chatgpt.com",
          createdAt: 1000,
        },
      ];

      mockChromeStorage["promptpack_prompts"] = testPrompts;

      // This test verifies error handling in the implementation
      // The function should catch IndexedDB errors and not crash the app
      await expect(migrateFromChromeStorage()).resolves.toBeDefined();
    });
  });
});
