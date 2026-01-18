-- DevTime D1 Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  api_key_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS heartbeats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  project TEXT,
  file TEXT,
  language TEXT,
  branch TEXT,
  machine_id TEXT,
  is_write INTEGER DEFAULT 0,
  lines INTEGER,
  cursor_line INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  session_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_user_timestamp ON heartbeats(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_heartbeats_user_project ON heartbeats(user_id, project);
CREATE INDEX IF NOT EXISTS idx_heartbeats_user_tool ON heartbeats(user_id, tool);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  project TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  heartbeat_count INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_time ON sessions(user_id, start_time);
