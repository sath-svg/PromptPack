import { API_BASE, FREE_PROMPT_LIMIT, PRO_PROMPT_LIMIT } from "./shared/config";
import { getSession } from "./shared/db";

type ClassifyMessage = {
  type: "PP_CLASSIFY";
  promptText: string;
  maxWords?: number;
};

type VerifyMessage = {
  type: "PP_VERIFY_AUTH";
  token?: string;
};

type EnhanceTokenMessage = {
  type: "PP_GET_ENHANCE_TOKEN";
};

type PromptLimitMessage = {
  type: "PP_GET_PROMPT_LIMIT";
};

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const payload = message as ClassifyMessage | VerifyMessage | EnhanceTokenMessage | PromptLimitMessage;
  if (!payload || typeof payload !== "object") return;
  if (
    payload.type !== "PP_CLASSIFY" &&
    payload.type !== "PP_VERIFY_AUTH" &&
    payload.type !== "PP_GET_ENHANCE_TOKEN" &&
    payload.type !== "PP_GET_PROMPT_LIMIT"
  ) {
    return;
  }

  (async () => {
    if (payload.type === "PP_GET_ENHANCE_TOKEN") {
      const session = await getSession();
      if (!session?.userId || !session.accessToken || session.expiresAt < Date.now()) {
        sendResponse({ token: null });
        return;
      }

      const token = btoa(JSON.stringify({ userId: session.userId }));
      sendResponse({ token });
      return;
    }

    if (payload.type === "PP_GET_PROMPT_LIMIT") {
      const session = await getSession();
      if (session?.entitlements?.promptLimit) {
        sendResponse({ limit: session.entitlements.promptLimit });
        return;
      }
      if (session?.tier === "paid") {
        sendResponse({ limit: PRO_PROMPT_LIMIT });
        return;
      }
      sendResponse({ limit: FREE_PROMPT_LIMIT });
      return;
    }

    if (payload.type === "PP_VERIFY_AUTH") {
      let sessionToken = payload.token;
      if (!sessionToken) {
        const session = await getSession();
        if (!session?.accessToken || session.expiresAt < Date.now()) {
          sendResponse({ ok: false, error: "Sign in required" });
          return;
        }
        sessionToken = session.accessToken;
      }

      const response = await fetch(`${API_BASE}/auth/status`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        sendResponse({
          ok: false,
          status: response.status,
          error: response.statusText,
        });
        return;
      }

      sendResponse({ ok: true });
      return;
    }

    const session = await getSession();
    // Use refresh token for /classify authentication (not the short-lived Clerk JWT)
    if (!session?.refreshToken || session.expiresAt < Date.now()) {
      sendResponse({ ok: false, error: "Sign in required for AI-generated headers" });
      return;
    }

    const response = await fetch(`${API_BASE}/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.refreshToken}`,
      },
      body: JSON.stringify({
        promptText: payload.promptText.slice(0, 500),
        maxWords: payload.maxWords ?? 2,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      sendResponse({
        ok: false,
        error: error.error || "Failed to classify",
        status: response.status,
      });
      return;
    }

    const data = await response.json() as { header?: string };
    sendResponse({ ok: true, header: data.header });
  })().catch((err) => {
    sendResponse({
      ok: false,
      error: err instanceof Error ? err.message : "Classification failed",
    });
  });

  return true;
});
