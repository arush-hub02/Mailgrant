ALTER TABLE mailboxes ADD COLUMN provider TEXT NOT NULL DEFAULT 'google';
ALTER TABLE gmail_connections ADD COLUMN provider TEXT NOT NULL DEFAULT 'google';

