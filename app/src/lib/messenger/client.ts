/**
 * Telegram desktop gateway client (frontend half).
 *
 * Slice B scope:
 *   - listen for `messenger://incoming` Tauri events from the Rust long-poll
 *   - route authorized chats into Skill Chat (one convo per Telegram chat_id,
 *     capped at MAX_CONVERSATIONS = 3 per `conversationsStore`)
 *   - send the assistant's final reply back via `messenger_telegram_send_reply`
 *   - handle the /start pairing handshake — unauthorized first-DMs land in
 *     `telegramPendingChats`; the user approves in Settings → MessengerPanel
 *
 * Out of scope (later slices):
 *   - webhook handover on quit (Telegram offline fallback via Workers)
 *   - image attachments + vision-model bump
 *   - WhatsApp / iMessage
 *
 * Convo mapping is **in-memory only**. After an app restart the first inbound
 * message from a given chat starts a fresh convo. That's acceptable v1.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useSettingsStore } from '../../stores/settingsStore';
import { useConversationsStore, MaxConversationsError } from '../../stores/conversationsStore';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { getStoresFor } from '../../stores/registry';
import type { ChatMessage, PackStep } from '../../stores/chatStore';
import type { AgentState } from '../../stores/agentStore';
import type { CloudPrompt, UserPack } from '../../stores/syncStore';
import { mdToTelegramHtml } from './format';
import { maybeSendSticker, sendSpecificSticker } from './stickers';
import { useSkillyStore } from '../../stores/skillyStore';

interface IncomingMessagePayload {
  platform: 'telegram';
  chat_id: number;
  from_user_id?: number;
  from_username?: string;
  from_display_name?: string;
  text: string;
  message_id: number;
  is_start_command: boolean;
}

interface ChatStoreState {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (text: string, packName?: string, systemPrompt?: string, attachments?: string[]) => Promise<void>;
  runPack: (packTitle: string, steps: PackStep[], attachments?: string[], extraInstructions?: string) => Promise<void>;
  stopGeneration: () => void;
}

let unlisten: UnlistenFn | null = null;
/**
 * Memoized boot promise. Guards against React StrictMode's mount → unmount →
 * mount cycle, which would otherwise attach two `messenger://incoming`
 * listeners (the first one's `listen()` resolves AFTER the StrictMode cleanup
 * runs, so its `unlisten` is captured too late to cancel). Two listeners ⇒
 * every inbound message handled twice — one wins the `inFlight` guard and
 * dispatches to Skill Chat, the loser sends the spurious "Still working…"
 * reply. Memoizing the promise means concurrent boot calls share a single
 * listener subscription.
 */
let bootPromise: Promise<void> | null = null;

/** chat_id → conversationId mapping. Rebuilt lazily after restarts. */
const chatToConvo = new Map<number, string>();

/** Per-chat reentrancy guard so two fast inbound messages don't double-spawn. */
const inFlight = new Set<number>();
/** Update-id dedupe — guards against the Rust loop emitting the same update
 *  more than once (rare, but cheap to defend against). Bounded by trimming. */
const seenUpdateIds = new Set<number>();
const SEEN_UPDATE_CAP = 512;

/**
 * Per-chat pending skill set run waiting on variable values. The next
 * inbound message from this chat will be parsed for `key=value` pairs (or
 * positional `|`-separated values) and used to fill the template, then
 * passed to `chatStore.runPack`.
 */
interface PendingSetRun {
  entry: PackEntry;
  steps: PackStep[];
  variables: string[];
  expiresAt: number;
}
const pendingRuns = new Map<number, PendingSetRun>();
const PENDING_RUN_TTL_MS = 10 * 60 * 1000; // 10 min

const PAIRING_REPLY = [
  '👋 Hi! This chat is not yet authorized for Skillset.',
  '',
  'Open the Skillset app → Settings → Messengers → "Pending chats" and tap *Approve* to link this chat.',
  '',
  'Once approved, every message here runs against your Skill Chat agent.',
].join('\n');

const APP_OFFLINE_HINT = 'Open Skillset on your desktop to continue this chat with the full agent (workspace, tools, skillflows).';

const MAX_CONVERSATIONS = 3;

/**
 * Initialize the gateway. Safe to call multiple times — concurrent and
 * subsequent calls await the same boot promise so we never attach two
 * `messenger://incoming` listeners. Pulls token + enabled state from
 * settingsStore; subscribes for runtime changes so flipping the toggle in
 * Settings starts/stops the loop without an app restart.
 */
export function bootMessengerClient(): Promise<void> {
  if (bootPromise) return bootPromise;
  bootPromise = doBoot().catch((err) => {
    // Reset on failure so a future caller can retry instead of being wedged
    // on a rejected promise forever.
    bootPromise = null;
    throw err;
  });
  return bootPromise;
}

