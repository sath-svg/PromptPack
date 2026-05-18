/**
 * Shared mapper from API error responses to user-friendly messages.
 * Used by chat, SkillFlow planner, executor, and agent subtask call sites
 * so error copy is consistent and easy to update in one place.
 */

export interface ApiErrorBody {
  error?: string;
  code?: string;
  message?: string;
  details?: unknown;
}

export type ApiErrorContext = 'chat' | 'subtask' | 'planner' | 'agent';

const CTX_NOUN: Record<ApiErrorContext, string> = {
  chat: 'this message',
  subtask: 'this workflow step',
  planner: 'this workflow',
  agent: 'this agent run',
};

/**
 * Convert (HTTP status, response body) into a single sentence the user
 * can act on. Never returns raw status codes or JSON blobs — those go
 * to console.error for debugging instead.
 */
export function friendlyApiError(
  status: number,
  body: ApiErrorBody | null | undefined,
  context: ApiErrorContext = 'chat',
): string {
  const code = body?.code ?? '';
  const serverMessage = body?.message ?? '';
  const noun = CTX_NOUN[context];

  if (status === 401) {
    return 'Session expired — sign in again to continue.';
  }
  if (status === 402) {
    return `Out of credits — top up to send ${noun}.`;
  }
  if (status === 403) {
    if (code === 'SKILLFLOW_REQUIRES_PAID') {
      return 'SkillFlow workflows are a Pro / Studio feature. Upgrade to run multi-step AI workflows.';
    }
    if (code === 'FRONTIER_NOT_ALLOWED') {
      return 'Powerful Models (Opus, GPT-5 Pro, o3 Pro) are a Pro / Studio feature. Pick a Fast or Balanced model or upgrade.';
    }
    return serverMessage || 'Access denied for this request.';
  }
  if (status === 429) {
    if (code === 'DAILY_FREE_LIMIT_REACHED') {
      return 'Daily free-trial limit reached. Resets at midnight UTC, or upgrade for the full monthly allowance.';
    }
    return 'Sending too fast — wait a moment and try again.';
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'Connection to the AI provider failed. Please try again in a moment.';
  }
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }
  if (status === 400 && serverMessage) {
    return serverMessage;
  }
  return serverMessage || `Couldn't send ${noun}. Please try again.`;
}

/**
 * Try to parse an error body from a non-ok Response. Always returns
 * an object (possibly empty) so callers can pass it directly to
 * `friendlyApiError`.
 */
export async function safeParseErrorBody(res: Response): Promise<ApiErrorBody> {
  try {
    return (await res.json()) as ApiErrorBody;
  } catch {
    return {};
  }
}
