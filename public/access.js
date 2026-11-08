import { setAccent, getTheme } from './theme.js';
import { DemoAPI } from './demo.js';
import { renderDropdown, initDropdownSystem } from './components/dropdown.js';
import { openModal, closeModal } from './components/modal.js';
import { getCompanyLogo } from './components/logos.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

// Initialize universal dropdown delegation
initDropdownSystem();

const demo = new URLSearchParams(location.search).get('demo') === '1';
const demoApi = demo ? new DemoAPI() : null;
const modes = { codes: 'Codes only', links: 'Sign-in links', read: 'Full message' };
let state = null;
let openMessage = null;
let selected = '';
let syncIndex = 0;
let activeFilter = 'all'; // 'all' | 'codes' | 'links' | 'read'
let searchQuery = '';

// Auto-adopt sender's theme accent from URL parameters (?accent=red or #...&accent=purple)
const rawHash = location.hash || '';
const rawSearch = location.search || '';
const accentParamMatch = rawSearch.match(/[?&]accent=([a-z]+)/) || rawHash.match(/[#&]accent=([a-z]+)/);
if (accentParamMatch && accentParamMatch[1]) {
  setAccent(accentParamMatch[1], false);
}

// SVG Icons
const icons = {
  key: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`,
  shield: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  lock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  contrast: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor"/></svg>`,
  refresh: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  plus: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  trash: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  logout: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  copy: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  check: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  close: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  clock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  mail: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  search: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`
};

async function api(path, method = 'GET', body) {
  if (demo) return demoApi.shared(path, method, body);
  const r = await fetch(`/api/shared/${path}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try {
    data = await r.json();
  } catch {
    throw new Error('Live sharing is not configured here. Ask the workspace administrator for their deployed application URL.');
  }
  if (!r.ok) {
    const error = new Error(data.error || 'Could not open shared access.');
    error.status = r.status;
    throw error;
  }
  return data;
}

function entry(error = '') {
  state = null;
  openMessage = null;
  closeModal();
  document.body.classList.add('is-unauthenticated-portal');

  $('#shared-app').innerHTML = `
    <section class="intro card-hero">
      <!-- Card Embedded Header: Brand + Theme Toggle -->
      <div class="card-hero-head">
        <a class="card-hero-brand" href="/" aria-label="Mailgrant Home">
          <span class="card-hero-brand-mark" aria-hidden="true">
            <img src="/images/mailgrant-mark.png" alt="Mailgrant" class="brand-mark-img" width="28" height="28" />
          </span>
          <span class="card-hero-brand-title">Mail<span class="brand-gradient-text">grant</span></span>
          <span class="recipient-tag">RECIPIENT</span>
        </a>
        <button type="button" class="btn small theme-pill-btn" data-theme-toggle aria-label="Toggle theme">
          ${icons.contrast}
          <span>Theme</span>
        </button>
      </div>

      <div class="entry-lock-glow-wrap" aria-hidden="true">
        ${icons.lock}
      </div>

      <div class="intro-badge">
        ${icons.key}
        <span>Recipient Access Portal</span>
      </div>

      <h1 class="page-title intro-heading">Your Shared Inbox</h1>
      <p class="intro-desc">
        Enter the Mailgrant access key provided by the workspace administrator. You do not need their Gmail password, credentials, or Google account sign-in.
      </p>

      ${demo ? `
        <div class="notice blue">
          <strong>Interactive Demo Mode:</strong> You can test with a sample key from the admin console or use <code>mgk_sample_contractor</code>.
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
          <small>The raw key is cryptographically exchanged once for an isolated session and is never stored in plain text.</small>
        </div>
        <p class="form-error" role="alert">${esc(error)}</p>
        <button class="btn primary btn-full" type="submit">
          <span>Open Shared Inbox</span>
          ${icons.key}
        </button>
      </form>

      <div class="card-hero-subfooter">
        <a href="/signin">Sign in →</a>
        <span class="sep">·</span>
        <a href="/docs">Guide</a>
        <span class="sep">·</span>
        <a href="/privacy">Privacy</a>
        <span class="sep">·</span>
        <a href="/">Home</a>
      </div>
    </section>
  `;

  // Attach interactive helpers on entry
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
      keyInput.value = 'mgk_sample_contractor';
      keyInput.type = 'text';
      if (toggleBtn) toggleBtn.textContent = 'Hide';
    });
  }
}

function selector() {
  return selected ? '?key_id=' + encodeURIComponent(selected) : '';
}

function addKey() {
  openMessage = null;
  openModal({
    title: 'Add another access key',
    subtitle: 'Connect another workspace or mailbox access key alongside your existing keys to view all permitted mail in one unified inbox.',
    iconName: 'key',
    dialogId: 'dialog',
    content: `
      <form id="add-key-form" class="modal-key-form">
        <div class="field">
          <label for="additional-key">Access Key <span class="required-star">*</span></label>
          <div class="key-input-wrapper">
            ${icons.lock}
            <input id="additional-key" name="key" type="password" autocomplete="off" spellcheck="false" placeholder="mgk_…" required maxlength="80">
            <button type="button" class="toggle-pw-btn" id="toggle-add-pw" aria-label="Toggle key visibility">Show</button>
          </div>
          <small>Paste the full key provided by the workspace administrator. Bound to this device session.</small>
        </div>
        <p class="form-error" role="alert"></p>
        <div class="dialog-actions">
          <button type="button" class="btn" data-action="close">Cancel</button>
          <button class="btn primary" type="submit">
            ${icons.plus}
            <span>Save Access</span>
          </button>
        </div>
      </form>
    `
  });

  const toggleBtn = document.getElementById('toggle-add-pw');
  const keyInput = document.getElementById('additional-key');
  if (toggleBtn && keyInput) {
    toggleBtn.addEventListener('click', () => {
      const isPw = keyInput.type === 'password';
      keyInput.type = isPw ? 'text' : 'password';
      toggleBtn.textContent = isPw ? 'Hide' : 'Show';
    });
  }
}

function render() {
  document.body.classList.remove('is-unauthenticated-portal');
  const connections = state.connections || [];
  const multiKeys = connections.length > 1;

  // Sync theme accent with active key / sender if available
  if (state.accent) {
    setAccent(state.accent, false);
  }

  // Calculate telemetry values
  const totalOpensRemaining = state.max_views === null 
    ? 'Unlimited' 
    : `${Math.max(0, state.max_views - state.views)} Left`;

  const expiryText = state.expires_at 
    ? new Date(state.expires_at).toLocaleDateString() 
    : 'Permanent';

  // Prepare options for universal custom dropdown
  const dropdownOptions = [
    {
      value: '',
      label: `All saved keys (${connections.length})`,
      sub: multiKeys ? 'Combined multi-key inbox' : 'Primary access'
    },
    ...connections.map(k => ({
      value: k.id,
      label: `${k.workspace} · ${k.name}`,
      sub: k.expires_at ? `Valid until ${new Date(k.expires_at).toLocaleDateString()}` : 'No expiration'
    }))
  ];

  $('#shared-app').innerHTML = `
    ${demo ? '<div class="notice blue" style="margin-bottom:20px;"><strong>Interactive Demo:</strong> Viewing simulated delegated inbox data.</div>' : ''}

    <!-- Clean Responsive Page Head -->
    <div class="page-head access-page-head">
      <div class="access-head-titles">
        <div class="eyebrow">
          ${icons.shield}
          <span>${esc(state.workspace)}</span>
        </div>
        <h1 class="page-title">${esc(state.name)}</h1>
        <p class="subtitle">Strictly limited to the companies and messages approved by your access key.</p>
      </div>

      <div class="access-head-actions">
        <button class="btn primary" data-refresh title="Refresh incoming emails">
          ${icons.refresh}
          <span>Refresh</span>
        </button>
        <button class="btn" data-add-key title="Add another access key">
          ${icons.plus}
          <span>Add key</span>
        </button>
        ${selected ? `
          <button class="btn danger" data-remove-key title="Remove selected access key">
            ${icons.trash}
            <span>Remove</span>
          </button>
        ` : ''}
        ${demo ? `
          <button class="btn" data-simulate-demo title="Simulate a new approved message">
            <span>Simulate mail</span>
          </button>
        ` : ''}
        <button class="btn" data-forget title="Clear saved credentials from this browser">
          ${icons.logout}
          <span>Forget device</span>
        </button>
      </div>
    </div>

    <!-- Recipient Security Telemetry Banner (Responsive 4-Card / 2x2 Mobile Grid) -->
    <div class="recipient-telemetry-banner">
      <div class="recipient-telemetry-card">
        <div class="recipient-telemetry-label">${icons.key} Access Profile</div>
        <div class="recipient-telemetry-value">${esc(state.name)}</div>
        <div class="recipient-telemetry-sub">${esc(state.workspace)}</div>
      </div>

      <div class="recipient-telemetry-card">
        <div class="recipient-telemetry-label">${icons.shield} Approved Boundary</div>
        <div class="recipient-telemetry-value">${state.rules.length} Companies</div>
        <div class="recipient-telemetry-sub">Whitelisted & Sandboxed</div>
      </div>

      <div class="recipient-telemetry-card">
        <div class="recipient-telemetry-label">${icons.clock} Key Validity</div>
        <div class="recipient-telemetry-value">${expiryText}</div>
        <div class="recipient-telemetry-sub">${state.expires_at ? 'Time-bound expiration' : 'Continuous active session'}</div>
      </div>

      <div class="recipient-telemetry-card">
        <div class="recipient-telemetry-label">${icons.lock} Open Allowance</div>
        <div class="recipient-telemetry-value">${totalOpensRemaining}</div>
        <div class="recipient-telemetry-sub">${state.max_views !== null ? `${state.views} of ${state.max_views} opened` : 'Unlimited reads authorized'}</div>
      </div>
    </div>

    <!-- Key Switcher & Action Bar with Custom Dropdown -->
    <div class="key-control-bar">
      <div class="saved-access-field">
        <label for="saved-access">Saved Key:</label>
        <div style="flex:1; min-width:0; width:100%;">
          ${renderDropdown({
            id: 'saved-access',
            value: selected,
            header: 'Authorized Access Credentials',
            className: 'saved-access-dropdown',
            options: dropdownOptions
          })}
        </div>
      </div>

      <div class="access-info" style="margin:0; display:flex; align-items:center; gap:8px;">
        ${!selected && multiKeys ? `
          <span class="badge" style="background:var(--accent-subtle); color:var(--accent-bright); border-color:var(--accent-border);">
            ${icons.key} Combined inbox (${connections.length} keys active)
          </span>
        ` : `
          <span class="badge" style="background:var(--accent-subtle); color:var(--accent-bright); border-color:var(--accent-border);">
            ${icons.clock} ${expiryText}
          </span>
        `}
      </div>
    </div>

    <!-- Allowed Company Boundaries Matrix with Official Service Logos -->
    <div class="access-companies-section">
      <span class="companies-label">Permitted Company Boundaries (${state.rules.length}):</span>
      <div class="access-companies">
        ${state.rules.map(r => `
          <span class="company-chip ${r.mode === 'codes' ? 'chip-codes' : r.mode === 'links' ? 'chip-links' : 'chip-read'}" title="${esc(r.name)} · ${modes[r.mode] || r.mode}">
            <span class="company-chip-logo">${getCompanyLogo(r.name, 18)}</span>
            <span class="company-chip-name">${esc(r.source ? r.source + ' · ' : '')}${esc(r.name)}</span>
            <span class="company-chip-mode">(${modes[r.mode] || r.mode})</span>
          </span>
        `).join('')}
      </div>
    </div>

    <!-- Messages Container -->
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Your Shared Inbox</h2>
          <p>Messages received under this key's boundary policy. Unapproved mail fails closed.</p>
        </div>
        <span class="badge" style="background:var(--accent-subtle); color:var(--accent-bright); border-color:var(--accent-border);">
          ${state.messages.length} ${state.messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <!-- Access Mode Filter Tabs & Live Search -->
      <div class="access-inbox-toolbar">
        <div class="access-filter-tabs" role="tablist">
          <button type="button" class="access-tab-btn ${activeFilter === 'all' ? 'active' : ''}" data-shared-filter="all">
            <span>All messages</span>
            <span class="tab-count-pill">${state.messages.length}</span>
          </button>
          <button type="button" class="access-tab-btn ${activeFilter === 'codes' ? 'active' : ''}" data-shared-filter="codes">
            <span>Codes only</span>
            <span class="tab-count-pill">${state.messages.filter(m => m.mode === 'codes').length}</span>
          </button>
          <button type="button" class="access-tab-btn ${activeFilter === 'links' ? 'active' : ''}" data-shared-filter="links">
            <span>Sign-in links</span>
            <span class="tab-count-pill">${state.messages.filter(m => m.mode === 'links').length}</span>
          </button>
          <button type="button" class="access-tab-btn ${activeFilter === 'read' ? 'active' : ''}" data-shared-filter="read">
            <span>Full message</span>
            <span class="tab-count-pill">${state.messages.filter(m => m.mode === 'read').length}</span>
          </button>
        </div>

        <div class="access-search-wrap">
          ${icons.search}
          <input 
            id="shared-search-input" 
            type="search" 
            placeholder="Search companies…" 
            value="${esc(searchQuery)}"
            autocomplete="off"
          >
        </div>
      </div>

      <div id="shared-message-container" class="message-container">
        ${renderMessagesList(state.messages.filter(m => {
          const matchesFilter = activeFilter === 'all' || m.mode === activeFilter;
          const q = searchQuery.toLowerCase().trim();
          const matchesQuery = !q || (m.name || '').toLowerCase().includes(q) || (m.source || '').toLowerCase().includes(q);
          return matchesFilter && matchesQuery;
        }))}
      </div>

      <div class="panel-footer">
        <span>${icons.shield} Cryptographic zero-trust verification enforced on every open</span>
        <span>Opening messages counts toward view quotas; list refreshes do not</span>
      </div>
    </section>
  `;
}

function renderMessagesList(messages) {
  if (!messages || !messages.length) {
    const isFiltered = activeFilter !== 'all' || Boolean(searchQuery);
    return `
      <div class="empty-shared">
        <div class="empty-shared-icon" aria-hidden="true">${icons.mail}</div>
        <h3>${isFiltered ? 'No matching messages' : 'No messages available yet'}</h3>
        <p>${isFiltered ? 'Try clearing your search keyword or switching to another filter tab.' : 'Trigger a new sign-in or verification email from an approved company, then tap <strong>Refresh</strong>.'}</p>
        ${demo && !isFiltered ? `<button class="btn primary small" data-simulate-demo>Simulate sample email</button>` : ''}
      </div>
    `;
  }

  return messages.map((m, i) => `
    <button class="message-row" data-open="${esc(m.id)}" data-source-key="${esc(m.key_id || '')}" aria-label="Open ${esc(m.name)} message">
      <div class="message-logo-wrap">
        ${getCompanyLogo(m.name, 42, i)}
      </div>
      <div style="min-width:0;">
        <h3 class="message-title">${esc(m.name)}</h3>
        <p class="message-desc">
          ${esc(m.source ? m.source + ' · ' : '')}
          ${m.mode === 'codes' ? 'Verification code extracted & ready' : m.mode === 'links' ? 'Whitelisted sign-in link is ready' : 'Full plain-text message is ready'}
        </p>
      </div>
      <div class="message-right">
        <span class="badge ${m.mode === 'codes' ? 'blue' : m.mode === 'links' ? 'green' : 'purple'}">
          ${modes[m.mode] || m.mode}
        </span>
        <span class="inspect-pill">
          <span>Inspect</span>
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </button>
  `).join('');
}

function updateFilteredMessages() {
  if (!state) return;
  const allMessages = state.messages || [];
  const filtered = allMessages.filter(m => {
    const matchesFilter = activeFilter === 'all' || m.mode === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || (m.name || '').toLowerCase().includes(q) || (m.source || '').toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });
  const container = document.getElementById('shared-message-container');
  if (container) {
    container.innerHTML = renderMessagesList(filtered);
  }
}

async function load() {
  try {
    state = await api('state' + selector());
  } catch (error) {
    if (selected && error.status === 403) {
      selected = '';
      state = await api('state');
    } else {
      throw error;
    }
  }

  // Adopt sender's accent color if provided
  if (state.accent) {
    setAccent(state.accent, false);
  }

  render();
}

async function refresh(all = false) {
  const map = new Map();
  for (const k of state.connections || []) {
    if (!selected || k.id === selected) map.set(k.workspace_id || k.id, k.id);
  }
  const ids = [...map.values()];
  const targets = all ? ids : ids.length ? [ids[syncIndex++ % ids.length]] : [];
  let failed = false;
  for (let i = 0; i < targets.length; i += 2) {
    const results = await Promise.allSettled(
      targets.slice(i, i + 2).map(k => api('sync?key_id=' + encodeURIComponent(k), 'POST', {}))
    );
    if (results.some(r => r.status === 'rejected')) failed = true;
  }
  return failed;
}

function toast(text) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('visible'), 4000);
}

async function showMessage(id, keyId) {
  const m = await api(`messages/${id}${keyId ? '?key_id=' + encodeURIComponent(keyId) : selector()}`);
  openMessage = m;

  const modeBadge = m.mode === 'codes' 
    ? '<span class="badge blue">Codes only</span>' 
    : m.mode === 'links' 
      ? '<span class="badge green">Sign-in links</span>' 
      : '<span class="badge purple">Full message</span>';

  function formatBodyWithLinks(text) {
    if (!text) return '<p style="color:var(--muted); font-style:italic;">No plain-text body content.</p>';
    const safe = esc(text);
    return safe.replace(/https:\/\/[^\s<>"')]+/g, url => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="body-url-link">${url}</a>`;
    });
  }

  const hasCode = Boolean(m.code);
  const hasLink = Boolean(m.link);

  const bodyContent = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      ${modeBadge}
      <span style="font-size:12px; color:var(--muted); display:inline-flex; align-items:center; gap:5px;">
        ${icons.clock} Auto-expires
      </span>
    </div>

    <!-- Verification Code Block -->
    ${hasCode ? `
      <div class="code-display">
        <strong>${esc(m.code)}</strong>
        <small>APPROVED VERIFICATION CODE</small>
      </div>
      <button class="btn primary btn-full" data-copy="${esc(m.code)}" style="margin-bottom:14px;">
        ${icons.copy}
        <span>Copy verification code</span>
      </button>
    ` : m.mode === 'codes' ? `
      <div class="notice amber">No single unambiguous code could be extracted. The raw email is protected under the zero-trust policy.</div>
    ` : ''}

    <!-- Sign-in Link Action Block -->
    ${hasLink ? `
      <div class="link-action-card" style="margin-bottom:16px;">
        <div class="notice blue" style="margin-bottom:12px;">
          This link matches the exact trusted hostname whitelisted by the workspace administrator.
        </div>
        <a class="btn primary btn-full btn-magic-link" href="${esc(m.link)}" target="_blank" rel="noopener noreferrer">
          <span>Open approved sign-in link</span>
          <span aria-hidden="true">↗</span>
        </a>
        <button type="button" class="btn small outline btn-full" data-copy="${esc(m.link)}" style="margin-top:8px;">
          ${icons.copy}
          <span>Copy sign-in link</span>
        </button>
      </div>
    ` : m.mode === 'links' ? `
      <div class="notice amber">No single approved sign-in link is available. The raw email is protected under the zero-trust policy.</div>
    ` : ''}

    <!-- Full Message Body (when mode is read / text available) -->
    ${m.mode === 'read' ? `
      <div class="full-message-wrap" style="margin-top:${(hasCode || hasLink) ? '18px' : '0'}; border-top:${(hasCode || hasLink) ? '1px solid var(--line)' : 'none'}; padding-top:${(hasCode || hasLink) ? '16px' : '0'};">
        <h3 style="margin:0 0 6px; font-size:16px; color:var(--ink); font-weight:750; line-height:1.35;">${esc(m.subject || 'No Subject')}</h3>
        <p style="font-size:12px; color:var(--muted); margin:0 0 14px;">From: <strong>${esc(m.sender || 'Unknown')}</strong></p>
        <div class="message-text" style="white-space:pre-wrap; word-break:break-word; font-size:13px; line-height:1.6; max-height:340px; overflow-y:auto; background:var(--bg-subtle); padding:14px; border-radius:var(--radius-md); border:1px solid var(--line);">
          ${formatBodyWithLinks(m.text)}
        </div>
      </div>
    ` : ''}

    <div class="privacy-note" style="margin-top:20px;">
      ${icons.shield}
      <span>Keep codes and magic links confidential. Revoking access here does not terminate an active session in the target service.</span>
    </div>
  `;

  openModal({
    title: m.name,
    subtitle: m.source ? `From ${m.source}` : 'Delegated message inspection',
    customIconHtml: getCompanyLogo(m.name || m.sender, 48),
    dialogId: 'dialog',
    content: bodyContent,
    onClose: () => { openMessage = null; }
  });

  if (state.max_views !== null) {
    state.views = m.views;
    render();
  }
}

// Global submit handler
document.addEventListener('submit', async e => {
  if (!['redeem-form', 'add-key-form'].includes(e.target.id)) return;
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;

  try {
    const key = form.elements.key.value.trim();
    await api('redeem', 'POST', { key });
    form.elements.key.value = '';
    selected = '';
    closeModal();
    await load();
  } catch (error) {
    const errEl = form.querySelector('.form-error');
    if (errEl) errEl.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
});

// Global click handler
document.addEventListener('click', async e => {
  const el = e.target.closest('button');
  if (!el) return;

  try {
    if (el.hasAttribute('data-close') || el.dataset.action === 'close') {
      closeModal();
      openMessage = null;
    }
    if (el.dataset.sharedFilter) {
      activeFilter = el.dataset.sharedFilter;
      document.querySelectorAll('[data-shared-filter]').forEach(b => b.classList.toggle('active', b.dataset.sharedFilter === activeFilter));
      updateFilteredMessages();
      return;
    }
    if (el.dataset.copy) {
      await navigator.clipboard.writeText(el.dataset.copy);
      toast(el.dataset.copy.startsWith('http') ? 'Sign-in link copied to clipboard!' : 'Verification code copied to clipboard!');
      const span = el.querySelector('span');
      if (span) {
        const orig = span.textContent;
        span.textContent = 'Copied!';
        setTimeout(() => { if (span) span.textContent = orig; }, 2000);
      }
      return;
    }
    if (el.hasAttribute('data-add-key')) addKey();
    if (el.hasAttribute('data-remove-key')) {
      await api('forget', 'POST', { key_id: selected });
      selected = '';
      await load();
      toast('Access key removed.');
    }
    if (el.dataset.open) await showMessage(el.dataset.open, el.dataset.sourceKey);
    if (el.hasAttribute('data-simulate-demo')) {
      await api('simulate' + selector(), 'POST', {});
      await load();
      toast('New simulated email received.');
    }
    if (el.hasAttribute('data-refresh')) {
      el.disabled = true;
      const failed = await refresh(true);
      await load();
      toast(failed ? 'Some mailboxes could not refresh. Ask the administrator to check connection.' : 'Shared inbox refreshed.');
    }
    if (el.hasAttribute('data-forget')) {
      await api('logout', 'POST', {});
      entry();
      toast('Device session cleared.');
    }
  } catch (error) {
    if (error.status === 401) entry(error.message);
    else toast(error.message);
  } finally {
    el.disabled = false;
  }
});

const dialogElement = document.getElementById('dialog') || document.getElementById('shared-dialog');
if (dialogElement) {
  dialogElement.addEventListener('close', () => { openMessage = null; });
}

// Live search filter input
document.addEventListener('input', e => {
  if (e.target.id === 'shared-search-input') {
    searchQuery = e.target.value;
    updateFilteredMessages();
  }
});

// Listen for custom dropdown change event
document.addEventListener('change', async e => {
  if (e.target.id === 'saved-access') {
    selected = e.target.value;
    
    // Switch accent dynamically to chosen sender's theme color
    const chosen = (state?.connections || []).find(k => k.id === selected);
    if (chosen?.accent) {
      setAccent(chosen.accent, false);
    } else if (!selected && state?.connections?.[0]?.accent) {
      setAccent(state.connections[0].accent, false);
    }

    try {
      await load();
    } catch (error) {
      if (error.status === 401) entry(error.message);
      else toast(error.message);
    }
  }
});

// Periodic background sync while tab is active
setInterval(async () => {
  if (document.hidden || !state) return;
  const activeDlg = document.getElementById('dialog') || document.getElementById('shared-dialog');
  if (openMessage?.expires_at <= Date.now()) {
    closeModal();
    openMessage = null;
    toast('This message has expired.');
  }
  if (!activeDlg?.open) {
    try {
      try { await refresh(); } catch {}
      await load();
    } catch (error) {
      if (error.status === 401) entry(error.message);
    }
  }
}, 30000);

// Auto-redeem if key was provided in URL query (?key=mgk_...) or hash (#key=mgk_...)
const urlKey = new URLSearchParams(location.search).get('key') || 
  (location.hash.startsWith('#key=') ? location.hash.slice(5).split('&')[0] : null);

if (urlKey) {
  // Preserve accent param in URL when replacing history cleanly
  const params = new URLSearchParams();
  if (demo) params.set('demo', '1');
  if (accentParamMatch && accentParamMatch[1]) params.set('accent', accentParamMatch[1]);
  const qs = params.toString() ? `?${params.toString()}` : '';
  history.replaceState(null, '', location.pathname + qs);
  api('redeem', 'POST', { key: urlKey })
    .then(() => load())
    .catch(err => entry(err.message));
} else {
  load().catch(error => entry(error.status === 401 ? '' : error.message));
}