async function doBoot(): Promise<void> {
  // Wire Tauri event listener once. It survives token rotations — the Rust
  // side decides whether to emit.
  unlisten = await listen<IncomingMessagePayload>('messenger://incoming', (e) => {
    void handleIncoming(e.payload).catch((err) => {
      console.warn('[messenger] handleIncoming failed', err);
    });
  });

  // Drive the Rust loop from settings state.
  const apply = async () => {
    const { messengersEnabled, telegramBotToken } = useSettingsStore.getState();
    try {
      if (messengersEnabled && telegramBotToken.trim().length > 0) {
        await invoke('messenger_telegram_start', { token: telegramBotToken.trim() });
        // Register the bot's slash command list with Telegram so the official
        // clients show autocomplete in the `/` picker. Best-effort — a
        // transient failure here doesn't block the long-poll loop.
        try {
          await invoke('messenger_telegram_set_commands');
        } catch (err) {
          console.warn('[messenger] setMyCommands failed', err);
        }
      } else {
        await invoke('messenger_telegram_stop');
      }
    } catch (err) {
      console.warn('[messenger] apply state failed', err);
    }
  };

  await apply();

  useSettingsStore.subscribe((state, prev) => {
    if (
      state.messengersEnabled !== prev.messengersEnabled ||
      state.telegramBotToken !== prev.telegramBotToken
    ) {
      void apply();
    }
  });
}

/**
 * Intentionally a no-op in the App-level lifecycle effect. The desktop app's
 * messenger gateway lives for the process lifetime; tearing it down on every
 * React StrictMode unmount caused a double-listener race in dev. Real
 * shutdown happens implicitly when the Tauri process exits and the Rust
 * `TelegramState` is dropped. Left exported so future code (e.g. a "sign
 * out" path) can still detach explicitly.
 */
export async function shutdownMessengerClient(): Promise<void> {
  if (unlisten) {
    unlisten();
    unlisten = null;
  }
  bootPromise = null;
  try {
    await invoke('messenger_telegram_stop');
  } catch (err) {
    console.warn('[messenger] stop on shutdown failed', err);
  }
}

async function handleIncoming(payload: IncomingMessagePayload): Promise<void> {
  if (payload.platform !== 'telegram') return;

  // Defensive dedupe: skip messages we've already processed in this session.
  // Belt-and-suspenders for the StrictMode double-listener case + protection
  // against any future scenario where the Rust loop re-emits a stale update.
  const dedupeKey = payload.chat_id * 1_000_000 + payload.message_id;
  if (seenUpdateIds.has(dedupeKey)) return;
  seenUpdateIds.add(dedupeKey);
  if (seenUpdateIds.size > SEEN_UPDATE_CAP) {
    // Trim oldest. Set iteration order is insertion order — drop the first N.
    const drop = seenUpdateIds.size - SEEN_UPDATE_CAP;
    let i = 0;
    for (const k of seenUpdateIds) {
      if (i++ >= drop) break;
      seenUpdateIds.delete(k);
    }
  }

  if (inFlight.has(payload.chat_id)) {
    // Reject overlapping sends for the same chat; Telegram will retry on the
    // next user message. Simpler than queueing for v1.
    await sendReply(payload.chat_id, '⏳ Still working on the previous message — try again once it finishes.', payload.message_id);
    return;
  }

  const { telegramAuthorizedChats, addTelegramPendingChat } = useSettingsStore.getState();
  const authorized = telegramAuthorizedChats.find((c) => c.chatId === payload.chat_id);

  if (!authorized) {
    addTelegramPendingChat({
      chatId: payload.chat_id,
      username: payload.from_username,
      displayName: payload.from_display_name,
      firstSeenAt: Date.now(),
      lastMessagePreview: payload.text.slice(0, 200),
    });
    await sendReply(payload.chat_id, PAIRING_REPLY, payload.message_id);
    return;
  }

  // Skilly sticker drop — fire-and-forget. Priority:
  //   1. passed_out  — if Skilly is currently passed out, surface that
  //      to the remote user so they know to revive him.
  //   2. random      — otherwise the normal rate-limited random pick.
  // Both paths swallow failures; never block the text reply.
  if (useSkillyStore.getState().passedOut) {
    void sendSpecificSticker(payload.chat_id, 'passed_out');
  } else {
    void maybeSendSticker(payload.chat_id);
  }

  if (payload.is_start_command) {
    await sendReply(
      payload.chat_id,
      '✅ Linked. Send any message and I will run it through Skill Chat. ' + APP_OFFLINE_HINT + '\n\nType /help for commands.',
      payload.message_id,
    );
    return;
  }

  // Pending skill-set run waiting on variable values. The next message
  // from this chat is treated as variable input, NOT a normal Skill Chat
  // prompt. `/cancel` aborts; any other slash command preempts the wait.
  const pending = pendingRuns.get(payload.chat_id);
  if (pending) {
    if (Date.now() > pending.expiresAt) {
      pendingRuns.delete(payload.chat_id);
      await sendReply(payload.chat_id, '⌛ Skill set wait timed out. Run `/run` again.', payload.message_id);
      return;
    }
    const text = payload.text.trim();
    if (text.toLowerCase() === '/cancel') {
      pendingRuns.delete(payload.chat_id);
      await sendReply(payload.chat_id, '❌ Cancelled. Set was not run.', payload.message_id);
      return;
    }
    // Don't swallow other slash commands — let the user escape.
    if (text.startsWith('/') && !text.startsWith('/=')) {
      pendingRuns.delete(payload.chat_id);
      // Fall through to slash handler below for this same message.
    } else {
      inFlight.add(payload.chat_id);
      try {
        const parsed = parseVariableValues(text, pending.variables);
        if ('error' in parsed) {
          await sendReply(
            payload.chat_id,
            `⚠️ ${parsed.error}\n\nExpected: ${pending.variables.map((v) => `\`{${v}}\``).join(', ')}\nOr send \`/cancel\`.`,
            payload.message_id,
          );
          return;
        }
        pendingRuns.delete(payload.chat_id);
        const filled: PackStep[] = pending.steps.map((s) => ({
          header: s.header ? fillVariables(s.header, parsed) : s.header,
          text: fillVariables(s.text, parsed),
        }));
        await executePackRun(payload, pending.entry, filled);
      } finally {
        inFlight.delete(payload.chat_id);
      }
      return;
    }
  }

  // Slash commands run synchronously without going through Skill Chat.
  // Anything else falls through to dispatchToSkillChat below.
  const trimmed = payload.text.trim();
  if (trimmed.startsWith('/')) {
    inFlight.add(payload.chat_id);
    try {
      const handled = await handleSlashCommand(payload, trimmed);
      if (handled) return;
    } catch (err) {
      console.error('[messenger] slash command threw', err);
      // Forced sad sticker on any error path. Cooldown inside the
      // dispatcher prevents flooding if errors repeat back-to-back.
      void sendSpecificSticker(payload.chat_id, 'default_sad');
      throw err;
    } finally {
      inFlight.delete(payload.chat_id);
    }
  }

  inFlight.add(payload.chat_id);
  try {
    await dispatchToSkillChat(payload);
  } catch (err) {
    console.error('[messenger] dispatch threw', err);
    void sendSpecificSticker(payload.chat_id, 'default_sad');
    throw err;
  } finally {
    inFlight.delete(payload.chat_id);
  }
}

