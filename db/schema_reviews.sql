-- Steam Reviews tables. Run AFTER schema.sql.

CREATE TABLE steam_reviews (
  id BIGSERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) DEFAULT 1,
  recommendation_id TEXT UNIQUE NOT NULL,
  author_steamid TEXT,
  author_name TEXT,
  language TEXT,
  content TEXT,
  voted_up BOOLEAN,
  weighted_vote_score NUMERIC,
  votes_up INT DEFAULT 0,
  votes_funny INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  timestamp_created TIMESTAMPTZ,
  timestamp_updated TIMESTAMPTZ,
  mentions_bug BOOLEAN DEFAULT FALSE,
  review_url TEXT
);

CREATE INDEX idx_steam_reviews_proj_voted_date
  ON steam_reviews(project_id, voted_up, timestamp_created DESC);

CREATE INDEX idx_steam_reviews_bug
  ON steam_reviews(project_id, mentions_bug, timestamp_created DESC)
  WHERE mentions_bug = TRUE;

CREATE TABLE steam_review_summary (
  project_id INT REFERENCES projects(id) PRIMARY KEY DEFAULT 1,
  app_id TEXT,
  total_reviews INT,
  total_positive INT,
  total_negative INT,
  review_score INT,
  review_score_desc TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
