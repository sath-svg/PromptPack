import { useState, useEffect, useRef } from 'react';
import { Package, RefreshCw, Lock, Unlock, Copy, Check, AlertCircle, Pencil, ChartNoAxesCombined, X, Save, Plus, ChevronLeft, Download, Trash2, Loader2 } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useSyncStore, encodePmtpk, encryptPmtpk, type UserPack } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { usePromptStore } from '../../stores/promptStore';
import { useEvaluationStore } from '../../stores/evaluationStore';
import { usePromptLimits } from '../../hooks/usePromptLimits';
import { usePackLimits, getPackLimitMessage } from '../../hooks/usePackLimits';
import { PASSWORD_MAX_LENGTH, isValidPassword } from '../../lib/constants';
import { parseTemplateVariables, replaceTemplateVariables } from '../../lib/templateParser';
import { TemplateInputDialog } from '../TemplateInputDialog';
import { ScoreBadge } from '../ScoreBadge';
import { EvaluationModal } from '../EvaluationModal';
import type { PromptEvaluation } from '../../types';

// Common emojis for pack icons
const EMOJI_OPTIONS = [
  '📦', '🚀', '💡', '⚡', '🎯', '🔥', '✨', '💎',
  '🎨', '📝', '💻', '🛠️', '📊', '🔧', '📚', '🎬',
  '🌟', '💬', '🤖', '🧠', '📖', '🔍', '💼', '🎭',
];

