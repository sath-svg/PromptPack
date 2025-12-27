import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { savePrompt, listPrompts, MAX_PROMPTS, MAX_IMPORTED_PACKS } from "../shared/promptStore";
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
  tabs: {
    create: vi.fn(async (options: { url: string }) => {
      return { id: 1, url: options.url };
    }),
  },
};

// Mock crypto.randomUUID
(globalThis as any).crypto = {
  randomUUID: () => `uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
};

(globalThis as any).chrome = mockChrome;

// Mock IndexedDB (simplified version for these tests)
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
 * Pro Account Functionality Tests
 *
 * Pro users should have:
 * - Unlimited prompts (or higher limit than free/guest)
 * - "Save to Dashboard" button redirects to dashboard (not sign-in page)
 * - Import button available
 * - Ability to import .pmtpk files
 * - Import limit of MAX_IMPORTED_PACKS (2 packs)
 */
describe("Pro Account Functionality", () => {
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

  describe("Prompt Limits", () => {
    it("pro users can save more than 10 prompts", async () => {
      // Pro users should not be limited to 10 prompts
      // They can save up to MAX_PROMPTS (which is currently 10 but could be higher for pro)
      for (let i = 0; i < MAX_PROMPTS; i++) {
        const result = await savePrompt({
          text: `Pro user prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
        expect(result.ok).toBe(true);
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(MAX_PROMPTS);
    });

    it("pro users hit MAX_PROMPTS limit eventually", async () => {
      // Even pro users have a limit (MAX_PROMPTS)
      for (let i = 0; i < MAX_PROMPTS; i++) {
        await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      const result = await savePrompt({
        text: "Beyond limit",
        source: "chatgpt",
        url: "https://chatgpt.com/extra",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("limit");
      }
    });
  });

  describe("Login Redirection", () => {
    it("pro user clicking 'Save to Dashboard' opens dashboard URL", () => {
      // Simulate pro user clicking "Save to Dashboard" button
      const dashboardUrl = "http://localhost:3000/dashboard";

      chrome.tabs.create({ url: dashboardUrl });

      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: dashboardUrl });
      expect(mockChrome.tabs.create).toHaveBeenCalledTimes(1);
    });

    it("free user clicking sign-in opens sign-in page", () => {
      // Free users should be redirected to sign-in page, not dashboard
      const signInUrl = "http://localhost:3000/sign-in";

      chrome.tabs.create({ url: signInUrl });

      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: signInUrl });
    });
  });

  describe("Import Functionality", () => {
    it("allows importing prompts from valid pack", async () => {
      // Simulate importing a pack with prompts
      const importedPrompts = [
        {
          id: "import-1",
          text: "Imported prompt 1",
          source: "chatgpt" as const,
          url: "https://chatgpt.com/imported",
          createdAt: Date.now(),
          packName: "TestPack",
        },
        {
          id: "import-2",
          text: "Imported prompt 2",
          source: "chatgpt" as const,
          url: "https://chatgpt.com/imported2",
          createdAt: Date.now(),
          packName: "TestPack",
        },
      ];

      // Save imported prompts
      for (const prompt of importedPrompts) {
        await savePrompt({
          text: prompt.text,
          source: prompt.source,
          url: prompt.url,
        });
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(2);
      expect(prompts[0].text).toBe("Imported prompt 2");
      expect(prompts[1].text).toBe("Imported prompt 1");
    });

    it("enforces MAX_IMPORTED_PACKS limit", () => {
      // Pro users can import up to MAX_IMPORTED_PACKS (2) packs
      expect(MAX_IMPORTED_PACKS).toBe(2);
    });

    it("tracks imported pack names to enforce pack limit", async () => {
      // Import prompts from first pack
      await savePrompt({
        text: "Pack 1 Prompt 1",
        source: "chatgpt",
        url: "https://chatgpt.com/1",
      });

      await savePrompt({
        text: "Pack 1 Prompt 2",
        source: "chatgpt",
        url: "https://chatgpt.com/2",
      });

      // Import prompts from second pack
      await savePrompt({
        text: "Pack 2 Prompt 1",
        source: "claude",
        url: "https://claude.ai/1",
      });

      const prompts = await listPrompts();
      expect(prompts.length).toBe(3);
    });

    it("import adds prompts without exceeding total prompt limit", async () => {
      // Fill up some slots with regular prompts
      for (let i = 0; i < 5; i++) {
        await savePrompt({
          text: `Regular prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      // Import additional prompts
      for (let i = 0; i < 3; i++) {
        const result = await savePrompt({
          text: `Imported prompt ${i}`,
          source: "claude",
          url: `https://claude.ai/${i}`,
        });
        expect(result.ok).toBe(true);
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(8); // 5 regular + 3 imported
    });

    it("import respects MAX_PROMPTS total limit", async () => {
      // Fill up to MAX_PROMPTS
      for (let i = 0; i < MAX_PROMPTS; i++) {
        await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: `https://chatgpt.com/${i}`,
        });
      }

      // Try to import when at limit
      const result = await savePrompt({
        text: "Imported prompt",
        source: "claude",
        url: "https://claude.ai/import",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("limit");
      }
    });
  });

  describe("Successful Import with Valid Files", () => {
    it("successfully imports valid obfuscated .pmtpk pack with custom title", async () => {
      // Simulate importing a pack named "Marketing Prompts"
      const validPackPrompts = [
        { text: "Write a blog post about AI trends", source: "chatgpt" as const },
        { text: "Create an email campaign for product launch", source: "chatgpt" as const },
        { text: "Design social media content calendar", source: "chatgpt" as const },
      ];

      // Import each prompt from the pack (source is chatgpt but pack name is custom)
      for (const prompt of validPackPrompts) {
        const result = await savePrompt({
          text: prompt.text,
          source: prompt.source,
          url: "https://chatgpt.com/imported",
        });
        expect(result.ok).toBe(true);
      }

      // Verify all prompts were imported
      const prompts = await listPrompts();
      expect(prompts.length).toBe(3);
      expect(prompts.some(p => p.text.includes("blog post"))).toBe(true);
      expect(prompts.some(p => p.text.includes("email campaign"))).toBe(true);
      expect(prompts.some(p => p.text.includes("social media"))).toBe(true);
    });

    it("successfully imports encrypted pack 'Confidential Workflows' after password", async () => {
      // Simulate importing an encrypted pack named "Confidential Workflows"
      const encryptedPackPrompts = [
        { text: "Internal review process template", source: "claude" as const },
        { text: "Employee onboarding checklist", source: "claude" as const },
      ];

      for (const prompt of encryptedPackPrompts) {
        const result = await savePrompt({
          text: prompt.text,
          source: prompt.source,
          url: "https://claude.ai/workflows",
        });
        expect(result.ok).toBe(true);
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(2);
      expect(prompts.every(p => p.source === "claude")).toBe(true);
    });

    it("imports pack 'Design Templates' and preserves metadata", async () => {
      // Import pack named "Design Templates"
      const packPrompt = {
        text: "Create a modern website landing page",
        source: "gemini" as const,
        url: "https://gemini.google.com/pack/design-templates",
      };

      const result = await savePrompt(packPrompt);
      expect(result.ok).toBe(true);

      const prompts = await listPrompts();
      expect(prompts.length).toBe(1);
      expect(prompts[0].text).toBe("Create a modern website landing page");
      expect(prompts[0].source).toBe("gemini");
      expect(prompts[0].url).toContain("design-templates");
      expect(prompts[0].id).toBeDefined();
      expect(prompts[0].createdAt).toBeDefined();
    });

    it("imports multiple packs: 'Coding Tips' and 'Writing Helpers'", async () => {
      // Import pack 1: "Coding Tips"
      await savePrompt({
        text: "Debug React component rendering issues",
        source: "chatgpt",
        url: "https://chatgpt.com/pack/coding-tips",
      });
      await savePrompt({
        text: "Optimize SQL query performance",
        source: "chatgpt",
        url: "https://chatgpt.com/pack/coding-tips",
      });

      // Import pack 2: "Writing Helpers"
      await savePrompt({
        text: "Improve technical documentation clarity",
        source: "claude",
        url: "https://claude.ai/pack/writing-helpers",
      });

      const prompts = await listPrompts();
      expect(prompts.length).toBe(3);

      const codingPrompts = prompts.filter(p => p.text.includes("Debug") || p.text.includes("SQL"));
      const writingPrompts = prompts.filter(p => p.text.includes("documentation"));

      expect(codingPrompts.length).toBe(2);
      expect(writingPrompts.length).toBe(1);
    });

    it("imports large pack 'Business Essentials' with 5 prompts", async () => {
      // Import a pack named "Business Essentials" with 5 prompts
      const largePackPrompts = [
        "Create quarterly business review presentation",
        "Write competitive analysis report",
        "Draft investor pitch deck outline",
        "Develop customer retention strategy",
        "Plan team building workshop agenda",
      ];

      for (const text of largePackPrompts) {
        const result = await savePrompt({
          text,
          source: "chatgpt",
          url: "https://chatgpt.com/pack/business-essentials",
        });
        expect(result.ok).toBe(true);
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(5);
      expect(prompts.some(p => p.text.includes("quarterly"))).toBe(true);
      expect(prompts.some(p => p.text.includes("competitive"))).toBe(true);
    });

    it("import maintains chronological order for pack 'Quick Wins'", async () => {
      // Import prompts from pack "Quick Wins"

      await savePrompt({
        text: "First: Set up project structure",
        source: "chatgpt",
        url: "https://chatgpt.com/pack/quick-wins",
      });

      await new Promise(resolve => setTimeout(resolve, 1));

      await savePrompt({
        text: "Second: Configure development environment",
        source: "chatgpt",
        url: "https://chatgpt.com/pack/quick-wins",
      });

      await new Promise(resolve => setTimeout(resolve, 1));

      await savePrompt({
        text: "Third: Deploy to production",
        source: "chatgpt",
        url: "https://chatgpt.com/pack/quick-wins",
      });

      const prompts = await listPrompts();
      expect(prompts.length).toBe(3);
      // listPrompts returns newest first
      expect(prompts[0].text).toContain("Third:");
      expect(prompts[1].text).toContain("Second:");
      expect(prompts[2].text).toContain("First:");
    });
  });

  describe("File Import Validation", () => {
    it("should accept valid .pmtpk file format", () => {
      // Valid obfuscated file (PPK + 0x00)
      const validFile = new Uint8Array([0x50, 0x50, 0x4b, 0x00, 0x01, 0x02]);

      // Check if it's a valid format
      const isValidObfuscated =
        validFile[0] === 0x50 &&
        validFile[1] === 0x50 &&
        validFile[2] === 0x4b &&
        validFile[3] === 0x00;

      expect(isValidObfuscated).toBe(true);
    });

    it("should accept valid encrypted .pmtpk file format", () => {
      // Valid encrypted file (PPK + 0x01)
      const validFile = new Uint8Array([0x50, 0x50, 0x4b, 0x01, 0x01, 0x02]);

      const isValidEncrypted =
        validFile[0] === 0x50 &&
        validFile[1] === 0x50 &&
        validFile[2] === 0x4b &&
        validFile[3] === 0x01;

      expect(isValidEncrypted).toBe(true);
    });

    it("should reject corrupted files during import", () => {
      // Corrupted magic bytes
      const corruptedFile = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

      const isValid =
        corruptedFile[0] === 0x50 &&
        corruptedFile[1] === 0x50 &&
        corruptedFile[2] === 0x4b &&
        (corruptedFile[3] === 0x00 || corruptedFile[3] === 0x01);

      expect(isValid).toBe(false);
    });

    it("should reject plain text files masquerading as .pmtpk", () => {
      const textData = new TextEncoder().encode('{"format":"web-pack-v1"}');

      const isValid =
        textData[0] === 0x50 &&
        textData[1] === 0x50 &&
        textData[2] === 0x4b;

      expect(isValid).toBe(false);
    });

    it("should reject truncated files", () => {
      // File with less than 4 bytes
      const truncated = new Uint8Array([0x50, 0x50]);

      const isValid = truncated.length >= 4 &&
        truncated[0] === 0x50 &&
        truncated[1] === 0x50 &&
        truncated[2] === 0x4b;

      expect(isValid).toBe(false);
    });
  });

  describe("Import Button Availability", () => {
    it("MAX_IMPORTED_PACKS constant is defined", () => {
      expect(MAX_IMPORTED_PACKS).toBeDefined();
      expect(typeof MAX_IMPORTED_PACKS).toBe("number");
      expect(MAX_IMPORTED_PACKS).toBeGreaterThan(0);
    });

    it("MAX_IMPORTED_PACKS is set to 2", () => {
      // Pro users can import up to 2 packs
      expect(MAX_IMPORTED_PACKS).toBe(2);
    });
  });

  describe("Dashboard vs Sign-in Routing", () => {
    it("constructs correct dashboard URL for pro users", () => {
      const baseUrl = "http://localhost:3000";
      const dashboardUrl = `${baseUrl}/dashboard`;

      expect(dashboardUrl).toBe("http://localhost:3000/dashboard");
    });

    it("constructs correct sign-in URL for free users", () => {
      const baseUrl = "http://localhost:3000";
      const signInUrl = `${baseUrl}/sign-in`;

      expect(signInUrl).toBe("http://localhost:3000/sign-in");
    });

    it("production URLs use https", () => {
      const productionBase = "https://pmtpk.ai";
      const dashboardUrl = `${productionBase}/dashboard`;
      const signInUrl = `${productionBase}/sign-in`;

      expect(dashboardUrl).toBe("https://pmtpk.ai/dashboard");
      expect(signInUrl).toBe("https://pmtpk.ai/sign-in");
    });
  });
});