// ─── Slash commands ────────────────────────────────────────────────────────

const HELP_TEXT = [
  '*Skillset commands*',
  '',
  '/help — show this message',
  '/sets — list your skill sets',
  '/run <number|title> — run a skill set as a SkillFlow',
  '/workspace — show the workspace bound to this chat',
  '/workspace <path> — set workspace (absolute path on the PC)',
  '/workspace clear — detach workspace (text-only replies)',
  '/status — show agent + workspace + Skill Flow state',
  '',
  '*Edits*',
  '/auto on — auto-accept every staged file edit (no review)',
  '/auto off — require explicit accept/reject per edit',
  '/auto — show current mode',
  '/edits — list edits awaiting review for this chat',
  '/accept <id|all> — apply staged edit(s)',
  '/reject <id|all> — drop staged edit(s)',
  '',
  '*Run control*',
  '/cancel — stop the in-flight run',
  '/new — drop conversation memory, start fresh on next message',
  '',
  'Anything not starting with / runs through Skill Chat normally.',
  'With a workspace set + Skill Flow on, the agent can read/write/edit/glob/grep/bash.',
].join('\n');

/** Extract `{name}` placeholders from pack template text. Mirrors the SkillChat
 *  UI's `extractVariables` so behavior stays consistent between the in-app
 *  variable form and the messenger prompt. */
function extractVariables(text: string): string[] {
  const matches = new Set<string>();
  const regex = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) matches.add(m[1].trim());
  return Array.from(matches);
}

function fillVariables(text: string, values: Record<string, string>): string {
  return text.replace(/\{([^}]+)\}/g, (_, key) => {
    const k = String(key).trim();
    return values[k] ?? `{${k}}`;
  });
}

function parseVariableValues(reply: string, variables: string[]): Record<string, string> | { error: string } {
  const out: Record<string, string> = {};

  // Line-based `key=value` first.
  const lines = reply.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let parsedAsKv = false;
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (variables.includes(key)) {
      out[key] = val;
      parsedAsKv = true;
    }
  }
  if (parsedAsKv && variables.every((v) => v in out)) return out;

  // Positional `|`-separated fallback. Only when no key=value rows were
  // accepted (otherwise we'd mix the two parses).
  if (!parsedAsKv) {
    const parts = reply.split('|').map((s) => s.trim());
    if (parts.length === variables.length) {
      variables.forEach((name, i) => {
        out[name] = parts[i];
      });
      return out;
    }
  }

  const missing = variables.filter((v) => !(v in out));
  return {
    error: parsedAsKv
      ? `Missing values for: ${missing.join(', ')}.`
      : `Expected ${variables.length} value(s) separated by \`|\`, got ${reply.split('|').length}.`,
  };
}

