// .pmtpk file encode/decode for Cloudflare Workers
// Ported from popup/shared/crypto.ts — uses Web Crypto API (available in Workers)
//
// File Format (v1):
// Magic (4 bytes): "PPK" + type (0x00=obfuscated, 0x01=encrypted)
// Format Version (1 byte): 0x01 = v1
// Hash (32 bytes): SHA-256 of uncompressed JSON
// Payload: gzip compressed + (XOR obfuscated OR AES encrypted)

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const HASH_LENGTH = 32;
const FORMAT_VERSION = 0x01;

const MAGIC_OBFUSCATED = new Uint8Array([0x50, 0x50, 0x4B, 0x00]); // "PPK\0"
const MAGIC_ENCRYPTED = new Uint8Array([0x50, 0x50, 0x4B, 0x01]);  // "PPK\1"
const HEADER_SIZE = MAGIC_OBFUSCATED.length + 1 + HASH_LENGTH; // 37 bytes

// XOR key: "PromptPack"
const OBFUSCATE_KEY = new Uint8Array([0x50, 0x72, 0x6F, 0x6D, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6B]);

export class PmtpkError extends Error {
  code: 'CORRUPTED' | 'WRONG_PASSWORD' | 'UNSUPPORTED_VERSION' | 'INVALID_FORMAT';

  constructor(message: string, code: PmtpkError['code']) {
    super(message);
    this.name = 'PmtpkError';
    this.code = code;
  }
}

async function computeHash(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream();
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

async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream();
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

function xorObfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

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
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// --- Public API ---

export function isObfuscated(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  return data[0] === 0x50 && data[1] === 0x50 && data[2] === 0x4B && data[3] === 0x00;
}

export function isEncrypted(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  return data[0] === 0x50 && data[1] === 0x50 && data[2] === 0x4B && data[3] === 0x01;
}

/** Encode JSON string into obfuscated .pmtpk bytes (PPK\0 format) */
export async function encodePmtpk(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(data);
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

/** Decode obfuscated .pmtpk bytes → JSON string */
export async function decodePmtpk(data: Uint8Array): Promise<string> {
  if (data.length < HEADER_SIZE) {
    throw new PmtpkError('File is too small or corrupted', 'CORRUPTED');
  }
  const version = data[MAGIC_OBFUSCATED.length];
  if (version > FORMAT_VERSION) {
    throw new PmtpkError(`Unsupported format version ${version}`, 'UNSUPPORTED_VERSION');
  }

  const storedHash = data.slice(MAGIC_OBFUSCATED.length + 1, HEADER_SIZE);
  const obfuscated = data.slice(HEADER_SIZE);
  const compressed = xorObfuscate(obfuscated);
  const jsonBytes = await gzipDecompress(compressed);

  const computedHash = await computeHash(jsonBytes);
  if (!arraysEqual(storedHash, computedHash)) {
    throw new PmtpkError('File is corrupted (hash mismatch)', 'CORRUPTED');
  }

  return new TextDecoder().decode(jsonBytes);
}

/** Decrypt encrypted .pmtpk bytes → JSON string */
export async function decryptPmtpk(data: Uint8Array, password: string): Promise<string> {
  const encryptedHeaderSize = HEADER_SIZE + SALT_LENGTH + IV_LENGTH;
  if (data.length < encryptedHeaderSize) {
    throw new PmtpkError('File is too small or corrupted', 'CORRUPTED');
  }
  const version = data[MAGIC_ENCRYPTED.length];
  if (version > FORMAT_VERSION) {
    throw new PmtpkError(`Unsupported format version ${version}`, 'UNSUPPORTED_VERSION');
  }

  const storedHash = data.slice(MAGIC_ENCRYPTED.length + 1, HEADER_SIZE);
  const salt = data.slice(HEADER_SIZE, HEADER_SIZE + SALT_LENGTH);
  const iv = data.slice(HEADER_SIZE + SALT_LENGTH, encryptedHeaderSize);
  const encrypted = data.slice(encryptedHeaderSize);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encrypted);
    const decompressed = await gzipDecompress(new Uint8Array(decrypted));
    const computedHash = await computeHash(decompressed);
    if (!arraysEqual(storedHash, computedHash)) {
      throw new PmtpkError('File is corrupted (hash mismatch)', 'CORRUPTED');
    }
    return new TextDecoder().decode(decompressed);
  } catch (e) {
    if (e instanceof PmtpkError) throw e;
    throw new PmtpkError('Wrong password', 'WRONG_PASSWORD');
  }
}

export interface PackData {
  version: number;
  exportedAt: number;
  prompts: Array<{ text: string; header?: string; source?: string; createdAt?: number }>;
}

/** High-level: decode any .pmtpk file → parsed PackData */
export async function decodePack(fileBytes: Uint8Array, password?: string): Promise<PackData> {
  if (isEncrypted(fileBytes)) {
    if (!password) throw new PmtpkError('Password required for encrypted pack', 'WRONG_PASSWORD');
    const json = await decryptPmtpk(fileBytes, password);
    return JSON.parse(json) as PackData;
  } else if (isObfuscated(fileBytes)) {
    const json = await decodePmtpk(fileBytes);
    return JSON.parse(json) as PackData;
  } else {
    throw new PmtpkError('Invalid pack format - unrecognized magic bytes', 'INVALID_FORMAT');
  }
}

/** High-level: encode PackData → obfuscated .pmtpk bytes */
export async function encodePack(packData: PackData): Promise<Uint8Array> {
  const json = JSON.stringify(packData);
  return encodePmtpk(json);
}

/** Encrypt JSON string into AES-GCM encrypted .pmtpk bytes (PPK\1 format) */
export async function encryptPmtpk(data: string, password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const jsonBytes = encoder.encode(data);
  const hash = await computeHash(jsonBytes);
  const compressed = await gzipCompress(jsonBytes);
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, compressed);
  const encryptedHeaderSize = HEADER_SIZE + SALT_LENGTH + IV_LENGTH;
  const result = new Uint8Array(encryptedHeaderSize + encrypted.byteLength);
  result.set(MAGIC_ENCRYPTED, 0);
  result[MAGIC_ENCRYPTED.length] = FORMAT_VERSION;
  result.set(hash, MAGIC_ENCRYPTED.length + 1);
  result.set(salt, HEADER_SIZE);
  result.set(iv, HEADER_SIZE + SALT_LENGTH);
  result.set(new Uint8Array(encrypted), encryptedHeaderSize);
  return result;
}

/** High-level: encode PackData → AES-GCM encrypted .pmtpk bytes */
export async function encryptPack(packData: PackData, password: string): Promise<Uint8Array> {
  const json = JSON.stringify(packData);
  return encryptPmtpk(json, password);
}
