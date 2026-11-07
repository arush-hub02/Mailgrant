ALTER TABLE oauth_states ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE oauth_states ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
CREATE TABLE gmail_connections (workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE, content TEXT NOT NULL, connected_at INTEGER NOT NULL, last_sync_at INTEGER NOT NULL, query_after INTEGER NOT NULL, page_token TEXT, needs_reconnect INTEGER NOT NULL DEFAULT 0);
