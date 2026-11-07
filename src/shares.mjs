import {id,now,randomToken,hash,cleanText,availableModes,decrypt,projectContent} from './security.mjs';
import {syncGmail} from './gmail.mjs';

const YEAR=365*86400000;
const query=(env,sql,...values)=>env.DB.prepare(sql).bind(...values);
const row=(env,sql,...values)=>query(env,sql,...values).first();
const rows=async(env,sql,...values)=>(await query(env,sql,...values).all()).results;
function reject(status,message){const error=new Error(message);error.status=status;throw error;}
function response(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
function cookie(req,token,seconds=365*86400){return `mg_shared=${token}; Path=/api/shared; HttpOnly; SameSite=Strict; Max-Age=${seconds}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
function sessionToken(req){return (req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('mg_shared='))?.slice(10);}
const live="k.revoked_at IS NULL AND (k.expires_at IS NULL OR k.expires_at>?) AND (k.max_views IS NULL OR k.views<k.max_views)";
function event(env,wid,actor,action,target){return query(env,'INSERT INTO events(id,workspace_id,actor_id,action,target,created_at) VALUES(?,?,?,?,?,?)',id(),wid,actor,action,cleanText(target,120),now());}

export async function listAccessKeys(env,wid){
  const purgeCutoff = now() - 5 * 86400000;
  await query(env, 'DELETE FROM access_keys WHERE workspace_id=? AND expires_at IS NOT NULL AND expires_at < ?', wid, purgeCutoff).run().catch(() => {});
  const keys=await rows(env,'SELECT id,name,prefix,expires_at,max_views,views,revoked_at,last_used_at,created_at FROM access_keys WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100',wid);
  let scopes=[];
  try {
    scopes=await rows(env,'SELECT s.key_id,s.rule_id,s.mode,s.subdomain,r.name,r.sender FROM access_key_scopes s JOIN access_keys k ON k.id=s.key_id JOIN rules r ON r.id=s.rule_id AND r.workspace_id=k.workspace_id WHERE k.workspace_id=?',wid);
  } catch {
    scopes=await rows(env,'SELECT s.key_id,s.rule_id,s.mode,r.name,r.sender FROM access_key_scopes s JOIN access_keys k ON k.id=s.key_id JOIN rules r ON r.id=s.rule_id AND r.workspace_id=k.workspace_id WHERE k.workspace_id=?',wid);
    scopes=scopes.map(s=>({...s,subdomain:'*'}));
  }
  return keys.map(k=>({...k,scopes:scopes.filter(s=>s.key_id===k.id)}));
}
export async function createAccessKey(env,wid,owner,data){
  const name=cleanText(data.name,60),expiry=data.expires_at==null?null:Number(data.expires_at),max=data.max_views==null?null:Number(data.max_views);
  if(name.length<2||expiry!==null&&(!Number.isSafeInteger(expiry)||expiry<=now())||max!==null&&(!Number.isSafeInteger(max)||max<1||max>1000000000))reject(400,'Enter a key name, a future expiry or no expiry, and a positive message-open limit or no limit.');
  if(!Array.isArray(data.scopes)||data.scopes.length<1||data.scopes.length>30)reject(400,'Choose at least one company permission.');
  const seen=new Set();
  for(const scope of data.scopes){if(!scope||typeof scope.rule_id!=='string'||seen.has(scope.rule_id)||scope.mode==='blocked')reject(400,'Invalid or duplicate company permission.');seen.add(scope.rule_id);const rule=await row(env,'SELECT mode FROM rules WHERE id=? AND workspace_id=?',scope.rule_id,wid);if(!rule||!availableModes(rule.mode).includes(scope.mode))reject(400,'A key cannot grant more access than its company rule retains.');}
  const count=await row(env,'SELECT count(*) n FROM access_keys WHERE workspace_id=?',wid);if(count.n>=100)reject(409,'This workspace has reached its 100-key limit.');
  const key=`mgk_${randomToken()}`,kid=id(),created=now();
  await env.DB.batch([query(env,'INSERT INTO access_keys(id,workspace_id,name,token_hash,prefix,expires_at,max_views,created_at) VALUES(?,?,?,?,?,?,?,?)',kid,wid,name,await hash(key),key.slice(0,12),expiry,max,created),...data.scopes.map(s=>query(env,'INSERT INTO access_key_scopes(key_id,rule_id,mode,subdomain) VALUES(?,?,?,?)',kid,s.rule_id,s.mode,cleanText(s.subdomain,40)||'*')),event(env,wid,owner.id,'access_key.created',name)]);
  return {id:kid,key,url:`${env.APP_ORIGIN}/access${data.accent ? '?accent=' + encodeURIComponent(data.accent) : ''}`,expires_at:expiry,max_views:max};
}
export async function revokeAccessKey(env,wid,owner,kid){
  const key=await row(env,'SELECT id,name FROM access_keys WHERE id=? AND workspace_id=?',kid,wid);if(!key)reject(404,'Access key not found.');
  await env.DB.batch([query(env,'UPDATE access_keys SET revoked_at=COALESCE(revoked_at,?) WHERE id=? AND workspace_id=?',now(),kid,wid),query(env,'DELETE FROM shared_sessions WHERE key_id=?',kid),event(env,wid,owner.id,'access_key.revoked',key.name)]);return {ok:true};
}
async function principal(req,env){
  const token=sessionToken(req);if(!token)reject(401,'Enter an access key to open your shared inbox.');
  const keys=await rows(env,`SELECT k.*,w.name workspace_name,s.expires_at session_expires FROM shared_sessions s JOIN access_keys k ON k.id=s.key_id JOIN workspaces w ON w.id=k.workspace_id WHERE s.token_hash=? AND s.expires_at>? AND ${live} ORDER BY k.created_at,k.id`,await hash(token),now(),now());
  if(!keys.length)reject(401,'Your saved keys are revoked, expired, or have reached their message-open limits.');
  const selected=new URL(req.url).searchParams.get('key_id'),key=selected?keys.find(k=>k.id===selected):keys[0];
  if(!key)reject(403,'This key is not available in your saved access.');
  if(keys.some(k=>k.session_expires<now()+30*86400000))await query(env,'UPDATE shared_sessions SET expires_at=? WHERE token_hash=?',now()+YEAR,await hash(token)).run();
  return {key,keys,selected,token};
}
export async function sharedApi(req,env,path,{body,limited}){
  if(path==='/api/shared/redeem'&&req.method==='POST'){
    await limited(env,`redeem:${req.headers.get('cf-connecting-ip')||'local'}`,20,600000);
    const data=await body(req);if(typeof data.key!=='string'||!/^mgk_[A-Za-z0-9_-]{43}$/.test(data.key))reject(401,'The access key is not valid.');
    const key=await row(env,`SELECT k.* FROM access_keys k WHERE k.token_hash=? AND ${live}`,await hash(data.key),now());if(!key)reject(401,'This access key is invalid, revoked, expired, or has reached its message-open limit.');
    const previous=sessionToken(req),existing=previous?await row(env,'SELECT key_id FROM shared_sessions WHERE token_hash=? AND expires_at>? LIMIT 1',await hash(previous),now()):null;
    const token=existing?previous:randomToken();await env.DB.batch([query(env,'INSERT INTO shared_sessions(token_hash,key_id,expires_at) VALUES(?,?,?) ON CONFLICT(token_hash,key_id) DO UPDATE SET expires_at=excluded.expires_at',await hash(token),key.id,now()+YEAR),event(env,key.workspace_id,null,'access_key.redeemed',key.name)]);
    const result=response({ok:true});result.headers.set('Set-Cookie',cookie(req,token));return result;
  }
  if(path==='/api/shared/logout'&&req.method==='POST'){
    const token=sessionToken(req);if(token)await query(env,'DELETE FROM shared_sessions WHERE token_hash=?',await hash(token)).run();const result=response({ok:true});result.headers.set('Set-Cookie',cookie(req,'',0));return result;
  }
  const {key,keys,selected,token}=await principal(req,env);await limited(env,`shared:${key.id}`,120);
  let result;
  if(path==='/api/shared/state'&&req.method==='GET'){
    const selection=selected?' AND k.id=?':'',params=[await hash(token),now(),now(),...(selected?[selected]:[])];
    const rules=await rows(env,`SELECT r.id,r.name,g.mode,k.id key_id,k.name source FROM shared_sessions d JOIN access_keys k ON k.id=d.key_id JOIN access_key_scopes g ON g.key_id=k.id JOIN rules r ON r.id=g.rule_id AND r.workspace_id=k.workspace_id WHERE d.token_hash=? AND d.expires_at>? AND ${live}${selection} AND r.enabled=1 AND (g.mode=r.mode OR r.mode='read')`,...params);
    const messages=await rows(env,`SELECT m.id,m.rule_id,m.received_at,m.expires_at,r.name,g.mode,k.id key_id,k.name source,w.name workspace FROM shared_sessions d JOIN access_keys k ON k.id=d.key_id JOIN workspaces w ON w.id=k.workspace_id JOIN access_key_scopes g ON g.key_id=k.id JOIN rules r ON r.id=g.rule_id AND r.workspace_id=k.workspace_id JOIN messages m ON m.rule_id=r.id AND m.workspace_id=k.workspace_id WHERE d.token_hash=? AND d.expires_at>? AND ${live}${selection} AND r.enabled=1 AND (g.mode=r.mode OR r.mode='read') AND m.received_at>=k.created_at AND m.expires_at>? ORDER BY m.received_at DESC LIMIT 100`,...params,now());
    const combined=!selected&&keys.length>1;
    result=response({workspace:combined?'All saved access':key.workspace_name,name:combined?'Your shared inbox':key.name,expires_at:combined?null:key.expires_at,max_views:combined?null:key.max_views,views:combined?0:key.views,connections:keys.map(k=>({id:k.id,name:k.name,workspace_id:k.workspace_id,workspace:k.workspace_name,expires_at:k.expires_at,max_views:k.max_views,views:k.views})),rules,messages});
  } else if(path==='/api/shared/sync'&&req.method==='POST'){
    // One mailbox per request keeps Gmail subrequests bounded on the free Worker plan.
    const scopes=await rows(env,'SELECT r.id FROM access_key_scopes s JOIN rules r ON r.id=s.rule_id WHERE s.key_id=? AND r.workspace_id=? AND r.enabled=1',key.id,key.workspace_id);if(!scopes.length)reject(403,'No active company permissions.');
    if(await row(env,'SELECT workspace_id FROM gmail_connections WHERE workspace_id=?',key.workspace_id)){try{await syncGmail(env,key.workspace_id);}catch{reject(502,'Gmail could not be refreshed. Ask the owner to check the connection if this continues.');}}
    result=response({ok:true});
  } else if(path==='/api/shared/forget'&&req.method==='POST'){
    const data=await body(req);await query(env,'DELETE FROM shared_sessions WHERE token_hash=? AND key_id=?',await hash(token),typeof data.key_id==='string'?data.key_id:'').run();result=response({ok:true});
  } else if(path.startsWith('/api/shared/messages/')&&req.method==='GET'){
    const message=await row(env,"SELECT m.*,r.name,r.mode storage_mode,s.mode FROM messages m JOIN rules r ON r.id=m.rule_id AND r.workspace_id=m.workspace_id JOIN access_key_scopes s ON s.rule_id=r.id WHERE m.id=? AND m.workspace_id=? AND s.key_id=? AND r.enabled=1 AND (s.mode=r.mode OR r.mode='read') AND m.received_at>=? AND m.expires_at>?",path.slice('/api/shared/messages/'.length),key.workspace_id,key.id,key.created_at,now());
    if(!message)reject(404,'Message unavailable for this access key.');
    const content=projectContent(await decrypt(message.content,env.CONTENT_KEY,`${key.workspace_id}:${message.rule_id}`),message.mode);
    // Consume an open atomically: simultaneous requests cannot exceed a key's allowance.
    const consumed=await row(env,'UPDATE access_keys SET views=views+1,last_used_at=? WHERE id=? AND workspace_id=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?) AND (max_views IS NULL OR views<max_views) RETURNING views',now(),key.id,key.workspace_id,now());
    if(!consumed)reject(401,'This access key is revoked, expired, or has reached its message-open limit.');
    await event(env,key.workspace_id,null,'access_key.message_viewed',`${key.name}: ${message.name}`).run();
    result=response({id:message.id,name:message.name,mode:message.mode,expires_at:message.expires_at,views:consumed.views,...content});
  } else reject(404,'Not found.');
  result.headers.set('Set-Cookie',cookie(req,token));return result;
}
