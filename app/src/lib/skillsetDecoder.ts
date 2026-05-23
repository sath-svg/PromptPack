/**
 * Shared .skill / .pmtpk decoder. Handles three byte layouts:
 *   - PPK\0 obfuscated (gzip + XOR with key "PromptPack")
 *   - PPK\1 encrypted (gzip + AES-GCM with PBKDF2 password)
 *   - Plain JSON ({type:"skillset", prompts:[...]})
 *
 * The payload is normalized into the CloudPrompt shape used by syncStore so
 * both ImportPage and Marketplace can reuse the same downstream import flow.
 */

import type { CloudPrompt } from '../stores/syncStore';

const OBFUSCATE_KEY = new Uint8Array([
  0x50, 0x72, 0x6f, 0x6d, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6b,
]); // "PromptPack"
const HEADER_SIZE = 37; // magic(4) + version(1) + sha256(32)
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export interface DecodedSkill {
  prompts: CloudPrompt[];
  /** Raw decoded payload (for marketplace preview synthesis) */
  raw: any;
  /** "skillset" | "pack" | undefined — taken from payload.type when present */
  payloadType?: string;
}

function xorDeobfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
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
  const totalLength = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
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
    ['decrypt'],
  );
}

export function normalizeImportedPrompts(data: any): CloudPrompt[] {
  if (!data?.prompts || !Array.isArray(data.prompts)) {
    throw new Error('Invalid pack format');
  }
  const isSkillset =
    data.type === 'skillset' ||
    data.prompts.some(
      (p: any) => typeof p.template === 'string' && typeof p.text !== 'string',
    );
  if (isSkillset) {
    return data.prompts.map((p: any, idx: number) => ({
      text: p.template ?? p.text ?? '',
      header: `${p.icon ? p.icon + ' ' : ''}${p.label ?? 'Prompt'}${
        p.purpose ? ' — ' + p.purpose : ''
      }`,
      url: '',
      createdAt: Date.now() + idx,
    })) as CloudPrompt[];
  }
  return data.prompts as CloudPrompt[];
}

/**
 * Decode .skill / .pmtpk bytes (or plain-JSON .skill). Throws if encrypted
 * and no password supplied — caller should retry with a password.
 */
export async function decodeSkillFile(
  bytes: Uint8Array,
  password?: string,
): Promise<DecodedSkill> {
  const isBinary = bytes[0] === 0x50 && bytes[1] === 0x50 && bytes[2] === 0x4b;
  const hasBom =
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf && bytes[3] === 0x7b;
  const isJson = !isBinary && (bytes[0] === 0x7b || hasBom);

  if (!isBinary && !isJson) {
    throw new Error('Invalid Skillset file format');
  }

  if (isJson) {
    const offset = hasBom ? 3 : 0;
    const decoder = new TextDecoder();
    const data = JSON.parse(decoder.decode(bytes.slice(offset)));
    return {
      prompts: normalizeImportedPrompts(data),
      raw: data,
      payloadType: data.type,
    };
  }

  if (bytes.length < HEADER_SIZE) throw new Error('File is too small or corrupted');
  const isEncrypted = bytes[3] === 0x01;

  if (isEncrypted) {
    if (!password) throw new PasswordRequiredError();
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
        encrypted,
      );
      const decompressed = await gzipDecompress(new Uint8Array(decrypted));
      const data = JSON.parse(new TextDecoder().decode(decompressed));
      return {
        prompts: normalizeImportedPrompts(data),
        raw: data,
        payloadType: data.type,
      };
    } catch (e) {
      if (e instanceof Error && e.message === 'Invalid pack format') throw e;
      throw new Error('Wrong password');
    }
  }

  // Obfuscated
  const obfuscated = bytes.slice(HEADER_SIZE);
  const compressed = xorDeobfuscate(obfuscated);
  const jsonBytes = await gzipDecompress(compressed);
  const data = JSON.parse(new TextDecoder().decode(jsonBytes));
  return {
    prompts: normalizeImportedPrompts(data),
    raw: data,
    payloadType: data.type,
  };
}

export class PasswordRequiredError extends Error {
  constructor() {
    super('Password required');
    this.name = 'PasswordRequiredError';
  }
}

/**
 * Heuristic kind inference for marketplace listing — used as a default the
 * seller can override.
 */
export function inferListingKind(
  raw: any,
): 'flow' | 'folder' | 'preset' {
  if (raw?.type === 'skillset' && raw?.styleCharacteristics) return 'preset';
  if (Array.isArray(raw?.steps) || raw?.type === 'flow') return 'flow';
  return 'folder';
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
