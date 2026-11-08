import {DemoAPI} from './demo.js';
import {getTheme, getThemeSetting, setThemeSetting} from './theme.js';
import {icon, iconPaths} from './components/icons.js';
import {openModal, closeModal} from './components/modal.js';
import {initDropdownSystem, initDropdowns} from './components/dropdown.js';
import {getCompanyLogo} from './components/logos.js';
import {
  renderSidebar,
  isSidebarCollapsed,
  toggleSidebarCollapse,
  toggleMobileSidebar,
  attachSidebarShortcuts
} from './components/sidebar.js';
import {
  esc,
  modes,
  ago,
  remain,
  initials,
  badge,
  vendor,
  btn,
  empty,
  heading,
  field,
  formFooter
} from './pages/common.js';
import {dashboardPage} from './pages/dashboard.js';
import {notFoundPage} from './pages/notFound.js';
import {inboxPage, messageList} from './pages/inbox.js';
import {mailboxesPage, openMailboxModal} from './pages/mailboxes.js';
import {rulesPage, ruleCard, openRuleModal, RULE_PRESETS} from './pages/rules.js';
import {peoplePage, openInviteModal, openGrantModal, openKeyModal, showKeyModal} from './pages/people.js';
import {activityPage} from './pages/activity.js';
import {profilePage, themeSelectionArea} from './pages/profile.js';

const $=s=>document.querySelector(s);
const paths=iconPaths;
const labels={dashboard:'Dashboard',mailboxes:'Connected Gmail accounts',inbox:'Shared inbox',rules:'Access rules',people:'People & Access',activity:'Activity log',profile:'Profile & Settings',signin:'Sign In'};

function detectPageFromUrl(){
  const pathname=location.pathname.toLowerCase().replace(/\/$/,'');
  const slug=pathname.split('/').pop()?.replace('.html','')||'';
  if(slug==='signin'||slug==='login')return 'signin';
  if(!slug||slug==='dashboard'||slug==='app')return 'dashboard';
  if(slug==='access'){location.replace('/access'+location.search+location.hash);return 'dashboard';}
  if(slug==='overview')return 'dashboard';
  if(slug==='keys')return 'people';
  if(slug==='settings')return 'profile';
  if(slug==='404'||slug==='notfound')return '404';
  if(labels[slug])return slug;
  const viewParam=new URLSearchParams(location.search).get('view');
  if(viewParam==='dashboard'||viewParam==='overview')return 'dashboard';
  if(viewParam==='keys')return 'people';
  if(viewParam==='settings')return 'profile';
  if(viewParam==='signin'||viewParam==='login')return 'signin';
  if(viewParam==='404'||viewParam==='notfound')return '404';
  if(viewParam&&labels[viewParam])return viewParam;
  if(new URLSearchParams(location.search).has('gmail'))return 'profile';
  if(viewParam)return '404';
  return 'dashboard';
}

function getPageRouteUrl(targetPage){
  const params=new URLSearchParams(location.search);
  const searchStr=params.toString()?`?${params.toString()}`:'';
  if(location.protocol==='file:'||(location.hostname.endsWith('github.io')&&location.pathname.endsWith('.html'))){
    return `${targetPage}.html${searchStr}`;
  }
  return `/${targetPage}${searchStr}`;
}

// Tab-specific lazy loading cache
const tabLoaded = {};
function resetLazyCache() {
  for (const k in tabLoaded) delete tabLoaded[k];
}

async function lazyLoadForTab(targetPage) {
  if (!state || !wid) return;

  switch (targetPage) {
    case 'inbox': {
      // Lazy load / sync email dispatches only when opening or viewing the inbox tab
      if (!demo && state.gmail_connected) {
        try {
          await request(scoped('gmail/sync'), 'POST', {});
          state = await request(scoped('state'));
          render();
        } catch {}
      }
      break;
    }
    case 'people': {
      // Lazy load access keys when viewing people & access
      if (state.owner && (!state.keys || !tabLoaded['keys'])) {
        try {
          const res = await request(scoped('keys'));
          state.keys = res.keys || [];
          tabLoaded['keys'] = true;
          render();
        } catch {}
      }
      break;
    }
    case 'activity': {
      // Lazy refresh audit events when opening activity log tab
      if (state.owner && !tabLoaded['activity']) {
        try {
          const fresh = await request(scoped('state'));
          state.events = fresh.events;
          tabLoaded['activity'] = true;
          render();
        } catch {}
      }
      break;
    }
  }
}

async function navigate(newPage,replace=false){
  page=newPage;
  query='';
  toggleMobileSidebar(false);
  try{window.scrollTo({top:0,left:0,behavior:'instant'});}catch{}
  const targetUrl=getPageRouteUrl(newPage);
  if(replace){history.replaceState({page:newPage},'',targetUrl);}
  else{history.pushState({page:newPage},'',targetUrl);}
  document.title=`${labels[page]||'Workspace'} · Mailgrant`;
  render();
  await lazyLoadForTab(newPage);
}

window.addEventListener('popstate',async()=>{
  const detected=detectPageFromUrl();
  if(detected!==page){
    page=detected;
    toggleMobileSidebar(false);
    try{window.scrollTo({top:0,left:0,behavior:'instant'});}catch{}
    document.title=`${labels[page]||'Workspace'} · Mailgrant`;
    render();
    await lazyLoadForTab(page);
  }
});

let demo=new URLSearchParams(location.search).get('demo')==='1'||location.hostname.endsWith('github.io'),api=demo?new DemoAPI():null;
let me,state,wid=new URLSearchParams(location.search).get('workspace')||'',page=detectPageFromUrl(),filter='all',query='',liveReady=false,selectedMessage=null;
const authMessages={denied:'Google access was cancelled. You can try connecting again.',expired:'Google sign-in expired. Start again.',state:'Google sign-in could not be verified. Start a fresh sign-in.',network:'Google could not be reached. Please retry.',exchange:'Google authorization failed. Check the OAuth client and redirect URL, then retry.',identity:'Google identity could not be verified. Please retry.',account:'Choose the Gmail already linked to this mailbox. Use Add Gmail for a different account.',consent:'Approve Gmail read-only access to connect this mailbox.',owner:'Your owner session expired. Sign in to the dashboard and retry.',workspace:'You no longer own this workspace.'};
authMessages.server='The Gmail connection could not be saved. Check the deployment configuration and retry.';
let authMessage=authMessages[new URLSearchParams(location.search).get('auth_error')]||'';
let inviteToken=location.hash.startsWith('#invite=')?location.hash.slice(8):sessionStorage.getItem('mailgrant-pending-invite');
if(inviteToken){sessionStorage.setItem('mailgrant-pending-invite',inviteToken);history.replaceState(null,'',location.pathname+location.search);}