async function handleSlashCommand(payload: IncomingMessagePayload, raw: string): Promise<boolean> {
  const [cmd, ...rest] = raw.split(/\s+/);
  const argsText = raw.slice(cmd.length).trim();
  const c = cmd.toLowerCase();

  switch (c) {
    case '/help':
    case '/start':
      await sendReply(payload.chat_id, HELP_TEXT, payload.message_id);
      return true;

    case '/status': {
      const convoId = chatToConvo.get(payload.chat_id);
      const slot = convoId ? getStoresFor(convoId) : null;
      const workspace = slot ? (slot.agent.getState() as AgentState).workspace : null;
      const settings = useSettingsStore.getState();
      const lines = [
        `Conversation: ${convoId ?? '(none yet — first message will create one)'}`,
        `Workspace: ${workspace ?? '(none)'}`,
        `Default workspace (settings): ${settings.messengerDefaultWorkspace || '(unset)'}`,
        `Skill Flow (orchestrator): ${settings.orchestratorEnabled ? 'on' : 'OFF — set it from Settings → AI to enable tools'}`,
        `Managed mode: ${settings.managedModeEnabled ? 'on' : 'off (required for pack runs)'}`,
      ];
      await sendReply(payload.chat_id, lines.join('\n'), payload.message_id);
      return true;
    }

    case '/new': {
      chatToConvo.delete(payload.chat_id);
      await sendReply(payload.chat_id, '🆕 Next message will start a fresh Skill Chat conversation.', payload.message_id);
      return true;
    }

    case '/cancel': {
      const convoId = chatToConvo.get(payload.chat_id);
      if (!convoId) {
        await sendReply(payload.chat_id, 'Nothing running.', payload.message_id);
        return true;
      }
      const slot = getStoresFor(convoId);
      const chat = slot.chat as { getState: () => ChatStoreState };
      chat.getState().stopGeneration();
      await sendReply(payload.chat_id, '🛑 Stopped the current run.', payload.message_id);
      return true;
    }

    case '/workspace':
      return handleWorkspaceCmd(payload, argsText);

    case '/sets':
    case '/packs':
      return handlePacksCmd(payload);

    case '/run':
      return handleRunCmd(payload, argsText);

    case '/auto':
      return handleAutoCmd(payload, argsText);

    case '/edits':
      return handleListEditsCmd(payload);

    case '/accept':
      return handleAcceptRejectCmd(payload, argsText, 'accept');

    case '/reject':
      return handleAcceptRejectCmd(payload, argsText, 'reject');

    default:
      // Unknown command — fall through so the message reaches the agent
      // (some prompts legitimately begin with /, e.g. `/path/to/file ...`).
      void rest;
      return false;
  }
}

// ─── Auto-accept + edit-review commands ────────────────────────────────────

async function handleAutoCmd(payload: IncomingMessagePayload, args: string): Promise<boolean> {
  const convoId = await resolveConversation(payload);
  if (!convoId) {
    await sendReply(payload.chat_id, '⚠️ No conversation bound yet.', payload.message_id);
    return true;
  }
  const slot = getStoresFor(convoId);
  const agent = slot.agent as { getState: () => AgentState };

  const arg = args.toLowerCase();
  if (!arg) {
    const on = agent.getState().autoAcceptEdits;
    await sendReply(
      payload.chat_id,
      `Auto-accept edits: *${on ? 'on' : 'off'}*\n\n` +
        (on
          ? 'Staged edits will be written to disk automatically as the agent produces them.'
          : 'Every edit pauses for `/accept <id>` or `/reject <id>` before touching disk.'),
      payload.message_id,
    );
    return true;
  }
  if (arg === 'on' || arg === 'true' || arg === '1') {
    agent.getState().setAutoAcceptEdits(true);
    await sendReply(
      payload.chat_id,
      '✅ Auto-accept *on*. Future staged edits write to disk immediately. Existing pending edits still need `/accept`.',
      payload.message_id,
    );
    return true;
  }
  if (arg === 'off' || arg === 'false' || arg === '0') {
    agent.getState().setAutoAcceptEdits(false);
    await sendReply(payload.chat_id, '✅ Auto-accept *off*. Edits require explicit `/accept`.', payload.message_id);
    return true;
  }
  await sendReply(payload.chat_id, 'Usage: `/auto on`, `/auto off`, or `/auto` to see current mode.', payload.message_id);
  return true;
}

async function handleListEditsCmd(payload: IncomingMessagePayload): Promise<boolean> {
  const convoId = chatToConvo.get(payload.chat_id);
  if (!convoId) {
    await sendReply(payload.chat_id, 'No conversation yet — nothing to review.', payload.message_id);
    return true;
  }
  const slot = getStoresFor(convoId);
  const agent = slot.agent as { getState: () => AgentState };
  const pending = pendingEditsOf(agent);
  if (pending.length === 0) {
    await sendReply(payload.chat_id, '✅ No edits awaiting review.', payload.message_id);
    return true;
  }
  await sendReply(payload.chat_id, formatPendingEdits(pending), payload.message_id);
  return true;
}

