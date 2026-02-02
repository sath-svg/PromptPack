import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PromptSource } from '../types';
import { CONVEX_URL, WORKERS_API_URL } from '../lib/constants';

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

  // State
  isLoading: boolean;
  isFetching: Record<string, boolean>;
  lastSyncAt: number | null;
  error: string | null;

  // Actions
  fetchCloudPacks: (clerkId: string) => Promise<void>;
  fetchUserPacks: (clerkId: string) => Promise<void>;
  fetchAllPacks: (clerkId: string) => Promise<void>;
  fetchPackPrompts: (pack: CloudPack, password?: string) => Promise<LoadedPack | null>;
  fetchUserPackPrompts: (pack: UserPack, password?: string) => Promise<LoadedUserPack | null>;
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

// Apply header overrides from Convex metadata
function applyHeaderOverrides(prompts: CloudPrompt[], headers?: Record<string, string>): CloudPrompt[] {
  if (!headers) return prompts;

  return prompts.map((prompt) => {
    // Generate key same way as web dashboard
    const hash = Math.abs(prompt.text.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)).toString(36);
    const key = `${prompt.createdAt}:${hash}`;
    const override = headers[key];
    if (override && prompt.header !== override) {
      return { ...prompt, header: override };
    }
    return prompt;
  });
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      cloudPacks: [],
      userPacks: [],
      loadedPacks: {},
      loadedUserPacks: {},
      isLoading: false,
      isFetching: {},
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
        set({ isLoading: true, error: null });

        try {
          // Fetch both savedPacks and userPacks in parallel
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

          set({
            cloudPacks: savedData.success && Array.isArray(savedData.packs) ? savedData.packs : [],
            userPacks: userData.success && Array.isArray(userData.packs) ? userData.packs : [],
            lastSyncAt: Date.now(),
            isLoading: false,
          });
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

          let prompts: CloudPrompt[];

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
            prompts = await decryptPmtpk(bytes, password);
          } else {
            prompts = await decodeObfuscated(bytes);
          }

          // Apply header overrides
          prompts = applyHeaderOverrides(prompts, pack.headers);

          const loadedPack: LoadedPack = {
            ...pack,
            prompts,
            isEncrypted: fileIsEncrypted,
            password: fileIsEncrypted ? password : undefined,
          };

          set((state) => ({
            loadedPacks: { ...state.loadedPacks, [pack.id]: loadedPack },
            isFetching: { ...state.isFetching, [pack.id]: false },
          }));

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

          // Debug: log first bytes to verify format
          console.log('[fetchUserPackPrompts] Pack bytes (first 10):', Array.from(bytes.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
          console.log('[fetchUserPackPrompts] Expected PPK header: 50 50 4b 00 (obfuscated) or 50 50 4b 01 (encrypted)');

          const fileIsEncrypted = isEncrypted(bytes);
          console.log('[fetchUserPackPrompts] isEncrypted:', fileIsEncrypted);

          let prompts: CloudPrompt[];

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
            prompts = await decryptPmtpk(bytes, password);
          } else {
            prompts = await decodeObfuscated(bytes);
          }

          // Apply header overrides
          prompts = applyHeaderOverrides(prompts, pack.headers);

          const loadedPack: LoadedUserPack = {
            ...pack,
            prompts,
            password: fileIsEncrypted ? password : undefined,
          };

          set((state) => ({
            loadedUserPacks: { ...state.loadedUserPacks, [pack.id]: loadedPack },
            isFetching: { ...state.isFetching, [pack.id]: false },
          }));

          return loadedPack;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to load pack',
            isFetching: { ...state.isFetching, [pack.id]: false },
          }));
          return null;
        }
      },

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
