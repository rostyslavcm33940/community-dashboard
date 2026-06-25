-- Steam Discussions tables. Run AFTER schema.sql.
-- https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/sql/new

CREATE TABLE steam_threads (
  id BIGSERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) DEFAULT 1,
  thread_url TEXT UNIQUE NOT NULL,
  title TEXT,
  author TEXT,
  sub_forum TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  reply_count INT DEFAULT 0,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX idx_steam_threads_proj_date
  ON steam_threads(project_id, created_at DESC);

CREATE TABLE steam_comments (
  id BIGSERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) DEFAULT 1,
  thread_id BIGINT REFERENCES steam_threads(id) ON DELETE CASCADE,
  comment_url TEXT UNIQUE NOT NULL,
  author TEXT,
  is_dev_reply BOOLEAN DEFAULT FALSE,
  content TEXT,
  created_at TIMESTAMPTZ
);

CREATE INDEX idx_steam_comments_thread_date
  ON steam_comments(thread_id, created_at DESC);