async function handleAcceptRejectCmd(
  payload: IncomingMessagePayload,
  args: string,
  action: 'accept' | 'reject',
): Promise<boolean> {
  const convoId = chatToConvo.get(payload.chat_id);
  if (!convoId) {
    await sendReply(payload.chat_id, 'No conversation yet — nothing to ' + action + '.', payload.message_id);
    return true;
  }
  const slot = getStoresFor(convoId);
  const agent = slot.agent as { getState: () => AgentState };
  const pending = pendingEditsOf(agent);
  if (pending.length === 0) {
    await sendReply(payload.chat_id, `✅ No edits to ${action}.`, payload.message_id);
    return true;
  }

  const arg = args.trim();
  if (!arg) {
    await sendReply(
      payload.chat_id,
      `Usage: \`/${action} <id>\` or \`/${action} all\`. Use \`/edits\` to list.`,
      payload.message_id,
    );
    return true;
  }

  // Resolve target ids. `all` operates over every current pending edit.
  // Otherwise we match on id prefix (full id is long — last 6 chars is plenty
  // unique inside a single convo).
  let targets: string[];
  if (arg.toLowerCase() === 'all') {
    targets = pending.map((e) => e.id);
  } else {
    const match = pending.find((e) => e.id === arg)
      ?? pending.find((e) => e.id.endsWith(arg))
      ?? pending.find((e) => e.id.toLowerCase().includes(arg.toLowerCase()));
    if (!match) {
      await sendReply(
        payload.chat_id,
        `No pending edit matches "${arg}". \`/edits\` to list.`,
        payload.message_id,
      );
      return true;
    }
    targets = [match.id];
  }

  const ok: string[] = [];
  const fail: string[] = [];
  for (const id of targets) {
    try {
      if (action === 'accept') await agent.getState().acceptEdit(id);
      else await agent.getState().rejectEdit(id);
      ok.push(shortEditId(id));
    } catch (err) {
      fail.push(`${shortEditId(id)} (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  const lines: string[] = [];
  if (ok.length > 0) lines.push(`${action === 'accept' ? '✅ Accepted' : '🗑 Rejected'}: ${ok.join(', ')}`);
  if (fail.length > 0) lines.push(`⚠️ Failed: ${fail.join(', ')}`);
  const remaining = pendingEditsOf(agent);
  if (remaining.length > 0) {
    lines.push('', `${remaining.length} edit(s) still pending — \`/edits\` to list.`);
  } else {
    lines.push('', 'No edits remaining.');
  }
  await sendReply(payload.chat_id, lines.join('\n'), payload.message_id);
  return true;
}

interface PendingEditEntry {
  id: string;
  path: string;
  beforeLen: number;
  afterLen: number;
  createdAt: number;
}

function pendingEditsOf(agent: { getState: () => AgentState }): PendingEditEntry[] {
  const map = agent.getState().pendingEdits;
  const out: PendingEditEntry[] = [];
  for (const [id, e] of Object.entries(map)) {
    if (e.accepted !== null) continue; // already resolved
    out.push({
      id,
      path: e.path,
      beforeLen: e.before?.length ?? 0,
      afterLen: e.after?.length ?? 0,
      createdAt: e.createdAt,
    });
  }
  out.sort((a, b) => a.createdAt - b.createdAt);
  return out;
}

function shortEditId(id: string): string {
  return id.length > 8 ? `…${id.slice(-6)}` : id;
}

function formatPendingEdits(pending: PendingEditEntry[]): string {
  const lines = [`📝 *${pending.length} edit${pending.length === 1 ? '' : 's'} awaiting review:*`, ''];
  for (const e of pending) {
    const delta = e.afterLen - e.beforeLen;
    const sign = delta >= 0 ? '+' : '';
    lines.push(`• \`${shortEditId(e.id)}\` — ${e.path} (${sign}${delta} bytes)`);
  }
  lines.push('', '`/accept <id>` or `/reject <id>` — or `/accept all` / `/reject all`.');
  lines.push('Tip: `/auto on` accepts every edit automatically.');
  return lines.join('\n');
}

async function handleWorkspaceCmd(payload: IncomingMessagePayload, args: string): Promise<boolean> {
  // Make sure a convo exists so we have an agentStore to write to.
  const convoId = await resolveConversation(payload);
  if (!convoId) {
    await sendReply(payload.chat_id, '⚠️ Could not allocate a Skill Chat conversation.', payload.message_id);
    return true;
  }
  const slot = getStoresFor(convoId);
  const agent = slot.agent as { getState: () => AgentState };

  if (!args) {
    const current = agent.getState().workspace;
    await sendReply(
      payload.chat_id,
      current ? `Workspace: ${current}` : 'No workspace bound. Use `/workspace <absolute path>` to set one.',
      payload.message_id,
    );
    return true;
  }

  if (args.toLowerCase() === 'clear') {
    agent.getState().clearWorkspace();
    await sendReply(payload.chat_id, '🧹 Workspace cleared. Replies will be text-only.', payload.message_id);
    return true;
  }

  agent.getState().setWorkspace(args);
  await sendReply(payload.chat_id, `📂 Workspace set: ${args}`, payload.message_id);
  return true;
}

async function handlePacksCmd(payload: IncomingMessagePayload): Promise<boolean> {
  const { userPacks } = useSyncStore.getState();
  const entries = describePacks(userPacks);
  if (entries.length === 0) {
    await sendReply(
      payload.chat_id,
      'No skill sets found. Create some in the Skillset app, then `/sets` to list them.',
      payload.message_id,
    );
    return true;
  }
  const lines = ['*Your skill sets:*', ''];
  entries.forEach((e, i) => {
    lines.push(`${i + 1}. ${e.label}`);
  });
  lines.push('', 'Run one with `/run <number>` or `/run <title prefix>`.');
  await sendReply(payload.chat_id, lines.join('\n'), payload.message_id);
  return true;
}

async function handleRunCmd(payload: IncomingMessagePayload, args: string): Promise<boolean> {
  if (!args) {
    await sendReply(payload.chat_id, 'Usage: `/run <number|title prefix>`. List sets with `/sets`.', payload.message_id);
    return true;
  }
  const { userPacks } = useSyncStore.getState();
  const entries = describePacks(userPacks);
  if (entries.length === 0) {
    await sendReply(payload.chat_id, 'No skill sets found.', payload.message_id);
    return true;
  }

  // Numeric index first.
  let target: typeof entries[number] | undefined;
  const idx = Number.parseInt(args, 10);
  if (!Number.isNaN(idx) && idx >= 1 && idx <= entries.length) {
    target = entries[idx - 1];
  } else {
    const q = args.toLowerCase();
    target = entries.find((e) => e.label.toLowerCase().startsWith(q))
      || entries.find((e) => e.label.toLowerCase().includes(q));
  }
  if (!target) {
    await sendReply(payload.chat_id, `No set matches "${args}". Try \`/sets\` to see the list.`, payload.message_id);
    return true;
  }

  // Resolve prompts (fetch on demand).
  let prompts: CloudPrompt[];
  try {
    prompts = await loadPackPrompts(target);
  } catch (err) {
    await sendReply(
      payload.chat_id,
      `⚠️ Could not load set "${target.label}": ${err instanceof Error ? err.message : String(err)}`,
      payload.message_id,
    );
    return true;
  }
  if (prompts.length === 0) {
    await sendReply(payload.chat_id, `Set "${target.label}" has no prompts.`, payload.message_id);
    return true;
  }

  const steps: PackStep[] = prompts.map((p) => ({ header: p.header, text: p.text }));

  // Detect `{variable}` placeholders across every step. The in-app UI
  // collects these via a form before kicking off the run; over a
  // messenger we need to do the same conversation-flow by hand: stash
  // the pending run, ask for values, fill on the user's reply.
  const variables = collectPackVariables(steps);
  if (variables.length > 0) {
    pendingRuns.set(payload.chat_id, {
      entry: target,
      steps,
      variables,
      expiresAt: Date.now() + PENDING_RUN_TTL_MS,
    });
    const prompt = [
      `📝 *${target.label}* needs ${variables.length} value${variables.length === 1 ? '' : 's'}:`,
      '',
      ...variables.map((v) => `• \`{${v}}\``),
      '',
      'Reply with one of these formats (next message I see from you):',
      '',
      `*Keyed:* one per line — \`${variables[0]}=...\`${variables[1] ? `, \`${variables[1]}=...\`` : ''}`,
      `*Positional:* \`${variables.join(' | ')}\` (in order, pipe-separated)`,
      '',
      'Or send `/cancel` to abort.',
    ].join('\n');
    await sendReply(payload.chat_id, prompt, payload.message_id);
    return true;
  }

  await executePackRun(payload, target, steps);
  return true;
}

