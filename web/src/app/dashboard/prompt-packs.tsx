"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type PromptPacksProps = {
  userId: Id<"users">;
  hasPro: boolean;
};

type WebPackData = {
  format: "web-pack-v1";
  version: number;
  prompts: Array<{
    text: string;
    createdAt: number;
  }>;
};

type SelectedPack = {
  id: Id<"packs">;
  title: string;
  fileData: string;
  prompts: WebPackData["prompts"];
  isEncrypted: boolean;
  password?: string;
};

// Undo/Redo action types
type HistoryAction = {
  type: "delete-prompt" | "delete-pack";
  packId: Id<"packs">;
  title: string;
  prompts: WebPackData["prompts"];
  promptIndex?: number;
};

const MAX_PRO_PACKS = 2;

// File format constants
const MAGIC_OBFUSCATED = 0x00;
const MAGIC_ENCRYPTED = 0x01;
const HEADER_SIZE = 37;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const SCHEMA_VERSION = 1;
const OBFUSCATE_KEY = new Uint8Array([0x50, 0x72, 0x6F, 0x6D, 0x70, 0x74, 0x50, 0x61, 0x63, 0x6B]);

function buildPackData(prompts: WebPackData["prompts"]): string {
  const payload: WebPackData = {
    format: "web-pack-v1",
    version: 1,
    prompts,
  };
  return JSON.stringify(payload);
}

function parsePackData(fileData: string): WebPackData | null {
  try {
    const parsed = JSON.parse(fileData) as WebPackData;
    if (parsed.format !== "web-pack-v1" || !Array.isArray(parsed.prompts)) {
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
    return bytes.length >= 4 && bytes[3] === MAGIC_ENCRYPTED;
  } catch {
    return false;
  }
}

// XOR obfuscation
function xorObfuscate(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ OBFUSCATE_KEY[i % OBFUSCATE_KEY.length];
  }
  return result;
}

// Decompress gzip
async function decompressGzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream();
  const decompressed = stream.pipeThrough(new DecompressionStream("gzip"));
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

// Compress gzip
async function compressGzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream();
  const compressed = stream.pipeThrough(new CompressionStream("gzip"));
  const reader = compressed.getReader();
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

// Compute SHA-256 hash
async function computeHash(data: Uint8Array): Promise<Uint8Array> {
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return new Uint8Array(hashBuffer);
}

// Decode obfuscated file
async function decodeObfuscatedFile(bytes: Uint8Array): Promise<WebPackData["prompts"]> {
  const payload = bytes.slice(HEADER_SIZE);
  const deobfuscated = xorObfuscate(payload);
  const decompressed = await decompressGzip(deobfuscated);
  const jsonString = new TextDecoder().decode(decompressed);
  const data = JSON.parse(jsonString);
  if (data.format === "web-pack-v1" && Array.isArray(data.prompts)) {
    return data.prompts;
  }
  throw new Error("Invalid pack format");
}

// Decode encrypted file
async function decodeEncryptedFile(bytes: Uint8Array, password: string): Promise<WebPackData["prompts"]> {
  const salt = bytes.slice(HEADER_SIZE, HEADER_SIZE + SALT_LENGTH);
  const iv = bytes.slice(HEADER_SIZE + SALT_LENGTH, HEADER_SIZE + SALT_LENGTH + IV_LENGTH);
  const ciphertext = bytes.slice(HEADER_SIZE + SALT_LENGTH + IV_LENGTH);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const ciphertextBuffer = new ArrayBuffer(ciphertext.length);
  new Uint8Array(ciphertextBuffer).set(ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertextBuffer
  );

  const decompressed = await decompressGzip(new Uint8Array(decrypted));
  const jsonString = new TextDecoder().decode(decompressed);
  const data = JSON.parse(jsonString);
  if (data.format === "web-pack-v1" && Array.isArray(data.prompts)) {
    return data.prompts;
  }
  throw new Error("Invalid pack format");
}

