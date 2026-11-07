import { icon } from '../components/icons.js';
import { getCompanyLogo } from '../components/logos.js';
import { esc, vendor, badge, modes, ago, remain, heading } from './common.js';

/**
 * Compute granular recipient sharing information for a given message.
 * Reveals exactly who has access to this message within the shared inbox.
 */
export function getMessageSharing(m, state) {
  if (!state) return { text: 'Private', isShared: false, isPrivate: true, recipients: [], count: 1 };

  const owner = (state.members || []).find(mem => mem.id === state.workspace?.owner_id);
  const ownerName = owner?.name || (state.owner ? 'You (Owner)' : 'Workspace Owner');

  // Find all active grants for this message's rule
  const ruleGrants = (state.grants || []).filter(g => 
    g.rule_id === m.rule_id && 
    g.mode !== 'blocked' && 
    (!g.expires_at || g.expires_at > Date.now())
  );

  const recipientMembers = ruleGrants.map(g => {
    const mem = (state.members || []).find(u => u.id === g.user_id);
    return {
      id: g.user_id,
      name: mem?.name || mem?.email?.split('@')[0] || 'Team member',
      email: mem?.email || '',
      mode: g.mode
    };
  });

  const isOwner = Boolean(state.owner);

  if (isOwner) {
    if (recipientMembers.length > 0) {
      const namesList = recipientMembers.map(r => r.name.split(' ')[0]).join(', ');
      return {
        isShared: true,
        isPrivate: false,
        text: `Shared with: ${namesList} & You`,
        recipients: recipientMembers,
        count: recipientMembers.length + 1
      };
    } else {
      return {
        isShared: false,
        isPrivate: true,
        text: 'Private to Owner (No team grants yet)',
        recipients: [],
        count: 1
      };
    }
  } else {
    // Current viewer is an invited team member
    return {
      isShared: true,
      isPrivate: false,
      text: `Shared with you by ${ownerName.split(' ')[0]}`,
      recipients: recipientMembers,
      count: recipientMembers.length + 1
    };
  }
}

/**
 * Cyberpunk High-Tech Empty State with Guidance Cards & 1-Click Simulation.
 */
export function inboxEmptyState(state = {}, demo = false, isSearch = false, query = '') {
  if (isSearch) {
    return `
      <div class="inbox-empty-card glass-neon-card">
        <div class="empty-icon-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-svg-icon" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <h3 class="empty-title">No Matching Dispatches</h3>
        <p class="empty-desc">No active messages match <strong>"${esc(query)}"</strong>. Try clearing your search keyword or switching filter tabs.</p>
        <button type="button" class="btn small" onclick="const s = document.getElementById('inbox-search'); if(s){ s.value=''; s.dispatchEvent(new Event('input', {bubbles:true})); }">Clear search</button>
      </div>
    `;
  }

  return `
    <div class="inbox-empty-card glass-neon-card">
      <div class="inbox-empty-ambient" aria-hidden="true"></div>
      
      <div class="inbox-empty-radar-wrap">
        <div class="radar-ping-ring" aria-hidden="true"></div>
        <div class="empty-icon-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="empty-svg-icon" aria-hidden="true">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
        </div>
      </div>

      <div class="inbox-status-pill">
        <span class="status-pulse-dot" aria-hidden="true"></span>
        <span>ZERO-TRUST BOUNDARY ACTIVE · CLEAR</span>
      </div>

      <h3 class="empty-title">Your Shared Inbox is Secure & Clear</h3>
      <p class="empty-desc">
        No active ephemeral messages in this workspace. Inbound emails from approved senders will appear here automatically and auto-purge once their retention window expires.
      </p>

      ${demo ? `
        <div class="empty-quick-action">
          <button type="button" class="btn primary btn-lg pulse-glow" data-action="simulate">
            ${icon('plus')}
            <span>Simulate New Inbound Email</span>
          </button>
          <span class="empty-action-hint">One-click test · Generates an approved sample message instantly</span>
        </div>
      ` : ''}

      <div class="inbox-guidance-grid">
        <div class="guidance-card" data-page="rules" role="button" tabindex="0">
          <div class="guidance-card-icon">${icon('shield')}</div>
          <div class="guidance-card-content">
            <h4>1. Access Rules</h4>
            <p>Approve which services (Google, Claude, Notion) can deliver sign-in codes to this inbox.</p>
          </div>
          <span class="guidance-link">Configure rules →</span>
        </div>

        <div class="guidance-card" data-page="people" role="button" tabindex="0">
          <div class="guidance-card-icon">${icon('people')}</div>
          <div class="guidance-card-content">
            <h4>2. Team Permissions</h4>
            <p>Grant team members granular access to specific services without sharing your inbox.</p>
          </div>
          <span class="guidance-link">Manage access →</span>
        </div>

        <div class="guidance-card" data-page="mailboxes" role="button" tabindex="0">
          <div class="guidance-card-icon">${icon('mail')}</div>
          <div class="guidance-card-content">
            <h4>3. Inbound Pipeline</h4>
            <p>Link your Gmail account or copy your dedicated inbound forwarding address.</p>
          </div>
          <span class="guidance-link">Mailbox setup →</span>
        </div>
      </div>

    </div>
  `;
}

