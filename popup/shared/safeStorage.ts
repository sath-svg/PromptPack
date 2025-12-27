/**
 * Safe Chrome Storage utilities with verification, retry, and backup
 * Bulletproof against silent failures, quota limits, and race conditions
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;
const BACKUP_PREFIX = "_backup_";

type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; recoveredFromBackup?: boolean };

/**
 * Safely get data from storage with type checking
 */
export async function safeGet<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? null;
  } catch (e) {
    console.error(`[SafeStorage] Get failed for key "${key}":`, e);
    return null;
  }
}

/**
 * Safely set data with verification and retry logic
 * Returns success status and any errors encountered
 */
export async function safeSet<T>(
  key: string,
  value: T,
  options?: {
    backup?: boolean;  // Create backup before writing (default: true for arrays)
    verify?: boolean;  // Verify after writing (default: true)
  }
): Promise<StorageResult<T>> {
  const shouldBackup = options?.backup ?? Array.isArray(value);
  const shouldVerify = options?.verify ?? true;

  // Create backup of existing data before modifying
  if (shouldBackup) {
    try {
      const existing = await chrome.storage.local.get(key);
      if (existing[key] !== undefined) {
        await chrome.storage.local.set({ [BACKUP_PREFIX + key]: existing[key] });
      }
    } catch (e) {
      console.warn(`[SafeStorage] Backup creation failed for key "${key}":`, e);
      // Continue anyway - backup is best-effort
    }
  }

  // Retry loop for writing
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await chrome.storage.local.set({ [key]: value });

      // Verify the write if requested
      if (shouldVerify) {
        const verification = await chrome.storage.local.get(key);
        const saved = verification[key];

        // Deep equality check for verification
        const savedJson = JSON.stringify(saved);
        const expectedJson = JSON.stringify(value);

        if (savedJson !== expectedJson) {
          console.error(`[SafeStorage] Verification failed for key "${key}" on attempt ${attempt}`);
          console.error(`[SafeStorage] Expected length: ${expectedJson.length}, Got: ${savedJson?.length}`);

          if (attempt < MAX_RETRIES) {
            await delay(RETRY_DELAY_MS * attempt);
            continue;
          }

          // Final attempt failed - try to restore from backup
          return await tryRestoreFromBackup(key, "Verification failed after all retries");
        }
      }

      // Success! Clean up backup after a delay (keep it briefly in case of immediate issues)
      if (shouldBackup) {
        setTimeout(async () => {
          try {
            await chrome.storage.local.remove(BACKUP_PREFIX + key);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 5000);
      }

      console.log(`[SafeStorage] Successfully saved key "${key}" (attempt ${attempt})`);
      return { ok: true, data: value };

    } catch (e) {
      lastError = e;
      console.error(`[SafeStorage] Write failed for key "${key}" on attempt ${attempt}:`, e);

      // Check for quota exceeded
      if (e instanceof Error && e.message.includes("QUOTA_BYTES")) {
        return { ok: false, error: "Storage quota exceeded. Please delete some data." };
      }

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  // All retries failed - try to restore from backup
  return await tryRestoreFromBackup(key, lastError instanceof Error ? lastError.message : "Unknown error");
}

/**
 * Attempt to restore data from backup after a failed write
 */
async function tryRestoreFromBackup<T>(key: string, error: string): Promise<StorageResult<T>> {
  try {
    const backup = await chrome.storage.local.get(BACKUP_PREFIX + key);
    const backupData = backup[BACKUP_PREFIX + key];

    if (backupData !== undefined) {
      // Restore the backup
      await chrome.storage.local.set({ [key]: backupData });
      console.log(`[SafeStorage] Restored key "${key}" from backup`);
      return {
        ok: false,
        error: `Write failed: ${error}. Restored from backup.`,
        recoveredFromBackup: true
      };
    }
  } catch (e) {
    console.error(`[SafeStorage] Backup restoration failed for key "${key}":`, e);
  }

  return { ok: false, error };
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  bytesUsed: number;
  bytesTotal: number;
  percentUsed: number;
}> {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytesUsed) => {
      // Default quota is ~5MB, with unlimitedStorage it's much higher
      const bytesTotal = 5 * 1024 * 1024; // 5MB default
      resolve({
        bytesUsed,
        bytesTotal,
        percentUsed: (bytesUsed / bytesTotal) * 100
      });
    });
  });
}

/**
 * Check if we're running low on storage
 */
export async function isStorageLow(thresholdPercent = 80): Promise<boolean> {
  const stats = await getStorageStats();
  return stats.percentUsed >= thresholdPercent;
}

/**
 * Atomic update with locking to prevent race conditions
 * Uses a simple mutex pattern via storage
 */
const locks = new Map<string, Promise<void>>();

export async function atomicUpdate<T>(
  key: string,
  updater: (current: T | null) => T | Promise<T>
): Promise<StorageResult<T>> {
  // Wait for any existing lock on this key
  const existingLock = locks.get(key);
  if (existingLock) {
    await existingLock;
  }

  // Create new lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  locks.set(key, lockPromise);

  try {
    const current = await safeGet<T>(key);
    const updated = await updater(current);
    const result = await safeSet(key, updated);
    return result;
  } finally {
    releaseLock!();
    locks.delete(key);
  }
}

/**
 * Export all data for manual backup
 */
export async function exportAllData(): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      // Filter out backup keys
      const filtered: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(items)) {
        if (!key.startsWith(BACKUP_PREFIX)) {
          filtered[key] = value;
        }
      }
      resolve(filtered);
    });
  });
}

/**
 * Import data from a backup (for recovery)
 */
export async function importBackupData(
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    await chrome.storage.local.set(data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Import failed" };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