// Encode prompts to binary format
async function encodePrompts(
  prompts: WebPackData["prompts"],
  encrypt: boolean,
  password?: string
): Promise<Uint8Array> {
  const exportData: WebPackData = {
    format: "web-pack-v1",
    version: 1,
    prompts: prompts.map((p) => ({
      text: p.text,
      createdAt: p.createdAt,
    })),
  };

  const jsonString = JSON.stringify(exportData);
  const jsonBytes = new TextEncoder().encode(jsonString);
  const compressed = await compressGzip(jsonBytes);

  if (encrypt && password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const compressedBuffer = new ArrayBuffer(compressed.length);
    new Uint8Array(compressedBuffer).set(compressed);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      compressedBuffer
    );

    const magic = new Uint8Array([0x50, 0x50, 0x4B, MAGIC_ENCRYPTED]);
    const version = new Uint8Array([SCHEMA_VERSION]);
    const payload = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]);
    const hash = await computeHash(payload);

    const result = new Uint8Array(magic.length + version.length + hash.length + payload.length);
    result.set(magic, 0);
    result.set(version, magic.length);
    result.set(hash, magic.length + version.length);
    result.set(payload, magic.length + version.length + hash.length);

    return result;
  } else {
    const obfuscated = xorObfuscate(compressed);
    const hash = await computeHash(obfuscated);

    const magic = new Uint8Array([0x50, 0x50, 0x4B, MAGIC_OBFUSCATED]);
    const version = new Uint8Array([SCHEMA_VERSION]);

    const result = new Uint8Array(magic.length + version.length + hash.length + obfuscated.length);
    result.set(magic, 0);
    result.set(version, magic.length);
    result.set(hash, magic.length + version.length);
    result.set(obfuscated, magic.length + version.length + hash.length);

    return result;
  }
}

