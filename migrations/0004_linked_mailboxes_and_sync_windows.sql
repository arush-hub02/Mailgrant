ALTER TABLE mailboxes ADD COLUMN google_sub TEXT;
UPDATE mailboxes SET google_sub=(SELECT u.google_sub FROM workspaces w JOIN users u ON u.id=w.owner_id WHERE w.id=mailboxes.workspace_id) WHERE workspace_id IN (SELECT workspace_id FROM gmail_connections);
ALTER TABLE gmail_connections ADD COLUMN window_end INTEGER;
ALTER TABLE gmail_connections ADD COLUMN query_snapshot TEXT;