function collectPackVariables(steps: PackStep[]): string[] {
  const all = new Set<string>();
  for (const s of steps) {
    for (const v of extractVariables(s.text)) all.add(v);
    if (s.header) for (const v of extractVariables(s.header)) all.add(v);
  }
  return Array.from(all);
}

async function executePackRun(
  payload: IncomingMessagePayload,
  target: PackEntry,
  steps: PackStep[],
): Promise<void> {
  const convoId = await resolveConversation(payload);
  if (!convoId) {
    await sendReply(payload.chat_id, '⚠️ Could not allocate a Skill Chat conversation.', payload.message_id);
    return;
  }
  const slot = getStoresFor(convoId);
  const chat = slot.chat as { getState: () => ChatStoreState };
  const beforeCount = chat.getState().messages.length;

  await sendReply(
    payload.chat_id,
    `▶️ Running *${target.label}* (${steps.length} step${steps.length === 1 ? '' : 's'})…`,
    payload.message_id,
  );

  try {
    await chat.getState().runPack(target.label, steps);
  } catch (err) {
    await sendReply(
      payload.chat_id,
      `⚠️ Set run failed: ${err instanceof Error ? err.message : String(err)}`,
      payload.message_id,
    );
    return;
  }

  const reply = summarizeRun(chat.getState().messages, beforeCount, target.label);
  const withEdits = appendPendingEditsNote(reply, slot.agent as { getState: () => AgentState });
  await sendReply(payload.chat_id, withEdits, payload.message_id);
}