export function PromptPacks({ userId, hasPro }: PromptPacksProps) {
  const packs = useQuery(api.packs.listByAuthor, { authorId: userId });
  const createPack = useMutation(api.packs.create);
  const updatePack = useMutation(api.packs.update);
  const deletePack = useMutation(api.packs.remove);

  const [selectedPack, setSelectedPack] = useState<SelectedPack | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPack, setPendingPack] = useState<{ id: Id<"packs">; title: string; fileData: string } | null>(null);
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
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Filter to only show web-pack-v1 format packs (JSON or binary)
  const webPacks = (packs ?? []).filter((pack) => {
    if (parsePackData(pack.fileData)) return true;
    if (isBinaryFormat(pack.fileData)) return true;
    return false;
  });
  const packCount = webPacks.length;
  const canCreate = hasPro && packCount < MAX_PRO_PACKS;

  const handlePackClick = async (pack: typeof webPacks[0]) => {
    setError(null);

    // Check if it's binary format
    if (isBinaryFormat(pack.fileData)) {
      if (isEncryptedBinary(pack.fileData)) {
        // Need password
        setPendingPack({ id: pack._id, title: pack.title, fileData: pack.fileData });
        setShowPasswordModal(true);
        setPassword("");
      } else {
        // Obfuscated - decode directly
        try {
          const bytes = Uint8Array.from(atob(pack.fileData), (c) => c.charCodeAt(0));
          const prompts = await decodeObfuscatedFile(bytes);
          setSelectedPack({
            id: pack._id,
            title: pack.title,
            fileData: pack.fileData,
            prompts,
            isEncrypted: false,
          });
        } catch (e) {
          console.error("Decode failed:", e);
          setError("Failed to decode pack");
        }
      }
    } else {
      // Plain JSON format
      const parsed = parsePackData(pack.fileData);
      if (!parsed) return;

      setSelectedPack({
        id: pack._id,
        title: pack.title,
        fileData: pack.fileData,
        prompts: parsed.prompts,
        isEncrypted: false,
      });
    }
    setNewPrompt("");
    setExportPassword("");
  };

  const handleDecrypt = async () => {
    if (!pendingPack || password.length !== 5) {
      setError("Password must be exactly 5 characters");
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
    if (createPassword && createPassword.length !== 5) {
      setError("Password must be exactly 5 characters.");
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const prompts = [{ text: promptText, createdAt: now }];

      let fileData: string;
      if (createPassword) {
        // Create encrypted binary format
        const encoded = await encodePrompts(prompts, true, createPassword);
        fileData = btoa(String.fromCharCode(...encoded));
      } else {
        // Create plain JSON format
        fileData = buildPackData(prompts);
      }

      await createPack({
        authorId: userId,
        title,
        description: undefined,
        category: undefined,
        fileData,
        promptCount: 1,
        version: "1.0",
        price: 0,
        isPublic: false,
      });
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

    setIsSaving(true);
    try {
      const updatedPrompts = [...selectedPack.prompts, { text: draft, createdAt: Date.now() }];

      let fileData: string;
      if (selectedPack.isEncrypted && selectedPack.password) {
        const encoded = await encodePrompts(updatedPrompts, true, selectedPack.password);
        fileData = btoa(String.fromCharCode(...encoded));
      } else if (isBinaryFormat(selectedPack.fileData)) {
        const encoded = await encodePrompts(updatedPrompts, false);
        fileData = btoa(String.fromCharCode(...encoded));
      } else {
        fileData = buildPackData(updatedPrompts);
      }

      await updatePack({
        id: selectedPack.id,
        fileData,
        promptCount: updatedPrompts.length,
      });
      setSelectedPack({
        ...selectedPack,
        prompts: updatedPrompts,
        fileData,
      });
      setNewPrompt("");
      showToast("Prompt added");
    } catch (e) {
      console.error("Add prompt failed:", e);
      setError("Failed to add prompt.");
    } finally {
      setIsSaving(false);
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

    try {
      let fileData: string;
      if (selectedPack.isEncrypted && selectedPack.password) {
        const encoded = await encodePrompts(newPrompts, true, selectedPack.password);
        fileData = btoa(String.fromCharCode(...encoded));
      } else if (isBinaryFormat(selectedPack.fileData)) {
        const encoded = await encodePrompts(newPrompts, false);
        fileData = btoa(String.fromCharCode(...encoded));
      } else {
        fileData = buildPackData(newPrompts);
      }

      await updatePack({
        id: selectedPack.id,
        fileData,
        promptCount: newPrompts.length,
      });
      setSelectedPack({
        ...selectedPack,
        prompts: newPrompts,
        fileData,
      });
      showToast("Prompt deleted");
    } catch (e) {
      console.error("Delete prompt failed:", e);
      showToast("Failed to delete prompt");
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
      if (exportPassword && exportPassword.length !== 5) {
        showToast("Password must be exactly 5 characters");
        return;
      }

      const fileData = await encodePrompts(selectedPack.prompts, !!exportPassword, exportPassword || undefined);

      const blob = new Blob([new Uint8Array(fileData)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedPack.title.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.pmtpk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Exported ${selectedPack.prompts.length} prompt${selectedPack.prompts.length !== 1 ? "s" : ""}${exportPassword ? " (encrypted)" : ""}`);
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
        await createPack({
          authorId: userId,
          title: action.title,
          description: undefined,
          category: undefined,
          fileData: buildPackData(action.prompts),
          promptCount: action.prompts.length,
          version: "1.0",
          price: 0,
          isPublic: false,
        });
        showToast("Pack restored");
      } else if (action.type === "delete-prompt") {
        await updatePack({
          id: action.packId,
          fileData: buildPackData(action.prompts),
          promptCount: action.prompts.length,
        });
        if (selectedPack && selectedPack.id === action.packId) {
          setSelectedPack({
            ...selectedPack,
            prompts: action.prompts,
            fileData: buildPackData(action.prompts),
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
          await updatePack({
            id: action.packId,
            fileData: buildPackData(newPrompts),
            promptCount: newPrompts.length,
          });
          if (selectedPack && selectedPack.id === action.packId) {
            setSelectedPack({
              ...selectedPack,
              prompts: newPrompts,
              fileData: buildPackData(newPrompts),
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

  const totalPrompts = webPacks.reduce((sum, pack) => sum + pack.promptCount, 0);

  return (
    <div className="saved-prompts">
      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}

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

      {!hasPro && (
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
            <span className="total-count">{totalPrompts} prompts</span>
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
                    {isBinaryFormat(pack.fileData) && isEncryptedBinary(pack.fileData) ? "🔒" : "📦"}
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
                placeholder="Password (optional, 5 chars)"
                maxLength={5}
                disabled={isSaving}
                className="form-input"
              />
              <p className="form-hint">Leave empty for no encryption</p>
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
              Enter your 5-character password to view this pack
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
                placeholder="Export password (optional, 5 chars)"
                maxLength={5}
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
