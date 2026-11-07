import './theme.js';
import {DemoAPI} from './demo.js';

const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const demo=new URLSearchParams(location.search).get('demo')==='1'||location.hostname.endsWith('github.io'),demoApi=demo?new DemoAPI():null;
const modes={codes:'Codes only',links:'Sign-in links',read:'Read messages'};
let state=null,openMessage=null,selected='',syncIndex=0;

// SVG Icons
const icons = {
  key: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`,
  shield: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  refresh: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  plus: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  trash: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  logout: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  copy: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  close: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  clock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  mail: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`
};

async function api(path,method='GET',body){
  if(demo)return demoApi.shared(path,method,body);
  const r=await fetch(`/api/shared/${path}`,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  let data;try{data=await r.json();}catch{throw new Error('Live sharing is not configured here. Ask the owner for their deployed application URL.');}
  if(!r.ok){const error=new Error(data.error||'Could not open shared access.');error.status=r.status;throw error;}return data;
}

function entry(error=''){
  state=null;openMessage=null;if($('#shared-dialog').open)$('#shared-dialog').close();
  $('#shared-app').innerHTML=`
    <section class="intro card-hero">
      <div class="intro-badge">
        ${icons.key}
        <span>Recipient Access Portal</span>
      </div>
      <h1 class="intro-heading">Your Shared Inbox</h1>
      <p class="intro-desc">Paste the Mailgrant access key given to you by the mailbox owner. You do not need their Gmail password or your own Google sign-in.</p>
      
      ${demo ? `
        <div class="notice blue">
          <strong>Interactive Demo:</strong> You can test with a sample key from the owner dashboard, or enter <code>mgk_sample_brother</code> to test instantly.
          <div style="margin-top:8px;">
            <button class="btn small" type="button" id="fill-demo-key">Auto-fill demo key</button>
          </div>
        </div>
      ` : ''}

      <form id="redeem-form" class="redeem-box">
        <div class="field">
          <label for="access-key">Access Key</label>
          <div class="key-input-wrapper">
            ${icons.lock}
            <input id="access-key" name="key" type="password" autocomplete="off" spellcheck="false" placeholder="mgk_…" required maxlength="80">
            <button type="button" class="toggle-pw-btn" id="toggle-pw" aria-label="Toggle key visibility">Show</button>
          </div>
          <small>The raw key is exchanged once for a protected device session and is not stored in plain text.</small>
        </div>
        <p class="form-error" role="alert">${esc(error)}</p>
        <button class="btn primary btn-full" type="submit">
          <span>Open Shared Inbox</span>
          ${icons.key}
        </button>
      </form>

      <hr class="divider">
      <div class="privacy-note">
        ${icons.shield}
        <span>This device remembers your session until revoked by the owner, until your open allowance ends, or until your session expires.</span>
      </div>
    </section>
  `;

  // Attach helpers on entry
  const toggleBtn = $('#toggle-pw');
  const keyInput = $('#access-key');
  if (toggleBtn && keyInput) {
    toggleBtn.addEventListener('click', () => {
      const isPw = keyInput.type === 'password';
      keyInput.type = isPw ? 'text' : 'password';
      toggleBtn.textContent = isPw ? 'Hide' : 'Show';
    });
  }

  const demoFillBtn = $('#fill-demo-key');
  if (demoFillBtn && keyInput) {
    demoFillBtn.addEventListener('click', () => {
      keyInput.value = 'mgk_sample_brother';
      keyInput.type = 'text';
      if (toggleBtn) toggleBtn.textContent = 'Hide';
    });
  }
}

function selector(){return selected?'?key_id='+encodeURIComponent(selected):'';}

function addKey(){
  openMessage=null;
  $('#shared-dialog').innerHTML=`
    <div class="dialog-head">
      <h2 id="shared-dialog-title">Add another access key</h2>
      <button class="icon-btn" data-close aria-label="Close dialog">${icons.close}</button>
    </div>
    <div class="dialog-body">
      <p>Save another owner's or mailbox's access alongside your existing keys to view them in one combined inbox.</p>
      <form id="add-key-form">
        <div class="field">
          <label for="additional-key">Access key</label>
          <div class="key-input-wrapper">
            ${icons.lock}
            <input id="additional-key" name="key" type="password" autocomplete="off" placeholder="mgk_…" required maxlength="80">
          </div>
        </div>
        <p class="form-error" role="alert"></p>
        <div class="dialog-actions">
          <button type="button" class="btn" data-close>Cancel</button>
          <button class="btn primary" type="submit">Save access</button>
        </div>
      </form>
    </div>
  `;
  $('#shared-dialog').showModal();
}

function render(){
  const connections = state.connections || [];
  const multiKeys = connections.length > 1;

  $('#shared-app').innerHTML=`
    ${demo ? '<div class="demo-banner"><strong>Interactive demo</strong> · Sample data only.</div>' : ''}
    
    <div class="page-head">
      <div>
        <p class="eyebrow" style="display:flex; align-items:center; gap:6px;">
          ${icons.shield}
          <span>${esc(state.workspace)}</span>
        </p>
        <h1 style="margin:4px 0 6px;">${esc(state.name)}</h1>
        <p class="subtitle">Only the companies and messages permitted by your access key appear here.</p>
      </div>

      <div class="button-row">
        <button class="btn primary" data-refresh>
          ${icons.refresh}
          <span>Refresh mail</span>
        </button>
        <button class="btn" data-add-key>
          ${icons.plus}
          <span>Add key</span>
        </button>
        ${selected ? `
          <button class="btn danger" data-remove-key>
            ${icons.trash}
            <span>Remove key</span>
          </button>
        ` : ''}
        ${demo ? `
          <button class="btn" data-simulate-demo>Simulate approved email</button>
        ` : ''}
        <button class="btn" data-forget title="Clear saved credentials from this browser">
          ${icons.logout}
          <span>Forget device</span>
        </button>
      </div>
    </div>

    <!-- Key switcher and status chips -->
    <div class="key-control-bar">
      <div class="field" style="margin:0; flex:1; max-width:320px;">
        <label for="saved-access" style="font-size:11px; margin-bottom:4px; font-weight:600; color:var(--muted);">Saved Access</label>
        <select id="saved-access" style="width:100%; border-radius:8px; height:38px; padding:0 12px; background:var(--bg-card); color:var(--ink); border:1px solid var(--line);">
          <option value="">All saved keys (${connections.length})</option>
          ${connections.map(k=>`<option value="${esc(k.id)}" ${selected===k.id?'selected':''}>${esc(k.workspace)} · ${esc(k.name)}</option>`).join('')}
        </select>
      </div>

      <div class="access-info" style="margin:0; align-self:flex-end;">
        ${!selected && multiKeys ? `
          <span class="badge blue">${icons.key} Combined inbox (${connections.length} keys active)</span>
        ` : `
          <span class="badge blue">
            ${icons.clock}
            ${state.expires_at ? `Valid until ${esc(new Date(state.expires_at).toLocaleDateString())}` : 'No key expiry'}
          </span>
          <span class="badge ${state.max_views !== null && (state.max_views - state.views) <= 2 ? 'amber' : ''}">
            ${icons.lock}
            ${state.max_views === null ? 'Unlimited message opens' : `${Math.max(0, state.max_views - state.views)} opens remaining`}
          </span>
        `}
      </div>
    </div>

    <!-- Allowed company permissions -->
    <div class="access-companies-section">
      <span class="companies-label">Allowed Companies:</span>
      <div class="access-companies" style="margin:0;">
        ${state.rules.map(r=>`
          <span class="badge green">
            <span class="dot"></span>
            ${esc(r.source ? r.source + ' · ' : '')}${esc(r.name)} (${modes[r.mode] || r.mode})
          </span>
        `).join('')}
      </div>
    </div>

    <!-- Message List -->
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Your Shared Inbox</h2>
          <p>Messages received after key creation. Unwhitelisted mail is strictly blocked.</p>
        </div>
        <span class="badge">${state.messages.length} messages</span>
      </div>

      <div class="message-container">
        ${state.messages.length ? state.messages.map((m, i) => `
          <button class="message-row" data-open="${esc(m.id)}" data-source-key="${esc(m.key_id||'')}">
            <span class="vendor v${i%4}">${esc(m.name[0])}</span>
            <div style="text-align:left;">
              <h3 style="margin:0 0 4px; font-size:14px; color:var(--ink);">${esc(m.name)}</h3>
              <p style="margin:0; font-size:12px; color:var(--muted);">
                ${esc(m.source ? m.source + ' · ' : '')}
                ${m.mode === 'codes' ? 'Approved verification code is ready' : m.mode === 'links' ? 'Approved sign-in link is ready' : 'Plain-text message is ready to read'}
              </p>
            </div>
            <div class="message-right">
              <span class="badge ${m.mode==='codes'?'blue':m.mode==='links'?'green':''}">${modes[m.mode]||m.mode}</span>
              <small style="color:var(--muted); font-size:11px; margin-top:4px;">Click to view</small>
            </div>
          </button>
        `).join('') : `
          <div class="empty">
            ${icons.mail}
            <h3>No messages available yet</h3>
            <p>Trigger a new sign-in or verification email from an approved company, then click <strong>Refresh mail</strong>.</p>
          </div>
        `}
      </div>

      <div class="panel-footer">
        <span>${icons.shield} Access checked securely by server on every open</span>
        <span>Opening a message counts toward open limits; list refreshes do not</span>
      </div>
    </section>
  `;
}

async function load(){
  try{
    state = await api('state'+selector());
  }catch(error){
    if(selected && error.status===403){
      selected='';
      state=await api('state');
    } else {
      throw error;
    }
  }
  render();
}

async function refresh(all=false){
  const map=new Map();
  for(const k of state.connections||[]) if(!selected||k.id===selected) map.set(k.workspace_id||k.id,k.id);
  const ids=[...map.values()];
  const targets=all?ids:ids.length?[ids[syncIndex++%ids.length]]:[];
  let failed=false;
  for(let i=0;i<targets.length;i+=2){
    const results=await Promise.allSettled(targets.slice(i,i+2).map(k=>api('sync?key_id='+encodeURIComponent(k),'POST',{})));
    if(results.some(r=>r.status==='rejected'))failed=true;
  }
  return failed;
}

function toast(text){
  const el=$('#toast');
  if(!el)return;
  el.textContent=text;
  el.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('visible'),4000);
}

