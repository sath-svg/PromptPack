import { useState, useMemo, useEffect } from 'react';
import { Download, Lock, Check, Package, Cloud, Search } from 'lucide-react';
import { useSyncStore, encodePmtpk, encryptPmtpk, type CloudPrompt, type LoadedPack, type LoadedUserPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { SOURCE_META, type PromptSource } from '../../types';

// Extended prompt type for export that includes pack information
interface ExportablePrompt {
  id: string;
  text: string;
  header?: string;
  source: PromptSource | 'custom';
  createdAt: number;
  packId: string;
  packTitle: string;
  packIcon?: string;
  packType: 'saved' | 'user';
}

export function ExportPage() {
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);

  const { cloudPacks, userPacks, loadedPacks, loadedUserPacks, fetchPackPrompts, fetchUserPackPrompts, fetchAllPacks } = useSyncStore();
  const { session } = useAuthStore();

  // Refresh packs and load all prompts on mount
  useEffect(() => {
    const refreshAndLoadPacks = async () => {
      if (!session?.user_id) return;

      setIsLoadingPacks(true);
      try {
        // First refresh the pack list from cloud (including updated emojis)
        await fetchAllPacks(session.user_id);
      } catch (err) {
        console.error('Failed to refresh packs:', err);
      } finally {
        setIsLoadingPacks(false);
      }
    };

    refreshAndLoadPacks();
  }, [session?.user_id, fetchAllPacks]);

  // Load all pack prompts when cloudPacks or userPacks change
  useEffect(() => {
    const loadAllPackPrompts = async () => {
      const promises: Promise<unknown>[] = [];

      for (const pack of cloudPacks) {
        if (!loadedPacks[pack.id]) {
          promises.push(fetchPackPrompts(pack));
        }
      }

      for (const pack of userPacks) {
        if (!loadedUserPacks[pack.id]) {
          promises.push(fetchUserPackPrompts(pack));
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    if (cloudPacks.length > 0 || userPacks.length > 0) {
      loadAllPackPrompts();
    }
  }, [cloudPacks, userPacks, loadedPacks, loadedUserPacks, fetchPackPrompts, fetchUserPackPrompts]);

  // Build a flat list of exportable prompts from all loaded packs
  const exportablePrompts = useMemo(() => {
    const prompts: ExportablePrompt[] = [];

    // Add prompts from loaded cloud packs (saved packs)
    for (const pack of cloudPacks) {
      const loaded = loadedPacks[pack.id] as LoadedPack | undefined;
      if (loaded?.prompts) {
        loaded.prompts.forEach((prompt, index) => {
          prompts.push({
            id: `${pack.id}-${index}`,
            text: prompt.text,
            header: prompt.header,
            source: pack.source as PromptSource,
            createdAt: prompt.createdAt,
            packId: pack.id,
            packTitle: SOURCE_META[pack.source as PromptSource]?.label || pack.source,
            packType: 'saved',
          });
        });
      }
    }

    // Add prompts from loaded user packs
    for (const pack of userPacks) {
      const loaded = loadedUserPacks[pack.id] as LoadedUserPack | undefined;
      if (loaded?.prompts) {
        loaded.prompts.forEach((prompt, index) => {
          prompts.push({
            id: `${pack.id}-${index}`,
            text: prompt.text,
            header: prompt.header,
            source: 'custom' as const,
            createdAt: prompt.createdAt,
            packId: pack.id,
            packTitle: pack.title,
            packIcon: pack.icon,
            packType: 'user',
          });
        });
      }
    }

    // Sort by createdAt descending
    return prompts.sort((a, b) => b.createdAt - a.createdAt);
  }, [cloudPacks, userPacks, loadedPacks, loadedUserPacks]);

  // Filter prompts based on search query
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return exportablePrompts;

    const query = searchQuery.toLowerCase();
    return exportablePrompts.filter(prompt =>
      prompt.text.toLowerCase().includes(query) ||
      prompt.header?.toLowerCase().includes(query) ||
      prompt.packTitle.toLowerCase().includes(query)
    );
  }, [exportablePrompts, searchQuery]);

  // Count loaded vs total packs
  const loadedCloudPackCount = cloudPacks.filter(p => loadedPacks[p.id]?.prompts?.length).length;
  const loadedUserPackCount = userPacks.filter(p => loadedUserPacks[p.id]?.prompts?.length).length;
  const totalPacks = cloudPacks.length + userPacks.length;
  const loadedPacks2 = loadedCloudPackCount + loadedUserPackCount;

  const togglePrompt = (id: string) => {
    const newSet = new Set(selectedPromptIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPromptIds(newSet);
  };

  const selectAll = () => {
    if (selectedPromptIds.size === filteredPrompts.length && filteredPrompts.length > 0) {
      setSelectedPromptIds(new Set());
    } else {
      setSelectedPromptIds(new Set(filteredPrompts.map((p) => p.id)));
    }
  };

  // Load all packs that haven't been loaded yet
  const loadAllPacks = async () => {
    const promises: Promise<unknown>[] = [];

    for (const pack of cloudPacks) {
      if (!loadedPacks[pack.id]) {
        promises.push(fetchPackPrompts(pack));
      }
    }

    for (const pack of userPacks) {
      if (!loadedUserPacks[pack.id]) {
        promises.push(fetchUserPackPrompts(pack));
      }
    }

    await Promise.all(promises);
  };

  const handleExport = async () => {
    if (selectedPromptIds.size === 0) return;
    if (password && password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setExporting(true);

    try {
      const selectedPrompts = exportablePrompts.filter((p) => selectedPromptIds.has(p.id));

      // Convert to CloudPrompt format for encoding
      const cloudPrompts: CloudPrompt[] = selectedPrompts.map((p) => ({
        text: p.text,
        header: p.header,
        createdAt: p.createdAt,
      }));

      // Encode to .pmtpk format (with or without encryption)
      let encoded: Uint8Array;
      if (password) {
        encoded = await encryptPmtpk(cloudPrompts, 'PromptPack Export', password);
      } else {
        encoded = await encodePmtpk(cloudPrompts, 'PromptPack Export');
      }

      // Create blob and download (ensure regular ArrayBuffer for Blob compatibility)
      const buffer = new ArrayBuffer(encoded.length);
      new Uint8Array(buffer).set(encoded);
      const blob = new Blob([buffer], {
        type: 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptpack-export-${Date.now()}.pmtpk`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const passwordsMatch = !password || password === confirmPassword;
  const canExport = selectedPromptIds.size > 0 && passwordsMatch;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        Export Prompts
      </h2>
      <p className="text-[var(--muted-foreground)] mb-6">
        Select prompts to export as a .pmtpk file. Optionally add password protection.
      </p>

      {/* Pack loading status */}
      {totalPacks > 0 && loadedPacks2 < totalPacks && (
        <div className="mb-4 p-3 bg-[var(--accent)]/50 border border-[var(--border)] rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Cloud size={16} />
            <span>
              {loadedPacks2} of {totalPacks} packs loaded. Load all packs to see all prompts.
            </span>
          </div>
          <button
            onClick={loadAllPacks}
            className="text-sm text-[var(--primary)] hover:underline font-medium"
          >
            Load All Packs
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt Selection */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-[var(--foreground)]">
              Select Prompts ({selectedPromptIds.size} selected)
            </h3>
            <button
              onClick={selectAll}
              className="text-sm text-[var(--primary)] hover:underline"
              disabled={filteredPrompts.length === 0}
            >
              {selectedPromptIds.size === filteredPrompts.length && filteredPrompts.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts by text, header, or pack name..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {searchQuery && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
                {filteredPrompts.length} result{filteredPrompts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="border border-[var(--border)] rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {isLoadingPacks ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading packs...</p>
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                {searchQuery ? (
                  <p>No prompts match "{searchQuery}"</p>
                ) : (
                  <>
                    <p>No prompts available to export.</p>
                    {totalPacks > 0 && (
                      <p className="text-sm mt-2">
                        Click "Load All Packs" above to load your prompts from the cloud.
                      </p>
                    )}
                    {totalPacks === 0 && (
                      <p className="text-sm mt-2">
                        Save some prompts from the extension or create packs in the dashboard first.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              filteredPrompts.map((prompt) => {
                const sourceMeta = prompt.source !== 'custom' ? SOURCE_META[prompt.source] : null;
                const isSelected = selectedPromptIds.has(prompt.id);

                return (
                  <label
                    key={prompt.id}
                    className={`flex items-start gap-3 p-3 border-b border-[var(--border)] last:border-b-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[var(--primary)]/5' : 'hover:bg-[var(--accent)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePrompt(prompt.id)}
                      className="mt-1 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {sourceMeta ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: `${sourceMeta.color}20`,
                              color: sourceMeta.color,
                            }}
                          >
                            {sourceMeta.icon}
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-500"
                          >
                            {prompt.packIcon || '📦'}
                          </span>
                        )}
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {prompt.packTitle}
                        </span>
                        {prompt.header && (
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            • {prompt.header}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {prompt.text}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
              <Lock size={16} />
              Password Protection
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              Optional. Leave empty for unencrypted export.
            </p>

            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className={`w-full px-3 py-2 rounded-lg bg-[var(--background)] border text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${
                  !passwordsMatch ? 'border-red-500' : 'border-[var(--border)]'
                }`}
              />
              {!passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={!canExport || exporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : success ? (
              <>
                <Check size={18} />
                <span>Exported!</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Export {selectedPromptIds.size} Prompts</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-[var(--muted-foreground)]">
            Exports as .pmtpk format{password ? ' (encrypted)' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
