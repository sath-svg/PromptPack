import { useState, useCallback } from 'react';
import { Upload, FileUp, AlertCircle, Check } from 'lucide-react';

export function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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

      // For now, we'll just show a placeholder since crypto needs Tauri backend
      // TODO: Implement actual decryption with Tauri commands
      setSuccess(`File "${file.name}" ready for import. Crypto processing requires Tauri backend.`);

      // Placeholder: In real implementation, decrypt and parse prompts
      // const prompts = await decryptAndParse(data, pwd);
      // prompts.forEach(p => addPrompt(p));
      // setSuccess(`Successfully imported ${prompts.length} prompts`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
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

      {/* Status Messages */}
      {error && (
        <div className="mt-4 flex items-center gap-2 p-4 rounded-lg bg-red-500/10 text-red-500">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-500">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {importing && (
        <div className="mt-4 flex items-center justify-center gap-2 p-4 text-[var(--muted-foreground)]">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Importing...</span>
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