async function request(path,method='GET',data){
  if(demo)return api.request(path,method,data);
  const response=await fetch(path,{method,credentials:'same-origin',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,cache:'no-store'});
  let json;try{json=await response.json();}catch{throw new Error('Live service is not connected here. Use the demo or follow the deployment guide.');}
  if(!response.ok)throw new Error(json.error||'The request could not be completed.');return json;
}

function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4200);}
function modal(title, html, options = {}) {
  openModal(title, html, options);
}

const scoped=route=>`/api/w/${wid}/${route}`;
function syncUserProfile(user){
  if(!user?.id)return;
  try{
    localStorage.removeItem(`mailgrant_avatar_${user.id}`);
  }catch{}
}
async function loadWorkspace(){
  state=await request(scoped('state'));
  if(state.owner && (page === 'keys' || page === 'people')){
    try {
      const res = await request(scoped('keys'));
      state.keys = res.keys || [];
      tabLoaded['keys'] = true;
    } catch {
      state.keys = state.keys || [];
    }
  }
  render();
}

async function boot(){
  attachSidebarShortcuts();
  initDropdownSystem();
  if(page==='signin'){
    document.title='Sign In · Mailgrant';
    document.body.classList.add('is-auth-screen');
    document.documentElement.classList.add('is-auth-screen');
    try{
      if(!demo&&!liveReady){
        liveReady=(await request('/api/config')).configured===true;
      }
    }catch{}
    renderLogin(authMessage);
    authMessage='';
    return;
  }
  try{
    if(!demo&&!liveReady){try{liveReady=(await request('/api/config')).configured===true;}catch{}if(!liveReady){renderLogin('Live mail is not configured yet. Set up Google sign-in and Cloudflare to connect your mailbox; the sample workspace works now.');return;}}
    me=await request('/api/me');
    syncUserProfile(me?.user);
    if(!me.workspaces.some(w=>w.id===wid))wid=me.workspaces[0]?.id||'';
    if(inviteToken&&!demo){const accepted=await request('/api/invitations/accept','POST',{token:inviteToken});inviteToken=null;sessionStorage.removeItem('mailgrant-pending-invite');wid=accepted.id;me=await request('/api/me');syncUserProfile(me?.user);toast('Invitation accepted. The workspace administrator can now grant company access.');}
    if(wid){
      await loadWorkspace();
      if(page==='inbox')await lazyLoadForTab('inbox');
    }else renderWelcome();
    if(authMessage){toast(authMessage);authMessage='';}
  }catch(error){
    if(!demo){
      page='signin';
      if(location.pathname!=='/signin'&&location.pathname!=='/login'){
        history.replaceState({page:'signin'},'','/signin'+(location.search||''));
      }
    }
    renderLogin(authMessage||error.message);
  }
}

