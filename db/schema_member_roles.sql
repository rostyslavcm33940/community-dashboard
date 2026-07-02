-- Add role tracking to discord_members for QA track section.
-- Run AFTER schema_bot.sql. Idempotent.

ALTER TABLE discord_members
  ADD COLUMN IF NOT EXISTS role_names TEXT[],
  ADD COLUMN IF NOT EXISTS crow_since TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_discord_members_crow_since
  ON discord_members(project_id, crow_since DESC)
  WHERE crow_since IS NOT NULL;
