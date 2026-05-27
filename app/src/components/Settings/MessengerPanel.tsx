/**
 * Settings → Messengers panel.
 *
 * Slice B scope: Telegram desktop gateway only. User pastes their own bot
 * token; the Rust long-poll loop starts when the feature is enabled AND a
 * token is present. First DM from any chat lands in "Pending chats" — the
 * user explicitly approves before that chat can spawn Skill Chat convos.
 *
 * WhatsApp + iMessage controls show as "coming soon" placeholders so the
 * panel reflects the full surface from the plan without exposing unfinished
 * paths.
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, FolderOpen } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { sendApprovalConfirmation } from '../../lib/messenger/client';

interface TokenValidation {
  ok: boolean;
  bot_id: number | null;
  bot_username: string | null;
  bot_name: string | null;
  error: string | null;
}

export function MessengerPanel() {
  const {
    messengersEnabled, setMessengersEnabled,
    telegramBotToken, setTelegramBotToken,
    telegramAuthorizedChats, telegramPendingChats,
    approveTelegramChat, rejectTelegramChat, removeTelegramAuthorizedChat,
    messengerDefaultWorkspace, setMessengerDefaultWorkspace,
    orchestratorEnabled,
  } = useSettingsStore();

  const [draftToken, setDraftToken] = useState(telegramBotToken);
  const [revealToken, setRevealToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => setDraftToken(telegramBotToken), [telegramBotToken]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await invoke<boolean>('messenger_telegram_is_running');
        if (alive) setRunning(r);
      } catch {
        if (alive) setRunning(false);
      }
    };
    void tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [messengersEnabled, telegramBotToken]);

  const handleValidate = async () => {
    const t = draftToken.trim();
    if (!t) {
      setValidation({ ok: false, bot_id: null, bot_username: null, bot_name: null, error: 'empty token' });
      return;
    }
    setValidating(true);
    try {
      const v = await invoke<TokenValidation>('messenger_telegram_test_token', { token: t });
      setValidation(v);
      if (v.ok) {
        setTelegramBotToken(t);
      }
    } catch (err) {
      setValidation({
        ok: false,
        bot_id: null,
        bot_username: null,
        bot_name: null,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setValidating(false);
    }
  };

  const handleApprove = async (chatId: number) => {
    approveTelegramChat(chatId);
    await sendApprovalConfirmation(chatId);
  };

  return (
    <section
      id="settings-messengers"
      className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] scroll-mt-16"
    >
      <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
        Messengers <span className="ml-2 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Beta</span>
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Talk to Skill Chat from your phone. Inbound messages spawn a Skill Chat
        conversation that runs with the full agent (workspace, tools, skillflows)
        while this app is open.
      </p>

      <label className="flex items-start gap-3 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={messengersEnabled}
          onChange={(e) => setMessengersEnabled(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--background)] accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm text-[var(--foreground)]">Enable messenger bridges</span>
          <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">
            Off by default. Long-poll loops only run when this is on.
          </span>
        </span>
      </label>

      {/* Telegram */}
      <div className="border-t border-[var(--border)] pt-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-[var(--foreground)]">Telegram</h4>
          <span
            className={
              'text-xs rounded-full px-2 py-0.5 ' +
              (running
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]')
            }
          >
            {running ? 'Listening' : 'Idle'}
          </span>
        </div>

        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          Create a bot with @BotFather on Telegram, then paste the token below.
          The token never leaves your machine — long-poll runs locally.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={revealToken ? 'text' : 'password'}
              value={draftToken}
              onChange={(e) => setDraftToken(e.target.value)}
              placeholder="123456:ABC-xyz..."
              className="w-full pr-9 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            />
            <button
              type="button"
              onClick={() => setRevealToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label={revealToken ? 'Hide token' : 'Show token'}
            >
              {revealToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || draftToken.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-50"
          >
            {validating ? <Loader2 size={14} className="animate-spin" /> : null}
            {validating ? 'Checking…' : 'Save & verify'}
          </button>
          {telegramBotToken && (
            <button
              type="button"
              onClick={() => {
                setTelegramBotToken('');
                setDraftToken('');
                setValidation(null);
              }}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Clear
            </button>
          )}
        </div>

        {validation && (
          <div
            className={
              'mt-2 flex items-center gap-2 text-xs ' +
              (validation.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')
            }
          >
            {validation.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {validation.ok
              ? `Connected as ${validation.bot_name ?? ''}${validation.bot_username ? ` (@${validation.bot_username})` : ''}`
              : `Token rejected: ${validation.error ?? 'unknown error'}`}
          </div>
        )}

        {/* Pending chats */}
        {telegramPendingChats.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
              Pending chats
            </h5>
            <ul className="space-y-1">
              {telegramPendingChats.map((c) => (
                <li
                  key={c.chatId}
                  className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--foreground)] truncate">
                      {c.displayName || c.username || `chat ${c.chatId}`}
                      {c.username ? <span className="text-xs text-[var(--muted-foreground)] ml-1">@{c.username}</span> : null}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] truncate">"{c.lastMessagePreview}"</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApprove(c.chatId)}
                      className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectTelegramChat(c.chatId)}
                      className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Authorized chats */}
        {telegramAuthorizedChats.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
              Authorized chats
            </h5>
            <ul className="space-y-1">
              {telegramAuthorizedChats.map((c) => (
                <li
                  key={c.chatId}
                  className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--foreground)] truncate">
                      {c.displayName || c.username || `chat ${c.chatId}`}
                      {c.username ? <span className="text-xs text-[var(--muted-foreground)] ml-1">@{c.username}</span> : null}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Linked {new Date(c.approvedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTelegramAuthorizedChat(c.chatId)}
                    className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    Unlink
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Default workspace for remote convos */}
      <div className="border-t border-[var(--border)] pt-4 mt-4">
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">Default workspace</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">
          Folder applied to every new Skill Chat conversation spawned from a
          Telegram message. Without one, remote messages get text-only replies
          (no file read/write/edit/bash).
          {!orchestratorEnabled && (
            <span className="block mt-1 text-amber-600 dark:text-amber-400">
              ⚠️ Skill Flow is off in Settings → AI. Tools won't run even with a workspace set.
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={messengerDefaultWorkspace}
            onChange={(e) => setMessengerDefaultWorkspace(e.target.value)}
            placeholder="No workspace — remote convos run text-only"
            className="flex-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
          />
          <button
            type="button"
            onClick={async () => {
              const picked = await openDialog({ directory: true, multiple: false });
              if (typeof picked === 'string') setMessengerDefaultWorkspace(picked);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            <FolderOpen size={14} />
            Pick
          </button>
          {messengerDefaultWorkspace && (
            <button
              type="button"
              onClick={() => setMessengerDefaultWorkspace('')}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

    </section>
  );
}