function renderLogin(error=''){
  document.title='Sign In · Mailgrant';
  document.body.classList.add('is-auth-screen');
  document.documentElement.classList.add('is-auth-screen');
  $('#app').innerHTML=`
    <div class="auth-page-wrap">
      <main class="auth-main">
        <div class="auth-card">
          <!-- Glowing Top Accent Bar -->
          <div class="auth-card-accent-bar" aria-hidden="true"></div>

          <!-- Embedded Header Row inside Card -->
          <div class="auth-card-top-bar">
            <a class="brand" href="/" aria-label="Mailgrant Home">
              <span class="brand-mark">${icon('shield')}</span>
              <span class="brand-title">mailgrant</span>
            </a>
            <button type="button" class="btn small theme-pill-btn" data-theme-toggle aria-label="Toggle theme">
              ${icon('contrast')}
              <span>Theme</span>
            </button>
          </div>

          <!-- Hero Icon Badge -->
          <div class="auth-icon-badge" aria-hidden="true">
            ${icon('lock')}
          </div>

          <!-- Authentication Tag -->
          <div class="auth-pill-badge">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span>Workspace Authentication</span>
          </div>

          <!-- Title & Subtitle -->
          <h1 class="auth-title">Sign in to <span class="gradient-text">Workspace</span></h1>
          <p class="auth-subtitle">
            Manage your private email whitelists, generate revocable sharing keys, or accept an invitation. Your Google password stays with Google.
          </p>

          <!-- Security Trust Signals -->
          <div class="auth-trust-matrix">
            <span class="auth-trust-chip">
              <svg class="google-icon" viewBox="0 0 24 24" style="width:12px;height:12px;">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
              </svg>
              <span>OAuth 2.0 PKCE</span>
            </span>
            <span class="auth-trust-chip">
              ${icon('shield')}
              <span>Zero Passwords Shared</span>
            </span>
            <span class="auth-trust-chip">
              ${icon('key')}
              <span>Strict Boundary Isolation</span>
            </span>
          </div>

          <!-- Error Alert if present -->
          ${error ? `
            <div class="auth-notice-alert" role="alert">
              <span class="icon">${icon('shieldAlert')}</span>
              <div class="alert-text">${esc(error)}</div>
            </div>
          ` : ''}

          <!-- Main Actions -->
          <div class="auth-actions-group">
            ${liveReady ? `
              <a class="btn-google-auth" href="/auth/login">
                <svg class="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                </svg>
                <span>Continue with Google</span>
                <span class="auth-btn-arrow" aria-hidden="true">→</span>
              </a>
            ` : `
              <a class="btn-google-auth" href="/docs#build">
                <span>View deployment setup guide</span>
                <span class="auth-btn-arrow" aria-hidden="true">→</span>
              </a>
            `}
          </div>

          <!-- Recipient Direct Access Card -->
          <div class="auth-recipient-box">
            <div class="recipient-box-text">
              <strong>Have an access key from someone?</strong>
              <p>Direct zero-trust access. No Google account required.</p>
            </div>
            <a class="btn small primary" href="/access">
              <span>Open Portal →</span>
            </a>
          </div>

          <!-- Clean Footer Links -->
          <div class="auth-footer-links">
            <a href="/">Home</a>
            <span class="sep">·</span>
            <a href="/docs">Architecture Guide</a>
            <span class="sep">·</span>
            <a href="/privacy">Privacy Details</a>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderWelcome(){
  state=null;
  $('#app').innerHTML=`
    <div class="auth-page-wrap">
      <main class="auth-main">
        <div class="auth-card">
          <div class="auth-card-accent-bar" aria-hidden="true"></div>

          <!-- Embedded Header Row inside Card -->
          <div class="auth-card-top-bar">
            <a class="brand" href="/" aria-label="Mailgrant Home">
              <span class="brand-mark">${icon('shield')}</span>
              <span class="brand-title">mailgrant</span>
            </a>
            <button type="button" class="btn small theme-pill-btn" data-theme-toggle aria-label="Toggle theme">
              ${icon('contrast')}
              <span>Theme</span>
            </button>
          </div>

          <div class="auth-icon-badge" style="background:rgba(16, 185, 129, 0.12); color:#10b981; border-color:rgba(16, 185, 129, 0.25);" aria-hidden="true">
            ${icon('check')}
          </div>

          <div class="auth-pill-badge" style="background:rgba(16, 185, 129, 0.12); color:#10b981; border-color:rgba(16, 185, 129, 0.25);">
            <span class="pulse-dot" style="background:#10b981; box-shadow:0 0 8px #10b981;" aria-hidden="true"></span>
            <span>Google Account Authenticated</span>
          </div>

          <h1 class="auth-title">Welcome, <span class="gradient-text">${esc(me?.user?.name || 'Administrator')}</span></h1>
          <p class="auth-subtitle">
            Create your first workspace to connect a Gmail mailbox, configure approved sender rules, and issue sharing keys.
          </p>

          <div class="auth-trust-matrix">
            <span class="auth-trust-chip">
              ${icon('mail')}
              <span>${esc(me?.user?.email || '')}</span>
            </span>
            <span class="auth-trust-chip">
              ${icon('shield')}
              <span>Administrator</span>
            </span>
          </div>

          <div class="auth-actions-group">
            <button class="btn primary btn-full" data-action="add-gmail" style="height:48px; font-size:14px; font-weight:700;">
              ${icon('plus')}
              <span>Connect your first Gmail account</span>
            </button>
          </div>

          <div class="auth-footer-links">
            <a href="/">Home</a>
            <span class="sep">·</span>
            <a href="/docs">Guide</a>
            <span class="sep">·</span>
            <a href="/privacy">Privacy Details</a>
          </div>
        </div>
      </main>
    </div>
  `;
}

function render(){
  if(page==='signin'||!state){
    if(page==='signin'||!me?.user) return renderLogin();
    return renderWelcome();
  }
  document.body.classList.remove('is-auth-screen');
  document.documentElement.classList.remove('is-auth-screen');
  const owner=state.owner;
  if(!owner&&!['dashboard','overview','inbox','profile','404'].includes(page))page='dashboard';
  const sidebarHtml=renderSidebar({state,me,page,labels,wid,owner,demo});
  const isCollapsed=isSidebarCollapsed();
  $('#app').innerHTML=`
    <div class="shell ${isCollapsed?'sidebar-collapsed':''}">
      ${sidebarHtml}
      <div class="content">
        <!-- Minimal mobile-only navigation trigger -->
        <header class="mobile-topbar" aria-label="Mobile navigation">
          <button class="icon-btn mobile-menu" data-action="menu" aria-label="Toggle navigation" aria-expanded="false" aria-controls="workspace-nav">
            ${icon('menu')}
          </button>
          <div class="mobile-brand">
            <span class="brand-mark">${icon('shield')}</span>
            <span class="brand-name">mailgrant</span>
          </div>
          <button class="icon-btn" data-theme-toggle aria-label="Toggle light or dark mode">
            ${icon('contrast')}
          </button>
        </header>

        <main id="main" class="main clean-main">
          <div class="fade-in">${renderPage()}</div>
        </main>
      </div>
    </div>
  `;
  initDropdowns($('#main'));
}

function renderPage(){
  switch(page){
    case'dashboard':return dashboardPage({state,me});
    case'mailboxes':return mailboxesPage({state,me,demo});
    case'inbox':return inboxPage({state,demo,filter,query});
    case'rules':return rulesPage({state});
    case'people':return peoplePage({state,me,demo});
    case'activity':return activityPage({state});
    case'profile':return profilePage({state,me,demo});
    case'404':
    default:
      return notFoundPage({path:location.pathname+location.search});
  }
}

async function message(id){
  modal('Opening message…','<p>Checking your current permissions.</p>');
  try{
    const m=await request(scoped(`messages/${id}`));
    selectedMessage=m;

    function formatBodyWithLinks(text) {
      if (!text) return '<p style="color:var(--muted); font-style:italic;">No plain-text body content.</p>';
      const safe = esc(text);
      return safe.replace(/https:\/\/[^\s<>"')]+/g, url => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="body-url-link">${url}</a>`;
      });
    }

    const hasCode = Boolean(m.code);
    const hasLink = Boolean(m.link);

    const modeBadge = m.mode === 'codes' 
      ? badge(modes[m.mode] || 'Codes only', 'blue') 
      : m.mode === 'links' 
        ? badge(modes[m.mode] || 'Sign-in links', 'green') 
        : badge(modes[m.mode] || 'Full message', 'purple');

    const contentHtml = `
      ${modeBadge}
      <div class="meta-line"><span>Approved message</span><span id="message-expiry">${remain(m.expires_at)}</span></div>

      ${hasCode ? `
        <div class="code-display"><strong>${esc(m.code)}</strong><small>PRIVATE SIGN-IN CODE</small></div>
        <button class="btn primary btn-full" data-copy="${esc(m.code)}" style="margin-bottom:12px;">${icon('copy')}Copy code</button>
      ` : m.mode === 'codes' ? `
        <div class="notice amber">No unambiguous code could be extracted. The original email is not exposed with this permission.</div>
      ` : ''}

      ${hasLink ? `
        <div class="notice blue" style="margin-top:14px; margin-bottom:10px;">Only links to the exact hostname approved by the owner are available.</div>
        <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
          <a class="btn primary" href="${esc(m.link)}" target="_blank" rel="noopener noreferrer">${demo ? 'Open illustrative link' : 'Open sign-in link'} ${icon('arrow')}</a>
          <button type="button" class="btn outline small" data-copy="${esc(m.link)}">${icon('copy')}Copy link</button>
        </div>
      ` : m.mode === 'links' ? `
        <div class="notice amber" style="margin-top:14px;">No single approved sign-in link could be extracted.</div>
      ` : ''}

      ${m.mode === 'read' ? `
        <div style="margin-top:${(hasCode || hasLink) ? '18px' : '10px'}; border-top:${(hasCode || hasLink) ? '1px solid var(--line)' : 'none'}; padding-top:${(hasCode || hasLink) ? '14px' : '0'};">
          <h3 style="margin:0 0 6px; font-size:16px; color:var(--ink);">${esc(m.subject || 'No Subject')}</h3>
          <p style="font-size:12px; color:var(--muted); margin:0 0 12px;">From: <strong>${esc(m.sender || 'Unknown')}</strong></p>
          <div class="message-text" style="white-space:pre-wrap; word-break:break-word; max-height:300px; overflow-y:auto; background:var(--bg-subtle); padding:12px; border-radius:var(--radius-md); border:1px solid var(--line);">
            ${formatBodyWithLinks(m.text)}
          </div>
        </div>
      ` : ''}

      <hr class="divider">
      <p style="font-size:12px; color:var(--muted); margin:0;">Codes and links can grant access to the service’s account. Removing a member here does not end a session already created there.</p>
    `;

    modal(m.name, contentHtml, { customIconHtml: getCompanyLogo(m.name, 48) });
  }catch(e){
    selectedMessage=null;
    modal('Message unavailable',`<p>${esc(e.message)}</p>${btn('Close','close')}`);
  }
}

