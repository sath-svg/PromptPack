import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PromptSource, UserTier } from '../types';
import { CONVEX_URL, WORKERS_API_URL, getPromptLimit } from '../lib/constants';
import { useAuthStore } from './authStore';

// Cloud saved pack from Convex (extension-saved prompts)
export interface CloudPack {
  id: string;
  source: PromptSource;
  r2Key: string;
  promptCount: number;
  fileSize: number;
  headers?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

// User-created pack from website dashboard
export interface UserPack {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string; // Emoji icon for the pack
  r2Key: string;
  promptCount: number;
  fileSize: number;
  version: string;
  isPublic: boolean;
  isEncrypted?: boolean;
  headers?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

// Decoded prompt from .pmtpk file
export interface CloudPrompt {
  text: string;
  url?: string;
  createdAt: number;
  header?: string;
}

// Pack with loaded prompts (for savedPacks)
export interface LoadedPack extends CloudPack {
  prompts: CloudPrompt[];
  isEncrypted: boolean;
  password?: string; // Cached for re-fetching
}

// Loaded user pack with prompts
export interface LoadedUserPack extends UserPack {
  prompts: CloudPrompt[];
  password?: string; // Cached for re-fetching
}

interface SyncState {
  // Cloud packs metadata (saved from extension)
  cloudPacks: CloudPack[];

  // User-created packs from website dashboard
  userPacks: UserPack[];

  // Loaded pack data (after fetching from R2)
  loadedPacks: Record<string, LoadedPack>;
  loadedUserPacks: Record<string, LoadedUserPack>;

  // UI State
  selectedPackId: string | null; // For auto-expanding a pack when navigating from sidebar

  // State
  isLoading: boolean;
  isFetching: Record<string, boolean>;
  isSaving: Record<string, boolean>;
  generatingHeaders: Record<string, Set<number>>;
  lastSyncAt: number | null;
  error: string | null;

  // Actions
  fetchCloudPacks: (clerkId: string) => Promise<void>;
  fetchUserPacks: (clerkId: string) => Promise<void>;
  fetchAllPacks: (clerkId: string) => Promise<void>;
  fetchPackPrompts: (pack: CloudPack, password?: string) => Promise<LoadedPack | null>;
  fetchUserPackPrompts: (pack: UserPack, password?: string) => Promise<LoadedUserPack | null>;

  // Edit actions for userPacks
  updateUserPackPrompt: (packId: string, promptIndex: number, text: string) => Promise<boolean>;
  updateUserPackHeader: (packId: string, promptIndex: number, header: string) => Promise<boolean>;
  generateUserPackHeader: (packId: string, promptIndex: number, promptText: string) => Promise<string | null>;
  generateMissingUserPackHeaders: (packId: string) => Promise<void>;
  addUserPackPrompt: (packId: string, text: string, header?: string) => Promise<boolean>;
  updateUserPackIcon: (packId: string, icon: string) => Promise<boolean>;
  deleteUserPackPrompt: (packId: string, promptIndex: number) => Promise<boolean>;
  deleteUserPack: (packId: string) => Promise<boolean>;

  // Edit actions for savedPacks (cloud prompts)
  updateSavedPackPrompt: (packId: string, promptIndex: number, text: string) => Promise<boolean>;
  updateSavedPackHeader: (packId: string, promptIndex: number, header: string) => Promise<boolean>;
  generateSavedPackHeader: (packId: string, promptIndex: number, promptText: string) => Promise<string | null>;
  generateMissingSavedPackHeaders: (packId: string) => Promise<void>;
  addSavedPackPrompt: (packId: string, text: string, header?: string) => Promise<boolean>;
  deleteSavedPackPrompt: (packId: string, promptIndex: number) => Promise<boolean>;
  deleteSavedPack: (packId: string) => Promise<boolean>;

  // Create new pack
  createUserPack: (clerkId: string, title: string, prompts: CloudPrompt[]) => Promise<UserPack | null>;

  // Create new savedPack (for a specific source)
  createSavedPack: (clerkId: string, source: string, prompts: CloudPrompt[]) => Promise<CloudPack | null>;

  // Sync local prompts to cloud savedPacks
  syncLocalPromptsToCloud: (clerkId: string, prompts: { text: string; header?: string; source: string; createdAt: number }[]) => Promise<{ synced: string[]; failed: string[] }>;

  // UI actions
  setSelectedPackId: (packId: string | null) => void;

  clearError: () => void;
  clearCache: () => void;
}

// XOR key for obfuscation (matches web/extension)
const OBFUSCATE_KEY = new Uint8Array([0x50, 0x72, 0x6F, 0x6D, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6B]); // "PromptPack"
const HEADER_SIZE = 37; // magic (4) + version (1) + hash (32)
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

// Check if data is encrypted (starts with PPK\1)
function isEncrypted(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  return data[0] === 0x50 && data[1] === 0x50 && data[2] === 0x4B && data[3] === 0x01;
}

// XOR de-obfuscate
function xorDeobfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

// Gzip decompress using native APIs
async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
  // Create a copy to ensure we have a regular ArrayBuffer (not SharedArrayBuffer)
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const stream = new Blob([buffer]).stream();
  const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
  const reader = decompressed.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// Derive AES key from password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

// Decode obfuscated .pmtpk file
async function decodeObfuscated(bytes: Uint8Array): Promise<CloudPrompt[]> {
  if (bytes.length < HEADER_SIZE) {
    throw new Error('File is too small or corrupted');
  }

  const obfuscated = bytes.slice(HEADER_SIZE);
  const compressed = xorDeobfuscate(obfuscated);
  const jsonBytes = await gzipDecompress(compressed);

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(jsonBytes);
  const data = JSON.parse(jsonString);

  if (data.prompts && Array.isArray(data.prompts)) {
    return data.prompts;
  }

  throw new Error('Invalid pack format');
}

// Decrypt encrypted .pmtpk file
async function decryptPmtpk(bytes: Uint8Array, password: string): Promise<CloudPrompt[]> {
  const encryptedHeaderSize = HEADER_SIZE + SALT_LENGTH + IV_LENGTH;

  if (bytes.length < encryptedHeaderSize) {
    throw new Error('File is too small or corrupted');
  }

  const salt = bytes.slice(HEADER_SIZE, HEADER_SIZE + SALT_LENGTH);
  const iv = bytes.slice(HEADER_SIZE + SALT_LENGTH, encryptedHeaderSize);
  const encrypted = bytes.slice(encryptedHeaderSize);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decompressed = await gzipDecompress(new Uint8Array(decrypted));
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decompressed);
    const data = JSON.parse(jsonString);

