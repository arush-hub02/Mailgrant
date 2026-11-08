import {encrypt, now, validEmail} from './security.mjs';

export async function completeMicrosoftLink(env, {workspaceId, userId, profile, tokens}) {
  const workspace = await env.DB.prepare('SELECT owner_id FROM workspaces WHERE id=?').bind(workspaceId).first();
  if (!workspace || workspace.owner_id !== userId) throw new Error('workspace');

  const mailbox = await env.DB.prepare('SELECT * FROM mailboxes WHERE workspace_id=?').bind(workspaceId).first();
  const email = (profile.mail || profile.userPrincipalName || profile.email || '').toLowerCase();
  if (!mailbox || !validEmail(email)) throw new Error('identity');

  const t = now();
  const content = await encrypt({
    refresh_token: tokens.refresh_token,
    provider: 'microsoft',
    email
  }, env.CONTENT_KEY, `${workspaceId}:gmail`);

  await env.DB.batch([
    env.DB.prepare('INSERT INTO gmail_connections(workspace_id,content,connected_at,last_sync_at,query_after,provider) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET content=excluded.content,connected_at=excluded.connected_at,last_sync_at=0,query_after=excluded.query_after,page_token=NULL,needs_reconnect=0,window_end=NULL,query_snapshot=NULL,provider=excluded.provider').bind(workspaceId, content, t, 0, t, 'microsoft'),
    env.DB.prepare('UPDATE mailboxes SET email=?,provider=?,verified_at=? WHERE workspace_id=?').bind(email, 'microsoft', t, workspaceId)
  ]);

  return { email, provider: 'microsoft' };
}