function confirmAction(title,text,action){
  modal(title,`<p>${esc(text)}</p><div class="dialog-actions">${btn('Cancel','close')}${btn('Confirm',action,'danger')}</div>`);
}

async function mutate(route,method='POST',data,success='Saved.'){
  await request(scoped(route),method,data);
  closeModal();
  selectedMessage=null;
  if(route.startsWith('gmail/')){me=await request('/api/me');syncUserProfile(me?.user);}
  await loadWorkspace();
  toast(success);
}

window.mailgrantLogout = async () => {
  try {
    if (demo) {
      location.href = '/signin';
      return;
    }
    await request('/api/logout', 'POST', {});
  } catch (err) {
    console.warn('Logout exception:', err);
  } finally {
    location.href = '/signin';
  }
};

async function handleAction(action,el){
  switch(action){
    case'close':closeModal();selectedMessage=null;break;
    case'toggle-sidebar':toggleSidebarCollapse();break;
    case'menu':toggleMobileSidebar();break;
    case'close-menu':toggleMobileSidebar(false);break;
    case'workspace-picker':
      modal('Choose workspace', `<div class="mg-workspace-list">${me.workspaces.map(w=>`<button type="button" class="mg-workspace-card-btn ${w.id===wid?'active':''}" data-switch-workspace="${esc(w.id)}"><span class="square-avatar">${esc((w.name&&w.name[0])?w.name[0].toUpperCase():'W')}</span><div><strong style="color:var(--ink);font-size:13px;display:block;">${esc(w.name)}</strong>${w.mailbox_email?`<small style="color:var(--muted);font-size:11px;">${esc(w.mailbox_email)}</small>`:''}</div>${w.id===wid?`<span class="active-badge">Active</span>`:''}</button>`).join('')}</div>`, { subtitle: 'Select an active workspace to manage its inboxes, rules, and settings.' });
      break;
    case'refresh':if(!demo&&state.gmail_connected)await request(scoped('gmail/sync'),'POST',{});await loadWorkspace();toast('Workspace refreshed.');break;
    case'invite':openInviteModal(modal);break;
    case'add-gmail':openMailboxModal({me,demo,modal});break;
    case'key':openKeyModal({state,modal,toast});break;
    case'rule':openRuleModal(modal, state);break;
    case'trigger-avatar-upload':{const input=$('#avatar-file-input');if(input)input.click();break;}
    case'remove-avatar':{
      if(demo){if(me?.user)delete me.user.avatar;render();toast('Profile photo removed.');break;}
      try{
        await request('/api/avatar','DELETE');
        if(me?.user)delete me.user.avatar;
        render();
        toast('Profile photo removed.');
      }catch(err){toast(err.message);}
      break;
    }
    case'revoke-current-session':{
      modal('Revoke active session?', '<p>This will sign out your current session on this device and return you to sign-in.</p><div class="dialog-actions">' + btn('Cancel','close') + btn('Revoke & Sign out', 'confirm-revoke-current-session', 'danger') + '</div>');
      break;
    }
    case'confirm-revoke-current-session':{
      $('#dialog').close();
      await handleAction('logout');
      break;
    }
    case'gmail-connect':if(demo){modal('Gmail connection in live mode','<p>In the live app, this opens Google’s read-only Gmail consent screen. No real account is connected in the sample workspace.</p><div class="notice amber">The app receives mailbox-wide read permission from Google. Your invitees still receive only the content allowed by your rules.</div><button class="btn primary" data-action="demo-gmail-connect">Simulate Gmail connection</button>');break;}else{const result=await request(scoped('gmail/connect'),'POST',{});location.assign(result.url);break;}
    case'demo-gmail-connect':await mutate('gmail/connect','POST',{},'Sample Gmail connection enabled. No real account connected.');break;
    case'gmail-disconnect':confirmAction('Disconnect Gmail?','This removes the stored Gmail credential from this workspace and stops syncing. Retained messages expire normally. You can also revoke the app in your Google Account connections.','confirm-gmail-disconnect');break;
    case'confirm-gmail-disconnect':await mutate('gmail/disconnect','POST',{},'Gmail disconnected.');break;
    case'workspace':modal('Create a private workspace',`<p>Each workspace has its own receiving address, rules, members, and message history.</p><form id="workspace-form">${field('Workspace name','name','e.g. Personal workspace','required minlength="2" maxlength="60"')}${formFooter('Create workspace')}</form>`);break;
    case'logout':await window.mailgrantLogout();break;
    case'reset':api.reset();wid='personal';await navigate('dashboard',true);await boot();toast('Sample workspace reset.');break;
    case'simulate':api.simulate(wid);await loadWorkspace();toast('New sample email received.');break;
    case'setup':{const setup=await request(scoped('setup'));modal('Gmail forwarding confirmation',`<p>Administrator setup message. Enter the code or use the confirmation instructions in Gmail.</p><p class="message-text">${esc(setup.text)}</p><div class="notice">Do not enable global forwarding. Create a filter for each approved sender instead.</div>`);break;}
    case'rotate':confirmAction('Rotate receiving address?','The old address will stop receiving mail. You must verify the new address and update your Gmail filters.','confirm-rotate');break;
    case'confirm-rotate':await mutate('mailbox/rotate','POST',{},'Receiving address rotated. Update Gmail forwarding.');break;
    case'purge':confirmAction('Delete retained messages?','This deletes the messages currently stored in this workspace. It does not delete originals in Gmail.','confirm-purge');break;
    case'confirm-purge':await mutate('messages','DELETE',undefined,'Retained messages deleted.');break;
    case'delete-workspace':modal('Delete this workspace',`<p>Members, rules, retained messages, and workspace history will be deleted. Remove its forwarding filters in Gmail too.</p><form id="delete-form">${field(`Type “${esc(state.workspace.name)}” to confirm`,'name','','required')}${formFooter('Delete workspace')}</form>`);break;
    case'export':{const data={workspace:state.workspace.name,exported_at:new Date().toISOString(),rules:state.rules.map(({name,sender,subject_contains,mode,retention_minutes,link_host,enabled})=>({name,sender,subject_contains,mode,retention_minutes,link_host,enabled})),permissions:state.grants.map(g=>({person:state.members.find(m=>m.id===g.user_id)?.email,rule:state.rules.find(r=>r.id===g.rule_id)?.name,mode:g.mode,expires_at:g.expires_at}))};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='mailgrant-configuration.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Configuration downloaded.');break;}
    case'export-audit':{
      const data={workspace:state.workspace?.name||'Workspace',exported_at:new Date().toISOString(),event_count:(state.events||[]).length,events:state.events||[]};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');
      a.href=url;a.download=`mailgrant-audit-trail-${new Date().toISOString().slice(0,10)}.json`;
      a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast('Audit trail log downloaded.');
      break;
    }
    case'refresh-audit':{
      delete tabLoaded['activity'];
      await lazyLoadForTab('activity');
      toast('Audit trail refreshed.');
      break;
    }
  }
}

