// API client for PromptPack cloud backend
// Handles authenticated requests to Cloudflare Workers API

import { getSession, saveSession, clearSession, type LocalPrompt, type LocalPack } from "./db";

/**
 * TODO [PRODUCTION]: Update API_BASE to production Cloudflare Workers URL
 * Example: const API_BASE = "https://api.pmtpk.ai";
 *
 * Checklist when deploying:
 * 1. Deploy Cloudflare Worker to production
 * 2. Update API_BASE to production URL
 * 3. Update manifest.config.ts host_permissions to include API domain
 * 4. Configure CORS on Worker to allow extension origin
 */
const API_BASE = "http://localhost:8787"; // Cloudflare Workers API (local dev)

/**
 * Convex HTTP API URL
 * Note: HTTP routes use .convex.site (not .convex.cloud)
 * TODO [PRODUCTION]: Update if using a different Convex deployment
 */
const CONVEX_SITE_URL = "https://brilliant-sandpiper-173.convex.site";

export type ApiError = {
  code: string;
  message: string;
  status: number;
};

export type Entitlements = {
  tier: "free" | "paid";
  promptLimit: number;
  loadedPackLimit: number;
  promptCount: number;
  loadedPackCount: number;
};

export type CloudPrompt = {
  id: string;
  text: string;
  source: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type CloudPack = {
  id: string;
  title: string;
  author: string;
  authorId: string;
  description?: string;
  category?: string;
  promptCount: number;
  priceCents: number;
  version: string;
  isPublic: boolean;
};

export type MarketplacePack = CloudPack & {
  isPurchased: boolean;
  isLoaded: boolean;
};

class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    if (!session || session.expiresAt < Date.now()) {
      throw { code: "UNAUTHORIZED", message: "Not authenticated", status: 401 } as ApiError;
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.accessToken}`,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    requireAuth = true
  ): Promise<T> {
    const headers: HeadersInit = requireAuth
      ? await this.getAuthHeaders()
      : { "Content-Type": "application/json" };

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        code: "UNKNOWN",
        message: response.statusText,
      }));
      throw {
        code: error.code || "UNKNOWN",
        message: error.message || response.statusText,
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  // ============ Auth ============

  async exchangeCodeForToken(code: string): Promise<void> {
    const data = await this.request<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: {
        id: string;
        email: string;
        tier: "free" | "paid";
      };
      entitlements: {
        promptLimit: number;
        loadedPackLimit: number;
      };
    }>("POST", "/auth/token", { code }, false);

    await saveSession({
      userId: data.user.id,
      email: data.user.email,
      tier: data.user.tier,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
      entitlements: data.entitlements,
    });
  }

  async refreshToken(): Promise<boolean> {
    const session = await getSession();
    if (!session?.refreshToken) return false;

    try {
      const data = await this.request<{
        accessToken: string;
        expiresIn: number;
      }>("POST", "/auth/refresh", { refreshToken: session.refreshToken }, false);

      await saveSession({
        ...session,
        accessToken: data.accessToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
      });
      return true;
    } catch {
      await clearSession();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request("POST", "/auth/logout", {});
    } catch {
      // Ignore errors on logout
    }
    await clearSession();
  }

  // ============ Entitlements ============

  async getEntitlements(): Promise<Entitlements> {
    return this.request("GET", "/entitlements");
  }

  // ============ Prompts ============

  async syncPrompts(prompts: LocalPrompt[]): Promise<{
    synced: string[];
    failed: string[];
    serverPrompts: CloudPrompt[];
  }> {
    return this.request("POST", "/prompts/sync", {
      prompts: prompts.map((p) => ({
        localId: p.id,
        text: p.text,
        source: p.source,
        url: p.url,
        createdAt: new Date(p.createdAt).toISOString(),
      })),
    });
  }

  async getPrompts(): Promise<CloudPrompt[]> {
    const data = await this.request<{ prompts: CloudPrompt[] }>("GET", "/prompts");
    return data.prompts;
  }

  async createPrompt(prompt: {
    text: string;
    source: string;
    url: string;
  }): Promise<CloudPrompt> {
    return this.request("POST", "/prompts", prompt);
  }

  async deletePrompt(id: string): Promise<void> {
    await this.request("DELETE", `/prompts/${id}`);
  }

  async deletePromptsBySource(source: string): Promise<{ deleted: number }> {
    return this.request("DELETE", `/prompts/source/${source}`);
  }

  // ============ Packs ============

  async getMarketplacePacks(options?: {
    category?: string;
    search?: string;
    page?: number;
  }): Promise<{
    packs: MarketplacePack[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams();
    if (options?.category) params.set("category", options.category);
    if (options?.search) params.set("search", options.search);
    if (options?.page) params.set("page", options.page.toString());

    const query = params.toString();
    return this.request("GET", `/marketplace/packs${query ? `?${query}` : ""}`);
  }

  async getPurchasedPacks(): Promise<CloudPack[]> {
    const data = await this.request<{ packs: CloudPack[] }>("GET", "/packs/purchased");
    return data.packs;
  }

  async getLoadedPacks(): Promise<CloudPack[]> {
    const data = await this.request<{ packs: CloudPack[] }>("GET", "/packs/loaded");
    return data.packs;
  }

  async purchasePack(packId: string): Promise<{ success: boolean; pack: CloudPack }> {
    return this.request("POST", `/packs/${packId}/purchase`);
  }

  async loadPack(packId: string): Promise<{
    success: boolean;
    pack: LocalPack;
  }> {
    return this.request("POST", `/packs/${packId}/load`);
  }

  async unloadPack(packId: string): Promise<{ success: boolean }> {
    return this.request("POST", `/packs/${packId}/unload`);
  }

  async downloadPack(packId: string): Promise<ArrayBuffer> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}/packs/${packId}/download`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw {
        code: "DOWNLOAD_FAILED",
        message: "Failed to download pack",
        status: response.status,
      } as ApiError;
    }

    return response.arrayBuffer();
  }

  // ============ Billing (via Clerk) ============

  /**
   * Get the Clerk billing portal URL for upgrading to Pro
   * The actual checkout is handled by Clerk's billing, not Stripe directly
   */
  async getUpgradeUrl(): Promise<{ url: string }> {
    // This returns a URL to redirect the user to the web app's pricing page
    // where Clerk's billing handles the upgrade flow
    return { url: "https://pmtpk.ai/pricing" };
  }

  /**
   * Get billing status - checks if user has Pro plan via Clerk
   */
  async getBillingStatus(): Promise<{
    tier: "free" | "pro";
    hasPro: boolean;
  }> {
    return this.request("GET", "/billing/status");
  }

  // ============ Storage (R2) ============

  /**
   * Save prompts to cloud storage (R2) and then save metadata to Convex
   * Two-step process: 1) Upload file to R2, 2) Save metadata to Convex
   */
  async savePromptsToCloud(data: {
    source: "chatgpt" | "claude" | "gemini";
    fileData: string; // base64 encoded .pmtpk file
    promptCount: number;
  }): Promise<{ success: boolean; r2Key: string; size: number }> {
    // Step 1: Upload to R2 via Workers API
    const r2Result = await this.request<{ success: boolean; r2Key: string; size: number }>(
      "POST",
      "/storage/upload",
      data
    );

    // Step 2: Save metadata to Convex
    const session = await getSession();
    if (!session) {
      throw { code: "UNAUTHORIZED", message: "Not authenticated", status: 401 } as ApiError;
    }

    const convexResponse = await fetch(`${CONVEX_SITE_URL}/api/savedPacks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clerkId: session.userId,
        source: data.source,
        r2Key: r2Result.r2Key,
        promptCount: data.promptCount,
        fileSize: r2Result.size,
      }),
    });

    if (!convexResponse.ok) {
      const error = await convexResponse.json().catch(() => ({
        error: "Failed to save metadata",
      }));
      throw {
        code: "METADATA_SAVE_FAILED",
        message: error.error || "Failed to save metadata to Convex",
        status: convexResponse.status,
      } as ApiError;
    }

    return r2Result;
  }

  /**
   * Download saved prompts from cloud storage
   */
  async downloadPromptsFromCloud(source: "chatgpt" | "claude" | "gemini"): Promise<{
    success: boolean;
    fileData: string; // base64 encoded
    metadata: Record<string, string>;
  }> {
    return this.request("GET", `/storage/download?source=${source}`);
  }

  /**
   * List all saved files in cloud storage
   */
  async listSavedFiles(): Promise<{
    success: boolean;
    files: Array<{
      key: string;
      source: string;
      size: number;
      uploaded: string;
    }>;
  }> {
    return this.request("GET", "/storage/list");
  }

  /**
   * Delete saved prompts from cloud storage
   */
  async deleteSavedFile(source: "chatgpt" | "claude" | "gemini"): Promise<{
    success: boolean;
    deleted: string;
  }> {
    return this.request("DELETE", `/storage/delete?source=${source}`);
  }
}

export const api = new ApiClient();
