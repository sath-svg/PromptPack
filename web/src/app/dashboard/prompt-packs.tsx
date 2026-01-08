"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import {
  encodePmtpk,
  decodePmtpk,
  encryptPmtpk,
  decryptPmtpk,
  isEncrypted,
  isObfuscated,
  SCHEMA_VERSION,
} from "../../lib/crypto";
import {
  FREE_PROMPT_LIMIT,
  PRO_PROMPT_LIMIT,
  MAX_PRO_PACKS,
  WEB_PACK_FORMAT,
  WEB_PACK_VERSION,
  PASSWORD_MAX_LENGTH,
  isValidPassword,
  TOAST_DURATION_MS,
  R2_API_URL,
} from "../../lib/constants";

type PromptPacksProps = {
  userId: Id<"users">;
  hasPro: boolean;
  clerkId: string;
  savedPromptsCount: number;
};

type WebPackData = {
  format: typeof WEB_PACK_FORMAT;
  version: number;
  prompts: Array<{
    text: string;
    createdAt: number;
  }>;
};

type SelectedPack = {
  id: Id<"userPacks">;
  title: string;
  fileData: string;
  prompts: WebPackData["prompts"];
  isEncrypted: boolean;
  password?: string;
};

// Undo/Redo action types
type HistoryAction = {
  type: "delete-prompt" | "delete-pack";
  packId: Id<"userPacks">;
  title: string;
  prompts: WebPackData["prompts"];
  promptIndex?: number;
};

function buildPackData(prompts: WebPackData["prompts"]): string {
  const payload: WebPackData = {
    format: WEB_PACK_FORMAT,
    version: WEB_PACK_VERSION,
    prompts,
  };
  return JSON.stringify(payload);
}

