-- PromptPack D1 Schema
-- Run with: wrangler d1 execute promptpack-db --file=./schema.sql

-- Users (synced from Clerk webhooks)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- Clerk user ID
  email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'paid'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Prompts (cloud-saved prompts per user)
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,                    -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source TEXT NOT NULL,                   -- 'chatgpt' | 'claude' | 'gemini'
  url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_prompts_user ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_user_created ON prompts(user_id, created_at DESC);

-- Packs (marketplace packs metadata)
CREATE TABLE IF NOT EXISTS packs (
  id TEXT PRIMARY KEY,                    -- UUID
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0, -- 0 = free
  r2_key TEXT NOT NULL,                   -- R2 object key for .prmtpck file
  version TEXT NOT NULL DEFAULT '1.0',
  is_public INTEGER NOT NULL DEFAULT 0,   -- 0 = draft, 1 = published
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_packs_author ON packs(author_id);
CREATE INDEX IF NOT EXISTS idx_packs_public ON packs(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packs_category ON packs(category, is_public);

-- User purchased packs
CREATE TABLE IF NOT EXISTS user_packs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  purchased_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, pack_id)
);

CREATE INDEX IF NOT EXISTS idx_user_packs_user ON user_packs(user_id);

-- User loaded packs (active packs in extension, limited by tier)
CREATE TABLE IF NOT EXISTS loaded_packs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  loaded_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, pack_id)
);

CREATE INDEX IF NOT EXISTS idx_loaded_packs_user ON loaded_packs(user_id);

-- Entitlements (tier limits)
CREATE TABLE IF NOT EXISTS tier_limits (
  tier TEXT PRIMARY KEY,
  prompt_limit INTEGER NOT NULL,
  loaded_pack_limit INTEGER NOT NULL
);

-- Default tier limits
INSERT OR REPLACE INTO tier_limits (tier, prompt_limit, loaded_pack_limit) VALUES
  ('free', 10, 2),
  ('paid', 40, 5);

-- Rate limiting (simple token bucket per user)
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL DEFAULT 100,
  last_refill INTEGER NOT NULL DEFAULT (unixepoch())
);