document.addEventListener('click',async e=>{
  const el=e.target.closest('button,a,[data-page],[data-action],[data-message],[data-filter]');if(!el)return;
  try{
    if(el.dataset.action==='logout'||el.closest('[data-action="logout"]')){await window.mailgrantLogout();return;}
    if(el.dataset.openMailbox){wid=el.dataset.openMailbox;toggleMobileSidebar(false);await navigate('profile');await loadWorkspace();return;}
    if(el.dataset.switchWorkspace){wid=el.dataset.switchWorkspace;resetLazyCache();toggleMobileSidebar(false);closeModal();await navigate('dashboard');await loadWorkspace();return;}
    if(el.dataset.page){toggleMobileSidebar(false);await navigate(el.dataset.page);return;}
    if(el.dataset.message){await message(el.dataset.message);return;}
    if(el.dataset.filter){filter=el.dataset.filter;render();return;}
    if(el.dataset.copy){await navigator.clipboard.writeText(el.dataset.copy);toast('Copied to clipboard.');return;}
    if(el.dataset.toggleRule){const rule=state.rules.find(r=>r.id===el.dataset.toggleRule);await mutate(`rules/${rule.id}`,'PATCH',{enabled:!rule.enabled},rule.enabled?'Rule paused.':'Rule resumed.');return;}
    if(el.dataset.editRule){const rule=state.rules.find(r=>r.id===el.dataset.editRule);if(rule)openRuleModal(modal,state,rule);return;}
    if(el.dataset.applyPreset){const preset=RULE_PRESETS.find(p=>p.id===el.dataset.applyPreset);if(preset)openRuleModal(modal,state,null,preset);return;}
    if(el.dataset.syncPreset){const preset=RULE_PRESETS.find(p=>p.id===el.dataset.syncPreset);if(preset){await mutate('rules','POST',{name:preset.name,sender:preset.sender,subject_contains:preset.subject_contains||'',mode:preset.mode,link_host:preset.link_host||'',retention_minutes:preset.retention_minutes},`${preset.name} access rule activated.`);}return;}
    if(el.dataset.syncStarterRules){
      const starter=RULE_PRESETS.filter(p=>['claude','google','github','notion'].includes(p.id));
      const toAdd=starter.filter(p=>!state.rules.some(r=>r.name.toLowerCase()===p.name.toLowerCase()||r.sender.toLowerCase()===p.sender.toLowerCase()));
      if(!toAdd.length){toast('Starter rules are already active in this workspace.');return;}
      for(const preset of toAdd){
        await request(scoped('rules'),'POST',{name:preset.name,sender:preset.sender,subject_contains:preset.subject_contains||'',mode:preset.mode,link_host:preset.link_host||'',retention_minutes:preset.retention_minutes});
      }
      await loadWorkspace();
      toast(`Activated ${toAdd.length} recommended access rules.`);
      return;
    }
    if(el.dataset.deleteRule){const rid=el.dataset.deleteRule;modal('Delete access rule?',`<p>Its retained messages and member permissions will also be deleted.</p><div class="dialog-actions">${btn('Cancel','close')}<button class="btn danger" data-confirm-delete-rule="${esc(rid)}">Delete rule</button></div>`);return;}
    if(el.dataset.confirmDeleteRule){await mutate(`rules/${el.dataset.confirmDeleteRule}`,'DELETE',undefined,'Rule deleted.');return;}
    if(el.dataset.grantMember){openGrantModal({state,memberId:el.dataset.grantMember,ruleId:el.dataset.grantRule,modal});return;}
    if(el.dataset.remove){modal('Remove this person?',`<p>They will lose all workspace permissions on their next request. Previously copied codes and sessions in other services cannot be recalled.</p><div class="dialog-actions">${btn('Cancel','close')}<button class="btn danger" data-confirm-remove="${esc(el.dataset.remove)}">Remove member</button></div>`);return;}
    if(el.dataset.confirmRemove){await mutate(`members/${el.dataset.confirmRemove}`,'DELETE',undefined,'Member removed.');return;}
    if(el.dataset.revokeKey){modal('Revoke this access key?',`<p>All browsers using this key will lose access on their next request. Copied codes and existing service sessions cannot be recalled.</p><div class="dialog-actions">${btn('Cancel','close')}<button class="btn danger" data-confirm-revoke-key="${esc(el.dataset.revokeKey)}">Revoke key</button></div>`);return;}
    if(el.dataset.confirmRevokeKey){
      delete tabLoaded['keys'];
      await mutate(`keys/${el.dataset.confirmRevokeKey}`,'DELETE',undefined,'Access key revoked on all devices.');
      return;
    }
    if(el.dataset.revokeInvite){await mutate(`invitations/${el.dataset.revokeInvite}`,'DELETE',undefined,'Invitation revoked.');return;}
    if(el.dataset.resendInvite){
      const email=el.dataset.resendInvite;
      const oldId=el.dataset.inviteId;
      try{if(oldId)await request(scoped(`invitations/${oldId}`),'DELETE');}catch{}
      const result=await request(scoped('invitations'),'POST',{email});
      await loadWorkspace();
      modal('Your invitation is ready',`<p>A fresh invitation link was generated for <strong>${esc(email)}</strong>. It can be used once by that Google account and expires in 48 hours.</p><div class="copy-box"><code>${esc(result.url)}</code><button class="icon-btn" data-copy="${esc(result.url)}" aria-label="Copy invitation link">${icon('copy')}</button></div><div class="notice">${demo?'This is an illustrative invitation. Use “Accept in demo” in People to continue the demonstration.':'Share this fresh link privately with your invitee.'}</div>`);
      toast('Fresh invitation link generated.');
      return;
    }
    if(el.dataset.acceptDemo){await mutate(`accept-demo/${el.dataset.acceptDemo}`,'POST',{},'Sample invitation accepted. Set their permissions next.');return;}
    if(el.dataset.peopleTab){
      const tabName=el.dataset.peopleTab;
      try{localStorage.setItem('mailgrant_people_tab',tabName);}catch{}
      document.querySelectorAll('[data-people-tab]').forEach(b=>b.classList.toggle('active',b===el));
      
      const btnInvite=document.getElementById('btn-header-invite');
      const btnKey=document.getElementById('btn-header-key');
      const btnPortal=document.getElementById('btn-header-portal');
      if(btnInvite)btnInvite.style.display=tabName==='direct'?'none':'inline-flex';
      if(btnKey)btnKey.style.display=tabName==='platform'?'none':'inline-flex';
      if(btnPortal)btnPortal.style.display=tabName==='direct'?'inline-flex':'none';

      const banner=document.getElementById('dedicated-tab-banner');
      if(banner){
        if(tabName==='direct'){
          banner.innerHTML=`
            <div class="banner-content">
              <strong>⚡ Direct Access (No Login Required):</strong>
              Recipients open their sandboxed inbox at <code>/access</code> using a passwordless access key or 1-click magic link. Access is stored encrypted in device session cookies. Expired tokens automatically delete from the list and database 5 days post-expiration.
            </div>
          `;
        }else if(tabName==='platform'){
          banner.innerHTML=`
            <div class="banner-content">
              <strong>🛡️ Platform Verified Accounts:</strong>
              Team members authenticated through Google Workspace / Gmail OAuth sign-in. Subdomain filters and company rules are granted and audited per individual account.
            </div>
          `;
        }else{
          banner.innerHTML=`
            <div class="banner-content">
              <strong>🌐 Complete Access Distribution Hub:</strong>
              Overview of both Direct Passwordless Keys (5-day auto-purge retention) and Verified Google Platform Members.
            </div>
          `;
        }
      }

      const q=(document.getElementById('people-search-input')?.value||'').toLowerCase().trim();
      const activeFilter=document.querySelector('[data-filter-people].active')?.dataset.filterPeople||'all';
      let visibleCount=0;
      document.querySelectorAll('#people-table-body tr, #people-grid-container .unified-person-card').forEach(item=>{
        const type=item.dataset.personFilterType;
        const distType=item.dataset.personDistributionType;
        const searchData=(item.dataset.personSearch||'').toLowerCase();
        const matchTab=tabName==='all'||distType===tabName;
        const matchFilter=activeFilter==='all'||type===activeFilter;
        const matchSearch=!q||searchData.includes(q);
        const isVisible=matchTab&&matchFilter&&matchSearch;
        if(item.tagName==='TR'){
          item.style.display=isVisible?'':'none';
        }else{
          item.style.display=isVisible?'flex':'none';
        }
        if(isVisible)visibleCount++;
      });
      const emptyNotice=document.getElementById('people-no-results');
      if(emptyNotice)emptyNotice.style.display=visibleCount===0?'block':'none';
      return;
    }
    if(el.dataset.filterPeople){
      const filterType=el.dataset.filterPeople;
      let activeTab=document.querySelector('[data-people-tab].active')?.dataset.peopleTab||'all';

      // If user selected a filter that belongs to another tab, adapt the active tab
      if(filterType==='keys' && activeTab==='platform'){
        activeTab='direct';
        document.querySelectorAll('[data-people-tab]').forEach(b=>b.classList.toggle('active',b.dataset.peopleTab==='direct'));
      }else if((filterType==='members'||filterType==='invites') && activeTab==='direct'){
        activeTab='platform';
        document.querySelectorAll('[data-people-tab]').forEach(b=>b.classList.toggle('active',b.dataset.peopleTab==='platform'));
      }

      document.querySelectorAll('[data-filter-people]').forEach(b=>b.classList.toggle('active',b===el));
      const q=(document.getElementById('people-search-input')?.value||'').toLowerCase().trim();
      let visibleCount=0;
      document.querySelectorAll('#people-table-body tr, #people-grid-container .unified-person-card').forEach(item=>{
        const type=item.dataset.personFilterType;
        const distType=item.dataset.personDistributionType;
        const searchData=(item.dataset.personSearch||'').toLowerCase();
        const matchTab=activeTab==='all'||distType===activeTab;
        const matchType=filterType==='all'||type===filterType;
        const matchSearch=!q||searchData.includes(q);
        const isVisible=matchTab&&matchType&&matchSearch;
        if(item.tagName==='TR'){
          item.style.display=isVisible?'':'none';
        }else{
          item.style.display=isVisible?'flex':'none';
        }
        if(isVisible)visibleCount++;
      });
      const emptyNotice=document.getElementById('people-no-results');
      if(emptyNotice)emptyNotice.style.display=visibleCount===0?'block':'none';
      return;
    }
    if(el.dataset.setView){
      const viewMode=el.dataset.setView;
      try{localStorage.setItem('mailgrant_people_view',viewMode);}catch{}
      document.querySelectorAll('[data-set-view]').forEach(b=>b.classList.toggle('active',b.dataset.setView===viewMode));
      const tableEl=document.getElementById('people-table-container');
      const cardsEl=document.getElementById('people-grid-container');
      if(tableEl&&cardsEl){
        if(viewMode==='cards'){
          tableEl.style.display='none';
          cardsEl.style.display='grid';
        }else{
          tableEl.style.display='block';
          cardsEl.style.display='none';
        }
      }
      return;
    }
    if(el.dataset.filterActivity){
      const filterType=el.dataset.filterActivity;
      document.querySelectorAll('[data-filter-activity]').forEach(b=>b.classList.toggle('active',b===el));
      const q=(document.getElementById('activity-search-input')?.value||'').toLowerCase().trim();
      let visibleCount=0;
      document.querySelectorAll('#activity-timeline-feed .activity-timeline-item').forEach(item=>{
        const cat=item.dataset.activityFilter;
        const searchData=(item.dataset.activitySearch||'').toLowerCase();
        const matchCat=filterType==='all'||cat===filterType;
        const matchSearch=!q||searchData.includes(q);
        const isVisible=matchCat&&matchSearch;
        item.style.display=isVisible?'flex':'none';
        if(isVisible)visibleCount++;
      });
      const emptyNotice=document.getElementById('activity-no-results');
      if(emptyNotice)emptyNotice.style.display=visibleCount===0?'block':'none';
      return;
    }
    if(el.dataset.action)await handleAction(el.dataset.action,el);
  }catch(err){toast(err.message);}
});

