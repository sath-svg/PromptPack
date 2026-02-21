// Device auth flow for CLI login
// Opens browser → user signs in → CLI receives token

import { API_BASE, saveConfig, clearConfig } from './config.js';

async function openBrowser(url: string): Promise<void> {
  const { exec } = await import('node:child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd);
}

export async function login(): Promise<void> {
  console.log('Requesting device code...');

  const codeRes = await fetch(`${API_BASE}/auth/device-code`, { method: 'POST' });
  if (!codeRes.ok) {
    console.error('Failed to get device code');
    process.exit(1);
  }

  const { code, authUrl } = await codeRes.json() as { code: string; authUrl: string };

  console.log(`\nOpening browser for authentication...`);
  console.log(`If the browser doesn't open, visit: ${authUrl}\n`);
  console.log(`Device code: ${code}\n`);

  await openBrowser(authUrl);

  // Poll for completion
  console.log('Waiting for sign-in...');
  const maxAttempts = 60; // 5 minutes (5s intervals)
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const pollRes = await fetch(`${API_BASE}/auth/device-poll?code=${code}`);
    if (!pollRes.ok) {
      console.error('Device code expired. Please try again.');
      process.exit(1);
    }

    const data = await pollRes.json() as { status: string; clerkId?: string; refreshToken?: string };

    if (data.status === 'complete' && data.clerkId && data.refreshToken) {
      saveConfig({
        clerkId: data.clerkId,
        refreshToken: data.refreshToken,
      });
      console.log('\nAuthenticated successfully! You can now use pmtpk MCP tools.');
      return;
    }

    process.stdout.write('.');
  }

  console.error('\nAuthentication timed out. Please try again.');
  process.exit(1);
}

export function logout(): void {
  clearConfig();
  console.log('Logged out. Stored tokens have been cleared.');
}
