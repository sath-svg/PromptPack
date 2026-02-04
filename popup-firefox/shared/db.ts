// IndexedDB wrapper for PromptPack local storage
// Stores prompts and packs locally with sync status tracking

import { DB_NAME, DB_VERSION, PROMPTS_STORAGE_KEY } from "./config";

export type PromptSource = "chatgpt" | "claude" | "gemini";

export type LocalPrompt = {
  id: string;
  text: string;
  source: PromptSource;
  url: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: "pending" | "synced" | "local-only";
  cloudId?: string; // ID on the server if synced
};

export type PackMeta = {
  id: string;
  title: string;
  author: string;
  description?: string;
  category?: string;
  promptCount: number;
  version: string;
};

export type LocalPack = {
  id: string;
  meta: PackMeta;
  prompts: string; // base64 encoded gzipped prompts
  isLoaded: boolean;
  isPurchased: boolean;
  syncStatus: "pending" | "synced" | "local-only";
  loadedAt?: number;
  purchasedAt?: number;
};

export type UserSession = {
  id: "current";
  userId: string;
  email: string;
  tier: "free" | "paid";
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  entitlements: {
    promptLimit: number;
    loadedPackLimit: number;
  };
};

let dbInstance: IDBDatabase | null = null;

export function resetDBInstance(): void {
  dbInstance = null;
}

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Prompts store
      if (!db.objectStoreNames.contains("prompts")) {
        const promptStore = db.createObjectStore("prompts", { keyPath: "id" });
        promptStore.createIndex("source", "source", { unique: false });
        promptStore.createIndex("syncStatus", "syncStatus", { unique: false });
        promptStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Packs store
      if (!db.objectStoreNames.contains("packs")) {
        const packStore = db.createObjectStore("packs", { keyPath: "id" });
        packStore.createIndex("isLoaded", "isLoaded", { unique: false });
        packStore.createIndex("isPurchased", "isPurchased", { unique: false });
      }

      // Session store (single row)
      if (!db.objectStoreNames.contains("session")) {
        db.createObjectStore("session", { keyPath: "id" });
      }
    };
  });
}

// ============ Prompts ============

export async function getAllPrompts(): Promise<LocalPrompt[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readonly");
    const store = tx.objectStore("prompts");
    const request = store.getAll();
    request.onsuccess = () => {
      const prompts = request.result as LocalPrompt[];
      // Sort by createdAt desc
      prompts.sort((a, b) => b.createdAt - a.createdAt);
      resolve(prompts);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPromptsBySource(source: PromptSource): Promise<LocalPrompt[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readonly");
    const store = tx.objectStore("prompts");
    const index = store.index("source");
    const request = index.getAll(source);
    request.onsuccess = () => {
      const prompts = request.result as LocalPrompt[];
      prompts.sort((a, b) => b.createdAt - a.createdAt);
      resolve(prompts);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPrompt(id: string): Promise<LocalPrompt | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readonly");
    const store = tx.objectStore("prompts");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePrompt(prompt: Omit<LocalPrompt, "id" | "createdAt" | "updatedAt" | "syncStatus">): Promise<LocalPrompt> {
  const db = await openDB();
  const now = Date.now();
  const newPrompt: LocalPrompt = {
    ...prompt,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readwrite");
    const store = tx.objectStore("prompts");
    const request = store.add(newPrompt);
    request.onsuccess = () => resolve(newPrompt);
    request.onerror = () => reject(request.error);
  });
}

export async function updatePrompt(id: string, updates: Partial<LocalPrompt>): Promise<LocalPrompt | undefined> {
  const db = await openDB();
  const existing = await getPrompt(id);
  if (!existing) return undefined;

  const updated: LocalPrompt = {
    ...existing,
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readwrite");
    const store = tx.objectStore("prompts");
    const request = store.put(updated);
    request.onsuccess = () => resolve(updated);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePrompt(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readwrite");
    const store = tx.objectStore("prompts");
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePromptsBySource(source: PromptSource): Promise<number> {
  const prompts = await getPromptsBySource(source);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readwrite");
    const store = tx.objectStore("prompts");
    let deleted = 0;

    for (const p of prompts) {
      const request = store.delete(p.id);
      request.onsuccess = () => deleted++;
    }

    tx.oncomplete = () => resolve(deleted);
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllPrompts(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readwrite");
    const store = tx.objectStore("prompts");
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPromptCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readonly");
    const store = tx.objectStore("prompts");
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSyncPrompts(): Promise<LocalPrompt[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readonly");
    const store = tx.objectStore("prompts");
    const index = store.index("syncStatus");
    const request = index.getAll("pending");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ Packs ============

export async function getAllPacks(): Promise<LocalPack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readonly");
    const store = tx.objectStore("packs");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getLoadedPacks(): Promise<LocalPack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readonly");
    const store = tx.objectStore("packs");
    const index = store.index("isLoaded");
    const request = index.getAll(1); // IndexedDB stores booleans as 0/1
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPurchasedPacks(): Promise<LocalPack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readonly");
    const store = tx.objectStore("packs");
    const index = store.index("isPurchased");
    const request = index.getAll(1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPack(id: string): Promise<LocalPack | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readonly");
    const store = tx.objectStore("packs");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePack(pack: LocalPack): Promise<LocalPack> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readwrite");
    const store = tx.objectStore("packs");
    const request = store.put(pack);
    request.onsuccess = () => resolve(pack);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePack(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readwrite");
    const store = tx.objectStore("packs");
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getLoadedPackCount(): Promise<number> {
  const packs = await getLoadedPacks();
  return packs.length;
}

// ============ Session ============

export async function getSession(): Promise<UserSession | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("session", "readonly");
    const store = tx.objectStore("session");
    const request = store.get("current");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSession(session: Omit<UserSession, "id">): Promise<UserSession> {
  const db = await openDB();
  const fullSession: UserSession = { ...session, id: "current" };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("session", "readwrite");
    const store = tx.objectStore("session");
    const request = store.put(fullSession);
    request.onsuccess = () => resolve(fullSession);
    request.onerror = () => reject(request.error);
  });
}

export async function clearSession(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("session", "readwrite");
    const store = tx.objectStore("session");
    const request = store.delete("current");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return session.expiresAt > Date.now();
}

// ============ Migrations from chrome.storage ============

export async function migrateFromChromeStorage(): Promise<number> {
  const res = await chrome.storage.local.get(PROMPTS_STORAGE_KEY);
  const oldPrompts = res[PROMPTS_STORAGE_KEY] as Array<{
    id: string;
    text: string;
    source: PromptSource;
    url: string;
    createdAt: number;
  }> | undefined;

  if (!oldPrompts || oldPrompts.length === 0) return 0;

  const db = await openDB();
  let migrated = 0;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("prompts", "readwrite");
    const store = tx.objectStore("prompts");

    for (const old of oldPrompts) {
      const newPrompt: LocalPrompt = {
        id: old.id,
        text: old.text,
        source: old.source,
        url: old.url,
        createdAt: old.createdAt,
        updatedAt: old.createdAt,
        syncStatus: "local-only",
      };
      const request = store.put(newPrompt);
      request.onsuccess = () => migrated++;
    }

    tx.oncomplete = async () => {
      // Clear old storage after migration
      await chrome.storage.local.remove(PROMPTS_STORAGE_KEY);
      resolve(migrated);
    };
    tx.onerror = () => reject(tx.error);
  });
}
