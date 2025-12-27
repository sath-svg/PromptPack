// API client for PromptPack cloud backend
// Handles authenticated requests to Cloudflare Workers API

// ============================================================================
// TODO-PRODUCTION: Update these URLs before deploying to production
// ============================================================================
const API_BASE = "http://localhost:8787"; // Cloudflare Workers R2 API
// PRODUCTION: const API_BASE = "https://your-worker.workers.dev";

const CONVEX_API_URL = "https://brilliant-sandpiper-173.convex.site"; // Convex HTTP endpoint
// PRODUCTION: Update if using different Convex deployment
// ============================================================================

import { getSession, saveSession, clearSession, type LocalPrompt, type LocalPack } from "./db";
import { FREE_PROMPT_LIMIT, PRO_PROMPT_LIMIT } from "./promptStore";

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
    // Call Convex code exchange endpoint
    const response = await fetch(`${CONVEX_API_URL}/api/extension/exchange-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw {
        code: "TOKEN_EXCHANGE_FAILED",
        message: error.error || "Failed to exchange code for token",
        status: response.status,
      } as ApiError;
    }

    const data = await response.json() as {
      success: boolean;
      user: {
        clerkId: string;
        email: string;
        name?: string;
        plan: "free" | "pro";
      };
      token: string; // Clerk session token
    };

    if (!data.success) {
      throw {
        code: "TOKEN_EXCHANGE_FAILED",
        message: "Failed to exchange code",
        status: 400,
      } as ApiError;
    }

    // Save session with Clerk token
    await saveSession({
      userId: data.user.clerkId,
      email: data.user.email,
      tier: data.user.plan === "pro" ? "paid" : "free",
      accessToken: data.token, // Clerk session token
      refreshToken: data.token, // Use same token for now
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      entitlements: {
        promptLimit: data.user.plan === "pro" ? PRO_PROMPT_LIMIT : FREE_PROMPT_LIMIT,
        loadedPackLimit: data.user.plan === "pro" ? 999999 : 0,
      },
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

  /**
   * Save prompts to dashboard (uploads to R2 and saves metadata to Convex)
   * Returns success status and any limit errors
   */
  async savePromptsToDashboard(params: {
    source: "chatgpt" | "claude" | "gemini";
    fileData: string; // base64 encoded .pmtpk file
    promptCount: number;
    clerkId: string; // Pass clerkId from authState
  }): Promise<{ success: boolean; r2Key?: string; error?: string }> {
    if (!params.clerkId) {
      return { success: false, error: "Not authenticated" };
    }

    // First check if this would exceed the prompt limit
    const limitCheck = await this.checkDashboardPromptLimit(params.clerkId, params.source, params.promptCount);
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: `Would exceed ${limitCheck.limit} prompt limit (current: ${limitCheck.currentTotal}, adding: ${params.promptCount})`
      };
    }

    // Upload to R2 - use direct fetch with clerkId as auth token
    // The R2 worker decodes the token to extract userId
    const authToken = btoa(JSON.stringify({ userId: params.clerkId }));

    try {
      const uploadResponse = await fetch(`${API_BASE}/storage/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          source: params.source,
          fileData: params.fileData,
          promptCount: params.promptCount,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json().catch(() => ({ error: "Upload failed" }));
        return { success: false, error: error.error || "Failed to upload to storage" };
      }

      const uploadData = await uploadResponse.json() as { success: boolean; r2Key: string; size: number };

      if (!uploadData.success) {
        return { success: false, error: "Failed to upload to storage" };
      }

      // Save metadata to Convex
      const response = await fetch(`${CONVEX_API_URL}/api/extension/save-prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: params.clerkId,
          source: params.source,
          r2Key: uploadData.r2Key,
          promptCount: params.promptCount,
          fileSize: uploadData.size,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        return { success: false, error: error.error || "Failed to save metadata" };
      }

      return { success: true, r2Key: uploadData.r2Key };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to save to dashboard" };
    }
  }

  /**
   * Check if adding prompts would exceed the dashboard limit
   */
  async checkDashboardPromptLimit(
    clerkId: string,
    source: "chatgpt" | "claude" | "gemini",
    addingCount: number
  ): Promise<{ allowed: boolean; limit: number; currentTotal: number }> {
    try {
      const response = await fetch(`${CONVEX_API_URL}/api/extension/check-prompt-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId, source, addingCount }),
      });

      if (!response.ok) {
        // If check fails, assume allowed (fail open for better UX)
        return { allowed: true, limit: 40, currentTotal: 0 };
      }

      return await response.json();
    } catch {
      // If check fails, assume allowed
      return { allowed: true, limit: 40, currentTotal: 0 };
    }
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
   * Check auth status from web app (if user is logged in via Clerk on web)
   */
  async checkWebAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user?: {
      id: string;
      email: string;
      name?: string;
    };
  } | null> {
    try {
      // Use localhost:3000 for dev, will be pmtpk.ai in production
      const webUrl = "http://localhost:3000";
      const response = await fetch(`${webUrl}/api/auth/status`, {
        method: "GET",
        credentials: "include", // Include Clerk session cookies
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get billing status from Convex - checks user's current plan
   */
  async getBillingStatus(clerkId: string): Promise<{
    tier: "free" | "pro";
    hasPro: boolean;
  }> {
    const response = await fetch(`${CONVEX_API_URL}/api/extension/billing-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw {
        code: "BILLING_STATUS_FAILED",
        message: error.error || "Failed to get billing status",
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }
}

export const api = new ApiClient();
