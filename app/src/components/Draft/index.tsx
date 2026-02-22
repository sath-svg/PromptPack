import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, Cloud, ChevronDown, Sparkles } from 'lucide-react';
import { SOURCE_META } from '../../types';
import type { PromptSource } from '../../types';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { ENHANCE_API_URL } from '../../lib/constants';
import { tauriFetch } from '../../lib/tauriFetch';

type EnhanceMode = 'structured' | 'clarity' | 'concise' | 'strict';

// Draft is stored in localStorage for persistence
const DRAFT_KEY_PREFIX = 'promptpack-draft-';
const MAX_DRAFTS = 3;

interface DraftData {
  id: number;
  text: string;
  header: string;
  source: PromptSource;
  lastSaved: number;
  name: string;
}

type SaveDestination = { type: 'local'; source: PromptSource } | { type: 'userPack'; packId: string } | { type: 'savedPack'; packId: string };

// Load all drafts from localStorage
function loadAllDrafts(): DraftData[] {
  const drafts: DraftData[] = [];
  for (let i = 0; i < MAX_DRAFTS; i++) {
    const saved = localStorage.getItem(`${DRAFT_KEY_PREFIX}${i}`);
    if (saved) {
      try {
        drafts.push(JSON.parse(saved));
      } catch {
        drafts.push(createEmptyDraft(i));
      }
    } else {
      drafts.push(createEmptyDraft(i));
    }
  }
  return drafts;
}

function createEmptyDraft(id: number): DraftData {
  return {
    id,
    text: '',
    header: '',
    source: 'chatgpt',
    lastSaved: 0,
    name: `Draft ${id + 1}`,
  };
}