/**
 * Aggregate assistant output from a Skill Chat run for replay over the
 * messenger. Each pack step lands as its own assistant message; the
 * "last assistant message" heuristic dropped earlier steps and frequently
 * landed on a tool-only or empty bubble (the user saw "(empty reply)").
 *
 * Strategy:
 *   1. Take every NEW assistant message produced after `beforeCount`.
 *   2. Concatenate non-empty `content` with step separators.
 *   3. If nothing has text content (pure tool-call run), surface a brief
 *      summary listing which tools fired so the user gets actionable
 *      output instead of silence.
 */
/**
 * Aggregate assistant output for replay over the messenger.
 *
 * Agent runs (workspace + Skill Flow path) stream their final text into
 * `MessageBlock`s of `kind: 'text'` rather than the top-level `content`
 * field, so the previous `content`-only check missed every tool-loop
 * reply. We now harvest text from both: prefer `content` when present,
 * otherwise concatenate every text block in order.
 */
function summarizeRun(messages: ChatMessage[], beforeCount: number, label: string | null): string {
  const fresh = messages.slice(beforeCount).filter((m) => m.role === 'assistant');
  const chunks: string[] = [];
  for (const m of fresh) {
    const direct = m.content?.trim();
    if (direct) {
      chunks.push(direct);
      continue;
    }
    const fromBlocks = extractTextFromBlocks(m.blocks);
    if (fromBlocks) chunks.push(fromBlocks);
  }
  const header = label ? `✅ *${label}*\n\n` : '';
  if (chunks.length > 0) {
    return chunks.length === 1
      ? `${header}${chunks[0]}`
      : `${header}${chunks.join('\n\n— — —\n\n')}`;
  }
  const toolSummary = collectToolSummary(fresh);
  if (toolSummary) {
    return label
      ? `✅ *${label}* finished.\n\n${toolSummary}`
      : `_(no text output)_\n\n${toolSummary}`;
  }
  return label
    ? `✅ *${label}* finished (no text output, no tool calls recorded).`
    : '_(empty reply — agent produced no text and no tool activity)_';
}

function extractTextFromBlocks(blocks: ChatMessage['blocks'] | undefined): string {
  if (!blocks || blocks.length === 0) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.kind === 'text' && b.text.trim()) {
      parts.push(b.text.trim());
    }
  }
  return parts.join('\n\n');
}

function collectToolSummary(messages: ChatMessage[]): string | null {
  const counts = new Map<string, number>();
  const writes: string[] = [];
  for (const m of messages) {
    const blocks = m.blocks;
    if (!blocks) continue;
    for (const b of blocks) {
      if (b.kind !== 'tool_use') continue;
      counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
      if (b.name === 'write_file' || b.name === 'edit_file') {
        const path = (b.input as { path?: string } | undefined)?.path;
        if (typeof path === 'string') {
          writes.push(`${b.name === 'write_file' ? '📝' : '✏️'} ${path}`);
        }
      }
    }
  }
  if (counts.size === 0) return null;
  const lines: string[] = ['Tool activity:'];
  for (const [name, n] of counts) lines.push(`• ${name} ×${n}`);
  if (writes.length > 0) {
    lines.push('', 'Files touched:');
    lines.push(...writes);
  }
  return lines.join('\n');
}

interface PackEntry {
  id: string;
  label: string;
  pack: UserPack;
}

// Only surfaces user-created packs (dashboard / SkillSet UI). Extension-saved
// `cloudPacks` (Convex savedPacks + R2) are deliberately excluded — those are
// raw scraped prompts and aren't meaningful as runnable skill packs over a
// messenger.
function describePacks(userPacks: UserPack[]): PackEntry[] {
  return userPacks.map((p) => ({
    id: p.id,
    label: p.title || `Pack ${p.id.slice(0, 6)}`,
    pack: p,
  }));
}

async function loadPackPrompts(entry: PackEntry): Promise<CloudPrompt[]> {
  const sync = useSyncStore.getState();
  const cached = sync.loadedUserPacks[entry.id];
  if (cached?.prompts?.length) return cached.prompts;
  const loaded = await sync.fetchUserPackPrompts(entry.pack);
  return loaded?.prompts ?? [];
}

async function dispatchToSkillChat(payload: IncomingMessagePayload): Promise<void> {
  const convoId = await resolveConversation(payload);
  if (!convoId) {
    await sendReply(
      payload.chat_id,
      '⚠️ Could not allocate a Skill Chat conversation (cap reached). Close one in the app and try again.',
      payload.message_id,
    );
    return;
  }

  const slot = getStoresFor(convoId);
  const chat = slot.chat as { getState: () => ChatStoreState };
  const beforeCount = chat.getState().messages.length;

  try {
    await chat.getState().sendMessage(payload.text);
  } catch (err) {
    console.warn('[messenger] sendMessage failed', err);
    await sendReply(
      payload.chat_id,
      `⚠️ Agent error: ${err instanceof Error ? err.message : String(err)}`,
      payload.message_id,
    );
    return;
  }

  const reply = summarizeRun(chat.getState().messages, beforeCount, null);
  const withEdits = appendPendingEditsNote(reply, slot.agent as { getState: () => AgentState });
  await sendReply(payload.chat_id, withEdits, payload.message_id);
}