export function UserPacksPage() {
  const { session } = useAuthStore();
  const { searchQuery } = usePromptStore();
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
    deleteUserPackPrompt,
    deleteUserPack,
    createUserPack,
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

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingPromptIndex, setDeletingPromptIndex] = useState<number | null>(null);
  const [deletingPackId, setDeletingPackId] = useState<string | null>(null);

  // Create pack state
  const [showCreatePackModal, setShowCreatePackModal] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState('');
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [createPackError, setCreatePackError] = useState<string | null>(null);

  // Template dialog state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [pendingCopyText, setPendingCopyText] = useState('');
  const [pendingCopyId, setPendingCopyId] = useState('');

  // Evaluation state
  const { evaluatePrompt, getEvaluation, getPromptHash, loadingHash, loadEvaluations } = useEvaluationStore();
  const [promptHashes, setPromptHashes] = useState<Record<string, string>>({});
  const [showEvaluationModal, setShowEvaluationModal] = useState<{ evaluation: PromptEvaluation; header?: string } | null>(null);

  // Check if user is Pro/Studio (needed for evaluation feature)
  const isProOrStudio = session?.tier === 'pro' || session?.tier === 'studio';

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

  // Calculate prompt hashes when pack is loaded
  useEffect(() => {
    if (selectedPack) {
      const loaded = loadedUserPacks[selectedPack.id];
      if (loaded?.prompts) {
        const calculateHashes = async () => {
          const hashes: Record<string, string> = {};
          for (let i = 0; i < loaded.prompts.length; i++) {
            const key = `${selectedPack.id}-${i}`;
            hashes[key] = await getPromptHash(loaded.prompts[i].text);
          }
          setPromptHashes(prev => ({ ...prev, ...hashes }));

          // Load existing evaluations from Convex for Pro/Studio users
          if (session?.user_id && isProOrStudio) {
            const hashValues = Object.values(hashes);
            if (hashValues.length > 0) {
              loadEvaluations(session.user_id, hashValues);
            }
          }
        };
        calculateHashes();
      }
    }
  }, [selectedPack?.id, loadedUserPacks, getPromptHash, session?.user_id, isProOrStudio, loadEvaluations]);

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
    setAddingPrompt(null);

    // Check if already loaded (including empty packs)
    // Use getState() to read fresh store state, not the stale closure value
    const freshLoaded = useSyncStore.getState().loadedUserPacks[pack.id];
    if (freshLoaded) {
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

    const success = await updateUserPackPrompt(editingPrompt.packId, editingPrompt.index, promptDraft.trim());

    if (success) {
      setEditingPrompt(null);
      setPromptDraft('');
    }
  };

  // Delete handlers
  const handleDeletePrompt = async (packId: string, index: number) => {
    const success = await deleteUserPackPrompt(packId, index);
    if (success) {
      setDeletingPromptIndex(null);
    }
  };

  const handleDeletePack = async (packId: string) => {
    const success = await deleteUserPack(packId);
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

    const success = await updateUserPackHeader(editingHeader.packId, editingHeader.index, headerDraft.trim());

    if (success) {
      setEditingHeader(null);
      setHeaderDraft('');
    }
  };

  const handleGenerateHeader = async (packId: string, index: number, promptText: string) => {
    await generateUserPackHeader(packId, index, promptText);
  };

  // Evaluate prompt handler
  const handleEvaluate = async (promptText: string, _promptKey: string) => {
    if (!session?.session_token) return;
    await evaluatePrompt(promptText, session.session_token);
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

  // Export handlers
  const openExportModal = () => {
    setExportPassword('');
    setExportError(null);
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportPassword('');
    setExportError(null);
  };

  const handleExport = async () => {
    if (!selectedPack) return;
    const loaded = loadedUserPacks[selectedPack.id];
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
        fileData = await encryptPmtpk(loaded.prompts, selectedPack.title, exportPassword);
      } else {
        fileData = await encodePmtpk(loaded.prompts, selectedPack.title);
      }

      // Open native save dialog
      const filePath = await save({
        defaultPath: `${selectedPack.title.replace(/[^a-zA-Z0-9]/g, '_')}.pmtpk`,
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

  // Create pack handlers
  const openCreatePackModal = () => {
    setNewPackTitle('');
    setCreatePackError(null);
    setShowCreatePackModal(true);
  };

  const closeCreatePackModal = () => {
    setShowCreatePackModal(false);
    setNewPackTitle('');
    setCreatePackError(null);
  };

  const handleCreatePack = async () => {
    if (!session?.user_id || !newPackTitle.trim()) return;

    // Check limits
    if (!packLimits.canCreatePack) {
      setCreatePackError(getPackLimitMessage(packLimits.tier, packLimits.currentUserPackCount));
      return;
    }

    setIsCreatingPack(true);
    setCreatePackError(null);

    try {
      // Create empty pack (user can add prompts after)
      const newPack = await createUserPack(session.user_id, newPackTitle.trim(), []);

      if (newPack) {
        closeCreatePackModal();
        // Select the new pack to open it
        handlePackClick(newPack);
      } else {
        setCreatePackError('Failed to create pack. Please try again.');
      }
    } catch (err) {
      console.error('Create pack failed:', err);
      setCreatePackError(err instanceof Error ? err.message : 'Failed to create pack');
    } finally {
      setIsCreatingPack(false);
    }
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

  // Filter prompts based on search query
  const getFilteredPrompts = (packId: string) => {
    const loaded = loadedUserPacks[packId];
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

  // Pack limits
  const packLimits = usePackLimits();

  // Detail view for a selected pack
  if (selectedPack) {
    const loaded = loadedUserPacks[selectedPack.id];
    const filteredPrompts = getFilteredPrompts(selectedPack.id);
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
                  className="absolute top-full left-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50"
                  style={{ width: '295px', padding: '12px' }}
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
            <div className="flex items-center gap-2">
              {selectedPack.isEncrypted && <Lock size={20} className="text-[var(--muted-foreground)]" />}
              <button
                onClick={openExportModal}
                disabled={!loadedUserPacks[selectedPack.id] || loadedUserPacks[selectedPack.id].prompts.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export pack"
              >
                <Download size={16} />
                Export
              </button>
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
                        {/* Score badge */}
                        {(() => {
                          const promptKey = `${selectedPack.id}-${index}`;
                          const hash = promptHashes[promptKey];
                          const evaluation = hash ? getEvaluation(hash) : undefined;
                          return evaluation ? (
                            <ScoreBadge
                              score={evaluation.overallScore}
                              size="sm"
                              onClick={() => setShowEvaluationModal({ evaluation, header: prompt.header })}
                            />
                          ) : null;
                        })()}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Score badge for prompts without header */}
                        {(() => {
                          const promptKey = `${selectedPack.id}-${index}`;
                          const hash = promptHashes[promptKey];
                          const evaluation = hash ? getEvaluation(hash) : undefined;
                          return evaluation ? (
                            <ScoreBadge
                              score={evaluation.overallScore}
                              size="sm"
                              onClick={() => setShowEvaluationModal({ evaluation, header: undefined })}
                            />
                          ) : null;
                        })()}
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
                        {/* Evaluate button or Score badge */}
                        {(() => {
                          const promptKey = `${selectedPack.id}-${index}`;
                          const hash = promptHashes[promptKey];
                          const evaluation = hash ? getEvaluation(hash) : undefined;
                          const isLoading = hash === loadingHash;

                          // Show score badge if already evaluated
                          if (evaluation) {
                            return (
                              <ScoreBadge
                                score={evaluation.overallScore}
                                size="sm"
                                onClick={() => setShowEvaluationModal({ evaluation, header: prompt.header })}
                              />
                            );
                          }

                          // Show disabled button for free users
                          if (!isProOrStudio) {
                            return (
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] opacity-50 cursor-not-allowed"
                                title="Upgrade to Pro to evaluate prompts"
                                disabled
                              >
                                <ChartNoAxesCombined size={14} />
                              </button>
                            );
                          }

                          return (
                            <button
                              onClick={() => hash && handleEvaluate(prompt.text, promptKey)}
                              disabled={isLoading || !hash}
                              className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
                                isLoading ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--primary)]'
                              }`}
                              title={isLoading ? 'Evaluating...' : 'Evaluate prompt quality'}
                            >
                              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ChartNoAxesCombined size={14} />}
                            </button>
                          );
                        })()}
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

        {/* Empty pack state - show when no prompts and not loading */}
        {(!loaded || loaded.prompts.length === 0) && !isFetchingPack && !needsPassword && !addingPrompt && (
          <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
            <Package size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No prompts yet</h3>
            <p className="text-[var(--muted-foreground)] max-w-sm mx-auto mb-4">
              Add your first prompt to get started.
            </p>
            <button
              onClick={() => startAddPrompt(selectedPack.id)}
              disabled={promptLimits.isAtLimit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={16} />
              Add Prompt
            </button>
          </div>
        )}

        {/* Add Prompt Form - outside the grid */}
        {(loaded || !isFetchingPack) && (
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
            {!addingPrompt && loaded && loaded.prompts.length > 0 && (
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
                Export "{selectedPack.title}" as a .pmtpk file. You can optionally add a password to encrypt the file.
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

        {/* Evaluation Modal */}
        {showEvaluationModal && (
          <EvaluationModal
            evaluation={showEvaluationModal.evaluation}
            promptHeader={showEvaluationModal.header}
            onClose={() => setShowEvaluationModal(null)}
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
            onClick={openCreatePackModal}
            disabled={!packLimits.canCreatePack}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            title={packLimits.canCreatePack ? 'Create a new prompt pack' : getPackLimitMessage(packLimits.tier, packLimits.currentUserPackCount)}
          >
            <Plus size={16} />
            Create Pack
          </button>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-opacity disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Sync
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
          <p className="text-[var(--muted-foreground)] max-w-sm mx-auto mb-4">
            Create your first prompt pack to organize and save your prompts.
          </p>
          {packLimits.canCreatePack ? (
            <button
              onClick={openCreatePackModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Create Your First Pack
            </button>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              {getPackLimitMessage(packLimits.tier, packLimits.currentUserPackCount)}
            </p>
          )}
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

      {/* Template Input Dialog */}
      {showTemplateDialog && (
        <TemplateInputDialog
          variables={templateVariables}
          onSubmit={handleTemplateSubmit}
          onClose={() => setShowTemplateDialog(false)}
        />
      )}

      {/* Create Pack Modal */}
      {showCreatePackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Create New Pack</h3>
              <button
                onClick={closeCreatePackModal}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Create a new prompt pack. You can add prompts to it after creation.
            </p>

            {createPackError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-sm text-red-400">{createPackError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Pack Name
                </label>
                <input
                  type="text"
                  value={newPackTitle}
                  onChange={(e) => setNewPackTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePack()}
                  placeholder="e.g., Marketing Prompts"
                  maxLength={100}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  autoFocus
                />
              </div>

              <p className="text-xs text-[var(--muted-foreground)]">
                {packLimits.currentUserPackCount} / {packLimits.maxCustomPacks} packs used ({packLimits.tier} plan)
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeCreatePackModal}
                  className="flex-1 px-4 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePack}
                  disabled={isCreatingPack || !newPackTitle.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isCreatingPack ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Pack
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
