import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useNotificationStore } from '../stores/notificationStore';

let pendingUpdate: Update | null = null;

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
    // Network or 404 from the manifest endpoint: silent. Don't bother
    // the user; they'll try again on next launch.
    console.warn('[updater] check failed:', err);
    return;
  }
  if (!update) return;

  pendingUpdate = update;

  const notes = update.body?.trim();
  // Title: keep tight + version-forward so the chip-style toast doesn't
  // run the version into the label. Em dashes intentionally avoided per
  // copy guidelines.
  const title = `Skillset v${update.version} is ready`;
  // Message: lead with what Install actually DOES so the user isn't left
  // wondering whether the button opens a browser, the downloads page, or
  // runs the upgrade in-place. Tauri's updater downloads + verifies the
  // signed bundle and relaunches into the new version: no manual step.
  const message = [
    'Click Install to download and apply the update automatically. The app will restart into the new version. No manual download.',
    notes ? `\nWhat's new: ${notes}` : '',
  ].join('');

  useNotificationStore.getState().notify({
    category: 'unknown',
    severity: 'info',
    title,
    message,
    actions: [
      { kind: 'install_update', label: `Install v${update.version}` },
      { kind: 'dismiss' },
    ],
    details: `current=${update.currentVersion} latest=${update.version}\ndate=${update.date ?? 'unknown'}\nbody=${update.body ?? ''}`,
    dedupeKey: `updater.available:${update.version}`,
    source: 'appUpdater.check',
  }, { ttlMs: null });
}

/**
 * Trigger download + install of the pending update surfaced by
 * `checkForUpdateOnLaunch`. No-op if no update is pending (e.g. user
 * clicks Install on a stale toast after a successful install).
 */
export async function installPendingUpdate(): Promise<void> {
  const update = pendingUpdate;
  if (!update) return;
  pendingUpdate = null;
  await installAndRelaunch(update);
}

async function installAndRelaunch(update: Update): Promise<void> {
  const store = useNotificationStore.getState();
  // Show download-in-progress toast.
  const progressId = store.notify({
    category: 'unknown',
    severity: 'info',
    title: `Downloading v${update.version}…`,
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
          title: `Downloading v${update.version}…`,
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
      title: 'Installed. Restarting…',
      message: `Skillset v${update.version} is installed. Restarting now.`,
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