function parsePackData(fileData: string): WebPackData | null {
  try {
    const parsed = JSON.parse(fileData) as WebPackData;
    if (parsed.format !== WEB_PACK_FORMAT || !Array.isArray(parsed.prompts)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Check if fileData is base64 encoded binary (encrypted/obfuscated)
function isBinaryFormat(fileData: string): boolean {
  try {
    const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x50 && bytes[2] === 0x4B;
  } catch {
    return false;
  }
}

// Check if binary file is encrypted
function isEncryptedBinary(fileData: string): boolean {
  try {
    const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
    return isEncrypted(bytes);
  } catch {
    return false;
  }
}

// Decode obfuscated file using shared crypto
async function decodeObfuscatedFile(bytes: Uint8Array): Promise<WebPackData["prompts"]> {
  const jsonString = await decodePmtpk(bytes);
  const data = JSON.parse(jsonString);

  // Handle both old web-pack-v1 format and new shared format
  if (data.format === WEB_PACK_FORMAT && Array.isArray(data.prompts)) {
    return data.prompts;
  }

  // New shared format includes prompts array
  if (Array.isArray(data.prompts)) {
    return data.prompts.map((p: { text: string; createdAt: number; url?: string }) => ({
      text: p.text,
      createdAt: p.createdAt,
    }));
  }

  throw new Error("Invalid pack format");
}

// Decode encrypted file using shared crypto
async function decodeEncryptedFile(bytes: Uint8Array, password: string): Promise<WebPackData["prompts"]> {
  const jsonString = await decryptPmtpk(bytes, password);
  const data = JSON.parse(jsonString);

  // Handle both old web-pack-v1 format and new shared format
  if (data.format === WEB_PACK_FORMAT && Array.isArray(data.prompts)) {
    return data.prompts;
  }

  // New shared format includes prompts array
  if (Array.isArray(data.prompts)) {
    return data.prompts.map((p: { text: string; createdAt: number; url?: string }) => ({
      text: p.text,
      createdAt: p.createdAt,
    }));
  }

  throw new Error("Invalid pack format");
}

// Encode prompts using shared crypto library
async function encodePrompts(
  prompts: WebPackData["prompts"],
  encrypt: boolean,
  password?: string,
  title?: string
): Promise<Uint8Array> {
  // Use the shared format that's compatible with popup
  const exportData = {
    version: SCHEMA_VERSION,
    source: "chatgpt", // Default source for web packs (used for icon/color in popup)
    title: title || "Imported Pack", // Pack name for display
    exportedAt: new Date().toISOString(),
    prompts: prompts.map((p) => ({
      text: p.text,
      url: "", // Web packs don't have URLs
      createdAt: p.createdAt,
    })),
  };

  const jsonString = JSON.stringify(exportData);

  if (encrypt && password) {
    return await encryptPmtpk(jsonString, password);
  } else {
    return await encodePmtpk(jsonString);
  }
}

export function PromptPacks({ userId, hasPro, clerkId, savedPromptsCount }: PromptPacksProps) {
  const packs = useQuery(api.packs.listByAuthor, { authorId: userId });
  const gracePeriodInfo = useQuery(api.users.getGracePeriodInfo, { clerkId });
  const deletePack = useMutation(api.packs.remove);

  // Helper function to create pack via API (uploads to R2)
  const createPackViaAPI = async (title: string, fileData: string, promptCount: number) => {
    const response = await fetch("/api/packs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        fileData,
        promptCount,
        version: "1.0",
        price: 0,
        isPublic: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create pack");
    }

    return await response.json();
  };

  // Helper function to update pack via API (uploads to R2)
  const updatePackViaAPI = async (id: Id<"userPacks">, fileData: string, promptCount: number) => {
    const response = await fetch("/api/packs/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fileData, promptCount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update pack");
    }

    return await response.json();
  };

  const [selectedPack, setSelectedPack] = useState<SelectedPack | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPack, setPendingPack] = useState<{ id: Id<"userPacks">; title: string; fileData: string } | null>(null);
  const [packName, setPackName] = useState("");
  const [firstPrompt, setFirstPrompt] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [password, setPassword] = useState("");
  const [exportPassword, setExportPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  // Toast helper
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  // All packs are now stored in R2 with metadata in Convex
  // No need to filter - just display all packs
  const webPacks = packs ?? [];
  const packCount = webPacks.length;
  const webPackPrompts = webPacks.reduce((sum, pack) => sum + pack.promptCount, 0);
  // Available slots = max prompts - saved prompts already used
  const maxPrompts = hasPro ? PRO_PROMPT_LIMIT : FREE_PROMPT_LIMIT;
  const availableSlots = Math.max(0, maxPrompts - savedPromptsCount);
  const canCreate = hasPro && packCount < MAX_PRO_PACKS;

  const handlePackClick = async (pack: typeof webPacks[0]) => {
    setError(null);
    setIsSaving(true);

    try {
      // Fetch file from R2 using the Cloudflare Workers API
      const response = await fetch(`${R2_API_URL}/storage/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key: pack.r2Key }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pack file from R2");
      }

      const { fileData } = await response.json();

      const isBinary = isBinaryFormat(fileData);
      if (!isBinary) {
        const parsed = parsePackData(fileData);
        if (!parsed) {
          throw new Error("Invalid pack format");
        }

        setSelectedPack({
          id: pack._id,
          title: pack.title,
          fileData,
          prompts: parsed.prompts,
          isEncrypted: false,
        });
        return;
      }

      const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
      const encrypted = isEncrypted(bytes);

      // Check if it's encrypted or obfuscated
      if (encrypted) {
        // Need password
        setPendingPack({ id: pack._id, title: pack.title, fileData });
        setShowPasswordModal(true);
        setPassword("");
      } else {
        // Obfuscated - decode directly
        const prompts = await decodeObfuscatedFile(bytes);
        setSelectedPack({
          id: pack._id,
          title: pack.title,
          fileData,
          prompts,
          isEncrypted: false,
        });
      }
    } catch (e) {
      console.error("Failed to fetch pack:", e);
      setError("Failed to load pack");
    } finally {
      setIsSaving(false);
    }

    setNewPrompt("");
    setExportPassword("");
  };

  const handleDecrypt = async () => {
    if (!pendingPack || !isValidPassword(password)) {
      setError(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only`);
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      const bytes = Uint8Array.from(atob(pendingPack.fileData), (c) => c.charCodeAt(0));
      const prompts = await decodeEncryptedFile(bytes, password);
      setSelectedPack({
        id: pendingPack.id,
        title: pendingPack.title,
        fileData: pendingPack.fileData,
        prompts,
        isEncrypted: true,
        password,
      });
      setShowPasswordModal(false);
      setPendingPack(null);
      setPassword("");
    } catch (e) {
      console.error("Decrypt failed:", e);
      setError("Incorrect password");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleClose = () => {
    setSelectedPack(null);
    setShowCreateModal(false);
    setShowPasswordModal(false);
    setPendingPack(null);
    setPackName("");
    setFirstPrompt("");
    setCreatePassword("");
    setNewPrompt("");
    setPassword("");
    setExportPassword("");
    setError(null);
  };

  const handleCreate = async () => {
    setError(null);

    const title = packName.trim();
    const promptText = firstPrompt.trim();

    if (!hasPro) {
      setError("Pro plan required to create prompt packs.");
      return;
    }
    if (!title) {
      setError("Please enter a pack name.");
      return;
    }
    if (!promptText) {
      setError("Please add a prompt.");
      return;
    }
    if (!canCreate) {
      setError("You have reached your prompt pack limit.");
      return;
    }
    // Check if adding this prompt would exceed the prompt limit
    if (webPackPrompts >= availableSlots) {
      setError(`Prompt limit reached (${webPackPrompts}/${availableSlots}). Delete some prompts to add more.`);
      return;
    }
    if (createPassword && !isValidPassword(createPassword)) {
      setError(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only.`);
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const prompts = [{ text: promptText, createdAt: now }];

      let fileData: string;
      if (createPassword) {
        // Create encrypted binary format
        const encoded = await encodePrompts(prompts, true, createPassword, title);
        fileData = btoa(String.fromCharCode(...encoded));
      } else {
        // Create plain JSON format
        fileData = buildPackData(prompts);
      }

      // Upload to R2 via API route (which handles R2 upload + Convex metadata)
      const response = await fetch("/api/packs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          fileData,
          promptCount: 1,
          version: "1.0",
          price: 0,
          isPublic: false,
          isEncrypted: !!createPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create pack");
      }

      setShowCreateModal(false);
      setPackName("");
      setFirstPrompt("");
      setCreatePassword("");
      showToast(createPassword ? "Encrypted pack created" : "Pack created");
    } catch (e) {
      console.error("Create pack failed:", e);
      setError("Failed to create pack.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPrompt = async () => {
    if (!selectedPack) return;
    setError(null);

    const draft = newPrompt.trim();
    if (!draft) {
      setError("Please enter a prompt.");
      return;
    }

    // Check if adding this prompt would exceed the limit
    if (webPackPrompts >= availableSlots) {
      setError(`Prompt limit reached (${webPackPrompts}/${availableSlots}). ${hasPro ? "Delete some prompts to add more." : "Upgrade to Pro for 40 prompts."}`);
      return;
    }

    // Optimistic update: Update UI immediately
    const updatedPrompts = [...selectedPack.prompts, { text: draft, createdAt: Date.now() }];
    const previousPack = selectedPack;

    setSelectedPack({
      ...selectedPack,
      prompts: updatedPrompts,
    });
    setNewPrompt("");
    showToast("Prompt added");

    // Background sync: Upload to server asynchronously
    try {
      let fileData: string;
      if (selectedPack.isEncrypted && selectedPack.password) {
        const encoded = await encodePrompts(updatedPrompts, true, selectedPack.password, selectedPack.title);
        fileData = btoa(String.fromCharCode(...encoded));
      } else if (isBinaryFormat(selectedPack.fileData)) {
        const encoded = await encodePrompts(updatedPrompts, false, undefined, selectedPack.title);
        fileData = btoa(String.fromCharCode(...encoded));
      } else {
        fileData = buildPackData(updatedPrompts);
      }

      await updatePackViaAPI(selectedPack.id, fileData, updatedPrompts.length);

      // Update fileData after successful upload
      setSelectedPack(prev => prev ? { ...prev, fileData } : null);
    } catch (e) {
      console.error("Add prompt background sync failed:", e);
      // Rollback on error
      setSelectedPack(previousPack);
      setNewPrompt(draft);
      setError("Failed to sync prompt. Please try again.");
    }
  };

  const handleDeletePrompt = async (index: number) => {
    if (!selectedPack) return;

    const newPrompts = selectedPack.prompts.filter((_, i) => i !== index);

    // Save to undo stack
    setUndoStack((prev) => [
      ...prev,
      {
        type: "delete-prompt",
        packId: selectedPack.id,
        title: selectedPack.title,
        prompts: selectedPack.prompts,
        promptIndex: index,
      },
    ]);
    setRedoStack([]);

    if (newPrompts.length === 0) {
      await handleDeletePack();
      return;
    }

    // Optimistic update: Update UI immediately
    const previousPack = selectedPack;
    setSelectedPack({
      ...selectedPack,
      prompts: newPrompts,
    });
    showToast("Prompt deleted");

    // Background sync: Upload to server asynchronously
    try {
      let fileData: string;
      if (selectedPack.isEncrypted && selectedPack.password) {
        const encoded = await encodePrompts(newPrompts, true, selectedPack.password, selectedPack.title);
        fileData = btoa(String.fromCharCode(...encoded));
      } else if (isBinaryFormat(selectedPack.fileData)) {
        const encoded = await encodePrompts(newPrompts, false, undefined, selectedPack.title);
        fileData = btoa(String.fromCharCode(...encoded));
      } else {
        fileData = buildPackData(newPrompts);
      }

      await updatePackViaAPI(selectedPack.id, fileData, newPrompts.length);

      // Update fileData after successful upload
      setSelectedPack(prev => prev ? { ...prev, fileData } : null);
    } catch (e) {
      console.error("Delete prompt background sync failed:", e);
      // Rollback on error
      setSelectedPack(previousPack);
      showToast("Failed to sync deletion. Please try again.");
    }
  };

  const handleDeletePack = async () => {
    if (!selectedPack) return;

    setUndoStack((prev) => [
      ...prev,
      {
        type: "delete-pack",
        packId: selectedPack.id,
        title: selectedPack.title,
        prompts: selectedPack.prompts,
      },
    ]);
    setRedoStack([]);

    try {
      await deletePack({ id: selectedPack.id });
      setSelectedPack(null);
      showToast("Pack deleted");
    } catch (e) {
      console.error("Delete pack failed:", e);
      showToast("Failed to delete pack");
    }
  };

  const handleExportPack = async () => {
    if (!selectedPack) return;

    try {
      if (exportPassword && !isValidPassword(exportPassword)) {
        showToast(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only`);
        return;
      }

      let fileData: Uint8Array;

      // If pack is already encrypted or we're not adding a new password, use stored data
      if (selectedPack.isEncrypted || !exportPassword) {
        // Use the original stored binary data (base64 decode it)
        const base64 = selectedPack.fileData;
        fileData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      } else {
        // User wants to add encryption to an unencrypted pack
        fileData = await encodePrompts(selectedPack.prompts, true, exportPassword, selectedPack.title);
      }

      const blob = new Blob([new Uint8Array(fileData)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedPack.title.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.pmtpk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const isEncrypted = selectedPack.isEncrypted || !!exportPassword;
      showToast(`Exported ${selectedPack.prompts.length} prompt${selectedPack.prompts.length !== 1 ? "s" : ""}${isEncrypted ? " (encrypted)" : ""}`);
    } catch (e) {
      console.error("Export failed:", e);
      showToast("Failed to export pack");
    }
  };

  const handleUndo = async () => {
    const action = undoStack[undoStack.length - 1];
    if (!action) return;

    // Prevent undo if it would exceed pack limit
    if (action.type === "delete-pack" && packCount >= MAX_PRO_PACKS) {
      showToast("Cannot restore: pack limit reached");
      return;
    }

    setUndoStack((prev) => prev.slice(0, -1));

    try {
      if (action.type === "delete-pack") {
        const fileData = buildPackData(action.prompts);
        await createPackViaAPI(action.title, fileData, action.prompts.length);
        showToast("Pack restored");
      } else if (action.type === "delete-prompt") {
        const fileData = buildPackData(action.prompts);
        await updatePackViaAPI(action.packId, fileData, action.prompts.length);
        if (selectedPack && selectedPack.id === action.packId) {
          setSelectedPack({
            ...selectedPack,
            prompts: action.prompts,
            fileData,
          });
        }
        showToast("Prompt restored");
      }
      setRedoStack((prev) => [...prev, action]);
    } catch (e) {
      console.error("Undo failed:", e);
      showToast("Failed to undo");
    }
  };

  const handleRedo = async () => {
    const action = redoStack[redoStack.length - 1];
    if (!action) return;

    setRedoStack((prev) => prev.slice(0, -1));

    try {
      if (action.type === "delete-pack") {
        const pack = packs?.find((p) => p.title === action.title);
        if (pack) {
          await deletePack({ id: pack._id });
          setSelectedPack(null);
        }
        showToast("Pack deleted");
      } else if (action.type === "delete-prompt" && action.promptIndex !== undefined) {
        const newPrompts = action.prompts.filter((_, i) => i !== action.promptIndex);
        if (newPrompts.length === 0) {
          const pack = packs?.find((p) => p._id === action.packId);
          if (pack) {
            await deletePack({ id: pack._id });
            setSelectedPack(null);
          }
        } else {
          const fileData = buildPackData(newPrompts);
          await updatePackViaAPI(action.packId, fileData, newPrompts.length);
          if (selectedPack && selectedPack.id === action.packId) {
            setSelectedPack({
              ...selectedPack,
              prompts: newPrompts,
              fileData,
            });
          }
        }
        showToast("Prompt deleted");
      }
      setUndoStack((prev) => [...prev, action]);
    } catch (e) {
      console.error("Redo failed:", e);
      showToast("Failed to redo");
    }
  };

  if (packs === undefined) {
    return <div className="loading">Loading prompt packs...</div>;
  }

  return (
    <div className="saved-prompts">
      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}

      {/* Grace period warning banner */}
      {gracePeriodInfo && !gracePeriodInfo.isExpired && gracePeriodInfo.daysRemaining > 0 && (
        <div className="warning-banner" style={{
          padding: "16px",
          marginBottom: "24px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          color: "#856404"
        }}>
          <strong>⚠️ Subscription Cancelled</strong>
          <p style={{ margin: "8px 0 0 0" }}>
            Your prompt packs will be permanently deleted in <strong>{gracePeriodInfo.daysRemaining} day{gracePeriodInfo.daysRemaining !== 1 ? 's' : ''}</strong>.
            {' '}Resubscribe to Pro to keep your packs.
          </p>
        </div>
      )}

      <div className="saved-prompts-header">
        <h2>Your Prompt Packs</h2>
        {hasPro && canCreate && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            + New Pack
          </button>
        )}
      </div>

      {!hasPro && !gracePeriodInfo && (
        <p className="upgrade-notice">Upgrade to Pro to create prompt packs.</p>
      )}

      {webPacks.length === 0 ? (
        <div className="saved-prompts-empty">
          <p>No prompt packs yet.</p>
          {hasPro && (
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              Create your first pack to organize and share prompts.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="saved-prompts-summary">
            <span className="total-count">{webPackPrompts}/{availableSlots} prompts</span>
            <span className="source-count">
              across {webPacks.length} pack{webPacks.length !== 1 ? "s" : ""}
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
            {webPacks.map((pack) => (
              <button
                key={pack._id}
                className="saved-pack-item saved-pack-button"
                onClick={() => handlePackClick(pack)}
              >
                <div className="pack-title">
                  <span className="source-icon">
                    {pack.isEncrypted ? "🔒" : "📦"}
                  </span>
                  <span className="pack-name">{pack.title}</span>
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
        </>
      )}

      {/* Create Pack Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Pack</h3>

            <div className="form-group">
              <input
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Pack name"
                disabled={isSaving}
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <textarea
                value={firstPrompt}
                onChange={(e) => setFirstPrompt(e.target.value)}
                placeholder="Add your first prompt"
                rows={4}
                disabled={isSaving}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder={`Password (optional, max ${PASSWORD_MAX_LENGTH} chars)`}
                maxLength={PASSWORD_MAX_LENGTH}
                disabled={isSaving}
                className="form-input"
              />
              <p className="form-hint">Letters and numbers only. Leave empty for no encryption</p>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="modal-buttons">
              <button onClick={handleClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="btn btn-primary"
              >
                {isSaving ? "Creating..." : "Create Pack"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && pendingPack && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Unlock {pendingPack.title}</h3>
            <p className="modal-subtitle">
              Enter your password to view this pack
            </p>

            <div className="password-input-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                maxLength={PASSWORD_MAX_LENGTH}
                className="password-input"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
              />
              <button
                onClick={handleDecrypt}
                disabled={!isValidPassword(password) || isDecrypting}
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

      {/* View/Edit Pack Modal */}
      {selectedPack && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedPack.isEncrypted && "🔒 "}
                {selectedPack.title}
              </h3>
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

            {/* Export password option */}
            <div className="export-options">
              <input
                type="password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                placeholder={`Export password (optional, max ${PASSWORD_MAX_LENGTH} chars)`}
                maxLength={PASSWORD_MAX_LENGTH}
                className="form-input form-input-sm"
              />
            </div>

            {/* Add new prompt form */}
            <div className="add-prompt-form">
              <textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Add a new prompt..."
                rows={2}
                disabled={isSaving}
                className="form-input"
              />
              <button
                onClick={handleAddPrompt}
                disabled={isSaving || !newPrompt.trim()}
                className="btn btn-primary btn-sm"
              >
                {isSaving ? "Adding..." : "Add Prompt"}
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="prompts-list">
              {selectedPack.prompts.map((prompt, index) => (
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
