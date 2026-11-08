import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import worker,{receiveEmail,cleanup} from '../src/worker.mjs';
import {hash,encrypt,decrypt,canRead,authenticatedEmail,extractContent,projectContent} from '../src/security.mjs';
import {GMAIL_SCOPE,syncGmail,gmailQuery} from '../src/gmail.mjs';
import {storeApprovedMail} from '../src/mail.mjs';
import {completeGoogleLink} from '../src/google-link.mjs';

const secret=Buffer.alloc(32,7).toString('base64');
function database(){const db=new DatabaseSync(':memory:');return {db,prepare(sql){return {bind(...args){const query=db.prepare(sql);return {async first(){return query.get(...args)||null;},async all(){return {results:query.all(...args)};},async run(){return {meta:{changes:query.run(...args).changes}};}};}};},async batch(statements){db.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};}
async function fixture(){const DB=database();for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())DB.db.exec(await readFile(new URL(`../migrations/${file}`,import.meta.url),'utf8'));const t=Date.now(),env={DB,GOOGLE_CLIENT_ID:'test',GOOGLE_CLIENT_SECRET:'test',CONTENT_KEY:secret,APP_ORIGIN:'https://mailgrant.test',INBOUND_DOMAIN:'inbound.test',ASSETS:{fetch:()=>new Response('asset')}};
for(const [id,email]of [['owner','owner@example.com'],['brother','brother@example.com'],['stranger','stranger@example.com']])DB.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,id,email,id,t-100000);
for(const [id,owner]of [['one','owner'],['two','stranger']]){DB.db.prepare('INSERT INTO workspaces VALUES(?,?,?,?)').run(id,id,owner,t-100000);DB.db.prepare('INSERT INTO members VALUES(?,?,?)').run(id,owner,t-100000);DB.db.prepare('INSERT INTO mailboxes(id,workspace_id,email,alias) VALUES(?,?,?,?)').run(id,id,`${owner}@example.com`,`alias-${id}@inbound.test`);}
DB.db.prepare('INSERT INTO members VALUES(?,?,?)').run('one','brother',t-100000);
DB.db.prepare('INSERT INTO rules(id,workspace_id,name,sender,mode,retention_minutes,created_at) VALUES(?,?,?,?,?,?,?)').run('r1','one','Claude','login@vendor.example','read',15,t-100000);
DB.db.prepare('INSERT INTO rules(id,workspace_id,name,sender,mode,created_at) VALUES(?,?,?,?,?,?)').run('r2','two','Other','login@vendor.example','codes',t-100000);
DB.db.prepare('INSERT INTO grants VALUES(?,?,?,?,?,?)').run('one','r1','brother','codes',null,t-10000);
for(const [id,wid,rid]of [['m1','one','r1'],['m2','two','r2']])DB.db.prepare('INSERT INTO messages VALUES(?,?,?,?,?,?,?)').run(id,wid,rid,await encrypt({code:'123456',subject:'Private subject',text:'SECRET FULL BODY',sender:'login@vendor.example',link:'https://vendor.example/token'},secret,`${wid}:${rid}`),t-1000,t+900000,id);
for(const id of ['owner','brother','stranger'])DB.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(await hash(`token-${id}`),id,t+DAY);
const call=(path,{user='brother',method='GET',body,origin=env.APP_ORIGIN}={})=>worker.fetch(new Request(`${env.APP_ORIGIN}${path}`,{method,headers:{cookie:`mg_session=token-${user}`,origin,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}),env);
return {DB,env,call,t};}
const DAY=86400000;
test('encryption hides content and binds ciphertext to its workspace/rule',async()=>{const cipher=await encrypt({code:'123456'},secret,'one:r1');assert.ok(!cipher.includes('123456'));assert.deepEqual(await decrypt(cipher,secret,'one:r1'),{code:'123456'});await assert.rejects(decrypt(cipher,secret,'two:r1'));await assert.rejects(encrypt({},'short','one:r1'));});
test('code extraction fails closed for ambiguous values and strips message bodies',()=>{const rule={mode:'codes',link_host:''};assert.deepEqual(extractContent({subject:'Your sign-in code is 123456',text:'Private body',from:{address:'a@b.com'}},rule),{code:'123456'});assert.equal(extractContent({text:'Codes: 123456 and 789012'},rule).code,null);assert.equal(extractContent({text:'Invoice number 123456'},rule).code,null);assert.deepEqual(projectContent({code:'123456',text:'secret',subject:'secret'},'codes'),{code:'123456'});});
test('links require an exact HTTPS hostname, no credentials or unusual port',()=>{const rule={mode:'links',link_host:'accounts.example.com'};for(const url of ['https://accounts.example.com.evil.test/token','https://accounts.example.com@evil.test/token','https://accounts.example.com:444/token','http://accounts.example.com/token'])assert.equal(extractContent({text:url},rule).link,null);assert.equal(extractContent({text:'https://accounts.example.com/token'},rule).link,'https://accounts.example.com/token');});
test('HTML emails strip CSS stylesheets and extract magic links from anchor tags',()=>{
  const rule={mode:'read',link_host:'claude.ai',sender:'*@*.anthropic.com'};
  const mail={
    subject:'Your secure link to Claude is here | 2026-11-07 13:57:23',
    from:{address:'no-reply@mail.anthropic.com'},
    text:`family-Roboto:300,400,500,700); @media only screen and (min-width:480px) {
.mj-column-per-100 { width:100% !important; max-width: 100%; }
.mj-column-per-65 { width:65% !important; max-width: 65%; }
.mj-column-per-35 { width:35% !important; max-width: 35%; }
} .moz-text-html .mj-column-per-100 {
width:100% !important; max-width: 100%; }
https://fonts.googleapis.com`,
    html:`<!doctype html><html><head>
      <style type="text/css">
        @import url(https://fonts.googleapis.com/css?family=Roboto:300,400,500,700);
        @media only screen and (min-width:480px) {
          .mj-column-per-100 { width:100% !important; max-width: 100%; }
        }
      </style>
    </head><body>
      <p>Click below to sign in to Claude.</p>
      <a href="https://claude.ai/magic-link#token=secure-token-12345">Sign in to Claude</a>
      <footer><a href="https://anthropic.com/privacy">Privacy Policy</a></footer>
    </body></html>`
  };
  const extracted=extractContent(mail,rule);
  assert.ok(!extracted.text.includes('.mj-column-per-100'),'CSS classes must not appear in text');
  assert.ok(!extracted.text.includes('@media'),'Media queries must not appear in text');
  assert.ok(!extracted.text.includes('family-Roboto'),'Font imports must not appear in text');
  assert.ok(!extracted.text.includes('fonts.googleapis.com'),'Asset urls must not appear in text');
  assert.ok(extracted.text.includes('Sign in to Claude'),'Message body text must be present');
  assert.equal(extracted.link,'https://claude.ai/magic-link#token=secure-token-12345');
});
test('sender authentication trusts only Cloudflare’s first authentication result',()=>{assert.equal(authenticatedEmail(new Headers({'authentication-results':'mx.cloudflare.net; dkim=pass; dmarc=pass'})),true);assert.equal(authenticatedEmail(new Headers({'authentication-results':'evil.test; dmarc=pass'})),false);assert.equal(authenticatedEmail(new Headers({'authentication-results':'mx.cloudflare.net; dmarc=fail, evil.test; dmarc=pass'})),false);});
test('anonymous, cross-workspace and cross-message reads are rejected',async()=>{const {call,env}=await fixture();assert.equal((await worker.fetch(new Request(`${env.APP_ORIGIN}/api/me`),env)).status,401);assert.equal((await call('/api/w/two/state')).status,404);assert.equal((await call('/api/w/one/messages/m2')).status,404);assert.equal((await call('/api/w/one/state',{user:'stranger'})).status,404);});
test('codes-only API never returns full body, subject, sender or link',async()=>{const {call}=await fixture();const response=await call('/api/w/one/messages/m1');assert.equal(response.status,200);const body=await response.json();assert.equal(body.code,'123456');for(const field of ['text','subject','sender','link'])assert.equal(field in body,false);const state=await(await call('/api/w/one/state')).json();assert.equal(state.owner,false);assert.equal(state.mailbox,null);assert.deepEqual(state.members,[]);assert.deepEqual(state.events,[]);assert.equal(state.messages[0].content,undefined);});
test('revocation, pause, grant expiry and message expiry block subsequent reads',async()=>{for(const sql of ["DELETE FROM grants WHERE user_id='brother'","DELETE FROM members WHERE user_id='brother'","UPDATE rules SET enabled=0 WHERE id='r1'","UPDATE grants SET expires_at=1","UPDATE messages SET expires_at=1 WHERE id='m1'"]){const {call,DB}=await fixture();DB.db.exec(sql);assert.equal((await call('/api/w/one/messages/m1')).status,404,sql);}});
test('earlier messages are hidden when a new grant starts',async()=>{const {call,DB}=await fixture();DB.db.prepare('UPDATE grants SET starts_at=?').run(Date.now()+1000);assert.equal((await call('/api/w/one/messages/m1')).status,404);const state=await(await call('/api/w/one/state')).json();assert.equal(state.messages.length,0);});
test('member cannot manage rules and cross-origin mutations are rejected',async()=>{const {call}=await fixture();assert.equal((await call('/api/w/one/rules',{method:'POST',body:{}})).status,403);assert.equal((await call('/api/w/one/rules',{user:'owner',method:'POST',body:{},origin:'https://evil.test'})).status,403);});
test('invitations bind to an email, expire, and are single-use',async()=>{const {call,DB}=await fixture();const created=await(await call('/api/w/one/invitations',{user:'owner',method:'POST',body:{email:'stranger@example.com'}})).json();const token=new URL(created.url).hash.slice(8);assert.ok(token);assert.equal((await call('/api/invitations/accept',{method:'POST',body:{token}})).status,403);assert.equal((await call('/api/invitations/accept',{user:'stranger',method:'POST',body:{token}})).status,200);assert.equal((await call('/api/invitations/accept',{user:'stranger',method:'POST',body:{token}})).status,403);assert.equal(DB.db.prepare("SELECT count(*) n FROM grants WHERE user_id='stranger'").get().n,0);});
test('cross-workspace grants and escalating beyond storage mode are rejected',async()=>{const {call,DB}=await fixture();assert.equal((await call('/api/w/one/grants',{user:'owner',method:'PUT',body:{rule_id:'r2',user_id:'brother',mode:'codes'}})).status,400);DB.db.exec("UPDATE rules SET mode='codes' WHERE id='r1'");assert.equal((await call('/api/w/one/grants',{user:'owner',method:'PUT',body:{rule_id:'r1',user_id:'brother',mode:'read'}})).status,400);});
test('email ingestion verifies recipient, sender and stores encrypted projected content',async()=>{const {env,DB}=await fixture();DB.db.exec("UPDATE rules SET mode='codes' WHERE id='r1'");const create=(to,auth,from='login@vendor.example')=>({to:'alias-one@inbound.test',rawSize:250,headers:new Headers({'authentication-results':auth}),raw:new Blob([`From: ${from}\r\nTo: ${to}\r\nSubject: Your login code\r\nMessage-ID: <unique-${to}-${from}@test>\r\nContent-Type: text/plain\r\n\r\nYour sign-in code is 654321. Private email body.`]).stream(),setReject(reason){this.rejected=reason;}});
const badAuth=create('owner@example.com','evil.test; dmarc=pass');await receiveEmail(badAuth,env);assert.ok(badAuth.rejected);
const badRecipient=create('other@example.com','mx.cloudflare.net; dmarc=pass');await receiveEmail(badRecipient,env);assert.ok(badRecipient.rejected);
const badSender=create('owner@example.com','mx.cloudflare.net; dmarc=pass','unapproved@example.com');await receiveEmail(badSender,env);assert.ok(badSender.rejected);
const good=create('owner@example.com','mx.cloudflare.net; dmarc=pass');await receiveEmail(good,env);assert.equal(good.rejected,undefined);const row=DB.db.prepare("SELECT * FROM messages WHERE rule_id='r1' AND id!='m1'").get();assert.ok(row);assert.ok(!row.content.includes('654321'));assert.deepEqual(await decrypt(row.content,secret,'one:r1'),{code:'654321'});assert.ok(DB.db.prepare("SELECT verified_at FROM mailboxes WHERE id='one'").get().verified_at);});
test('cleanup removes expired data; workspace deletion cascades related records',async()=>{const {env,DB,call}=await fixture();DB.db.exec("UPDATE messages SET expires_at=1 WHERE id='m1'");await cleanup(env);assert.equal(DB.db.prepare("SELECT * FROM messages WHERE id='m1'").get(),undefined);assert.equal((await call('/api/w/one/workspace',{user:'owner',method:'DELETE',body:{name:'one'}})).status,200);for(const table of ['rules','grants','members','mailboxes','events'])assert.equal(DB.db.prepare(`SELECT count(*) n FROM ${table} WHERE workspace_id='one'`).get().n,0);});
test('domain-free mode works and Gmail connection consent is owner-only',async()=>{const {env,call}=await fixture();delete env.INBOUND_DOMAIN;const config=await(await call('/api/config')).json();assert.equal(config.configured,true);assert.equal((await call('/api/w/one/gmail/connect',{method:'POST',body:{}})).status,403);const response=await call('/api/w/one/gmail/connect',{user:'owner',method:'POST',body:{}});assert.equal(response.status,200);const url=new URL((await response.json()).url);assert.ok(url.searchParams.get('scope').split(' ').includes(GMAIL_SCOPE));assert.equal(url.searchParams.get('access_type'),'offline');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(response.headers.get('set-cookie').includes('HttpOnly'));});
async function connectFixture(f){const content=await encrypt({refresh_token:'PRIVATE_REFRESH_TOKEN'},secret,'one:gmail');f.DB.db.prepare('INSERT INTO gmail_connections(workspace_id,content,connected_at,last_sync_at,query_after) VALUES(?,?,?,?,?)').run('one',content,f.t-20000,0,f.t-20000);return content;}
test('Gmail token stays encrypted and is not exposed in workspace responses',async()=>{const f=await fixture();const cipher=await connectFixture(f);assert.ok(!cipher.includes('PRIVATE_REFRESH_TOKEN'));for(const user of ['owner','brother']){const state=await(await f.call('/api/w/one/state',{user})).json();assert.equal(state.gmail_connected,true);assert.ok(!JSON.stringify(state).includes('PRIVATE_REFRESH_TOKEN'));assert.ok(!JSON.stringify(state).includes(cipher));}assert.equal((await f.call('/api/w/one/gmail/disconnect',{method:'POST',body:{}})).status,403);assert.equal((await f.call('/api/w/one/gmail/disconnect',{user:'owner',method:'POST',body:{}})).status,200);assert.equal(f.DB.db.prepare("SELECT * FROM gmail_connections WHERE workspace_id='one'").get(),undefined);});
test('Gmail sync filters senders, refuses old/unauthenticated mail, encrypts and deduplicates',async()=>{const f=await fixture();await connectFixture(f);f.DB.db.exec("UPDATE rules SET mode='codes' WHERE id='r1'");let rawCalls=0;const fetcher=async(url,options)=>{url=String(url);if(url.includes('oauth2.googleapis.com')){assert.equal(options.body.get('refresh_token'),'PRIVATE_REFRESH_TOKEN');return Response.json({access_token:'ACCESS_TOKEN'});}assert.equal(options.headers.Authorization,'Bearer ACCESS_TOKEN');if(url.includes('/messages?')){const q=new URL(url).searchParams.get('q');assert.ok(q.includes('from:"login@vendor.example"'));return Response.json({messages:[{id:'a1'},{id:'b2'},{id:'c3'},{id:'d4'}]});}const mid=url.match(/messages\/([a-z0-9]+)/)[1];if(url.includes('format=metadata'))return Response.json({sizeEstimate:200,internalDate:String(mid==='d4'?f.t-100000:f.t-1000)});rawCalls++;const raw=`Authentication-Results: mx.google.com; dmarc=${mid==='c3'?'fail':'pass'}\r\nFrom: ${mid==='b2'?'other@vendor.example':'login@vendor.example'}\r\nTo: owner@example.com\r\nSubject: Your sign-in code\r\nContent-Type: text/plain\r\n\r\nYour code is 987654. PRIVATE BODY`;return Response.json({raw:Buffer.from(raw).toString('base64url')});};
await syncGmail(f.env,'one',{fetcher});let rows=f.DB.db.prepare("SELECT * FROM messages WHERE rule_id='r1' AND id!='m1'").all();assert.equal(rows.length,1);assert.deepEqual(await decrypt(rows[0].content,secret,'one:r1'),{code:'987654'});assert.equal(rawCalls,3);f.DB.db.exec("DELETE FROM rate_limits WHERE bucket='gmail-sync:one'");await syncGmail(f.env,'one',{fetcher});rows=f.DB.db.prepare("SELECT * FROM messages WHERE rule_id='r1' AND id!='m1'").all();assert.equal(rows.length,1);});
test('Gmail pagination preserves a fixed query until all pages finish',async()=>{const f=await fixture();await connectFixture(f);const queries=[];let page=0;const fetcher=async(url)=>{if(String(url).includes('oauth2.googleapis.com'))return Response.json({access_token:'test'});const params=new URL(url).searchParams;queries.push(params.get('q'));return Response.json(page++===0?{messages:[],nextPageToken:'next-page'}:{messages:[]});};await syncGmail(f.env,'one',{fetcher});let row=f.DB.db.prepare("SELECT * FROM gmail_connections WHERE workspace_id='one'").get();assert.equal(row.page_token,'next-page');assert.equal(row.query_after,f.t-20000);f.DB.db.exec("DELETE FROM rate_limits WHERE bucket='gmail-sync:one'");await syncGmail(f.env,'one',{fetcher});row=f.DB.db.prepare("SELECT * FROM gmail_connections WHERE workspace_id='one'").get();assert.equal(queries[0],queries[1]);assert.equal(row.page_token,null);assert.ok(row.last_sync_at>=f.t);});
test('revoked Google authorization is marked for reconnection without exposing token data',async()=>{const f=await fixture();await connectFixture(f);await assert.rejects(syncGmail(f.env,'one',{fetcher:async()=>Response.json({error:'invalid_grant'},{status:400})}),/authorization/);assert.equal(f.DB.db.prepare("SELECT needs_reconnect FROM gmail_connections WHERE workspace_id='one'").get().needs_reconnect,1);assert.ok(gmailQuery(f.t,['a@example.com','a@example.com']).includes('{from:"a@example.com"}'));});

