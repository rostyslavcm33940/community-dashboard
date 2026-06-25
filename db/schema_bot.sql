-- Discord Bot tables. Run AFTER schema.sql.
-- https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/sql/new

CREATE TABLE discord_channels (
  project_id INT REFERENCES projects(id) DEFAULT 1,
  channel_id TEXT NOT NULL,
  name TEXT,
  type TEXT,
  category TEXT,
  is_tracked BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (project_id, channel_id)
);

CREATE TABLE discord_members (
  project_id INT REFERENCES projects(id) DEFAULT 1,
  user_id TEXT NOT NULL,
  username TEXT,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  account_created_at TIMESTAMPTZ,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE discord_messages (
  id BIGSERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) DEFAULT 1,
  message_id TEXT UNIQUE,
  channel_id TEXT,
  channel_name TEXT,
  author_id TEXT,
  author_name TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  reaction_count INT DEFAULT 0
);

CREATE INDEX idx_discord_messages_proj_chan_date
  ON discord_messages(project_id, channel_id, created_at DESC);

CREATE INDEX idx_discord_messages_author
  ON discord_messages(project_id, author_id, created_at DESC);
