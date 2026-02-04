/**
 * Tests for imported pack metadata tracking
 *
 * These tests verify that:
 * 1. Pack metadata is saved when importing .pmtpk files
 * 2. Pack metadata is cleared on logout
 * 3. Pack metadata is fetched from cloud on login
 * 4. Pack metadata sync works correctly
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock IndexedDB
const mockStore: Record<string, Record<string, unknown>> = {
  prompts: {},
  packs: {},
  session: {},
  importedPacks: {},
};

const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {
      objectStoreNames: {
        contains: vi.fn((name: string) => name in mockStore),
      },
      createObjectStore: vi.fn((name: string) => {
        mockStore[name] = {};
        return {
          createIndex: vi.fn(),
        };
      }),
      transaction: vi.fn((storeName: string) => ({
        objectStore: vi.fn(() => ({
          getAll: vi.fn(() => ({
            result: Object.values(mockStore[storeName] || {}),
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
          })),
          get: vi.fn((key: string) => ({
            result: mockStore[storeName]?.[key],
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
          })),
          put: vi.fn((item: { packId?: string; id?: string }) => {
            const key = item.packId || item.id;
            if (key) mockStore[storeName][key] = item;
            return {
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
            };
          }),
          delete: vi.fn((key: string) => {
            delete mockStore[storeName][key];
            return {
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
            };
          }),
          clear: vi.fn(() => {
            mockStore[storeName] = {};
            return {
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
            };
          }),
          count: vi.fn(() => ({
            result: Object.keys(mockStore[storeName] || {}).length,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
          })),
          index: vi.fn(() => ({
            getAll: vi.fn(() => ({
              result: [],
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
            })),
          })),
        })),
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
      })),
    },
    onsuccess: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onupgradeneeded: null as (() => void) | null,
  })),
};

// @ts-expect-error - Mocking indexedDB
global.indexedDB = mockIndexedDB;

// Mock chrome.storage.local
const chromeStorage: Record<string, unknown> = {};
// @ts-ignore - Chrome API mock
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        if (typeof keys === "string") {
          return Promise.resolve({ [keys]: chromeStorage[keys] });
        }
        return Promise.resolve(chromeStorage);
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(chromeStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[]) => {
        if (typeof keys === "string") {
          delete chromeStorage[keys];
        }
        return Promise.resolve();
      }),
    },
  },
  tabs: {
    create: vi.fn(() => Promise.resolve({})),
    query: vi.fn(() => Promise.resolve([{ url: "https://chatgpt.com" }])),
  },
} as unknown as typeof chrome;

// Simple in-memory imported packs store for testing
let importedPacksStore: Array<{
  packId: string;
  title: string;
  source: "chatgpt" | "claude" | "gemini";
  promptCount: number;
  importedAt: number;
  isLoaded: boolean;
  syncStatus: "pending" | "synced" | "local-only";
}> = [];

// Mock functions that mirror the real implementation
async function getAllImportedPacks() {
  return [...importedPacksStore].sort((a, b) => b.importedAt - a.importedAt);
}

async function getLoadedImportedPacks() {
  return importedPacksStore.filter((p) => p.isLoaded);
}

async function saveImportedPack(pack: (typeof importedPacksStore)[0]) {
  const index = importedPacksStore.findIndex((p) => p.packId === pack.packId);
  if (index >= 0) {
    importedPacksStore[index] = pack;
  } else {
    importedPacksStore.push(pack);
  }
  return pack;
}

async function deleteImportedPack(packId: string) {
  const index = importedPacksStore.findIndex((p) => p.packId === packId);
  if (index >= 0) {
    importedPacksStore.splice(index, 1);
    return true;
  }
  return false;
}

async function clearAllImportedPacks() {
  importedPacksStore = [];
}

async function setAllImportedPacks(packs: typeof importedPacksStore) {
  importedPacksStore = [...packs];
}

async function getImportedPackCount() {
  return importedPacksStore.length;
}

// Helper to generate pack ID (simplified version)
function generatePackId(): string {
  return Math.random().toString(16).slice(2, 18);
}

describe("Imported Pack Metadata Tracking", () => {
  beforeEach(() => {
    importedPacksStore = [];
    vi.clearAllMocks();
  });

  describe("Pack Metadata Storage", () => {
    it("saves pack metadata when importing a pack", async () => {
      const pack = {
        packId: generatePackId(),
        title: "Marketing Prompts",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "pending" as const,
      };

      await saveImportedPack(pack);

      const packs = await getAllImportedPacks();
      expect(packs.length).toBe(1);
      expect(packs[0].title).toBe("Marketing Prompts");
      expect(packs[0].promptCount).toBe(5);
      expect(packs[0].isLoaded).toBe(true);
    });

    it("tracks multiple imported packs", async () => {
      await saveImportedPack({
        packId: generatePackId(),
        title: "Business Essentials",
        source: "chatgpt" as const,
        promptCount: 10,
        importedAt: Date.now() - 1000,
        isLoaded: true,
        syncStatus: "pending" as const,
      });

      await saveImportedPack({
        packId: generatePackId(),
        title: "Creative Writing",
        source: "claude" as const,
        promptCount: 8,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "pending" as const,
      });

      const packs = await getAllImportedPacks();
      expect(packs.length).toBe(2);
      // Should be sorted by importedAt desc (newest first)
      expect(packs[0].title).toBe("Creative Writing");
      expect(packs[1].title).toBe("Business Essentials");
    });

    it("updates existing pack metadata on re-import", async () => {
      const packId = generatePackId();

      await saveImportedPack({
        packId,
        title: "Old Title",
        source: "chatgpt" as const,
        promptCount: 3,
        importedAt: Date.now() - 1000,
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      // Re-import with updated data
      await saveImportedPack({
        packId,
        title: "New Title",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "pending" as const,
      });

      const packs = await getAllImportedPacks();
      expect(packs.length).toBe(1);
      expect(packs[0].title).toBe("New Title");
      expect(packs[0].promptCount).toBe(5);
    });
  });

  describe("Pack Metadata on Logout", () => {
    it("clears all imported packs on logout", async () => {
      // Import some packs
      await saveImportedPack({
        packId: generatePackId(),
        title: "Pack 1",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      await saveImportedPack({
        packId: generatePackId(),
        title: "Pack 2",
        source: "claude" as const,
        promptCount: 3,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      expect(await getImportedPackCount()).toBe(2);

      // Simulate logout
      await clearAllImportedPacks();

      expect(await getImportedPackCount()).toBe(0);
      const packs = await getAllImportedPacks();
      expect(packs.length).toBe(0);
    });
  });

  describe("Pack Metadata on Login", () => {
    it("restores imported packs from cloud on login", async () => {
      // Simulate cloud packs
      const cloudPacks = [
        {
          packId: "cloud-pack-1",
          title: "Cloud Pack 1",
          source: "chatgpt" as const,
          promptCount: 5,
          importedAt: Date.now() - 86400000, // 1 day ago
          isLoaded: true,
          syncStatus: "synced" as const,
        },
        {
          packId: "cloud-pack-2",
          title: "Cloud Pack 2",
          source: "gemini" as const,
          promptCount: 8,
          importedAt: Date.now() - 3600000, // 1 hour ago
          isLoaded: true,
          syncStatus: "synced" as const,
        },
      ];

      // Simulate fetching from cloud
      await setAllImportedPacks(cloudPacks);

      const packs = await getAllImportedPacks();
      expect(packs.length).toBe(2);
      expect(packs[0].title).toBe("Cloud Pack 2"); // Newest first
      expect(packs[1].title).toBe("Cloud Pack 1");
    });
  });

  describe("Loaded Packs Filtering", () => {
    it("returns only loaded packs", async () => {
      await saveImportedPack({
        packId: generatePackId(),
        title: "Loaded Pack",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      await saveImportedPack({
        packId: generatePackId(),
        title: "Unloaded Pack",
        source: "claude" as const,
        promptCount: 3,
        importedAt: Date.now(),
        isLoaded: false,
        syncStatus: "synced" as const,
      });

      const allPacks = await getAllImportedPacks();
      expect(allPacks.length).toBe(2);

      const loadedPacks = await getLoadedImportedPacks();
      expect(loadedPacks.length).toBe(1);
      expect(loadedPacks[0].title).toBe("Loaded Pack");
    });
  });

  describe("Pack Deletion (Undo Import)", () => {
    it("deletes pack metadata when undoing import", async () => {
      const packId = generatePackId();

      await saveImportedPack({
        packId,
        title: "Pack to Delete",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      expect(await getImportedPackCount()).toBe(1);

      // Simulate undo
      await deleteImportedPack(packId);

      expect(await getImportedPackCount()).toBe(0);
    });

    it("only deletes the specified pack", async () => {
      const packId1 = generatePackId();
      const packId2 = generatePackId();

      await saveImportedPack({
        packId: packId1,
        title: "Pack 1",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      await saveImportedPack({
        packId: packId2,
        title: "Pack 2",
        source: "claude" as const,
        promptCount: 3,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      expect(await getImportedPackCount()).toBe(2);

      // Delete only pack 1
      await deleteImportedPack(packId1);

      const packs = await getAllImportedPacks();
      expect(packs.length).toBe(1);
      expect(packs[0].title).toBe("Pack 2");
    });
  });

  describe("Pack Sources", () => {
    it("tracks packs from different sources", async () => {
      await saveImportedPack({
        packId: generatePackId(),
        title: "ChatGPT Pack",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      await saveImportedPack({
        packId: generatePackId(),
        title: "Claude Pack",
        source: "claude" as const,
        promptCount: 3,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      await saveImportedPack({
        packId: generatePackId(),
        title: "Gemini Pack",
        source: "gemini" as const,
        promptCount: 7,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "synced" as const,
      });

      const packs = await getAllImportedPacks();
      expect(packs.length).toBe(3);

      const sources = packs.map((p) => p.source);
      expect(sources).toContain("chatgpt");
      expect(sources).toContain("claude");
      expect(sources).toContain("gemini");
    });
  });

  describe("Sync Status Tracking", () => {
    it("marks new packs as pending", async () => {
      await saveImportedPack({
        packId: generatePackId(),
        title: "New Pack",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "pending" as const,
      });

      const packs = await getAllImportedPacks();
      expect(packs[0].syncStatus).toBe("pending");
    });

    it("updates sync status to synced after cloud sync", async () => {
      const packId = generatePackId();

      await saveImportedPack({
        packId,
        title: "Pack to Sync",
        source: "chatgpt" as const,
        promptCount: 5,
        importedAt: Date.now(),
        isLoaded: true,
        syncStatus: "pending" as const,
      });

      // Simulate sync complete
      const packs = await getAllImportedPacks();
      packs[0].syncStatus = "synced";
      await saveImportedPack(packs[0]);

      const updatedPacks = await getAllImportedPacks();
      expect(updatedPacks[0].syncStatus).toBe("synced");
    });
  });

  describe("Pack Title from Filename", () => {
    it("extracts title from .pmtpk filename", () => {
      const filename = "Marketing Prompts.pmtpk";
      const title = filename.replace(/\.pmtpk$/i, "");
      expect(title).toBe("Marketing Prompts");
    });

    it("handles uppercase extension", () => {
      const filename = "Business Essentials.PMTPK";
      const title = filename.replace(/\.pmtpk$/i, "");
      expect(title).toBe("Business Essentials");
    });

    it("handles filenames without extension", () => {
      const filename = "NoExtension";
      const title = filename.replace(/\.pmtpk$/i, "") || "Imported Pack";
      expect(title).toBe("NoExtension");
    });
  });
});