document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('.sidebar-account,[data-page],.workspace-card,[data-message]')){
    e.preventDefault();
    e.target.click();
  }
});

document.addEventListener('change',async e=>{
  try{
    if(e.target.id==='avatar-file-input'){
      const file=e.target.files?.[0];
      if(!file)return;
      if(!file.type.startsWith('image/')){toast('Please select a valid image file.');return;}
      if(file.size>2*1024*1024){toast('Image file must be under 2MB.');return;}
      if(demo){
        const reader=new FileReader();
        reader.onload=()=>{
          if(me?.user)me.user.avatar=reader.result;
          render();
          toast('Profile photo updated (demo mode).');
        };
        reader.readAsDataURL(file);
        return;
      }
      toast('Uploading photo…');
      try{
        const res=await fetch('/api/avatar',{
          method:'PUT',
          headers:{'content-type':file.type},
          body:file
        });
        if(!res.ok){
          const err=await res.json().catch(()=>({}));
          throw new Error(err.error||'Failed to upload photo.');
        }
        const data=await res.json();
        if(me?.user)me.user.avatar=data.avatar;
        render();
        toast('Profile photo updated.');
      }catch(err){toast(err.message);}
      return;
    }
    if(e.target.id==='workspace-select'){wid=e.target.value;await navigate('dashboard');await loadWorkspace();}
    if(e.target.id==='demo-viewer'){if((e.target.value==='owner')!==(me.user.id==='demo-owner'))api.switchViewer();wid='personal';await navigate('dashboard',true);await boot();}
  }catch(err){toast(err.message);}
});

