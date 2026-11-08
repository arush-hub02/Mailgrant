import { icon } from '../components/icons.js';
import { getMailboxLogo, getProviderDisplayName, providerLogos } from '../components/logos.js';
import { esc, badge, heading, field, formFooter, ago } from './common.js';

/**
 * Hero card showcasing the active connected mailbox, live sync status, and primary actions.
 */
function activeMailboxHero({ state = {}, mailbox = {}, isOwner = false, demo = false }) {
  const isConnected = Boolean(state.mailbox_connected || state.gmail_connected || mailbox.connection || mailbox.gmail);
  const email = mailbox.email || state.workspace?.mailbox_email || meUserEmail(state) || '';
  const provider = mailbox.provider || state.provider || mailbox.connection?.provider || 'google';
  const providerName = getProviderDisplayName(provider);
  const conn = mailbox.connection || mailbox.gmail || {};
  const needsReconnect = Boolean(conn.needs_reconnect);
  const lastSyncText = conn.last_sync_at 
    ? `Last synced ${ago(conn.last_sync_at)}` 
    : isConnected ? 'Real-time synchronization active' : 'Forwarding stream standby';

  return `
    <section class="mailbox-active-hero glass-neon-card" aria-label="Active Connected Mailbox">
      <div class="mailbox-hero-ambient" aria-hidden="true"></div>
      
      <div class="mailbox-hero-top">
        <div class="mailbox-hero-icon-wrap">
          <div class="mailbox-icon-box ${isConnected ? 'connected' : 'standby'}">
            ${getMailboxLogo(email || state.workspace?.name, 34, provider)}
            <span class="mailbox-status-dot ${isConnected ? 'online' : 'offline'}" aria-hidden="true"></span>
          </div>
          <div>
            <div class="mailbox-title-row">
              <h2>${esc(state.workspace?.name || 'Current Workspace Mailbox')}</h2>
              ${isConnected 
                ? badge(`${providerName} Connected`, 'green') 
                : badge('Setup Needed', 'amber')}
              ${demo ? badge('Sample Workspace', 'blue') : ''}
            </div>
            <p class="mailbox-hero-email">${esc(email || 'No email account linked yet')}</p>
          </div>
        </div>

        <div class="mailbox-hero-actions">
          ${isConnected ? `
            <button type="button" class="btn small primary-glow" data-action="refresh" title="Check for new matching emails now">
              ${icon('refresh')}
              <span>Sync Now</span>
            </button>
            <button type="button" class="btn small outline" data-action="mailbox-connect" title="Reconnect or change provider">
              ${icon('mail')}
              <span>Change / Reconnect</span>
            </button>
            ${isOwner ? `
              <button type="button" class="btn small danger-outline" data-action="mailbox-disconnect" title="Disconnect mailbox account">
                <span>Disconnect</span>
              </button>
            ` : ''}
          ` : `
            <button type="button" class="btn primary primary-glow" data-action="add-gmail">
              ${icon('mail')}
              <span>Connect Mailbox</span>
            </button>
          `}
        </div>
      </div>

      ${needsReconnect ? `
        <div class="notice amber mailbox-reconnect-notice">
          ${icon('alert')}
          <div>
            <strong>${esc(providerName)} authorization expired or revoked</strong>
            <p>Please reconnect using the same account to resume automatic mail synchronization.</p>
          </div>
          <button type="button" class="btn small primary" data-action="mailbox-connect">Reconnect Now</button>
        </div>
      ` : ''}

      <!-- Security & Scope Telemetry Strip -->
      <div class="mailbox-telemetry-row">
        <div class="mailbox-telemetry-pill">
          ${icon('shield')}
          <span>Zero-Trust Scope: Rule-Matched Messages Only</span>
        </div>
        <div class="mailbox-telemetry-pill">
          ${icon('lock')}
          <span>Storage Security: AES-256-GCM Encrypted</span>
        </div>
        <div class="mailbox-telemetry-pill">
          ${icon('clock')}
          <span>${esc(lastSyncText)}</span>
        </div>
      </div>
    </section>
  `;
}

/**
 * Grid of all workspaces / mailboxes available to the user for 1-click switching.
 */
