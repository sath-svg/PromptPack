"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useState, useEffect, useCallback } from "react";
import { MAX_VERSIONS_PER_PACK, PRO_VERSION_CONTROL_LIMIT, R2_API_URL } from "@/lib/constants";
import { decodePmtpk, isObfuscated } from "@/lib/crypto";

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

interface PromptControlProps {
  userId: Id<"users">;
  hasPro: boolean;
  isStudio: boolean;
  clerkId: string;
}

interface PackPrompt {
  text: string;
  header?: string;
  createdAt: number;
}

export function PromptControl({ userId, hasPro, isStudio, clerkId }: PromptControlProps) {
  const userPacks = useQuery(api.packs.listByAuthor, { authorId: userId }) ?? [];
  const toggleVersionControl = useMutation(api.packs.toggleVersionControl);

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedPromptCreatedAt, setSelectedPromptCreatedAt] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<string | null>(null); // packId to confirm disable
  const [loading, setLoading] = useState(false);
  const [packPrompts, setPackPrompts] = useState<PackPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const selectedPack = userPacks.find((p) => p._id === selectedPackId);

  // Fetch prompt versions for selected pack
  const promptVersions = useQuery(
    api.promptVersions.listByPack,
    selectedPackId ? { packId: selectedPackId as Id<"userPacks"> } : "skip"
  ) ?? [];

  const enabledCount = userPacks.filter((p) => p.versionControlEnabled).length;
  const versionControlLimit = isStudio ? userPacks.length : PRO_VERSION_CONTROL_LIMIT;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch pack prompts from R2 when a pack is selected
  const fetchPackPrompts = useCallback(async (pack: typeof userPacks[0]) => {
    setLoadingPrompts(true);
    try {
      const response = await fetch(`${R2_API_URL}/storage/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key: pack.r2Key }),
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const { fileData } = await response.json();

      // Decode the file
      const bytes = base64ToBytes(fileData);
      let jsonStr: string;
      if (isObfuscated(bytes)) {
        jsonStr = await decodePmtpk(bytes);
      } else {
        jsonStr = atob(fileData);
      }
      const data = JSON.parse(jsonStr);
      const prompts: PackPrompt[] = (data.prompts || []).map((p: PackPrompt) => ({
        text: p.text,
        header: p.header,
        createdAt: p.createdAt,
      }));
      setPackPrompts(prompts);
    } catch {
      setPackPrompts([]);
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPack) {
      fetchPackPrompts(selectedPack);
    } else {
      setPackPrompts([]);
    }
  }, [selectedPackId]);

  const handleToggle = async (packId: string, enabled: boolean) => {
    // Show confirmation when disabling (versions will be permanently deleted)
    if (!enabled) {
      setConfirmDisable(packId);
      return;
    }
    try {
      await toggleVersionControl({ id: packId as Id<"userPacks">, enabled });
      setToast("PromptControl enabled");
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const handleConfirmDisable = async () => {
    if (!confirmDisable) return;
    try {
      await toggleVersionControl({ id: confirmDisable as Id<"userPacks">, enabled: false });
      setToast("PromptControl disabled — all versions deleted");
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Failed to toggle");
    }
    setConfirmDisable(null);
  };

  const handleDeleteVersion = async (promptCreatedAt: number, versionNumber: number) => {
    if (!selectedPackId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/packs/delete-prompt-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId, packId: selectedPackId, promptCreatedAt, versionNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Deleted v${versionNumber}`);
        setConfirmDelete(null);
      } else {
        setToast(data.error || "Delete failed");
      }
    } catch {
      setToast("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: typeof promptVersions[0]) => {
    if (!selectedPackId || !selectedPack) return;
    // TODO: implement restore (update the prompt text in the pack via R2)
    setToast(`Restore not yet implemented`);
    setConfirmRestore(null);
  };

  // Toast overlay
  const toastEl = toast ? (
    <div style={{
      position: "fixed", top: "1rem", right: "1rem", zIndex: 1000,
      background: "#10b981", color: "white", padding: "0.75rem 1.25rem",
      borderRadius: "0.5rem", fontSize: "0.9rem",
    }}>
      {toast}
    </div>
  ) : null;

  // === VIEW 3: Prompt Version History ===
  if (selectedPack && selectedPromptCreatedAt !== null) {
    const versions = promptVersions
      .filter((v) => v.promptCreatedAt === selectedPromptCreatedAt)
      .sort((a, b) => b.versionNumber - a.versionNumber);

    const currentPrompt = packPrompts.find((p) => p.createdAt === selectedPromptCreatedAt);

    return (
      <div className="prompt-control">
        {toastEl}

        <button
          onClick={() => { setSelectedPromptCreatedAt(null); setConfirmDelete(null); setConfirmRestore(null); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          &larr; Back to prompts
        </button>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem" }}>Version History</h3>
          {currentPrompt && (
            <div style={{
              padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "0.75rem",
              border: "1px solid var(--border)", background: "var(--card-bg, rgba(255,255,255,0.03))",
            }}>
              {currentPrompt.header && (
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", margin: "0 0 0.25rem" }}>
                  {currentPrompt.header}
                </p>
              )}
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.4" }}>
                {currentPrompt.text.length > 200 ? currentPrompt.text.slice(0, 200) + "..." : currentPrompt.text}
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.6 }}>Current version</p>
            </div>
          )}
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
            {versions.length}/{MAX_VERSIONS_PER_PACK} versions saved
          </p>
        </div>

        {versions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>
            <p>No versions saved yet.</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>Versions are auto-saved when you edit this prompt.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {versions.map((v) => (
              <div
                key={v.versionNumber}
                style={{
                  borderRadius: "0.5rem",
                  border: "1px solid var(--border)",
                  background: "var(--card-bg, rgba(255,255,255,0.03))",
                  padding: "0.75rem 1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600, color: "var(--accent)" }}>
                      v{v.versionNumber}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      {formatRelativeTime(v.savedAt)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {confirmRestore === v.versionNumber ? (
                      <>
                        <button onClick={() => handleRestore(v)} disabled={loading} className="btn-sm btn-primary">Confirm</button>
                        <button onClick={() => setConfirmRestore(null)} className="btn-sm">Cancel</button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setConfirmRestore(v.versionNumber); setConfirmDelete(null); }}
                        title="Restore"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--muted)" }}
                      >
                        &#x21BA;
                      </button>
                    )}
                    {confirmDelete === v.versionNumber ? (
                      <>
                        <button onClick={() => handleDeleteVersion(v.promptCreatedAt, v.versionNumber)} disabled={loading} className="btn-sm" style={{ background: "#ef4444", color: "white" }}>Delete</button>
                        <button onClick={() => setConfirmDelete(null)} className="btn-sm">Cancel</button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setConfirmDelete(v.versionNumber); setConfirmRestore(null); }}
                        title="Delete"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--muted)" }}
                      >
                        &#x1F5D1;
                      </button>
                    )}
                  </div>
                </div>

                {v.header && (
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", margin: "0 0 0.25rem" }}>
                    {v.header}
                  </p>
                )}
                <p style={{
                  margin: 0, color: "var(--muted)", whiteSpace: "pre-wrap",
                  wordBreak: "break-word", fontSize: "0.8125rem", lineHeight: "1.4",
                }}>
                  {v.text.length > 500 ? v.text.slice(0, 500) + "..." : v.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // === VIEW 2: Prompt List for selected pack ===
  if (selectedPack) {
    return (
      <div className="prompt-control">
        {toastEl}

        <button
          onClick={() => { setSelectedPackId(null); setPackPrompts([]); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          &larr; Back to packs
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{selectedPack.icon || "📦"}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{selectedPack.title}</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
              {packPrompts.length} prompts &middot; Select a prompt to view its version history
            </p>
          </div>
        </div>

        {loadingPrompts ? (
          <p style={{ color: "var(--muted)" }}>Loading prompts...</p>
        ) : packPrompts.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No prompts in this pack yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {packPrompts.map((prompt, i) => {
              const versionCount = promptVersions.filter((v) => v.promptCreatedAt === prompt.createdAt).length;
              return (
                <button
                  key={prompt.createdAt}
                  onClick={() => setSelectedPromptCreatedAt(prompt.createdAt)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "0.75rem 1rem", borderRadius: "0.5rem",
                    border: "1px solid var(--border)", background: "var(--card-bg, rgba(255,255,255,0.03))",
                    cursor: "pointer", color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent)" }}>
                      {prompt.header || `Prompt ${i + 1}`}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      {versionCount}/{MAX_VERSIONS_PER_PACK} versions &rsaquo;
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {prompt.text.length > 150 ? prompt.text.slice(0, 150) + "..." : prompt.text}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Confirmation dialog for disabling version control
  const disableDialog = confirmDisable ? (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
    }}>
      <div style={{
        background: "var(--card-bg, #1a1a1a)", border: "1px solid var(--border)",
        borderRadius: "0.75rem", padding: "1.5rem", maxWidth: "24rem", margin: "0 1rem",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
      }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>Disable PromptControl?</h3>
        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.85)" }}>
          All saved versions for this pack will be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button
            onClick={() => setConfirmDisable(null)}
            className="btn-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDisable}
            className="btn-sm"
            style={{ background: "#ef4444", color: "white" }}
          >
            Disable & Delete Versions
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // === VIEW 1: Pack List ===
  return (
    <div className="prompt-control">
      {toastEl}
      {disableDialog}

      <h2>PromptControl</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
        Version control for your prompts. Up to {MAX_VERSIONS_PER_PACK} versions per prompt.
        {!isStudio && (
          <span> Pro: {enabledCount}/{versionControlLimit} pack enabled.</span>
        )}
      </p>

      {userPacks.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No custom packs yet. Create a PromptPack first.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {userPacks.map((pack) => {
            const isEnabled = isStudio || pack.versionControlEnabled;
            const canEnable = isStudio || enabledCount < versionControlLimit;

            return (
              <div
                key={pack._id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "1rem", borderRadius: "0.5rem",
                  border: `1px solid ${isEnabled ? "var(--accent)" : "var(--border)"}`,
                  opacity: isEnabled ? 1 : 0.6,
                }}
              >
                <button
                  onClick={() => isEnabled ? setSelectedPackId(pack._id) : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0,
                    background: "none", border: "none", cursor: isEnabled ? "pointer" : "default",
                    textAlign: "left", color: "inherit",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{pack.icon || "📦"}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{pack.title}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                      {pack.promptCount} prompts
                    </p>
                  </div>
                </button>

                {!isStudio && (
                  <label style={{ cursor: pack.versionControlEnabled || canEnable ? "pointer" : "not-allowed", opacity: pack.versionControlEnabled || canEnable ? 1 : 0.4 }}>
                    <input
                      type="checkbox"
                      checked={!!pack.versionControlEnabled}
                      onChange={(e) => handleToggle(pack._id, e.target.checked)}
                      disabled={!pack.versionControlEnabled && !canEnable}
                      style={{ marginRight: "0.5rem" }}
                    />
                    Enabled
                  </label>
                )}

                {isStudio && (
                  <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 500 }}>
                    Always on
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
