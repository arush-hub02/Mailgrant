import {now,id,hash,encrypt,extractContent,matchesSender} from './security.mjs';

export async function storeApprovedMail(env,mailbox,mail,{receivedAt=now(),dedupeId=null,rules=null}={}) {
  const recipients=[...(mail.to||[]),...(mail.cc||[])].flatMap(a=>a.group||[a]).map(a=>a.address?.toLowerCase());
  if(!recipients.includes(mailbox.email))return 0;
  const sender=mail.from?.address?.toLowerCase();
  rules??=(await env.DB.prepare('SELECT * FROM rules WHERE workspace_id=? AND enabled=1').bind(mailbox.workspace_id).all()).results;
  const matched=rules.filter(r=>r.workspace_id===mailbox.workspace_id && r.enabled && matchesSender(r.sender,sender) && r.created_at<=receivedAt && (!r.subject_contains||(mail.subject||'').toLowerCase().includes(r.subject_contains.toLowerCase())) && receivedAt+r.retention_minutes*60000>now());
  if(!matched.length)return 0;
  const dedupe=await hash(dedupeId||mail.messageId||JSON.stringify([sender,mail.subject,mail.text,mail.date]));
  const writes=[];
  for(const rule of matched)writes.push(env.DB.prepare('INSERT OR IGNORE INTO messages(id,workspace_id,rule_id,content,received_at,expires_at,dedupe) VALUES(?,?,?,?,?,?,?)').bind(id(),mailbox.workspace_id,rule.id,await encrypt(extractContent(mail,rule),env.CONTENT_KEY,`${mailbox.workspace_id}:${rule.id}`),receivedAt,receivedAt+rule.retention_minutes*60000,dedupe));
  writes.push(env.DB.prepare('UPDATE mailboxes SET verified_at=COALESCE(verified_at,?) WHERE id=?').bind(now(),mailbox.id));
  await env.DB.batch(writes);return matched.length;
}
