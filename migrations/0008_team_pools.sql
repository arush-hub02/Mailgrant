CREATE TABLE IF NOT EXISTS team_pools (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'blue',
  access_key_id TEXT REFERENCES access_keys(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS team_pools_workspace ON team_pools(workspace_id);

CREATE TABLE IF NOT EXISTS team_pool_rules (
  pool_id TEXT NOT NULL REFERENCES team_pools(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
  PRIMARY KEY(pool_id, rule_id)
);

CREATE TABLE IF NOT EXISTS team_pool_members (
  pool_id TEXT NOT NULL REFERENCES team_pools(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY(pool_id, user_id)
);
