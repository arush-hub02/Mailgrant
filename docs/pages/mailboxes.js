import { icon } from '../components/icons.js';
import { getMailboxLogo } from '../components/logos.js';
import { esc, badge, heading, field, formFooter, ago } from './common.js';

/**
 * Hero card showcasing the active connected mailbox, live sync status, and primary actions.
 */
function activeMailboxHero({ state = {}, mailbox = {}, isOwner = false, demo = false }) {
  const isConnected = Boolean(state.gmail_connected || mailbox.gmail);
  const email = mailbox.email || state.workspace?.mailbox_email || meUserEmail(state) || '';
  const needsReconnect = Boolean(mailbox.gmail?.needs_reconnect);
  const lastSyncText = mailbox.gmail?.last_sync_at 
    ? `Last synced ${ago(mailbox.gmail.last_sync_at)}` 
    : isConnected ? 'Real-time synchronization active' : 'No synchronization activity yet';

  return `
    <section class="mailbox-active-hero glass-neon-card" aria-label="Active Connected Mailbox">
      <div class="mailbox-hero-ambient" aria-hidden="true"></div>
      
      <div class="mailbox-hero-top">
        <div class="mailbox-hero-icon-wrap">
          <div class="mailbox-icon-box ${isConnected ? 'connected' : 'standby'}">
            ${getMailboxLogo(email || state.workspace?.name, 34, isConnected)}
            <span class="mailbox-status-dot ${isConnected ? 'online' : 'offline'}" aria-hidden="true"></span>
          </div>
          <div>
            <div class="mailbox-title-row">
              <h2>${esc(state.workspace?.name || 'Current Workspace Mailbox')}</h2>
              ${isConnected 
                ? badge('Gmail Connected', 'green') 
                : badge('Setup Needed', 'amber')}
              ${demo ? badge('Sample Workspace', 'blue') : ''}
            </div>
            <p class="mailbox-hero-email">${esc(email || 'No Gmail address linked yet')}</p>
          </div>
        </div>

        <div class="mailbox-hero-actions">
          ${isConnected ? `
            <button type="button" class="btn small primary-glow" data-action="refresh" title="Check for new matching emails now">
              ${icon('refresh')}
              <span>Sync Now</span>
            </button>
            <button type="button" class="btn small outline" data-action="gmail-connect" title="Reconnect this Google account">
              ${icon('mail')}
              <span>Reconnect</span>
            </button>
            ${isOwner ? `
              <button type="button" class="btn small danger-outline" data-action="gmail-disconnect" title="Disconnect Gmail account">
                <span>Disconnect</span>
              </button>
            ` : ''}
          ` : `
            <button type="button" class="btn primary primary-glow" data-action="gmail-connect">
              ${icon('mail')}
              <span>Connect Gmail Account</span>
            </button>
          `}
        </div>
      </div>

      ${needsReconnect ? `
        <div class="notice amber mailbox-reconnect-notice">
          ${icon('alert')}
          <div>
            <strong>Google authorization expired or revoked</strong>
            <p>Please reconnect using the same Google account to resume automatic mail synchronization.</p>
          </div>
          <button type="button" class="btn small primary" data-action="gmail-connect">Reconnect Now</button>
        </div>
      ` : ''}

      <!-- Security & Scope Telemetry Strip -->
      <div class="mailbox-telemetry-row">
        <div class="mailbox-telemetry-pill">
          ${icon('shield')}
          <span>OAuth Scope: Read-Only Message Inspection</span>
        </div>
        <div class="mailbox-telemetry-pill">
          ${icon('lock')}
          <span>Credential Security: Encrypted KMS Storage</span>
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
          <p class="section-subtitle">Each Gmail account runs in its own isolated workspace with separate access rules and team keys.</p>
        </div>
        <button type="button" class="btn small outline" data-action="add-gmail">
          ${icon('plus')}
          <span>Add Another Mailbox</span>
        </button>
      </div>

      <div class="mailbox-grid">
        ${workspaces.map(w => {
          const isActive = w.id === currentWid;
          const isConnected = Boolean(w.gmail_connected);
          const initial = (w.name && w.name[0]) ? w.name[0].toUpperCase() : 'M';

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
                  ${getMailboxLogo(w.mailbox_email || w.name, 28, isConnected)}
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
            <h3>Dedicated Inbound Forwarding Stream</h3>
            <p class="section-subtitle">Authenticate inbound messages via DMARC without granting full account access.</p>
          </div>
        </div>
        ${badge(isVerified ? 'Pipeline Verified' : 'Awaiting Inbound Mail', isVerified ? 'green' : 'amber')}
      </div>

      <div class="forwarding-body-grid">
        <div class="forwarding-alias-box">
          <label class="forwarding-label" for="inbound-alias-input">Inbound Forwarding Receiving Address</label>
          <div class="copy-box mailbox-copy-box">
            <code id="inbound-alias-input">${esc(alias)}</code>
            <button type="button" class="icon-btn" data-copy="${esc(alias)}" aria-label="Copy forwarding address">
              ${icon('copy')}
            </button>
          </div>
          <span class="forwarding-hint">Add this address to your Gmail filters for approved senders (e.g. Anthropic, Google, Notion).</span>
        </div>

        <div class="forwarding-actions-column">
          <button type="button" class="btn small outline" data-action="setup" title="Open Gmail setup confirmation">
            ${icon('mail')}
            <span>View Forwarding Confirmation</span>
          </button>
          ${isOwner ? `
            <button type="button" class="btn small danger-outline" data-action="rotate" title="Generate a new receiving address">
              <span>Rotate Inbound Address</span>
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
 * Main Connected Gmail Accounts Page View.
 */
export function mailboxesPage({ state = {}, me = {}, demo = false }) {
  const mailbox = state.mailbox || {};
  const currentWid = state.workspace?.id || '';
  const isOwner = Boolean(state.owner);

  return heading(
    'Connected Gmail Accounts',
    'Manage direct Gmail OAuth connections, inbound forwarding pipelines, and mailbox boundaries.',
    `<button type="button" class="btn primary primary-glow" data-action="add-gmail">
      ${icon('plus')}
      <span>Connect Gmail Account</span>
    </button>`
  ) + `
    <div class="mailboxes-page-container">
      <!-- Top Cyber Telemetry Overview Banner (Exact Inbox Pattern) -->
      <section class="inbox-telemetry-banner glass-neon-card" aria-label="Mailbox Pipelines Overview">
        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Active Connection</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-number">${state.gmail_connected ? '01' : '00'}</strong>
            <span class="telemetry-pill ${state.gmail_connected ? 'active' : 'standby'}">
              <span class="pulse-dot" aria-hidden="true"></span>
              <span>${state.gmail_connected ? 'OAuth Synced' : 'Standby'}</span>
            </span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">OAuth Scope</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">Read-Only Inspection</strong>
            <span class="telemetry-pill positive">KMS Encrypted</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Isolation Level</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">Isolated Mailbox Boundary</strong>
            <span class="telemetry-pill neutral">Pinned Identity</span>
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
 * Modal dialog for linking a new Gmail mailbox or creating a workspace.
 */
export function openMailboxModal({ me = {}, demo = false, modal }) {
  const userEmail = me.user?.email || 'your account';

  modal('Connect a Gmail Account', `
    <p class="modal-intro">
      Name this mailbox workspace. Google will prompt you to select which Gmail account to connect, while your main login remains <strong>${esc(userEmail)}</strong>.
    </p>
    <form id="mailbox-form">
      ${field('Mailbox Name', 'name', 'e.g. Personal Gmail or Work Gmail', 'required minlength="2" maxlength="60"')}
      ${demo ? field('Sample Gmail Address', 'demo_email', 'second-mailbox@example.com', 'type="email" required') : ''}
      <div class="notice">
        Mailgrant requests read-only inspection strictly for messages matching your approved rules. Invitees never receive your Google token or mailbox-wide access.
      </div>
      ${formFooter(demo ? 'Add Sample Mailbox' : 'Continue to Google Consent')}
    </form>
  `);
}
