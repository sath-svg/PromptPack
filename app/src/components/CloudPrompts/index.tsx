import { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Lock, Unlock, ChevronDown, ChevronRight, Copy, Check, AlertCircle } from 'lucide-react';
import { useSyncStore, type CloudPack, type LoadedPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { SOURCE_META } from '../../types';
import type { PromptSource } from '../../types';

export function CloudPromptsPage() {
  const { session } = useAuthStore();
  const {
    cloudPacks,
    loadedPacks,
    isLoading,
    isFetching,
    lastSyncAt,
    error,
    fetchCloudPacks,
    fetchPackPrompts,
    clearError,
  } = useSyncStore();

  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-sync when user signs in
  useEffect(() => {
    if (session?.user_id && cloudPacks.length === 0 && !isLoading) {
      fetchCloudPacks(session.user_id);
    }
  }, [session?.user_id]);

  const handleSync = () => {
    if (session?.user_id) {
      fetchCloudPacks(session.user_id);
    }
  };

  const handlePackClick = async (pack: CloudPack) => {
    if (expandedPack === pack.id) {
      setExpandedPack(null);
      return;
    }

    setExpandedPack(pack.id);

    // Check if already loaded
    const loaded = loadedPacks[pack.id];
    if (loaded && loaded.prompts.length > 0) {
      return;
    }

    // Fetch pack prompts
    await fetchPackPrompts(pack);
  };

  const handleDecrypt = async (pack: CloudPack) => {
    const password = passwordInputs[pack.id];
    if (!password) return;

    await fetchPackPrompts(pack, password);
    // Clear password input after attempt
    setPasswordInputs((prev) => ({ ...prev, [pack.id]: '' }));
  };

  const handleCopy = async (text: string, promptId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(promptId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Cloud size={48} className="text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          Sign in to sync your prompts
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-md">
          Connect your PromptPack account to sync prompts saved from the browser extension
          across all your devices.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Cloud size={24} />
            Cloud Prompts
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Prompts saved from your browser extension
          </p>
        </div>

        <div className="flex items-center gap-4">
          {lastSyncAt && (
            <span className="text-xs text-[var(--muted-foreground)]">
              Last synced: {formatDate(lastSyncAt)}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={18} className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="ml-auto text-xs text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cloudPacks.length === 0 && (
        <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
          <Cloud size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No cloud prompts yet
          </h3>
          <p className="text-[var(--muted-foreground)] max-w-sm mx-auto">
            Save prompts using the PromptPack browser extension to see them here.
          </p>
        </div>
      )}

      {/* Packs list */}
      <div className="space-y-4">
        {cloudPacks.map((pack) => {
          const meta = SOURCE_META[pack.source as PromptSource];
          const loaded = loadedPacks[pack.id];
          const isExpanded = expandedPack === pack.id;
          const isFetchingPack = isFetching[pack.id];
          const needsPassword = loaded?.isEncrypted && loaded.prompts.length === 0;

          return (
            <div
              key={pack.id}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
            >
              {/* Pack header */}
              <button
                onClick={() => handlePackClick(pack)}
                disabled={isFetchingPack}
                className="w-full flex items-center gap-4 p-4 hover:bg-[var(--accent)]/50 transition-colors text-left"
              >
                <span className="text-2xl">{meta?.icon || '📦'}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">
                    {meta?.label || pack.source}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {pack.promptCount} prompt{pack.promptCount !== 1 ? 's' : ''} &middot;{' '}
                    Updated {formatDate(pack.updatedAt)}
                  </p>
                </div>
                {loaded?.isEncrypted && (
                  <Lock size={16} className="text-[var(--muted-foreground)]" />
                )}
                {isFetchingPack ? (
                  <RefreshCw size={18} className="animate-spin text-[var(--muted-foreground)]" />
                ) : isExpanded ? (
                  <ChevronDown size={18} className="text-[var(--muted-foreground)]" />
                ) : (
                  <ChevronRight size={18} className="text-[var(--muted-foreground)]" />
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-[var(--border)]">
                  {/* Password prompt for encrypted packs */}
                  {needsPassword && (
                    <div className="p-4 bg-[var(--accent)]/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Lock size={16} className="text-[var(--muted-foreground)]" />
                        <span className="text-sm text-[var(--foreground)]">
                          This pack is encrypted
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={passwordInputs[pack.id] || ''}
                          onChange={(e) =>
                            setPasswordInputs((prev) => ({
                              ...prev,
                              [pack.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleDecrypt(pack)}
                          placeholder="Enter password"
                          className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                        />
                        <button
                          onClick={() => handleDecrypt(pack)}
                          disabled={!passwordInputs[pack.id]}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <Unlock size={16} />
                          Unlock
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Prompts list */}
                  {loaded && loaded.prompts.length > 0 && (
                    <div className="divide-y divide-[var(--border)]">
                      {loaded.prompts.map((prompt, index) => (
                        <div key={index} className="p-4 hover:bg-[var(--accent)]/30 transition-colors">
                          {prompt.header && (
                            <p className="text-xs font-medium text-[var(--primary)] mb-1">
                              {prompt.header}
                            </p>
                          )}
                          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap line-clamp-3">
                            {prompt.text}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {formatDate(prompt.createdAt)}
                            </span>
                            <button
                              onClick={() => handleCopy(prompt.text, `${pack.id}-${index}`)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            >
                              {copiedId === `${pack.id}-${index}` ? (
                                <>
                                  <Check size={14} className="text-green-500" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Loading state */}
                  {isFetchingPack && (
                    <div className="p-8 text-center">
                      <RefreshCw size={24} className="animate-spin mx-auto text-[var(--muted-foreground)]" />
                      <p className="text-sm text-[var(--muted-foreground)] mt-2">
                        Loading prompts...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {cloudPacks.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {cloudPacks.reduce((sum, p) => sum + p.promptCount, 0)} total prompts across{' '}
            {cloudPacks.length} pack{cloudPacks.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
