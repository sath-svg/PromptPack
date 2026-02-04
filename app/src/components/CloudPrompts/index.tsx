import { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Lock, Unlock, ChevronDown, ChevronRight, Copy, Check, AlertCircle, Package, Pencil, ChartNoAxesCombined, X, Save, Plus, Download } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useSyncStore, encodePmtpk, encryptPmtpk, type CloudPack, type UserPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { SOURCE_META } from '../../types';
import type { PromptSource } from '../../types';
import { PASSWORD_MAX_LENGTH, isValidPassword } from '../../lib/constants';

export function CloudPromptsPage() {
  const { session } = useAuthStore();
  const {
    cloudPacks,
    userPacks,
    loadedPacks,
    loadedUserPacks,
    selectedPackId,
    isLoading,
    isFetching,
    isSaving,
    generatingHeaders,
    lastSyncAt,
    error,
    fetchAllPacks,
    fetchPackPrompts,
    fetchUserPackPrompts,
    updateUserPackPrompt,
    updateUserPackHeader,
    generateUserPackHeader,
    generateMissingUserPackHeaders,
    updateSavedPackPrompt,
    updateSavedPackHeader,
    generateSavedPackHeader,
    generateMissingSavedPackHeaders,
    addUserPackPrompt,
    addSavedPackPrompt,
    setSelectedPackId,
    clearError,
  } = useSyncStore();

  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editing state - track pack type to know which functions to call
  const [editingPrompt, setEditingPrompt] = useState<{ packId: string; index: number; packType: 'user' | 'saved' } | null>(null);
  const [editingHeader, setEditingHeader] = useState<{ packId: string; index: number; packType: 'user' | 'saved' } | null>(null);
  const [promptDraft, setPromptDraft] = useState('');
  const [headerDraft, setHeaderDraft] = useState('');

  // New prompt state
  const [addingPrompt, setAddingPrompt] = useState<{ packId: string; packType: 'user' | 'saved' } | null>(null);
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptHeader, setNewPromptHeader] = useState('');

  // Export state
  const [showExportModal, setShowExportModal] = useState<{ packId: string; packType: 'user' | 'saved'; title: string } | null>(null);
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Auto-sync when user signs in
  useEffect(() => {
    if (session?.user_id && cloudPacks.length === 0 && userPacks.length === 0 && !isLoading) {
      fetchAllPacks(session.user_id);
    }
  }, [session?.user_id]);

  // Auto-expand selected pack from sidebar
  useEffect(() => {
    if (selectedPackId && selectedPackId !== expandedPack) {
      // Find if it's a userPack or cloudPack
      const userPack = userPacks.find(p => p.id === selectedPackId);
      const cloudPack = cloudPacks.find(p => p.id === selectedPackId);

      if (userPack) {
        setExpandedPack(selectedPackId);
        // Fetch prompts if not loaded
        if (!loadedUserPacks[selectedPackId]) {
          fetchUserPackPrompts(userPack);
        }
      } else if (cloudPack) {
        setExpandedPack(selectedPackId);
        if (!loadedPacks[selectedPackId]) {
          fetchPackPrompts(cloudPack);
        }
      }
    }
  }, [selectedPackId, userPacks, cloudPacks]);

  // Auto-generate missing headers when a pack is expanded
  useEffect(() => {
    if (expandedPack) {
      // Check if it's a userPack
      const loadedUser = loadedUserPacks[expandedPack];
      if (loadedUser && loadedUser.prompts.some(p => !p.header)) {
        const timer = setTimeout(() => {
          generateMissingUserPackHeaders(expandedPack);
        }, 500);
        return () => clearTimeout(timer);
      }

      // Check if it's a savedPack
      const loadedSaved = loadedPacks[expandedPack];
      if (loadedSaved && loadedSaved.prompts.some(p => !p.header)) {
        const timer = setTimeout(() => {
          generateMissingSavedPackHeaders(expandedPack);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [expandedPack, loadedUserPacks, loadedPacks]);

  const handleSync = () => {
    if (session?.user_id) {
      fetchAllPacks(session.user_id);
    }
  };

  const handlePackClick = async (pack: CloudPack) => {
    if (expandedPack === pack.id) {
      setExpandedPack(null);
      setSelectedPackId(null);
      return;
    }

    setExpandedPack(pack.id);
    setSelectedPackId(pack.id);

    // Check if already loaded
    const loaded = loadedPacks[pack.id];
    if (loaded && loaded.prompts.length > 0) {
      return;
    }

    // Fetch pack prompts
    await fetchPackPrompts(pack);
  };

  const handleUserPackClick = async (pack: UserPack) => {
    if (expandedPack === pack.id) {
      setExpandedPack(null);
      setSelectedPackId(null);
      return;
    }

    setExpandedPack(pack.id);
    setSelectedPackId(pack.id);

    // Check if already loaded
    const loaded = loadedUserPacks[pack.id];
    if (loaded && loaded.prompts.length > 0) {
      return;
    }

    // Fetch pack prompts
    await fetchUserPackPrompts(pack);
  };

  const handleDecrypt = async (pack: CloudPack) => {
    const password = passwordInputs[pack.id];
    if (!password) return;

    await fetchPackPrompts(pack, password);
    // Clear password input after attempt
    setPasswordInputs((prev) => ({ ...prev, [pack.id]: '' }));
  };

  const handleUserPackDecrypt = async (pack: UserPack) => {
    const password = passwordInputs[pack.id];
    if (!password) return;

    await fetchUserPackPrompts(pack, password);
    // Clear password input after attempt
    setPasswordInputs((prev) => ({ ...prev, [pack.id]: '' }));
  };

  const handleCopy = async (text: string, promptId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(promptId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Edit handlers
  const startEditPrompt = (packId: string, index: number, text: string, packType: 'user' | 'saved') => {
    setEditingPrompt({ packId, index, packType });
    setPromptDraft(text);
    setEditingHeader(null);
  };

  const cancelEditPrompt = () => {
    setEditingPrompt(null);
    setPromptDraft('');
  };

  const saveEditPrompt = async () => {
    if (!editingPrompt || !promptDraft.trim()) return;

    const success = editingPrompt.packType === 'user'
      ? await updateUserPackPrompt(editingPrompt.packId, editingPrompt.index, promptDraft.trim())
      : await updateSavedPackPrompt(editingPrompt.packId, editingPrompt.index, promptDraft.trim());

    if (success) {
      setEditingPrompt(null);
      setPromptDraft('');
    }
  };

  const startEditHeader = (packId: string, index: number, header: string, packType: 'user' | 'saved') => {
    setEditingHeader({ packId, index, packType });
    setHeaderDraft(header);
    setEditingPrompt(null);
  };

  const cancelEditHeader = () => {
    setEditingHeader(null);
    setHeaderDraft('');
  };

  const saveEditHeader = async () => {
    if (!editingHeader) return;

    const success = editingHeader.packType === 'user'
      ? await updateUserPackHeader(editingHeader.packId, editingHeader.index, headerDraft.trim())
      : await updateSavedPackHeader(editingHeader.packId, editingHeader.index, headerDraft.trim());

    if (success) {
      setEditingHeader(null);
      setHeaderDraft('');
    }
  };

  const handleGenerateHeader = async (packId: string, index: number, promptText: string, packType: 'user' | 'saved') => {
    if (packType === 'user') {
      await generateUserPackHeader(packId, index, promptText);
    } else {
      await generateSavedPackHeader(packId, index, promptText);
    }
  };

  // Add prompt handlers
  const startAddPrompt = (packId: string, packType: 'user' | 'saved') => {
    setAddingPrompt({ packId, packType });
    setNewPromptText('');
    setNewPromptHeader('');
    setEditingPrompt(null);
    setEditingHeader(null);
  };

  const cancelAddPrompt = () => {
    setAddingPrompt(null);
    setNewPromptText('');
    setNewPromptHeader('');
  };

  const saveNewPrompt = async () => {
    if (!addingPrompt || !newPromptText.trim()) return;

    const success = addingPrompt.packType === 'user'
      ? await addUserPackPrompt(addingPrompt.packId, newPromptText.trim(), newPromptHeader.trim() || undefined)
      : await addSavedPackPrompt(addingPrompt.packId, newPromptText.trim(), newPromptHeader.trim() || undefined);

    if (success) {
      setAddingPrompt(null);
      setNewPromptText('');
      setNewPromptHeader('');
    }
  };

  // Export handlers
  const openExportModal = (packId: string, packType: 'user' | 'saved', title: string) => {
    setExportPassword('');
    setExportError(null);
    setShowExportModal({ packId, packType, title });
  };

  const closeExportModal = () => {
    setShowExportModal(null);
    setExportPassword('');
    setExportError(null);
  };

  const handleExport = async () => {
    if (!showExportModal) return;

    const { packId, packType, title } = showExportModal;
    const loaded = packType === 'user' ? loadedUserPacks[packId] : loadedPacks[packId];

    if (!loaded || loaded.prompts.length === 0) {
      setExportError('No prompts to export');
      return;
    }

    // Validate password if provided
    if (exportPassword && !isValidPassword(exportPassword)) {
      setExportError(`Password must be ${PASSWORD_MAX_LENGTH} characters or less`);
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      // Generate the .pmtpk file data
      let fileData: Uint8Array;
      if (exportPassword) {
        fileData = await encryptPmtpk(loaded.prompts, title, exportPassword);
      } else {
        fileData = await encodePmtpk(loaded.prompts, title);
      }

      // Open native save dialog
      const filePath = await save({
        defaultPath: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pmtpk`,
        filters: [{ name: 'PromptPack', extensions: ['pmtpk'] }],
      });

      if (filePath) {
        // Write the file
        await writeFile(filePath, fileData);
        closeExportModal();
      }
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isGeneratingHeader = (packId: string, index: number) => {
    const set = generatingHeaders[packId];
    return set?.has(index) ?? false;
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
            Synced from your browser extension and web dashboard
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
      {!isLoading && cloudPacks.length === 0 && userPacks.length === 0 && (
        <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
          <Cloud size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No cloud prompts yet
          </h3>
          <p className="text-[var(--muted-foreground)] max-w-sm mx-auto">
            Save prompts using the browser extension or create prompt packs on the web dashboard to see them here.
          </p>
        </div>
      )}

      {/* Saved Packs Section (from browser extension) */}
      {cloudPacks.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Cloud size={20} />
            Saved from Extension
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Prompts saved from the browser extension
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
          const isSavingPack = isSaving[pack.id];
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
                  {/* Saving indicator */}
                  {isSavingPack && (
                    <div className="px-4 py-2 bg-[var(--primary)]/10 text-xs text-[var(--primary)] flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin" />
                      Saving changes...
                    </div>
                  )}

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
                      {loaded.prompts.map((prompt, index) => {
                        const isEditingThisPrompt = editingPrompt?.packId === pack.id && editingPrompt?.index === index;
                        const isEditingThisHeader = editingHeader?.packId === pack.id && editingHeader?.index === index;
                        const isGenerating = isGeneratingHeader(pack.id, index);

                        return (
                          <div key={index} className="group p-4 hover:bg-[var(--accent)]/30 transition-colors">
                            {/* Header section */}
                            <div className="flex items-center gap-2 mb-1">
                              {isEditingThisHeader ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={headerDraft}
                                    onChange={(e) => setHeaderDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditHeader();
                                      if (e.key === 'Escape') cancelEditHeader();
                                    }}
                                    placeholder="Header"
                                    className="flex-1 px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                                    autoFocus
                                  />
                                  <button onClick={saveEditHeader} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                    <Save size={14} />
                                  </button>
                                  <button onClick={cancelEditHeader} className="p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] rounded">
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : prompt.header ? (
                                <>
                                  <p className="text-xs font-medium text-[var(--primary)]">
                                    {prompt.header}
                                  </p>
                                  <button
                                    onClick={() => startEditHeader(pack.id, index, prompt.header || '', 'saved')}
                                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit header"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleGenerateHeader(pack.id, index, prompt.text, 'saved')}
                                    disabled={isGenerating}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded disabled:opacity-50"
                                  >
                                    {isGenerating ? (
                                      <RefreshCw size={12} className="animate-spin" />
                                    ) : (
                                      <ChartNoAxesCombined size={12} />
                                    )}
                                    {isGenerating ? 'Generating...' : 'Generate header'}
                                  </button>
                                  <button
                                    onClick={() => startEditHeader(pack.id, index, '', 'saved')}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded"
                                  >
                                    Add header
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Prompt text section */}
                            {isEditingThisPrompt ? (
                              <div className="mt-2">
                                <textarea
                                  value={promptDraft}
                                  onChange={(e) => setPromptDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEditPrompt();
                                    if (e.key === 'Escape') cancelEditPrompt();
                                  }}
                                  rows={4}
                                  className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] resize-none"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={saveEditPrompt}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90"
                                  >
                                    <Save size={12} />
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditPrompt}
                                    className="px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                  >
                                    Cancel
                                  </button>
                                  <span className="text-xs text-[var(--muted-foreground)]">
                                    Ctrl+Enter to save
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                                {prompt.text}
                              </p>
                            )}

                            {/* Actions */}
                            {!isEditingThisPrompt && (
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {formatDate(prompt.createdAt)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEditPrompt(pack.id, index, prompt.text, 'saved')}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    title="Edit prompt"
                                  >
                                    <Pencil size={14} />
                                  </button>
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
                            )}
                          </div>
                        );
                      })}

                      {/* Add Prompt Form */}
                      {addingPrompt?.packId === pack.id && addingPrompt?.packType === 'saved' && (
                        <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/30">
                          <div className="mb-3">
                            <input
                              type="text"
                              value={newPromptHeader}
                              onChange={(e) => setNewPromptHeader(e.target.value)}
                              placeholder="Header (optional - will auto-generate if empty)"
                              className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                            />
                          </div>
                          <textarea
                            value={newPromptText}
                            onChange={(e) => setNewPromptText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNewPrompt();
                              if (e.key === 'Escape') cancelAddPrompt();
                            }}
                            rows={4}
                            placeholder="Enter your prompt text..."
                            className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={saveNewPrompt}
                              disabled={!newPromptText.trim() || isSavingPack}
                              className="flex items-center gap-1 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                              {isSavingPack ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Save size={14} />
                              )}
                              {isSavingPack ? 'Saving...' : 'Add Prompt'}
                            </button>
                            <button
                              onClick={cancelAddPrompt}
                              className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            >
                              Cancel
                            </button>
                            <span className="text-xs text-[var(--muted-foreground)] ml-auto">
                              Ctrl+Enter to save
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Add Prompt Button */}
                      {!addingPrompt && (
                        <div className="p-3 border-t border-[var(--border)] flex items-center justify-between">
                          <button
                            onClick={() => startAddPrompt(pack.id, 'saved')}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                            Add Prompt
                          </button>
                          <button
                            onClick={() => openExportModal(pack.id, 'saved', meta?.label || pack.source)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
                            title="Export pack"
                          >
                            <Download size={16} />
                            Export
                          </button>
                        </div>
                      )}
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

      {/* User Packs Section */}
      {userPacks.length > 0 && (
        <>
          <div className="mt-8 mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Package size={20} />
              Your Prompt Packs
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Prompt packs created on the web dashboard
            </p>
          </div>

          <div className="space-y-4">
            {userPacks.map((pack) => {
              const loaded = loadedUserPacks[pack.id];
              const isExpanded = expandedPack === pack.id;
              const isFetchingPack = isFetching[pack.id];
              const isSavingPack = isSaving[pack.id];
              const needsPassword = loaded?.isEncrypted && loaded.prompts.length === 0;

              return (
                <div
                  key={pack.id}
                  className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
                >
                  {/* Pack header */}
                  <button
                    onClick={() => handleUserPackClick(pack)}
                    disabled={isFetchingPack}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[var(--accent)]/50 transition-colors text-left"
                  >
                    <span className="text-2xl">📦</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--foreground)]">
                        {pack.title}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {pack.promptCount} prompt{pack.promptCount !== 1 ? 's' : ''}
                        {pack.category && ` · ${pack.category}`}
                        {' · '}Updated {formatDate(pack.updatedAt)}
                      </p>
                      {pack.description && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-1">
                          {pack.description}
                        </p>
                      )}
                    </div>
                    {pack.isEncrypted && (
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
                      {/* Saving indicator */}
                      {isSavingPack && (
                        <div className="px-4 py-2 bg-[var(--primary)]/10 text-xs text-[var(--primary)] flex items-center gap-2">
                          <RefreshCw size={12} className="animate-spin" />
                          Saving changes...
                        </div>
                      )}

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
                              onKeyDown={(e) => e.key === 'Enter' && handleUserPackDecrypt(pack)}
                              placeholder="Enter password"
                              className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                            />
                            <button
                              onClick={() => handleUserPackDecrypt(pack)}
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
                          {loaded.prompts.map((prompt, index) => {
                            const isEditingThisPrompt = editingPrompt?.packId === pack.id && editingPrompt?.index === index;
                            const isEditingThisHeader = editingHeader?.packId === pack.id && editingHeader?.index === index;
                            const isGenerating = isGeneratingHeader(pack.id, index);

                            return (
                              <div key={index} className="group p-4 hover:bg-[var(--accent)]/30 transition-colors">
                                {/* Header section */}
                                <div className="flex items-center gap-2 mb-1">
                                  {isEditingThisHeader ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="text"
                                        value={headerDraft}
                                        onChange={(e) => setHeaderDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEditHeader();
                                          if (e.key === 'Escape') cancelEditHeader();
                                        }}
                                        placeholder="Header"
                                        className="flex-1 px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                                        autoFocus
                                      />
                                      <button onClick={saveEditHeader} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                        <Save size={14} />
                                      </button>
                                      <button onClick={cancelEditHeader} className="p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] rounded">
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : prompt.header ? (
                                    <>
                                      <p className="text-xs font-medium text-[var(--primary)]">
                                        {prompt.header}
                                      </p>
                                      <button
                                        onClick={() => startEditHeader(pack.id, index, prompt.header || '', 'user')}
                                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Edit header"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleGenerateHeader(pack.id, index, prompt.text, 'user')}
                                        disabled={isGenerating}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded disabled:opacity-50"
                                      >
                                        {isGenerating ? (
                                          <RefreshCw size={12} className="animate-spin" />
                                        ) : (
                                          <ChartNoAxesCombined size={12} />
                                        )}
                                        {isGenerating ? 'Generating...' : 'Generate header'}
                                      </button>
                                      <button
                                        onClick={() => startEditHeader(pack.id, index, '', 'user')}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded"
                                      >
                                        Add header
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Prompt text section */}
                                {isEditingThisPrompt ? (
                                  <div className="mt-2">
                                    <textarea
                                      value={promptDraft}
                                      onChange={(e) => setPromptDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEditPrompt();
                                        if (e.key === 'Escape') cancelEditPrompt();
                                      }}
                                      rows={4}
                                      className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] resize-none"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        onClick={saveEditPrompt}
                                        className="flex items-center gap-1 px-3 py-1 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90"
                                      >
                                        <Save size={12} />
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditPrompt}
                                        className="px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                      >
                                        Cancel
                                      </button>
                                      <span className="text-xs text-[var(--muted-foreground)]">
                                        Ctrl+Enter to save
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                                    {prompt.text}
                                  </p>
                                )}

                                {/* Actions */}
                                {!isEditingThisPrompt && (
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-[var(--muted-foreground)]">
                                      {formatDate(prompt.createdAt)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => startEditPrompt(pack.id, index, prompt.text, 'user')}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                        title="Edit prompt"
                                      >
                                        <Pencil size={14} />
                                      </button>
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
                                )}
                              </div>
                            );
                          })}

                          {/* Add Prompt Form */}
                          {addingPrompt?.packId === pack.id && addingPrompt?.packType === 'user' && (
                            <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/30">
                              <div className="mb-3">
                                <input
                                  type="text"
                                  value={newPromptHeader}
                                  onChange={(e) => setNewPromptHeader(e.target.value)}
                                  placeholder="Header (optional - will auto-generate if empty)"
                                  className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                                />
                              </div>
                              <textarea
                                value={newPromptText}
                                onChange={(e) => setNewPromptText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNewPrompt();
                                  if (e.key === 'Escape') cancelAddPrompt();
                                }}
                                rows={4}
                                placeholder="Enter your prompt text..."
                                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
                                autoFocus
                              />
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={saveNewPrompt}
                                  disabled={!newPromptText.trim() || isSavingPack}
                                  className="flex items-center gap-1 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
                                >
                                  {isSavingPack ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                  ) : (
                                    <Save size={14} />
                                  )}
                                  {isSavingPack ? 'Saving...' : 'Add Prompt'}
                                </button>
                                <button
                                  onClick={cancelAddPrompt}
                                  className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                >
                                  Cancel
                                </button>
                                <span className="text-xs text-[var(--muted-foreground)] ml-auto">
                                  Ctrl+Enter to save
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Add Prompt Button */}
                          {!addingPrompt && (
                            <div className="p-3 border-t border-[var(--border)] flex items-center justify-between">
                              <button
                                onClick={() => startAddPrompt(pack.id, 'user')}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                              >
                                <Plus size={16} />
                                Add Prompt
                              </button>
                              <button
                                onClick={() => openExportModal(pack.id, 'user', pack.title)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
                                title="Export pack"
                              >
                                <Download size={16} />
                                Export
                              </button>
                            </div>
                          )}
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
        </>
      )}

      {/* Summary */}
      {(cloudPacks.length > 0 || userPacks.length > 0) && (
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {cloudPacks.reduce((sum, p) => sum + p.promptCount, 0) + userPacks.reduce((sum, p) => sum + p.promptCount, 0)} total prompts across{' '}
            {cloudPacks.length + userPacks.length} pack{(cloudPacks.length + userPacks.length) !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Export Pack</h3>
              <button
                onClick={closeExportModal}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Export "{showExportModal.title}" as a .pmtpk file. You can optionally add a password to encrypt the file.
            </p>

            {exportError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-sm text-red-400">{exportError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Password (optional)
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExport()}
                    placeholder="Leave empty for no encryption"
                    maxLength={PASSWORD_MAX_LENGTH}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Max {PASSWORD_MAX_LENGTH} characters. The recipient will need this password to open the file.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeExportModal}
                  className="flex-1 px-4 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
