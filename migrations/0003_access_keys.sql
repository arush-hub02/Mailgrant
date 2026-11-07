CREATE TABLE access_keys (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  expires_at INTEGER,
  max_views INTEGER CHECK(max_views IS NULL OR max_views > 0),
  views INTEGER NOT NULL DEFAULT 0,
  revoked_at INTEGER,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX access_keys_workspace ON access_keys(workspace_id,created_at);
CREATE TABLE access_key_scopes (
  key_id TEXT NOT NULL REFERENCES access_keys(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK(mode IN ('codes','links','read')),
  PRIMARY KEY(key_id,rule_id)
);
CREATE TABLE shared_sessions (
  token_hash TEXT PRIMARY KEY,
  key_id TEXT NOT NULL REFERENCES access_keys(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX shared_sessions_key ON shared_sessions(key_id);
CREATE INDEX shared_sessions_expiry ON shared_sessions(expires_at);
