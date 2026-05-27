import { useState, useCallback, useEffect } from 'react';
import { Upload, FileUp, AlertCircle, Check, Package, RefreshCw, Plus, Lock } from 'lucide-react';
import { useSyncStore, type CloudPrompt } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { usePackLimits, getPackLimitMessage } from '../../hooks/usePackLimits';
import { track as trackEvent } from '../../lib/posthog-events';
import { decodeSkillFile, PasswordRequiredError } from '../../lib/skillsetDecoder';

export function ImportPage() {
  const { session, refreshTier } = useAuthStore();
  const { userPacks, fetchAllPacks, addUserPackPrompt, loadedUserPacks, fetchUserPackPrompts, createUserPack } = useSyncStore();
  const { canCreatePack, isAtLimit, tier, maxCustomPacks, currentUserPackCount } = usePackLimits();

  // Refresh tier on mount to ensure we have the latest
  useEffect(() => {
    if (session?.user_id) {
      refreshTier();
    }
  }, [session?.user_id]);

  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Parsed prompts ready to import
  const [parsedPrompts, setParsedPrompts] = useState<CloudPrompt[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [showPackSelector, setShowPackSelector] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // New pack creation
  const [createNewPack, setCreateNewPack] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState('');

  // Fetch user packs on mount
  useEffect(() => {
    if (session?.user_id && userPacks.length === 0) {
      fetchAllPacks(session.user_id);
    }
  }, [session?.user_id]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (
    file: File,
    pwd?: string,
    source: 'drop' | 'file_picker' = 'file_picker',
  ) => {
    setImporting(true);
    setError(null);
    setSuccess(null);
    setParsedPrompts([]);

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      let prompts: CloudPrompt[];
      try {
        const decoded = await decodeSkillFile(data, pwd);
        prompts = decoded.prompts;
      } catch (err) {
        if (err instanceof PasswordRequiredError) {
          setNeedsPassword(true);
          setPendingFile(file);
          setImporting(false);
          return;
        }
        throw err;
      }

      if (prompts.length === 0) {
        throw new Error('No prompts found in file');
      }

      const isEncryptedFile = data[0] === 0x50 && data[1] === 0x50 && data[2] === 0x4b && data[3] === 0x01;

      // Store parsed prompts and show pack selector
      setParsedPrompts(prompts);
      setShowPackSelector(true);
      setSuccess(`Found ${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} in "${file.name}". Select a pack to import into.`);
      trackEvent('pack_imported', {
        prompt_count: prompts.length,
        encrypted: !!pwd || isEncryptedFile,
        source,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const handleImportTopack = async () => {
    if (parsedPrompts.length === 0) return;

    // Handle creating a new pack
    if (createNewPack) {
      if (!newPackTitle.trim() || !session?.user_id) return;

      setImporting(true);
      setError(null);

      try {
        const newPack = await createUserPack(session.user_id, newPackTitle.trim(), parsedPrompts);

        if (newPack) {
          setSuccess(`Successfully created set "${newPack.title}" with ${parsedPrompts.length} prompts`);
          setParsedPrompts([]);
          setShowPackSelector(false);
          setSelectedPackId(null);
          setCreateNewPack(false);
          setNewPackTitle('');
        } else {
          throw new Error('Failed to create pack');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create pack');
      } finally {
        setImporting(false);
      }
      return;
    }

    // Handle importing to existing pack
    if (!selectedPackId) return;

    setImporting(true);
    setError(null);
    setImportProgress({ current: 0, total: parsedPrompts.length });

    try {
      // Make sure the pack is loaded
      const pack = userPacks.find(p => p.id === selectedPackId);
      if (!pack) throw new Error('Pack not found');

      if (!loadedUserPacks[selectedPackId]) {
        await fetchUserPackPrompts(pack);
      }

      // Import prompts one by one
      let successCount = 0;
      for (let i = 0; i < parsedPrompts.length; i++) {
        const prompt = parsedPrompts[i];
        setImportProgress({ current: i + 1, total: parsedPrompts.length });

        const success = await addUserPackPrompt(
          selectedPackId,
          prompt.text,
          prompt.header || undefined
        );

        if (success) {
          successCount++;
        }
      }

      setSuccess(`Successfully imported ${successCount} of ${parsedPrompts.length} prompts to "${pack.title}"`);
      setParsedPrompts([]);
      setShowPackSelector(false);
      setSelectedPackId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import prompts');
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.skill') || file.name.endsWith('.pmtpk'))) {
      processFile(file, undefined, 'drop');
    } else {
      setError('Please drop a .skill file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, undefined, 'file_picker');
    }
  };

  const handlePasswordSubmit = () => {
    if (pendingFile && password) {
      processFile(pendingFile, password);
      setNeedsPassword(false);
      setPendingFile(null);
      setPassword('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        Import Prompts
      </h2>
      <p className="text-[var(--muted-foreground)] mb-6">
        Import prompts from a .skill file or other supported formats.
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
        }`}
      >
        <input
          type="file"
          accept=".skill,.pmtpk"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDragging ? 'bg-[var(--primary)]/10' : 'bg-[var(--muted)]'
          }`}>
            <Upload size={28} className={isDragging ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'} />
          </div>

          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            Drop your .skill file here
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            or click to browse
          </p>
        </div>
      </div>

      {/* Password Dialog */}
      {needsPassword && (
        <div className="mt-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <h4 className="font-medium text-[var(--foreground)] mb-2">
            Password Required
          </h4>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            This file is encrypted. Enter the password to decrypt.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <button
              onClick={handlePasswordSubmit}
              disabled={!password}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Decrypt
            </button>
          </div>
        </div>
      )}

      {/* Pack Selector */}
      {showPackSelector && parsedPrompts.length > 0 && (
        <div className="mt-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <h4 className="font-medium text-[var(--foreground)] mb-2">
            Select Destination Pack
          </h4>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Choose which prompt set to import {parsedPrompts.length} prompt{parsedPrompts.length !== 1 ? 's' : ''} into.
          </p>

          {!session ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Please sign in to import prompts into your sets.
            </p>
          ) : (
            <>
              {/* Pack limit warning for Free tier */}
              {tier === 'free' && userPacks.length === 0 && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-500">
                    Free plan can only import into existing sets. Upgrade to Pro or Studio to create new sets.
                  </p>
                </div>
              )}

              {/* Pack limit warning when at limit */}
              {isAtLimit && tier !== 'free' && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-500">
                    {getPackLimitMessage(tier, currentUserPackCount)}
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {/* Create New Pack option */}
                <button
                  onClick={() => {
                    if (canCreatePack) {
                      setCreateNewPack(true);
                      setSelectedPackId(null);
                    }
                  }}
                  disabled={!canCreatePack}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    createNewPack
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : !canCreatePack
                        ? 'border-[var(--border)] opacity-60 cursor-not-allowed'
                        : 'border-dashed border-[var(--border)] hover:border-[var(--muted-foreground)]'
                  }`}
                >
                  {canCreatePack ? (
                    <Plus size={20} className="text-[var(--primary)]" />
                  ) : (
                    <Lock size={20} className="text-[var(--muted-foreground)]" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[var(--foreground)]">Create New Set</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {canCreatePack ? (
                        maxCustomPacks === 0
                          ? 'Not available on Free plan'
                          : `Import as a separate prompt set (${currentUserPackCount}/${maxCustomPacks} used)`
                      ) : (
                        getPackLimitMessage(tier, currentUserPackCount)
                      )}
                    </p>
                  </div>
                  {createNewPack && (
                    <Check size={18} className="text-[var(--primary)]" />
                  )}
                </button>

                {/* Existing packs */}
                {userPacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      setCreateNewPack(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedPackId === pack.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                    }`}
                  >
                    <Package size={20} className="text-[var(--primary)]" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-[var(--foreground)]">{pack.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {pack.promptCount} prompt{pack.promptCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedPackId === pack.id && (
                      <Check size={18} className="text-[var(--primary)]" />
                    )}
                  </button>
                ))}
              </div>

              {/* New pack title input */}
              {createNewPack && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Set Name
                  </label>
                  <input
                    type="text"
                    value={newPackTitle}
                    onChange={(e) => setNewPackTitle(e.target.value)}
                    placeholder="Enter set name..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleImportTopack}
                  disabled={(!selectedPackId && !createNewPack) || (createNewPack && !newPackTitle.trim()) || importing}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {importing ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {importing
                    ? importProgress
                      ? `Importing ${importProgress.current}/${importProgress.total}...`
                      : createNewPack
                        ? 'Creating pack...'
                        : 'Importing...'
                    : `Import ${parsedPrompts.length} Prompts`}
                </button>
                <button
                  onClick={() => {
                    setShowPackSelector(false);
                    setParsedPrompts([]);
                    setSelectedPackId(null);
                    setCreateNewPack(false);
                    setNewPackTitle('');
                    setSuccess(null);
                  }}
                  disabled={importing}
                  className="px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-4 flex items-center gap-2 p-4 rounded-lg bg-red-500/10 text-red-500">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && !showPackSelector && (
        <div className="mt-4 flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-500">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {importing && !showPackSelector && (
        <div className="mt-4 flex items-center justify-center gap-2 p-4 text-[var(--muted-foreground)]">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing file...</span>
        </div>
      )}

      {/* Supported Formats */}
      <div className="mt-8">
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
          Supported Formats
        </h4>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] w-fit">
          <FileUp size={20} className="text-[var(--primary)]" />
          <div>
            <p className="font-medium text-[var(--foreground)]">.skill</p>
            <p className="text-xs text-[var(--muted-foreground)]">Skill Set format (also accepts legacy .pmtpk)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
