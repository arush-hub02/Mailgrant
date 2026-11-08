import { icon } from '../components/icons.js';
import { getThemeSetting, getAccent } from '../theme.js';
import { esc, initials, badge, heading, field } from './common.js';

/**
 * Retrieve authentic device session specifications directly from the browser environment.
 * Never fabricates dummy devices or duplicate sessions.
 */
export function getAuthenticDeviceSession(user) {
  const ua = navigator.userAgent;

  // Authentic browser detection
  let browser = 'Web Browser';
  if (/Edg\/([\d.]+)/.test(ua)) {
    browser = `Microsoft Edge ${RegExp.$1.split('.')[0]}`;
  } else if (/Chrome\/([\d.]+)/.test(ua)) {
    browser = `Google Chrome ${RegExp.$1.split('.')[0]}`;
  } else if (/Firefox\/([\d.]+)/.test(ua)) {
    browser = `Mozilla Firefox ${RegExp.$1.split('.')[0]}`;
  } else if (/Version\/([\d.]+).*Safari/.test(ua)) {
    browser = `Apple Safari ${RegExp.$1.split('.')[0]}`;
  }

  // Authentic operating system detection
  let os = 'Desktop';
  if (/Windows NT 10\.0/.test(ua) || /Windows NT 11\.0/.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  } else if (/Android/.test(ua)) {
    os = 'Android';
  } else if (/iPhone|iPad/.test(ua)) {
    os = 'iOS';
  }

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const iconName = isMobile ? 'smartphone' : 'monitor';
  const screenRes = (typeof window !== 'undefined' && window.screen && window.screen.width && window.screen.height)
    ? `${window.screen.width} × ${window.screen.height}`
    : '';

  const host = typeof location !== 'undefined' ? (location.host || 'localhost') : 'localhost';
  const protocol = typeof location !== 'undefined' ? location.protocol.replace(':', '').toUpperCase() : 'HTTPS';

  // Clear legacy test keys from storage
  try {
    if (user?.id) localStorage.removeItem(`mailgrant_sessions_${user.id}`);
    localStorage.removeItem('mailgrant_sessions_default');
  } catch {}

  return {
    id: 'current-session',
    name: `${browser} on ${os}`,
    browser,
    os,
    icon: iconName,
    screenRes,
    host,
    protocol,
    userEmail: user?.email || '',
    userId: user?.id || '',
    isCurrent: true,
    status: 'Active now'
  };
}

/**
 * Top Cyber Telemetry Overview Banner matching the Inbox Pattern.
 */
function profileTelemetryBanner({ state = {}, user = {}, session = {}, roleName = '' }) {
  const currentAccent = getAccent();
  const currentTheme = getThemeSetting();

  return `
    <section class="inbox-telemetry-banner glass-neon-card" aria-label="Profile and Workspace Telemetry">
      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Account Identity</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-number">${esc(user.name?.split(' ')[0] || 'User')}</strong>
          <span class="telemetry-pill active">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span>Google Synced</span>
          </span>
        </div>
      </div>

      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Current Workspace</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-text">${esc(state.workspace?.name || 'Workspace')}</strong>
          <span class="telemetry-pill ${state.owner ? 'positive' : 'neutral'}">${state.owner ? 'Workspace Admin' : 'Member'}</span>
        </div>
      </div>

      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Security & Isolation</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-text">KMS Encrypted</strong>
          <span class="telemetry-pill positive">Zero Plaintext</span>
        </div>
      </div>

      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Active Session</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-text">${esc(session.os)} · ${esc(session.browser.split(' ')[0])}</strong>
          <span class="telemetry-pill active">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span>Protected SSL</span>
          </span>
        </div>
      </div>
    </section>
  `;
}

/**
 * Tab Navigation for Settings & Profile Hub
 */
