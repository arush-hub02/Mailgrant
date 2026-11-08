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

  // Check if message belongs to a Team Pool
  const pool = (m.pools || [])[0] || (state.team_pools || []).find(p => (p.rules || []).some(r => r.id === m.rule_id || r.rule_id === m.rule_id));
  if (pool) {
    const memberCount = pool.members?.length || recipientMembers.length || 1;
    return {
      isShared: true,
      isPrivate: false,
      isPool: true,
      pool,
      text: `Team Pool: ${pool.name} (${memberCount} member${memberCount === 1 ? '' : 's'})`,
      recipients: recipientMembers,
      count: memberCount + 1
    };
  }

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
export function inboxEmptyState(state = {}, demo = false, isSearch = false, query = '', view = 'own') {
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

  const isReceivers = view === 'receivers';

  return `
    <div class="inbox-empty-card glass-neon-card">
      <div class="inbox-empty-ambient" aria-hidden="true"></div>
      
      <div class="inbox-empty-radar-wrap">
        <div class="radar-ping-ring" aria-hidden="true"></div>
        <div class="empty-icon-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="empty-svg-icon" aria-hidden="true">
            ${isReceivers 
              ? '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
              : '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
            }
          </svg>
        </div>
      </div>

      <div class="inbox-status-pill">
        <span class="status-pulse-dot" aria-hidden="true"></span>
        <span>${isReceivers ? 'TEAM POOLS & RECEIVERS ACTIVE' : 'ZERO-TRUST BOUNDARY ACTIVE · CLEAR'}</span>
      </div>

      <h3 class="empty-title">${isReceivers ? 'No Active Team Pool Dispatches' : 'Your Mailbox Stream is Secure & Clear'}</h3>
      <p class="empty-desc">
        ${isReceivers 
          ? 'When family or team members trigger sign-ins for pooled services, temporary verification codes and links will appear here automatically.'
          : 'No active ephemeral messages in this workspace. Inbound emails from approved senders will appear here automatically and auto-purge once their retention window expires.'
        }
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

      ${isReceivers ? (isOwner ? `
        <div class="empty-quick-action" style="margin-top: 12px;">
          <button type="button" class="btn primary btn-lg pulse-glow" data-action="create-team-pool">
            ${icon('plus')}
            <span>Create Team Access Pool</span>
          </button>
          <span class="empty-action-hint">Bundle sign-in codes for shared team or family services</span>
        </div>
      ` : '') : `
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
              <p>Link Outlook, Gmail, Yahoo, or copy your dedicated inbound forwarding address.</p>
            </div>
            <span class="guidance-link">Mailbox setup →</span>
          </div>
        </div>
      `}

    </div>
  `;
}

/**
 * Renders the modern high-tech message feed cards with full sharing transparency.
 */
