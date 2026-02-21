// Token storage for the MCP bridge CLI
// Stores auth tokens in ~/.pmtpk/config.json

import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const API_BASE = 'https://api.pmtpk.com';

interface StoredConfig {
  clerkId: string;
  refreshToken: string;
  expiresAt?: number;
}

function getConfigDir(): string {
  // Windows: %APPDATA%/pmtpk, macOS/Linux: ~/.pmtpk
  if (process.platform === 'win32' && process.env.APPDATA) {
    return join(process.env.APPDATA, 'pmtpk');
  }
  return join(homedir(), '.pmtpk');
}

function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function loadConfig(): StoredConfig | null {
  try {
    const data = readFileSync(getConfigPath(), 'utf-8');
    return JSON.parse(data) as StoredConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: StoredConfig): void {
  const dir = getConfigDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8');
}

export function clearConfig(): void {
  const path = getConfigPath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

export function getToken(): string | null {
  const config = loadConfig();
  if (!config?.refreshToken) return null;
  return config.refreshToken;
}
