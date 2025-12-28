"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  encodePmtpk,
  decodePmtpk,
  encryptPmtpk,
  decryptPmtpk,
  isEncrypted,
  isObfuscated,
  SCHEMA_VERSION,
} from "../../lib/crypto";
import { WORKERS_API_URL } from "../../lib/constants";

type SavedPromptsProps = {
  userId: Id<"users">;
};

type DecodedPrompt = {
  text: string;
  url?: string;
  createdAt: number;
};

type SelectedPack = {
  id: Id<"savedPacks">;
  source: "chatgpt" | "claude" | "gemini";
  r2Key: string;
  promptCount: number;
  isEncrypted?: boolean;
  fileData?: string; // cached file data after fetching
  password?: string; // cached password for re-encryption
};

// Undo/Redo action types
type HistoryAction = {
  type: "delete-prompt" | "delete-pack";
  prompts: DecodedPrompt[];
  packInfo?: {
    id: Id<"savedPacks">;
    source: "chatgpt" | "claude" | "gemini";
    r2Key: string;
    isEncrypted: boolean;
    password?: string;
  };
  promptIndex?: number;
};

function getSourceTitle(source: string): string {
  switch (source) {
    case "chatgpt":
      return "ChatGPT";
    case "claude":
      return "Claude";
    case "gemini":
      return "Gemini";
    default:
      return source;
  }
}

