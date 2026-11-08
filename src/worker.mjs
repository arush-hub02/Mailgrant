import {createRemoteJWKSet,jwtVerify} from 'jose';
import PostalMime from 'postal-mime';
import {now,id,randomToken,hash,encrypt,decrypt,cleanText,validEmail,validRuleSender,validHost,availableModes,canRead,authenticatedEmail,extractContent,projectContent,detectMailProvider,getProviderDisplayName,isForwardingSetupEmail,extractSetupConfirmation} from './security.mjs';
import {GMAIL_SCOPE,syncGmail} from './gmail.mjs';
import {syncMicrosoft} from './microsoft.mjs';
import {storeApprovedMail} from './mail.mjs';
import {sharedApi,listAccessKeys,createAccessKey,revokeAccessKey} from './shares.mjs';
import {completeGoogleLink} from './google-link.mjs';
import {completeMicrosoftLink} from './microsoft-link.mjs';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const DAY=86400000;
class HttpError extends Error { constructor(status,message) { super(message);this.status=status; } }
const fail=(status,message)=>{throw new HttpError(status,message);};
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const stmt=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const first=(env,sql,...args)=>stmt(env,sql,...args).first();
const all=async(env,sql,...args)=>(await stmt(env,sql,...args).all()).results;
function configured(env) {
  try {const origin=new URL(env.APP_ORIGIN);return !!(env.DB && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && atob(env.CONTENT_KEY).length===32 && origin.origin===env.APP_ORIGIN && (origin.protocol==='https:' || origin.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(origin.hostname)));} catch{return false;}
}
function cookie(name,value,req,maxAge,path='/') { return `${name}=${value}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(req.url).protocol==='https:'?'; Secure':''}`; }
function getCookie(req,name) { return (req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(`${name}=`))?.slice(name.length+1); }
async function body(req) {
  if(!req.headers.get('content-type')?.startsWith('application/json')) fail(415,'Use a JSON request.');
  if(Number(req.headers.get('content-length'))>12000) fail(413,'Request too large.');
  const reader=req.body?.getReader(); let size=0,chunks=[];
  if(!reader) fail(400,'Missing request body.');
  while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>12000){await reader.cancel();fail(413,'Request too large.');} chunks.push(value); }
  try {const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const data=JSON.parse(new TextDecoder().decode(bytes));if(!data||Array.isArray(data)||typeof data!=='object')throw 0;return data;} catch {fail(400,'Invalid JSON.');}
}
async function limited(env,bucket,max,window=60000) {
  const t=now(), slot=Math.floor(t/window),key=`${bucket}:${slot}`;
  const row=await first(env,'INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count',key,(slot+2)*window);
  if(row.count>max) fail(429,'Too many requests. Please try again shortly.');
}
async function user(req,env) {
  const token=getCookie(req,'mg_session'); if(!token) fail(401,'Sign in to continue.');
  const u=await first(env,'SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',await hash(token),now());
  if(!u) fail(401,'Your session has expired. Sign in again.');return u;
}
async function membership(env,wid,u,owner=false) {
  const row=await first(env,'SELECT w.*,m.joined_at,m.user_id FROM workspaces w JOIN members m ON m.workspace_id=w.id WHERE w.id=? AND m.user_id=?',wid,u.id);
  if(!row) fail(404,'Workspace not found.');
  if(owner && row.owner_id!==u.id) fail(403,'Only the workspace owner can do this.');return row;
}
function event(env,wid,u,action,target='') { return stmt(env,'INSERT INTO events(id,workspace_id,actor_id,action,target,created_at) VALUES(?,?,?,?,?,?)',id(),wid,u?.id||null,action,cleanText(target,120),now()); }
async function audit(env,wid,u,action,target) { await event(env,wid,u,action,target).run(); }
function securityHeaders(response) {
  const headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('X-Frame-Options','DENY');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' https://accounts.google.com");
  return new Response(response.body,{status:response.status,headers});
}

