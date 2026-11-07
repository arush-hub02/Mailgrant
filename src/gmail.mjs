import PostalMime from 'postal-mime';
import {now,decrypt,hash} from './security.mjs';
import {storeApprovedMail} from './mail.mjs';

export const GMAIL_SCOPE='https://www.googleapis.com/auth/gmail.readonly';
export function gmailQuery(after,senders,before=null){
  const formatSender=s=>{s=s.trim();if(s.startsWith('@'))return `from:${s.slice(1)}`;if(s.includes('*')){const at=s.indexOf('@');if(at>=0&&at<s.length-1)return `from:${s.slice(at+1)}`;}return `from:"${s}"`;};
  return `after:${Math.floor(after/1000)} ${before?`before:${Math.floor(before/1000)} `:''}{${[...new Set(senders)].sort().map(formatSender).join(' ')}} -in:spam -in:trash`;
}
export function gmailAuthenticated(mail){const first=mail.headers?.find(h=>h.key.toLowerCase()==='authentication-results')?.value||'';return /^mx\.google\.com\s*;/i.test(first)&&/(?:^|;)\s*dmarc=pass(?:\s|;|$)/i.test(first);}
export async function syncGmail(env,wid,{fetcher=fetch}={}){
  const connection=await env.DB.prepare('SELECT * FROM gmail_connections WHERE workspace_id=?').bind(wid).first();
  if(!connection)throw new Error('Connect Gmail in Workspace settings first.');
  if(connection.needs_reconnect)throw new Error('Reconnect Gmail in Workspace settings. Google authorization has expired or been revoked.');
  // A database lease prevents concurrent tabs from multiplying mailbox requests.
  const lease=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET expires_at=excluded.expires_at WHERE expires_at<=? RETURNING bucket').bind(`gmail-sync:${wid}`,now()+120000,now()).first();
  if(!lease)return {ok:true};
  const signal=AbortSignal.timeout(25000);
  try {
  const rules=(await env.DB.prepare('SELECT * FROM rules WHERE workspace_id=? AND enabled=1').bind(wid).all()).results;if(!rules.length)return {ok:true};
  const mailbox=await env.DB.prepare('SELECT * FROM mailboxes WHERE workspace_id=?').bind(wid).first();
  const credentials=await decrypt(connection.content,env.CONTENT_KEY,`${wid}:gmail`);
  const tokenResponse=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:credentials.refresh_token,grant_type:'refresh_token'}),signal});
  if(!tokenResponse.ok){if(tokenResponse.status===400)await env.DB.prepare('UPDATE gmail_connections SET needs_reconnect=1 WHERE workspace_id=?').bind(wid).run();throw new Error('Google authorization needs attention. Reconnect Gmail if this continues.');}
  const tokens=await tokenResponse.json();if(!tokens.access_token)throw new Error('Google did not return an access token.');
  const headers={Authorization:`Bearer ${tokens.access_token}`};
  const started=now(),after=Math.max(connection.connected_at,connection.query_after);
  const windowEnd=connection.window_end||Math.floor(started/1000)*1000;
  if(windowEnd<=after)return {ok:true};
  const q=gmailQuery(after,rules.map(r=>r.sender),windowEnd);
  const pageToken=connection.query_snapshot===q?connection.page_token:null;
  const url=new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');url.search=new URLSearchParams({q,maxResults:'10',includeSpamTrash:'false',...(pageToken?{pageToken}:{})}).toString();
  const listResponse=await fetcher(url.toString(),{headers,signal});
  if(!listResponse.ok){if(pageToken&&listResponse.status===400)await env.DB.prepare('UPDATE gmail_connections SET page_token=NULL,query_snapshot=NULL WHERE workspace_id=? AND content=?').bind(wid,connection.content).run();throw new Error('Could not refresh Gmail. Check that the Gmail API is enabled and authorization is active.');}
  const list=await listResponse.json();
  for(const item of (list.messages||[]).slice(0,10)){
    if(!/^[a-z0-9]+$/i.test(item.id))continue;
    if(await env.DB.prepare('SELECT id FROM messages WHERE workspace_id=? AND dedupe=? LIMIT 1').bind(wid,await hash(`gmail:${item.id}`)).first())continue;
    const base=`https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}`;
    // Metadata bounds the raw download; no attachment API is called.
    const metaResponse=await fetcher(`${base}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,{headers,signal});if(!metaResponse.ok)throw new Error('A Gmail message could not be read. Try refreshing again.');
    const meta=await metaResponse.json(),receivedAt=Number(meta.internalDate);
    if(!Number.isFinite(receivedAt)||receivedAt<connection.connected_at||receivedAt>now()+60000||meta.sizeEstimate>256000||receivedAt+1440*60000<=now())continue;
    const rawResponse=await fetcher(`${base}?format=raw`,{headers,signal});if(!rawResponse.ok)throw new Error('A Gmail message could not be read. Try refreshing again.');
    const raw=await rawResponse.json();if(typeof raw.raw!=='string'||raw.raw.length>350000)continue;
    let bytes;try{bytes=Uint8Array.from(atob(raw.raw.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}catch{continue;}if(bytes.length>256000)continue;
    const mail=await PostalMime.parse(bytes);if(!gmailAuthenticated(mail))continue;
    if(!await env.DB.prepare('SELECT workspace_id FROM gmail_connections WHERE workspace_id=? AND content=? AND connected_at=?').bind(wid,connection.content,connection.connected_at).first())return {ok:true};
    await storeApprovedMail(env,mailbox,mail,{receivedAt,dedupeId:`gmail:${item.id}`,rules});
  }
  const nextPage=typeof list.nextPageToken==='string'?list.nextPageToken:null;
  // Advance to the original window boundary, never the time a later page finished.
  await env.DB.prepare('UPDATE gmail_connections SET last_sync_at=?,page_token=?,query_after=?,window_end=?,query_snapshot=? WHERE workspace_id=? AND content=? AND connected_at=?').bind(started,nextPage,nextPage?after:Math.max(connection.connected_at,windowEnd-1000),nextPage?windowEnd:null,nextPage?q:null,wid,connection.content,connection.connected_at).run();
  return {ok:true};
  } finally {await env.DB.prepare('UPDATE rate_limits SET expires_at=? WHERE bucket=?').bind(now()+30000,`gmail-sync:${wid}`).run();}
}