    if (data.prompts && Array.isArray(data.prompts)) {
      return data.prompts;
    }

    throw new Error('Invalid pack format');
  } catch (e) {
    if (e instanceof Error && e.message === 'Invalid pack format') throw e;
    throw new Error('Wrong password');
  }
}

// Generate prompt key (matches web dashboard logic)
function getPromptKey(prompt: CloudPrompt): string {
  const hash = Math.abs(prompt.text.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)).toString(36);
  return `${prompt.createdAt}:${hash}`;
}

// Merge two arrays of prompts, keeping unique prompts from both
// Uses text content hash to detect duplicates, keeps the one with more metadata (header)
function mergePrompts(localPrompts: CloudPrompt[], serverPrompts: CloudPrompt[]): { merged: CloudPrompt[]; hasChanges: boolean } {
  const promptMap = new Map<string, CloudPrompt>();

  // Helper to create a unique key based on text content (normalized)
  const getTextKey = (text: string) => {
    const normalized = text.trim().toLowerCase();
    return Math.abs(normalized.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)).toString(36);
  };

  // Add server prompts first (they are the "source of truth" for existing prompts)
  for (const prompt of serverPrompts) {
    const key = getTextKey(prompt.text);
    promptMap.set(key, prompt);
  }

  let hasNewLocalPrompts = false;

  // Add local prompts, but only if they don't already exist on server
  for (const prompt of localPrompts) {
    const key = getTextKey(prompt.text);
    if (!promptMap.has(key)) {
      promptMap.set(key, prompt);
      hasNewLocalPrompts = true;
    } else {
      // If local has a header but server doesn't, prefer local
      const existing = promptMap.get(key)!;
      if (prompt.header && !existing.header) {
        promptMap.set(key, { ...existing, header: prompt.header });
        hasNewLocalPrompts = true;
      }
    }
  }

  // Sort by createdAt (oldest first)
  const merged = Array.from(promptMap.values()).sort((a, b) => a.createdAt - b.createdAt);

  return { merged, hasChanges: hasNewLocalPrompts };
}

// Apply header overrides from Convex metadata
function applyHeaderOverrides(prompts: CloudPrompt[], headers?: Record<string, string>): CloudPrompt[] {
  if (!headers) return prompts;

  return prompts.map((prompt) => {
    const key = getPromptKey(prompt);
    const override = headers[key];
    if (override && prompt.header !== override) {
      return { ...prompt, header: override };
    }
    return prompt;
  });
}

// XOR obfuscate (same as deobfuscate - XOR is symmetric)
function xorObfuscate(data: Uint8Array): Uint8Array {
  return xorDeobfuscate(data);
}

// Gzip compress using native APIs
async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  // Create a copy to ensure we have a regular ArrayBuffer (not SharedArrayBuffer)
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const stream = new Blob([buffer]).stream();
  const compressed = stream.pipeThrough(new CompressionStream('gzip'));
  const reader = compressed.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// Compute SHA-256 hash
async function computeHash(data: Uint8Array): Promise<Uint8Array> {
  // Create a copy to ensure we have a regular ArrayBuffer
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
}

// Magic bytes
const MAGIC_OBFUSCATED = new Uint8Array([0x50, 0x50, 0x4B, 0x00]); // "PPK\0"
const MAGIC_ENCRYPTED = new Uint8Array([0x50, 0x50, 0x4B, 0x01]); // "PPK\1"
const FORMAT_VERSION = 0x01;

// Derive AES key from password for encryption
async function deriveEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

// Encode prompts to .pmtpk format (obfuscated, not encrypted)
async function encodePmtpk(prompts: CloudPrompt[], title: string): Promise<Uint8Array> {
  const exportData = {
    version: "1.0",
    source: "desktop",
    title,
    exportedAt: new Date().toISOString(),
    prompts: prompts.map((p) => ({
      text: p.text,
      url: p.url || "",
      createdAt: p.createdAt,
      header: p.header,
    })),
  };

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(exportData));

  // Compute hash of original JSON
  const hash = await computeHash(jsonBytes);

  // Compress then obfuscate
  const compressed = await gzipCompress(jsonBytes);
  const obfuscated = xorObfuscate(compressed);

  // Build result: magic + version + hash + payload
  const result = new Uint8Array(HEADER_SIZE + obfuscated.length);
  result.set(MAGIC_OBFUSCATED, 0);
  result[MAGIC_OBFUSCATED.length] = FORMAT_VERSION;
  result.set(hash, MAGIC_OBFUSCATED.length + 1);
  result.set(obfuscated, HEADER_SIZE);

  return result;
}

// Encrypt prompts to .pmtpk format with password
async function encryptPmtpk(prompts: CloudPrompt[], title: string, password: string): Promise<Uint8Array> {
  const exportData = {
    version: "1.0",
    source: "desktop",
    title,
    exportedAt: new Date().toISOString(),
    prompts: prompts.map((p) => ({
      text: p.text,
      url: p.url || "",
      createdAt: p.createdAt,
      header: p.header,
    })),
  };

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(exportData));

  // Compute hash of original JSON
  const hash = await computeHash(jsonBytes);

  // Compress JSON
  const compressed = await gzipCompress(jsonBytes);

  // Generate salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive encryption key
  const key = await deriveEncryptionKey(password, salt);

  // Create a copy to ensure we have a regular ArrayBuffer (not SharedArrayBuffer)
  const compressedBuffer = new ArrayBuffer(compressed.length);
  new Uint8Array(compressedBuffer).set(compressed);

  // Encrypt the compressed data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    compressedBuffer
  );

  // Build result: magic + version + hash + salt + iv + encrypted
  const encryptedBytes = new Uint8Array(encrypted);
  const result = new Uint8Array(HEADER_SIZE + SALT_LENGTH + IV_LENGTH + encryptedBytes.length);
  result.set(MAGIC_ENCRYPTED, 0);
  result[MAGIC_ENCRYPTED.length] = FORMAT_VERSION;
  result.set(hash, MAGIC_ENCRYPTED.length + 1);
  result.set(salt, HEADER_SIZE);
  result.set(iv, HEADER_SIZE + SALT_LENGTH);
  result.set(encryptedBytes, HEADER_SIZE + SALT_LENGTH + IV_LENGTH);

  return result;
}

// Export encoding functions for use in components
export { encodePmtpk, encryptPmtpk };

