-- Track when each background job last ran.
-- Dashboard reads MAX(ran_at) per source to show "updated N ago" labels.
-- Run AFTER schema.sql, idempotent.

CREATE TABLE IF NOT EXISTS system_runs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  ran_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_runs_source_date
  ON system_runs(source, ran_at DESC);
