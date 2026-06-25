-- CommunityDashboard schema v1
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/sql/new

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  discord_guild_id TEXT,
  steam_app_id TEXT,
  steam_forum_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO projects (slug, name, discord_guild_id, steam_app_id, steam_forum_url)
VALUES ('last-pirates', 'Last Pirates: Die Together', '1451234798461911090', '4317790', 'https://steamcommunity.com/app/4317790/discussions/');

CREATE TABLE discord_insights_uploads (
  id BIGSERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) DEFAULT 1,
  csv_kind TEXT NOT NULL,
  filename TEXT,
  period_start DATE,
  period_end DATE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

CREATE INDEX idx_insights_kind_date ON discord_insights_uploads(project_id, csv_kind, uploaded_at DESC);
