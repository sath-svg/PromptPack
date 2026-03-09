import { useState, useEffect } from 'react';
import { History, ArrowLeft, Trash2, RotateCcw, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useSyncStore, type UserPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import type { PromptVersion } from '../../types';

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

export function PromptControlPage() {
  const { session } = useAuthStore();
  const {
    userPacks,
    loadedUserPacks,
    promptVersions,
    fetchPromptVersions,
    deletePromptVersion,
    updateUserPackPrompt,
    toggleVersionControl,
    error,
    clearError,
  } = useSyncStore();

  const [selectedPack, setSelectedPack] = useState<UserPack | null>(null);
  const [selectedPromptCreatedAt, setSelectedPromptCreatedAt] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const tier = session?.tier || 'free';
  const clerkId = session?.user_id || '';
  const isStudio = tier === 'studio';
  const isPro = tier === 'pro';
  const versionControlLimit = isStudio ? STUDIO_VERSION_CONTROL_LIMIT : isPro ? PRO_VERSION_CONTROL_LIMIT : 0;

  const enabledCount = userPacks.filter((p) => p.versionControlEnabled).length;

  // Fetch prompt versions when a pack is selected
  useEffect(() => {
    if (selectedPack) {
      fetchPromptVersions(selectedPack.id);
    }
  }, [selectedPack?.id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Get prompt versions for current pack, grouped by promptCreatedAt
  const allVersions: PromptVersion[] = selectedPack ? (promptVersions[selectedPack.id] || []) : [];

  const handleToggle = async (pack: UserPack, enabled: boolean) => {
    clearError();
    const ok = await toggleVersionControl(clerkId, pack.id, enabled);
    if (ok) {
      setToast(enabled ? `PromptControl enabled for "${pack.title}"` : `PromptControl disabled for "${pack.title}"`);
    }
  };

  const handleDeleteVersion = async (promptCreatedAt: number, versionNumber: number) => {
    if (!selectedPack) return;
    clearError();
    const ok = await deletePromptVersion(clerkId, selectedPack.id, promptCreatedAt, versionNumber);
    if (ok) {
      setToast(`Deleted v${versionNumber}`);
      setConfirmDelete(null);
    }
  };

  const handleRestore = async (version: PromptVersion) => {
    if (!selectedPack) return;
    clearError();
    // Find the prompt index by createdAt
    const loaded = loadedUserPacks[selectedPack.id];
    if (!loaded) return;
    const promptIndex = loaded.prompts.findIndex((p) => p.createdAt === version.promptCreatedAt);
    if (promptIndex === -1) return;

    const ok = await updateUserPackPrompt(selectedPack.id, promptIndex, version.text);
    if (ok) {
      setToast(`Restored to v${version.versionNumber}`);
      setConfirmRestore(null);
    }
  };

  if (tier === 'free') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">PromptControl</h1>
        <p className="text-[var(--muted-foreground)]">
          Version control for your prompts. Upgrade to Pro to get started.
        </p>
      </div>
    );
  }

  // Toast + Error overlay
  const overlay = (
    <>
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
    </>
  );

  // === VIEW 3: Prompt Version History ===
  if (selectedPack && selectedPromptCreatedAt !== null) {
    const promptVersionsForPrompt = allVersions
      .filter((v) => v.promptCreatedAt === selectedPromptCreatedAt)
      .sort((a, b) => b.versionNumber - a.versionNumber);

    // Find the prompt info
    const loaded = loadedUserPacks[selectedPack.id];
    const currentPrompt = loaded?.prompts.find((p) => p.createdAt === selectedPromptCreatedAt);

    return (
      <div className="p-6 max-w-3xl">
        {overlay}

        <button
          onClick={() => { setSelectedPromptCreatedAt(null); setConfirmDelete(null); setConfirmRestore(null); }}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
        >
          <ArrowLeft size={16} />
          Back to prompts
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">Version History</h1>
          {currentPrompt && (
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] mb-3">
              {currentPrompt.header && (
                <p className="text-xs font-medium text-[var(--primary)] mb-1">{currentPrompt.header}</p>
              )}
              <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap break-words" style={{ lineHeight: '1.4' }}>
                {currentPrompt.text.length > 200 ? currentPrompt.text.slice(0, 200) + '...' : currentPrompt.text}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2 opacity-60">Current version</p>
            </div>
          )}
          <p className="text-sm text-[var(--muted-foreground)]">
            {promptVersionsForPrompt.length}/{MAX_VERSIONS_PER_PACK} versions saved
          </p>
        </div>

        {promptVersionsForPrompt.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <History size={48} className="mx-auto mb-3 opacity-30" />
            <p>No versions saved yet.</p>
            <p className="text-sm mt-1">Versions are auto-saved when you edit this prompt.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {promptVersionsForPrompt.map((v) => (
              <div
                key={v.versionNumber}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[var(--primary)]">
                        v{v.versionNumber}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatRelativeTime(v.savedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {confirmRestore === v.versionNumber ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRestore(v)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
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
                            onClick={() => handleDeleteVersion(v.promptCreatedAt, v.versionNumber)}
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

                  {/* Version text preview */}
                  {v.header && (
                    <p className="text-xs font-medium text-[var(--primary)] mb-1">{v.header}</p>
                  )}
                  <p className="text-[var(--muted-foreground)] whitespace-pre-wrap break-words" style={{ fontSize: '0.8125rem', lineHeight: '1.4' }}>
                    {v.text.length > 500 ? v.text.slice(0, 500) + '...' : v.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // === VIEW 2: Prompt List for selected pack ===
  if (selectedPack) {
    const loaded = loadedUserPacks[selectedPack.id];
    const prompts = loaded?.prompts || [];

    return (
      <div className="p-6 max-w-3xl">
        {overlay}

        <button
          onClick={() => { setSelectedPack(null); }}
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
              {prompts.length} prompts &middot; Select a prompt to view its version history
            </p>
          </div>
        </div>

        {prompts.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p>No prompts in this pack yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {prompts.map((prompt, i) => {
              const versionCount = allVersions.filter((v) => v.promptCreatedAt === prompt.createdAt).length;
              return (
                <button
                  key={prompt.createdAt}
                  onClick={() => setSelectedPromptCreatedAt(prompt.createdAt)}
                  className="w-full text-left p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--primary)]">
                      {prompt.header || `Prompt ${i + 1}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {versionCount}/{MAX_VERSIONS_PER_PACK} versions
                      </span>
                      <ChevronRight size={14} className="text-[var(--muted-foreground)]" />
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate" style={{ lineHeight: '1.4' }}>
                    {prompt.text.length > 150 ? prompt.text.slice(0, 150) + '...' : prompt.text}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // === VIEW 1: Pack List ===
  return (
    <div className="p-6 max-w-3xl">
      {overlay}

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History size={24} />
          PromptControl
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Version control for your prompts. Each prompt can store up to {MAX_VERSIONS_PER_PACK} versions.
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
                    </p>
                  </div>
                </button>

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