/**
 * Renders the modern high-tech message feed cards with full sharing transparency.
 */
export function messageList(messages, state, isSearch = false, query = '') {
  if (!messages || !messages.length) {
    return inboxEmptyState(state, Boolean(state?.demo), isSearch, query);
  }

  const rules = state?.rules || [];

  return messages.map((m, i) => {
    const rule = rules.find(r => r.id === m.rule_id || r.name === m.name);
    const sharing = getMessageSharing(m, state);
    const modeBadgeColor = m.mode === 'codes' ? 'blue' : m.mode === 'links' ? 'green' : 'purple';

    const intentText = m.mode === 'codes'
      ? 'Private sign-in verification code extracted & ready'
      : m.mode === 'links'
        ? 'Approved single-use login link extracted'
        : 'Approved read-only message ready to view';

    return `
      <article 
        class="inbox-feed-card glass-neon-card" 
        data-message="${esc(m.id)}" 
        role="button" 
        tabindex="0" 
        aria-label="Open message from ${esc(m.name)}"
      >
        <div class="inbox-card-left">
          ${getCompanyLogo(m.name || rule?.sender, 40, i)}
        </div>

        <div class="inbox-card-center">
          <div class="inbox-card-header-row">
            <h3 class="inbox-card-company">${esc(m.name)}</h3>
            <span class="inbox-card-rule-tag" title="Matched Rule">
              ${icon('shield')}
              <span>${esc(rule?.sender || 'Verified Sender')}</span>
            </span>
          </div>

          <p class="inbox-card-intent">${intentText}</p>

          <div class="inbox-card-sharing-row">
            <div class="inbox-sharing-pill ${sharing.isPrivate ? 'private' : 'shared'}" title="${esc(sharing.text)}">
              ${sharing.isPrivate ? icon('lock') : icon('people')}
              <span class="sharing-pill-label">${esc(sharing.text)}</span>
            </div>

            ${sharing.isPrivate && state?.owner ? `
              <button type="button" class="btn-quick-share" data-page="people" title="Grant team members access to this rule">
                <span>+ Share with team</span>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="inbox-card-right">
          <div class="inbox-card-badges-row">
            ${badge(modes[m.mode] || m.mode, modeBadgeColor)}
            <div class="inbox-card-expiry-badge" title="Auto-purges when retention window expires">
              <span class="expiry-dot" aria-hidden="true"></span>
              <span>${remain(m.expires_at)}</span>
            </div>
          </div>

          <div class="inbox-card-meta-bottom">
            <span class="inbox-card-time">${ago(m.received_at)}</span>
            <span class="btn-inspect-action">
              <span>Inspect</span>
              ${icon('arrow')}
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Main Shared Inbox Page View.
 */
export function inboxPage({ state = {}, demo = false, filter = 'all', query = '' }) {
  const allMessages = state.messages || [];
  const rules = state.rules || [];
  const isOwner = Boolean(state.owner);

  // Filter messages based on active tab and search query
  const filtered = allMessages.filter(m => 
    (filter === 'all' || m.mode === filter) && 
    (m.name || '').toLowerCase().includes((query || '').toLowerCase())
  );

  // Tab counts
  const countAll = allMessages.length;
  const countCodes = allMessages.filter(m => m.mode === 'codes').length;
  const countLinks = allMessages.filter(m => m.mode === 'links').length;
  const countRead = allMessages.filter(m => m.mode === 'read').length;

  // Compute team members with active grants
  const activeGrants = (state.grants || []).filter(g => g.mode !== 'blocked' && (!g.expires_at || g.expires_at > Date.now()));
  const teamMemberIdsWithGrants = new Set(activeGrants.map(g => g.user_id));
  const teamGrantsCount = teamMemberIdsWithGrants.size;

  const activeRulesCount = rules.filter(r => r.enabled).length;

  return heading(
    'Shared Inbox',
    'Selective zero-trust inbound stream. Only approved sign-in codes, links, and messages pass through.',
    `<div class="inbox-head-actions">
      ${demo || isOwner ? `<button type="button" class="btn small primary-glow" data-action="simulate">${icon('plus')}<span>Simulate Email</span></button>` : ''}
      <button type="button" class="btn small outline" data-action="refresh" title="Sync now">${icon('refresh')}<span>Sync</span></button>
    </div>`
  ) + `
    <!-- Top Cyber Telemetry Overview Banner -->
    <section class="inbox-telemetry-banner glass-neon-card" aria-label="Shared Inbox Metrics">
      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Active Dispatches</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-number">${countAll.toString().padStart(2, '0')}</strong>
          <span class="telemetry-pill ${countAll > 0 ? 'active' : 'standby'}">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span>${countAll > 0 ? 'Live Stream' : 'Standby'}</span>
          </span>
        </div>
      </div>

      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Boundary Policy</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-text">Strict Isolation</strong>
          <span class="telemetry-pill positive">${activeRulesCount} Rule${activeRulesCount === 1 ? '' : 's'} Active</span>
        </div>
      </div>

      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Data Retention</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-text">Auto-Purging</strong>
          <span class="telemetry-pill neutral">Zero Plaintext Storage</span>
        </div>
      </div>

      <div class="inbox-telemetry-item">
        <span class="telemetry-label">Shared Reach</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-text">${isOwner ? `${teamGrantsCount} Team Member${teamGrantsCount === 1 ? '' : 's'}` : 'Team Recipient'}</strong>
          <span class="telemetry-pill positive">${isOwner ? 'Granular Grants' : 'Active'}</span>
        </div>
      </div>
    </section>

    <!-- Main Message Feed Panel -->
    <section class="inbox-main-panel glass-neon-card">
      <!-- Toolbar Controls -->
      <div class="inbox-toolbar">
        <div class="inbox-filter-tabs" role="tablist">
          <button type="button" data-filter="all" class="inbox-tab-btn ${filter === 'all' ? 'active' : ''}" role="tab" aria-selected="${filter === 'all'}">
            <span>All messages</span>
            <span class="tab-count-pill">${countAll}</span>
          </button>
          <button type="button" data-filter="codes" class="inbox-tab-btn ${filter === 'codes' ? 'active' : ''}" role="tab" aria-selected="${filter === 'codes'}">
            <span>Codes</span>
            <span class="tab-count-pill">${countCodes}</span>
          </button>
          <button type="button" data-filter="links" class="inbox-tab-btn ${filter === 'links' ? 'active' : ''}" role="tab" aria-selected="${filter === 'links'}">
            <span>Links</span>
            <span class="tab-count-pill">${countLinks}</span>
          </button>
          <button type="button" data-filter="read" class="inbox-tab-btn ${filter === 'read' ? 'active' : ''}" role="tab" aria-selected="${filter === 'read'}">
            <span>Read-only</span>
            <span class="tab-count-pill">${countRead}</span>
          </button>
        </div>

        <div class="inbox-search-container">
          <label class="inbox-search-wrap" for="inbox-search">
            <span class="search-icon" aria-hidden="true">${icon('search')}</span>
            <input 
              id="inbox-search" 
              type="search" 
              aria-label="Filter companies or rules" 
              placeholder="Search companies or rules…" 
              value="${esc(query)}"
              autocomplete="off"
            >
            <span class="search-shortcut" title="Press forward slash to focus" aria-hidden="true">/</span>
          </label>
        </div>
      </div>

      <!-- Feed List Container -->
      <div id="message-list" class="inbox-feed-list">
        ${messageList(filtered, state, Boolean(query), query)}
      </div>

      <!-- Panel Footer -->
      <div class="inbox-panel-footer">
        <div class="footer-status-meta">
          <span class="footer-dot" aria-hidden="true"></span>
          <span>Showing up to 100 unexpired messages · Auto-purges when retention timer reaches zero</span>
        </div>
        <div class="footer-count-meta">
          <strong>${filtered.length}</strong> available dispatch${filtered.length === 1 ? '' : 'es'}
        </div>
      </div>
    </section>
  `;
}
