import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Poll the configured updater endpoint once, and if a new version is
 * available, surface a sticky notification with an Install action. The
 * download + verify + install happens via the Tauri plugin (signature
 * checked against the pubkey baked into tauri.conf.json) and the app
 * relaunches into the new version on success.
 *
 * Safe to call on every launch — `check()` returns null when the user is
 * already on the latest. No retries, no auto-install: we always wait for
 * the user to opt in via the notification.
 */
export async function checkForUpdateOnLaunch(): Promise<void> {
  let update: Update | null;
  try {
    update = await check();
  } catch (err) {
    // Network or 404 from the manifest endpoint — silent. Don't bother
    // the user; they'll try again on next launch.
    console.warn('[updater] check failed:', err);
    return;
  }
  if (!update) return;

  useNotificationStore.getState().notify({
    category: 'unknown',
    severity: 'info',
    title: `Update available — ${update.version}`,
    message: update.body?.trim() || `A new version of Skillset (${update.version}) is ready to install.`,
    actions: [
      {
        kind: 'open_url',
        url: 'about:update',
        label: 'Install',
      },
      { kind: 'dismiss' },
    ],
    details: `current=${update.currentVersion} latest=${update.version}\ndate=${update.date ?? 'unknown'}\nbody=${update.body ?? ''}`,
    dedupeKey: `updater.available:${update.version}`,
    source: 'appUpdater.check',
  }, { ttlMs: null });

  // The notification renders an "Install" button that fires
  // `open_url`. We intercept by patching the shell's open call:
  // listen for the sentinel URL and run the actual install instead.
  // Simpler than threading a new action kind through the toast system.
  const original = window.open;
  window.open = ((url?: string | URL, ...rest: unknown[]) => {
    if (url === 'about:update') {
      void installAndRelaunch(update);
      return null;
    }
    // @ts-expect-error — passthrough preserves original signature
    return original.call(window, url, ...rest);
  }) as typeof window.open;
}

async function installAndRelaunch(update: Update): Promise<void> {
  const store = useNotificationStore.getState();
  // Show download-in-progress toast.
  const progressId = store.notify({
    category: 'unknown',
    severity: 'info',
    title: `Downloading ${update.version}…`,
    message: '0%',
    actions: [{ kind: 'dismiss' }],
    details: `installing ${update.version}`,
    dedupeKey: 'updater.downloading',
    source: 'appUpdater.install',
  }, { ttlMs: null });

  let total = 0;
  let downloaded = 0;
  try {
    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        total = event.data.contentLength ?? 0;
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
        const pct = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
        store.notify({
          category: 'unknown',
          severity: 'info',
          title: `Downloading ${update.version}…`,
          message: total > 0 ? `${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB)` : `${(downloaded / 1024 / 1024).toFixed(1)} MB`,
          actions: [{ kind: 'dismiss' }],
          details: `progress ${pct}%`,
          dedupeKey: 'updater.downloading',
          source: 'appUpdater.install',
        }, { ttlMs: null });
      }
    });
    store.dismiss(progressId);
    store.notify({
      category: 'unknown',
      severity: 'info',
      title: 'Installed — restarting',
      message: `Skillset ${update.version} is installed. Restarting now.`,
      actions: [{ kind: 'dismiss' }],
      details: 'about to relaunch',
      dedupeKey: 'updater.relaunch',
      source: 'appUpdater.install',
    }, { ttlMs: 3000 });
    await relaunch();
  } catch (err) {
    store.dismiss(progressId);
    store.report(err, { source: 'appUpdater.install' });
  }
}
