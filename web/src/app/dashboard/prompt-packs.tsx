"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
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
  STUDIO_PROMPT_LIMIT,
  MAX_PRO_PACKS,
  MAX_STUDIO_PACKS,
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
  isStudio: boolean;
  clerkId: string;
  savedPromptsCount: number;
};

type WebPackData = {
  format: typeof WEB_PACK_FORMAT;
  version: number;
  prompts: Array<{
    text: string;
    createdAt: number;
    header?: string; // AI-generated header for the prompt
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

type HeaderMap = Record<string, string>;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encodeStringToBase64(value: string): string {
  return bytesToBase64(textEncoder.encode(value));
}

function decodeBase64ToString(value: string): string {
  return textDecoder.decode(base64ToBytes(value));
}

function buildPackData(prompts: WebPackData["prompts"]): string {
  const payload: WebPackData = {
    format: WEB_PACK_FORMAT,
    version: WEB_PACK_VERSION,
    prompts,
  };
  return JSON.stringify(payload);
}

function parsePackJson(value: string): WebPackData | null {
  try {
    const parsed = JSON.parse(value) as WebPackData;
    if (parsed.format !== WEB_PACK_FORMAT || !Array.isArray(parsed.prompts)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parsePackData(fileData: string): WebPackData | null {
  const direct = parsePackJson(fileData);
  if (direct) {
    return direct;
  }

  try {
    return parsePackJson(decodeBase64ToString(fileData));
  } catch {
    return null;
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

function applyHeaderOverrides(
  prompts: WebPackData["prompts"],
  headers?: HeaderMap
): WebPackData["prompts"] {
  if (!headers) return prompts;
  return prompts.map((prompt) => {
    const override = headers[getPromptKey(prompt)];
    if (!override) return prompt;
    if (prompt.header === override) return prompt;
    return { ...prompt, header: override };
  });
}

// Check if fileData is base64 encoded binary (encrypted/obfuscated)
function isBinaryFormat(fileData: string): boolean {
  try {
    const bytes = base64ToBytes(fileData);
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x50 && bytes[2] === 0x4B;
  } catch {
    return false;
  }
}

// Check if binary file is encrypted
function isEncryptedBinary(fileData: string): boolean {
  try {
    const bytes = base64ToBytes(fileData);
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
    return data.prompts.map((p: { text: string; createdAt: number; url?: string; header?: string }) => ({
      text: p.text,
      createdAt: p.createdAt,
      header: p.header,
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
    return data.prompts.map((p: { text: string; createdAt: number; url?: string; header?: string }) => ({
      text: p.text,
      createdAt: p.createdAt,
      header: p.header,
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
      header: p.header, // Include AI-generated header
    })),
  };

  const jsonString = JSON.stringify(exportData);

  if (encrypt && password) {
    return await encryptPmtpk(jsonString, password);
  } else {
    return await encodePmtpk(jsonString);
  }
}

export function PromptPacks({ userId, hasPro, isStudio, clerkId, savedPromptsCount }: PromptPacksProps) {
  const { getToken, isSignedIn } = useAuth();
  const packs = useQuery(api.packs.listByAuthor, { authorId: userId });
  const gracePeriodInfo = useQuery(api.users.getGracePeriodInfo, { clerkId });
  const deletePack = useMutation(api.packs.remove);
  const setPackHeader = useMutation(api.packs.setHeader);
  const updatePackIcon = useMutation(api.packs.updateIcon);

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
  const [pendingPack, setPendingPack] = useState<{
    id: Id<"userPacks">;
    title: string;
    fileData: string;
    headers?: HeaderMap;
  } | null>(null);
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

  // Header generation state
  const [generatingHeaders, setGeneratingHeaders] = useState<Set<number>>(new Set());
  const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
  const [headerDraft, setHeaderDraft] = useState("");
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [promptDraft, setPromptDraft] = useState("");
  const [headerAuthBlocked, setHeaderAuthBlocked] = useState(false);
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [editingIconPackId, setEditingIconPackId] = useState<string | null>(null);

  // Emoji options for pack icons
  const EMOJI_OPTIONS = ["📦", "🎯", "💡", "🚀", "⚡", "🔥", "💎", "🎨", "📝", "🛠️", "🎮", "🌟", "📚", "🔮", "🧩"];

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
    if (generatingHeaders.has(index) || !selectedPack) return;

    setGeneratingHeaders(prev => new Set(prev).add(index));

    try {
      const token = await getAuthToken();
      if (!token) {
        setHeaderAuthBlocked(true);
        setError("Sign in required to generate headers.");
        return;
      }

      const response = await fetch(`${R2_API_URL}/classify-website`, {
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
      if (data.success && data.header && selectedPack) {
        // Update the prompt with the generated header
        const updatedPrompts = [...selectedPack.prompts];
        updatedPrompts[index] = { ...updatedPrompts[index], header: data.header };

        // Update local state
        setSelectedPack({ ...selectedPack, prompts: updatedPrompts });

        // Save the updated prompts back to storage (always use .pmtpk format)
        let fileData: string;
        const encoded = await encodePrompts(
          updatedPrompts,
          !!(selectedPack.isEncrypted && selectedPack.password),
          selectedPack.password,
          selectedPack.title
        );
        fileData = bytesToBase64(encoded);

        await updatePackViaAPI(selectedPack.id, fileData, updatedPrompts.length);

        try {
          const promptKey = getPromptKey(updatedPrompts[index]);
          await setPackHeader({ id: selectedPack.id, promptKey, header: data.header });
        } catch (e) {
          console.error("Header metadata update failed:", e);
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
  }, [generatingHeaders, selectedPack, setPackHeader, updatePackViaAPI, getAuthToken]);

  // Generate headers for all prompts without headers
  const generateMissingHeaders = useCallback(async () => {
    if (!selectedPack || headerAuthBlocked) return;

    const promptsWithoutHeaders = selectedPack.prompts
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
  }, [selectedPack, generateHeader, headerAuthBlocked]);

  // Auto-generate headers when prompts are loaded
  useEffect(() => {
    if (!headerAuthBlocked && selectedPack && selectedPack.prompts.some(p => !p.header)) {
      const timer = setTimeout(() => {
        generateMissingHeaders();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedPack, generateMissingHeaders, headerAuthBlocked]);

  useEffect(() => {
    if (isSignedIn) {
      setHeaderAuthBlocked(false);
    }
  }, [isSignedIn, selectedPack?.id]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!editingIconPackId) return;

    const handleClickOutside = () => setEditingIconPackId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [editingIconPackId]);

  // Toast helper
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const startHeaderEdit = useCallback((index: number) => {
    if (!selectedPack) return;
    setEditingPromptIndex(null);
    setPromptDraft("");
    setEditingHeaderIndex(index);
    setHeaderDraft(selectedPack.prompts[index]?.header ?? "");
  }, [selectedPack]);

  const cancelHeaderEdit = useCallback(() => {
    setEditingHeaderIndex(null);
    setHeaderDraft("");
  }, []);

  const saveHeaderEdit = useCallback(async () => {
    if (!selectedPack || editingHeaderIndex === null) return;

    const trimmed = headerDraft.trim();
    const currentHeader = selectedPack.prompts[editingHeaderIndex]?.header ?? "";
    if (trimmed === currentHeader) {
      cancelHeaderEdit();
      return;
    }

    const previousPack = selectedPack;
    const updatedPrompts = [...selectedPack.prompts];
    updatedPrompts[editingHeaderIndex] = {
      ...updatedPrompts[editingHeaderIndex],
      header: trimmed || undefined,
    };

    setSelectedPack({ ...selectedPack, prompts: updatedPrompts });
    cancelHeaderEdit();
    showToast(trimmed ? "Header updated" : "Header removed");

    try {
      // Always use .pmtpk format
      const encoded = await encodePrompts(
        updatedPrompts,
        !!(previousPack.isEncrypted && previousPack.password),
        previousPack.password,
        previousPack.title
      );
      const fileData = bytesToBase64(encoded);

      await updatePackViaAPI(previousPack.id, fileData, updatedPrompts.length);
      setSelectedPack(prev => prev ? { ...prev, fileData } : null);

      try {
        const promptKey = getPromptKey(updatedPrompts[editingHeaderIndex]);
        await setPackHeader({ id: previousPack.id, promptKey, header: trimmed || undefined });
      } catch (err) {
        console.error("Header metadata update failed:", err);
      }
    } catch (e) {
      console.error("Header update failed:", e);
      setSelectedPack(previousPack);
      setError("Failed to sync header. Please try again.");
    }
  }, [selectedPack, editingHeaderIndex, headerDraft, cancelHeaderEdit, showToast, updatePackViaAPI, setPackHeader]);

  const startPromptEdit = useCallback((index: number) => {
    if (!selectedPack) return;
    setEditingHeaderIndex(null);
    setHeaderDraft("");
    setEditingPromptIndex(index);
    setPromptDraft(selectedPack.prompts[index]?.text ?? "");
  }, [selectedPack]);

  const cancelPromptEdit = useCallback(() => {
    setEditingPromptIndex(null);
    setPromptDraft("");
  }, []);

  const savePromptEdit = useCallback(async () => {
    if (!selectedPack || editingPromptIndex === null) return;

    const trimmed = promptDraft.trim();
    if (!trimmed) {
      setError("Prompt cannot be empty.");
      return;
    }

    const currentPrompt = selectedPack.prompts[editingPromptIndex];
    if (!currentPrompt) return;
    if (trimmed === currentPrompt.text) {
      cancelPromptEdit();
      return;
    }

    const previousPack = selectedPack;
    const updatedPrompts = [...selectedPack.prompts];
    const updatedPrompt = { ...currentPrompt, text: trimmed };
    updatedPrompts[editingPromptIndex] = updatedPrompt;

    setSelectedPack({ ...selectedPack, prompts: updatedPrompts });
    cancelPromptEdit();
    showToast("Prompt updated");

    try {
      // Always use .pmtpk format
      const encoded = await encodePrompts(
        updatedPrompts,
        !!(previousPack.isEncrypted && previousPack.password),
        previousPack.password,
        previousPack.title
      );
      const fileData = bytesToBase64(encoded);

      await updatePackViaAPI(previousPack.id, fileData, updatedPrompts.length);
      setSelectedPack(prev => prev ? { ...prev, fileData } : null);

      const oldKey = getPromptKey(currentPrompt);
      const newKey = getPromptKey(updatedPrompt);
      if (oldKey !== newKey) {
        try {
          await setPackHeader({ id: previousPack.id, promptKey: oldKey, header: undefined });
          if (updatedPrompt.header) {
            await setPackHeader({ id: previousPack.id, promptKey: newKey, header: updatedPrompt.header });
          }
        } catch (err) {
          console.error("Header metadata update failed:", err);
        }
      }
    } catch (e) {
      console.error("Prompt update failed:", e);
      setSelectedPack(previousPack);
      setError("Failed to sync prompt. Please try again.");
    }
  }, [selectedPack, editingPromptIndex, promptDraft, cancelPromptEdit, showToast, updatePackViaAPI, setPackHeader]);

  // All packs are now stored in R2 with metadata in Convex
  // No need to filter - just display all packs
  const webPacks = packs ?? [];
  const packCount = webPacks.length;
  const webPackPrompts = webPacks.reduce((sum, pack) => sum + pack.promptCount, 0);
  // Available slots = max prompts - saved prompts already used
  const maxPrompts = isStudio ? STUDIO_PROMPT_LIMIT : (hasPro ? PRO_PROMPT_LIMIT : FREE_PROMPT_LIMIT);
  const availableSlots = Math.max(0, maxPrompts - savedPromptsCount);
  // Studio: unlimited packs (-1), Pro: MAX_PRO_PACKS, Free: 0
  const maxPacks = isStudio ? MAX_STUDIO_PACKS : (hasPro ? MAX_PRO_PACKS : 0);
  const canCreate = isStudio || (hasPro && packCount < MAX_PRO_PACKS);

  const handleIconSelect = async (packId: Id<"userPacks">, icon: string) => {
    try {
      await updatePackIcon({ id: packId, icon: icon || null });
      showToast("Icon updated");
    } catch (e) {
      console.error("Failed to update icon:", e);
      showToast("Failed to update icon");
    } finally {
      setEditingIconPackId(null);
    }
  };

  const handlePackClick = async (pack: typeof webPacks[0]) => {
    setError(null);
    setEditingHeaderIndex(null);
    setHeaderDraft("");
    setEditingPromptIndex(null);
    setPromptDraft("");
    setIsSaving(true);
    setLoadingPackId(pack._id);

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
      const headerOverrides = pack.headers ?? undefined;
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
          prompts: applyHeaderOverrides(parsed.prompts, headerOverrides),
          isEncrypted: false,
        });
        return;
      }

      const bytes = base64ToBytes(fileData);
      const encrypted = isEncrypted(bytes);
      // Check if it's encrypted or obfuscated
      if (encrypted) {
        // Need password
        setPendingPack({ id: pack._id, title: pack.title, fileData, headers: headerOverrides });
        setShowPasswordModal(true);
        setPassword("");
      } else {
        // Obfuscated - decode directly
        const bytes = base64ToBytes(fileData);
        const prompts = applyHeaderOverrides(await decodeObfuscatedFile(bytes), headerOverrides);
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
      setLoadingPackId(null);
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
      const bytes = base64ToBytes(pendingPack.fileData);
      const prompts = applyHeaderOverrides(
        await decodeEncryptedFile(bytes, password),
        pendingPack.headers
      );
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
    setEditingHeaderIndex(null);
    setHeaderDraft("");
    setEditingPromptIndex(null);
    setPromptDraft("");
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
      // Always use the proper .pmtpk format (obfuscated or encrypted)
      // This ensures compatibility with desktop app and browser extension
      const encoded = await encodePrompts(prompts, !!createPassword, createPassword || undefined, title);
      fileData = bytesToBase64(encoded);

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
      // Always use .pmtpk format
      const encoded = await encodePrompts(
        updatedPrompts,
        !!(selectedPack.isEncrypted && selectedPack.password),
        selectedPack.password,
        selectedPack.title
      );
      const fileData = bytesToBase64(encoded);

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
    if (editingPromptIndex !== null) {
      cancelPromptEdit();
    }

    const removedPrompt = selectedPack.prompts[index];
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
      // Always use .pmtpk format
      const encoded = await encodePrompts(
        newPrompts,
        !!(selectedPack.isEncrypted && selectedPack.password),
        selectedPack.password,
        selectedPack.title
      );
      const fileData = bytesToBase64(encoded);

      await updatePackViaAPI(selectedPack.id, fileData, newPrompts.length);

      if (removedPrompt) {
        try {
          const promptKey = getPromptKey(removedPrompt);
          await setPackHeader({ id: selectedPack.id, promptKey, header: undefined });
        } catch (err) {
          console.error("Header metadata cleanup failed:", err);
        }
      }

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
        fileData = base64ToBytes(base64);
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

    // Prevent undo if it would exceed pack limit (Studio has unlimited = -1)
    if (action.type === "delete-pack" && maxPacks !== -1 && packCount >= maxPacks) {
      showToast("Cannot restore: pack limit reached");
      return;
    }

    setUndoStack((prev) => prev.slice(0, -1));

    try {
      if (action.type === "delete-pack") {
        // Always use .pmtpk format (obfuscated, unencrypted for undo)
        const encoded = await encodePrompts(action.prompts, false, undefined, action.title);
        const fileData = bytesToBase64(encoded);
        await createPackViaAPI(action.title, fileData, action.prompts.length);
        showToast("Pack restored");
      } else if (action.type === "delete-prompt") {
        // Always use .pmtpk format (obfuscated, unencrypted for undo)
        const encoded = await encodePrompts(action.prompts, false, undefined, action.title);
        const fileData = bytesToBase64(encoded);
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
          // Always use .pmtpk format (obfuscated, unencrypted for redo)
          const encoded = await encodePrompts(newPrompts, false, undefined, action.title);
          const fileData = bytesToBase64(encoded);
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
              <div
                key={pack._id}
                className={`saved-pack-item saved-pack-button${loadingPackId === pack._id ? " pack-loading" : ""}`}
                style={{ position: "relative" }}
              >
                {loadingPackId === pack._id ? (
                  <button
                    className="saved-pack-item-inner"
                    onClick={() => handlePackClick(pack)}
                    disabled={loadingPackId !== null}
                  >
                    <div className="pack-title">
                      <span className="pack-spinner" />
                      <span className="pack-name">Loading...</span>
                    </div>
                    <div className="pack-info">
                      <span className="prompt-count">{pack.promptCount} prompts</span>
                    </div>
                  </button>
                ) : (
                  <>
                    <button
                      className="pack-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIconPackId(editingIconPackId === pack._id ? null : pack._id);
                      }}
                      title="Change icon"
                    >
                      <span className="source-icon">
                        {pack.isEncrypted ? "🔒" : (pack.icon || "📦")}
                      </span>
                    </button>
                    {editingIconPackId === pack._id && (
                      <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
                        <div className="emoji-picker-title">Choose an icon</div>
                        <div className="emoji-picker-grid">
                          {EMOJI_OPTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              className={`emoji-option${(pack.icon || "📦") === emoji ? " selected" : ""}`}
                              onClick={() => handleIconSelect(pack._id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      className="saved-pack-item-inner"
                      onClick={() => handlePackClick(pack)}
                      disabled={loadingPackId !== null}
                    >
                      <div className="pack-title">
                        <span className="pack-name">{pack.title}</span>
                      </div>
                      <div className="pack-info">
                        <span className="prompt-count">{pack.promptCount} prompts</span>
                        <span className="last-updated">
                          {new Date(pack.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  </>
                )}
              </div>
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
                {selectedPack.prompts.some(p => !p.header) && (
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