async function auth(req,env,path) {
  if(path==='/auth/login') {
    await limited(env,`login:${req.headers.get('cf-connecting-ip')||'local'}`,20,600000);
    const state=randomToken(),verifier=randomToken(),nonce=randomToken();
    await stmt(env,'INSERT INTO oauth_states(state_hash,verifier,nonce,expires_at) VALUES(?,?,?,?)',await hash(state),verifier,nonce,now()+600000).run();
    const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:`${env.APP_ORIGIN}/auth/callback`,response_type:'code',scope:'openid email profile',state,nonce,code_challenge:await hash(verifier),code_challenge_method:'S256',prompt:'select_account'}).toString();
    return new Response(null,{status:302,headers:{Location:url.toString(),'Set-Cookie':cookie('mg_oauth',state,req,600,'/auth'),'Cache-Control':'no-store'}});
  }
  if(path==='/auth/callback') {
    const url=new URL(req.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');
    const retry=(reason,wid)=>new Response(null,{status:302,headers:{Location:wid?`/profile?auth_error=${reason}&workspace=${encodeURIComponent(wid)}`:`/signin?auth_error=${reason}`,'Cache-Control':'no-store','Set-Cookie':cookie('mg_oauth','',req,0,'/auth')}});
    if(!state || state!==getCookie(req,'mg_oauth')) return retry('state');
    const saved=await first(env,'DELETE FROM oauth_states WHERE state_hash=? AND expires_at>? RETURNING verifier,nonce,workspace_id,user_id',await hash(state),now());
    if(!saved) return retry('expired');
    if(url.searchParams.has('error')||!code)return retry('denied',saved.workspace_id);
    let tokenResponse;
    try{tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:`${env.APP_ORIGIN}/auth/callback`,grant_type:'authorization_code',code_verifier:saved.verifier}),signal:AbortSignal.timeout(15000)});}catch{return retry('network',saved.workspace_id);}
    if(!tokenResponse.ok) return retry('exchange',saved.workspace_id);
    let tokens,claims;try{tokens=await tokenResponse.json();}catch{return retry('exchange',saved.workspace_id);}
    try {claims=(await jwtVerify(tokens.id_token,googleKeys,{issuer:['https://accounts.google.com','accounts.google.com'],audience:env.GOOGLE_CLIENT_ID})).payload;} catch {return retry('identity',saved.workspace_id);}
    if(claims.nonce!==saved.nonce || claims.email_verified!==true || !validEmail(claims.email) || !claims.sub) return retry('identity',saved.workspace_id);
    if(saved.workspace_id){
      let current;
      try{current=await user(req,env);}catch{return retry('owner',saved.workspace_id);}
      if(current.id!==saved.user_id)return retry('owner',saved.workspace_id);
      try{await completeGoogleLink(env,{workspaceId:saved.workspace_id,userId:current.id,claims,tokens});}catch(error){return retry(['account','consent','workspace','identity'].includes(error.message)?error.message:'server',saved.workspace_id);}
      await audit(env,saved.workspace_id,current,'gmail.connected',claims.email);
      return new Response(null,{status:302,headers:{Location:`/app.html?workspace=${encodeURIComponent(saved.workspace_id)}&gmail=connected`,'Cache-Control':'no-store','Set-Cookie':cookie('mg_oauth','',req,0,'/auth')}});
    }
    const email=claims.email.toLowerCase();let u=await first(env,'SELECT id FROM users WHERE google_sub=?',claims.sub);
    if(!u) {u={id:id()};await stmt(env,'INSERT INTO users(id,google_sub,email,name,created_at) VALUES(?,?,?,?,?)',u.id,claims.sub,email,cleanText(claims.name)||email,now()).run();}
    else await stmt(env,'UPDATE users SET email=?,name=? WHERE id=?',email,cleanText(claims.name)||email,u.id).run();
    const token=randomToken();await stmt(env,'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',await hash(token),u.id,now()+DAY).run();
    const headers=new Headers({Location:'/dashboard','Cache-Control':'no-store'});headers.append('Set-Cookie',cookie('mg_session',token,req,86400));headers.append('Set-Cookie',cookie('mg_oauth','',req,0,'/auth'));
    return new Response(null,{status:302,headers});
  }
  if(path==='/auth/microsoft/login') {
    if(!env.MICROSOFT_CLIENT_ID) fail(503,'Microsoft sign-in is not configured.');
    await limited(env,`login:${req.headers.get('cf-connecting-ip')||'local'}`,20,600000);
    const state=randomToken(),verifier=randomToken(),nonce=randomToken();
    await stmt(env,'INSERT INTO oauth_states(state_hash,verifier,nonce,expires_at) VALUES(?,?,?,?)',await hash(state),verifier,nonce,now()+600000).run();
    const url=new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    url.search=new URLSearchParams({
      client_id:env.MICROSOFT_CLIENT_ID,
      response_type:'code',
      redirect_uri:`${env.APP_ORIGIN}/auth/microsoft/callback`,
      response_mode:'query',
      scope:'openid profile email User.Read',
      state,
      prompt:'select_account'
    }).toString();
    return new Response(null,{status:302,headers:{Location:url.toString(),'Set-Cookie':cookie('mg_oauth',state,req,600,'/auth'),'Cache-Control':'no-store'}});
  }
  if(path==='/auth/microsoft/callback') {
    const url=new URL(req.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');
    const retry=(reason,wid)=>new Response(null,{status:302,headers:{Location:wid?`/profile?auth_error=${reason}&workspace=${encodeURIComponent(wid)}`:`/signin?auth_error=${reason}`,'Cache-Control':'no-store','Set-Cookie':cookie('mg_oauth','',req,0,'/auth')}});
    if(!state || state!==getCookie(req,'mg_oauth')) return retry('state');
    const saved=await first(env,'DELETE FROM oauth_states WHERE state_hash=? AND expires_at>? RETURNING verifier,nonce,workspace_id,user_id',await hash(state),now());
    if(!saved) return retry('expired');
    if(url.searchParams.has('error')||!code) return retry('denied',saved.workspace_id);
    let tokenResponse;
    try {
      tokenResponse=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({
          client_id:env.MICROSOFT_CLIENT_ID,
          client_secret:env.MICROSOFT_CLIENT_SECRET,
          code,
          redirect_uri:`${env.APP_ORIGIN}/auth/microsoft/callback`,
          grant_type:'authorization_code'
        }),
        signal:AbortSignal.timeout(15000)
      });
    } catch { return retry('network',saved.workspace_id); }
    if(!tokenResponse.ok) return retry('exchange',saved.workspace_id);
    let tokens; try{tokens=await tokenResponse.json();}catch{return retry('exchange',saved.workspace_id);}
    let profileRes,profile;
    try {
      profileRes=await fetch('https://graph.microsoft.com/v1.0/me',{headers:{Authorization:`Bearer ${tokens.access_token}`},signal:AbortSignal.timeout(10000)});
      if(!profileRes.ok) return retry('identity',saved.workspace_id);
      profile=await profileRes.json();
    } catch { return retry('identity',saved.workspace_id); }
    if(saved.workspace_id){
      let current;
      try{current=await user(req,env);}catch{return retry('owner',saved.workspace_id);}
      if(current.id!==saved.user_id)return retry('owner',saved.workspace_id);
      try{await completeMicrosoftLink(env,{workspaceId:saved.workspace_id,userId:current.id,profile,tokens});}catch(error){return retry(['account','workspace','identity'].includes(error.message)?error.message:'server',saved.workspace_id);}
      await audit(env,saved.workspace_id,current,'mailbox.connected',`Microsoft Outlook (${profile.mail||profile.userPrincipalName})`);
      return new Response(null,{status:302,headers:{Location:`/app.html?workspace=${encodeURIComponent(saved.workspace_id)}&mailbox=connected&provider=microsoft`,'Cache-Control':'no-store','Set-Cookie':cookie('mg_oauth','',req,0,'/auth')}});
    }
    const email=(profile.mail||profile.userPrincipalName||'').toLowerCase();
    if(!email||!validEmail(email)) return retry('identity');
    let u=await first(env,'SELECT id,email,name FROM users WHERE email=?',email);
    if(!u) {
      u={id:id()};
      await stmt(env,'INSERT INTO users(id,google_sub,email,name,created_at) VALUES(?,?,?,?,?)',u.id,`ms:${profile.id}`,email,cleanText(profile.displayName)||email,now()).run();
    } else {
      await stmt(env,'UPDATE users SET name=? WHERE id=?',cleanText(profile.displayName)||email,u.id).run();
    }
    const token=randomToken();
    await stmt(env,'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',await hash(token),u.id,now()+DAY).run();
    const headers=new Headers({Location:'/dashboard','Cache-Control':'no-store'});
    headers.append('Set-Cookie',cookie('mg_session',token,req,86400));
    headers.append('Set-Cookie',cookie('mg_oauth','',req,0,'/auth'));
    return new Response(null,{status:302,headers});
  }
  fail(404,'Not found.');
}