/**
 * If staged edits are still pending after a run, surface them in the same
 * reply so the user can `/accept` without having to ask. Auto-accept mode
 * never leaves anything pending, so this is a no-op there.
 */
function appendPendingEditsNote(reply: string, agent: { getState: () => AgentState }): string {
  if (agent.getState().autoAcceptEdits) return reply;
  const pending = pendingEditsOf(agent);
  if (pending.length === 0) return reply;
  return `${reply}\n\n${formatPendingEdits(pending)}`;
}

async function resolveConversation(payload: IncomingMessagePayload): Promise<string | null> {
  // Cache hit and convo still exists in the multi-convo store.
  const cached = chatToConvo.get(payload.chat_id);
  if (cached) {
    const exists = useConversationsStore.getState().conversations.some((c) => c.id === cached);
    if (exists) {
      void useAuthStore; // keep import live for future per-convo billing scope
      return cached;
    }
    chatToConvo.delete(payload.chat_id);
  }

  const convos = useConversationsStore.getState();
  if (convos.conversations.length < MAX_CONVERSATIONS) {
    const titleSuffix = payload.from_display_name || payload.from_username || `tg:${payload.chat_id}`;
    try {
      const created = await convos.create({ title: `📨 ${titleSuffix}` });
      chatToConvo.set(payload.chat_id, created.id);
      applyDefaultWorkspace(created.id);
      return created.id;
    } catch (err) {
      if (err instanceof MaxConversationsError) {
        return reuseOldestConvo(payload);
      }
      throw err;
    }
  }
  return reuseOldestConvo(payload);
}

function applyDefaultWorkspace(convoId: string): void {
  const def = useSettingsStore.getState().messengerDefaultWorkspace;
  if (!def) return;
  try {
    const slot = getStoresFor(convoId);
    const agent = slot.agent as { getState: () => AgentState };
    const current = agent.getState().workspace;
    if (!current) agent.getState().setWorkspace(def);
  } catch (err) {
    console.warn('[messenger] applyDefaultWorkspace failed', err);
  }
}

function reuseOldestConvo(payload: IncomingMessagePayload): string | null {
  // Pick the least-recently-active convo and rebind it to this Telegram chat.
  const convos = useConversationsStore.getState().conversations;
  if (convos.length === 0) return null;
  const oldest = [...convos].sort((a, b) => a.lastActiveAt - b.lastActiveAt)[0];
  chatToConvo.set(payload.chat_id, oldest.id);
  return oldest.id;
}

/**
 * Send one or more text messages back to a Telegram chat.
 *
 * Two render modes:
 *   - `plain` (default): forward the string verbatim. No formatting. Used
 *     for short system prompts authored by the bot itself.
 *   - `html`: pipe the input through `mdToTelegramHtml` which converts the
 *     agent's markdown into Telegram's HTML subset (bold headings,
 *     `<code>`, `<pre>`, `<a>`, `<i>`, lists). Long replies are split on
 *     paragraph boundaries so each chunk has balanced markup.
 *
 * `replyToMessageId` is only applied to the FIRST chunk so a multi-part
 * reply doesn't repeatedly quote the user message.
 */
async function sendReply(
  chatId: number,
  text: string,
  replyToMessageId?: number,
  mode: 'plain' | 'html' = 'html',
): Promise<void> {
  const chunks = mode === 'html' ? mdToTelegramHtml(text) : [text];
  const parseMode = mode === 'html' ? 'HTML' : null;
  for (let i = 0; i < chunks.length; i++) {
    try {
      await invoke('messenger_telegram_send_reply', {
        chatId,
        text: chunks[i],
        replyToMessageId: i === 0 ? (replyToMessageId ?? null) : null,
        parseMode,
      });
    } catch (err) {
      console.warn('[messenger] sendReply failed', err);
      // If HTML render rejected (parser error from Telegram), retry as
      // plain text so the user at least sees the content unformatted.
      if (mode === 'html' && i === 0) {
        try {
          await invoke('messenger_telegram_send_reply', {
            chatId,
            text,
            replyToMessageId: replyToMessageId ?? null,
            parseMode: null,
          });
        } catch (err2) {
          console.warn('[messenger] sendReply plain fallback failed', err2);
        }
        return;
      }
    }
  }
}

/**
 * Public helper used by the Settings UI right after the user approves a
 * pending chat — fires a confirmation message so the user knows the link
 * landed without having to message the bot first.
 */
export async function sendApprovalConfirmation(chatId: number): Promise<void> {
  await sendReply(
    chatId,
    '✅ Chat approved. Every message here now runs through your Skillset Skill Chat agent. ' + APP_OFFLINE_HINT,
  );
}
