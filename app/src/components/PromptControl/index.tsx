import { useState, useEffect } from 'react';
import { History, ArrowLeft, Trash2, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSyncStore, type UserPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';

import {
  PRO_VERSION_CONTROL_LIMIT,
  STUDIO_VERSION_CONTROL_LIMIT,
  MAX_VERSIONS_PER_PACK,
} from '../../lib/constants';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PromptControlPage() {
  const { session } = useAuthStore();
  const {
    userPacks,
    packVersions,
    fetchPackVersions,

    restorePackVersion,
    deletePackVersion,
    toggleVersionControl,
    isSaving,
    error,
    clearError,
  } = useSyncStore();

  const [selectedPack, setSelectedPack] = useState<UserPack | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const tier = session?.tier || 'free';
  const clerkId = session?.user_id || '';
  const isStudio = tier === 'studio';
  const isPro = tier === 'pro';
  const versionControlLimit = isStudio ? STUDIO_VERSION_CONTROL_LIMIT : isPro ? PRO_VERSION_CONTROL_LIMIT : 0;

  const enabledCount = userPacks.filter((p) => p.versionControlEnabled).length;

  // Fetch versions when a pack is selected
  useEffect(() => {
    if (selectedPack) {
      fetchPackVersions(selectedPack.id);
    }
  }, [selectedPack?.id]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const versions = selectedPack ? (packVersions[selectedPack.id] || []) : [];

  const handleToggle = async (pack: UserPack, enabled: boolean) => {
    clearError();
    const ok = await toggleVersionControl(clerkId, pack.id, enabled);
    if (ok) {
      setToast(enabled ? `PromptControl enabled for "${pack.title}"` : `PromptControl disabled for "${pack.title}"`);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (!selectedPack) return;
    clearError();
    const ok = await restorePackVersion(clerkId, selectedPack.id, versionNumber);
    if (ok) {
      setToast(`Restored to v${versionNumber}`);
      setConfirmRestore(null);
    }
  };

  const handleDelete = async (versionNumber: number) => {
    if (!selectedPack) return;
    clearError();
    const ok = await deletePackVersion(clerkId, selectedPack.id, versionNumber);
    if (ok) {
      setToast(`Deleted v${versionNumber}`);
      setConfirmDelete(null);
    }
  };

  if (tier === 'free') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">PromptControl</h1>
        <p className="text-[var(--muted-foreground)]">
          Version control for your PromptPacks. Upgrade to Pro to get started.
        </p>
      </div>
    );
  }

  // Version History View
  if (selectedPack) {
    return (
      <div className="p-6 max-w-3xl">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            {toast}
          </div>
        )}
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={() => { setSelectedPack(null); setConfirmRestore(null); setConfirmDelete(null); }}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
        >
          <ArrowLeft size={16} />
          Back to packs
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{selectedPack.icon || '📦'}</span>
          <div>
            <h1 className="text-xl font-bold">{selectedPack.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {versions.length}/{MAX_VERSIONS_PER_PACK} versions saved &middot; {selectedPack.promptCount} prompts
            </p>
          </div>
        </div>

        {versions.length >= MAX_VERSIONS_PER_PACK && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-500">
            Version limit reached ({MAX_VERSIONS_PER_PACK}/{MAX_VERSIONS_PER_PACK}). Delete old versions to continue auto-saving.
          </div>
        )}

        {versions.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <History size={48} className="mx-auto mb-3 opacity-30" />
            <p>No versions saved yet.</p>
            <p className="text-sm mt-1">Versions are auto-saved when you edit prompts in this pack.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.versionNumber}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-[var(--primary)]">
                      v{v.versionNumber}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatRelativeTime(v.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                    {v.message || 'Auto-saved'} &middot; {v.promptCount} prompts &middot; {formatBytes(v.fileSize)}
                  </p>
                </div>

                <div className="flex items-center gap-1 ml-3">
                  {confirmRestore === v.versionNumber ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestore(v.versionNumber)}
                        disabled={isSaving[selectedPack.id]}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmRestore(null)}
                        className="px-2 py-1 text-xs bg-[var(--accent)] rounded hover:opacity-80"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmRestore(v.versionNumber); setConfirmDelete(null); }}
                      className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      title="Restore this version"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}

                  {confirmDelete === v.versionNumber ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(v.versionNumber)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs bg-[var(--accent)] rounded hover:opacity-80"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDelete(v.versionNumber); setConfirmRestore(null); }}
                      className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-red-400"
                      title="Delete this version"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Pack List View
  return (
    <div className="p-6 max-w-3xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History size={24} />
          PromptControl
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Version control for your PromptPacks. Each pack can store up to {MAX_VERSIONS_PER_PACK} version snapshots.
        </p>
        {isPro && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Pro plan: {enabledCount}/{versionControlLimit} pack with version control enabled.
          </p>
        )}
      </div>

      {userPacks.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          <p>No custom packs yet. Create a PromptPack first to enable version control.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {userPacks.map((pack) => {
            const isEnabled = isStudio || pack.versionControlEnabled;
            const canEnable = isStudio || enabledCount < versionControlLimit;
            const versionCount = packVersions[pack.id]?.length ?? 0;

            return (
              <div
                key={pack.id}
                className={`flex items-center justify-between p-4 rounded-lg border bg-[var(--card)] transition-colors ${
                  isEnabled ? 'border-[var(--primary)]/30' : 'border-[var(--border)]'
                }`}
              >
                <button
                  onClick={() => isEnabled ? setSelectedPack(pack) : undefined}
                  className={`flex items-center gap-3 flex-1 min-w-0 text-left ${isEnabled ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                  disabled={!isEnabled}
                >
                  <span className="text-2xl">{pack.icon || '📦'}</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{pack.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {pack.promptCount} prompts
                      {isEnabled && ` \u00b7 ${versionCount}/${MAX_VERSIONS_PER_PACK} versions`}
                    </p>
                  </div>
                </button>

                {/* Toggle for Pro (Studio has all enabled by default) */}
                {!isStudio && (
                  <button
                    onClick={() => handleToggle(pack, !pack.versionControlEnabled)}
                    disabled={!pack.versionControlEnabled && !canEnable}
                    className={`flex-shrink-0 ml-3 ${
                      !pack.versionControlEnabled && !canEnable ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    title={pack.versionControlEnabled ? 'Disable version control' : canEnable ? 'Enable version control' : 'Disable version control on another pack first'}
                  >
                    {pack.versionControlEnabled ? (
                      <ToggleRight size={28} className="text-[var(--primary)]" />
                    ) : (
                      <ToggleLeft size={28} className="text-[var(--muted-foreground)]" />
                    )}
                  </button>
                )}

                {isStudio && (
                  <span className="flex-shrink-0 ml-3 text-xs text-[var(--primary)] font-medium">
                    Always on
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
