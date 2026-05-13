import { useState } from 'react';
import { Download, Cloud, X, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { save as tauriSave } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { createSkillsetFile, encodeSkillset, encryptSkillset } from '../../lib/skillsetFileEncoder';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { tauriFetch } from '../../lib/tauriFetch';
import { WORKERS_API_URL } from '../../lib/constants';
import type { StyleCharacteristics, SkillPrompt } from '../../lib/styleAnalyzer';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface SkillsetData {
  title: string;
  styleCharacteristics: StyleCharacteristics;
  prompts: SkillPrompt[];
  images: UploadedImage[];
}

interface ExportModalProps {
  onClose: () => void;
  /**
   * Called after successful export (file written or cloud upload completed).
   * Parent should reset all skillset state — this batch is done.
   */
  onExportSuccess?: () => void;
  skillsetData: SkillsetData;
}

type ExportMode = 'download' | 'upload';

// Convert Uint8Array to base64 (chunked for large arrays)
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function ExportModal({ onClose, onExportSuccess, skillsetData }: ExportModalProps) {
  // Use parent's reset callback if provided, otherwise just close
  const finishExport = () => {
    if (onExportSuccess) onExportSuccess();
    else onClose();
  };

  const [mode, setMode] = useState<ExportMode>('download');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password / encryption state
  const [enableEncryption, setEnableEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { defaultDownloadFolder, skipDownloadDialog } = useSettingsStore();
  const { session } = useAuthStore();

  const passwordsMatch = !enableEncryption || (password.length > 0 && password === confirmPassword);

  const buildPayload = () => ({
    version: '1.0',
    type: 'skillset' as const,
    title: skillsetData.title,
    styleCharacteristics: skillsetData.styleCharacteristics,
    prompts: skillsetData.prompts,
    exportedAt: Date.now(),
  });

  const safeFilename = () =>
    `skillset-${skillsetData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.skill`;

  const handleExportLocal = async () => {
    if (enableEncryption && !passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const payload = buildPayload();
      const fileBytes = enableEncryption
        ? await encryptSkillset(payload, password)
        : await encodeSkillset(payload);

      const filename = safeFilename();

      // Try Tauri save dialog (with default folder if configured)
      try {
        let filePath: string | null = null;

        if (skipDownloadDialog && defaultDownloadFolder) {
          // Skip dialog — write directly to default folder
          filePath = `${defaultDownloadFolder}/${filename}`.replace(/\\/g, '/');
        } else {
          filePath = await tauriSave({
            defaultPath: defaultDownloadFolder
              ? `${defaultDownloadFolder}/${filename}`.replace(/\\/g, '/')
              : filename,
            filters: [{ name: 'Skillset', extensions: ['skill'] }],
          });
        }

        if (filePath) {
          await writeFile(filePath, fileBytes);
          setIsExporting(false);
          finishExport();
          return;
        }
        // User cancelled dialog
        setIsExporting(false);
        return;
      } catch {
        // Tauri dialog unavailable (web) — fall back to browser download
        const blob = new Blob([fileBytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        finishExport();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsExporting(false);
    }
  };

  const handleExportCloud = async () => {
    if (enableEncryption && !passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!session?.user_id) {
      setError('Not signed in');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const payload = buildPayload();
      const fileBytes = enableEncryption
        ? await encryptSkillset(payload, password)
        : await encodeSkillset(payload);

      const fileData = bytesToBase64(fileBytes);

      // Upload to R2 via Workers API at users/{userId}/skillsets/{id}.skill
      // Note: dedicated /api/skillsets/create endpoint pending; using
      // generic pack upload for beta — same R2 + Convex flow.
      const response = await tauriFetch(`${WORKERS_API_URL}/storage/skillset-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user_id,
          title: skillsetData.title,
          fileData,
          fileSize: fileBytes.length,
          isEncrypted: enableEncryption,
          styleCharacteristics: skillsetData.styleCharacteristics,
          prompts: skillsetData.prompts,
          promptCount: skillsetData.prompts.length,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      setIsExporting(false);
      finishExport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <h2 className="font-semibold text-[var(--foreground)]">Export Skillset</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--accent)] transition-colors"
          >
            <X size={18} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Save your skillset locally or upload to cloud for syncing across devices.
          </p>

          {/* Mode */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--accent)]">
              <input
                type="radio"
                checked={mode === 'download'}
                onChange={() => setMode('download')}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-[var(--foreground)] text-sm">Download as .skill File</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Choose folder via system dialog. Share file with others.
                </p>
              </div>
              <Download size={18} className="text-[var(--muted-foreground)] flex-shrink-0" />
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--accent)]">
              <input
                type="radio"
                checked={mode === 'upload'}
                onChange={() => setMode('upload')}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-[var(--foreground)] text-sm">Upload to Cloud</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Stored in your Skillsets (separate from packs). Syncs across devices.
                </p>
              </div>
              <Cloud size={18} className="text-[var(--muted-foreground)] flex-shrink-0" />
            </label>
          </div>

          {/* Encryption toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableEncryption}
                onChange={(e) => {
                  setEnableEncryption(e.target.checked);
                  if (!e.target.checked) {
                    setPassword('');
                    setConfirmPassword('');
                  }
                }}
                className="rounded border-[var(--border)]"
              />
              <Lock size={14} className="text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--foreground)]">
                Password-protect (AES-GCM encryption)
              </span>
            </label>

            {enableEncryption && (
              <div className="space-y-2 pl-6">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={`w-full px-3 py-2 rounded-lg border bg-[var(--input)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                    password.length > 0 && !passwordsMatch
                      ? 'border-red-500'
                      : 'border-[var(--border)]'
                  }`}
                />
                {password.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

          {/* Default folder hint (download mode only) */}
          {mode === 'download' && (
            <div className="p-2.5 rounded-md bg-[var(--muted)]/20 text-xs text-[var(--muted-foreground)]">
              {skipDownloadDialog && defaultDownloadFolder ? (
                <>Saving to: <span className="text-[var(--foreground)] font-mono">{defaultDownloadFolder}</span> (skip dialog ON)</>
              ) : defaultDownloadFolder ? (
                <>Default folder: <span className="text-[var(--foreground)] font-mono">{defaultDownloadFolder}</span> — dialog will open</>
              ) : (
                <>No default folder. Set one in Settings to skip the dialog.</>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 rounded-lg bg-[var(--card)] border border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">SKILL SET SUMMARY</p>
            <p className="text-sm text-[var(--foreground)] mt-1 font-medium">{skillsetData.title}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {skillsetData.images.length} reference images • {skillsetData.prompts.length} prompts in skillset
              {enableEncryption ? ' • Encrypted' : ''}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'download' ? handleExportLocal : handleExportCloud}
              disabled={isExporting || (enableEncryption && !passwordsMatch)}
              className="flex-1 py-2 px-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isExporting
                ? mode === 'download'
                  ? 'Saving...'
                  : 'Uploading...'
                : mode === 'download'
                  ? 'Choose Folder & Save'
                  : 'Upload to Cloud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
