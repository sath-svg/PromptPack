import { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Lock, Unlock, Copy, Check, AlertCircle, Pencil, ChartNoAxesCombined, X, Save, Plus, ChevronLeft, Trash2 } from 'lucide-react';
import { useSyncStore, type CloudPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { usePromptStore } from '../../stores/promptStore';
import { usePromptLimits } from '../../hooks/usePromptLimits';
import { SOURCE_META } from '../../types';
import type { PromptSource } from '../../types';
import { parseTemplateVariables, replaceTemplateVariables } from '../../lib/templateParser';
import { TemplateInputDialog } from '../TemplateInputDialog';

export function SavedPacksPage() {
  const { session } = useAuthStore();
  const { searchQuery } = usePromptStore();
  const {
    cloudPacks,
    loadedPacks,
    selectedPackId,
    isLoading,
    isFetching,
    isSaving,
    generatingHeaders,
    lastSyncAt,
    error,
    fetchAllPacks,
    fetchPackPrompts,
    updateSavedPackPrompt,
    updateSavedPackHeader,
    generateSavedPackHeader,
    generateMissingSavedPackHeaders,
    addSavedPackPrompt,
    deleteSavedPackPrompt,
    deleteSavedPack,
    setSelectedPackId,
    clearError,
  } = useSyncStore();

  const [selectedPack, setSelectedPack] = useState<CloudPack | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editing state
  const [editingPrompt, setEditingPrompt] = useState<{ packId: string; index: number } | null>(null);
  const [editingHeader, setEditingHeader] = useState<{ packId: string; index: number } | null>(null);
  const [promptDraft, setPromptDraft] = useState('');
  const [headerDraft, setHeaderDraft] = useState('');

  // New prompt state
  const [addingPrompt, setAddingPrompt] = useState<string | null>(null);
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptHeader, setNewPromptHeader] = useState('');

  // Delete confirmation state
  const [deletingPromptIndex, setDeletingPromptIndex] = useState<number | null>(null);
  const [deletingPackId, setDeletingPackId] = useState<string | null>(null);

  // Template dialog state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [pendingCopyText, setPendingCopyText] = useState('');
  const [pendingCopyId, setPendingCopyId] = useState('');

  // Auto-sync when user signs in
  useEffect(() => {
    if (session?.user_id && cloudPacks.length === 0 && !isLoading) {
      fetchAllPacks(session.user_id);
    }
  }, [session?.user_id]);

  // Auto-select pack from sidebar
  useEffect(() => {
    if (selectedPackId) {
      const pack = cloudPacks.find(p => p.id === selectedPackId);
      if (pack) {
        handlePackClick(pack);
      }
    }
  }, [selectedPackId, cloudPacks]);

  // Auto-generate missing headers when a pack is selected
  useEffect(() => {
    if (selectedPack) {
      const loaded = loadedPacks[selectedPack.id];
      if (loaded && loaded.prompts.some(p => !p.header)) {
        const timer = setTimeout(() => {
          generateMissingSavedPackHeaders(selectedPack.id);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedPack, loadedPacks]);

  const handleSync = () => {
    if (session?.user_id) {
      fetchAllPacks(session.user_id);
    }
  };

  const handlePackClick = async (pack: CloudPack) => {
    setSelectedPack(pack);
    setSelectedPackId(pack.id);

    // Check if already loaded
    const loaded = loadedPacks[pack.id];
    if (loaded && loaded.prompts.length > 0) {
      return;
    }

    // Fetch pack prompts
    await fetchPackPrompts(pack);
  };

  const handleBackToList = () => {
    setSelectedPack(null);
    setSelectedPackId(null);
  };

  const handleDecrypt = async (pack: CloudPack) => {
    const password = passwordInputs[pack.id];
    if (!password) return;

    await fetchPackPrompts(pack, password);
    setPasswordInputs((prev) => ({ ...prev, [pack.id]: '' }));
  };

  const handleCopy = async (text: string, promptId: string) => {
    const variables = parseTemplateVariables(text);

    if (variables.length > 0) {
      // Has template variables - show dialog
      setTemplateVariables(variables);
      setPendingCopyText(text);
      setPendingCopyId(promptId);
      setShowTemplateDialog(true);
    } else {
      // No variables - copy directly
      await navigator.clipboard.writeText(text);
      setCopiedId(promptId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleTemplateSubmit = async (values: Record<string, string>) => {
    const resolvedText = replaceTemplateVariables(pendingCopyText, values);
    await navigator.clipboard.writeText(resolvedText);
    setShowTemplateDialog(false);
    setCopiedId(pendingCopyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Edit handlers
  const startEditPrompt = (packId: string, index: number, text: string) => {
    setEditingPrompt({ packId, index });
    setPromptDraft(text);
    setEditingHeader(null);
  };

  const cancelEditPrompt = () => {
    setEditingPrompt(null);
    setPromptDraft('');
  };

  const saveEditPrompt = async () => {
    if (!editingPrompt || !promptDraft.trim()) return;

    const success = await updateSavedPackPrompt(editingPrompt.packId, editingPrompt.index, promptDraft.trim());

    if (success) {
      setEditingPrompt(null);
      setPromptDraft('');
    }
  };

  // Delete handlers
  const handleDeletePrompt = async (packId: string, index: number) => {
    const success = await deleteSavedPackPrompt(packId, index);
    if (success) {
      setDeletingPromptIndex(null);
    }
  };

  const handleDeletePack = async (packId: string) => {
    const success = await deleteSavedPack(packId);
    if (success) {
      setDeletingPackId(null);
      setSelectedPack(null);
    }
  };

  const startEditHeader = (packId: string, index: number, header: string) => {
    setEditingHeader({ packId, index });
    setHeaderDraft(header);
    setEditingPrompt(null);
  };

  const cancelEditHeader = () => {
    setEditingHeader(null);
    setHeaderDraft('');
  };

  const saveEditHeader = async () => {
    if (!editingHeader) return;

    const success = await updateSavedPackHeader(editingHeader.packId, editingHeader.index, headerDraft.trim());

    if (success) {
      setEditingHeader(null);
      setHeaderDraft('');
    }
  };

  const handleGenerateHeader = async (packId: string, index: number, promptText: string) => {
    await generateSavedPackHeader(packId, index, promptText);
  };

  // Add prompt handlers
  const startAddPrompt = (packId: string) => {
    setAddingPrompt(packId);
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

    const success = await addSavedPackPrompt(addingPrompt, newPromptText.trim(), newPromptHeader.trim() || undefined);

    if (success) {
      setAddingPrompt(null);
      setNewPromptText('');
      setNewPromptHeader('');
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

  // Filter prompts based on search query
  const getFilteredPrompts = (packId: string) => {
    const loaded = loadedPacks[packId];
    if (!loaded) return [];
    if (!searchQuery) return loaded.prompts;

    const query = searchQuery.toLowerCase();
    return loaded.prompts.filter((prompt) => {
      const matchesText = prompt.text.toLowerCase().includes(query);
      const matchesHeader = prompt.header?.toLowerCase().includes(query);
      return matchesText || matchesHeader;
    });
  };

  // Prompt limits
  const promptLimits = usePromptLimits();

  // Detail view for a selected pack
  if (selectedPack) {
    const loaded = loadedPacks[selectedPack.id];
    const filteredPrompts = getFilteredPrompts(selectedPack.id);
    const isFetchingPack = isFetching[selectedPack.id];
    const isSavingPack = isSaving[selectedPack.id];
    const needsPassword = loaded?.isEncrypted && loaded.prompts.length === 0;
    const meta = SOURCE_META[selectedPack.source as PromptSource];

    return (
      <div className="max-w-4xl mx-auto">
        {/* Back button and header */}
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
          >
            <ChevronLeft size={18} />
            Back to Saved Packs
          </button>

          <div className="flex items-center gap-4">
            <span className="text-4xl">{meta?.icon || '📦'}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {meta?.label || selectedPack.source}
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {selectedPack.promptCount} prompt{selectedPack.promptCount !== 1 ? 's' : ''} · Updated {formatDate(selectedPack.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {loaded?.isEncrypted && (
                <Lock size={20} className="text-[var(--muted-foreground)]" />
              )}
              {deletingPackId === selectedPack.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeletePack(selectedPack.id)}
                    disabled={isSavingPack}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSavingPack ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    {isSavingPack ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setDeletingPackId(null)}
                    className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingPackId(selectedPack.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-red-500 bg-[var(--accent)] hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete pack"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sync notice */}
          <div className="mt-4 px-3 py-2 bg-[var(--accent)]/50 rounded-lg">
            <p className="text-xs text-[var(--muted-foreground)]">
              Changes sync with the web dashboard, but not with the browser extension.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={18} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={clearError} className="ml-auto text-xs text-red-400 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Saving indicator */}
        {isSavingPack && (
          <div className="px-4 py-2 mb-4 bg-[var(--primary)]/10 text-sm text-[var(--primary)] flex items-center gap-2 rounded-lg">
            <RefreshCw size={14} className="animate-spin" />
            Saving changes...
          </div>
        )}

        {/* Password prompt for encrypted packs */}
        {needsPassword && (
          <div className="p-6 bg-[var(--card)] rounded-xl border border-[var(--border)] mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={16} className="text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--foreground)]">This pack is encrypted</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={passwordInputs[selectedPack.id] || ''}
                onChange={(e) => setPasswordInputs((prev) => ({ ...prev, [selectedPack.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleDecrypt(selectedPack)}
                placeholder="Enter password"
                className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
              <button
                onClick={() => handleDecrypt(selectedPack)}
                disabled={!passwordInputs[selectedPack.id]}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Unlock size={16} />
                Unlock
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isFetchingPack && (
          <div className="p-12 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)] mt-4">Loading prompts...</p>
          </div>
        )}

        {/* No search results */}
        {loaded && loaded.prompts.length > 0 && filteredPrompts.length === 0 && searchQuery && (
          <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
            <p className="text-[var(--muted-foreground)]">
              No prompts match "{searchQuery}"
            </p>
          </div>
        )}

        {/* Prompts card grid */}
        {loaded && filteredPrompts.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {filteredPrompts.map((prompt) => {
              // Find the original index in the loaded prompts array for editing
              const index = loaded.prompts.findIndex(p => p === prompt);
              const isEditingThisPrompt = editingPrompt?.packId === selectedPack.id && editingPrompt?.index === index;
              const isEditingThisHeader = editingHeader?.packId === selectedPack.id && editingHeader?.index === index;
              const isGenerating = isGeneratingHeader(selectedPack.id, index);

              return (
                <div
                  key={index}
                  className="group bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)]/50 transition-colors flex flex-col"
                >
                  {/* Header section */}
                  <div className="flex items-center gap-2 mb-2">
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
                          className="flex-1 px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
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
                        <p className="text-sm font-medium text-[var(--primary)]">{prompt.header}</p>
                        <button
                          onClick={() => startEditHeader(selectedPack.id, index, prompt.header || '')}
                          className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit header"
                        >
                          <Pencil size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateHeader(selectedPack.id, index, prompt.text)}
                          disabled={isGenerating}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded disabled:opacity-50"
                        >
                          {isGenerating ? <RefreshCw size={12} className="animate-spin" /> : <ChartNoAxesCombined size={12} />}
                          {isGenerating ? 'Generating...' : 'Generate header'}
                        </button>
                        <button
                          onClick={() => startEditHeader(selectedPack.id, index, '')}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded"
                        >
                          Add header
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Prompt text section */}
                  {isEditingThisPrompt ? (
                    <div className="mt-2 flex-1">
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
                        <button onClick={cancelEditPrompt} className="px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                          Cancel
                        </button>
                        <span className="text-xs text-[var(--muted-foreground)]">Ctrl+Enter to save</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap line-clamp-3 flex-1">{prompt.text}</p>
                  )}

                  {/* Actions */}
                  {!isEditingThisPrompt && (
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                      <span className="text-xs text-[var(--muted-foreground)]">{formatDate(prompt.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditPrompt(selectedPack.id, index, prompt.text)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                          title="Edit prompt"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleCopy(prompt.text, `${selectedPack.id}-${index}`)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          {copiedId === `${selectedPack.id}-${index}` ? (
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
                        {deletingPromptIndex === index ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeletePrompt(selectedPack.id, index)}
                              disabled={isSaving[selectedPack.id]}
                              className="px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            >
                              {isSaving[selectedPack.id] ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeletingPromptIndex(null)}
                              className="px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingPromptIndex(index)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                            title="Delete prompt"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Prompt Form - outside the grid */}
        {loaded && loaded.prompts.length > 0 && (
          <div className="mt-4">
            {addingPrompt === selectedPack.id && (
              <div className="p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]">
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
                    {isSavingPack ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSavingPack ? 'Saving...' : 'Add Prompt'}
                  </button>
                  <button onClick={cancelAddPrompt} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    Cancel
                  </button>
                  <span className="text-xs text-[var(--muted-foreground)] ml-auto">Ctrl+Enter to save</span>
                </div>
              </div>
            )}

            {/* Add Prompt Button */}
            {!addingPrompt && (
              <div className="space-y-2">
                <button
                  onClick={() => startAddPrompt(selectedPack.id)}
                  disabled={promptLimits.isAtLimit}
                  className={`w-full flex items-center justify-center gap-2 p-4 text-sm border-2 border-dashed rounded-xl transition-colors ${
                    promptLimits.isAtLimit
                      ? 'text-[var(--muted-foreground)] border-[var(--border)] opacity-50 cursor-not-allowed'
                      : 'text-[var(--primary)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5'
                  }`}
                >
                  <Plus size={18} />
                  {promptLimits.isAtLimit ? 'Prompt Limit Reached' : 'Add Prompt'}
                </button>
                <p className="text-xs text-center text-[var(--muted-foreground)]">
                  {promptLimits.currentPromptCount} / {promptLimits.maxPrompts} prompts used ({promptLimits.tier} plan)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Template Input Dialog */}
        {showTemplateDialog && (
          <TemplateInputDialog
            variables={templateVariables}
            onSubmit={handleTemplateSubmit}
            onClose={() => setShowTemplateDialog(false)}
          />
        )}
      </div>
    );
  }

  // Card grid view for all packs
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Cloud size={24} />
            Saved from Extension
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
          <button onClick={clearError} className="ml-auto text-xs text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cloudPacks.length === 0 && (
        <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
          <Cloud size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No saved prompts yet</h3>
          <p className="text-[var(--muted-foreground)] max-w-sm mx-auto">
            Save prompts using the browser extension to see them here.
          </p>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-4">
        {cloudPacks.map((pack) => {
          const meta = SOURCE_META[pack.source as PromptSource];
          const loaded = loadedPacks[pack.id];

          return (
            <button
              key={pack.id}
              onClick={() => handlePackClick(pack)}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 text-left hover:border-[var(--primary)]/50 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{meta?.icon || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {meta?.label || pack.source}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {pack.promptCount} prompt{pack.promptCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Updated {formatDate(pack.updatedAt)}
                  </p>
                </div>
                {loaded?.isEncrypted && (
                  <Lock size={16} className="text-[var(--muted-foreground)]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {cloudPacks.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {cloudPacks.reduce((sum, p) => sum + p.promptCount, 0)} total prompts across {cloudPacks.length} pack{cloudPacks.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Template Input Dialog */}
      {showTemplateDialog && (
        <TemplateInputDialog
          variables={templateVariables}
          onSubmit={handleTemplateSubmit}
          onClose={() => setShowTemplateDialog(false)}
        />
      )}
    </div>
  );
}
