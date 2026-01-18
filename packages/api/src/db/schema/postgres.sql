-- PostgreSQL schema for heartbeats

CREATE TABLE IF NOT EXISTS heartbeats (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  activity_type TEXT NOT NULL,
  project TEXT,
  file TEXT,
  language TEXT,
  branch TEXT,
  machine_id TEXT,
  is_write BOOLEAN DEFAULT FALSE,
  lines INTEGER,
  cursor_line INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_user_timestamp
  ON heartbeats(user_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_heartbeats_user_project
  ON heartbeats(user_id, project);

CREATE INDEX IF NOT EXISTS idx_heartbeats_user_tool
  ON heartbeats(user_id, tool);