document.addEventListener('themechange',()=>{
  if(page==='signin'||document.body.classList.contains('is-auth-screen')||!state){
    return;
  }
  render();
});

document.addEventListener('input',e=>{
  if(e.target.id==='inbox-search'){
    query=e.target.value;
    const filtered=state.messages.filter(m=>(filter==='all'||m.mode===filter)&&m.name.toLowerCase().includes(query.toLowerCase()));
    $('#message-list').innerHTML=messageList(filtered,state);
  }
  if(e.target.id==='people-search-input'){
    const q=e.target.value.toLowerCase().trim();
    const activeTab=document.querySelector('[data-people-tab].active')?.dataset.peopleTab||'direct';
    const activeFilter=document.querySelector('[data-filter-people].active')?.dataset.filterPeople||'all';
    let visibleCount=0;
    document.querySelectorAll('#people-table-body tr, #people-grid-container .unified-person-card').forEach(item=>{
      const type=item.dataset.personFilterType;
      const distType=item.dataset.personDistributionType;
      const searchData=(item.dataset.personSearch||'').toLowerCase();
      const matchTab=activeTab==='all'||distType===activeTab;
      const matchFilter=activeFilter==='all'||type===activeFilter;
      const matchSearch=!q||searchData.includes(q);
      const isVisible=matchTab&&matchFilter&&matchSearch;
      if(item.tagName==='TR'){
        item.style.display=isVisible?'':'none';
      }else{
        item.style.display=isVisible?'flex':'none';
      }
      if(isVisible)visibleCount++;
    });
    const emptyNotice=document.getElementById('people-no-results');
    if(emptyNotice)emptyNotice.style.display=visibleCount===0?'block':'none';
  }
  if(e.target.id==='activity-search-input'){
    const q=e.target.value.toLowerCase().trim();
    const activeFilter=document.querySelector('[data-filter-activity].active')?.dataset.filterActivity||'all';
    let visibleCount=0;
    document.querySelectorAll('#activity-timeline-feed .activity-timeline-item').forEach(item=>{
      const cat=item.dataset.activityFilter;
      const searchData=(item.dataset.activitySearch||'').toLowerCase();
      const matchCat=activeFilter==='all'||cat===activeFilter;
      const matchSearch=!q||searchData.includes(q);
      const isVisible=matchCat&&matchSearch;
      item.style.display=isVisible?'flex':'none';
      if(isVisible)visibleCount++;
    });
    const emptyNotice=document.getElementById('activity-no-results');
    if(emptyNotice)emptyNotice.style.display=visibleCount===0?'block':'none';
  }
});

