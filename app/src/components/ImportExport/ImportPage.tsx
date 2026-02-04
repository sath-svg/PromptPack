import { useState, useCallback, useEffect } from 'react';
import { Upload, FileUp, AlertCircle, Check, Package, RefreshCw, Plus, Lock } from 'lucide-react';
import { useSyncStore, type CloudPrompt } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { usePackLimits, getPackLimitMessage } from '../../hooks/usePackLimits';

// XOR key for obfuscation (matches web/extension)
const OBFUSCATE_KEY = new Uint8Array([0x50, 0x72, 0x6F, 0x6D, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6B]); // "PromptPack"
const HEADER_SIZE = 37; // magic (4) + version (1) + hash (32)
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

// XOR de-obfuscate
function xorDeobfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

// Gzip decompress using native APIs
async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const stream = new Blob([buffer]).stream();
  const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
  const reader = decompressed.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// Derive AES key from password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

// Decode obfuscated .pmtpk file
async function decodeObfuscated(bytes: Uint8Array): Promise<CloudPrompt[]> {
  if (bytes.length < HEADER_SIZE) {
    throw new Error('File is too small or corrupted');
  }

  const obfuscated = bytes.slice(HEADER_SIZE);
  const compressed = xorDeobfuscate(obfuscated);
  const jsonBytes = await gzipDecompress(compressed);

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(jsonBytes);
  const data = JSON.parse(jsonString);

  if (data.prompts && Array.isArray(data.prompts)) {
    return data.prompts;
  }

  throw new Error('Invalid pack format');
}

// Decrypt encrypted .pmtpk file
async function decryptPmtpk(bytes: Uint8Array, password: string): Promise<CloudPrompt[]> {
  const encryptedHeaderSize = HEADER_SIZE + SALT_LENGTH + IV_LENGTH;

  if (bytes.length < encryptedHeaderSize) {
    throw new Error('File is too small or corrupted');
  }

  const salt = bytes.slice(HEADER_SIZE, HEADER_SIZE + SALT_LENGTH);
  const iv = bytes.slice(HEADER_SIZE + SALT_LENGTH, encryptedHeaderSize);
  const encrypted = bytes.slice(encryptedHeaderSize);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decompressed = await gzipDecompress(new Uint8Array(decrypted));
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decompressed);
    const data = JSON.parse(jsonString);

    if (data.prompts && Array.isArray(data.prompts)) {
      return data.prompts;
    }

    throw new Error('Invalid pack format');
  } catch (e) {
    if (e instanceof Error && e.message === 'Invalid pack format') throw e;
    throw new Error('Wrong password');
  }
}

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

  const processFile = async (file: File, pwd?: string) => {
    setImporting(true);
    setError(null);
    setSuccess(null);
    setParsedPrompts([]);

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Check magic bytes (PPK\0 or PPK\1)
      if (data[0] !== 80 || data[1] !== 80 || data[2] !== 75) {
        throw new Error('Invalid PromptPack file format');
      }

      const version = data[3];
      const isEncrypted = version === 1;

      if (isEncrypted && !pwd) {
        setNeedsPassword(true);
        setPendingFile(file);
        setImporting(false);
        return;
      }

      // Decode the file
      let prompts: CloudPrompt[];
      if (isEncrypted) {
        prompts = await decryptPmtpk(data, pwd!);
      } else {
        prompts = await decodeObfuscated(data);
      }

      if (prompts.length === 0) {
        throw new Error('No prompts found in file');
      }

      // Store parsed prompts and show pack selector
      setParsedPrompts(prompts);
      setShowPackSelector(true);
      setSuccess(`Found ${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} in "${file.name}". Select a pack to import into.`);

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
          setSuccess(`Successfully created pack "${newPack.title}" with ${parsedPrompts.length} prompts`);
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
    if (file && file.name.endsWith('.pmtpk')) {
      processFile(file);
    } else {
      setError('Please drop a .pmtpk file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
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
        Import prompts from a .pmtpk file or other supported formats.
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
          accept=".pmtpk"
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
            Drop your .pmtpk file here
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
            Choose which prompt pack to import {parsedPrompts.length} prompt{parsedPrompts.length !== 1 ? 's' : ''} into.
          </p>

          {!session ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Please sign in to import prompts into your packs.
            </p>
          ) : (
            <>
              {/* Pack limit warning for Free tier */}
              {tier === 'free' && userPacks.length === 0 && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-500">
                    Free plan can only import into existing packs. Upgrade to Pro or Studio to create new packs.
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
                    <p className="font-medium text-[var(--foreground)]">Create New Pack</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {canCreatePack ? (
                        maxCustomPacks === 0
                          ? 'Not available on Free plan'
                          : `Import as a separate prompt pack (${currentUserPackCount}/${maxCustomPacks} used)`
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
                    Pack Name
                  </label>
                  <input
                    type="text"
                    value={newPackTitle}
                    onChange={(e) => setNewPackTitle(e.target.value)}
                    placeholder="Enter pack name..."
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
            <p className="font-medium text-[var(--foreground)]">.pmtpk</p>
            <p className="text-xs text-[var(--muted-foreground)]">PromptPack format</p>
          </div>
        </div>
      </div>
    </div>
  );
}