function settingsNavTabs({ activeTab = 'profile', isOwner = false }) {
  return `
    <div class="inbox-toolbar settings-toolbar glass-neon-card" style="margin-bottom: 24px; border-radius: var(--radius-lg);">
      <div class="inbox-filter-tabs" role="tablist" aria-label="Settings sections">
        <button type="button" class="inbox-tab-btn ${activeTab === 'profile' ? 'active' : ''}" data-settings-tab="profile" role="tab" aria-selected="${activeTab === 'profile'}">
          ${icon('people')}
          <span>Profile & Account</span>
        </button>
        <button type="button" class="inbox-tab-btn ${activeTab === 'theme' ? 'active' : ''}" data-settings-tab="theme" role="tab" aria-selected="${activeTab === 'theme'}">
          ${icon('contrast')}
          <span>Theme & Appearance</span>
        </button>
        <button type="button" class="inbox-tab-btn ${activeTab === 'workspace' ? 'active' : ''}" data-settings-tab="workspace" role="tab" aria-selected="${activeTab === 'workspace'}">
          ${icon('shield')}
          <span>Workspace Data & Export</span>
        </button>
        ${isOwner ? `
          <button type="button" class="inbox-tab-btn ${activeTab === 'danger' ? 'active' : ''}" data-settings-tab="danger" role="tab" aria-selected="${activeTab === 'danger'}">
            ${icon('alert')}
            <span>Admin Controls</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Personal Identity Section (Avatar, Name, Google Account, Active Device Session)
 */
function personalIdentitySection({ user = {}, userInit = 'U', hasAvatar = false, session = {}, roleName = '', activeTab = 'profile' }) {
  return `
    <div class="settings-section" data-tab-section="profile" ${activeTab === 'profile' ? '' : 'style="display:none;"'}>
      <div class="settings-grid-split">
        <!-- Personal Information Card -->
        <section class="panel glass-neon-card">
          <div class="panel-head">
            <div>
              <h2>Personal Information</h2>
              <p>Your display name and profile picture appear in audit logs, access rule matrices, and workspace views.</p>
            </div>
            ${badge('Google Verified', 'green')}
          </div>
          <div class="panel-body">
            <div class="avatar-uploader-card">
              <div class="profile-avatar-medium">
                ${hasAvatar ? `<img src="${esc(user.avatar)}" class="avatar-photo" alt="${esc(user.name || 'User')}" />` : `<span class="avatar-initials">${userInit}</span>`}
              </div>
              <div class="avatar-actions">
                <input type="file" id="avatar-file-input" accept="image/*" style="display:none" aria-label="Upload profile image">
                <div class="button-row">
                  <button type="button" class="btn primary small" data-action="trigger-avatar-upload">
                    ${icon('camera')}<span>Change photo</span>
                  </button>
                  ${hasAvatar ? `
                    <button type="button" class="btn danger small" data-action="remove-avatar">
                      ${icon('trash')}<span>Remove photo</span>
                    </button>
                  ` : ''}
                </div>
                <small class="subtitle" style="margin:0">PNG, JPG, WebP, or SVG stored in dedicated R2 avatar storage.</small>
              </div>
            </div>

            <form id="profile-form" style="margin-top: 16px;">
              ${field('Display name', 'name', 'e.g. Alex Morgan', `value="${esc(user.name || '')}" required minlength="2" maxlength="60"`)}
              <div class="field">
                <label for="f-email">Connected Google account email</label>
                <div class="input-with-badge">
                  <input id="f-email" type="email" value="${esc(user.email || '')}" disabled readonly style="opacity:0.85; cursor:not-allowed;">
                </div>
                <small>Linked Google SSO identity. Used for verified, passwordless dashboard sign-in.</small>
              </div>
              <p class="form-error" role="alert"></p>
              <div class="button-row" style="margin-top: 18px;">
                <button type="submit" class="btn primary">
                  ${icon('check')}<span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <!-- Logged-In Device & Session Security -->
        <section class="panel glass-neon-card">
          <div class="panel-head">
            <div>
              <h2>Logged-In Device & Security</h2>
              <p>Current active sign-in on this device. Real-time encryption active.</p>
            </div>
            <span class="badge green">1 Active Session</span>
          </div>
          <div class="panel-body">
            <div class="sessions-list">
              <div class="session-item current-session">
                <div class="session-device-icon">
                  ${icon(session.icon)}
                </div>
                <div class="session-device-info">
                  <div class="session-title-line">
                    <strong>${esc(session.name)}</strong>
                    <span class="session-badge-current"><span class="pulse-dot"></span> This device (Active now)</span>
                  </div>
                  <div class="session-meta-line">
                    <span>${esc(session.screenRes ? `${session.screenRes} · ` : '')}Signed in via Google OAuth</span>
                    <span>·</span>
                    <span>Encrypted TLS</span>
                  </div>
                </div>
                <div class="session-action">
                  <button type="button" class="btn danger small" data-action="revoke-current-session" title="Revoke this device session">
                    ${icon('logout')}<span>Revoke</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="notice" style="margin-top: 16px; background: var(--bg-subtle); border-color: var(--line);">
              <div style="display:flex; align-items:flex-start; gap:10px;">
                <span style="color:var(--green); flex-shrink:0; margin-top:2px;">${icon('shield')}</span>
                <div>
                  <strong style="color:var(--ink); display:block; font-size:12.5px; margin-bottom:2px;">Protected Session</strong>
                  <span style="color:var(--muted); font-size:11.5px; line-height:1.5; display:block;">
                    Your Google credentials stay with Google. Mailgrant never stores or handles your Google password.
                  </span>
                </div>
              </div>
            </div>

            <div class="settings-account-actions" style="margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); display: flex; gap: 10px; flex-wrap: wrap;">
              <a class="btn small outline" href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
                <span>Google account permissions</span>
                ${icon('arrow')}
              </a>
              <button type="button" class="btn small danger-outline" data-action="logout">
                ${icon('logout')}
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

/**
 * Theme & Cyber Appearance Customization Area
 */
export function themeSelectionArea(activeTab = 'theme') {
  const currentSetting = getThemeSetting();
  const currentAccent = getAccent();

  return `
    <div class="settings-section" data-tab-section="theme" ${activeTab === 'theme' ? '' : 'style="display:none;"'}>
      <section class="panel glass-neon-card theme-settings-panel">
        <div class="panel-head">
          <div>
            <h2>Theme & Cyber Appearance</h2>
            <p>Customize your workspace interface mode and signature cyber neon accent color.</p>
          </div>
          ${badge(currentSetting.toUpperCase(), 'blue')}
        </div>
        <div class="panel-body">
          <!-- Base Mode Picker (Dark / Light / Auto) -->
          <div class="theme-picker-group">
            <!-- Dark Cyber Neon -->
            <button type="button" class="theme-choice-card ${currentSetting === 'dark' ? 'active' : ''}" data-set-theme="dark" aria-label="Select Dark Neon Theme">
              <div class="theme-preview-box dark-preview" aria-hidden="true">
                <div class="p-side"></div>
                <div class="p-body">
                  <div class="p-line" style="width: 60%"></div>
                  <div class="p-card"></div>
                </div>
              </div>
              <strong>
                <span>Pitch Black Neon</span>
                ${currentSetting === 'dark' ? badge('Active', 'green') : ''}
              </strong>
              <small>Deep pitch black (#09090b) with vibrant neon glows and high-contrast ambient shadows.</small>
            </button>

            <!-- Clean Light -->
            <button type="button" class="theme-choice-card ${currentSetting === 'light' ? 'active' : ''}" data-set-theme="light" aria-label="Select Clean Light Theme">
              <div class="theme-preview-box light-preview" aria-hidden="true">
                <div class="p-side"></div>
                <div class="p-body">
                  <div class="p-line" style="width: 60%"></div>
                  <div class="p-card"></div>
                </div>
              </div>
              <strong>
                <span>Clean Slate Light</span>
                ${currentSetting === 'light' ? badge('Active', 'green') : ''}
              </strong>
              <small>Airy daytime aesthetic with visible physical elevation shadows and crisp contrast.</small>
            </button>

            <!-- System Auto -->
            <button type="button" class="theme-choice-card ${currentSetting === 'system' ? 'active' : ''}" data-set-theme="system" aria-label="Select System Theme">
              <div class="theme-preview-box system-preview" aria-hidden="true">
                <div class="p-side" style="opacity:0.8"></div>
                <div class="p-body">
                  <div class="p-line" style="width: 50%"></div>
                  <div class="p-card" style="opacity:0.8"></div>
                </div>
              </div>
              <strong>
                <span>System Synchronized</span>
                ${currentSetting === 'system' ? badge('Active', 'green') : ''}
              </strong>
              <small>Automatically synchronizes with your operating system dark/light schedule.</small>
            </button>
          </div>

          <!-- Neon Accent Color Palette -->
          <div class="accent-palette-section" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line);">
            <div style="margin-bottom: 14px;">
              <strong style="font-size: 13.5px; color: var(--ink); display: block; margin-bottom: 3px;">Signature Cyber Accent Color</strong>
              <span style="font-size: 12px; color: var(--muted); display: block;">
                Select your signature neon accent color. Synchronizes across live navigation, badges, pills, and ambient shadows.
              </span>
            </div>

            <div class="accent-palette-grid">
              <!-- Crimson Red -->
              <button type="button" class="accent-choice-card ${currentAccent === 'red' ? 'active' : ''}" data-set-accent="red" aria-label="Crimson Red">
                <span class="accent-color-disc" style="background:#f43f5e; box-shadow: 0 0 12px rgba(244,63,94,0.6);"></span>
                <div class="accent-choice-meta">
                  <strong>Crimson Red</strong>
                  <small>High-contrast neon red</small>
                </div>
                ${currentAccent === 'red' ? badge('Active', 'green') : ''}
              </button>

              <!-- Cyber Cyan -->
              <button type="button" class="accent-choice-card ${currentAccent === 'cyan' ? 'active' : ''}" data-set-accent="cyan" aria-label="Cyber Cyan">
                <span class="accent-color-disc" style="background:#00f0ff; box-shadow: 0 0 12px rgba(0,240,255,0.6);"></span>
                <div class="accent-choice-meta">
                  <strong>Cyber Cyan</strong>
                  <small>Electric blue matrix</small>
                </div>
                ${currentAccent === 'cyan' ? badge('Active', 'green') : ''}
              </button>

              <!-- Neon Green -->
              <button type="button" class="accent-choice-card ${currentAccent === 'green' ? 'active' : ''}" data-set-accent="green" aria-label="Neon Green">
                <span class="accent-color-disc" style="background:#10b981; box-shadow: 0 0 12px rgba(16,185,129,0.6);"></span>
                <div class="accent-choice-meta">
                  <strong>Neon Green</strong>
                  <small>Matrix emerald glow</small>
                </div>
                ${currentAccent === 'green' ? badge('Active', 'green') : ''}
              </button>

              <!-- Cyber Purple -->
              <button type="button" class="accent-choice-card ${currentAccent === 'purple' ? 'active' : ''}" data-set-accent="purple" aria-label="Cyber Purple">
                <span class="accent-color-disc" style="background:#a855f7; box-shadow: 0 0 12px rgba(168,85,247,0.6);"></span>
                <div class="accent-choice-meta">
                  <strong>Cyber Purple</strong>
                  <small>Synthwave violet</small>
                </div>
                ${currentAccent === 'purple' ? badge('Active', 'green') : ''}
              </button>

              <!-- Solar Amber -->
              <button type="button" class="accent-choice-card ${currentAccent === 'amber' ? 'active' : ''}" data-set-accent="amber" aria-label="Solar Amber">
                <span class="accent-color-disc" style="background:#f59e0b; box-shadow: 0 0 12px rgba(245,158,11,0.6);"></span>
                <div class="accent-choice-meta">
                  <strong>Solar Amber</strong>
                  <small>Warm golden glow</small>
                </div>
                ${currentAccent === 'amber' ? badge('Active', 'green') : ''}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

/**
 * Workspace Data Protection, Retention, and Configuration Export Section
 */
function workspaceRetentionSection({ state = {}, isOwner = false, activeTab = 'workspace' }) {
  const m = state.mailbox || {};
  const hasAlias = Boolean(m.alias);

  return `
    <div class="settings-section" data-tab-section="workspace" ${activeTab === 'workspace' ? '' : 'style="display:none;"'}>
      <div class="settings-grid-split">
        <!-- Security Architecture & Data Retention Card -->
        <section class="panel glass-neon-card">
          <div class="panel-head">
            <div>
              <h2>Data Retention & Security Architecture</h2>
              <p>Strict boundaries govern every message arriving through Mailgrant.</p>
            </div>
            ${badge('Active Policy', 'green')}
          </div>
          <div class="panel-body">
            <div class="settings-policy-list">
              <div class="policy-item">
                <div class="policy-icon-wrap">${icon('lock')}</div>
                <div>
                  <strong>Encrypted KMS Storage</strong>
                  <p>Sensitive message content is encrypted with AES-GCM before storage using Cloudflare KMS managed keys.</p>
                </div>
              </div>

              <div class="policy-item">
                <div class="policy-icon-wrap">${icon('clock')}</div>
                <div>
                  <strong>Automated Ephemeral Purging</strong>
                  <p>Retention expiry is verified before every single read. Messages purge automatically based on rule duration (e.g. 15 minutes).</p>
                </div>
              </div>

              <div class="policy-item">
                <div class="policy-icon-wrap">${icon('shield')}</div>
                <div>
                  <strong>Code-Only Zero-Plaintext Isolation</strong>
                  <p>Codes-only rules isolate the 6-digit OTP code and discard the raw message body, headers, and metadata completely.</p>
                </div>
              </div>
            </div>

            <div class="notice" style="margin-top: 18px;">
              The server securely projects matching message content. This is not end-to-end encryption. Backups expire on Cloudflare's schedule.
            </div>
          </div>
        </section>

        <!-- Configuration Backup & Export Card -->
        <section class="panel glass-neon-card">
          <div class="panel-head">
            <div>
              <h2>Export Workspace Configuration</h2>
              <p>Backup or migrate your approved sender rules and team permissions.</p>
            </div>
            ${badge('JSON Format', 'blue')}
          </div>
          <div class="panel-body">
            <p class="subtitle" style="margin-bottom: 16px; line-height: 1.6;">
              Downloads a complete snapshot of your workspace configuration, including approved sender rules, extraction modes, retention minutes, and team recipient permission grants.
            </p>
            
            <div class="export-spec-box" style="background:var(--bg-subtle); padding:14px; border-radius:var(--radius-md); border:1px solid var(--line); margin-bottom:18px;">
              <div style="font-size:12px; color:var(--muted); margin-bottom:6px;"><strong>Included in export:</strong></div>
              <ul style="margin:0; padding-left:18px; font-size:12px; color:var(--ink-secondary); line-height:1.6;">
                <li>Rule patterns, regex filters, and wildcards</li>
                <li>Extraction modes (Codes-only, Sign-in links, Read)</li>
                <li>Team recipient permission matrix</li>
              </ul>
              <small style="color:var(--muted); display:block; margin-top:8px;">* No raw email contents or credentials are ever included.</small>
            </div>

            <button type="button" class="btn primary small" data-action="export">
              ${icon('download')}
              <span>Download Configuration (JSON)</span>
            </button>
          </div>
        </section>
      </div>

      ${hasAlias ? `
        <!-- Optional Inbound Forwarding Stream Pipeline Details -->
        <section class="panel glass-neon-card" style="margin-top: 20px;">
          <div class="panel-head">
            <div>
              <h2>Dedicated Inbound Mail Forwarding (Worldwide Compatibility)</h2>
              <p>Forwarding keeps unrelated messages out of Mailgrant entirely and works with Outlook, Yahoo, Gmail, iCloud, Proton, or any corporate domain.</p>
            </div>
            ${badge(m.verified_at ? 'Pipeline Verified' : 'Awaiting Mail', m.verified_at ? 'green' : 'amber')}
          </div>
          <div class="panel-body">
            <div style="display:flex; flex-direction:column; gap:12px;">
              <label class="forwarding-label" for="settings-alias-copy">Inbound Receiving Address</label>
              <div class="copy-box">
                <code id="settings-alias-copy">${esc(m.alias)}</code>
                <button type="button" class="icon-btn" data-copy="${esc(m.alias)}" aria-label="Copy receiving address">${icon('copy')}</button>
              </div>
              <div class="button-row" style="margin-top: 8px;">
                <button type="button" class="btn small outline" data-action="setup">
                  ${icon('mail')}
                  <span>View Forwarding Confirmation Code</span>
                </button>
                <button type="button" class="btn small" data-action="forwarding-guide">
                  <span>Forwarding setup instructions</span>
                  ${icon('arrow')}
                </button>
              </div>
            </div>
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

/**
 * Workspace Owner Controls & Destructive Actions
 */
function ownerDangerZoneSection({ state = {}, activeTab = 'danger' }) {
  if (!state.owner) return '';
  const m = state.mailbox || {};

  return `
    <div class="settings-section" data-tab-section="danger" ${activeTab === 'danger' ? '' : 'style="display:none;"'}>
      <section class="panel glass-neon-card danger-zone-panel">
        <div class="panel-head">
          <div>
            <h2>Admin Controls & Workspace Management</h2>
            <p>Privileged management controls. Destructive actions cannot be undone.</p>
          </div>
          ${badge('Admin Privileged', 'red')}
        </div>
        <div class="panel-body">
          <div class="danger-actions-grid">
            <!-- Action 1: Purge Dispatches -->
            <div class="danger-action-tile">
              <div class="danger-action-meta">
                <strong>Purge Retained Dispatches</strong>
                <p>Immediately purges all cached emails and codes stored in this workspace. Originals in your mail account are untouched.</p>
              </div>
              <button type="button" class="btn small danger" data-action="purge">
                ${icon('trash')}
                <span>Delete Stored Messages</span>
              </button>
            </div>

            <!-- Action 2: Rotate Forwarding Address (if applicable) -->
            ${m.forwarding_available !== false ? `
              <div class="danger-action-tile">
                <div class="danger-action-meta">
                  <strong>Rotate Inbound Address</strong>
                  <p>Generates a new random forwarding address. The previous address immediately stops accepting inbound mail.</p>
                </div>
                <button type="button" class="btn small outline" data-action="rotate">
                  ${icon('refresh')}
                  <span>Rotate Address</span>
                </button>
              </div>
            ` : ''}

            <!-- Action 3: Delete Workspace -->
            <div class="danger-action-tile destructive">
              <div class="danger-action-meta">
                <strong style="color:var(--red);">Delete Entire Workspace</strong>
                <p>Permanently removes this workspace, all approved rules, team member grants, keys, and dispatches.</p>
              </div>
              <button type="button" class="btn small danger" data-action="delete-workspace">
                ${icon('trash')}
                <span>Delete Workspace</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

// Client-side instant tab switcher
let tabListenerAttached = false;
function initSettingsTabSwitcher() {
  if (tabListenerAttached || typeof document === 'undefined') return;
  tabListenerAttached = true;

  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-settings-tab]');
    if (!tabBtn) return;

    const tab = tabBtn.dataset.settingsTab;
    document.querySelectorAll('[data-settings-tab]').forEach(b => {
      const isSelected = b === tabBtn;
      b.classList.toggle('active', isSelected);
      b.setAttribute('aria-selected', String(isSelected));
    });

    document.querySelectorAll('[data-tab-section]').forEach(sec => {
      sec.style.display = sec.dataset.tabSection === tab ? '' : 'none';
    });
  });
}

/**
 * Redesigned Unified Profile & Workspace Settings Page
 */
export function profilePage({ state = {}, me = {}, demo = false, tab = 'profile' }) {
  const user = me?.user || {};
  const hasAvatar = Boolean(user.avatar);
  const userInit = initials(user.name || user.email || 'U');
  const roleName = state?.owner ? 'Workspace Administrator' : 'Team Member';
  const session = getAuthenticDeviceSession(user);
  const isOwner = Boolean(state?.owner);
  const activeTab = (tab && tab !== 'all') ? tab : 'profile';

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(initSettingsTabSwitcher);
  }

  return heading(
    'Settings & Profile',
    'Manage your identity, cyber appearance, session security, workspace retention policies, and administrative controls.',
    `<div class="page-head-actions">
      ${isOwner ? `
        <button type="button" class="btn small outline" data-action="export" title="Export workspace configuration JSON">
          ${icon('download')}
          <span>Export Config</span>
        </button>
      ` : ''}
      <button type="button" class="btn small danger-outline" data-action="logout" title="Sign out of your account">
        ${icon('logout')}
        <span>Sign out</span>
      </button>
    </div>`
  ) + `
    <div class="settings-profile-hub">
      <!-- 1. Top Cyber Telemetry Overview Banner -->
      ${profileTelemetryBanner({ state, user, session, roleName })}

      <!-- 2. Settings & Profile Filter Tabs -->
      ${settingsNavTabs({ activeTab, isOwner })}

      <!-- 3. Personal Identity & Profile Section -->
      ${personalIdentitySection({ user, userInit, hasAvatar, session, roleName, activeTab })}

      <!-- 4. Cyber Theme & Appearance Section -->
      ${themeSelectionArea(activeTab)}

      <!-- 5. Workspace Data Retention & Export Section -->
      ${workspaceRetentionSection({ state, isOwner, activeTab })}

      <!-- 6. Workspace Owner Controls & Danger Zone -->
      ${ownerDangerZoneSection({ state, activeTab })}
    </div>
  `;
}
