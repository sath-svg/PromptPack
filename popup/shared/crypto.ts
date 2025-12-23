// Encryption utilities for .pmtpk files using Web Crypto API
// Uses AES-GCM for authenticated encryption + gzip compression
//
// File Format (v1):
// ?"O?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
// ?", Magic (4 bytes): "PPK" + type (0x00=obfuscated, 0x01=encrypted)
// ?", Format Version (1 byte): 0x01 = v1
// ?", Hash (32 bytes): SHA-256 of uncompressed JSON
// ?", Payload: gzip compressed + (XOR obfuscated OR AES encrypted)
// ?""?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"~
//
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const HASH_LENGTH = 32; // SHA-256

// File format version (bump for breaking changes)
const FORMAT_VERSION = 0x01;

// Schema version for JSON payload (semver-like)
export const SCHEMA_VERSION = "1.0";

// Magic bytes to identify file type
const MAGIC_OBFUSCATED = new Uint8Array([0x50, 0x50, 0x4B, 0x00]); // "PPK\0" - obfuscated
const MAGIC_ENCRYPTED = new Uint8Array([0x50, 0x50, 0x4B, 0x01]);  // "PPK\1" - encrypted

// Header size: magic (4) + version (1) + hash (32) = 37 bytes
const HEADER_SIZE = MAGIC_OBFUSCATED.length + 1 + HASH_LENGTH;

// XOR key for obfuscation (not encryption, just to make data unreadable in text editors)
const OBFUSCATE_KEY = new Uint8Array([0x50, 0x72, 0x6F, 0x6D, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6B]); // "PromptPack"

// Error types for better error handling
export class PmtpkError extends Error {
  code: 'CORRUPTED' | 'WRONG_PASSWORD' | 'UNSUPPORTED_VERSION' | 'INVALID_FORMAT';

  constructor(message: string, code: 'CORRUPTED' | 'WRONG_PASSWORD' | 'UNSUPPORTED_VERSION' | 'INVALID_FORMAT') {
    super(message);
    this.name = 'PmtpkError';
    this.code = code;
  }
}

// Compute SHA-256 hash
async function computeHash(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(data) as unknown as ArrayBuffer);
  return new Uint8Array(hashBuffer);
}

// Compare two Uint8Arrays
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Gzip compress data
async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream();
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

// Gzip decompress data
async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream();
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

// Obfuscate data (XOR with key) - makes unreadable but not secure
function xorObfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

// Encode data for unencrypted .pmtpk (compressed + obfuscated)
// Format: magic (4) + version (1) + hash (32) + obfuscated(gzip(json))
export async function encodePmtpk(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(data);

  // Compute hash of original JSON for integrity check
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

// Decode obfuscated .pmtpk data
export async function decodePmtpk(data: Uint8Array): Promise<string> {
  // Check minimum size
  if (data.length < HEADER_SIZE) {
    throw new PmtpkError('File is too small or corrupted', 'CORRUPTED');
  }

  // Check version
  const version = data[MAGIC_OBFUSCATED.length];
  if (version > FORMAT_VERSION) {
    throw new PmtpkError(`Unsupported format version ${version}. Please update PromptPack.`, 'UNSUPPORTED_VERSION');
  }

  // Extract hash and payload
  const storedHash = data.slice(MAGIC_OBFUSCATED.length + 1, HEADER_SIZE);
  const obfuscated = data.slice(HEADER_SIZE);

  // De-obfuscate then decompress
  const compressed = xorObfuscate(obfuscated);
  const jsonBytes = await gzipDecompress(compressed);

  // Verify hash
  const computedHash = await computeHash(jsonBytes);
  if (!arraysEqual(storedHash, computedHash)) {
    throw new PmtpkError('File is corrupted (hash mismatch)', 'CORRUPTED');
  }

  const decoder = new TextDecoder();
  return decoder.decode(jsonBytes);
}

// Check if data is obfuscated (starts with PPK\0)
export function isObfuscated(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  return data[0] === 0x50 && data[1] === 0x50 && data[2] === 0x4B && data[3] === 0x00;
}

// Check if data is encrypted (starts with PPK\1)
export function isEncrypted(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  return data[0] === 0x50 && data[1] === 0x50 && data[2] === 0x4B && data[3] === 0x01;
}

// Derive encryption key from password/license key
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
      salt: new Uint8Array(salt) as unknown as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with a password (compress first, then encrypt)
// Format: magic (4) + version (1) + hash (32) + salt (16) + iv (12) + encrypted(gzip(json))
export async function encryptPmtpk(data: string, password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const jsonBytes = encoder.encode(data);

  // Compute hash of original JSON for integrity check
  const hash = await computeHash(jsonBytes);

  // Compress first
  const compressed = await gzipCompress(jsonBytes);

  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new Uint8Array(compressed) as unknown as ArrayBuffer
  );

  // Combine: magic (4) + version (1) + hash (32) + salt (16) + iv (12) + encrypted data
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

// Decrypt data with a password (decrypt first, then decompress)
export async function decryptPmtpk(data: Uint8Array, password: string): Promise<string> {
  const encryptedHeaderSize = HEADER_SIZE + SALT_LENGTH + IV_LENGTH;

  // Check minimum size
  if (data.length < encryptedHeaderSize) {
    throw new PmtpkError('File is too small or corrupted', 'CORRUPTED');
  }

  // Check version
  const version = data[MAGIC_ENCRYPTED.length];
  if (version > FORMAT_VERSION) {
    throw new PmtpkError(`Unsupported format version ${version}. Please update PromptPack.`, 'UNSUPPORTED_VERSION');
  }

  // Extract hash, salt, iv, and encrypted data
  const storedHash = data.slice(MAGIC_ENCRYPTED.length + 1, HEADER_SIZE);
  const salt = data.slice(HEADER_SIZE, HEADER_SIZE + SALT_LENGTH);
  const iv = data.slice(HEADER_SIZE + SALT_LENGTH, encryptedHeaderSize);
  const encrypted = data.slice(encryptedHeaderSize);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );

    // Decompress after decryption
    const decompressed = await gzipDecompress(new Uint8Array(decrypted));

    // Verify hash
    const computedHash = await computeHash(decompressed);
    if (!arraysEqual(storedHash, computedHash)) {
      throw new PmtpkError('File is corrupted (hash mismatch)', 'CORRUPTED');
    }

    const decoder = new TextDecoder();
    return decoder.decode(decompressed);
  } catch (e) {
    if (e instanceof PmtpkError) throw e;
    throw new PmtpkError('Wrong password', 'WRONG_PASSWORD');
  }
}
