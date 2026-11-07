/**
 * Mailgrant Modern High-Tech Cyber Security Dashboard
 * Features:
 *  - Executive Intelligence Briefings with Live Security Telemetry
 *  - Glowing KPI Numbers & Telemetry Counters
 *  - Fast-Path Quick Actions with Cyber Neon Glow
 *  - Real-Time Security Audits Overview & Immutable Activity Ledger
 *  - Ephemeral Shared Inbox Snapshot & Approved Rules Matrix
 */

import { icon } from '../components/icons.js';
import { getCompanyLogo, providerLogos } from '../components/logos.js';
import { esc, initials, badge, btn, empty, ago, heading } from './common.js';
import { actionNames } from './activity.js';

export function dashboardPage({ state = {}, me = {} }) {
  const rules = state.rules || [];
  const messages = state.messages || [];
  const events = state.events || [];
  const members = state.members || [];
  const grants = state.grants || [];
  const activeRules = rules.filter(r => r.enabled);
  const activeRulesCount = activeRules.length;
  const firstName = (me?.user?.name || 'Workspace User').split(' ')[0];
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const workspaceName = state.workspace?.name || 'Personal Workspace';
  const gmailConnected = !!state.gmail_connected;
  const mailboxEmail = state.mailbox?.email || state.workspace?.mailbox_email || '';
  const isOwner = !!state.owner;

  // Filter latest 6 security audit events
  const recentAudits = events.slice(0, 6);

  return `
    <div class="dashboard-page-container">
      ${heading(
        `Good ${timeGreeting}, ${firstName}`,
        isOwner 
          ? 'Selective zero-trust overview of your mail pipelines, approved sender rules, and team keys.' 
          : 'You have protected, selective access to authorized company communications and login verification.',
        isOwner ? `
          <div class="inbox-head-actions">
            <button type="button" class="btn small primary-glow" data-action="refresh" title="Sync Mailbox now">${icon('refresh')}<span>Sync Mailbox</span></button>
            <button type="button" class="btn small outline" data-action="key" title="Issue access key">${icon('key')}<span>Issue Key</span></button>
          </div>
        ` : ''
      )}

      <!-- Top Cyber Telemetry Overview Banner (Exact Inbox Pattern) -->
      <section class="inbox-telemetry-banner glass-neon-card" aria-label="Dashboard Overview Metrics">
        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Boundary Policy</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-number">${activeRulesCount.toString().padStart(2, '0')}</strong>
            <span class="telemetry-pill ${activeRulesCount > 0 ? 'active' : 'standby'}">
              <span class="pulse-dot" aria-hidden="true"></span>
              <span>${activeRulesCount > 0 ? 'Filtering Active' : 'Standby'}</span>
            </span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Mailbox Pipeline</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${gmailConnected ? 'Google OAuth Synced' : (mailboxEmail ? 'Inbound Active' : 'Setup Ready')}</strong>
            <span class="telemetry-pill positive">${gmailConnected ? 'KMS Encrypted' : 'Ready'}</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Data Retention</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${messages.length} Retained Message${messages.length === 1 ? '' : 's'}</strong>
            <span class="telemetry-pill neutral">Zero Plaintext</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Team & Keys</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${members.length} Member${members.length === 1 ? '' : 's'} · ${(state.keys || []).length} Keys</strong>
            <span class="telemetry-pill positive">Zero Passwords Shared</span>
          </div>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- 2. HIGH-IMPACT KPI NUMBERS & TELEMETRY GRID                       -->
      <!-- ================================================================= -->
      <section class="dashboard-stats-grid" aria-label="Workspace Metrics">
        
        <!-- Stat 1: Approved Rules -->
        <div class="dashboard-stat-card" data-page="rules" role="button" tabindex="0">
          <div class="stat-card-header">
            <span class="stat-label">Approved Rules</span>
            <span class="stat-icon-wrap accent-glow">${icon('shield')}</span>
          </div>
          <div class="stat-number-row">
            <strong class="stat-number">${activeRulesCount.toString().padStart(2, '0')}</strong>
            <span class="stat-trend-pill positive">${activeRulesCount > 0 ? 'Active' : 'Standby'}</span>
          </div>
          <div class="stat-footer-text">
            <span>${rules.length} configured</span> · Strict sender matching
          </div>
        </div>

        <!-- Stat 2: Connected Mailboxes -->
        <div class="dashboard-stat-card" data-page="mailboxes" role="button" tabindex="0">
          <div class="stat-card-header">
            <span class="stat-label">Secured Mailboxes</span>
            <span class="stat-icon-wrap accent-glow">${icon('mail')}</span>
          </div>
          <div class="stat-number-row">
            <strong class="stat-number">${(gmailConnected ? 1 : (mailboxEmail ? 1 : 0)).toString().padStart(2, '0')}</strong>
            <span class="stat-trend-pill ${gmailConnected ? 'positive' : 'neutral'}">${gmailConnected ? 'OAuth Linked' : 'Active'}</span>
          </div>
          <div class="stat-footer-text">
            ${gmailConnected ? 'Real-time synchronization' : 'Inbound forwarding available'}
          </div>
        </div>

        <!-- Stat 3: Authorized Members -->
        <div class="dashboard-stat-card" data-page="people" role="button" tabindex="0">
          <div class="stat-card-header">
            <span class="stat-label">${isOwner ? 'Active Members' : 'Access Level'}</span>
            <span class="stat-icon-wrap accent-glow">${icon('people')}</span>
          </div>
          <div class="stat-number-row">
            <strong class="stat-number">${isOwner ? Math.max(0, members.length - 1).toString().padStart(2, '0') : '01'}</strong>
            <span class="stat-trend-pill positive">${isOwner ? 'Granular' : 'Isolated'}</span>
          </div>
          <div class="stat-footer-text">
            ${isOwner ? `${grants.length} permission grant${grants.length === 1 ? '' : 's'}` : 'Zero access to owner inbox'}
          </div>
        </div>

        <!-- Stat 4: Retained Messages -->
        <div class="dashboard-stat-card" data-page="inbox" role="button" tabindex="0">
          <div class="stat-card-header">
            <span class="stat-label">Available Messages</span>
            <span class="stat-icon-wrap accent-glow">${icon('inbox')}</span>
          </div>
          <div class="stat-number-row">
            <strong class="stat-number">${messages.length.toString().padStart(2, '0')}</strong>
            <span class="stat-trend-pill positive">Ephemeral</span>
          </div>
          <div class="stat-footer-text">
            Auto-purged after retention window
          </div>
        </div>

        <!-- Stat 5: Audit Trail -->
        <div class="dashboard-stat-card" data-page="activity" role="button" tabindex="0">
          <div class="stat-card-header">
            <span class="stat-label">Audit Events</span>
            <span class="stat-icon-wrap accent-glow">${icon('activity')}</span>
          </div>
          <div class="stat-number-row">
            <strong class="stat-number">${events.length.toString().padStart(2, '0')}</strong>
            <span class="stat-trend-pill positive">100% Trace</span>
          </div>
          <div class="stat-footer-text">
            Immutable 30-day security log
          </div>
        </div>

      </section>

      <!-- ================================================================= -->
      <!-- 3. QUICK ACTIONS BAR (FAST-PATHS)                                 -->
      <!-- ================================================================= -->
      ${isOwner ? `
        <section class="dashboard-quick-actions-section" aria-label="Quick Actions">
          <div class="section-label-row">
            <h2 class="section-title-neon">${icon('grid')} Quick Actions</h2>
            <span class="section-subtitle-muted">Instant workflows to manage your zero-trust boundaries</span>
          </div>

          <div class="quick-actions-grid">
            
            <button type="button" class="quick-action-card" data-action="rule">
              <div class="action-card-glow" aria-hidden="true"></div>
              <div class="action-icon-circle">${icon('rules')}</div>
              <div class="action-card-details">
                <div class="action-card-title">New Access Rule</div>
                <div class="action-card-desc">Approve specific company senders and exposure modes</div>
              </div>
              <span class="action-card-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" class="quick-action-card" data-action="key">
              <div class="action-card-glow" aria-hidden="true"></div>
              <div class="action-icon-circle">${icon('key')}</div>
              <div class="action-card-details">
                <div class="action-card-title">Issue Access Key</div>
                <div class="action-card-desc">Generate single-person keys for friction-free sharing</div>
              </div>
              <span class="action-card-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" class="quick-action-card" data-action="add-gmail">
              <div class="action-card-glow" aria-hidden="true"></div>
              <div class="action-icon-circle action-icon-gmail">${providerLogos.gmail(22)}</div>
              <div class="action-card-details">
                <div class="action-card-title">Connect Mailbox</div>
                <div class="action-card-desc">Link a Gmail address with protected OAuth read session</div>
              </div>
              <span class="action-card-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" class="quick-action-card" data-action="invite">
              <div class="action-card-glow" aria-hidden="true"></div>
              <div class="action-icon-circle">${icon('people')}</div>
              <div class="action-card-details">
                <div class="action-card-title">Invite Member</div>
                <div class="action-card-desc">Grant selective workspace access to a Google account</div>
              </div>
              <span class="action-card-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" class="quick-action-card" data-action="refresh">
              <div class="action-card-glow" aria-hidden="true"></div>
              <div class="action-icon-circle">${icon('refresh')}</div>
              <div class="action-card-details">
                <div class="action-card-title">Sync Mail Now</div>
                <div class="action-card-desc">Trigger instant check for fresh incoming messages</div>
              </div>
              <span class="action-card-arrow" aria-hidden="true">→</span>
            </button>

          </div>
        </section>
      ` : ''}

      <!-- ================================================================= -->
      <!-- 4. CORE DASHBOARD SPLIT: AUDITS OVERVIEW & SHARED INBOX SNAPSHOT  -->
      <!-- ================================================================= -->
      <div class="dashboard-two-column-grid">

        <!-- Column 1: Audits Overview Panel -->
        <section class="dashboard-panel audits-panel glass-neon-card" aria-label="Security Audits Overview">
          <div class="dashboard-panel-header">
            <div>
              <div class="panel-header-title-row">
                <span class="panel-header-icon">${icon('activity')}</span>
                <h2 class="panel-title">Security Audits Overview</h2>
              </div>
              <p class="panel-subtitle">Real-time immutable ledger of access grants, rule updates, and message views.</p>
            </div>
            <button type="button" class="dashboard-link-btn" data-page="activity">
              <span>View full log</span>
              ${icon('arrow')}
            </button>
          </div>

          <div class="audits-stream-container">
            ${recentAudits.length > 0 ? recentAudits.map(event => {
              const isView = event.action?.includes('view');
              const isRule = event.action?.includes('rule');
              const isKey = event.action?.includes('key');
              const iconType = isView ? 'inbox' : isRule ? 'rules' : isKey ? 'key' : 'shield';

              return `
                <div class="audit-stream-item">
                  <div class="audit-icon-badge ${isView ? 'view' : isRule ? 'rule' : 'security'}">
                    ${icon(iconType)}
                  </div>
                  <div class="audit-item-main">
                    <div class="audit-item-title-row">
                      <span class="audit-action-name">${esc(actionNames[event.action] || event.action)}</span>
                      <time class="audit-time" datetime="${new Date(event.created_at).toISOString()}">${ago(event.created_at)}</time>
                    </div>
                    <div class="audit-item-meta">
                      <span class="audit-actor">${esc(event.actor || 'System')}</span>
                      ${event.target ? `<span class="audit-divider">·</span><span class="audit-target">${esc(event.target)}</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="audit-empty-state">
                <span class="empty-icon">${icon('shield')}</span>
                <p class="empty-title">Clean Audit Ledger</p>
                <small class="empty-desc">New access actions and message views will be verified and logged here.</small>
              </div>
            `}
          </div>

          <div class="dashboard-panel-footer">
            <div class="footer-trust-badge">
              <span class="trust-dot"></span>
              <span>Audit records cryptographically sealed with zero email body exposure</span>
            </div>
          </div>
        </section>

        <!-- Column 2: Shared Inbox Snapshot & Rule Boundaries -->
        <div class="dashboard-aside-column">
          
          <!-- Shared Inbox Quick Access Route Card -->
          <div class="dashboard-quick-route-card glass-neon-card" data-page="inbox" role="button" tabindex="0" aria-label="Open Shared Inbox">
            <div class="quick-route-content">
              <div class="quick-route-icon-box">
                ${icon('inbox')}
                ${messages.length > 0 ? '<span class="quick-route-pulse-dot" aria-hidden="true"></span>' : ''}
              </div>
              <div class="quick-route-details">
                <div class="quick-route-title-row">
                  <h3 class="panel-title" style="font-size:15.5px; margin:0; font-weight:700;">Shared Inbox</h3>
                  ${messages.length > 0 
                    ? badge(`${messages.length} Live`, 'green') 
                    : badge('Clear', 'neutral')}
                </div>
                <p class="quick-route-desc">
                  Selective zero-trust inbound stream. Open shared OTP sign-in codes, links, and messages.
                </p>
              </div>
            </div>
            <div class="quick-route-action-row">
              <span class="quick-route-badge-hint">
                ${icon('lock')}
                <span>Auto-purging zero-plaintext</span>
              </span>
              <span class="btn small primary-glow" style="pointer-events: none;">
                <span>Open Inbox</span>
                ${icon('arrow')}
              </span>
            </div>
          </div>

          <!-- Approved Companies / Rules Snapshot -->
          <section class="dashboard-panel rules-snapshot-panel glass-neon-card" aria-label="Approved Companies">
            <div class="dashboard-panel-header">
              <div>
                <div class="panel-header-title-row">
                  <span class="panel-header-icon">${icon('rules')}</span>
                  <h2 class="panel-title">${isOwner ? 'Approved Rules' : 'Shared With You'}</h2>
                </div>
                <p class="panel-subtitle">Companies permitted to cross the zero-trust boundary.</p>
              </div>
              ${isOwner ? `
                <button type="button" class="dashboard-link-btn" data-page="rules">
                  <span>Manage</span>
                  ${icon('arrow')}
                </button>
              ` : ''}
            </div>

            <div class="rules-snapshot-chips">
              ${activeRules.slice(0, 5).map((r, i) => `
                <div class="rule-chip-card" data-page="rules" role="button" tabindex="0">
                  <div class="rule-chip-icon">${getCompanyLogo(r.name || r.sender, 36, i)}</div>
                  <div class="rule-chip-info">
                    <span class="rule-chip-name">${esc(r.name)}</span>
                    <small class="rule-chip-sender">${esc(r.sender)}</small>
                  </div>
                  <span class="rule-chip-mode-badge ${r.mode}">${esc(r.mode.toUpperCase())}</span>
                </div>
              `).join('') || `
                <div class="rules-empty-inline">
                  <p>No active rules yet. Add a rule to allow specific company emails.</p>
                  ${isOwner ? `<button type="button" class="btn primary small" data-action="rule" style="margin-top:8px">${icon('plus')} Add First Rule</button>` : ''}
                </div>
              `}
            </div>
          </section>

        </div>

      </div>

    </div>
  `;
}

// Re-export as overviewPage for backwards compatibility with existing consumers
export const overviewPage = dashboardPage;

