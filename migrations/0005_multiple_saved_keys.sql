CREATE TABLE shared_sessions_v2 (
  token_hash TEXT NOT NULL,
  key_id TEXT NOT NULL REFERENCES access_keys(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(token_hash,key_id)
);
INSERT INTO shared_sessions_v2 SELECT token_hash,key_id,expires_at FROM shared_sessions;
DROP TABLE shared_sessions;
ALTER TABLE shared_sessions_v2 RENAME TO shared_sessions;
CREATE INDEX shared_sessions_key ON shared_sessions(key_id);
CREATE INDEX shared_sessions_expiry ON shared_sessions(expires_at);