export function SavedPrompts({ userId }: SavedPromptsProps) {
  const savedPacks = useQuery(api.savedPacks.listByUser, { userId });
  const removePack = useMutation(api.savedPacks.remove);
  const upsertPack = useMutation(api.savedPacks.upsert);

  const [selectedPack, setSelectedPack] = useState<SelectedPack | null>(null);
  const [password, setPassword] = useState("");
  const [decryptedPrompts, setDecryptedPrompts] = useState<DecodedPrompt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  // Toast helper
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  if (savedPacks === undefined) {
    return <div className="loading">Loading saved prompts...</div>;
  }

  if (savedPacks.length === 0) {
    return (
      <div className="saved-prompts-empty">
        <p>No prompts saved yet.</p>
        <p style={{ fontSize: "14px", color: "var(--muted)" }}>
          Save prompts from the extension to see them here.
        </p>
      </div>
    );
  }

  const handlePackClick = async (pack: typeof savedPacks[0]) => {
    setError(null);
    setDecryptedPrompts(null);
    setPassword("");

    // First, fetch the file to check if it's encrypted or obfuscated
    try {
      const fetchResponse = await fetch(`${WORKERS_API_URL}/storage/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ r2Key: pack.r2Key }),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}));
        setError(errorData.error || "Failed to fetch file from storage");
        return;
      }

      const { fileData } = await fetchResponse.json();
      const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

      // Check file type using imported function
      const fileIsEncrypted = isEncrypted(bytes);

      if (fileIsEncrypted) {
        // Show password modal
        setSelectedPack({
          id: pack._id,
          source: pack.source,
          r2Key: pack.r2Key,
          promptCount: pack.promptCount,
          isEncrypted: true,
          fileData: fileData,
        });
      } else {
        // Obfuscated file - decode directly without password
        try {
          const prompts = await decodeObfuscatedFile(bytes);
          setSelectedPack({
            id: pack._id,
            source: pack.source,
            r2Key: pack.r2Key,
            promptCount: pack.promptCount,
            isEncrypted: false,
            fileData: fileData,
          });
          setDecryptedPrompts(prompts);
        } catch (e) {
          console.error("Decode failed:", e);
          setError("Failed to decode file");
        }
      }
    } catch (e) {
      console.error("Fetch failed:", e);
      setError("Failed to fetch file - check connection");
    }
  };

  const handleDecrypt = async () => {
    if (!selectedPack || !selectedPack.fileData || password.length !== 5) {
      setError("Password must be exactly 5 characters");
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      // Use cached fileData from pack click
      const bytes = Uint8Array.from(atob(selectedPack.fileData), (c) => c.charCodeAt(0));

      // Check if encrypted
      if (!isEncrypted(bytes)) {
        setError("File is not encrypted or corrupted");
        setIsDecrypting(false);
        return;
      }

      // Use shared crypto function
      const jsonString = await decryptPmtpk(bytes, password);
      const data = JSON.parse(jsonString);

      if (data.prompts && Array.isArray(data.prompts)) {
        setDecryptedPrompts(data.prompts);
        // Cache password for re-encryption when deleting prompts
        setSelectedPack({ ...selectedPack, password });
      } else {
        setError("Invalid pack format");
      }
    } catch (e) {
      console.error("Decryption failed:", e);
      setError("Wrong password or corrupted file");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleClose = () => {
    setSelectedPack(null);
    setPassword("");
    setDecryptedPrompts(null);
    setError(null);
  };

  // Delete individual prompt
  const handleDeletePrompt = async (index: number) => {
    if (!selectedPack || !decryptedPrompts) return;

    const promptToDelete = decryptedPrompts[index];
    const newPrompts = [...decryptedPrompts];
    newPrompts.splice(index, 1);

    try {
      if (newPrompts.length === 0) {
        // If no prompts left, delete the entire pack
        await handleDeletePack();
        return;
      }

      // Re-encode and upload the modified pack
      const fileData = await encodePrompts(newPrompts, selectedPack.source, selectedPack.isEncrypted ?? false, selectedPack.password);

      // Upload to R2
      await fetch(`${WORKERS_API_URL}/storage/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2Key: selectedPack.r2Key,
          fileData: btoa(String.fromCharCode(...fileData)),
          promptCount: newPrompts.length,
        }),
      });

      // Update Convex metadata
      await upsertPack({
        userId,
        source: selectedPack.source,
        r2Key: selectedPack.r2Key,
        promptCount: newPrompts.length,
        fileSize: fileData.length,
      });

      // Push to undo stack (clear redo stack)
      setUndoStack([...undoStack, {
        type: "delete-prompt",
        prompts: [promptToDelete],
        promptIndex: index,
        packInfo: {
          id: selectedPack.id,
          source: selectedPack.source,
          r2Key: selectedPack.r2Key,
          isEncrypted: selectedPack.isEncrypted || false,
          password: selectedPack.password,
        },
      }]);
      setRedoStack([]);

      // Update local state
      setDecryptedPrompts(newPrompts);
      setSelectedPack({ ...selectedPack, promptCount: newPrompts.length });
      showToast("Prompt deleted");
    } catch (e) {
      console.error("Delete prompt failed:", e);
      showToast("Failed to delete prompt");
    }
  };

  // Delete entire pack
  const handleDeletePack = async () => {
    if (!selectedPack) return;

    try {
      // Push to undo stack with all prompts (clear redo stack)
      if (decryptedPrompts) {
        setUndoStack([...undoStack, {
          type: "delete-pack",
          prompts: decryptedPrompts,
          packInfo: {
            id: selectedPack.id,
            source: selectedPack.source,
            r2Key: selectedPack.r2Key,
            isEncrypted: selectedPack.isEncrypted || false,
            password: selectedPack.password,
          },
        }]);
        setRedoStack([]);
      }

      // Delete from R2
      await fetch(`${WORKERS_API_URL}/storage/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key: selectedPack.r2Key }),
      });

      // Delete from Convex
      await removePack({ id: selectedPack.id });

      handleClose();
      showToast("Pack deleted");
    } catch (e) {
      console.error("Delete pack failed:", e);
      showToast("Failed to delete pack");
    }
  };

  // Undo action
  const handleUndo = async () => {
    const action = undoStack[undoStack.length - 1];
    if (!action) {
      showToast("Nothing to undo");
      return;
    }

    try {
      if (action.type === "delete-prompt" && action.packInfo) {
        // Restore deleted prompt
        const currentPrompts = decryptedPrompts || [];
        const restoredPrompts = [...currentPrompts];
        restoredPrompts.splice(action.promptIndex || 0, 0, action.prompts[0]);

        // Re-encode and upload
        const fileData = await encodePrompts(restoredPrompts, action.packInfo.source, action.packInfo.isEncrypted, action.packInfo.password);

        await fetch(`${WORKERS_API_URL}/storage/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            r2Key: action.packInfo.r2Key,
            fileData: btoa(String.fromCharCode(...fileData)),
            promptCount: restoredPrompts.length,
          }),
        });

        await upsertPack({
          userId,
          source: action.packInfo.source,
          r2Key: action.packInfo.r2Key,
          promptCount: restoredPrompts.length,
          fileSize: fileData.length,
        });

        setDecryptedPrompts(restoredPrompts);
        if (selectedPack) {
          setSelectedPack({ ...selectedPack, promptCount: restoredPrompts.length });
        }
        showToast("Prompt restored");
      } else if (action.type === "delete-pack" && action.packInfo) {
        // Restore deleted pack
        const fileData = await encodePrompts(action.prompts, action.packInfo.source, action.packInfo.isEncrypted, action.packInfo.password);

        await fetch(`${WORKERS_API_URL}/storage/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            r2Key: action.packInfo.r2Key,
            fileData: btoa(String.fromCharCode(...fileData)),
            promptCount: action.prompts.length,
          }),
        });

        await upsertPack({
          userId,
          source: action.packInfo.source,
          r2Key: action.packInfo.r2Key,
          promptCount: action.prompts.length,
          fileSize: fileData.length,
        });

        showToast("Pack restored");
      }

      // Move from undo to redo stack
      setUndoStack(undoStack.slice(0, -1));
      setRedoStack([...redoStack, action]);
    } catch (e) {
      console.error("Undo failed:", e);
      showToast("Failed to undo");
    }
  };

  // Redo action
  const handleRedo = async () => {
    const action = redoStack[redoStack.length - 1];
    if (!action) {
      showToast("Nothing to redo");
      return;
    }

    try {
      if (action.type === "delete-prompt" && action.packInfo) {
        // Re-delete the prompt
        const currentPrompts = decryptedPrompts || [];
        const newPrompts = [...currentPrompts];
        newPrompts.splice(action.promptIndex || 0, 1);

        if (newPrompts.length === 0) {
          // Delete pack if no prompts left
          await fetch(`${WORKERS_API_URL}/storage/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ r2Key: action.packInfo.r2Key }),
          });
          await removePack({ id: action.packInfo.id });
          handleClose();
        } else {
          const fileData = await encodePrompts(newPrompts, action.packInfo.source, action.packInfo.isEncrypted, action.packInfo.password);

          await fetch(`${WORKERS_API_URL}/storage/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              r2Key: action.packInfo.r2Key,
              fileData: btoa(String.fromCharCode(...fileData)),
              promptCount: newPrompts.length,
            }),
          });

          await upsertPack({
            userId,
            source: action.packInfo.source,
            r2Key: action.packInfo.r2Key,
            promptCount: newPrompts.length,
            fileSize: fileData.length,
          });

          setDecryptedPrompts(newPrompts);
          if (selectedPack) {
            setSelectedPack({ ...selectedPack, promptCount: newPrompts.length });
          }
        }
        showToast("Prompt deleted");
      } else if (action.type === "delete-pack" && action.packInfo) {
        // Re-delete the pack
        await fetch(`${WORKERS_API_URL}/storage/remove`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ r2Key: action.packInfo.r2Key }),
        });
        await removePack({ id: action.packInfo.id });
        handleClose();
        showToast("Pack deleted");
      }

      // Move from redo to undo stack
      setRedoStack(redoStack.slice(0, -1));
      setUndoStack([...undoStack, action]);
    } catch (e) {
      console.error("Redo failed:", e);
      showToast("Failed to redo");
    }
  };

  // Export pack as .pmtpk file
  const handleExportPack = async () => {
    if (!selectedPack || !decryptedPrompts) return;

    try {
      // Ask if user wants to encrypt
      const exportPassword = prompt("Enter a 5-character password to encrypt (or leave empty for no encryption):");
      if (exportPassword === null) return; // User cancelled

      if (exportPassword && exportPassword.length !== 5) {
        showToast("Password must be exactly 5 characters");
        return;
      }

      const fileData = await encodePrompts(decryptedPrompts, selectedPack.source, !!exportPassword, exportPassword || undefined);

      const blob = new Blob([new Uint8Array(fileData)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedPack.source}-prompts-${Date.now()}.pmtpk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Exported ${decryptedPrompts.length} prompt${decryptedPrompts.length !== 1 ? "s" : ""}${exportPassword ? " (encrypted)" : ""}`);
    } catch (e) {
      console.error("Export failed:", e);
      showToast("Failed to export pack");
    }
  };

  const totalPrompts = savedPacks.reduce((sum, pack) => sum + pack.promptCount, 0);

  return (
    <div className="saved-prompts">
      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}

      <div className="saved-prompts-summary">
        <span className="total-count">{totalPrompts} prompts</span>
        <span className="source-count">
          across {savedPacks.length} pack{savedPacks.length !== 1 ? "s" : ""}
        </span>
        <div className="history-actions">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="btn btn-icon"
            title="Undo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="btn btn-icon"
            title="Redo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="saved-packs-list">
        {savedPacks.map((pack) => (
          <button
            key={pack._id}
            className="saved-pack-item saved-pack-button"
            onClick={() => handlePackClick(pack)}
          >
            <div className="pack-title">
              <span className={`source-icon source-${pack.source}`}>
                {pack.source === "chatgpt" ? "🤖" : pack.source === "claude" ? "🧠" : "✨"}
              </span>
              <span className="pack-name">{getSourceTitle(pack.source)}</span>
            </div>
            <div className="pack-info">
              <span className="prompt-count">{pack.promptCount} prompts</span>
              <span className="last-updated">
                {new Date(pack.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Password Modal - only show for encrypted files */}
      {selectedPack && selectedPack.isEncrypted && !decryptedPrompts && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Unlock {getSourceTitle(selectedPack.source)} Pack</h3>
            <p className="modal-subtitle">
              Enter your 5-character password to view {selectedPack.promptCount} prompts
            </p>

            <div className="password-input-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                maxLength={5}
                className="password-input"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
              />
              <button
                onClick={handleDecrypt}
                disabled={password.length !== 5 || isDecrypting}
                className="btn btn-primary unlock-btn"
              >
                {isDecrypting ? "Decrypting..." : "Unlock"}
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button onClick={handleClose} className="btn btn-secondary close-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Prompts Viewer Modal */}
      {selectedPack && decryptedPrompts && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{getSourceTitle(selectedPack.source)} Prompts</h3>
              <div className="modal-actions">
                <button
                  onClick={handleExportPack}
                  className="btn btn-icon"
                  title="Export pack"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </button>
                <button
                  onClick={handleDeletePack}
                  className="btn btn-icon btn-danger"
                  title="Delete pack"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
                <button onClick={handleClose} className="close-icon">
                  ✕
                </button>
              </div>
            </div>

            <div className="prompts-list">
              {decryptedPrompts.map((prompt, index) => (
                <div key={index} className="prompt-item">
                  <div className="prompt-text">{prompt.text}</div>
                  <div className="prompt-meta">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(prompt.text);
                        showToast("Copied");
                      }}
                      className="prompt-copy-btn"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                    <span className="prompt-date">
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeletePrompt(index)}
                      className="btn btn-icon btn-small btn-danger"
                      title="Delete prompt"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Decode obfuscated (non-encrypted) .pmtpk file
async function decodeObfuscatedFile(bytes: Uint8Array): Promise<DecodedPrompt[]> {
  // Use shared crypto function
  const jsonString = await decodePmtpk(bytes);
  const data = JSON.parse(jsonString);

  if (data.prompts && Array.isArray(data.prompts)) {
    return data.prompts;
  }

  throw new Error("Invalid pack format");
}

// Encode prompts to .pmtpk format (obfuscated or encrypted)
async function encodePrompts(
  prompts: DecodedPrompt[],
  source: "chatgpt" | "claude" | "gemini",
  encrypt: boolean,
  password?: string
): Promise<Uint8Array> {
  // Map source to display title
  const sourceTitle = source === "chatgpt" ? "ChatGPT" : source === "claude" ? "Claude" : "Gemini";

  const exportData = {
    version: SCHEMA_VERSION,
    source,
    title: sourceTitle, // Include title for display in popup
    exportedAt: new Date().toISOString(),
    prompts: prompts.map((p) => ({
      text: p.text,
      url: p.url,
      createdAt: p.createdAt,
    })),
  };

  const jsonString = JSON.stringify(exportData);

  // Use shared crypto functions
  if (encrypt && password) {
    return await encryptPmtpk(jsonString, password);
  } else {
    return await encodePmtpk(jsonString);
  }
}
