import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listPrompts,
  savePrompt,
  deletePrompt,
  deletePromptsBySource,
  clearAllPrompts,
  MAX_PROMPTS,
  type PromptItem,
} from "../shared/promptStore";

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {};

const mockChrome = {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
      set: vi.fn(async (data: Record<string, unknown>) => {
        Object.assign(mockStorage, data);
      }),
    },
  },
};

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => `uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
});

vi.stubGlobal("chrome", mockChrome);

describe("promptStore", () => {
  beforeEach(() => {
    // Clear storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  describe("listPrompts", () => {
    it("returns empty array when no prompts exist", async () => {
      const result = await listPrompts();
      expect(result).toEqual([]);
    });

    it("returns prompts sorted by createdAt descending (newest first)", async () => {
      const prompts: PromptItem[] = [
        { id: "1", text: "old", source: "chatgpt", url: "http://a.com", createdAt: 1000 },
        { id: "2", text: "new", source: "claude", url: "http://b.com", createdAt: 2000 },
      ];
      mockStorage["promptpack_prompts"] = prompts;

      const result = await listPrompts();
      expect(result[0].text).toBe("new");
      expect(result[1].text).toBe("old");
    });
  });

  describe("savePrompt", () => {
    it("saves a new prompt successfully", async () => {
      const result = await savePrompt({
        text: "Hello world",
        source: "chatgpt",
        url: "https://chatgpt.com",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.count).toBe(1);
        expect(result.max).toBe(MAX_PROMPTS);
      }

      const prompts = await listPrompts();
      expect(prompts.length).toBe(1);
      expect(prompts[0].text).toBe("Hello world");
      expect(prompts[0].source).toBe("chatgpt");
    });

    it("rejects empty text", async () => {
      const result = await savePrompt({
        text: "   ",
        source: "chatgpt",
        url: "https://chatgpt.com",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("empty");
      }
    });

    it("deduplicates prompts with same text and source", async () => {
      await savePrompt({ text: "Hello", source: "chatgpt", url: "http://a.com" });
      await savePrompt({ text: "Hello", source: "chatgpt", url: "http://b.com" });

      const prompts = await listPrompts();
      expect(prompts.length).toBe(1);
      // Should have the newer URL
      expect(prompts[0].url).toBe("http://b.com");
    });

    it("allows same text from different sources", async () => {
      await savePrompt({ text: "Hello", source: "chatgpt", url: "http://a.com" });
      await savePrompt({ text: "Hello", source: "claude", url: "http://b.com" });

      const prompts = await listPrompts();
      expect(prompts.length).toBe(2);
    });

    it("enforces max prompt limit", async () => {
      // Fill up to max
      for (let i = 0; i < MAX_PROMPTS; i++) {
        await savePrompt({
          text: `Prompt ${i}`,
          source: "chatgpt",
          url: "https://chatgpt.com",
        });
      }

      // Try to add one more
      const result = await savePrompt({
        text: "One more",
        source: "chatgpt",
        url: "https://chatgpt.com",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("limit");
        expect(result.max).toBe(MAX_PROMPTS);
      }
    });

    it("trims whitespace from text", async () => {
      await savePrompt({
        text: "  Hello world  ",
        source: "chatgpt",
        url: "https://chatgpt.com",
      });

      const prompts = await listPrompts();
      expect(prompts[0].text).toBe("Hello world");
    });
  });

  describe("deletePrompt", () => {
    it("deletes a prompt by id", async () => {
      await savePrompt({ text: "First", source: "chatgpt", url: "http://a.com" });
      await savePrompt({ text: "Second", source: "chatgpt", url: "http://b.com" });

      const prompts = await listPrompts();
      const idToDelete = prompts[0].id;

      await deletePrompt(idToDelete);

      const remaining = await listPrompts();
      expect(remaining.length).toBe(1);
      expect(remaining[0].text).toBe("First");
    });

    it("does nothing if id not found", async () => {
      await savePrompt({ text: "Test", source: "chatgpt", url: "http://a.com" });

      const result = await deletePrompt("nonexistent-id");
      expect(result.ok).toBe(true);

      const prompts = await listPrompts();
      expect(prompts.length).toBe(1);
    });
  });

  describe("deletePromptsBySource", () => {
    it("deletes all prompts from a specific source", async () => {
      await savePrompt({ text: "ChatGPT 1", source: "chatgpt", url: "http://a.com" });
      await savePrompt({ text: "Claude 1", source: "claude", url: "http://b.com" });
      await savePrompt({ text: "ChatGPT 2", source: "chatgpt", url: "http://c.com" });

      await deletePromptsBySource("chatgpt");

      const prompts = await listPrompts();
      expect(prompts.length).toBe(1);
      expect(prompts[0].source).toBe("claude");
    });

    it("does nothing if source has no prompts", async () => {
      await savePrompt({ text: "Test", source: "chatgpt", url: "http://a.com" });

      const result = await deletePromptsBySource("gemini");
      expect(result.ok).toBe(true);

      const prompts = await listPrompts();
      expect(prompts.length).toBe(1);
    });
  });

  describe("clearAllPrompts", () => {
    it("removes all prompts", async () => {
      await savePrompt({ text: "One", source: "chatgpt", url: "http://a.com" });
      await savePrompt({ text: "Two", source: "claude", url: "http://b.com" });

      const result = await clearAllPrompts();
      expect(result.ok).toBe(true);
      expect(result.count).toBe(0);

      const prompts = await listPrompts();
      expect(prompts.length).toBe(0);
    });
  });
});
