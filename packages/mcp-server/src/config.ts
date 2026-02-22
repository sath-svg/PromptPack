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

async function refreshTokenIfNeeded(): Promise<void> {
  const config = loadConfig();
  if (!config?.refreshToken || !config.expiresAt) return;

  // Refresh if within 7 days of expiry
  const sevenDays = 7 * 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);
  if (config.expiresAt - now > sevenDays) return;

  try {
    const res = await fetch(`${API_BASE}/auth/mcp-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.refreshToken}`,
      },
    });
    if (!res.ok) return;
    const data = await res.json() as { refreshToken?: string; expiresAt?: number };
    if (data.refreshToken) {
      saveConfig({
        clerkId: config.clerkId,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      });
    }
  } catch {
    // Silently ignore refresh failures — token is still valid
  }
}

export async function getTokenWithRefresh(): Promise<string | null> {
  await refreshTokenIfNeeded();
  return getToken();
}