document.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target,b=Object.fromEntries(new FormData(form)),submit=form.querySelector('[type=submit]');
  if(submit.disabled)return;
  submit.disabled=true;
  form.querySelector('.form-error').textContent='';
  try{
    if(form.id==='profile-form'){
      const newName=b.name?.trim();
      if(!newName)throw new Error('Please enter a display name.');
      if(demo){
        if(me?.user)me.user.name=newName;
        render();
        toast('Profile details updated.');
        return;
      }
      await request('/api/profile','PATCH',{name:newName});
      if(me?.user)me.user.name=newName;
      if(state?.members){const member=state.members.find(m=>m.id===me.user.id);if(member)member.name=newName;}
      render();
      toast('Profile details saved.');
      return;
    }
    if(form.id==='mailbox-form'){
      const created=await request('/api/workspaces','POST',{name:b.name});
      wid=created.id;
      await navigate('profile',true);
      if(demo){await request(scoped('gmail/connect'),'POST',{email:b.demo_email||'sample-mailbox@example.com'});$('#dialog').close();await boot();toast('Sample mailbox linked.');}
      else{const result=await request(scoped('gmail/connect'),'POST',{});location.assign(result.url);}
    }
    if(form.id==='workspace-form'){
      const result=await request('/api/workspaces','POST',b);
      wid=result.id;
      $('#dialog').close();
      await navigate('profile',true);
      await boot();
      toast('Private workspace created.');
    }
    if(form.id==='rule-form'){
      b.retention_minutes=Number(b.retention_minutes);
      b.sender=b.sender.toLowerCase();
      b.link_host=b.link_host.toLowerCase();
      if(b.mode==='links'&&!b.link_host)throw new Error('Enter the exact hostname allowed for sign-in links.');
      if(form.dataset.ruleId){
        await mutate(`rules/${form.dataset.ruleId}`,'PATCH',b,`${b.name} access rule updated.`);
      } else {
        await mutate('rules','POST',b,'Access rule created. Receive a new matching email and refresh.');
      }
    }
    if(form.id==='invite-form'){const result=await request(scoped('invitations'),'POST',{email:b.email.toLowerCase()});await loadWorkspace();modal('Your invitation is ready',`<p>Share this link privately with <strong>${esc(b.email)}</strong>. It can be used once by that Google account and expires in 48 hours.</p><div class="copy-box"><code>${esc(result.url)}</code><button class="icon-btn" data-copy="${esc(result.url)}" aria-label="Copy invitation link">${icon('copy')}</button></div><div class="notice">${demo?'This is an illustrative invitation. Use “Accept in demo” in People to continue the demonstration.':'No email has been sent. Copy the link and share it with your invitee.'}</div>`);}
    if(form.id==='key-form'){const scopes=[...form.querySelectorAll('[data-key-rule]')].filter(s=>s.value!=='blocked').map(s=>({rule_id:s.dataset.keyRule,mode:s.value,subdomain:form.querySelector(`[data-key-subdomain="${s.dataset.keyRule}"]`)?.value?.trim()||'*'}));if(!scopes.length)throw new Error('Choose at least one company permission.');const accent=(typeof document!=='undefined'&&document.documentElement?.dataset?.accent)||'cyan';const result=await request(scoped('keys'),'POST',{name:b.name,scopes,expires_at:Number(b.duration)?Date.now()+Number(b.duration)*3600000:null,max_views:b.max_views?Number(b.max_views):null,accent});delete tabLoaded['keys'];await loadWorkspace();showKeyModal({result,modal});}
    if(form.id==='grant-form'){await mutate('grants','PUT',{rule_id:form.dataset.rule,user_id:form.dataset.member,mode:b.mode,subdomain:b.subdomain||'*',expires_at:Number(b.duration)?Date.now()+Number(b.duration)*3600000:null},'Permission updated for future messages.');}
    if(form.id==='delete-form'){if(b.name!==state.workspace.name)throw new Error('The workspace name does not match.');await request(scoped('workspace'),'DELETE',b);$('#dialog').close();wid='';await navigate('dashboard',true);await boot();toast('Workspace deleted.');}
  }catch(err){
    const error=form.querySelector('.form-error');
    if(error?.isConnected)error.textContent=err.message;
    else toast(err.message);
  }finally{
    submit.disabled=false;
  }
});

$('#dialog').addEventListener('close',()=>{selectedMessage=null;});

setInterval(async()=>{
  if(selectedMessage){
    if(selectedMessage.expires_at<=Date.now()){modal('Message expired','<p>This message has reached its retention limit and is no longer available.</p>');selectedMessage=null;}
    else if($('#message-expiry'))$('#message-expiry').textContent=remain(selectedMessage.expires_at);
  }
  // Only poll and sync when actively viewing the Shared Inbox screen
  if(page==='inbox' && state && !$('#dialog').open && !$('.sidebar.open') && !$('.sidebar.mobile-open') && !document.hidden && !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){
    try{
      if(!demo&&state.gmail_connected)await request(scoped('gmail/sync'),'POST',{});
      await loadWorkspace();
    }catch{
      try{await loadWorkspace();}catch{state=null;renderLogin('Workspace access has changed. Sign in again to continue.');}
    }
  }
},30000);

boot();