// Convert Uint8Array to base64
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      cloudPacks: [],
      userPacks: [],
      loadedPacks: {},
      loadedUserPacks: {},
      selectedPackId: null,
      isLoading: false,
      isFetching: {},
      isSaving: {},
      generatingHeaders: {},
      lastSyncAt: null,
      error: null,

      fetchCloudPacks: async (clerkId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${CONVEX_URL}/api/desktop/saved-packs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clerkId }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch cloud packs');
          }

          const data = await response.json();

          if (data.success && Array.isArray(data.packs)) {
            set({
              cloudPacks: data.packs,
              lastSyncAt: Date.now(),
              isLoading: false,
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to sync',
            isLoading: false,
          });
        }
      },

      fetchUserPacks: async (clerkId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${CONVEX_URL}/api/desktop/user-packs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clerkId }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch user packs');
          }

          const data = await response.json();

          if (data.success && Array.isArray(data.packs)) {
            set({
              userPacks: data.packs,
              lastSyncAt: Date.now(),
              isLoading: false,
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to sync user packs',
            isLoading: false,
          });
        }
      },

      fetchAllPacks: async (clerkId: string) => {
        // Don't clear loaded caches - we need them for two-way merge
        set({ isLoading: true, error: null });

        try {
          // Fetch both savedPacks and userPacks metadata in parallel
          const [savedResponse, userResponse] = await Promise.all([
            fetch(`${CONVEX_URL}/api/desktop/saved-packs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clerkId }),
            }),
            fetch(`${CONVEX_URL}/api/desktop/user-packs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clerkId }),
            }),
          ]);

          const savedData = await savedResponse.json();
          const userData = await userResponse.json();

          const newCloudPacks = savedData.success && Array.isArray(savedData.packs) ? savedData.packs : [];
          const newUserPacks = userData.success && Array.isArray(userData.packs) ? userData.packs : [];

          set({
            cloudPacks: newCloudPacks,
            userPacks: newUserPacks,
            lastSyncAt: Date.now(),
            isLoading: false,
          });

          // Trigger re-fetch of prompts for any packs that are currently loaded
          // This will merge local changes with server data
          const { loadedPacks, loadedUserPacks } = get();

          for (const pack of newCloudPacks) {
            if (loadedPacks[pack.id] && loadedPacks[pack.id].prompts.length > 0) {
              // Re-fetch to merge local with server
              get().fetchPackPrompts(pack, loadedPacks[pack.id].password);
            }
          }

          for (const pack of newUserPacks) {
            if (loadedUserPacks[pack.id] && loadedUserPacks[pack.id].prompts.length > 0) {
              // Re-fetch to merge local with server
              get().fetchUserPackPrompts(pack, loadedUserPacks[pack.id].password);
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to sync',
            isLoading: false,
          });
        }
      },

      fetchPackPrompts: async (pack: CloudPack, password?: string) => {
        const { isFetching, loadedPacks } = get();

        // Check if already fetching
        if (isFetching[pack.id]) {
          return loadedPacks[pack.id] || null;
        }

        // Get existing local prompts (if any) for merging
        const existingLoaded = loadedPacks[pack.id];
        const localPrompts = existingLoaded?.prompts || [];

        set({ isFetching: { ...isFetching, [pack.id]: true }, error: null });

        try {
          // Fetch from R2 via workers API
          const response = await fetch(`${WORKERS_API_URL}/storage/fetch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ r2Key: pack.r2Key }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch pack file');
          }

          const { fileData } = await response.json();
          const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

          const fileIsEncrypted = isEncrypted(bytes);

          let serverPrompts: CloudPrompt[];

          if (fileIsEncrypted) {
            if (!password) {
              // Return partial loaded pack indicating encryption
              const loadedPack: LoadedPack = {
                ...pack,
                prompts: [],
                isEncrypted: true,
              };
              set((state) => ({
                loadedPacks: { ...state.loadedPacks, [pack.id]: loadedPack },
                isFetching: { ...state.isFetching, [pack.id]: false },
              }));
              return loadedPack;
            }
            serverPrompts = await decryptPmtpk(bytes, password);
          } else {
            serverPrompts = await decodeObfuscated(bytes);
          }

          // Apply header overrides
          serverPrompts = applyHeaderOverrides(serverPrompts, pack.headers);

          // Merge local prompts with server prompts (two-way sync)
          const { merged, hasChanges } = mergePrompts(localPrompts, serverPrompts);

          const loadedPack: LoadedPack = {
            ...pack,
            prompts: merged,
            promptCount: merged.length,
            isEncrypted: fileIsEncrypted,
            password: fileIsEncrypted ? password : undefined,
          };

          set((state) => ({
            loadedPacks: { ...state.loadedPacks, [pack.id]: loadedPack },
            cloudPacks: state.cloudPacks.map((p) =>
              p.id === pack.id ? { ...p, promptCount: merged.length } : p
            ),
            isFetching: { ...state.isFetching, [pack.id]: false },
          }));

          // If we have local changes that weren't on server, upload the merged result
          if (hasChanges && !fileIsEncrypted) {
            const encoded = await encodePmtpk(merged, pack.source);
            const mergedFileData = bytesToBase64(encoded);

            // Upload merged data to server (fire and forget, don't block UI)
            fetch(`${CONVEX_URL}/api/desktop/update-saved-pack`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                packId: pack.id,
                fileData: mergedFileData,
                promptCount: merged.length,
              }),
            }).catch((err) => console.error('Failed to upload merged saved pack:', err));
          }

          return loadedPack;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to load pack',
            isFetching: { ...state.isFetching, [pack.id]: false },
          }));
          return null;
        }
      },

      fetchUserPackPrompts: async (pack: UserPack, password?: string) => {
        const { isFetching, loadedUserPacks } = get();

        // Check if already fetching
        if (isFetching[pack.id]) {
          return loadedUserPacks[pack.id] || null;
        }

        // Get existing local prompts (if any) for merging
        const existingLoaded = loadedUserPacks[pack.id];
        const localPrompts = existingLoaded?.prompts || [];

        set({ isFetching: { ...isFetching, [pack.id]: true }, error: null });

        try {
          // Fetch from R2 via workers API
          const response = await fetch(`${WORKERS_API_URL}/storage/fetch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ r2Key: pack.r2Key }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch pack file');
          }

          const { fileData } = await response.json();
          const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

          const fileIsEncrypted = isEncrypted(bytes);

          let serverPrompts: CloudPrompt[];

          if (fileIsEncrypted) {
            if (!password) {
              // Return partial loaded pack indicating encryption
              const loadedPack: LoadedUserPack = {
                ...pack,
                prompts: [],
                isEncrypted: true,
              };
              set((state) => ({
                loadedUserPacks: { ...state.loadedUserPacks, [pack.id]: loadedPack },
                isFetching: { ...state.isFetching, [pack.id]: false },
              }));
              return loadedPack;
            }
            serverPrompts = await decryptPmtpk(bytes, password);
          } else {
            serverPrompts = await decodeObfuscated(bytes);
          }

          // Apply header overrides
          serverPrompts = applyHeaderOverrides(serverPrompts, pack.headers);

          // Merge local prompts with server prompts (two-way sync)
          const { merged, hasChanges } = mergePrompts(localPrompts, serverPrompts);

          const loadedPack: LoadedUserPack = {
            ...pack,
            prompts: merged,
            promptCount: merged.length,
            password: fileIsEncrypted ? password : undefined,
          };

          set((state) => ({
            loadedUserPacks: { ...state.loadedUserPacks, [pack.id]: loadedPack },
            userPacks: state.userPacks.map((p) =>
              p.id === pack.id ? { ...p, promptCount: merged.length } : p
            ),
            isFetching: { ...state.isFetching, [pack.id]: false },
          }));

          // If we have local changes that weren't on server, upload the merged result
          if (hasChanges && !fileIsEncrypted) {
            const encoded = await encodePmtpk(merged, pack.title);
            const mergedFileData = bytesToBase64(encoded);

            // Upload merged data to server (fire and forget, don't block UI)
            fetch(`${CONVEX_URL}/api/desktop/update-pack`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                packId: pack.id,
                fileData: mergedFileData,
                promptCount: merged.length,
              }),
            }).catch((err) => console.error('Failed to upload merged pack:', err));
          }

          return loadedPack;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to load pack',
            isFetching: { ...state.isFetching, [pack.id]: false },
          }));
          return null;
        }
      },

      // Update a prompt's text in a userPack
      updateUserPackPrompt: async (packId: string, promptIndex: number, text: string) => {
        const { loadedUserPacks, userPacks, isSaving } = get();
        const loaded = loadedUserPacks[packId];
        const pack = userPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Update the prompt locally
          const updatedPrompts = [...loaded.prompts];
          const oldPrompt = updatedPrompts[promptIndex];
          updatedPrompts[promptIndex] = { ...oldPrompt, text };

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(updatedPrompts, pack.title);
          const fileData = bytesToBase64(encoded);

          // Update via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/update-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: updatedPrompts.length,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update pack');
          }

          // Update local state
          set((state) => ({
            loadedUserPacks: {
              ...state.loadedUserPacks,
              [packId]: { ...loaded, prompts: updatedPrompts },
            },
            isSaving: { ...state.isSaving, [packId]: false },
          }));

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to update prompt',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Update a prompt's header in a userPack
      updateUserPackHeader: async (packId: string, promptIndex: number, header: string) => {
        const { loadedUserPacks, userPacks, isSaving } = get();
        const loaded = loadedUserPacks[packId];
        const pack = userPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Update the prompt header locally
          const updatedPrompts = [...loaded.prompts];
          updatedPrompts[promptIndex] = { ...updatedPrompts[promptIndex], header: header || undefined };

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(updatedPrompts, pack.title);
          const fileData = bytesToBase64(encoded);

          // Update pack file via Convex HTTP API
          const updateResponse = await fetch(`${CONVEX_URL}/api/desktop/update-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: updatedPrompts.length,
            }),
          });

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update pack');
          }

          // Also update header metadata in Convex
          const promptKey = getPromptKey(updatedPrompts[promptIndex]);
          await fetch(`${CONVEX_URL}/api/desktop/set-header`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              promptKey,
              header: header || null,
            }),
          });

          // Update local state
          set((state) => ({
            loadedUserPacks: {
              ...state.loadedUserPacks,
              [packId]: { ...loaded, prompts: updatedPrompts },
            },
            isSaving: { ...state.isSaving, [packId]: false },
          }));

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to update header',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Generate header for a single userPack prompt using /classify-website
      generateUserPackHeader: async (packId: string, promptIndex: number, promptText: string) => {
        const { generatingHeaders, loadedUserPacks, userPacks } = get();
        const loaded = loadedUserPacks[packId];
        const pack = userPacks.find((p) => p.id === packId);

        if (!loaded || !pack) return null;

        // Check if already generating
        const currentGenerating = generatingHeaders[packId] || new Set();
        if (currentGenerating.has(promptIndex)) return null;

        // Mark as generating
        const newGenerating = new Set(currentGenerating);
        newGenerating.add(promptIndex);
        set({ generatingHeaders: { ...generatingHeaders, [packId]: newGenerating } });

        try {
          const response = await fetch(`${WORKERS_API_URL}/classify-website`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promptText, maxWords: 2 }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate header');
          }

          const data = await response.json();
          if (data.success && data.header) {
            // Update the header
            await get().updateUserPackHeader(packId, promptIndex, data.header);
            return data.header;
          }

          return null;
        } catch (error) {
          console.error('Header generation failed:', error);
          return null;
        } finally {
          // Remove from generating set
          set((state) => {
            const currentSet = state.generatingHeaders[packId] || new Set();
            const newSet = new Set(currentSet);
            newSet.delete(promptIndex);
            return {
              generatingHeaders: { ...state.generatingHeaders, [packId]: newSet },
            };
          });
        }
      },

      // Generate headers for all userPack prompts without headers
      generateMissingUserPackHeaders: async (packId: string) => {
        const { loadedUserPacks } = get();
        const loaded = loadedUserPacks[packId];

        if (!loaded) return;

        // Find prompts without headers
        const promptsWithoutHeaders = loaded.prompts
          .map((p, i) => ({ prompt: p, index: i }))
          .filter(({ prompt }) => !prompt.header);

        // Generate headers in batches of 3
        const batchSize = 3;
        for (let i = 0; i < promptsWithoutHeaders.length; i += batchSize) {
          const batch = promptsWithoutHeaders.slice(i, i + batchSize);
          await Promise.all(
            batch.map(({ prompt, index }) =>
              get().generateUserPackHeader(packId, index, prompt.text)
            )
          );
        }
      },

      // Update a prompt's text in a savedPack (cloud prompts)
      updateSavedPackPrompt: async (packId: string, promptIndex: number, text: string) => {
        const { loadedPacks, cloudPacks, isSaving } = get();
        const loaded = loadedPacks[packId];
        const pack = cloudPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Update the prompt locally
          const updatedPrompts = [...loaded.prompts];
          const oldPrompt = updatedPrompts[promptIndex];
          updatedPrompts[promptIndex] = { ...oldPrompt, text };

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(updatedPrompts, pack.source);
          const fileData = bytesToBase64(encoded);

          // Update via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/update-saved-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: updatedPrompts.length,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update saved pack');
          }

          // Update local state
          set((state) => ({
            loadedPacks: {
              ...state.loadedPacks,
              [packId]: { ...loaded, prompts: updatedPrompts },
            },
            isSaving: { ...state.isSaving, [packId]: false },
          }));

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to update prompt',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Update a prompt's header in a savedPack
      updateSavedPackHeader: async (packId: string, promptIndex: number, header: string) => {
        const { loadedPacks, cloudPacks, isSaving } = get();
        const loaded = loadedPacks[packId];
        const pack = cloudPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Update the prompt header locally
          const updatedPrompts = [...loaded.prompts];
          updatedPrompts[promptIndex] = { ...updatedPrompts[promptIndex], header: header || undefined };

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(updatedPrompts, pack.source);
          const fileData = bytesToBase64(encoded);

          // Update pack file via Convex HTTP API
          const updateResponse = await fetch(`${CONVEX_URL}/api/desktop/update-saved-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: updatedPrompts.length,
            }),
          });

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update saved pack');
          }

          // Also update header metadata in Convex
          const promptKey = getPromptKey(updatedPrompts[promptIndex]);
          await fetch(`${CONVEX_URL}/api/desktop/set-saved-pack-header`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              promptKey,
              header: header || null,
            }),
          });

          // Update local state
          set((state) => ({
            loadedPacks: {
              ...state.loadedPacks,
              [packId]: { ...loaded, prompts: updatedPrompts },
            },
            isSaving: { ...state.isSaving, [packId]: false },
          }));

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to update header',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Generate header for a single savedPack prompt using /classify-website
      generateSavedPackHeader: async (packId: string, promptIndex: number, promptText: string) => {
        const { generatingHeaders, loadedPacks, cloudPacks } = get();
        const loaded = loadedPacks[packId];
        const pack = cloudPacks.find((p) => p.id === packId);

        if (!loaded || !pack) return null;

        // Check if already generating
        const currentGenerating = generatingHeaders[packId] || new Set();
        if (currentGenerating.has(promptIndex)) return null;

        // Mark as generating
        const newGenerating = new Set(currentGenerating);
        newGenerating.add(promptIndex);
        set({ generatingHeaders: { ...generatingHeaders, [packId]: newGenerating } });

        try {
          const response = await fetch(`${WORKERS_API_URL}/classify-website`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promptText, maxWords: 2 }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate header');
          }

          const data = await response.json();
          if (data.success && data.header) {
            // Update the header
            await get().updateSavedPackHeader(packId, promptIndex, data.header);
            return data.header;
          }

          return null;
        } catch (error) {
          console.error('Header generation failed:', error);
          return null;
        } finally {
          // Remove from generating set
          set((state) => {
            const currentSet = state.generatingHeaders[packId] || new Set();
            const newSet = new Set(currentSet);
            newSet.delete(promptIndex);
            return {
              generatingHeaders: { ...state.generatingHeaders, [packId]: newSet },
            };
          });
        }
      },

      // Generate headers for all savedPack prompts without headers
      generateMissingSavedPackHeaders: async (packId: string) => {
        const { loadedPacks } = get();
        const loaded = loadedPacks[packId];

        if (!loaded) return;

        // Find prompts without headers
        const promptsWithoutHeaders = loaded.prompts
          .map((p, i) => ({ prompt: p, index: i }))
          .filter(({ prompt }) => !prompt.header);

        // Generate headers in batches of 3
        const batchSize = 3;
        for (let i = 0; i < promptsWithoutHeaders.length; i += batchSize) {
          const batch = promptsWithoutHeaders.slice(i, i + batchSize);
          await Promise.all(
            batch.map(({ prompt, index }) =>
              get().generateSavedPackHeader(packId, index, prompt.text)
            )
          );
        }
      },

      // Add a new prompt to a userPack
      addUserPackPrompt: async (packId: string, text: string, header?: string) => {
        const { loadedUserPacks, loadedPacks, userPacks, isSaving, generatingHeaders } = get();
        const loaded = loadedUserPacks[packId];
        const pack = userPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;

        // Check prompt limit
        const session = useAuthStore.getState().session;
        const tier = (session?.tier as UserTier) || 'free';
        const maxPrompts = getPromptLimit(tier);

        // Count total prompts across all packs
        let totalPrompts = 0;
        for (const pid of Object.keys(loadedPacks)) {
          totalPrompts += loadedPacks[pid]?.prompts?.length || 0;
        }
        for (const pid of Object.keys(loadedUserPacks)) {
          totalPrompts += loadedUserPacks[pid]?.prompts?.length || 0;
        }

        if (totalPrompts >= maxPrompts) {
          set({ error: `You've reached the ${tier} plan limit of ${maxPrompts} prompts. Upgrade to add more.` });
          return false;
        }

        const createdAt = Date.now();
        const newPromptIndex = loaded.prompts.length;

        // Step 1: Immediately show the prompt in UI (optimistic update)
        const newPrompt: CloudPrompt = {
          text,
          createdAt,
          header: header || undefined, // Will be undefined if not provided
        };

        const optimisticPrompts = [...loaded.prompts, newPrompt];

        // Update UI immediately
        set((state) => ({
          loadedUserPacks: {
            ...state.loadedUserPacks,
            [packId]: { ...loaded, prompts: optimisticPrompts, promptCount: optimisticPrompts.length },
          },
          userPacks: state.userPacks.map((p) =>
            p.id === packId ? { ...p, promptCount: optimisticPrompts.length } : p
          ),
          error: null,
        }));

        // Step 2: Generate header if not provided (show loading state)
        let finalHeader = header;
        if (!finalHeader) {
          // Mark as generating header
          const currentGenerating = generatingHeaders[packId] || new Set();
          const newGenerating = new Set(currentGenerating);
          newGenerating.add(newPromptIndex);
          set({ generatingHeaders: { ...generatingHeaders, [packId]: newGenerating } });

          try {
            const response = await fetch(`${WORKERS_API_URL}/classify-website`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ promptText: text, maxWords: 2 }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.header) {
                finalHeader = data.header;
              }
            }
          } catch (e) {
            console.error('Failed to generate header:', e);
          }

          // Remove from generating set
          set((state) => {
            const currentSet = state.generatingHeaders[packId] || new Set();
            const newSet = new Set(currentSet);
            newSet.delete(newPromptIndex);
            return { generatingHeaders: { ...state.generatingHeaders, [packId]: newSet } };
          });

          // Update the prompt with generated header in UI
          if (finalHeader) {
            const updatedPrompt: CloudPrompt = { ...newPrompt, header: finalHeader };
            set((state) => {
              const currentLoaded = state.loadedUserPacks[packId];
              if (!currentLoaded) return state;
              const updatedPrompts = [...currentLoaded.prompts];
              updatedPrompts[newPromptIndex] = updatedPrompt;
              return {
                loadedUserPacks: {
                  ...state.loadedUserPacks,
                  [packId]: { ...currentLoaded, prompts: updatedPrompts },
                },
              };
            });
          }
        }

        // Step 3: Save to R2 (with final header)
        set((state) => ({ isSaving: { ...state.isSaving, [packId]: true } }));

        try {
          // Get current state with updated header
          const currentLoaded = get().loadedUserPacks[packId];
          if (!currentLoaded) throw new Error('Pack not found');

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(currentLoaded.prompts, pack.title);
          const fileData = bytesToBase64(encoded);

          // Update via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/update-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: currentLoaded.prompts.length,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to add prompt');
          }

          set((state) => ({ isSaving: { ...state.isSaving, [packId]: false } }));
          return true;
        } catch (error) {
          // Revert optimistic update on error
          set((state) => ({
            loadedUserPacks: {
              ...state.loadedUserPacks,
              [packId]: loaded, // Revert to original
            },
            userPacks: state.userPacks.map((p) =>
              p.id === packId ? { ...p, promptCount: loaded.prompts.length } : p
            ),
            error: error instanceof Error ? error.message : 'Failed to add prompt',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Update the icon/emoji for a userPack
      updateUserPackIcon: async (packId: string, icon: string) => {
        const { userPacks, isSaving } = get();
        const pack = userPacks.find((p) => p.id === packId);

        if (!pack || isSaving[packId]) return false;

        set({ isSaving: { ...get().isSaving, [packId]: true }, error: null });

        try {
          // Update via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/update-pack-icon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              icon: icon || null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update icon');
          }

          // Update local state
          set((state) => ({
            userPacks: state.userPacks.map((p) =>
              p.id === packId ? { ...p, icon: icon || undefined } : p
            ),
            loadedUserPacks: state.loadedUserPacks[packId]
              ? {
                  ...state.loadedUserPacks,
                  [packId]: { ...state.loadedUserPacks[packId], icon: icon || undefined },
                }
              : state.loadedUserPacks,
            isSaving: { ...state.isSaving, [packId]: false },
          }));

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to update icon',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Delete a prompt from a userPack
      deleteUserPackPrompt: async (packId: string, promptIndex: number) => {
        const { loadedUserPacks, userPacks, isSaving } = get();
        const loaded = loadedUserPacks[packId];
        const pack = userPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;
        if (promptIndex < 0 || promptIndex >= loaded.prompts.length) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Remove the prompt locally
          const updatedPrompts = loaded.prompts.filter((_, i) => i !== promptIndex);

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(updatedPrompts, pack.title);
          const fileData = bytesToBase64(encoded);

          // Update via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/update-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: updatedPrompts.length,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete prompt');
          }

          // Update local state
          set((state) => ({
            loadedUserPacks: {
              ...state.loadedUserPacks,
              [packId]: { ...loaded, prompts: updatedPrompts, promptCount: updatedPrompts.length },
            },
            userPacks: state.userPacks.map((p) =>
              p.id === packId ? { ...p, promptCount: updatedPrompts.length } : p
            ),
            isSaving: { ...state.isSaving, [packId]: false },
          }));

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to delete prompt',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Delete an entire userPack
      deleteUserPack: async (packId: string) => {
        const { userPacks, isSaving } = get();
        const pack = userPacks.find((p) => p.id === packId);

        if (!pack || isSaving[packId]) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Delete via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/delete-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packId }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete pack');
          }

          // Update local state - remove from lists and cache
          set((state) => {
            const { [packId]: _, ...remainingLoadedPacks } = state.loadedUserPacks;
            return {
              userPacks: state.userPacks.filter((p) => p.id !== packId),
              loadedUserPacks: remainingLoadedPacks,
              isSaving: { ...state.isSaving, [packId]: false },
              selectedPackId: state.selectedPackId === packId ? null : state.selectedPackId,
            };
          });

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to delete pack',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Add a new prompt to a savedPack
      addSavedPackPrompt: async (packId: string, text: string, header?: string) => {
        const { loadedPacks, loadedUserPacks, cloudPacks, isSaving, generatingHeaders } = get();
        const loaded = loadedPacks[packId];
        const pack = cloudPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;

        // Check prompt limit
        const session = useAuthStore.getState().session;
        const tier = (session?.tier as UserTier) || 'free';
        const maxPrompts = getPromptLimit(tier);

        // Count total prompts across all packs
        let totalPrompts = 0;
        for (const pid of Object.keys(loadedPacks)) {
          totalPrompts += loadedPacks[pid]?.prompts?.length || 0;
        }
        for (const pid of Object.keys(loadedUserPacks)) {
          totalPrompts += loadedUserPacks[pid]?.prompts?.length || 0;
        }

        if (totalPrompts >= maxPrompts) {
          set({ error: `You've reached the ${tier} plan limit of ${maxPrompts} prompts. Upgrade to add more.` });
          return false;
        }

        const createdAt = Date.now();
        const newPromptIndex = loaded.prompts.length;

        // Step 1: Immediately show the prompt in UI (optimistic update)
        const newPrompt: CloudPrompt = {
          text,
          createdAt,
          header: header || undefined, // Will be undefined if not provided
        };

        const optimisticPrompts = [...loaded.prompts, newPrompt];

        // Update UI immediately
        set((state) => ({
          loadedPacks: {
            ...state.loadedPacks,
            [packId]: { ...loaded, prompts: optimisticPrompts, promptCount: optimisticPrompts.length },
          },
          cloudPacks: state.cloudPacks.map((p) =>
            p.id === packId ? { ...p, promptCount: optimisticPrompts.length } : p
          ),
          error: null,
        }));

        // Step 2: Generate header if not provided (show loading state)
        let finalHeader = header;
        if (!finalHeader) {
          // Mark as generating header
          const currentGenerating = generatingHeaders[packId] || new Set();
          const newGenerating = new Set(currentGenerating);
          newGenerating.add(newPromptIndex);
          set({ generatingHeaders: { ...generatingHeaders, [packId]: newGenerating } });

          try {
            const response = await fetch(`${WORKERS_API_URL}/classify-website`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ promptText: text, maxWords: 2 }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.header) {
                finalHeader = data.header;
              }
            }
          } catch (e) {
            console.error('Failed to generate header:', e);
          }

          // Remove from generating set
          set((state) => {
            const currentSet = state.generatingHeaders[packId] || new Set();
            const newSet = new Set(currentSet);
            newSet.delete(newPromptIndex);
            return { generatingHeaders: { ...state.generatingHeaders, [packId]: newSet } };
          });

          // Update the prompt with generated header in UI
          if (finalHeader) {
            const updatedPrompt: CloudPrompt = { ...newPrompt, header: finalHeader };
            set((state) => {
              const currentLoaded = state.loadedPacks[packId];
              if (!currentLoaded) return state;
              const updatedPrompts = [...currentLoaded.prompts];
              updatedPrompts[newPromptIndex] = updatedPrompt;
              return {
                loadedPacks: {
                  ...state.loadedPacks,
                  [packId]: { ...currentLoaded, prompts: updatedPrompts },
                },
              };
            });
          }
        }

        // Step 3: Save to R2 (with final header)
        set((state) => ({ isSaving: { ...state.isSaving, [packId]: true } }));

        try {
          // Get current state with updated header
          const currentLoaded = get().loadedPacks[packId];
          if (!currentLoaded) throw new Error('Pack not found');

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(currentLoaded.prompts, pack.source);
          const fileData = bytesToBase64(encoded);

          // Update via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/update-saved-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: currentLoaded.prompts.length,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to add prompt');
          }

          set((state) => ({ isSaving: { ...state.isSaving, [packId]: false } }));
          return true;
        } catch (error) {
          // Revert optimistic update on error
          set((state) => ({
            loadedPacks: {
              ...state.loadedPacks,
              [packId]: loaded, // Revert to original
            },
            cloudPacks: state.cloudPacks.map((p) =>
              p.id === packId ? { ...p, promptCount: loaded.prompts.length } : p
            ),
            error: error instanceof Error ? error.message : 'Failed to add prompt',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Delete a prompt from a savedPack
      deleteSavedPackPrompt: async (packId: string, promptIndex: number) => {
        const { loadedPacks, cloudPacks, isSaving } = get();
        const loaded = loadedPacks[packId];
        const pack = cloudPacks.find((p) => p.id === packId);

        if (!loaded || !pack || isSaving[packId]) return false;
        if (promptIndex < 0 || promptIndex >= loaded.prompts.length) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Remove the prompt locally
          const updatedPrompts = loaded.prompts.filter((_, i) => i !== promptIndex);

          // Encode to .pmtpk format
          const encoded = await encodePmtpk(updatedPrompts, pack.source);
          const fileData = bytesToBase64(encoded);

          // Update via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/update-saved-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId,
              fileData,
              promptCount: updatedPrompts.length,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete prompt');
          }

          // Update local state
          set((state) => ({
            loadedPacks: {
              ...state.loadedPacks,
              [packId]: { ...loaded, prompts: updatedPrompts, promptCount: updatedPrompts.length },
            },
            cloudPacks: state.cloudPacks.map((p) =>
              p.id === packId ? { ...p, promptCount: updatedPrompts.length } : p
            ),
            isSaving: { ...state.isSaving, [packId]: false },
          }));

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to delete prompt',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Delete an entire savedPack
      deleteSavedPack: async (packId: string) => {
        const { cloudPacks, isSaving } = get();
        const pack = cloudPacks.find((p) => p.id === packId);

        if (!pack || isSaving[packId]) return false;

        set({ isSaving: { ...isSaving, [packId]: true }, error: null });

        try {
          // Delete via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/delete-saved-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packId }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete pack');
          }

          // Update local state - remove from lists and cache
          set((state) => {
            const { [packId]: _, ...remainingLoadedPacks } = state.loadedPacks;
            return {
              cloudPacks: state.cloudPacks.filter((p) => p.id !== packId),
              loadedPacks: remainingLoadedPacks,
              isSaving: { ...state.isSaving, [packId]: false },
              selectedPackId: state.selectedPackId === packId ? null : state.selectedPackId,
            };
          });

          return true;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to delete pack',
            isSaving: { ...state.isSaving, [packId]: false },
          }));
          return false;
        }
      },

      // Create a new userPack with prompts
      createUserPack: async (clerkId: string, title: string, prompts: CloudPrompt[]) => {
        set({ isLoading: true, error: null });

        try {
          // Encode prompts to .pmtpk format
          const encoded = await encodePmtpk(prompts, title);
          const fileData = bytesToBase64(encoded);

          // Create pack via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/create-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId,
              title,
              fileData,
              promptCount: prompts.length,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create pack');
          }

          const data = await response.json();

          if (data.success && data.pack) {
            const newPack: UserPack = data.pack;

            // Add to userPacks list
            set((state) => ({
              userPacks: [...state.userPacks, newPack],
              isLoading: false,
            }));

            // Also cache the loaded prompts
            const loadedPack: LoadedUserPack = {
              ...newPack,
              prompts,
            };
            set((state) => ({
              loadedUserPacks: { ...state.loadedUserPacks, [newPack.id]: loadedPack },
            }));

            return newPack;
          }

          throw new Error('Invalid response format');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create pack',
            isLoading: false,
          });
          return null;
        }
      },

      // Create a new savedPack for a specific source
      createSavedPack: async (clerkId: string, source: string, prompts: CloudPrompt[]) => {
        set({ isLoading: true, error: null });

        // Step 1: Create pack with prompts immediately (optimistic), then generate headers in background
        const promptsWithHeaders = [...prompts];
        const headersMap: Record<string, string> = {};

        // Check which prompts need header generation
        const promptsNeedingHeaders = prompts
          .map((p, i) => ({ prompt: p, index: i }))
          .filter(({ prompt }) => !prompt.header);

        try {
          // Step 2: Generate headers for prompts without them (in parallel, batched)
          if (promptsNeedingHeaders.length > 0) {
            // Mark as generating (use a temporary packId)
            const tempPackId = `temp-${source}-${Date.now()}`;
            const generatingSet = new Set(promptsNeedingHeaders.map(p => p.index));
            set((state) => ({
              generatingHeaders: { ...state.generatingHeaders, [tempPackId]: generatingSet },
            }));

            // Generate headers in batches of 3
            const batchSize = 3;
            for (let i = 0; i < promptsNeedingHeaders.length; i += batchSize) {
              const batch = promptsNeedingHeaders.slice(i, i + batchSize);
              const results = await Promise.all(
                batch.map(async ({ prompt, index }) => {
                  try {
                    const response = await fetch(`${WORKERS_API_URL}/classify-website`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ promptText: prompt.text, maxWords: 2 }),
                    });
                    if (response.ok) {
                      const data = await response.json();
                      if (data.success && data.header) {
                        return { index, header: data.header };
                      }
                    }
                  } catch (e) {
                    console.error('Failed to generate header:', e);
                  }
                  return { index, header: null };
                })
              );

              // Apply generated headers
              for (const { index, header } of results) {
                if (header) {
                  promptsWithHeaders[index] = { ...promptsWithHeaders[index], header };
                }
              }
            }

            // Clear generating state
            set((state) => {
              const newGenerating = { ...state.generatingHeaders };
              delete newGenerating[tempPackId];
              return { generatingHeaders: newGenerating };
            });
          }

          // Build headers map for Convex
          for (const prompt of promptsWithHeaders) {
            if (prompt.header) {
              const key = getPromptKey(prompt);
              headersMap[key] = prompt.header;
            }
          }

          // Step 3: Encode to .pmtpk format with headers
          const encoded = await encodePmtpk(promptsWithHeaders, source);
          const fileData = bytesToBase64(encoded);

          // Upload via Convex HTTP API
          const response = await fetch(`${CONVEX_URL}/api/desktop/sync-saved-pack`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId,
              source,
              fileData,
              promptCount: promptsWithHeaders.length,
              headers: headersMap,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create savedPack');
          }

          const data = await response.json();
          if (data.success && data.pack) {
            const newPack: CloudPack = {
              id: data.pack.id,
              source: data.pack.source,
              r2Key: data.pack.r2Key,
              promptCount: data.pack.promptCount,
              fileSize: data.pack.fileSize,
              headers: data.pack.headers,
              createdAt: data.pack.createdAt,
              updatedAt: data.pack.updatedAt,
            };

            // Update state with prompts including generated headers
            set((state) => ({
              cloudPacks: [...state.cloudPacks, newPack],
              loadedPacks: {
                ...state.loadedPacks,
                [newPack.id]: {
                  ...newPack,
                  prompts: promptsWithHeaders,
                  isEncrypted: false,
                },
              },
              isLoading: false,
            }));

            return newPack;
          }

          throw new Error('Invalid response format');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create savedPack',
            isLoading: false,
          });
          return null;
        }
      },

      // Sync local prompts (from promptStore) to cloud savedPacks
      syncLocalPromptsToCloud: async (clerkId: string, prompts: { text: string; header?: string; source: string; createdAt: number }[]) => {
        set({ isLoading: true, error: null });

        const synced: string[] = [];
        const failed: string[] = [];

        try {
          // Group prompts by source
          const promptsBySource = prompts.reduce((acc, p) => {
            if (!acc[p.source]) acc[p.source] = [];
            acc[p.source].push(p);
            return acc;
          }, {} as Record<string, typeof prompts>);

          // Sync each source as a savedPack
          for (const [source, sourcePrompts] of Object.entries(promptsBySource)) {
            try {
              // Convert to CloudPrompt format
              const cloudPrompts: CloudPrompt[] = sourcePrompts.map((p) => ({
                text: p.text,
                header: p.header,
                createdAt: p.createdAt,
              }));

              // Generate headers map
              const headers: Record<string, string> = {};
              for (const prompt of cloudPrompts) {
                if (prompt.header) {
                  const key = getPromptKey(prompt);
                  headers[key] = prompt.header;
                }
              }

              // Encode to .pmtpk format
              const encoded = await encodePmtpk(cloudPrompts, source);
              const fileData = bytesToBase64(encoded);

              // Upload via Convex HTTP API
              const response = await fetch(`${CONVEX_URL}/api/desktop/sync-saved-pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clerkId,
                  source,
                  fileData,
                  promptCount: cloudPrompts.length,
                  headers,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to sync');
              }

              const data = await response.json();
              if (data.success && data.pack) {
                synced.push(source);

                // Update cloudPacks state
                set((state) => {
                  const existingIndex = state.cloudPacks.findIndex((p) => p.source === source);
                  const updatedPack: CloudPack = {
                    id: data.pack.id,
                    source: data.pack.source,
                    r2Key: data.pack.r2Key,
                    promptCount: data.pack.promptCount,
                    fileSize: data.pack.fileSize,
                    headers: data.pack.headers,
                    createdAt: data.pack.createdAt,
                    updatedAt: data.pack.updatedAt,
                  };

                  if (existingIndex >= 0) {
                    const newCloudPacks = [...state.cloudPacks];
                    newCloudPacks[existingIndex] = updatedPack;
                    return { cloudPacks: newCloudPacks };
                  } else {
                    return { cloudPacks: [...state.cloudPacks, updatedPack] };
                  }
                });

                // Also update loaded packs cache
                set((state) => ({
                  loadedPacks: {
                    ...state.loadedPacks,
                    [data.pack.id]: {
                      ...data.pack,
                      prompts: cloudPrompts,
                      isEncrypted: false,
                    },
                  },
                }));
              } else {
                failed.push(source);
              }
            } catch (error) {
              console.error(`Failed to sync ${source}:`, error);
              failed.push(source);
            }
          }

          set({ isLoading: false, lastSyncAt: Date.now() });
          return { synced, failed };
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to sync',
            isLoading: false,
          });
          return { synced, failed };
        }
      },

      // UI action to set selected pack
      setSelectedPackId: (packId: string | null) => set({ selectedPackId: packId }),

      clearError: () => set({ error: null }),

      clearCache: () => set({
        cloudPacks: [],
        userPacks: [],
        loadedPacks: {},
        loadedUserPacks: {},
        lastSyncAt: null,
      }),
    }),
    {
      name: 'promptpack-sync',
      partialize: (state) => ({
        cloudPacks: state.cloudPacks,
        userPacks: state.userPacks,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
