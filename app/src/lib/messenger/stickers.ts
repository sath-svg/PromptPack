/**
 * Skilly-themed Telegram sticker dispatcher.
 *
 * Three send paths:
 *   1. `maybeSendSticker(chatId)`        — random pick, rate-limited.
 *      Fired from `handleIncoming` on every authorized inbound message.
 *      22 h cooldown + 0.7 probability roll → ~once per chat per day.
 *   2. `sendSpecificSticker(chatId, id)` — forced send of a known sticker,
 *      independent cooldown per sticker id (default 6 h). Used by
 *      event-driven triggers (error → sad, session-create-while-passed-out
 *      → passed_out).
 *   3. Both swallow failures and only stamp the cooldown on success so
 *      transient outages retry on the next message.
 *
 * The 10 sticker WebMs are pre-built by
 * `app/scripts/build-skilly-stickers.mjs` and served from R2.
 */

import { invoke } from '@tauri-apps/api/core';

/** Public R2 base URL hosting the sticker WebMs. */
const PUBLIC_BASE = 'https://image.skillset.so';

/** Canonical sticker IDs — must match `STICKERS[].id` in the build
 *  script so URLs line up with generated WebM filenames. */
export const STICKER_IDS = [
  'default_smile',
  'default_sad',
  'writing',
  'painting',
  'reading',
  'thinking',
  'marketplace',
  'sleeping',
  'passed_out',
  'o_mouth',
] as const;

export type StickerId = typeof STICKER_IDS[number];

function urlFor(id: StickerId): string {
  return `${PUBLIC_BASE}/img/stickers/skilly_${id}.webm`;
}

export const STICKER_URLS: readonly string[] = STICKER_IDS.map(urlFor);

// ---------- Random / opportunistic path ----------

/** Slightly under 24 h so a daily user catches Skilly most days. */
const RANDOM_COOLDOWN_MS = 22 * 60 * 60 * 1000;
/** Probability roll AFTER the cooldown elapses. ~0.7 → avg gap ≈ 31 h. */
const RANDOM_PROBABILITY = 0.7;
const lastRandomAt = new Map<number, number>();

/**
 * Fire a random sticker if cooldown + probability roll pass. Never
 * throws. Fire-and-forget.
 */
export async function maybeSendSticker(chatId: number): Promise<void> {
  const now = Date.now();
  const last = lastRandomAt.get(chatId) ?? 0;
  if (now - last < RANDOM_COOLDOWN_MS) return;
  if (Math.random() > RANDOM_PROBABILITY) return;

  const id = STICKER_IDS[Math.floor(Math.random() * STICKER_IDS.length)];
  const ok = await sendByUrl(chatId, urlFor(id));
  if (ok) lastRandomAt.set(chatId, now);
}

// ---------- Forced / event-driven path ----------

/** Per-sticker-id per-chat cooldown. Forced stickers (sad on error,
 *  passed_out on session create) share this bucket. 6 h default keeps
 *  the same event from spamming if it fires repeatedly. */
const FORCED_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const lastForcedAt = new Map<string, number>(); // key = `${chatId}:${id}`

/**
 * Fire a specific sticker by id. Independent of the random-path
 * cooldown so an event trigger can still surface even if the random
 * roll fired recently.
 *
 * `cooldownMs` defaults to 6 h to avoid spamming the same sticker if
 * the trigger event fires back-to-back (e.g. error after error). Pass
 * `0` to fire every time.
 */
export async function sendSpecificSticker(
  chatId: number,
  id: StickerId,
  cooldownMs: number = FORCED_COOLDOWN_MS,
): Promise<void> {
  const key = `${chatId}:${id}`;
  const now = Date.now();
  const last = lastForcedAt.get(key) ?? 0;
  if (cooldownMs > 0 && now - last < cooldownMs) return;
  const ok = await sendByUrl(chatId, urlFor(id));
  if (ok) lastForcedAt.set(key, now);
}

// ---------- Internal ----------

async function sendByUrl(chatId: number, url: string): Promise<boolean> {
  try {
    await invoke('messenger_telegram_send_sticker', {
      chatId,
      stickerUrl: url,
      replyToMessageId: null,
    });
    return true;
  } catch (err) {
    console.warn('[messenger] sticker send failed', err);
    return false;
  }
}
