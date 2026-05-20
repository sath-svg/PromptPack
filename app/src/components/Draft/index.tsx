import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, Cloud, ChevronDown, Sparkles } from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { ENHANCE_API_URL } from '../../lib/constants';
import { tauriFetch } from '../../lib/tauriFetch';
import { track as trackEvent } from '../../lib/posthog-events';

type EnhanceMode = 'structured' | 'clarity' | 'concise' | 'strict';

const DRAFT_KEY_PREFIX = 'promptpack-draft-';
const MAX_DRAFTS = 3;

interface DraftData {
  id: number;
  text: string;
  header: string;
  lastSaved: number;
  name: string;
}

type SaveDestination = { type: 'userPack'; packId: string } | { type: 'none' };

function loadAllDrafts(): DraftData[] {
  const drafts: DraftData[] = [];
  for (let i = 0; i < MAX_DRAFTS; i++) {
    const saved = localStorage.getItem(`${DRAFT_KEY_PREFIX}${i}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        drafts.push({
          id: parsed.id ?? i,
          text: parsed.text ?? '',
          header: parsed.header ?? '',
          lastSaved: parsed.lastSaved ?? 0,
          name: parsed.name ?? `Draft ${i + 1}`,
        });
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
    lastSaved: 0,
    name: `Draft ${id + 1}`,
  };
}

export function DraftPage() {
  const { session } = useAuthStore();
  const { userPacks, addUserPackPrompt, loadedUserPacks, fetchUserPackPrompts, fetchAllPacks } = useSyncStore();

  const [activeTab, setActiveTab] = useState(0);
  const [drafts, setDrafts] = useState<DraftData[]>(() => loadAllDrafts());
  const [isSaving, setIsSaving] = useState(false);

  const currentDraft = drafts[activeTab];
  const text = currentDraft?.text || '';
  const header = currentDraft?.header || '';
  const lastSaved = currentDraft?.lastSaved || null;

  const [saveDestination, setSaveDestination] = useState<SaveDestination>({ type: 'none' });
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);

  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>('structured');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user_id && userPacks.length === 0) {
      Promise.resolve(fetchAllPacks(session.user_id)).catch((err) =>
        useNotificationStore.getState().report(err, {
          source: 'Draft.fetchAllPacks',
        }),
      );
    }
  }, [session?.user_id]);

  // Auto-select first skillset once available
  useEffect(() => {
    if (saveDestination.type === 'none' && userPacks.length > 0) {
      setSaveDestination({ type: 'userPack', packId: userPacks[0].id });
    }
    if (saveDestination.type === 'userPack' && !userPacks.find(p => p.id === saveDestination.packId)) {
      setSaveDestination(userPacks.length > 0 ? { type: 'userPack', packId: userPacks[0].id } : { type: 'none' });
    }
  }, [userPacks, saveDestination]);

  const updateCurrentDraft = useCallback((updates: Partial<DraftData>) => {
    setDrafts(prev => {
      const newDrafts = [...prev];
      newDrafts[activeTab] = { ...newDrafts[activeTab], ...updates };
      return newDrafts;
    });
  }, [activeTab]);

  const setText = (newText: string) => updateCurrentDraft({ text: newText });
  const setHeader = (newHeader: string) => updateCurrentDraft({ header: newHeader });

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

  useEffect(() => {
    if (!text && !header) return;

    const timer = setInterval(() => {
      saveDraft();
    }, 15000);

    return () => clearInterval(timer);
  }, [text, header, saveDraft]);

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

  const saveAsPrompt = async () => {
    if (!text.trim()) return;
    if (saveDestination.type !== 'userPack') return;

    setIsSavingToCloud(true);

    try {
      const pack = userPacks.find(p => p.id === saveDestination.packId);
      if (pack && !loadedUserPacks[saveDestination.packId]) {
        await fetchUserPackPrompts(pack);
      }
      const success = await addUserPackPrompt(saveDestination.packId, text.trim(), header.trim() || undefined);

      if (success) {
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
  };

  const formatLastSaved = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

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
    trackEvent('enhance_used', { mode: enhanceMode });

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

  const hasDraftContent = (draft: DraftData) => draft.text.trim() || draft.header.trim();
  const selectedPack = saveDestination.type === 'userPack' ? userPacks.find(p => p.id === saveDestination.packId) : null;
  const canSave = !!text.trim() && saveDestination.type === 'userPack' && !isSavingToCloud;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Draft Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[var(--border)]">
        {drafts.map((draft, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveTab(index);
              trackEvent('draft_tab_clicked', { tab_index: index });
            }}
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
            disabled={!canSave}
            title={saveDestination.type !== 'userPack' ? 'Select a skillset to save to' : undefined}
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
            data-tutorial="draft"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Use {'{variable}'} for arguments
          </p>
        </div>

        {/* Save Destination */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Save To Skillset
          </label>
          {!session ? (
            <div className="px-3 py-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
              Sign in to save prompts to your skillsets.
            </div>
          ) : userPacks.length === 0 ? (
            <div className="px-3 py-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
              No skillsets yet. Create one from the dashboard to start saving prompts.
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDestinationDropdown(!showDestinationDropdown)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-left flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {selectedPack ? (
                    <>
                      <span>{selectedPack.icon || '📦'}</span>
                      <span>{selectedPack.title}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{selectedPack.promptCount} prompts</span>
                    </>
                  ) : (
                    <>
                      <Cloud size={16} className="text-[var(--muted-foreground)]" />
                      <span className="text-[var(--muted-foreground)]">Select a skillset</span>
                    </>
                  )}
                </span>
                <ChevronDown size={16} className={`text-[var(--muted-foreground)] transition-transform ${showDestinationDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDestinationDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
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
                      <span>{pack.icon || '📦'}</span>
                      <span className="text-[var(--foreground)]">{pack.title}</span>
                      <span className="text-xs text-[var(--muted-foreground)] ml-auto">{pack.promptCount}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