async function showMessage(id,keyId){
  const m=await api(`messages/${id}${keyId?'?key_id='+encodeURIComponent(keyId):selector()}`);
  openMessage=m;

  $('#shared-dialog').innerHTML=`
    <div class="dialog-head">
      <h2 id="shared-dialog-title" style="display:flex; align-items:center; gap:10px;">
        <span class="vendor v1" style="width:28px;height:28px;font-size:13px;">${esc(m.name[0])}</span>
        <span>${esc(m.name)}</span>
      </h2>
      <button class="icon-btn" data-close aria-label="Close message">${icons.close}</button>
    </div>
    <div class="dialog-body">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <span class="badge blue">${modes[m.mode]||m.mode}</span>
        <span style="font-size:12px; color:var(--muted);">${icons.clock} Auto-expires</span>
      </div>

      ${m.mode==='codes'? (
        m.code ? `
          <div class="code-display">
            <strong>${esc(m.code)}</strong>
            <small>APPROVED SIGN-IN CODE</small>
          </div>
          <button class="btn primary btn-full" data-copy="${esc(m.code)}">
            ${icons.copy}
            <span>Copy verification code</span>
          </button>
        ` : `
          <div class="notice amber">No single unambiguous code could be extracted. The raw email is protected.</div>
        `
      ) : m.mode==='links' ? (
        m.link ? `
          <div class="notice blue">This link matches the exact trusted hostname whitelisted by the owner.</div>
          <a class="btn primary btn-full" href="${esc(m.link)}" target="_blank" rel="noopener noreferrer">
            <span>Open approved sign-in link</span>
            ↗
          </a>
        ` : `
          <div class="notice amber">No single approved sign-in link is available.</div>
        `
      ) : `
        <h3 style="margin-top:20px; font-size:16px; color:var(--ink);">${esc(m.subject)}</h3>
        <p style="font-size:12px; color:var(--muted); margin:4px 0 14px;">From: ${esc(m.sender)}</p>
        <div class="message-text">${esc(m.text)}</div>
      `}

      <hr class="divider">
      <div class="privacy-note">
        ${icons.shield}
        <span>Keep codes and magic links private. Revoking access here does not end an already authenticated session in the target service.</span>
      </div>
    </div>
  `;

  $('#shared-dialog').showModal();
  if(state.max_views!==null){
    state.views=m.views;
    render();
  }
}

