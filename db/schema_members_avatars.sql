-- Add avatar/display-name fields to discord_members.
-- Run AFTER schema_bot.sql, idempotent.
-- https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/sql/new

ALTER TABLE discord_members
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS global_name TEXT,
  ADD COLUMN IF NOT EXISTS nickname TEXT;
