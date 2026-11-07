import {encrypt,now,validEmail} from './security.mjs';
import {GMAIL_SCOPE} from './gmail.mjs';

export async function completeGoogleLink(env,{workspaceId,userId,claims,tokens}){
  const workspace=await env.DB.prepare('SELECT owner_id FROM workspaces WHERE id=?').bind(workspaceId).first();
  if(!workspace||workspace.owner_id!==userId)throw new Error('workspace');
  const mailbox=await env.DB.prepare('SELECT * FROM mailboxes WHERE workspace_id=?').bind(workspaceId).first();
  if(!mailbox||!claims.sub||claims.email_verified!==true||!validEmail(claims.email))throw new Error('identity');
  if(!tokens.scope?.split(/\s+/).includes(GMAIL_SCOPE)||!tokens.refresh_token)throw new Error('consent');
  // Once connected, the mailbox identity remains pinned even after disconnect.
  if(mailbox.google_sub&&mailbox.google_sub!==claims.sub)throw new Error('account');
  if(!mailbox.google_sub&&mailbox.verified_at&&mailbox.email!==claims.email.toLowerCase())throw new Error('account');
  const t=now(),content=await encrypt({refresh_token:tokens.refresh_token},env.CONTENT_KEY,`${workspaceId}:gmail`);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO gmail_connections(workspace_id,content,connected_at,last_sync_at,query_after) VALUES(?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET content=excluded.content,connected_at=excluded.connected_at,last_sync_at=0,query_after=excluded.query_after,page_token=NULL,needs_reconnect=0,window_end=NULL,query_snapshot=NULL').bind(workspaceId,content,t,0,t),
    env.DB.prepare('UPDATE mailboxes SET email=?,google_sub=?,verified_at=? WHERE workspace_id=?').bind(claims.email.toLowerCase(),claims.sub,t,workspaceId)
  ]);
  return {email:claims.email.toLowerCase()};
}