function mailboxGrid({ me = {}, currentWid = '', isOwner = false }) {
  const workspaces = (me.workspaces || []).filter(w => !isOwner || w.owner_id === me.user?.id);
  
  if (!workspaces.length) return '';

  return `
    <section class="mailbox-section-wrap" aria-label="Available Mailboxes">
      <div class="section-header-compact">
        <div>
          <h3>Your Mailbox Workspaces</h3>
          <p class="section-subtitle">Connect and isolate distinct mailboxes across Outlook, Yahoo, Gmail, and custom domains with separate access rules and team keys.</p>
        </div>
        <button type="button" class="btn small outline" data-action="add-gmail">
          ${icon('plus')}
          <span>Add Another Mailbox</span>
        </button>
      </div>

      <div class="mailbox-grid">
        ${workspaces.map(w => {
          const isActive = w.id === currentWid;
          const isConnected = Boolean(w.mailbox_connected || w.gmail_connected);
          const provider = w.mailbox_provider || 'google';

          return `
            <article 
              class="mailbox-card glass-neon-card ${isActive ? 'active-mailbox' : ''}" 
              data-switch-workspace="${esc(w.id)}" 
              role="button" 
              tabindex="0"
              aria-label="Switch to ${esc(w.name)}"
            >
              <div class="mailbox-card-header">
                <span class="mailbox-avatar-wrap">
                  ${getMailboxLogo(w.mailbox_email || w.name, 28, provider)}
                </span>
                <div class="mailbox-card-badges">
                  ${isActive ? `
                    <span class="mailbox-active-badge">
                      <span class="pulse-dot"></span>
                      <span>Active Now</span>
                    </span>
                  ` : ''}
                  ${badge(isConnected ? 'Connected' : 'Setup needed', isConnected ? 'green' : 'amber')}
                </div>
              </div>

              <h4 class="mailbox-card-title">${esc(w.name)}</h4>
              <p class="mailbox-card-email">${esc(w.mailbox_email || 'No account linked yet')}</p>

              <div class="mailbox-card-footer">
                ${isActive ? `
                  <span class="mailbox-active-label">
                    ${icon('check')}
                    <span>Current Active Workspace</span>
                  </span>
                ` : `
                  <button type="button" class="btn small outline mailbox-switch-btn" data-switch-workspace="${esc(w.id)}">
                    <span>Switch to this Mailbox</span>
                    ${icon('arrow')}
                  </button>
                `}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

/**
 * Inbound Forwarding pipeline section (for users who use direct alias forwarding).
 */
function forwardingPipeline({ mailbox = {}, isOwner = false }) {
  if (!mailbox.alias) return '';

  const isVerified = Boolean(mailbox.verified_at);
  const alias = mailbox.alias;

  return `
    <section class="mailbox-forwarding-panel glass-neon-card" aria-label="Inbound Email Pipeline">
      <div class="forwarding-panel-header">
        <div class="forwarding-header-left">
          <div class="forwarding-icon-box">${icon('mail')}</div>
          <div>
            <h3>Dedicated Inbound Forwarding Stream (Worldwide Compatibility)</h3>
            <p class="section-subtitle">Forward approved service emails from Microsoft Outlook, Hotmail, Yahoo Mail, Gmail, Apple iCloud, Proton, or any corporate domain.</p>
          </div>
        </div>
        ${badge(isVerified ? 'Pipeline Verified' : 'Awaiting Inbound Mail', isVerified ? 'green' : 'amber')}
      </div>

      <div class="forwarding-body-grid">
        <div class="forwarding-alias-box">
          <label class="forwarding-label" for="inbound-alias-input">Your Dedicated Inbound Receiving Address</label>
          <div class="copy-box mailbox-copy-box">
            <code id="inbound-alias-input">${esc(alias)}</code>
            <button type="button" class="icon-btn" data-copy="${esc(alias)}" aria-label="Copy forwarding address">
              ${icon('copy')}
            </button>
          </div>
          <span class="forwarding-hint">Forward specific approved senders (e.g. Anthropic/Claude, OpenAI, Notion) to this address without giving full account access.</span>
        </div>

        <div class="forwarding-actions-column">
          <button type="button" class="btn small outline" data-action="setup" title="Open provider setup confirmation code">
            ${icon('mail')}
            <span>View Forwarding Confirmation</span>
          </button>
          <button type="button" class="btn small outline" data-action="forwarding-guide" title="View provider setup instructions">
            <span>Setup Instructions</span>
          </button>
          ${isOwner ? `
            <button type="button" class="btn small danger-outline" data-action="rotate" title="Generate a new receiving address">
              <span>Rotate Address</span>
            </button>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}

function meUserEmail(state) {
  return state.mailbox?.email || '';
}

/**
 * Main Connected Mailboxes Page View.
 */
export function mailboxesPage({ state = {}, me = {}, demo = false }) {
  const mailbox = state.mailbox || {};
  const currentWid = state.workspace?.id || '';
  const isOwner = Boolean(state.owner);
  const isConnected = Boolean(state.mailbox_connected || state.gmail_connected);

  return heading(
    'Connected Mailboxes',
    'Manage direct OAuth sync and dedicated inbound forwarding streams across Outlook, Yahoo, Gmail, and worldwide providers.',
    `<button type="button" class="btn primary primary-glow" data-action="add-gmail">
      ${icon('plus')}
      <span>Connect Mailbox</span>
    </button>`
  ) + `
    <div class="mailboxes-page-container">
      <!-- Top Cyber Telemetry Overview Banner -->
      <section class="inbox-telemetry-banner glass-neon-card" aria-label="Mailbox Pipelines Overview">
        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Active Connection</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-number">${isConnected ? '01' : '00'}</strong>
            <span class="telemetry-pill ${isConnected ? 'active' : 'standby'}">
              <span class="pulse-dot" aria-hidden="true"></span>
              <span>${isConnected ? 'OAuth Synced' : 'Standby'}</span>
            </span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Supported Providers</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">Outlook, Yahoo, Gmail, Worldwide</strong>
            <span class="telemetry-pill positive">Multi-Provider</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Isolation Level</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">Isolated Mailbox Boundary</strong>
            <span class="telemetry-pill neutral">Zero-Trust</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Inbound Stream</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${mailbox.alias ? 'Direct Alias Active' : 'API Sync Engine'}</strong>
            <span class="telemetry-pill positive">${mailbox.alias ? 'Verified' : 'Active'}</span>
          </div>
        </div>
      </section>

      <!-- 1. Active Connected Mailbox Showcase -->
      ${activeMailboxHero({ state, mailbox, isOwner, demo })}

      <!-- 2. Workspace Mailbox Switcher Grid -->
      ${mailboxGrid({ me, currentWid, isOwner })}

      <!-- 3. Inbound Forwarding Stream Pipeline -->
      ${forwardingPipeline({ mailbox, isOwner })}
    </div>
  `;
}

/**
 * Modal dialog for linking a new mailbox or creating a workspace across providers.
 */
export function openMailboxModal({ me = {}, demo = false, modal }) {
  const userEmail = me.user?.email || 'your account';

  modal('Connect a Mailbox', `
    <p class="modal-intro">
      Select your email provider to connect. Mailgrant supports <strong>Google Gmail</strong>, <strong>Microsoft Outlook & Hotmail</strong>, <strong>Yahoo Mail</strong>, and <strong>Worldwide Inbound Forwarding</strong> (iCloud, Proton, Zoho, or custom domains).
    </p>
    <form id="mailbox-form">
      <label class="form-label" style="display:block; margin-bottom:8px; font-weight:600;">Choose Email Provider</label>
      <div class="mg-provider-select-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-bottom:16px;">
        <label class="mg-provider-radio-card" style="display:flex; align-items:center; gap:10px; padding:12px; border-radius:10px; border:1px solid var(--accent); background:rgba(0,229,255,0.06); cursor:pointer;">
          <input type="radio" name="provider" value="google" checked style="accent-color:var(--accent);">
          <div style="display:flex; align-items:center; gap:8px;">
            ${providerLogos.gmail(24)}
            <div>
              <strong style="font-size:13px; display:block;">Google Gmail</strong>
              <span style="font-size:11px; opacity:0.7;">Gmail & Workspace</span>
            </div>
          </div>
        </label>

        <label class="mg-provider-radio-card" style="display:flex; align-items:center; gap:10px; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.02); cursor:pointer;">
          <input type="radio" name="provider" value="microsoft" style="accent-color:var(--accent);">
          <div style="display:flex; align-items:center; gap:8px;">
            ${providerLogos.outlook(24)}
            <div>
              <strong style="font-size:13px; display:block;">Microsoft Outlook</strong>
              <span style="font-size:11px; opacity:0.7;">Hotmail & Office 365</span>
            </div>
          </div>
        </label>

        <label class="mg-provider-radio-card" style="display:flex; align-items:center; gap:10px; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.02); cursor:pointer;">
          <input type="radio" name="provider" value="yahoo" style="accent-color:var(--accent);">
          <div style="display:flex; align-items:center; gap:8px;">
            ${providerLogos.yahoo(24)}
            <div>
              <strong style="font-size:13px; display:block;">Yahoo Mail</strong>
              <span style="font-size:11px; opacity:0.7;">Yahoo, Ymail, Rocket</span>
            </div>
          </div>
        </label>

        <label class="mg-provider-radio-card" style="display:flex; align-items:center; gap:10px; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.02); cursor:pointer;">
          <input type="radio" name="provider" value="inbound" style="accent-color:var(--accent);">
          <div style="display:flex; align-items:center; gap:8px;">
            ${providerLogos.custom(24)}
            <div>
              <strong style="font-size:13px; display:block;">Any Email Worldwide</strong>
              <span style="font-size:11px; opacity:0.7;">iCloud, Proton, Zoho, IMAP</span>
            </div>
          </div>
        </label>
      </div>

      ${field('Mailbox Workspace Name', 'name', 'e.g. Work Outlook, Personal Gmail, Support Yahoo', 'required minlength="2" maxlength="60"')}
      ${demo ? field('Sample Email Address', 'demo_email', 'colleague@outlook.com', 'type="email" required') : ''}
      <div class="notice">
        Mailgrant inspects strictly messages matching your approved rules using zero-trust boundaries. Invitees never receive your account passwords or unrestricted inbox access.
      </div>
      ${formFooter(demo ? 'Add Sample Mailbox' : 'Connect & Authorize Mailbox')}
    </form>
  `);
}