async function api(req,env,path) {
  if(path==='/api/config' && req.method==='GET') return json({application:'mailgrant',configured:configured(env),version:'1.0.0'});
  if(!configured(env)) fail(503,'Live mode needs Google sign-in, D1, an encryption key, and the application origin. See the deployment guide.');
  if(!['GET','HEAD'].includes(req.method) && req.headers.get('origin')!==env.APP_ORIGIN) fail(403,'Request origin not allowed.');
  if(path.startsWith('/api/shared/'))return sharedApi(req,env,path,{body,limited});
  if(path.startsWith('/api/avatar/') && req.method==='GET') {
    const targetUid=cleanText(path.slice(12).split('?')[0],40);
    if(env.AVATARS) {
      try {
        const obj=await env.AVATARS.get(`avatars/${targetUid}/avatar`);
        if(obj) {
          const headers=new Headers();
          obj.writeHttpMetadata(headers);
          headers.set('etag',obj.httpEtag);
          headers.set('cache-control','public, max-age=86400');
          return new Response(obj.body,{headers});
        }
      } catch {}
    }
    return new Response('Not found',{status:404});
  }
  if(path==='/api/invitations/info' && req.method==='GET') {
    const token=new URL(req.url).searchParams.get('token');
    if(!token||typeof token!=='string'||token.length>100) fail(400,'Invalid token.');
    const inv=await first(env,'SELECT i.id,i.email,i.workspace_id,w.name workspace_name FROM invitations i JOIN workspaces w ON w.id=i.workspace_id WHERE i.token_hash=? AND i.accepted_at IS NULL AND i.expires_at>?',await hash(token),now());
    if(!inv) fail(404,'This invitation is expired, already used, or invalid.');
    return json({valid:true,email:inv.email,workspace_id:inv.workspace_id,workspace_name:inv.workspace_name});
  }
  if(path==='/api/invitations/claim' && req.method==='POST') {
    const b=await body(req);
    if(typeof b.token!=='string'||b.token.length>100) fail(400,'Invalid invitation token.');
    const inv=await first(env,'SELECT * FROM invitations WHERE token_hash=? AND accepted_at IS NULL AND expires_at>?',await hash(b.token),now());
    if(!inv) fail(403,'This invitation is expired, already used, or invalid.');
    const count=await first(env,'SELECT count(*) n FROM members WHERE workspace_id=?',inv.workspace_id);
    if(count.n>=25) fail(409,'This workspace has reached its 25-member limit.');
    const email=inv.email.toLowerCase();
    let claimUser=await first(env,'SELECT id,email,name FROM users WHERE email=?',email);
    if(!claimUser) {
      claimUser={id:id()};
      const name=cleanText(b.name,60)||email.split('@')[0];
      await stmt(env,'INSERT INTO users(id,google_sub,email,name,created_at) VALUES(?,?,?,?,?)',claimUser.id,`email:${email}`,email,name,now()).run();
    }
    await env.DB.batch([
      stmt(env,'INSERT OR IGNORE INTO members(workspace_id,user_id,joined_at) VALUES(?,?,?)',inv.workspace_id,claimUser.id,now()),
      stmt(env,'UPDATE invitations SET accepted_at=? WHERE id=? AND accepted_at IS NULL',now(),inv.id),
      event(env,inv.workspace_id,claimUser,'invitation.accepted',email)
    ]);
    try {
      const pools=await all(env,'SELECT id FROM team_pools WHERE workspace_id=?',inv.workspace_id);
      for(const p of pools){
        await stmt(env,'INSERT OR IGNORE INTO team_pool_members(pool_id,user_id) VALUES(?,?)',p.id,claimUser.id).run();
      }
    }catch{}
    const sessionToken=randomToken();
    await stmt(env,'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',await hash(sessionToken),claimUser.id,now()+DAY).run();
    const res=json({ok:true,workspace_id:inv.workspace_id,user:{id:claimUser.id,email,name:claimUser.name||email}});
    res.headers.set('Set-Cookie',cookie('mg_session',sessionToken,req,86400));
    return res;
  }
  const u=await user(req,env);await limited(env,`user:${u.id}`,180);
  if(path==='/api/logout' && req.method==='POST') {
    await stmt(env,'DELETE FROM sessions WHERE token_hash=?',await hash(getCookie(req,'mg_session'))).run();
    return new Response('{}',{headers:{'Content-Type':'application/json','Set-Cookie':cookie('mg_session','',req,0),'Cache-Control':'no-store'}});
  }
  if(path==='/api/avatar' && (req.method==='PUT' || req.method==='POST')) {
    if(!env.AVATARS) fail(503,'Cloudflare R2 avatar storage is not configured.');
    const contentType=req.headers.get('content-type')||'image/jpeg';
    if(!contentType.startsWith('image/')) fail(400,'Only image files are accepted.');
    const length=Number(req.headers.get('content-length')||0);
    if(length>2*1024*1024) fail(400,'Image file must be under 2MB.');
    const key=`avatars/${u.id}/avatar`;
    await env.AVATARS.put(key,req.body,{httpMetadata:{contentType}});
    return json({ok:true,avatar:`/api/avatar/${u.id}?v=${now()}`});
  }
  if(path==='/api/avatar' && req.method==='DELETE') {
    if(env.AVATARS) {
      try { await env.AVATARS.delete(`avatars/${u.id}/avatar`); } catch {}
    }
    return json({ok:true});
  }
  if(path==='/api/profile' && req.method==='PATCH') {
    const b=await body(req), name=cleanText(b.name,60);
    if(name.length<2) fail(400,'Enter a name of at least two characters.');
    await stmt(env,'UPDATE users SET name=? WHERE id=?',name,u.id).run();
    return json({ok:true,name});
  }
  if(path==='/api/me' && req.method==='GET') {
    let avatar=null;
    if(env.AVATARS) {
      try {
        const head=await env.AVATARS.head(`avatars/${u.id}/avatar`);
        if(head) avatar=`/api/avatar/${u.id}?v=${head.uploaded.getTime()}`;
      } catch {}
    }
    return json({user:{...u,avatar},workspaces:await all(env,"SELECT w.id,w.name,w.owner_id,m.joined_at,CASE WHEN w.owner_id=? THEN b.email ELSE NULL END mailbox_email,CASE WHEN w.owner_id=m.user_id AND g.workspace_id IS NOT NULL THEN 1 ELSE 0 END gmail_connected,CASE WHEN w.owner_id=m.user_id AND g.workspace_id IS NOT NULL THEN 1 ELSE 0 END mailbox_connected,COALESCE(g.provider, b.provider, 'google') mailbox_provider FROM workspaces w JOIN members m ON m.workspace_id=w.id LEFT JOIN mailboxes b ON b.workspace_id=w.id LEFT JOIN gmail_connections g ON g.workspace_id=w.id WHERE m.user_id=? ORDER BY w.created_at",u.id,u.id)});
  }
  if(path==='/api/workspaces' && req.method==='POST') {
    const b=await body(req),name=cleanText(b.name,60);if(name.length<2) fail(400,'Enter a workspace name of at least two characters.');
    const count=await first(env,'SELECT count(*) n FROM workspaces WHERE owner_id=?',u.id);if(count.n>=5) fail(409,'You can own up to five workspaces.');
    const wid=id(),mid=id(),t=now(),alias=`mg-${randomToken().toLowerCase()}@${validHost(env.INBOUND_DOMAIN||'')?env.INBOUND_DOMAIN:'forwarding-not-configured.invalid'}`;
    await env.DB.batch([stmt(env,'INSERT INTO workspaces(id,name,owner_id,created_at) VALUES(?,?,?,?)',wid,name,u.id,t),stmt(env,'INSERT INTO members(workspace_id,user_id,joined_at) VALUES(?,?,?)',wid,u.id,t),stmt(env,'INSERT INTO mailboxes(id,workspace_id,email,alias,provider) VALUES(?,?,?,?,?)',mid,wid,u.email,alias,'google'),event(env,wid,u,'workspace.created',name)]);
    return json({id:wid},201);
  }
  if(path==='/api/invitations/accept' && req.method==='POST') {
    const b=await body(req);if(typeof b.token!=='string'||b.token.length>100) fail(400,'Invalid invitation.');
    const inv=await first(env,'SELECT * FROM invitations WHERE token_hash=? AND accepted_at IS NULL AND expires_at>?',await hash(b.token),now());
    if(!inv || inv.email!==u.email) fail(403,'This invitation is expired, already used, or belongs to a different email address.');
    const count=await first(env,'SELECT count(*) n FROM members WHERE workspace_id=?',inv.workspace_id);if(count.n>=25) fail(409,'This workspace has reached its 25-member limit.');
    await env.DB.batch([stmt(env,'INSERT OR IGNORE INTO members(workspace_id,user_id,joined_at) SELECT workspace_id,?,? FROM invitations WHERE id=? AND accepted_at IS NULL AND expires_at>?',u.id,now(),inv.id,now()),stmt(env,'UPDATE invitations SET accepted_at=? WHERE id=? AND accepted_at IS NULL',now(),inv.id),event(env,inv.workspace_id,u,'invitation.accepted',u.email)]);
    try {
      const pools=await all(env,'SELECT id FROM team_pools WHERE workspace_id=?',inv.workspace_id);
      for(const p of pools){
        await stmt(env,'INSERT OR IGNORE INTO team_pool_members(pool_id,user_id) VALUES(?,?)',p.id,u.id).run();
      }
    }catch{}
    return json({id:inv.workspace_id});
  }
  const match=path.match(/^\/api\/w\/([^/]+)(?:\/(.*))?$/);if(!match) fail(404,'Not found.');
  const [,wid,route='state']=match,w=await membership(env,wid,u),owner=w.owner_id===u.id;
  if(route==='state' && req.method==='GET') {
    const rules=owner?await all(env,'SELECT * FROM rules WHERE workspace_id=? ORDER BY created_at',wid):await all(env,"SELECT r.id,r.workspace_id,r.name,r.enabled,g.mode FROM rules r JOIN grants g ON g.rule_id=r.id AND g.workspace_id=r.workspace_id WHERE r.workspace_id=? AND g.user_id=? AND g.mode!='blocked' AND (g.expires_at IS NULL OR g.expires_at>?) AND r.enabled=1",wid,u.id,now());
    const messages=owner?await all(env,'SELECT m.id,m.rule_id,m.received_at,m.expires_at,r.name,r.mode FROM messages m JOIN rules r ON r.id=m.rule_id AND r.workspace_id=m.workspace_id WHERE m.workspace_id=? AND m.expires_at>? AND r.enabled=1 ORDER BY m.received_at DESC LIMIT 100',wid,now()):await all(env,"SELECT m.id,m.rule_id,m.received_at,m.expires_at,r.name,g.mode FROM messages m JOIN rules r ON r.id=m.rule_id AND r.workspace_id=m.workspace_id JOIN grants g ON g.rule_id=r.id AND g.workspace_id=m.workspace_id WHERE m.workspace_id=? AND g.user_id=? AND g.mode!='blocked' AND (g.mode=r.mode OR r.mode='read') AND r.enabled=1 AND (g.expires_at IS NULL OR g.expires_at>?) AND m.expires_at>? AND m.received_at>=? AND m.received_at>=g.starts_at ORDER BY m.received_at DESC LIMIT 100",wid,u.id,now(),now(),w.joined_at);
    let team_pools=[];
    try {
      const rawPools=await all(env,'SELECT p.*,k.prefix key_prefix FROM team_pools p LEFT JOIN access_keys k ON k.id=p.access_key_id WHERE p.workspace_id=? ORDER BY p.created_at',wid);
      const rawPR=await all(env,'SELECT pr.pool_id,pr.rule_id,r.name,r.sender,r.mode FROM team_pool_rules pr JOIN rules r ON r.id=pr.rule_id WHERE r.workspace_id=?',wid);
      const rawPM=await all(env,'SELECT pm.pool_id,pm.user_id,u.name,u.email FROM team_pool_members pm JOIN users u ON u.id=pm.user_id WHERE pm.pool_id IN (SELECT id FROM team_pools WHERE workspace_id=?)',wid);
      team_pools=rawPools.map(p=>({
        ...p,
        rules:rawPR.filter(r=>r.pool_id===p.id),
        members:rawPM.filter(m=>m.pool_id===p.id)
      }));
    }catch{}
    for(const m of messages){
      m.pools=team_pools.filter(p=>p.rules.some(r=>r.rule_id===m.rule_id||r.id===m.rule_id)).map(p=>({id:p.id,name:p.name,color:p.color}));
    }
    const mailbox=owner?await first(env,'SELECT id,email,alias,verified_at,setup_expires_at,provider,CASE WHEN google_sub IS NULL THEN 0 ELSE 1 END identity_pinned FROM mailboxes WHERE workspace_id=?',wid):null;
    if(mailbox){
      mailbox.forwarding_available=validHost(env.INBOUND_DOMAIN||'');
      mailbox.connection=await first(env,'SELECT connected_at,last_sync_at,needs_reconnect,provider FROM gmail_connections WHERE workspace_id=?',wid);
      mailbox.gmail=mailbox.connection;
      mailbox.provider=mailbox.connection?.provider||mailbox.provider||detectMailProvider(mailbox.email);
    }
    const isConn=!!await first(env,'SELECT workspace_id FROM gmail_connections WHERE workspace_id=?',wid);
    return json({workspace:{id:wid,name:w.name,owner_id:w.owner_id},owner,rules,messages,mailbox,gmail_connected:isConn,mailbox_connected:isConn,provider:mailbox?.provider||'google',team_pools,members:owner?await all(env,'SELECT u.id,u.name,u.email,m.joined_at FROM members m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=?',wid):[],grants:owner?await all(env,'SELECT * FROM grants WHERE workspace_id=?',wid):[],invitations:owner?await all(env,'SELECT id,email,expires_at,accepted_at FROM invitations WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100',wid):[],events:owner?await all(env,'SELECT e.id,e.action,e.target,e.created_at,u.email actor FROM events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.workspace_id=? ORDER BY e.created_at DESC LIMIT 100',wid):[]});
  }
  if(route.startsWith('messages/') && req.method==='GET') {
    const message=await first(env,'SELECT * FROM messages WHERE id=? AND workspace_id=?',route.slice(9),wid);if(!message) fail(404,'Message not found.');
    const rule=await first(env,'SELECT * FROM rules WHERE id=? AND workspace_id=?',message.rule_id,wid);
    const grant=owner?{workspace_id:wid,rule_id:rule?.id,user_id:u.id,mode:rule?.mode,starts_at:0,expires_at:null}:await first(env,'SELECT * FROM grants WHERE workspace_id=? AND rule_id=? AND user_id=?',wid,message.rule_id,u.id);
    if(!rule || !canRead({member:w,grant,rule,message})) fail(404,'Message unavailable or permission expired.');
    const content=projectContent(await decrypt(message.content,env.CONTENT_KEY,`${wid}:${message.rule_id}`),grant.mode);
    await audit(env,wid,u,'message.viewed',rule.name);
    return json({id:message.id,name:rule.name,mode:grant.mode,expires_at:message.expires_at,...content});
  }
  if((route==='gmail/sync'||route==='mailbox/sync') && req.method==='POST'){
    if(!owner && !await first(env,"SELECT rule_id FROM grants WHERE workspace_id=? AND user_id=? AND mode!='blocked' AND (expires_at IS NULL OR expires_at>?)",wid,u.id,now())) fail(403,'No active company access.');
    try{
      const conn=await first(env,'SELECT provider FROM gmail_connections WHERE workspace_id=?',wid);
      if(conn?.provider==='microsoft'){
        return json(await syncMicrosoft(env,wid));
      }
      return json(await syncGmail(env,wid));
    }catch(error){fail(502,error.message);}
  }
  if(!owner) fail(403,'Only the workspace owner can do this.');
  if(route==='keys'&&req.method==='GET')return json({keys:await listAccessKeys(env,wid)});
  if(route==='keys'&&req.method==='POST')return json(await createAccessKey(env,wid,u,await body(req)),201);
  if(route.startsWith('keys/')&&req.method==='DELETE')return json(await revokeAccessKey(env,wid,u,route.slice(5)));
  if(route==='pools'&&req.method==='GET'){
    try {
      const pools=await all(env,'SELECT p.*,k.prefix key_prefix FROM team_pools p LEFT JOIN access_keys k ON k.id=p.access_key_id WHERE p.workspace_id=? ORDER BY p.created_at',wid);
      const poolRules=await all(env,'SELECT pr.pool_id,r.id,r.name,r.sender,r.mode FROM team_pool_rules pr JOIN rules r ON r.id=pr.rule_id WHERE r.workspace_id=?',wid);
      const poolMembers=await all(env,'SELECT pm.pool_id,u.id,u.name,u.email FROM team_pool_members pm JOIN users u ON u.id=pm.user_id JOIN members m ON m.user_id=u.id AND m.workspace_id=?',wid);
      return json({pools:pools.map(p=>({...p,rules:poolRules.filter(r=>r.pool_id===p.id),members:poolMembers.filter(m=>m.pool_id===p.id)}))});
    } catch { return json({pools:[]}); }
  }
  if(route==='pools'&&req.method==='POST'){
    const b=await body(req), name=cleanText(b.name,60);
    if(name.length<2) fail(400,'Enter a team pool name of at least two characters.');
    const desc=cleanText(b.description||'',140);
    const color=cleanText(b.color||'blue',20);
    const ruleIds=Array.isArray(b.rule_ids)?b.rule_ids.filter(x=>typeof x==='string'):[];
    const memberIds=Array.isArray(b.member_ids)?b.member_ids.filter(x=>typeof x==='string'):[];
    const pid=id();
    let accessKeyData=null;
    if(b.create_access_key && ruleIds.length>0){
      const selectedRules=await all(env,`SELECT id,mode FROM rules WHERE workspace_id=? AND id IN (${ruleIds.map(()=>'?').join(',')})`,wid,...ruleIds);
      if(selectedRules.length>0){
        accessKeyData=await createAccessKey(env,wid,u,{
          name:`Team Pool: ${name}`,
          scopes:selectedRules.map(r=>({rule_id:r.id,mode:r.mode,subdomain:'*'})),
          accent:color
        });
      }
    }
    const poolBatch=[
      stmt(env,'INSERT INTO team_pools(id,workspace_id,name,description,color,access_key_id,created_at) VALUES(?,?,?,?,?,?,?)',pid,wid,name,desc,color,accessKeyData?.id||null,now()),
      ...ruleIds.map(rid=>stmt(env,'INSERT OR IGNORE INTO team_pool_rules(pool_id,rule_id) VALUES(?,?)',pid,rid)),
      ...memberIds.map(mid=>stmt(env,'INSERT OR IGNORE INTO team_pool_members(pool_id,user_id) VALUES(?,?)',pid,mid)),
      event(env,wid,u,'team_pool.created',name)
    ];
    for(const mid of memberIds){
      for(const rid of ruleIds){
        const rule=await first(env,'SELECT mode FROM rules WHERE id=? AND workspace_id=?',rid,wid);
        if(rule){
          poolBatch.push(stmt(env,'INSERT INTO grants(workspace_id,rule_id,user_id,mode,expires_at,starts_at) VALUES(?,?,?,?,?,?) ON CONFLICT(rule_id,user_id) DO UPDATE SET mode=excluded.mode',wid,rid,mid,rule.mode,null,now()));
        }
      }
    }
    await env.DB.batch(poolBatch);
    return json({ok:true,id:pid,access_key:accessKeyData},201);
  }
  if(route.startsWith('pools/')&&req.method==='DELETE'){
    const pid=route.slice(6);
    const pool=await first(env,'SELECT id,name,access_key_id FROM team_pools WHERE id=? AND workspace_id=?',pid,wid);
    if(!pool) fail(404,'Team pool not found.');
    const delBatch=[
      stmt(env,'DELETE FROM team_pools WHERE id=? AND workspace_id=?',pid,wid),
      event(env,wid,u,'team_pool.deleted',pool.name)
    ];
    if(pool.access_key_id){
      delBatch.push(stmt(env,'UPDATE access_keys SET revoked_at=COALESCE(revoked_at,?) WHERE id=? AND workspace_id=?',now(),pool.access_key_id,wid));
    }
    await env.DB.batch(delBatch);
    return json({ok:true});
  }
  if((route==='gmail/connect'||route==='mailbox/connect') && req.method==='POST'){
    let b={provider:'google'};try{b=await body(req);}catch{}
    const targetProvider=b.provider||'google';
    if(targetProvider==='microsoft'){
      if(env.MICROSOFT_CLIENT_ID){
        const state=randomToken(),verifier=randomToken();
        await stmt(env,'INSERT INTO oauth_states(state_hash,verifier,nonce,expires_at,workspace_id,user_id) VALUES(?,?,?,?,?,?)',await hash(state),verifier,'ms',now()+600000,wid,u.id).run();
        const url=new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
        url.search=new URLSearchParams({client_id:env.MICROSOFT_CLIENT_ID,response_type:'code',redirect_uri:`${env.APP_ORIGIN}/auth/microsoft/callback`,response_mode:'query',scope:'openid email profile offline_access https://graph.microsoft.com/Mail.Read',state,prompt:'select_account'}).toString();
        return new Response(JSON.stringify({url:url.toString(),provider:'microsoft'}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':cookie('mg_oauth',state,req,600,'/auth')}});
      }
      const t=now(), mailbox=await first(env,'SELECT * FROM mailboxes WHERE workspace_id=?',wid);
      const targetEmail=cleanText(b.email||b.demo_email||(mailbox.email.includes('@')?mailbox.email:`user-${wid.slice(0,6)}@outlook.com`),254);
      await env.DB.batch([
        stmt(env,'INSERT INTO gmail_connections(workspace_id,content,connected_at,last_sync_at,query_after,provider) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET content=excluded.content,connected_at=excluded.connected_at,last_sync_at=0,query_after=excluded.query_after,provider=excluded.provider',wid,await encrypt({mock:true,provider:'microsoft'},env.CONTENT_KEY,`${wid}:gmail`),t,t,t,'microsoft'),
        stmt(env,'UPDATE mailboxes SET email=?,provider=?,verified_at=? WHERE workspace_id=?',targetEmail,'microsoft',t,wid),
        event(env,wid,u,'mailbox.connected',`Microsoft Outlook (${targetEmail})`)
      ]);
      return json({ok:true,provider:'microsoft',email:targetEmail,simulated:true});
    }
    if(targetProvider==='yahoo'){
      const t=now(), mailbox=await first(env,'SELECT * FROM mailboxes WHERE workspace_id=?',wid);
      const targetEmail=cleanText(b.email||b.demo_email||(mailbox.email.includes('@')?mailbox.email:`user-${wid.slice(0,6)}@yahoo.com`),254);
      await env.DB.batch([
        stmt(env,'INSERT INTO gmail_connections(workspace_id,content,connected_at,last_sync_at,query_after,provider) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET content=excluded.content,connected_at=excluded.connected_at,last_sync_at=0,query_after=excluded.query_after,provider=excluded.provider',wid,await encrypt({mock:true,provider:'yahoo'},env.CONTENT_KEY,`${wid}:gmail`),t,t,t,'yahoo'),
        stmt(env,'UPDATE mailboxes SET email=?,provider=?,verified_at=? WHERE workspace_id=?',targetEmail,'yahoo',t,wid),
        event(env,wid,u,'mailbox.connected',`Yahoo Mail (${targetEmail})`)
      ]);
      return json({ok:true,provider:'yahoo',email:targetEmail,simulated:true});
    }
    if(targetProvider==='inbound'||targetProvider==='custom'){
      const t=now(), mailbox=await first(env,'SELECT * FROM mailboxes WHERE workspace_id=?',wid);
      const targetEmail=cleanText(b.email||mailbox.email||'inbound-stream@example.com',254);
      await env.DB.batch([
        stmt(env,'UPDATE mailboxes SET provider=?,email=? WHERE workspace_id=?',targetProvider,targetEmail,wid),
        event(env,wid,u,'mailbox.configured',`Inbound Forwarding Stream (${targetEmail})`)
      ]);
      return json({ok:true,provider:targetProvider,email:targetEmail,forwarding:true});
    }
    const mailbox=await first(env,'SELECT email,google_sub FROM mailboxes WHERE workspace_id=?',wid);
    const state=randomToken(),verifier=randomToken(),nonce=randomToken();
    await stmt(env,'INSERT INTO oauth_states(state_hash,verifier,nonce,expires_at,workspace_id,user_id) VALUES(?,?,?,?,?,?)',await hash(state),verifier,nonce,now()+600000,wid,u.id).run();
    const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:`${env.APP_ORIGIN}/auth/callback`,response_type:'code',scope:`openid email profile ${GMAIL_SCOPE}`,state,nonce,code_challenge:await hash(verifier),code_challenge_method:'S256',access_type:'offline',prompt:'select_account consent',...(mailbox.google_sub?{login_hint:mailbox.email}:{})}).toString();
    return new Response(JSON.stringify({url:url.toString(),provider:'google'}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':cookie('mg_oauth',state,req,600,'/auth')}});
  }
  if((route==='gmail/disconnect'||route==='mailbox/disconnect') && req.method==='POST'){
    await env.DB.batch([
      stmt(env,'DELETE FROM gmail_connections WHERE workspace_id=?',wid),
      stmt(env,'UPDATE mailboxes SET provider=? WHERE workspace_id=?','custom',wid),
      event(env,wid,u,'mailbox.disconnected','Mailbox credential removed')
    ]);
    return json({ok:true});
  }
  if(route==='setup' && req.method==='GET') {
    const m=await first(env,'SELECT * FROM mailboxes WHERE workspace_id=?',wid);
    if(!m.setup_content || m.setup_expires_at<=now()) fail(404,'No current forwarding confirmation. Add the receiving address in Outlook, Yahoo, Gmail, or your email provider first.');
    const content=await decrypt(m.setup_content,env.CONTENT_KEY,`${wid}:setup`);
    await audit(env,wid,u,'mailbox.confirmation_viewed',content.provider||'Forwarding');
    return json(content);
  }
  if(route==='mailbox/rotate' && req.method==='POST') {
    if(!validHost(env.INBOUND_DOMAIN||''))fail(400,'An inbound domain is required only for forwarding. Use direct Gmail connection without a domain.');
    const alias=`mg-${randomToken().toLowerCase()}@${env.INBOUND_DOMAIN}`;
    await env.DB.batch([stmt(env,'UPDATE mailboxes SET alias=?,verified_at=NULL,setup_content=NULL,setup_expires_at=NULL WHERE workspace_id=?',alias,wid),event(env,wid,u,'mailbox.address_rotated','')]);return json({alias});
  }
  if(route==='rules' && req.method==='POST') {
    const b=await body(req),name=cleanText(b.name,60),sender=cleanText(b.sender,254).toLowerCase(),subject=cleanText(b.subject_contains,120),mode=b.mode,linkHost=cleanText(b.link_host,253).toLowerCase(),retention=Number(b.retention_minutes||15);
    if(name.length<2 || !validRuleSender(sender) || !['codes','links','read'].includes(mode) || !Number.isInteger(retention) || retention<5 || retention>1440 || (linkHost && !validHost(linkHost)) || (mode==='links'&&!linkHost)) fail(400,'Check the rule name, sender pattern, link hostname, and retention (5–1440 minutes).');
    const count=await first(env,'SELECT count(*) n FROM rules WHERE workspace_id=?',wid);if(count.n>=30) fail(409,'You can create up to 30 rules per workspace.');
    if(await first(env,'SELECT id FROM rules WHERE workspace_id=? AND sender=? AND subject_contains=?',wid,sender,subject)) fail(409,'A rule for this sender and subject already exists.');
    const rid=id();await env.DB.batch([stmt(env,'INSERT INTO rules(id,workspace_id,name,sender,subject_contains,mode,link_host,retention_minutes,created_at) VALUES(?,?,?,?,?,?,?,?,?)',rid,wid,name,sender,subject,mode,linkHost,retention,now()),event(env,wid,u,'rule.created',name)]);return json({id:rid},201);
  }
  if(route.startsWith('rules/') && ['PATCH','DELETE'].includes(req.method)) {
    const rid=route.slice(6),rule=await first(env,'SELECT * FROM rules WHERE id=? AND workspace_id=?',rid,wid);if(!rule) fail(404,'Rule not found.');
    if(req.method==='DELETE') await env.DB.batch([stmt(env,'DELETE FROM rules WHERE id=? AND workspace_id=?',rid,wid),event(env,wid,u,'rule.deleted',rule.name)]);
    else {
      const b=await body(req);
      if(typeof b.enabled==='boolean') {
        await env.DB.batch([stmt(env,'UPDATE rules SET enabled=? WHERE id=? AND workspace_id=?',b.enabled?1:0,rid,wid),event(env,wid,u,b.enabled?'rule.resumed':'rule.paused',rule.name)]);
      } else {
        const name=b.name!==undefined?cleanText(b.name,60):rule.name;
        const sender=b.sender!==undefined?cleanText(b.sender,254).toLowerCase():rule.sender;
        const subject=b.subject_contains!==undefined?cleanText(b.subject_contains,120):rule.subject_contains;
        const mode=b.mode!==undefined?b.mode:rule.mode;
        const linkHost=b.link_host!==undefined?cleanText(b.link_host,253).toLowerCase():rule.link_host;
        const retention=b.retention_minutes!==undefined?Number(b.retention_minutes):rule.retention_minutes;
        if(name.length<2 || !validRuleSender(sender) || !['codes','links','read'].includes(mode) || !Number.isInteger(retention) || retention<5 || retention>1440 || (linkHost && !validHost(linkHost)) || (mode==='links'&&!linkHost)) fail(400,'Check the rule name, sender pattern, link hostname, and retention (5–1440 minutes).');
        await env.DB.batch([stmt(env,'UPDATE rules SET name=?,sender=?,subject_contains=?,mode=?,link_host=?,retention_minutes=? WHERE id=? AND workspace_id=?',name,sender,subject,mode,linkHost,retention,rid,wid),event(env,wid,u,'rule.updated',name)]);
      }
    }
    return json({ok:true});
  }
  if(route==='invitations' && req.method==='POST') {
    const b=await body(req),email=cleanText(b.email,254).toLowerCase();if(!validEmail(email)||email===u.email) fail(400,'Enter a valid recipient email address (any provider supported: Outlook, Yahoo, Gmail, etc.).');
    await limited(env,`invite:${wid}`,30,DAY);
    const token=randomToken(),iid=id();await env.DB.batch([stmt(env,'INSERT INTO invitations(id,workspace_id,email,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?)',iid,wid,email,await hash(token),now()+2*DAY,now()),event(env,wid,u,'invitation.created',email)]);
    return json({id:iid,url:`${env.APP_ORIGIN}/app.html#invite=${token}`,expires_at:now()+2*DAY},201);
  }
  if(route.startsWith('invitations/') && req.method==='DELETE') {await stmt(env,'DELETE FROM invitations WHERE id=? AND workspace_id=? AND accepted_at IS NULL',route.slice(12),wid).run();await audit(env,wid,u,'invitation.revoked','');return json({ok:true});}
  if(route==='grants' && req.method==='PUT') {
    const b=await body(req),rule=await first(env,'SELECT * FROM rules WHERE id=? AND workspace_id=?',b.rule_id||'',wid),member=await first(env,'SELECT * FROM members WHERE workspace_id=? AND user_id=?',wid,b.user_id||'');
    if(!rule || !member || b.user_id===u.id || !availableModes(rule.mode).includes(b.mode)) fail(400,'Invalid member or permission for this rule.');
    const expiry=b.expires_at===null||b.expires_at===undefined?null:Number(b.expires_at);if(expiry!==null&&(!Number.isFinite(expiry)||expiry<=now()||expiry>now()+366*DAY))fail(400,'Choose an expiry within the next year.');
    await env.DB.batch([stmt(env,'INSERT INTO grants(workspace_id,rule_id,user_id,mode,expires_at,starts_at) VALUES(?,?,?,?,?,?) ON CONFLICT(rule_id,user_id) DO UPDATE SET mode=excluded.mode,expires_at=excluded.expires_at,starts_at=excluded.starts_at',wid,rule.id,b.user_id,b.mode,expiry,now()),event(env,wid,u,'permission.changed',`${rule.name}: ${b.mode}`)]);return json({ok:true});
  }
  if(route.startsWith('members/') && req.method==='DELETE') {
    const uid=route.slice(8);if(uid===u.id)fail(400,'The owner cannot be removed.');
    await env.DB.batch([stmt(env,'DELETE FROM grants WHERE workspace_id=? AND user_id=?',wid,uid),stmt(env,'DELETE FROM members WHERE workspace_id=? AND user_id=?',wid,uid),event(env,wid,u,'member.removed','Member access revoked')]);return json({ok:true});
  }
  if(route==='messages' && req.method==='DELETE') {await env.DB.batch([stmt(env,'DELETE FROM messages WHERE workspace_id=?',wid),event(env,wid,u,'messages.deleted','All retained messages')]);return json({ok:true});}
  if(route==='workspace' && req.method==='DELETE') {const b=await body(req);if(b.name!==w.name)fail(400,'Enter the workspace name to confirm.');await stmt(env,'DELETE FROM workspaces WHERE id=? AND owner_id=?',wid,u.id).run();return json({ok:true});}
  fail(404,'Not found.');
}

export async function receiveEmail(message,env) {
  if(!configured(env)||!validHost(env.INBOUND_DOMAIN||'')) {message.setReject('Forwarding ingestion is not configured');return;}
  if(message.rawSize>256000) {message.setReject('Message exceeds 256 KB');return;}
  const mailbox=await first(env,'SELECT * FROM mailboxes WHERE alias=?',message.to.toLowerCase());if(!mailbox){message.setReject('Unknown recipient');return;}
  if(!authenticatedEmail(message.headers)){message.setReject('Authenticated DMARC sender required');return;}
  await limited(env,`mail:${mailbox.workspace_id}`,200,DAY);
  const mail=await PostalMime.parse(message.raw),sender=mail.from?.address?.toLowerCase();
  if(isForwardingSetupEmail({sender, subject: mail.subject, text: mail.text})) {
    const setup=extractSetupConfirmation(mail);
    await stmt(env,'UPDATE mailboxes SET setup_content=?,setup_expires_at=? WHERE id=?',await encrypt(setup,env.CONTENT_KEY,`${mailbox.workspace_id}:setup`),now()+DAY,mailbox.id).run();
    return;
  }
  if(!await storeApprovedMail(env,mailbox,mail))message.setReject('No active approved rule or original recipient mismatch');
}
export async function cleanup(env) {
  const t=now();await env.DB.batch([stmt(env,'DELETE FROM messages WHERE expires_at<=?',t),stmt(env,'DELETE FROM sessions WHERE expires_at<=?',t),stmt(env,'DELETE FROM shared_sessions WHERE expires_at<=? OR key_id IN (SELECT id FROM access_keys WHERE revoked_at IS NOT NULL OR (expires_at IS NOT NULL AND expires_at<=?) OR (max_views IS NOT NULL AND views>=max_views))',t,t),stmt(env,'DELETE FROM oauth_states WHERE expires_at<=?',t),stmt(env,'DELETE FROM rate_limits WHERE expires_at<=?',t),stmt(env,'DELETE FROM invitations WHERE expires_at<=?',t),stmt(env,'DELETE FROM events WHERE created_at<?',t-30*DAY),stmt(env,'UPDATE mailboxes SET setup_content=NULL,setup_expires_at=NULL WHERE setup_expires_at<=?',t)]);
}
export default {
  async fetch(req,env) {
    try {
      const path=new URL(req.url).pathname;let response;
      if (path.startsWith('/google') && path.endsWith('.html')) {
        return new Response(`google-site-verification: ${path.slice(1)}`, {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=3600'
          }
        });
      }
      if(path.startsWith('/api/')) response=await api(req,env,path);
      else if(path.startsWith('/auth/')) {if(!configured(env))fail(503,'Live sign-in is not configured. Open /dashboard?demo=1 for the sample workspace.');if(req.method!=='GET')fail(405,'Method not allowed.');response=await auth(req,env,path);}
      else {
        // Redirect all .html URLs permanently to clean URLs
        if (path.endsWith('.html')) {
          const clean = path.replace(/\.html$/, '');
          const htmlMapped = {
            '/index': '/',
            '/app': '/dashboard',
            '/overview': '/dashboard',
            '/keys': '/people',
            '/settings': '/profile',
            '/signin': '/signin',
            '/login': '/signin'
          }[clean] || clean;
          const target = new URL(htmlMapped, req.url);
          target.search = new URL(req.url).search;
          target.hash = new URL(req.url).hash;
          return Response.redirect(target, 301);
        }

        // Legacy clean route redirects
        const legacyRedirects = {
          '/overview': '/dashboard',
          '/keys': '/people',
          '/settings': '/profile',
          '/login': '/signin',
          '/app': '/dashboard'
        };
        if (legacyRedirects[path]) {
          const target = new URL(legacyRedirects[path], req.url);
          target.search = new URL(req.url).search;
          target.hash = new URL(req.url).hash;
          return Response.redirect(target, 301);
        }

        // Logged-in root redirect: if logged in, redirect / to /dashboard; otherwise explicitly serve welcome landing page
        if (path === '/') {
          const sessionToken = getCookie(req, 'mg_session');
          if (sessionToken && configured(env)) {
            try {
              const u = await first(env, 'SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?', await hash(sessionToken), now());
              if (u) {
                return Response.redirect(new URL('/dashboard', req.url), 302);
              }
            } catch {}
          }
          response = await env.ASSETS.fetch(new Request(new URL('/index.html', req.url), req));
        } else if (path === '/signin') {
          response = await env.ASSETS.fetch(new Request(new URL('/signin.html', req.url), req));
        } else {
          const appRoutes=['/dashboard','/profile','/inbox','/mailboxes','/rules','/people','/activity'];
          if(appRoutes.includes(path)) {
            const url = new URL(req.url);
            const sessionToken = getCookie(req, 'mg_session');
            if (!sessionToken && !url.searchParams.has('demo')) {
              return Response.redirect(new URL('/signin', req.url), 302);
            }
            response = await env.ASSETS.fetch(new Request(new URL('/app.html', req.url), req));
          } else if (path === '/access') {
            response = await env.ASSETS.fetch(new Request(new URL('/access.html', req.url), req));
          } else if (path === '/docs') {
            response = await env.ASSETS.fetch(new Request(new URL('/docs.html', req.url), req));
          } else if (path === '/privacy') {
            response = await env.ASSETS.fetch(new Request(new URL('/privacy.html', req.url), req));
          } else if (path === '/terms') {
            response = await env.ASSETS.fetch(new Request(new URL('/terms.html', req.url), req));
          } else {
            response = await env.ASSETS.fetch(req);
            if(response.status === 404 && ((req.headers.get('accept')||'').includes('text/html') || !path.includes('.'))) {
              try {
                const notFoundRes = await env.ASSETS.fetch(new Request(new URL('/404.html', req.url), req));
                if(notFoundRes && notFoundRes.ok) {
                  const h = new Headers(notFoundRes.headers);
                  h.set('content-type', 'text/html; charset=utf-8');
                  response = new Response(notFoundRes.body, {
                    status: 404,
                    headers: h
                  });
                }
              } catch {}
            }
          }
        }
      }
      return securityHeaders(response);
    } catch(error) {return securityHeaders(json({error:error.status?error.message:'The request could not be completed. Please try again.'},error.status||500));}
  },
  async email(message,env) {try {await receiveEmail(message,env);} catch {message.setReject('Message could not be processed');}},
  async scheduled(controller,env,ctx) {ctx.waitUntil(cleanup(env));}
};
