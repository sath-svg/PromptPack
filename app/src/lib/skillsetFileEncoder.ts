/**
 * Skillset File Encoder: Encodes skillsets to .skill file format.
 * Uses same binary structure as .pmtpk (PPK\0 obfuscated, PPK\1 encrypted)
 * but with skillset-specific JSON payload (type: "skillset").
 *
 * Binary layout:
 *   PPK<type>(4) + version(1) + sha256(32) + [salt(16) + iv(12) if encrypted] + payload
 *   payload: gzip + xor (obfuscated) OR gzip + AES-GCM (encrypted)
 */

import type { StyleCharacteristics, SkillPrompt } from './styleAnalyzer';

interface SkillsetPayload {
  version: string;
  type: 'skillset';
  title: string;
  styleCharacteristics: StyleCharacteristics;
  // Skillset = SET of style-locked prompts for different gen surfaces
  // (image, video, character, setting, mood, custom)
  prompts: SkillPrompt[];
  referenceImages?: Array<{
    id: string;
    data: string; // base64
  }>;
  previewGenerations?: Array<{
    id: string;
    images: string[]; // base64
    prompt?: string;
  }>;
  exportedAt: number;
}

// Match .pmtpk format exactly so decoder reuses
const MAGIC_OBFUSCATED = new Uint8Array([0x50, 0x50, 0x4b, 0x00]); // "PPK\0"
const MAGIC_ENCRYPTED = new Uint8Array([0x50, 0x50, 0x4b, 0x01]);  // "PPK\1"
const FORMAT_VERSION = 0x01;
const HEADER_SIZE = 37;  // magic(4) + version(1) + hash(32)
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
// XOR key: "PromptPack"
const OBFUSCATE_KEY = new Uint8Array([0x50, 0x72, 0x6f, 0x6d, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6b]);

// Gzip compress via browser CompressionStream
async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
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

async function computeHash(data: Uint8Array): Promise<Uint8Array> {
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
}

function xorObfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

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
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

/**
 * Encode skillset as obfuscated .skill (PPK\0). No password.
 */
export async function encodeSkillset(payload: SkillsetPayload): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(payload));

  const hash = await computeHash(jsonBytes);
  const compressed = await gzipCompress(jsonBytes);
  const obfuscated = xorObfuscate(compressed);

  const result = new Uint8Array(HEADER_SIZE + obfuscated.length);
  result.set(MAGIC_OBFUSCATED, 0);
  result[MAGIC_OBFUSCATED.length] = FORMAT_VERSION;
  result.set(hash, MAGIC_OBFUSCATED.length + 1);
  result.set(obfuscated, HEADER_SIZE);
  return result;
}

/**
 * Encrypt skillset as password-protected .skill (PPK\1). AES-GCM via PBKDF2.
 */
export async function encryptSkillset(payload: SkillsetPayload, password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(payload));

  const hash = await computeHash(jsonBytes);
  const compressed = await gzipCompress(jsonBytes);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveEncryptionKey(password, salt);

  const compressedBuffer = new ArrayBuffer(compressed.length);
  new Uint8Array(compressedBuffer).set(compressed);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    compressedBuffer
  );

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

/**
 * Create downloadable Blob from skillset payload.
 * If password provided → encrypted; otherwise → obfuscated.
 */
export async function createSkillsetFile(
  payload: SkillsetPayload,
  password?: string
): Promise<Blob> {
  const bytes = password ? await encryptSkillset(payload, password) : await encodeSkillset(payload);
  return new Blob([bytes], { type: 'application/octet-stream' });
}