// Global submit handler
document.addEventListener('submit', async e=>{
  if(!['redeem-form','add-key-form'].includes(e.target.id))return;
  e.preventDefault();
  const form=e.target,button=form.querySelector('button[type="submit"]');
  if(button) button.disabled=true;

  try{
    const key=form.elements.key.value.trim();
    await api('redeem','POST',{key});
    form.elements.key.value='';
    selected='';
    if($('#shared-dialog').open)$('#shared-dialog').close();
    await load();
  }catch(error){
    const errEl=form.querySelector('.form-error');
    if(errEl) errEl.textContent=error.message;
  }finally{
    if(button) button.disabled=false;
  }
});

// Global click handler
document.addEventListener('click', async e=>{
  const el=e.target.closest('button');
  if(!el)return;

  try{
    if(el.hasAttribute('data-close')){
      $('#shared-dialog').close();
      openMessage=null;
    }
    if(el.dataset.copy){
      await navigator.clipboard.writeText(el.dataset.copy);
      toast('Verification code copied to clipboard!');
      const span = el.querySelector('span');
      if (span) {
        const orig = span.textContent;
        span.textContent = 'Copied!';
        setTimeout(() => { if (span) span.textContent = orig; }, 2000);
      }
    }
    if(el.hasAttribute('data-add-key')) addKey();
    if(el.hasAttribute('data-remove-key')){
      await api('forget','POST',{key_id:selected});
      selected='';
      await load();
      toast('Access key removed.');
    }
    if(el.dataset.open) await showMessage(el.dataset.open,el.dataset.sourceKey);
    if(el.hasAttribute('data-simulate-demo')){
      await api('simulate'+selector(),'POST',{});
      await load();
      toast('New simulated email received.');
    }
    if(el.hasAttribute('data-refresh')){
      el.disabled=true;
      const failed=await refresh(true);
      await load();
      toast(failed?'Some mailboxes could not refresh. Ask their owner to check connection.':'Shared inbox refreshed.');
    }
    if(el.hasAttribute('data-forget')){
      await api('logout','POST',{});
      entry();
      toast('Device session cleared.');
    }
  }catch(error){
    if(error.status===401) entry(error.message);
    else toast(error.message);
  }finally{
    el.disabled=false;
  }
});

