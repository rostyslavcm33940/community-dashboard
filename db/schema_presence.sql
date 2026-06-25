-- Online presence snapshots. Run in Supabase SQL editor.
-- https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/sql/new

CREATE TABLE discord_presence_snapshots (
  id BIGSERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) DEFAULT 1,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  online_count INT,
  idle_count INT,
  dnd_count INT,
  offline_count INT,
  total_count INT
);

CREATE INDEX idx_presence_taken
  ON discord_presence_snapshots(project_id, taken_at DESC);