export function messageList(messages, state, isSearch = false, query = '', view = 'own') {
  if (!messages || !messages.length) {
    return inboxEmptyState(state, Boolean(state?.demo), isSearch, query, view);
  }

  const rules = state?.rules || [];

  return messages.map((m, i) => {
    const rule = rules.find(r => r.id === m.rule_id || r.name === m.name);
    const sharing = getMessageSharing(m, state);
    const modeBadgeColor = m.mode === 'codes' ? 'blue' : m.mode === 'links' ? 'green' : 'purple';

    const pool = (m.pools || [])[0] || sharing.pool;
    const isPool = Boolean(pool);

    const intentText = m.mode === 'codes'
      ? (isPool ? `Team pool sign-in OTP for ${pool.name}` : 'Private sign-in verification code extracted & ready')
      : m.mode === 'links'
        ? 'Approved single-use login link extracted'
        : 'Approved read-only message ready to view';

    const otpCode = m.code || m.content?.code || (m.content?.text?.match(/\b(\d{6})\b/)?.[1]);

    return `
      <article 
        class="inbox-feed-card glass-neon-card ${isPool ? 'is-team-pool' : ''}" 
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
            
            ${isPool ? `
              <span class="inbox-card-pool-tag" title="Pooled for team/family access">
                <span class="pool-icon-symbol">${icon('people')}</span>
                <span>${esc(pool.name)}</span>
              </span>
            ` : ''}

            <span class="inbox-card-rule-tag" title="Matched Rule">
              ${icon('shield')}
              <span>${esc(rule?.sender || 'Verified Sender')}</span>
            </span>
          </div>

          <p class="inbox-card-intent">${intentText}</p>

          ${otpCode ? `
            <div class="inbox-card-otp-banner" onclick="event.stopPropagation()">
              <span class="otp-banner-label">Sign-in Code:</span>
              <span class="otp-banner-code">${esc(otpCode)}</span>
              <button type="button" class="btn-copy-code" data-copy-otp="${esc(otpCode)}" title="Copy OTP to clipboard">
                ${icon('copy')}
                <span>Copy Code</span>
              </button>
            </div>
          ` : ''}

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
 * Main Shared Inbox Page View with Segmented Tabs:
 * - Own Mailbox: Direct messages arriving to user's linked mailbox
 * - Receivers & Team Inboxes: Shared streams & Team Pools
 */
export function inboxPage({ state = {}, demo = false, filter = 'all', query = '', view = 'own', pool = 'all' }) {
  const allMessages = state.messages || [];
  const rules = state.rules || [];
  const isOwner = Boolean(state.owner);
  const teamPools = state.team_pools || [];

  // Partition messages into Own Mailbox vs Receivers/Shared Pools
  const ownMessages = allMessages.filter(m => {
    const s = getMessageSharing(m, state);
    return isOwner ? true : !s.isShared;
  });

  const receiverMessages = allMessages.filter(m => {
    const s = getMessageSharing(m, state);
    const hasPool = (m.pools && m.pools.length > 0) || Boolean(s.isPool);
    return !isOwner || s.isShared || hasPool;
  });

  // Base messages for active view
  const baseMessages = view === 'receivers' ? receiverMessages : ownMessages;

  // Filter by selected Team Pool if in Receivers tab
  const poolFiltered = (view === 'receivers' && pool !== 'all')
    ? baseMessages.filter(m => (m.pools || []).some(p => p.id === pool) || m.rule_id === pool)
    : baseMessages;

  // Filter messages based on active mode tab and search query
  const filtered = poolFiltered.filter(m => 
    (filter === 'all' || m.mode === filter) && 
    (m.name || '').toLowerCase().includes((query || '').toLowerCase())
  );

  // Tab counts
  const countAll = poolFiltered.length;
  const countCodes = poolFiltered.filter(m => m.mode === 'codes').length;
  const countLinks = poolFiltered.filter(m => m.mode === 'links').length;
  const countRead = poolFiltered.filter(m => m.mode === 'read').length;

  const activeGrants = (state.grants || []).filter(g => g.mode !== 'blocked' && (!g.expires_at || g.expires_at > Date.now()));
  const teamMemberIdsWithGrants = new Set(activeGrants.map(g => g.user_id));
  const teamGrantsCount = teamMemberIdsWithGrants.size;
  const activeRulesCount = rules.filter(r => r.enabled).length;

  return heading(
    'Shared Inbox',
    'Selective zero-trust inbound stream. Manage personal mail dispatches or shared team pools.',
    `<div class="inbox-head-actions">
      ${demo || isOwner ? `<button type="button" class="btn small primary-glow" data-action="simulate">${icon('plus')}<span>Simulate Email</span></button>` : ''}
      <button type="button" class="btn small outline" data-action="refresh" title="Sync now">${icon('refresh')}<span>Sync</span></button>
    </div>`
  ) + `
    <!-- Primary Top Segment Switcher: Own Mailbox vs Receivers & Team Inboxes -->
    <div class="inbox-view-switcher" role="tablist" aria-label="Inbox Scope">
      <button 
        type="button" 
        class="inbox-view-tab ${view === 'own' ? 'active' : ''}" 
        data-inbox-view="own"
        role="tab" 
        aria-selected="${view === 'own'}"
      >
        <span class="view-tab-icon">${icon('mail')}</span>
        <div class="view-tab-text">
          <span class="view-tab-title">Own Mailbox</span>
          <span class="view-tab-sub">Direct workspace dispatches</span>
        </div>
        <span class="view-tab-count">${ownMessages.length}</span>
      </button>

      <button 
        type="button" 
        class="inbox-view-tab ${view === 'receivers' ? 'active' : ''}" 
        data-inbox-view="receivers"
        role="tab" 
        aria-selected="${view === 'receivers'}"
      >
        <span class="view-tab-icon">${icon('people')}</span>
        <div class="view-tab-text">
          <span class="view-tab-title">Receivers & Team Inboxes</span>
          <span class="view-tab-sub">Shared access pools & team recipients</span>
        </div>
        <span class="view-tab-count">${receiverMessages.length}</span>
      </button>
    </div>

    <!-- When Receivers Tab is active: Display Multi-Pool Filter Bar -->
    ${view === 'receivers' ? `
      <div class="inbox-pools-bar glass-neon-card">
        <div class="inbox-pools-scroll" role="tablist" aria-label="Team Pools">
          <button 
            type="button" 
            class="pool-pill ${pool === 'all' ? 'active' : ''}" 
            data-pool-filter="all"
            role="tab"
            aria-selected="${pool === 'all'}"
          >
            <span class="pool-dot"></span>
            <span>All Receivers</span>
            <span class="pool-pill-count">${receiverMessages.length}</span>
          </button>

          ${teamPools.map(p => {
            const pCount = receiverMessages.filter(m => (m.pools || []).some(mp => mp.id === p.id)).length;
            return `
              <button 
                type="button" 
                class="pool-pill ${pool === p.id ? 'active' : ''}" 
                data-pool-filter="${esc(p.id)}"
                role="tab"
                aria-selected="${pool === p.id}"
                title="${esc(p.description || p.name)}"
              >
                <span class="pool-icon-symbol">${icon('people')}</span>
                <span>${esc(p.name)}</span>
                <span class="pool-pill-count">${pCount}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="inbox-pools-actions">
          ${isOwner ? `
            <button type="button" class="btn small primary" data-action="create-team-pool">
              ${icon('plus')}
              <span>+ New Team Pool</span>
            </button>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Cyber Telemetry Overview Banner -->
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
        <span class="telemetry-label">Current View</span>
        <div class="telemetry-value-row">
          <strong class="telemetry-text">${view === 'own' ? 'Own Mailbox' : 'Receivers & Pools'}</strong>
          <span class="telemetry-pill positive">${view === 'own' ? 'Direct Mail' : `${teamPools.length} Team Pool${teamPools.length === 1 ? '' : 's'}`}</span>
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
          <span class="telemetry-pill positive">${isOwner ? 'Active Grants' : 'Active'}</span>
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
        ${messageList(filtered, state, Boolean(query), query, view)}
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
