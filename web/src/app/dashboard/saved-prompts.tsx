"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
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
import { WORKERS_API_URL, PASSWORD_MAX_LENGTH, isValidPassword } from "../../lib/constants";

type SavedPromptsProps = {
  userId: Id<"users">;
};

type DecodedPrompt = {
  text: string;
  url?: string;
  createdAt: number;
  header?: string; // AI-generated header for the prompt
};

type HeaderMap = Record<string, string>;

type SelectedPack = {
  id: Id<"savedPacks">;
  source: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "kimi";
  r2Key: string;
  promptCount: number;
  isEncrypted?: boolean;
  fileData?: string; // cached file data after fetching
  password?: string; // cached password for re-encryption
  headers?: HeaderMap;
};

// Undo/Redo action types
type HistoryAction = {
  type: "delete-prompt" | "delete-pack";
  prompts: DecodedPrompt[];
  packInfo?: {
    id: Id<"savedPacks">;
    source: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "kimi";
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
    case "perplexity":
      return "Perplexity";
    case "grok":
      return "Grok";
    case "deepseek":
      return "DeepSeek";
    case "kimi":
      return "Kimi";
    default:
      return source;
  }
}

function getSourceEmoji(source: string): string {
  switch (source) {
    case "chatgpt":
      return "🤖";
    case "claude":
      return "🧠";
    case "gemini":
      return "✨";
    case "perplexity":
      return "🔍";
    case "grok":
      return "𝕏";
    case "deepseek":
      return "🌊";
    case "kimi":
      return "🌙";
    default:
      return "💬";
  }
}