$('#shared-dialog').addEventListener('close',()=>{openMessage=null;});

document.addEventListener('change',async e=>{
  if(e.target.id==='saved-access'){
    selected=e.target.value;
    try{
      await load();
    }catch(error){
      if(error.status===401) entry(error.message);
      else toast(error.message);
    }
  }
});

// Periodic background sync while tab is active
setInterval(async()=>{
  if(document.hidden||!state)return;
  if(openMessage?.expires_at<=Date.now()){
    $('#shared-dialog').close();
    openMessage=null;
    toast('This message has expired.');
  }
  if(!$('#shared-dialog').open){
    try{
      try{await refresh();}catch{}
      await load();
    }catch(error){
      if(error.status===401)entry(error.message);
    }
  }
},30000);

// Auto-redeem if key was provided in URL query (?key=mgk_...) or hash (#key=mgk_...)
const urlKey = new URLSearchParams(location.search).get('key') || (location.hash.startsWith('#key=') ? location.hash.slice(5) : null);
if (urlKey) {
  history.replaceState(null, '', location.pathname + (demo ? '?demo=1' : ''));
  api('redeem', 'POST', { key: urlKey })
    .then(() => load())
    .catch(err => entry(err.message));
} else {
  load().catch(error => entry(error.status === 401 ? '' : error.message));
}