export function DraftPage() {
  const { session } = useAuthStore();
  const { userPacks, cloudPacks, addUserPackPrompt, addSavedPackPrompt, createSavedPack, loadedUserPacks, loadedPacks, fetchUserPackPrompts, fetchPackPrompts, fetchAllPacks } = useSyncStore();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const [drafts, setDrafts] = useState<DraftData[]>(() => loadAllDrafts());
  const [isSaving, setIsSaving] = useState(false);

  // Current draft derived from active tab
  const currentDraft = drafts[activeTab];
  const text = currentDraft?.text || '';
  const header = currentDraft?.header || '';
  const source = currentDraft?.source || 'chatgpt';
  const lastSaved = currentDraft?.lastSaved || null;

  // Save destination - either local (with source) or a cloud pack
  const [saveDestination, setSaveDestination] = useState<SaveDestination>({ type: 'local', source: 'chatgpt' });
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);

  // Enhance feature state
  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>('structured');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  // Fetch user packs when session is available
  useEffect(() => {
    if (session?.user_id && userPacks.length === 0 && cloudPacks.length === 0) {
      fetchAllPacks(session.user_id);
    }
  }, [session?.user_id]);

  // Update draft helper
  const updateCurrentDraft = useCallback((updates: Partial<DraftData>) => {
    setDrafts(prev => {
      const newDrafts = [...prev];
      newDrafts[activeTab] = { ...newDrafts[activeTab], ...updates };
      return newDrafts;
    });
  }, [activeTab]);

  const setText = (newText: string) => updateCurrentDraft({ text: newText });
  const setHeader = (newHeader: string) => updateCurrentDraft({ header: newHeader });
  const setSource = (newSource: PromptSource) => updateCurrentDraft({ source: newSource });

  // Autosave draft to localStorage
  const saveDraft = useCallback(() => {
    const draft = drafts[activeTab];
    if (!draft) return;

    const updatedDraft: DraftData = {
      ...draft,
      lastSaved: Date.now(),
    };
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${activeTab}`, JSON.stringify(updatedDraft));
    setDrafts(prev => {
      const newDrafts = [...prev];
      newDrafts[activeTab] = updatedDraft;
      return newDrafts;
    });
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 500);
  }, [drafts, activeTab]);

  // Autosave every 15 seconds if there's content
  useEffect(() => {
    if (!text && !header) return;

    const timer = setInterval(() => {
      saveDraft();
    }, 15000); // Autosave every 15 seconds

    return () => clearInterval(timer);
  }, [text, header, source, saveDraft]);

  // Clear current draft
  const clearDraft = () => {
    if (confirm('Are you sure you want to clear this draft?')) {
      const emptyDraft = createEmptyDraft(activeTab);
      localStorage.setItem(`${DRAFT_KEY_PREFIX}${activeTab}`, JSON.stringify(emptyDraft));
      setDrafts(prev => {
        const newDrafts = [...prev];
        newDrafts[activeTab] = emptyDraft;
        return newDrafts;
      });
    }
  };

  // Save as prompt to cloud
  const saveAsPrompt = async () => {
    if (!text.trim()) return;

    // Handle saving to cloud packs
    if (saveDestination.type === 'userPack' || saveDestination.type === 'savedPack') {
      setIsSavingToCloud(true);

      try {
        let success = false;

        if (saveDestination.type === 'userPack') {
          // Make sure pack is loaded first
          const pack = userPacks.find(p => p.id === saveDestination.packId);
          if (pack && !loadedUserPacks[saveDestination.packId]) {
            await fetchUserPackPrompts(pack);
          }
          success = await addUserPackPrompt(saveDestination.packId, text.trim(), header.trim() || undefined);
        } else {
          // savedPack
          const pack = cloudPacks.find(p => p.id === saveDestination.packId);
          if (pack && !loadedPacks[saveDestination.packId]) {
            await fetchPackPrompts(pack);
          }
          success = await addSavedPackPrompt(saveDestination.packId, text.trim(), header.trim() || undefined);
        }

        if (success) {
          // Clear draft after saving
          const emptyDraft = createEmptyDraft(activeTab);
          localStorage.setItem(`${DRAFT_KEY_PREFIX}${activeTab}`, JSON.stringify(emptyDraft));
          setDrafts(prev => {
            const newDrafts = [...prev];
            newDrafts[activeTab] = emptyDraft;
            return newDrafts;
          });
        }
      } finally {
        setIsSavingToCloud(false);
      }
      return;
    }

    // For "local" type, we save to the selected savedPack source
    // Create the pack if it doesn't exist
    if (saveDestination.type === 'local') {
      if (!session?.user_id) {
        alert('Please sign in to save prompts to cloud.');
        return;
      }

      setIsSavingToCloud(true);

      try {
        // Find or create the savedPack for this source
        const existingPack = cloudPacks.find(p => p.source === saveDestination.source);

        if (existingPack) {
          // Add to existing pack
          if (!loadedPacks[existingPack.id]) {
            await fetchPackPrompts(existingPack);
          }
          const success = await addSavedPackPrompt(existingPack.id, text.trim(), header.trim() || undefined);

          if (success) {
            const emptyDraft = createEmptyDraft(activeTab);
            localStorage.setItem(`${DRAFT_KEY_PREFIX}${activeTab}`, JSON.stringify(emptyDraft));
            setDrafts(prev => {
              const newDrafts = [...prev];
              newDrafts[activeTab] = emptyDraft;
              return newDrafts;
            });
          }
        } else {
          // Create a new savedPack for this source with the prompt
          const newPrompt = {
            text: text.trim(),
            header: header.trim() || undefined,
            createdAt: Date.now(),
          };

          const newPack = await createSavedPack(session.user_id, saveDestination.source, [newPrompt]);

          if (newPack) {
            const emptyDraft = createEmptyDraft(activeTab);
            localStorage.setItem(`${DRAFT_KEY_PREFIX}${activeTab}`, JSON.stringify(emptyDraft));
            setDrafts(prev => {
              const newDrafts = [...prev];
              newDrafts[activeTab] = emptyDraft;
              return newDrafts;
            });
          }
        }
      } finally {
        setIsSavingToCloud(false);
      }
    }
  };

  const formatLastSaved = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Enhance prompt using API
  const handleEnhance = async () => {
    if (isEnhancing) return;
    if (!text.trim()) {
      setEnhanceError('Nothing to enhance');
      setTimeout(() => setEnhanceError(null), 2000);
      return;
    }
    if (text.length > 6000) {
      setEnhanceError('Prompt too long to enhance (max 6000 characters)');
      setTimeout(() => setEnhanceError(null), 3000);
      return;
    }
    if (!session?.session_token) {
      setEnhanceError('Sign in to use enhance feature');
      setTimeout(() => setEnhanceError(null), 2000);
      return;
    }

    setIsEnhancing(true);
    setEnhanceError(null);

    try {
      const response = await tauriFetch(ENHANCE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session_token}`,
        },
        body: JSON.stringify({ text: text.trim(), mode: enhanceMode }),
      });

      if (response.status === 429) {
        // Parse the detailed error message from API
        try {
          const errorData = await response.json() as { error?: string; code?: string };
          setEnhanceError(errorData.error || 'Enhance limit reached');
        } catch {
          setEnhanceError('Enhance limit reached');
        }
        setTimeout(() => setEnhanceError(null), 5000);
        return;
      }

      if (response.status === 401) {
        setEnhanceError('Sign in required to enhance');
        setTimeout(() => setEnhanceError(null), 3000);
        return;
      }

      if (!response.ok) {
        try {
          const errorData = await response.json() as { error?: string };
          setEnhanceError(errorData.error || 'Enhance failed');
        } catch {
          setEnhanceError('Enhance failed');
        }
        setTimeout(() => setEnhanceError(null), 3000);
        return;
      }

      const data = await response.json() as { enhanced?: string };
      if (data.enhanced) {
        // Update drafts state with enhanced text and save to localStorage
        setDrafts(prev => {
          const newDrafts = [...prev];
          const updatedDraft: DraftData = {
            ...newDrafts[activeTab],
            text: data.enhanced!,
            lastSaved: Date.now(),
          };
          newDrafts[activeTab] = updatedDraft;
          localStorage.setItem(`${DRAFT_KEY_PREFIX}${activeTab}`, JSON.stringify(updatedDraft));
          return newDrafts;
        });
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
      }
    } catch {
      setEnhanceError('Enhance failed');
      setTimeout(() => setEnhanceError(null), 2000);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Check if a draft has content
  const hasDraftContent = (draft: DraftData) => draft.text.trim() || draft.header.trim();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Draft Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[var(--border)]">
        {drafts.map((draft, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] -mb-[2px]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            <span className="flex items-center gap-2">
              {draft.name}
              {hasDraftContent(draft) && (
                <span className="w-2 h-2 rounded-full bg-[var(--primary)]" title="Has content" />
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">{currentDraft?.name || 'Draft'}</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {lastSaved ? (
              <>
                {isSaving ? 'Saving...' : `Last saved ${formatLastSaved(lastSaved)}`}
              </>
            ) : (
              'Start typing to autosave'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearDraft}
            disabled={!text && !header}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
          <button
            onClick={saveAsPrompt}
            disabled={!text.trim() || isSavingToCloud}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isSavingToCloud ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{!header.trim() ? 'Generating title...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Title (optional)
          </label>
          <input
            type="text"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            placeholder="Short title for the prompt"
            className="w-full px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        {/* Prompt Text */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Prompt
            </label>
            {/* Enhance Controls */}
            <div className="flex items-center gap-2">
              <select
                value={enhanceMode}
                onChange={(e) => setEnhanceMode(e.target.value as EnhanceMode)}
                disabled={isEnhancing}
                className="h-8 px-2 text-xs rounded-md bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
              >
                <option value="structured">Structured</option>
                <option value="clarity">Clarity</option>
                <option value="concise">Concise</option>
                <option value="strict">Strict</option>
              </select>
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !text.trim() || !session}
                title={!session ? 'Sign in to enhance' : 'Enhance prompt'}
                className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isEnhancing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Enhance</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {enhanceError && (
            <p className="text-xs text-red-500 mb-1.5">{enhanceError}</p>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start drafting your prompt here..."
            rows={16}
            className="w-full px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Use {'{variable}'} for arguments
          </p>
        </div>

        {/* Save Destination */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Save To
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDestinationDropdown(!showDestinationDropdown)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-left flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {saveDestination.type === 'local' ? (
                  <>
                    <span>{SOURCE_META[saveDestination.source].icon}</span>
                    <span>{SOURCE_META[saveDestination.source].label}</span>
                  </>
                ) : saveDestination.type === 'userPack' ? (
                  <>
                    <Cloud size={16} className="text-[var(--primary)]" />
                    <span>{userPacks.find(p => p.id === saveDestination.packId)?.title || 'Unknown Pack'}</span>
                  </>
                ) : (
                  <>
                    <Cloud size={16} className="text-[var(--primary)]" />
                    <span>{SOURCE_META[cloudPacks.find(p => p.id === saveDestination.packId)?.source as PromptSource]?.label || 'Saved Pack'}</span>
                  </>
                )}
              </span>
              <ChevronDown size={16} className={`text-[var(--muted-foreground)] transition-transform ${showDestinationDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDestinationDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {/* Local packs header */}
                <div className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] bg-[var(--accent)]/50">
                  Local Packs
                </div>
                {(Object.keys(SOURCE_META) as PromptSource[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSaveDestination({ type: 'local', source: s });
                      setSource(s);
                      setShowDestinationDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--accent)] ${
                      saveDestination.type === 'local' && saveDestination.source === s ? 'bg-[var(--accent)]' : ''
                    }`}
                  >
                    <span>{SOURCE_META[s].icon}</span>
                    <span className="text-[var(--foreground)]">{SOURCE_META[s].label}</span>
                  </button>
                ))}

                {/* Cloud packs - only show if signed in */}
                {session && (userPacks.length > 0 || cloudPacks.length > 0) && (
                  <>
                    {/* User Packs (from web dashboard) */}
                    {userPacks.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] bg-[var(--accent)]/50 border-t border-[var(--border)]">
                          Your Prompt Packs
                        </div>
                        {userPacks.map((pack) => (
                          <button
                            key={pack.id}
                            type="button"
                            onClick={() => {
                              setSaveDestination({ type: 'userPack', packId: pack.id });
                              setShowDestinationDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--accent)] ${
                              saveDestination.type === 'userPack' && saveDestination.packId === pack.id ? 'bg-[var(--accent)]' : ''
                            }`}
                          >
                            <Cloud size={16} className="text-[var(--primary)]" />
                            <span className="text-[var(--foreground)]">{pack.title}</span>
                            <span className="text-xs text-[var(--muted-foreground)] ml-auto">{pack.promptCount}</span>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Saved Packs (from extension) */}
                    {cloudPacks.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] bg-[var(--accent)]/50 border-t border-[var(--border)]">
                          Saved from Extension
                        </div>
                        {cloudPacks.map((pack) => {
                          const meta = SOURCE_META[pack.source as PromptSource];
                          return (
                            <button
                              key={pack.id}
                              type="button"
                              onClick={() => {
                                setSaveDestination({ type: 'savedPack', packId: pack.id });
                                setShowDestinationDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--accent)] ${
                                saveDestination.type === 'savedPack' && saveDestination.packId === pack.id ? 'bg-[var(--accent)]' : ''
                              }`}
                            >
                              <span>{meta?.icon || '📦'}</span>
                              <span className="text-[var(--foreground)]">{meta?.label || pack.source}</span>
                              <span className="text-xs text-[var(--muted-foreground)] ml-auto">{pack.promptCount}</span>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          {(saveDestination.type === 'userPack' || saveDestination.type === 'savedPack') && (
            <p className="mt-1 text-xs text-[var(--primary)]">
              Will sync to cloud
            </p>
          )}
        </div>

        {/* Character count */}
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>{text.length} characters</span>
          <span>{text.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>
    </div>
  );
}
