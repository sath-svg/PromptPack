// API client for PromptPack cloud backend
// Handles authenticated requests to Cloudflare Workers API

import { getSession, saveSession, clearSession, type LocalPrompt, type LocalPack } from "./db";
import {
  API_BASE,
  CONVEX_API_URL,
  BASE_URL,
  IS_PRODUCTION,
  FREE_PROMPT_LIMIT,
  PRO_PROMPT_LIMIT,
  SESSION_EXPIRY_MS,
  UNLIMITED_PACK_LIMIT,
  FALLBACK_PROMPT_LIMIT,
  PRICING_URL,
} from "./config";

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
  private decodeJwtExpiry(token: string): number | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
      const json = atob(padded);
      const data = JSON.parse(json) as { exp?: number };
      if (typeof data.exp === "number") {
        return data.exp * 1000;
      }
    } catch {
      // Ignore decode errors
    }
    return null;
  }
  private async classifyViaBackground(promptText: string, maxWords: number): Promise<{
    ok: boolean;
    header?: string;
    error?: string;
    status?: number;
  } | null> {
    if (!chrome?.runtime?.sendMessage) return null;
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: "PP_CLASSIFY",
        promptText,
        maxWords,
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(response as {
          ok: boolean;
          header?: string;
          error?: string;
          status?: number;
        });
      });
    });
  }

  private async verifyViaBackground(token?: string): Promise<boolean | null> {
    if (!chrome?.runtime?.sendMessage) return null;
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: "PP_VERIFY_AUTH",
        token,
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        const ok = (response as { ok?: boolean } | undefined)?.ok;
        resolve(typeof ok === "boolean" ? ok : null);
      });
    });
  }

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
      token: string; // Clerk session token (short-lived)
      refreshToken?: string; // Long-lived refresh token from Convex
      refreshTokenExpiresAt?: number; // When refresh token expires
    };

    if (!data.success) {
      throw {
        code: "TOKEN_EXCHANGE_FAILED",
        message: "Failed to exchange code",
        status: 400,
      } as ApiError;
    }

    // Save session with Clerk token and refresh token
    const tokenExpiry = this.decodeJwtExpiry(data.token);
    await saveSession({
      userId: data.user.clerkId,
      email: data.user.email,
      tier: data.user.plan === "pro" ? "paid" : "free",
      accessToken: data.token, // Clerk session token (short-lived)
      refreshToken: data.refreshToken || data.token, // Use new refresh token if available
      expiresAt: tokenExpiry ?? (Date.now() + SESSION_EXPIRY_MS),
      entitlements: {
        promptLimit: data.user.plan === "pro" ? PRO_PROMPT_LIMIT : FREE_PROMPT_LIMIT,
        loadedPackLimit: data.user.plan === "pro" ? UNLIMITED_PACK_LIMIT : 0,
      },
    });
  }

  async refreshToken(): Promise<boolean> {
    const session = await getSession();
    if (!session?.refreshToken) {
      return false;
    }

    // Check if this is an old-style session (JWT used as refresh token)
    // New refresh tokens are UUIDs (36 chars), JWTs are much longer and contain dots
    const isLegacyToken = session.refreshToken.includes(".") || session.refreshToken.length > 100;
    if (isLegacyToken) {
      // Don't clear session here - let user continue until they need to re-auth
      return false;
    }

    try {
      // Call the refresh endpoint (proxies to Convex)
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string; message?: string };
        console.error("[PromptPack] Refresh failed:", response.status, errorData);

        // If token was revoked or reused, clear session
        if (errorData.error === "TOKEN_REUSE" || errorData.error === "TOKEN_REVOKED" ||
            errorData.error === "INVALID_TOKEN" || errorData.error === "TOKEN_EXPIRED") {
          console.warn("[PromptPack] Refresh token invalid, clearing session");
          await clearSession();
          return false;
        }

        // For other errors (like 404 if endpoint not deployed), don't clear session
        // User can continue with expired JWT until they need to re-auth
        if (response.status === 404) {
          console.warn("[PromptPack] Refresh endpoint not found - backend may need deployment");
          return false;
        }

        throw new Error(errorData.error || errorData.message || "Refresh failed");
      }

      const data = await response.json() as {
        success: boolean;
        user?: {
          clerkId: string;
          email: string;
          plan: "free" | "pro";
        };
        refreshToken?: string; // New rotated refresh token
        refreshTokenExpiresAt?: number;
        expiresIn?: number;
      };

      if (!data.success) {
        console.error("[PromptPack] Refresh response not successful:", data);
        await clearSession();
        return false;
      }


      // Update session with new refresh token (token rotation)
      // Note: The accessToken (Clerk JWT) needs to be refreshed separately
      // For now, we extend the session expiry based on the refresh token
      await saveSession({
        ...session,
        // Update user info if provided
        ...(data.user && {
          userId: data.user.clerkId,
          email: data.user.email,
          tier: data.user.plan === "pro" ? "paid" : "free",
          entitlements: {
            promptLimit: data.user.plan === "pro" ? PRO_PROMPT_LIMIT : FREE_PROMPT_LIMIT,
            loadedPackLimit: data.user.plan === "pro" ? UNLIMITED_PACK_LIMIT : 0,
          },
        }),
        // Update refresh token (rotation)
        refreshToken: data.refreshToken || session.refreshToken,
        // Extend expiry - use refreshTokenExpiresAt or expiresIn
        expiresAt: data.refreshTokenExpiresAt
          || (data.expiresIn ? Date.now() + data.expiresIn * 1000 : session.expiresAt),
      });

      return true;
    } catch (error) {
      console.error("[PromptPack] Token refresh failed:", error);
      // Don't clear session on network errors - let user retry
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.warn("[PromptPack] Network error during refresh, keeping session");
        return false;
      }
      await clearSession();
      return false;
    }
  }

  async logout(): Promise<void> {
    const session = await getSession();
    try {
      // Revoke refresh token on server
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: session?.refreshToken,
        }),
      });
    } catch {
      // Ignore errors on logout
    }
    await clearSession();
  }

  // ============ Entitlements ============

  async getEntitlements(): Promise<Entitlements> {
    return this.request("GET", "/entitlements");
  }

  /**
   * Verify Clerk JWT with the worker
   */
  async verifyAuthToken(token: string): Promise<boolean> {
    const backgroundOk = await this.verifyViaBackground(token);
    if (backgroundOk !== null) return backgroundOk;
    if (typeof location !== "undefined" && location.protocol !== "chrome-extension:") {
      return false;
    }
    try {
      const response = await fetch(`${API_BASE}/auth/status`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Verify current auth session via background (no token required).
   * Useful in content scripts that cannot read extension IndexedDB.
   */
  async verifyAuthSession(): Promise<boolean> {
    const backgroundOk = await this.verifyViaBackground();
    if (backgroundOk !== null) return backgroundOk;
    const session = await getSession();
    if (!session?.accessToken) return false;
    try {
      const response = await fetch(`${API_BASE}/auth/status`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
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
    headers?: Record<string, string>; // Map of promptId -> header
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
          headers: params.headers, // Map of promptId -> header
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
        return { allowed: true, limit: FALLBACK_PROMPT_LIMIT, currentTotal: 0 };
      }

      return await response.json();
    } catch {
      // If check fails, assume allowed
      return { allowed: true, limit: FALLBACK_PROMPT_LIMIT, currentTotal: 0 };
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
    return { url: PRICING_URL };
  }

  /**
   * Check auth status from web app (if user is logged in via Clerk on web)
   * Calls Next.js API which checks Clerk session cookies.
   *
   * NOTE: Cross-origin cookie sharing doesn't work between chrome-extension://
   * and pmtpk.com in production, so this returns null. Users must use the
   * explicit login flow via the extension popup.
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
      // Cross-origin cookie sharing doesn't work between chrome-extension://
      // and pmtpk.com in production, so skip the API call to save costs.
      // Users authenticate via the explicit login flow in the extension.
      if (IS_PRODUCTION) {
        return null;
      }

      const response = await fetch(`${BASE_URL}/api/auth/status`, {
        method: "GET",
        credentials: "include",
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

  // ============ Classification ============

  /**
   * Classify a prompt and get an AI-generated header
   * Requires authentication - returns error for unauthenticated users
   * Uses userId for rate limiting (no token auth required)
   */
  async classifyPrompt(promptText: string): Promise<{
    success: boolean;
    header?: string;
    error?: string
  }> {
    try {
      const maxWords = 2;
      const backgroundResult = await this.classifyViaBackground(promptText, maxWords);
      if (backgroundResult) {
        if (backgroundResult.ok && backgroundResult.header) {
          return { success: true, header: backgroundResult.header };
        }
        return { success: false, error: backgroundResult.error || "Classification failed" };
      }

      const session = await getSession();
      if (!session?.userId) {
        return { success: false, error: "Sign in required for AI-generated headers" };
      }

      const response = await fetch(`${API_BASE}/classify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptText: promptText.slice(0, 500), // Limit to 500 chars
          maxWords,
          userId: session.userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Classification failed" }));
        return { success: false, error: error.error || "Failed to classify" };
      }

      const data = await response.json();
      return { success: true, header: data.header };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error"
      };
    }
  }
}

export const api = new ApiClient();
