"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { R2_API_URL, MAX_VERSIONS_PER_PACK, PRO_VERSION_CONTROL_LIMIT } from "@/lib/constants";

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PromptControlProps {
  userId: Id<"users">;
  hasPro: boolean;
  isStudio: boolean;
  clerkId: string;
}

export function PromptControl({ userId, hasPro, isStudio, clerkId }: PromptControlProps) {
  const userPacks = useQuery(api.packs.listByAuthor, { authorId: userId }) ?? [];
  const toggleVersionControl = useMutation(api.packs.toggleVersionControl);

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const selectedPack = userPacks.find((p) => p._id === selectedPackId);

  // Fetch versions for selected pack
  const versions = useQuery(
    api.packVersions.listByPack,
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

  const handleToggle = async (packId: string, enabled: boolean) => {
    try {
      await toggleVersionControl({ id: packId as Id<"userPacks">, enabled });
      setToast(enabled ? "PromptControl enabled" : "PromptControl disabled");
    } catch (err: any) {
      setToast(err.message || "Failed to toggle");
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (!selectedPackId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/packs/restore-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId, packId: selectedPackId, versionNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Restored to v${versionNumber}`);
        setConfirmRestore(null);
      } else {
        setToast(data.error || "Restore failed");
      }
    } catch {
      setToast("Restore failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionNumber: number) => {
    if (!selectedPackId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/packs/delete-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId, packId: selectedPackId, versionNumber }),
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

  // Version History View
  if (selectedPack) {
    return (
      <div className="prompt-control">
        {toast && (
          <div style={{
            position: "fixed", top: "1rem", right: "1rem", zIndex: 1000,
            background: "#10b981", color: "white", padding: "0.75rem 1.25rem",
            borderRadius: "0.5rem", fontSize: "0.9rem",
          }}>
            {toast}
          </div>
        )}

        <button
          onClick={() => { setSelectedPackId(null); setConfirmRestore(null); setConfirmDelete(null); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          &larr; Back to packs
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{selectedPack.icon || "📦"}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{selectedPack.title}</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
              {versions.length}/{MAX_VERSIONS_PER_PACK} versions &middot; {selectedPack.promptCount} prompts
            </p>
          </div>
        </div>

        {versions.length >= MAX_VERSIONS_PER_PACK && (
          <div style={{
            padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem",
            background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#f59e0b", fontSize: "0.85rem",
          }}>
            Version limit reached. Delete old versions to continue auto-saving.
          </div>
        )}

        {versions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>
            <p>No versions saved yet.</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Versions are auto-saved when you edit prompts in this pack.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {versions.map((v) => {
              const isExpanded = expandedVersion === v.versionNumber;
              return (
                <div
                  key={v.versionNumber}
                  style={{
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                    background: "var(--card-bg, rgba(255,255,255,0.03))",
                    overflow: "hidden",
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                  }}>
                    <button
                      onClick={() => setExpandedVersion(isExpanded ? null : v.versionNumber)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0,
                        background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "inherit",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", flexShrink: 0 }}>
                        {isExpanded ? "▾" : "▸"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600, color: "var(--accent)" }}>
                            v{v.versionNumber}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                            {formatRelativeTime(v.createdAt)}
                          </span>
                        </div>
                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                          {v.message || "Auto-saved"} &middot; {v.promptCount} prompts &middot; {formatBytes(v.fileSize)}
                        </p>
                      </div>
                    </button>

                    <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.75rem" }}>
                      {confirmRestore === v.versionNumber ? (
                        <>
                          <button onClick={() => handleRestore(v.versionNumber)} disabled={loading} className="btn-sm btn-primary">Confirm</button>
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
                          <button onClick={() => handleDelete(v.versionNumber)} disabled={loading} className="btn-sm" style={{ background: "#ef4444", color: "white" }}>Delete</button>
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

                  {/* Expanded prompt preview */}
                  {isExpanded && (
                    <div style={{
                      borderTop: "1px solid var(--border)",
                      padding: "0.75rem 1rem",
                      background: "rgba(128, 128, 128, 0.05)",
                    }}>
                      {v.prompts && v.prompts.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {v.prompts.map((prompt: { text: string; header?: string }, i: number) => (
                            <div key={i} style={{
                              fontSize: "0.85rem",
                              borderRadius: "0.375rem",
                              padding: "0.5rem 0.75rem",
                              background: "var(--card-bg, rgba(255,255,255,0.03))",
                              border: "1px solid var(--border)",
                            }}>
                              {prompt.header && (
                                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", marginBottom: "0.25rem", margin: "0 0 0.25rem 0" }}>
                                  {prompt.header}
                                </p>
                              )}
                              <p style={{
                                color: "var(--muted)",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontSize: "0.8125rem",
                                lineHeight: "1.4",
                                margin: 0,
                              }}>
                                {prompt.text.length > 300 ? prompt.text.slice(0, 300) + "..." : prompt.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "0.8rem", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                          Prompt preview not available for this version.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Pack List View
  return (
    <div className="prompt-control">
      {toast && (
        <div style={{
          position: "fixed", top: "1rem", right: "1rem", zIndex: 1000,
          background: "#10b981", color: "white", padding: "0.75rem 1.25rem",
          borderRadius: "0.5rem", fontSize: "0.9rem",
        }}>
          {toast}
        </div>
      )}

      <h2>PromptControl</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
        Version control for your PromptPacks. Up to {MAX_VERSIONS_PER_PACK} snapshots per pack.
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