function hashText(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getPromptKey(prompt: { text: string; createdAt: number }): string {
  return `${prompt.createdAt}:${hashText(prompt.text)}`;
}

function applyHeaderOverrides(prompts: DecodedPrompt[], headers?: HeaderMap): DecodedPrompt[] {
  if (!headers) return prompts;
  return prompts.map((prompt) => {
    const override = headers[getPromptKey(prompt)];
    if (!override) return prompt;
    if (prompt.header === override) return prompt;
    return { ...prompt, header: override };
  });
}

export function SavedPrompts({ userId }: SavedPromptsProps) {
  const { getToken, isSignedIn } = useAuth();
  const savedPacks = useQuery(api.savedPacks.listByUser, { userId });
  const removePack = useMutation(api.savedPacks.remove);
  const upsertPack = useMutation(api.savedPacks.upsert);
  const setSavedHeader = useMutation(api.savedPacks.setHeader);

  const [selectedPack, setSelectedPack] = useState<SelectedPack | null>(null);
  const [password, setPassword] = useState("");
  const [decryptedPrompts, setDecryptedPrompts] = useState<DecodedPrompt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  // Header generation state
  const [generatingHeaders, setGeneratingHeaders] = useState<Set<number>>(new Set());
  const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
  const [headerDraft, setHeaderDraft] = useState("");
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [promptDraft, setPromptDraft] = useState("");
  const [headerAuthBlocked, setHeaderAuthBlocked] = useState(false);
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn) return null;
    try {
      return await getToken();
    } catch {
      return null;
    }
  }, [getToken, isSignedIn]);

  // Generate header for a single prompt
  const generateHeader = useCallback(async (promptText: string, index: number) => {
    if (generatingHeaders.has(index)) return;

    setGeneratingHeaders(prev => new Set(prev).add(index));

    try {
      const token = await getAuthToken();
      if (!token) {
        setHeaderAuthBlocked(true);
        setError("Sign in required to generate headers.");
        return;
      }

      const response = await fetch(`${WORKERS_API_URL}/classify-website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ promptText, maxWords: 2 }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setHeaderAuthBlocked(true);
          setError("Sign in required to generate headers.");
          return;
        }
        console.error("Header generation failed:", await response.text());
        return;
      }

      const data = await response.json() as { success: boolean; header?: string };
      if (data.success && data.header && decryptedPrompts) {
        // Update the prompt with the generated header
        const updatedPrompts = [...decryptedPrompts];
        updatedPrompts[index] = { ...updatedPrompts[index], header: data.header };
        setDecryptedPrompts(updatedPrompts);

        // Save the updated prompts back to storage
        if (selectedPack) {
          const fileData = await encodePrompts(
            updatedPrompts,
            selectedPack.source,
            selectedPack.isEncrypted ?? false,
            selectedPack.password
          );

          await fetch(`${WORKERS_API_URL}/storage/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              r2Key: selectedPack.r2Key,
              fileData: btoa(String.fromCharCode(...fileData)),
              promptCount: updatedPrompts.length,
            }),
          });

          try {
            const promptKey = getPromptKey(updatedPrompts[index]);
            await setSavedHeader({ id: selectedPack.id, promptKey, header: data.header });
          } catch (e) {
            console.error("Header metadata update failed:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error generating header:", error);
    } finally {
      setGeneratingHeaders(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, [generatingHeaders, decryptedPrompts, selectedPack, setSavedHeader, getAuthToken]);

  // Generate headers for all prompts without headers
  const generateMissingHeaders = useCallback(async () => {
    if (!decryptedPrompts || headerAuthBlocked) return;

    const promptsWithoutHeaders = decryptedPrompts
      .map((p, i) => ({ prompt: p, index: i }))
      .filter(({ prompt }) => !prompt.header);

    // Generate headers in parallel (max 3 at a time to avoid rate limiting)
    const batchSize = 3;
    for (let i = 0; i < promptsWithoutHeaders.length; i += batchSize) {
      const batch = promptsWithoutHeaders.slice(i, i + batchSize);
      await Promise.all(batch.map(({ prompt, index }) =>
        generateHeader(prompt.text, index)
      ));
    }
  }, [decryptedPrompts, generateHeader, headerAuthBlocked]);

  // Auto-generate headers when prompts are loaded
  useEffect(() => {
    if (!headerAuthBlocked && decryptedPrompts && decryptedPrompts.some(p => !p.header)) {
      const timer = setTimeout(() => {
        generateMissingHeaders();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [decryptedPrompts, generateMissingHeaders, headerAuthBlocked]);

  useEffect(() => {
    if (isSignedIn) {
      setHeaderAuthBlocked(false);
    }
  }, [isSignedIn, selectedPack?.id]);

  // Toast helper
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const startHeaderEdit = useCallback((index: number) => {
    if (!decryptedPrompts) return;
    setEditingPromptIndex(null);
    setPromptDraft("");
    setEditingHeaderIndex(index);
    setHeaderDraft(decryptedPrompts[index]?.header ?? "");
  }, [decryptedPrompts]);

  const cancelHeaderEdit = useCallback(() => {
    setEditingHeaderIndex(null);
    setHeaderDraft("");
  }, []);

  const saveHeaderEdit = useCallback(async () => {
    if (!selectedPack || !decryptedPrompts || editingHeaderIndex === null) return;

    const trimmed = headerDraft.trim();
    const currentHeader = decryptedPrompts[editingHeaderIndex]?.header ?? "";
    if (trimmed === currentHeader) {
      cancelHeaderEdit();
      return;
    }

    const previousPrompts = decryptedPrompts;
    const updatedPrompts = [...decryptedPrompts];
    updatedPrompts[editingHeaderIndex] = {
      ...updatedPrompts[editingHeaderIndex],
      header: trimmed || undefined,
    };

    setDecryptedPrompts(updatedPrompts);
    cancelHeaderEdit();
    showToast(trimmed ? "Header updated" : "Header removed");

    try {
      const fileData = await encodePrompts(
        updatedPrompts,
        selectedPack.source,
        selectedPack.isEncrypted ?? false,
        selectedPack.password
      );

      await fetch(`${WORKERS_API_URL}/storage/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2Key: selectedPack.r2Key,
          fileData: btoa(String.fromCharCode(...fileData)),
          promptCount: updatedPrompts.length,
        }),
      });

      try {
        const promptKey = getPromptKey(updatedPrompts[editingHeaderIndex]);
        await setSavedHeader({ id: selectedPack.id, promptKey, header: trimmed || undefined });
      } catch (err) {
        console.error("Header metadata update failed:", err);
      }
    } catch (e) {
      console.error("Header update failed:", e);
      setDecryptedPrompts(previousPrompts);
      setError("Failed to sync header. Please try again.");
    }
  }, [selectedPack, decryptedPrompts, editingHeaderIndex, headerDraft, cancelHeaderEdit, showToast, setSavedHeader]);

  const startPromptEdit = useCallback((index: number) => {
    if (!decryptedPrompts) return;
    setEditingHeaderIndex(null);
    setHeaderDraft("");
    setEditingPromptIndex(index);
    setPromptDraft(decryptedPrompts[index]?.text ?? "");
  }, [decryptedPrompts]);

  const cancelPromptEdit = useCallback(() => {
    setEditingPromptIndex(null);
    setPromptDraft("");
  }, []);

  const savePromptEdit = useCallback(async () => {
    if (!selectedPack || !decryptedPrompts || editingPromptIndex === null) return;

    const trimmed = promptDraft.trim();
    if (!trimmed) {
      setError("Prompt cannot be empty.");
      return;
    }

    const currentPrompt = decryptedPrompts[editingPromptIndex];
    if (!currentPrompt) return;
    if (trimmed === currentPrompt.text) {
      cancelPromptEdit();
      return;
    }

    const previousPrompts = decryptedPrompts;
    const updatedPrompts = [...decryptedPrompts];
    const updatedPrompt = { ...currentPrompt, text: trimmed };
    updatedPrompts[editingPromptIndex] = updatedPrompt;

    setDecryptedPrompts(updatedPrompts);
    cancelPromptEdit();
    showToast("Prompt updated");

    try {
      const fileData = await encodePrompts(
        updatedPrompts,
        selectedPack.source,
        selectedPack.isEncrypted ?? false,
        selectedPack.password
      );

      await fetch(`${WORKERS_API_URL}/storage/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2Key: selectedPack.r2Key,
          fileData: btoa(String.fromCharCode(...fileData)),
          promptCount: updatedPrompts.length,
        }),
      });

      await upsertPack({
        userId,
        source: selectedPack.source,
        r2Key: selectedPack.r2Key,
        promptCount: updatedPrompts.length,
        fileSize: fileData.length,
      });

      const oldKey = getPromptKey(currentPrompt);
      const newKey = getPromptKey(updatedPrompt);
      if (oldKey !== newKey) {
        try {
          await setSavedHeader({ id: selectedPack.id, promptKey: oldKey, header: undefined });
          if (updatedPrompt.header) {
            await setSavedHeader({ id: selectedPack.id, promptKey: newKey, header: updatedPrompt.header });
          }
        } catch (err) {
          console.error("Header metadata update failed:", err);
        }
      }
    } catch (e) {
      console.error("Prompt update failed:", e);
      setDecryptedPrompts(previousPrompts);
      setError("Failed to sync prompt. Please try again.");
    }
  }, [selectedPack, decryptedPrompts, editingPromptIndex, promptDraft, cancelPromptEdit, showToast, setSavedHeader, upsertPack, userId]);

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
    setEditingHeaderIndex(null);
    setHeaderDraft("");
    setEditingPromptIndex(null);
    setPromptDraft("");
    setLoadingPackId(pack._id);

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

      const headerOverrides = pack.headers ?? undefined;

      if (fileIsEncrypted) {
        // Show password modal
        setSelectedPack({
          id: pack._id,
          source: pack.source,
          r2Key: pack.r2Key,
          promptCount: pack.promptCount,
          isEncrypted: true,
          fileData: fileData,
          headers: headerOverrides,
        });
      } else {
        // Obfuscated file - decode directly without password
        try {
          const prompts = applyHeaderOverrides(await decodeObfuscatedFile(bytes), headerOverrides);
          setSelectedPack({
            id: pack._id,
            source: pack.source,
            r2Key: pack.r2Key,
            promptCount: pack.promptCount,
            isEncrypted: false,
            fileData: fileData,
            headers: headerOverrides,
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
    } finally {
      setLoadingPackId(null);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedPack || !selectedPack.fileData || !isValidPassword(password)) {
      setError(`Password must be 1-${PASSWORD_MAX_LENGTH} characters, letters and numbers only`);
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
        const prompts = applyHeaderOverrides(data.prompts, selectedPack.headers);
        setDecryptedPrompts(prompts);
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
    setEditingHeaderIndex(null);
    setHeaderDraft("");
    setEditingPromptIndex(null);
    setPromptDraft("");
    setError(null);
  };

  // Delete individual prompt
  const handleDeletePrompt = async (index: number) => {
    if (!selectedPack || !decryptedPrompts) return;
    if (editingPromptIndex !== null) {
      cancelPromptEdit();
    }

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

      try {
        const promptKey = getPromptKey(promptToDelete);
        await setSavedHeader({ id: selectedPack.id, promptKey, header: undefined });
      } catch (err) {
        console.error("Header metadata cleanup failed:", err);
      }

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
            className={`saved-pack-item saved-pack-button${loadingPackId === pack._id ? " pack-loading" : ""}`}
            onClick={() => handlePackClick(pack)}
            disabled={loadingPackId !== null}
          >
            {loadingPackId === pack._id ? (
              <>
                <div className="pack-title">
                  <span className="pack-spinner" />
                  <span className="pack-name">Loading...</span>
                </div>
                <div className="pack-info">
                  <span className="prompt-count">{pack.promptCount} prompts</span>
                </div>
              </>
            ) : (
              <>
                <div className="pack-title">
                  <span className={`source-icon source-${pack.source}`}>
                    {getSourceEmoji(pack.source)}
                  </span>
                  <span className="pack-name">{getSourceTitle(pack.source)}</span>
                </div>
                <div className="pack-info">
                  <span className="prompt-count">{pack.promptCount} prompts</span>
                  <span className="last-updated">
                    {new Date(pack.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Password Modal - only show for encrypted files */}
      {selectedPack && selectedPack.isEncrypted && !decryptedPrompts && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Unlock {getSourceTitle(selectedPack.source)} Pack</h3>
            <p className="modal-subtitle">
              Enter your password to view {selectedPack.promptCount} prompts
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

      {/* Prompts Viewer Modal */}
      {selectedPack && decryptedPrompts && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{getSourceTitle(selectedPack.source)} Prompts</h3>
              <p className="sync-notice">Changes sync with the desktop app, but not with the browser extension.</p>
              <div className="modal-actions">
                {decryptedPrompts.some(p => !p.header) && (
                  <button
                    onClick={generateMissingHeaders}
                    disabled={generatingHeaders.size > 0}
                    className="btn btn-icon"
                    title="Generate all missing headers"
                  >
                    {generatingHeaders.size > 0 ? (
                      <span className="loading-spinner" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                        <path d="M19 3l.75 1.9L21.5 5.5l-1.75.6L19 8l-.75-1.9L16.5 5.5l1.75-.6L19 3z"/>
                      </svg>
                    )}
                  </button>
                )}
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
                  <div className="prompt-header-row">
                    {editingHeaderIndex === index ? (
                      <div className="prompt-header-edit">
                        <input
                          value={headerDraft}
                          onChange={(e) => setHeaderDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveHeaderEdit();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelHeaderEdit();
                            }
                          }}
                          placeholder="Header"
                          className="prompt-header-input"
                          autoFocus
                        />
                        <button
                          onClick={saveHeaderEdit}
                          className="btn btn-icon btn-small"
                          title="Save header"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                        <button
                          onClick={cancelHeaderEdit}
                          className="btn btn-icon btn-small"
                          title="Cancel"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="prompt-header-display">
                        {prompt.header ? (
                          <>
                            <span className="prompt-header">{prompt.header}</span>
                            <button
                              onClick={() => startHeaderEdit(index)}
                              className="btn btn-icon btn-small"
                              title="Edit header"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => generateHeader(prompt.text, index)}
                              disabled={generatingHeaders.has(index)}
                              className="generate-header-btn"
                              title="Generate AI header"
                            >
                              {generatingHeaders.has(index) ? (
                                <span className="loading-spinner" />
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                                  <path d="M19 3l.75 1.9L21.5 5.5l-1.75.6L19 8l-.75-1.9L16.5 5.5l1.75-.6L19 3z"/>
                                </svg>
                              )}
                              {generatingHeaders.has(index) ? "Generating..." : "Generate header"}
                            </button>
                            <button
                              onClick={() => startHeaderEdit(index)}
                              className="generate-header-btn"
                              title="Add header"
                            >
                              Add header
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {editingPromptIndex === index ? (
                    <div className="prompt-text-edit">
                      <textarea
                        value={promptDraft}
                        onChange={(e) => setPromptDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            savePromptEdit();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelPromptEdit();
                          }
                        }}
                        rows={3}
                        className="prompt-textarea"
                      />
                      <div className="prompt-edit-actions">
                        <button
                          onClick={savePromptEdit}
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelPromptEdit}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prompt-text">{prompt.text}</div>
                  )}
                  <div className="prompt-meta">
                    {editingPromptIndex === index ? (
                      <span className="prompt-date">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <>
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
                          onClick={() => startPromptEdit(index)}
                          className="btn btn-icon btn-small"
                          title="Edit prompt"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </button>
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
                      </>
                    )}
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
  source: "chatgpt" | "claude" | "gemini" | "perplexity" | "grok" | "deepseek" | "kimi",
  encrypt: boolean,
  password?: string
): Promise<Uint8Array> {
  // Map source to display title
  const sourceTitle = getSourceTitle(source);

  const exportData = {
    version: SCHEMA_VERSION,
    source,
    title: sourceTitle, // Include title for display in popup
    exportedAt: new Date().toISOString(),
    prompts: prompts.map((p) => ({
      text: p.text,
      url: p.url,
      createdAt: p.createdAt,
      header: p.header, // Include AI-generated header
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