const keyBody=(extra={})=>({name:'Brother — Claude',scopes:[{rule_id:'r1',mode:'codes'}],expires_at:null,max_views:null,...extra});
async function makeKey(f,extra={}){const response=await f.call('/api/w/one/keys',{user:'owner',method:'POST',body:keyBody(extra)});assert.equal(response.status,201);return response.json();}
function sharedCall(f,path,{cookie='',method='GET',body,origin=f.env.APP_ORIGIN}={}){return worker.fetch(new Request(`${f.env.APP_ORIGIN}/api/shared/${path}`,{method,headers:{cookie,origin,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}),f.env);}
async function redeem(f,key){const response=await sharedCall(f,'redeem',{method:'POST',body:{key}});assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];}
function makeNewMessage(f){const key=f.DB.db.prepare("SELECT created_at FROM access_keys WHERE workspace_id='one' ORDER BY created_at DESC LIMIT 1").get();f.DB.db.prepare("UPDATE messages SET received_at=? WHERE id='m1'").run(key.created_at);}
test('only owners create keys and scopes cannot cross workspaces or exceed retention permissions',async()=>{const f=await fixture();assert.equal((await f.call('/api/w/one/keys',{method:'POST',body:keyBody()})).status,403);assert.equal((await f.call('/api/w/one/keys')).status,403);assert.equal((await f.call('/api/w/one/keys',{user:'owner',method:'POST',body:keyBody({scopes:[{rule_id:'r2',mode:'codes'}]})})).status,400);f.DB.db.exec("UPDATE rules SET mode='codes' WHERE id='r1'");assert.equal((await f.call('/api/w/one/keys',{user:'owner',method:'POST',body:keyBody({scopes:[{rule_id:'r1',mode:'read'}]})})).status,400);assert.equal((await f.call('/api/w/one/keys',{user:'owner',method:'POST',body:keyBody({max_views:0})})).status,400);});
test('raw sharing key is returned once and exchanged for a protected device cookie without Google sign-in',async()=>{const f=await fixture(),created=await makeKey(f);assert.match(created.key,/^mgk_[A-Za-z0-9_-]{43}$/);const stored=f.DB.db.prepare('SELECT * FROM access_keys WHERE id=?').get(created.id);assert.notEqual(stored.token_hash,created.key);assert.equal(stored.token_hash,await hash(created.key));assert.equal(stored.expires_at,null);assert.equal(stored.max_views,null);const list=await(await f.call('/api/w/one/keys',{user:'owner'})).json();assert.ok(!JSON.stringify(list).includes(created.key));assert.ok(!JSON.stringify(list).includes(stored.token_hash));const response=await sharedCall(f,'redeem',{method:'POST',body:{key:created.key}});assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');assert.ok(cookie.includes('HttpOnly'));assert.ok(cookie.includes('Secure'));assert.ok(cookie.includes('SameSite=Strict'));assert.ok(!cookie.includes(created.key));const state=await(await sharedCall(f,'state',{cookie:cookie.split(';')[0]})).json();assert.equal(state.name,'Brother — Claude');assert.deepEqual(state.rules.map(r=>r.name),['Claude']);for(const field of ['members','mailbox','gmail','token_hash'])assert.equal(field in state,false);});
test('sharing keys expose only selected new messages and cannot access management APIs',async()=>{const f=await fixture(),created=await makeKey(f),cookie=await redeem(f,created.key);assert.equal((await sharedCall(f,'messages/m1',{cookie})).status,404);makeNewMessage(f);const response=await sharedCall(f,'messages/m1',{cookie});assert.equal(response.status,200);const content=await response.json();assert.equal(content.code,'123456');for(const field of ['subject','sender','text','link'])assert.equal(field in content,false);assert.equal((await sharedCall(f,'messages/m2',{cookie})).status,404);assert.equal((await worker.fetch(new Request(`${f.env.APP_ORIGIN}/api/w/one/state`,{headers:{cookie}}),f.env)).status,401);f.DB.db.exec("UPDATE rules SET enabled=0 WHERE id='r1'");assert.equal((await sharedCall(f,'messages/m1',{cookie})).status,404);});
test('message-open allowance is atomic across simultaneous reads and list refreshes do not consume it',async()=>{const f=await fixture(),created=await makeKey(f,{max_views:2}),cookie=await redeem(f,created.key);makeNewMessage(f);assert.equal((await sharedCall(f,'state',{cookie})).status,200);assert.equal(f.DB.db.prepare('SELECT views FROM access_keys WHERE id=?').get(created.id).views,0);const responses=await Promise.all([1,2,3].map(()=>sharedCall(f,'messages/m1',{cookie})));assert.deepEqual(responses.map(r=>r.status).sort(),[200,200,401]);assert.equal(f.DB.db.prepare('SELECT views FROM access_keys WHERE id=?').get(created.id).views,2);assert.equal((await sharedCall(f,'state',{cookie})).status,401);assert.equal((await sharedCall(f,'redeem',{method:'POST',body:{key:created.key}})).status,401);});
test('revocation invalidates every saved browser and prevents key reuse',async()=>{const f=await fixture(),created=await makeKey(f),a=await redeem(f,created.key),b=await redeem(f,created.key);assert.equal((await f.call(`/api/w/two/keys/${created.id}`,{user:'stranger',method:'DELETE'})).status,404);assert.equal((await f.call(`/api/w/one/keys/${created.id}`,{user:'owner',method:'DELETE'})).status,200);for(const cookie of [a,b])assert.equal((await sharedCall(f,'state',{cookie})).status,401);assert.equal((await sharedCall(f,'redeem',{method:'POST',body:{key:created.key}})).status,401);assert.equal(f.DB.db.prepare('SELECT count(*) n FROM shared_sessions WHERE key_id=?').get(created.id).n,0);});
test('expiry, cleared device sessions, and same-origin checks are enforced separately from no-expiry keys',async()=>{const f=await fixture(),created=await makeKey(f),cookie=await redeem(f,created.key);f.DB.db.exec('UPDATE shared_sessions SET expires_at=1');assert.equal((await sharedCall(f,'state',{cookie})).status,401);const next=await redeem(f,created.key);assert.equal((await sharedCall(f,'state',{cookie:next})).status,200);f.DB.db.prepare('UPDATE access_keys SET expires_at=1 WHERE id=?').run(created.id);assert.equal((await sharedCall(f,'state',{cookie:next})).status,401);assert.equal((await sharedCall(f,'redeem',{method:'POST',origin:'https://evil.test',body:{key:created.key}})).status,403);});

test('one owner links distinct Gmail accounts while keeping mailbox identities pinned',async()=>{
  const f=await fixture();const created=await(await f.call('/api/workspaces',{user:'owner',method:'POST',body:{name:'Second Gmail'}})).json();
  const claims={sub:'second-google-subject',email:'second@gmail.com',email_verified:true},tokens={scope:`openid email ${GMAIL_SCOPE}`,refresh_token:'SECOND_PRIVATE_REFRESH'};
  await completeGoogleLink(f.env,{workspaceId:created.id,userId:'owner',claims,tokens});
  const mailbox=f.DB.db.prepare('SELECT * FROM mailboxes WHERE workspace_id=?').get(created.id);assert.equal(mailbox.email,'second@gmail.com');assert.equal(mailbox.google_sub,claims.sub);
  assert.equal(f.DB.db.prepare('SELECT owner_id FROM workspaces WHERE id=?').get(created.id).owner_id,'owner');
  const me=await(await f.call('/api/me',{user:'owner'})).json();assert.equal(me.user.email,'owner@example.com');assert.equal(me.workspaces.find(w=>w.id===created.id).mailbox_email,'second@gmail.com');
  const conn=f.DB.db.prepare('SELECT content FROM gmail_connections WHERE workspace_id=?').get(created.id);assert.ok(!conn.content.includes(tokens.refresh_token));await assert.rejects(decrypt(conn.content,secret,'one:gmail'));
  await assert.rejects(completeGoogleLink(f.env,{workspaceId:created.id,userId:'stranger',claims,tokens}),/workspace/);
  await assert.rejects(completeGoogleLink(f.env,{workspaceId:created.id,userId:'owner',claims:{...claims,sub:'different-account',email:'third@gmail.com'},tokens}),/account/);
  await f.call(`/api/w/${created.id}/gmail/disconnect`,{user:'owner',method:'POST',body:{}});
  await assert.rejects(completeGoogleLink(f.env,{workspaceId:created.id,userId:'owner',claims:{...claims,sub:'different-account'},tokens}),/account/);
});
test('Gmail consent uses an account picker and preserves the linked-account hint only on reconnect',async()=>{
  const f=await fixture();let consent=await(await f.call('/api/w/one/gmail/connect',{user:'owner',method:'POST',body:{}})).json();let url=new URL(consent.url);assert.ok(url.searchParams.get('prompt').includes('select_account'));assert.equal(url.searchParams.has('login_hint'),false);
  f.DB.db.prepare("UPDATE mailboxes SET google_sub=?,email=? WHERE workspace_id='one'").run('linked-sub','linked@gmail.com');
  consent=await(await f.call('/api/w/one/gmail/connect',{user:'owner',method:'POST',body:{}})).json();url=new URL(consent.url);assert.equal(url.searchParams.get('login_hint'),'linked@gmail.com');
});
test('cancelled, invalid and expired Google callbacks return safe retry screens',async()=>{
  const f=await fixture();const begun=await f.call('/api/w/one/gmail/connect',{user:'owner',method:'POST',body:{}}),cookie=begun.headers.get('set-cookie').split(';')[0],state=new URL((await begun.json()).url).searchParams.get('state');
  const callback=()=>worker.fetch(new Request(`${f.env.APP_ORIGIN}/auth/callback?state=${state}&error=access_denied&error_description=PRIVATE_PROVIDER_TEXT`,{headers:{cookie:`mg_session=token-owner; ${cookie}`}}),f.env);
  let response=await callback();assert.equal(response.status,302);assert.match(response.headers.get('location'),/auth_error=denied/);assert.ok(!response.headers.get('location').includes('PRIVATE_PROVIDER_TEXT'));assert.match(response.headers.get('set-cookie'),/Max-Age=0/);
  response=await callback();assert.match(response.headers.get('location'),/auth_error=expired/);
  response=await worker.fetch(new Request(`${f.env.APP_ORIGIN}/auth/callback?state=wrong&code=secret`),f.env);assert.match(response.headers.get('location'),/auth_error=state/);assert.ok(!response.headers.get('location').includes('secret'));
});
test('paginated Gmail sync keeps its first boundary and imports mail arriving between pages next',async()=>{
  const f=await fixture();await connectFixture(f);const originalNow=Date.now;let clock=f.t,step=0;const queries=[];Date.now=()=>clock;
  try{
    const fetcher=async(url)=>{url=String(url);if(url.includes('oauth2.googleapis.com'))return Response.json({access_token:'test'});if(url.includes('/messages?')){queries.push(new URL(url).searchParams.get('q'));return Response.json(step++===0?{messages:[],nextPageToken:'page-two'}:step===2?{messages:[]}:{messages:[{id:'fresh1'}]});}if(url.includes('format=metadata'))return Response.json({sizeEstimate:200,internalDate:String(f.t+60000)});return Response.json({raw:Buffer.from('Authentication-Results: mx.google.com; dmarc=pass\r\nFrom: login@vendor.example\r\nTo: owner@example.com\r\nSubject: Your code\r\nContent-Type: text/plain\r\n\r\nYour code is 555666').toString('base64url')});};
    await syncGmail(f.env,'one',{fetcher});const firstEnd=f.DB.db.prepare("SELECT window_end FROM gmail_connections WHERE workspace_id='one'").get().window_end;
    clock+=10*60000;await syncGmail(f.env,'one',{fetcher});let conn=f.DB.db.prepare("SELECT * FROM gmail_connections WHERE workspace_id='one'").get();assert.equal(conn.query_after,Math.max(conn.connected_at,firstEnd-1000));assert.equal(queries[0],queries[1]);assert.equal(conn.window_end,null);
    clock+=31000;await syncGmail(f.env,'one',{fetcher});assert.ok(queries[2].includes(`after:${Math.floor((firstEnd-1000)/1000)}`));const message=f.DB.db.prepare("SELECT * FROM messages WHERE rule_id='r1' AND id!='m1'").get();assert.ok(message);assert.equal((await decrypt(message.content,secret,'one:r1')).code,'555666');
  }finally{Date.now=originalNow;}
});
test('a browser saves multiple keys, combines their inboxes and cannot select an unredeemed key',async()=>{
  const f=await fixture(),a=await makeKey(f),cookie=await redeem(f,a.key);
  const b=await(await f.call('/api/w/two/keys',{user:'stranger',method:'POST',body:{name:'Other mailbox',scopes:[{rule_id:'r2',mode:'codes'}],expires_at:null,max_views:null}})).json();
  const added=await sharedCall(f,'redeem',{cookie,method:'POST',body:{key:b.key}});assert.equal(added.status,200);assert.equal(added.headers.get('set-cookie').split(';')[0],cookie);
  f.DB.db.prepare('UPDATE messages SET received_at=?').run(Date.now()+1);
  let state=await(await sharedCall(f,'state',{cookie})).json();assert.equal(state.connections.length,2);assert.equal(state.messages.length,2);assert.ok(state.messages.every(m=>m.key_id));
  assert.equal((await sharedCall(f,`messages/m2?key_id=${b.id}`,{cookie})).status,200);
  assert.equal((await sharedCall(f,`messages/m2?key_id=${a.id}`,{cookie})).status,404);
  const unredeemed=await makeKey(f,{name:'Not saved here'});assert.equal((await sharedCall(f,`state?key_id=${unredeemed.id}`,{cookie})).status,403);
  await f.call(`/api/w/one/keys/${a.id}`,{user:'owner',method:'DELETE'});state=await(await sharedCall(f,'state',{cookie})).json();assert.equal(state.connections.length,1);assert.equal(state.connections[0].id,b.id);assert.equal((await sharedCall(f,`messages/m2?key_id=${b.id}`,{cookie})).status,200);
});
test('removing one saved key preserves the others and their independent open limits',async()=>{
  const f=await fixture(),a=await makeKey(f),b=await makeKey(f,{name:'Limited key',max_views:1}),cookie=await redeem(f,a.key);
  await sharedCall(f,'redeem',{cookie,method:'POST',body:{key:b.key}});makeNewMessage(f);
  assert.equal((await sharedCall(f,`messages/m1?key_id=${b.id}`,{cookie})).status,200);
  let state=await(await sharedCall(f,'state',{cookie})).json();assert.equal(state.connections.length,1);assert.equal(state.connections[0].id,a.id);
  assert.equal((await sharedCall(f,`messages/m1?key_id=${a.id}`,{cookie})).status,200);
  await sharedCall(f,'forget',{cookie,method:'POST',body:{key_id:a.id}});assert.equal((await sharedCall(f,'state',{cookie})).status,401);
});
test('wildcard sender rules accept VERP and randomized addresses like Anthropic',async()=>{
  const f=await fixture();
  const ruleResp=await f.call('/api/w/one/rules',{user:'owner',method:'POST',body:{name:'Claude',sender:'no-reply-*@mail.anthropic.com',mode:'codes',retention_minutes:15}});
  assert.equal(ruleResp.status,201);
  const {id:ruleId}=await ruleResp.json();
  assert.ok(gmailQuery(f.t,['no-reply-*@mail.anthropic.com']).includes('from:mail.anthropic.com'));
  const mail={from:{address:'no-reply-iDAhI3VLH_RrVt99Qz-WGg@mail.anthropic.com'},to:[{address:'mailbox-one@example.com'}],subject:'Your sign-in code is 123456',text:'Your Claude code is 123456.',date:new Date()};
  const count=await storeApprovedMail(f.env,{id:'mb1',workspace_id:'one',email:'mailbox-one@example.com'},mail);
  assert.equal(count,1);
  const msg=f.DB.db.prepare('SELECT * FROM messages WHERE workspace_id=? AND rule_id=?').get('one',ruleId);
  assert.ok(msg);
});
test('wildcard subdomain sender rules and rule field updates work correctly',async()=>{
  const f=await fixture();
  const ruleResp=await f.call('/api/w/one/rules',{user:'owner',method:'POST',body:{name:'Anthropic',sender:'*@*.anthropic.com',mode:'codes',retention_minutes:15}});
  assert.equal(ruleResp.status,201);
  const {id:ruleId}=await ruleResp.json();
  assert.ok(gmailQuery(f.t,['*@*.anthropic.com']).includes('from:anthropic.com'));

  // Test matching sender for both root and subdomains
  const mail1={from:{address:'login@anthropic.com'},to:[{address:'mailbox-one@example.com'}],subject:'Your code is 111222',text:'Code: 111222',date:new Date()};
  const count1=await storeApprovedMail(f.env,{id:'mb1',workspace_id:'one',email:'mailbox-one@example.com'},mail1);
  assert.equal(count1,1);

  const mail2={from:{address:'security@auth.mail.anthropic.com'},to:[{address:'mailbox-one@example.com'}],subject:'Your code is 333444',text:'Code: 333444',date:new Date()};
  const count2=await storeApprovedMail(f.env,{id:'mb1',workspace_id:'one',email:'mailbox-one@example.com'},mail2);
  assert.equal(count2,1);

  // Update rule properties via PATCH
  const patchResp=await f.call(`/api/w/one/rules/${ruleId}`,{user:'owner',method:'PATCH',body:{name:'Anthropic Claude VIP',sender:'*@anthropic.com',retention_minutes:30}});
  assert.equal(patchResp.status,200);
  const updatedRule=f.DB.db.prepare('SELECT * FROM rules WHERE id=?').get(ruleId);
  assert.equal(updatedRule.name,'Anthropic Claude VIP');
  assert.equal(updatedRule.sender,'*@anthropic.com');
  assert.equal(updatedRule.retention_minutes,30);
});
test('R2 avatar storage organizes files folder-wise under avatars/:userId/avatar and syncs with profile',async()=>{
  const f=await fixture();
  const storage=new Map();
  f.env.AVATARS={
    async put(key,body,options){
      const bytes=Buffer.from(await new Response(body).arrayBuffer());
      storage.set(key,{bytes,options,uploaded:new Date()});
    },
    async get(key){
      const item=storage.get(key);
      if(!item)return null;
      return {
        body:item.bytes,
        httpEtag:'"mock-etag"',
        writeHttpMetadata(headers){
          if(item.options?.httpMetadata?.contentType){headers.set('content-type',item.options.httpMetadata.contentType);}
        }
      };
    },
    async head(key){
      const item=storage.get(key);
      if(!item)return null;
      return {uploaded:item.uploaded};
    },
    async delete(key){
      storage.delete(key);
    }
  };

  // Upload an avatar for owner
  const imgData=Buffer.from('test-image-bytes');
  const uploadResp=await worker.fetch(new Request(`${f.env.APP_ORIGIN}/api/avatar`,{
    method:'PUT',
    headers:{
      cookie:'mg_session=token-owner',
      origin:f.env.APP_ORIGIN,
      'content-type':'image/png'
    },
    body:imgData
  }),f.env);
  assert.equal(uploadResp.status,200);
  const uploadJson=await uploadResp.json();
  assert.ok(uploadJson.avatar.includes('/api/avatar/owner'));

  // Verify folder-wise storage key
  assert.ok(storage.has('avatars/owner/avatar'));
  assert.equal(storage.get('avatars/owner/avatar').options.httpMetadata.contentType,'image/png');

  // Verify public retrieval endpoint with correct content-type
  const getResp=await worker.fetch(new Request(`${f.env.APP_ORIGIN}/api/avatar/owner`),f.env);
  assert.equal(getResp.status,200);
  assert.equal(getResp.headers.get('content-type'),'image/png');

  // Verify /api/me includes R2 avatar URL
  const meResp=await f.call('/api/me',{user:'owner'});
  assert.equal(meResp.status,200);
  const meData=await meResp.json();
  assert.ok(meData.user.avatar.includes('/api/avatar/owner'));

  // Update profile name via PATCH /api/profile
  const patchResp=await f.call('/api/profile',{user:'owner',method:'PATCH',body:{name:'Updated Owner'}});
  assert.equal(patchResp.status,200);
  const updatedUser=f.DB.db.prepare('SELECT name FROM users WHERE id=?').get('owner');
  assert.equal(updatedUser.name,'Updated Owner');

  // Delete avatar from R2
  const delResp=await f.call('/api/avatar',{user:'owner',method:'DELETE'});
  assert.equal(delResp.status,200);
  assert.equal(storage.has('avatars/owner/avatar'),false);
});

test('redirects logged-in root visits to /dashboard while serving landing page to visitors',async()=>{
  const {env}=await fixture();
  // Unauthenticated visit to root /
  const unauthResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/`),env);
  assert.equal(unauthResp.status,200);

  // Authenticated visit to root /
  const authResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/`,{headers:{cookie:'mg_session=token-owner'}}),env);
  assert.equal(authResp.status,302);
  assert.equal(authResp.headers.get('location'),`${env.APP_ORIGIN}/dashboard`);

  // Unwanted legacy routes redirect 301
  const overviewResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/overview`),env);
  assert.equal(overviewResp.status,301);
  assert.equal(overviewResp.headers.get('location'),`${env.APP_ORIGIN}/dashboard`);

  const keysResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/keys`),env);
  assert.equal(keysResp.status,301);
  assert.equal(keysResp.headers.get('location'),`${env.APP_ORIGIN}/people`);

  const settingsResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/settings`),env);
  assert.equal(settingsResp.status,301);
  assert.equal(settingsResp.headers.get('location'),`${env.APP_ORIGIN}/profile`);

  // Disallow .html extensions - all .html routes redirect 301 to clean URLs
  const accessHtmlResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/access.html`),env);
  assert.equal(accessHtmlResp.status,301);
  assert.equal(accessHtmlResp.headers.get('location'),`${env.APP_ORIGIN}/access`);

  const indexHtmlResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/index.html`),env);
  assert.equal(indexHtmlResp.status,301);
  assert.equal(indexHtmlResp.headers.get('location'),`${env.APP_ORIGIN}/`);

  const dashHtmlResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/dashboard.html`),env);
  assert.equal(dashHtmlResp.status,301);
  assert.equal(dashHtmlResp.headers.get('location'),`${env.APP_ORIGIN}/dashboard`);

  // Unauthenticated visit to /dashboard redirects 302 to /signin
  const unauthDashResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/dashboard`),env);
  assert.equal(unauthDashResp.status,302);
  assert.equal(unauthDashResp.headers.get('location'),`${env.APP_ORIGIN}/signin`);

  // Direct visit to /signin serves signin screen directly
  const signinResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/signin`),env);
  assert.equal(signinResp.status,200);

  // /login redirects 301 to /signin
  const loginResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/login`),env);
  assert.equal(loginResp.status,301);
  assert.equal(loginResp.headers.get('location'),`${env.APP_ORIGIN}/signin`);

  // /signin.html redirects 301 to /signin
  const signinHtmlResp=await worker.fetch(new Request(`${env.APP_ORIGIN}/signin.html`),env);
  assert.equal(signinHtmlResp.status,301);
  assert.equal(signinHtmlResp.headers.get('location'),`${env.APP_ORIGIN}/signin`);
});

test('individual access supports subdomain selection and expired keys auto-purge after 5 days', async () => {
  const f = await fixture();
  
  // 1. Issue access key with specific subdomain scope (e.g. auth.*)
  const createResp = await f.call('/api/w/one/keys', {
    user: 'owner',
    method: 'POST',
    body: {
      name: 'Contractor — Auth Only',
      scopes: [{ rule_id: 'r1', mode: 'codes', subdomain: 'auth' }],
      expires_at: f.t + 24 * 3600000,
      max_views: 10
    }
  });
  assert.equal(createResp.status, 201);
  const created = await createResp.json();
  assert.ok(created.key.startsWith('mgk_'));

  // 2. Verify listAccessKeys returns subdomain in scopes
  const listResp = await f.call('/api/w/one/keys', { user: 'owner' });
  assert.equal(listResp.status, 200);
  const listData = await listResp.json();
  const found = listData.keys.find(k => k.id === created.id);
  assert.ok(found);
  assert.equal(found.scopes[0].subdomain, 'auth');

  // 3. Insert an old key expired 6 days ago (> 5 days) and a recent key expired 2 days ago (< 5 days)
  const sixDaysAgo = f.t - 6 * DAY;
  const twoDaysAgo = f.t - 2 * DAY;
  f.DB.db.prepare('INSERT INTO access_keys(id,workspace_id,name,token_hash,prefix,expires_at,max_views,created_at) VALUES(?,?,?,?,?,?,?,?)')
    .run('old-key', 'one', 'Old Key', 'hash-old', 'mgk_old...', sixDaysAgo, null, f.t - 10 * DAY);
  f.DB.db.prepare('INSERT INTO access_keys(id,workspace_id,name,token_hash,prefix,expires_at,max_views,created_at) VALUES(?,?,?,?,?,?,?,?)')
    .run('recent-key', 'one', 'Recent Key', 'hash-recent', 'mgk_recent...', twoDaysAgo, null, f.t - 3 * DAY);

  // 4. Fetch keys again: old-key (expired > 5 days) should be auto-purged, recent-key (< 5 days) preserved
  const listResp2 = await f.call('/api/w/one/keys', { user: 'owner' });
  const listData2 = await listResp2.json();
  assert.equal(listData2.keys.some(k => k.id === 'old-key'), false);
  assert.equal(listData2.keys.some(k => k.id === 'recent-key'), true);
});

test('multi-provider email support detects Outlook, Yahoo, and iCloud forwarding verification', async () => {
  const {detectMailProvider, isForwardingSetupEmail, extractSetupConfirmation} = await import('../src/security.mjs');
  
  assert.equal(detectMailProvider('user@outlook.com'), 'microsoft');
  assert.equal(detectMailProvider('user@hotmail.com'), 'microsoft');
  assert.equal(detectMailProvider('user@yahoo.com'), 'yahoo');
  assert.equal(detectMailProvider('user@icloud.com'), 'apple');
  assert.equal(detectMailProvider('user@proton.me'), 'proton');
  assert.equal(detectMailProvider('user@gmail.com'), 'google');
  assert.equal(detectMailProvider('user@corp.example'), 'custom');

  // Microsoft Outlook forwarding verification email
  const msMail = {
    from: { address: 'account-security-noreply@accountprotection.microsoft.com' },
    subject: 'Microsoft account security code',
    text: 'Please use the security code 849201 to verify your email forwarding address for Outlook.'
  };
  assert.ok(isForwardingSetupEmail(msMail));
  const msExtracted = extractSetupConfirmation(msMail);
  assert.equal(msExtracted.provider, 'microsoft');
  assert.equal(msExtracted.code, '849201');

  // Yahoo forwarding verification email
  const yahooMail = {
    from: { address: 'no-reply@cc.yahoo-inc.com' },
    subject: 'Yahoo Mail: Verify your forwarding address',
    text: 'To verify your forwarding email address in Yahoo Mail, your confirmation code is 318492.'
  };
  assert.ok(isForwardingSetupEmail(yahooMail));
  const yahooExtracted = extractSetupConfirmation(yahooMail);
  assert.equal(yahooExtracted.provider, 'yahoo');
  assert.equal(yahooExtracted.code, '318492');
});

test('multi-provider mailbox connection connects Outlook, Yahoo, and Inbound stream', async () => {
  const f = await fixture();

  // Connect Outlook
  const msConnect = await f.call('/api/w/one/mailbox/connect', {
    user: 'owner',
    method: 'POST',
    body: { provider: 'microsoft', email: 'owner@outlook.com' }
  });
  assert.equal(msConnect.status, 200);
  const msData = await msConnect.json();
  assert.equal(msData.provider, 'microsoft');

  // Check state returns provider
  const stateResp = await f.call('/api/w/one/state', { user: 'owner' });
  const stateData = await stateResp.json();
  assert.equal(stateData.provider, 'microsoft');
  assert.equal(stateData.mailbox.provider, 'microsoft');

  // Connect Yahoo
  const yahooConnect = await f.call('/api/w/one/mailbox/connect', {
    user: 'owner',
    method: 'POST',
    body: { provider: 'yahoo', email: 'owner@yahoo.com' }
  });
  assert.equal(yahooConnect.status, 200);
  const yahooData = await yahooConnect.json();
  assert.equal(yahooData.provider, 'yahoo');

  // Check state returns yahoo provider
  const stateResp2 = await f.call('/api/w/one/state', { user: 'owner' });
  const stateData2 = await stateResp2.json();
  assert.equal(stateData2.provider, 'yahoo');
});

test('invitation claim works for any provider (Outlook, Yahoo, etc.) and establishes a valid session', async () => {
  const f = await fixture();
  // Owner creates an invitation for an Outlook user
  const inviteResp = await f.call('/api/w/one/invitations', {
    user: 'owner',
    method: 'POST',
    body: { email: 'team-member@outlook.com' }
  });
  assert.equal(inviteResp.status, 201);
  const inviteData = await inviteResp.json();
  const token = new URL(inviteData.url).hash.slice(8);
  assert.ok(token);

  // Check invitation info endpoint without auth
  const infoReq = new Request(`${f.env.APP_ORIGIN}/api/invitations/info?token=${token}`, {
    headers: { origin: f.env.APP_ORIGIN }
  });
  const infoResp = await worker.fetch(infoReq, f.env);
  assert.equal(infoResp.status, 200);
  const info = await infoResp.json();
  assert.equal(info.valid, true);
  assert.equal(info.email, 'team-member@outlook.com');

  // Claim invitation directly without prior user session (any email provider flow)
  const makeClaimReq = () => new Request(`${f.env.APP_ORIGIN}/api/invitations/claim`, {
    method: 'POST',
    headers: { origin: f.env.APP_ORIGIN, 'content-type': 'application/json' },
    body: JSON.stringify({ token, name: 'Outlook Colleague' })
  });
  const claimResp = await worker.fetch(makeClaimReq(), f.env);
  assert.equal(claimResp.status, 200);
  const claimData = await claimResp.json();
  assert.equal(claimData.ok, true);
  assert.equal(claimData.user.email, 'team-member@outlook.com');
  const sessionCookie = claimResp.headers.get('set-cookie');
  assert.ok(sessionCookie && sessionCookie.includes('mg_session='));

  // The claimed user is now a member of the workspace
  const memberRecord = f.DB.db.prepare("SELECT * FROM members WHERE workspace_id='one' AND user_id=?").get(claimData.user.id);
  assert.ok(memberRecord);

  // Token cannot be claimed a second time
  const reClaimResp = await worker.fetch(makeClaimReq(), f.env);
  assert.equal(reClaimResp.status, 403);
});

test('team pools group rules (Netflix) and members, sync grants, and surface in workspace state', async () => {
  const f = await fixture();

  // Create a Netflix rule in workspace 'one'
  const ruleResp = await f.call('/api/w/one/rules', {
    user: 'owner',
    method: 'POST',
    body: {
      name: 'Netflix',
      sender: '@netflix.com',
      subject_contains: 'code',
      mode: 'codes',
      retention_minutes: 30
    }
  });
  assert.equal(ruleResp.status, 201);
  const netflixRule = f.DB.db.prepare("SELECT id FROM rules WHERE workspace_id='one' AND name='Netflix'").get();
  assert.ok(netflixRule);

  // Create a Team Pool: "Netflix Family & Team Logins"
  const poolResp = await f.call('/api/w/one/pools', {
    user: 'owner',
    method: 'POST',
    body: {
      name: 'Netflix Family & Team',
      description: 'Shared OTP for Netflix logins',
      color: 'red',
      rule_ids: [netflixRule.id],
      member_ids: ['brother'],
      create_access_key: true
    }
  });
  assert.equal(poolResp.status, 201);
  const poolData = await poolResp.json();
  assert.ok(poolData.id);
  assert.ok(poolData.access_key);
  assert.ok(poolData.access_key.key.startsWith('mgk_'));

  // Verify pool created in DB
  const poolDb = f.DB.db.prepare("SELECT * FROM team_pools WHERE id=?").get(poolData.id);
  assert.equal(poolDb.name, 'Netflix Family & Team');

  // Verify grants were automatically synced for pool member
  const grant = f.DB.db.prepare("SELECT * FROM grants WHERE workspace_id='one' AND rule_id=? AND user_id='brother'").get(netflixRule.id);
  assert.ok(grant);
  assert.equal(grant.mode, 'codes');

  // Insert a mock Netflix message received after pool creation
  const msgReceived = Date.now() + 100;
  const msgCipher = await encrypt({ code: '739281', subject: 'Your Netflix temporary access code' }, secret, `one:${netflixRule.id}`);
  f.DB.db.prepare("INSERT INTO messages(id,workspace_id,rule_id,content,received_at,expires_at,dedupe) VALUES(?,?,?,?,?,?,?)")
    .run('m_netflix', 'one', netflixRule.id, msgCipher, msgReceived, msgReceived + 1800000, 'netflix_msg_1');

  // Verify state returns the pool and tags the message with pools
  const stateResp = await f.call('/api/w/one/state', { user: 'owner' });
  assert.equal(stateResp.status, 200);
  const state = await stateResp.json();
  assert.ok(Array.isArray(state.team_pools));
  assert.equal(state.team_pools.length, 1);
  assert.equal(state.team_pools[0].name, 'Netflix Family & Team');
  assert.equal(state.team_pools[0].rules.length, 1);
  assert.equal(state.team_pools[0].members.length, 1);

  // Check that the netflix message has pool tags
  const netflixMsg = state.messages.find(m => m.id === 'm_netflix');
  assert.ok(netflixMsg);
  assert.ok(netflixMsg.pools && netflixMsg.pools.length > 0);
  assert.equal(netflixMsg.pools[0].name, 'Netflix Family & Team');

  // Brother (member) can read the message through their pool grant
  const readResp = await f.call('/api/w/one/messages/m_netflix', { user: 'brother' });
  assert.equal(readResp.status, 200);
  const readData = await readResp.json();
  assert.equal(readData.code, '739281');
});

