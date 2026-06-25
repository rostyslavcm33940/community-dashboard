-- MEE6 leaderboard snapshots.

CREATE TABLE mee6_leaderboard (
  project_id INT REFERENCES projects(id) DEFAULT 1,
  username TEXT NOT NULL,
  rank INT,
  messages INT,
  xp INT,
  level INT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, username)
);

CREATE INDEX idx_mee6_xp ON mee6_leaderboard(project_id, xp DESC);
