import { useState, useEffect, useRef } from 'react';
import { Package, RefreshCw, Lock, Unlock, Copy, Check, AlertCircle, Pencil, Sparkles, X, Save, Plus, ChevronLeft } from 'lucide-react';
import { useSyncStore, type UserPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';

// Common emojis for pack icons
const EMOJI_OPTIONS = [
  '📦', '🚀', '💡', '⚡', '🎯', '🔥', '✨', '💎',
  '🎨', '📝', '💻', '🛠️', '📊', '🔧', '📚', '🎬',
  '🌟', '💬', '🤖', '🧠', '📖', '🔍', '💼', '🎭',
];

export function UserPacksPage() {
  const { session } = useAuthStore();
  const {
    userPacks,
    loadedUserPacks,
    selectedPackId,
    isLoading,
    isFetching,
    isSaving,
    generatingHeaders,
    lastSyncAt,
    error,
    fetchAllPacks,
    fetchUserPackPrompts,
    updateUserPackPrompt,
    updateUserPackHeader,
    generateUserPackHeader,
    generateMissingUserPackHeaders,
    addUserPackPrompt,
    updateUserPackIcon,
    setSelectedPackId,
    clearError,
  } = useSyncStore();

  const [selectedPack, setSelectedPack] = useState<UserPack | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editing state
  const [editingPrompt, setEditingPrompt] = useState<{ packId: string; index: number } | null>(null);
  const [editingHeader, setEditingHeader] = useState<{ packId: string; index: number } | null>(null);
  const [promptDraft, setPromptDraft] = useState('');
  const [headerDraft, setHeaderDraft] = useState('');

  // Icon editing state
  const [editingIcon, setEditingIcon] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // New prompt state
  const [addingPrompt, setAddingPrompt] = useState<string | null>(null);
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptHeader, setNewPromptHeader] = useState('');

  // Auto-sync when user signs in
  useEffect(() => {
    if (session?.user_id && userPacks.length === 0 && !isLoading) {
      fetchAllPacks(session.user_id);
    }
  }, [session?.user_id]);

  // Auto-select pack from sidebar
  useEffect(() => {
    if (selectedPackId) {
      const pack = userPacks.find(p => p.id === selectedPackId);
      if (pack) {
        handlePackClick(pack);
      }
    }
  }, [selectedPackId, userPacks]);

  // Auto-generate missing headers when a pack is selected
  useEffect(() => {
    if (selectedPack) {
      const loaded = loadedUserPacks[selectedPack.id];
      if (loaded && loaded.prompts.some(p => !p.header)) {
        const timer = setTimeout(() => {
          generateMissingUserPackHeaders(selectedPack.id);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedPack, loadedUserPacks]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEditingIcon(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIconSelect = async (packId: string, icon: string) => {
    await updateUserPackIcon(packId, icon);
    setEditingIcon(null);
    // Update selectedPack if it's the one being edited
    if (selectedPack?.id === packId) {
      setSelectedPack({ ...selectedPack, icon });
    }
  };

  const handleSync = () => {
    if (session?.user_id) {
      fetchAllPacks(session.user_id);
    }
  };

  const handlePackClick = async (pack: UserPack) => {
    setSelectedPack(pack);
    setSelectedPackId(pack.id);

    // Check if already loaded
    const loaded = loadedUserPacks[pack.id];
    if (loaded && loaded.prompts.length > 0) {
      return;
    }

    // Fetch pack prompts
    await fetchUserPackPrompts(pack);
  };

  const handleBackToList = () => {
    setSelectedPack(null);
    setSelectedPackId(null);
  };

  const handleDecrypt = async (pack: UserPack) => {
    const password = passwordInputs[pack.id];
    if (!password) return;

    await fetchUserPackPrompts(pack, password);
    setPasswordInputs((prev) => ({ ...prev, [pack.id]: '' }));
  };

  const handleCopy = async (text: string, promptId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(promptId);
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

    const success = await updateUserPackPrompt(editingPrompt.packId, editingPrompt.index, promptDraft.trim());

    if (success) {
      setEditingPrompt(null);
      setPromptDraft('');
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

    const success = await updateUserPackHeader(editingHeader.packId, editingHeader.index, headerDraft.trim());

    if (success) {
      setEditingHeader(null);
      setHeaderDraft('');
    }
  };

  const handleGenerateHeader = async (packId: string, index: number, promptText: string) => {
    await generateUserPackHeader(packId, index, promptText);
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

    const success = await addUserPackPrompt(addingPrompt, newPromptText.trim(), newPromptHeader.trim() || undefined);

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
        <Package size={48} className="text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          Sign in to view your packs
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-md">
          Connect your PromptPack account to view and manage your prompt packs.
        </p>
      </div>
    );
  }

  // Detail view for a selected pack
  if (selectedPack) {
    const loaded = loadedUserPacks[selectedPack.id];
    const isFetchingPack = isFetching[selectedPack.id];
    const isSavingPack = isSaving[selectedPack.id];
    const needsPassword = loaded?.isEncrypted && loaded.prompts.length === 0;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Back button and header */}
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
          >
            <ChevronLeft size={18} />
            Back to Your Packs
          </button>

          <div className="flex items-center gap-4">
            {/* Clickable icon with emoji picker */}
            <div className="relative" ref={editingIcon === selectedPack.id ? emojiPickerRef : undefined}>
              <button
                onClick={() => setEditingIcon(editingIcon === selectedPack.id ? null : selectedPack.id)}
                className="text-4xl hover:opacity-80 transition-opacity cursor-pointer"
                title="Click to change icon"
              >
                {selectedPack.icon || '📦'}
              </button>
              {editingIcon === selectedPack.id && (
                <div
                  className="absolute top-full left-0 mt-2 p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50"
                  style={{ width: '280px' }}
                >
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">Choose an icon</p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 28px)',
                      gap: '6px'
                    }}
                  >
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleIconSelect(selectedPack.id, emoji)}
                        style={{ width: '28px', height: '28px', fontSize: '16px' }}
                        className={`flex items-center justify-center rounded hover:bg-[var(--accent)] transition-colors ${
                          selectedPack.icon === emoji ? 'bg-[var(--primary)]/20 ring-1 ring-[var(--primary)]' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{selectedPack.title}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {selectedPack.promptCount} prompt{selectedPack.promptCount !== 1 ? 's' : ''}
                {selectedPack.category && ` · ${selectedPack.category}`}
                {' · '}Updated {formatDate(selectedPack.updatedAt)}
              </p>
              {selectedPack.description && (
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{selectedPack.description}</p>
              )}
            </div>
            {selectedPack.isEncrypted && <Lock size={20} className="text-[var(--muted-foreground)]" />}
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

        {/* Prompts card grid */}
        {loaded && loaded.prompts.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {loaded.prompts.map((prompt, index) => {
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
                          {isGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
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
              <button
                onClick={() => startAddPrompt(selectedPack.id)}
                className="w-full flex items-center justify-center gap-2 p-4 text-sm text-[var(--primary)] border-2 border-dashed border-[var(--border)] rounded-xl hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-colors"
              >
                <Plus size={18} />
                Add Prompt
              </button>
            )}
          </div>
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
            <Package size={24} />
            Your Prompt Packs
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Prompt packs created on the web dashboard
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
      {!isLoading && userPacks.length === 0 && (
        <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
          <Package size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No prompt packs yet</h3>
          <p className="text-[var(--muted-foreground)] max-w-sm mx-auto">
            Create prompt packs on the web dashboard to see them here.
          </p>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-4">
        {userPacks.map((pack) => {
          return (
            <div
              key={pack.id}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 text-left hover:border-[var(--primary)]/50 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Editable icon */}
                <div className="relative" ref={editingIcon === pack.id ? emojiPickerRef : undefined}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingIcon(editingIcon === pack.id ? null : pack.id);
                    }}
                    className="text-4xl hover:opacity-80 transition-opacity cursor-pointer"
                    title="Click to change icon"
                  >
                    {pack.icon || '📦'}
                  </button>
                  {editingIcon === pack.id && (
                    <div
                      className="absolute top-full left-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50"
                      style={{ width: '290px', padding: '12px' }}
                    >
                      <p className="text-xs text-[var(--muted-foreground)] mb-2">Choose an icon</p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, 28px)',
                          gap: '6px'
                        }}
                      >
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIconSelect(pack.id, emoji);
                            }}
                            style={{ width: '28px', height: '28px', fontSize: '16px' }}
                            className={`flex items-center justify-center rounded hover:bg-[var(--accent)] transition-colors ${
                              pack.icon === emoji ? 'bg-[var(--primary)]/20 ring-1 ring-[var(--primary)]' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handlePackClick(pack)}
                  className="flex-1 min-w-0 text-left"
                >
                  <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                    {pack.title}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {pack.promptCount} prompt{pack.promptCount !== 1 ? 's' : ''}
                    {pack.category && ` · ${pack.category}`}
                  </p>
                  {pack.description && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                      {pack.description}
                    </p>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Updated {formatDate(pack.updatedAt)}
                  </p>
                </button>
                {pack.isEncrypted && <Lock size={16} className="text-[var(--muted-foreground)]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {userPacks.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {userPacks.reduce((sum, p) => sum + p.promptCount, 0)} total prompts across {userPacks.length} pack{userPacks.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
