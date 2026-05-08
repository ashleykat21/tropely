-- =============================================================================
-- Tropely — PostgreSQL Schema
-- Generated from Drizzle ORM schema definitions
-- Run this in your Supabase SQL editor (Database → SQL Editor → New query)
-- or against any PostgreSQL 14+ instance.
-- =============================================================================

-- Enable UUID generation (already active in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- profiles
-- One row per Clerk user. Stores display info and mood signature.
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL UNIQUE,
  display_name    TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  mood_signature  TEXT,
  auth            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- activity
-- Public reading activity feed entries (added book, finished book, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  kind         TEXT        NOT NULL,
  book_title   TEXT        NOT NULL,
  book_author  TEXT,
  book_cover   TEXT,
  mood         TEXT,
  emoji        TEXT,
  note         TEXT,
  visibility   TEXT        NOT NULL DEFAULT 'public',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- follows
-- Social follow graph between Clerk user IDs.
-- =============================================================================
CREATE TABLE IF NOT EXISTS follows (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  TEXT        NOT NULL,
  following_id TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- notifications
-- In-app notification bell items.
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  kind        TEXT        NOT NULL,
  body        TEXT,
  actor_id    TEXT,
  ref_id      TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_kind_ref_uniq
  ON notifications (user_id, kind, ref_id)
  WHERE ref_id IS NOT NULL;

-- =============================================================================
-- buddy_reads
-- A shared reading room (one book, multiple participants).
-- =============================================================================
CREATE TABLE IF NOT EXISTS buddy_reads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT        NOT NULL,
  book_title    TEXT        NOT NULL,
  book_author   TEXT,
  book_cover    TEXT,
  total_pages   INTEGER     NOT NULL DEFAULT 0,
  spoiler_page  INTEGER     NOT NULL DEFAULT 0,
  chapters      JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- buddy_members
-- Members of a buddy read room and their current page position.
-- =============================================================================
CREATE TABLE IF NOT EXISTS buddy_members (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_read_id   UUID        NOT NULL REFERENCES buddy_reads(id) ON DELETE CASCADE,
  user_id         TEXT        NOT NULL,
  current_page    INTEGER     NOT NULL DEFAULT 0,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- buddy_messages
-- Chat messages within a buddy read room.
-- =============================================================================
CREATE TABLE IF NOT EXISTS buddy_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_read_id   UUID        NOT NULL REFERENCES buddy_reads(id) ON DELETE CASCADE,
  user_id         TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  page_at         INTEGER     NOT NULL DEFAULT 0,
  chapter         INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- companion_messages
-- AI companion chat history (one thread per user+book).
-- =============================================================================
CREATE TABLE IF NOT EXISTS companion_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  book_key    TEXT        NOT NULL,
  role        TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- companion_summaries
-- Rolling AI-generated memory summaries for the companion per user+book.
-- =============================================================================
CREATE TABLE IF NOT EXISTS companion_summaries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  book_key        TEXT        NOT NULL,
  summary         TEXT        NOT NULL DEFAULT '',
  manual_summary  TEXT,
  pinned_facts    TEXT[],
  upto_page       INTEGER,
  message_count   INTEGER     NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS companion_summaries_user_book_unique
  ON companion_summaries (user_id, book_key);

-- =============================================================================
-- reading_positions
-- Cross-device page-sync for each user+book.
-- =============================================================================
CREATE TABLE IF NOT EXISTS reading_positions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  book_key     TEXT        NOT NULL,
  book_title   TEXT        NOT NULL,
  page         INTEGER     NOT NULL DEFAULT 0,
  total_pages  INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- taste_profiles
-- Per-user mood / genre preference profile for recommendations.
-- =============================================================================
CREATE TABLE IF NOT EXISTS taste_profiles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL UNIQUE,
  favorite_moods   TEXT[]      NOT NULL DEFAULT '{}',
  avoid_moods      TEXT[]      NOT NULL DEFAULT '{}',
  top_genres       TEXT[]      NOT NULL DEFAULT '{}',
  top_emojis       TEXT[]      NOT NULL DEFAULT '{}',
  finished_titles  TEXT[]      NOT NULL DEFAULT '{}',
  favorite_books   JSONB       NOT NULL DEFAULT '[]',
  age_band         TEXT,
  pace             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- push_subscriptions
-- Web-push (VAPID) subscriptions for notification delivery.
-- =============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL,
  endpoint         TEXT        NOT NULL,
  p256dh           TEXT        NOT NULL,
  auth             TEXT        NOT NULL,
  enabled          BOOLEAN     NOT NULL DEFAULT TRUE,
  reminder_hour    INTEGER,
  reminder_label   TEXT,
  timezone_offset  INTEGER,
  last_sent_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx
  ON push_subscriptions (endpoint);

-- =============================================================================
-- library_snapshots
-- Latest library export per user (for data restore / multi-device sync).
-- =============================================================================
CREATE TABLE IF NOT EXISTS library_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL UNIQUE,
  data          JSONB       NOT NULL DEFAULT '{}',
  revision      INTEGER     NOT NULL DEFAULT 0,
  device_label  TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- library_snapshot_history
-- Historical snapshots retained for rollback.
-- =============================================================================
CREATE TABLE IF NOT EXISTS library_snapshot_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  data          JSONB       NOT NULL,
  device_label  TEXT,
  revision      INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS library_snapshot_history_user_idx
  ON library_snapshot_history (user_id);

-- =============================================================================
-- synced_devices
-- Tracks devices that have synced for a given user.
-- =============================================================================
CREATE TABLE IF NOT EXISTS synced_devices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  device_id     TEXT        NOT NULL,
  label         TEXT,
  user_agent    TEXT,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS synced_devices_user_device_idx
  ON synced_devices (user_id, device_id);

-- =============================================================================
-- blocked_users
-- User block list.
-- =============================================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  TEXT        NOT NULL,
  blocked_id  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- feedback
-- In-app feedback submissions.
-- =============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,
  message     TEXT        NOT NULL,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- conversations
-- AI conversation threads (generic, used by Feltly web companion).
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id          SERIAL      PRIMARY KEY,
  title       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- messages
-- Messages within a conversation thread.
-- =============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id               SERIAL      PRIMARY KEY,
  conversation_id  INTEGER     NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT        NOT NULL,
  content          TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
