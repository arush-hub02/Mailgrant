import { icon } from '../components/icons.js';
import { getCompanyLogo } from '../components/logos.js';
import { esc, initials, badge, modes, heading, field, formFooter } from './common.js';
import { PERSON_PRESETS, openKeyModal, showKeyModal } from './keys.js';

export { PERSON_PRESETS, openKeyModal, showKeyModal };

/**
 * Normalizes and computes all display parameters for a person entity.
 */
function computePersonData(person, state) {
  const isOwner = person.id === state.workspace?.owner_id || person.role === 'owner';
  const isKey = person.type === 'key';
  const isInvite = person.type === 'invite';
  const isMember = person.type === 'member';

  // Compute status
  let statusLabel = 'Active';
  let statusClass = 'green';
  let isRevoked = false;
  let isExpired = false;
  let isLimitReached = false;

  // Expiration Text
  let expiryText = 'No expiry (Permanent)';
  let expirySub = '';

  if (isKey) {
    if (person.revoked_at) {
      statusLabel = 'Revoked';
      statusClass = 'red';
      isRevoked = true;
    } else if (person.expires_at && person.expires_at <= Date.now()) {
      const msSince = Date.now() - person.expires_at;
      const daysSince = Math.floor(msSince / 86400000);
      const daysUntilPurge = Math.max(1, 5 - daysSince);
      statusLabel = `Expired (${daysUntilPurge}d to delete)`;
      statusClass = 'amber';
      isExpired = true;
      expiryText = `Expired · Purges in ${daysUntilPurge}d`;
      expirySub = 'Auto-deletes from database after 5 days';
    } else if (person.max_views !== null && person.views >= person.max_views) {
      statusLabel = 'Limit Reached';
      statusClass = 'amber';
      isLimitReached = true;
    }
  } else if (isInvite) {
    statusLabel = 'Pending Invite';
    statusClass = 'amber';
  } else if (isOwner) {
    statusLabel = 'Workspace Administrator';
    statusClass = 'green';
  }

  const isActive = statusLabel === 'Active' || statusLabel === 'Workspace Administrator';

  // Channel badge
  const channelBadge = isKey 
    ? `<span class="person-type-badge key">${icon('key')} Direct Key & URL (No Login)</span>`
    : isInvite 
      ? `<span class="person-type-badge invite">${icon('mail')} Pending Invite</span>`
      : isOwner 
        ? `<span class="person-type-badge owner">${icon('shield')} Workspace Admin</span>`
        : `<span class="person-type-badge member">${icon('people')} Verified Member</span>`;

  // Initials
  let personInitials = 'P';
  if (isKey) {
    const raw = String(person.name || '').trim();
    const parts = raw.split(/[\s—–-]+/).filter(Boolean);
    personInitials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : (raw.slice(0, 2).toUpperCase() || 'KH');
  } else {
    personInitials = initials(person.name || person.email || 'Person');
  }

  // Permitted scopes with granular subdomain selection
  let permittedScopes = [];
  if (isKey) {
    permittedScopes = (person.scopes || []).map(s => ({
      name: s.name,
      mode: s.mode,
      subdomain: s.subdomain || '*'
    }));
  } else if (isMember) {
    if (isOwner) {
      permittedScopes = (state.rules || []).filter(r => r.enabled).map(r => ({
        name: r.name,
        mode: r.mode,
        subdomain: '*'
      }));
    } else {
      const memberGrants = (state.grants || []).filter(g => 
        g.user_id === person.id && 
        g.mode !== 'blocked' && 
        (!g.expires_at || g.expires_at > Date.now())
      );
      permittedScopes = memberGrants.map(g => {
        const rule = (state.rules || []).find(r => r.id === g.rule_id);
        return {
          name: rule?.name || 'Company',
          mode: g.mode,
          subdomain: g.subdomain || '*'
        };
      });
    }
  }

  if (isKey && !isExpired) {
    if (person.expires_at) {
      const msLeft = person.expires_at - Date.now();
      const daysLeft = Math.ceil(msLeft / 86400000);
      const hoursLeft = Math.ceil(msLeft / 3600000);
      if (msLeft <= 0) {
        expiryText = 'Expired';
      } else if (daysLeft > 1) {
        expiryText = `${daysLeft} days left`;
        expirySub = new Date(person.expires_at).toLocaleDateString();
      } else {
        expiryText = `${hoursLeft}h left`;
        expirySub = 'Expires today';
      }
    }
  } else if (isInvite) {
    const msLeft = person.expires_at - Date.now();
    const hoursLeft = Math.max(0, Math.ceil(msLeft / 3600000));
    expiryText = `${hoursLeft}h remaining`;
    expirySub = 'Single-use invite link';
  } else if (isOwner) {
    expiryText = 'Permanent Access';
  } else if (isMember) {
    expiryText = 'Session Active';
  }

  // Quotas / Message Open Allowance
  let quotaText = 'Unlimited opens';
  let percentViews = 0;
  if (isKey) {
    if (person.max_views !== null) {
      if (person.max_views === 1) {
        quotaText = person.views >= 1 ? '1/1 used (Burned)' : '1 open (Burn-after-read)';
        percentViews = person.views >= 1 ? 100 : 0;
      } else {
        quotaText = `${person.views} of ${person.max_views} opens used`;
        percentViews = Math.min(100, Math.round((person.views / person.max_views) * 100));
      }
    }
  } else if (isInvite) {
    quotaText = 'Pending signup';
  } else if (isOwner) {
    quotaText = 'Master inbox access';
  } else {
    quotaText = 'Restricted member views';
  }

  // Search indexing string
  const companyNames = permittedScopes.map(s => `${s.name} ${s.subdomain}`).join(' ');
  const searchIndex = `${person.name || ''} ${person.email || ''} ${person.prefix || ''} ${companyNames} ${person.type} ${statusLabel}`.toLowerCase();

  return {
    isOwner,
    isKey,
    isInvite,
    isMember,
    isActive,
    isRevoked,
    isExpired,
    isLimitReached,
    statusLabel,
    statusClass,
    channelBadge,
    personInitials,
    permittedScopes,
    expiryText,
    expirySub,
    quotaText,
    percentViews,
    searchIndex
  };
}

/**
 * Render a Single Person Table Row (High-Density View)
 */
function renderPersonRow(person, { state, me, demo, activeTab = 'direct' }) {
  const d = computePersonData(person, state);
  const filterType = d.isKey ? 'keys' : d.isInvite ? 'invites' : 'members';
  const distType = d.isKey ? 'direct' : 'platform';
  const isTabVisible = activeTab === 'all' || distType === activeTab;
  const personName = person.name || (d.isInvite ? person.email : 'Recipient');
  const subtext = d.isKey 
    ? `<code>${esc(person.prefix)}…</code> · Issued ${new Date(person.created_at).toLocaleDateString()}`
    : d.isInvite 
      ? `<code>${esc(person.email)}</code>`
      : `${esc(person.email || '')} · Joined ${new Date(person.joined_at || person.created_at).toLocaleDateString()}`;

  const portalUrl = `/access${demo ? '?demo=1' : ''}#key=${esc(person.prefix || '')}`;

  return `
    <tr class="person-table-row ${d.statusClass ? `status-${d.statusClass}` : ''}" 
        data-person-filter-type="${filterType}" 
        data-person-distribution-type="${distType}"
        data-person-search="${esc(d.searchIndex)}"
        style="display: ${isTabVisible ? '' : 'none'};">
      
      <!-- 1. Person Identity -->
      <td class="col-identity">
        <div class="table-identity-cell">
          <div class="person-avatar-mini ${d.isKey ? 'key' : d.isOwner ? 'owner' : ''}">
            <span>${esc(d.personInitials)}</span>
            ${d.isActive ? `<span class="online-indicator" aria-hidden="true"></span>` : ''}
          </div>
          <div class="identity-meta">
            <span class="person-display-name" title="${esc(personName)}">${esc(personName)}</span>
            <span class="person-subtext">${subtext}</span>
          </div>
        </div>
      </td>

      <!-- 2. Channel Type -->
      <td class="col-channel">
        ${d.channelBadge}
      </td>

      <!-- 3. Permitted Companies & Subdomains -->
      <td class="col-scopes">
        <div class="table-scopes-cell">
          ${d.permittedScopes.length ? `
            <div class="scope-badges-cluster">
              ${d.permittedScopes.slice(0, 3).map(s => {
                const modeClass = s.mode === 'codes' ? 'mode-codes' : s.mode === 'links' ? 'mode-links' : 'mode-read';
                const subText = s.subdomain && s.subdomain !== '*' ? `${s.subdomain}.*` : 'all subdomains';
                return `
                  <span class="table-scope-badge ${modeClass}" title="${esc(s.name)} · ${modes[s.mode]} · Subdomain: ${esc(s.subdomain)}">
                    <span class="badge-logo">${getCompanyLogo(s.name, 14)}</span>
                    <span class="badge-name">${esc(s.name)}</span>
                    <span class="badge-mode">${modes[s.mode]}</span>
                    <span class="badge-subdomain">${esc(subText)}</span>
                  </span>
                `;
              }).join('')}
              ${d.permittedScopes.length > 3 ? `
                <span class="table-scope-badge more" title="${d.permittedScopes.slice(3).map(s => `${s.name} (${modes[s.mode]} · ${s.subdomain})`).join(', ')}">
                  +${d.permittedScopes.length - 3} more
                </span>
              ` : ''}
            </div>
          ` : `
            <span class="no-scopes-label">${d.isInvite ? 'Configured upon join' : 'No companies allowed'}</span>
          `}
        </div>
      </td>

      <!-- 4. Restrictions & Limits (Shows 5-Day Auto-Purge Notice) -->
      <td class="col-restrictions">
        <div class="table-restrictions-cell">
          <div class="restriction-item">
            <span class="restriction-icon">${icon('clock')}</span>
            <span class="restriction-text">${esc(d.expiryText)}</span>
          </div>
          <div class="restriction-item">
            <span class="restriction-icon">${icon('shield')}</span>
            <span class="restriction-text">${esc(d.quotaText)}</span>
          </div>
          ${d.percentViews > 0 ? `
            <div class="table-progress-bar" title="${d.percentViews}% allowance used">
              <div class="progress-fill" style="width: ${d.percentViews}%;"></div>
            </div>
          ` : ''}
        </div>
      </td>

      <!-- 5. Security Status -->
      <td class="col-status">
        ${badge(d.statusLabel, d.statusClass)}
      </td>

      <!-- 6. Actions -->
      <td class="col-actions">
        <div class="table-actions-cell">
          ${d.isKey ? `
            <a class="table-action-btn" href="${portalUrl}" target="_blank" rel="noopener noreferrer" title="Open Recipient Direct Portal">
              ${icon('mail')}
              <span>Portal ↗</span>
            </a>
            ${d.isRevoked ? `
              <span class="action-revoked-tag">Revoked</span>
            ` : `
              <button type="button" class="table-action-btn danger" data-revoke-key="${esc(person.id)}" title="Revoke this key immediately">
                ${icon('trash')}
                <span>Revoke</span>
              </button>
            `}
          ` : d.isInvite ? `
            <button type="button" class="table-action-btn primary" data-resend-invite="${esc(person.email)}" data-invite-id="${esc(person.id)}" title="Generate fresh invitation link for this email">
              ${icon('refresh')}
              <span>Resend</span>
            </button>
            ${demo ? `<button type="button" class="table-action-btn" data-accept-demo="${esc(person.id)}">Accept</button>` : ''}
            <button type="button" class="table-action-btn danger" data-revoke-invite="${esc(person.id)}" title="Cancel Invitation">
              <span>Cancel</span>
            </button>
          ` : d.isOwner ? `
            <span class="action-owner-tag">${icon('shield')} Workspace Admin</span>
          ` : `
            ${state.rules?.length ? `
              <button type="button" class="table-action-btn" data-grant-member="${esc(person.id)}" data-grant-rule="${esc(state.rules[0]?.id)}" title="Configure Allowed Companies & Subdomains">
                <span>Configure</span>
              </button>
            ` : ''}
            <button type="button" class="table-action-btn danger" data-remove="${esc(person.id)}" title="Remove member from workspace">
              ${icon('trash')}
              <span>Remove</span>
            </button>
          `}
        </div>
      </td>
    </tr>
  `;
}

/**
 * Render a Single Person Card (Rich Visual View)
 */
function renderPersonCard(person, { state, me, demo, activeTab = 'direct' }) {
  const d = computePersonData(person, state);
  const filterType = d.isKey ? 'keys' : d.isInvite ? 'invites' : 'members';
  const distType = d.isKey ? 'direct' : 'platform';
  const isTabVisible = activeTab === 'all' || distType === activeTab;
  const personName = person.name || (d.isInvite ? person.email : 'Recipient');
  const portalUrl = `/access${demo ? '?demo=1' : ''}#key=${esc(person.prefix || '')}`;

  return `
    <article class="unified-person-card glass-neon-card ${d.statusClass ? `status-${d.statusClass}` : ''}" 
             data-person-filter-type="${filterType}"
             data-person-distribution-type="${distType}"
             data-person-search="${esc(d.searchIndex)}"
             style="display: ${isTabVisible ? 'flex' : 'none'};">
      <div class="person-card-accent-bar" aria-hidden="true"></div>

      <!-- Top Header Row -->
      <div class="person-card-top">
        <div class="person-identity-cluster">
          <div class="person-avatar-box ${d.isKey ? 'key-avatar' : d.isOwner ? 'owner-avatar' : ''}">
            <span>${esc(d.personInitials)}</span>
            ${d.isActive ? `<span class="online-dot" aria-hidden="true"></span>` : ''}
          </div>

          <div class="person-info-group">
            <div class="person-title-row">
              <h3 class="person-name" title="${esc(personName)}">
                ${esc(personName)}
              </h3>
              ${d.channelBadge}
            </div>

            <div class="person-sub-identifier">
              ${d.isKey ? `
                <span class="key-prefix-tag">
                  ${icon('key')}
                  <code>${esc(person.prefix)}…</code>
                </span>
                <span class="person-date">Issued ${new Date(person.created_at).toLocaleDateString()}</span>
              ` : d.isInvite ? `
                <span class="invite-email-tag"><code>${esc(person.email)}</code></span>
                <span class="person-date">Expires in ${esc(d.expiryText)}</span>
              ` : `
                <span class="member-email-tag">${esc(person.email)}</span>
                <span class="person-date">Joined ${new Date(person.joined_at || person.created_at).toLocaleDateString()}</span>
              `}
            </div>
          </div>
        </div>

        <div class="person-status-badge-wrap">
          ${badge(d.statusLabel, d.statusClass)}
        </div>
      </div>

      <!-- Middle: Permitted Company Boundaries & Subdomains -->
      <div class="person-permissions-section">
        <div class="permissions-head">
          <span class="permissions-label">Permitted Companies & Subdomains (${d.permittedScopes.length}):</span>
          ${d.isMember && !d.isOwner && state.rules?.length ? `
            <button type="button" class="btn-text-link" data-grant-member="${esc(person.id)}" data-grant-rule="${esc(state.rules[0]?.id)}" style="font-size:11px;">
              Manage permissions
            </button>
          ` : ''}
        </div>

        <div class="permitted-chips-grid">
          ${d.permittedScopes.length ? d.permittedScopes.map(s => {
            const modeClass = s.mode === 'codes' ? 'mode-codes' : s.mode === 'links' ? 'mode-links' : 'mode-read';
            const subText = s.subdomain && s.subdomain !== '*' ? `${s.subdomain}.*` : 'all subdomains';
            return `
              <div class="permitted-chip ${modeClass}" title="${esc(s.name)} · ${modes[s.mode]} · Subdomain: ${esc(s.subdomain)}">
                <span class="chip-logo">${getCompanyLogo(s.name, 18)}</span>
                <div style="min-width:0;">
                  <strong class="chip-company">${esc(s.name)}</strong>
                  <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
                    <span class="chip-mode">${modes[s.mode]}</span>
                    <span class="chip-subdomain-tag">${esc(subText)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="no-permissions-box">
              <small>${d.isInvite ? 'Permissions are configured after invitation acceptance' : 'No active company access granted yet'}</small>
            </div>
          `}
        </div>
      </div>

      <!-- Telemetry & Restrictions Row -->
      <div class="person-telemetry-row">
        <div class="telemetry-col">
          <span class="telemetry-micro-label">${icon('clock')} Expiration:</span>
          <span class="telemetry-micro-val">${esc(d.expiryText)}</span>
          ${d.expirySub ? `<small class="telemetry-micro-sub">${esc(d.expirySub)}</small>` : ''}
        </div>

        <div class="telemetry-col">
          <span class="telemetry-micro-label">${icon('shield')} Message Allowance:</span>
          <span class="telemetry-micro-val">${esc(d.quotaText)}</span>
          ${d.percentViews > 0 ? `
            <div class="micro-progress-bar">
              <div class="micro-progress-fill" style="width: ${d.percentViews}%;"></div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer Action Row -->
      <div class="person-card-footer">
        ${d.isKey ? `
          <div class="footer-left">
            <a class="btn small outline" href="${portalUrl}" target="_blank" rel="noopener noreferrer">
              <span>Direct Portal ↗</span>
            </a>
          </div>
          <div class="footer-right">
            ${d.isRevoked ? `
              <span class="revoked-text">Revoked</span>
            ` : `
              <button type="button" class="btn small danger-outline" data-revoke-key="${esc(person.id)}" title="Revoke access key">
                ${icon('trash')}
                <span>Revoke Key</span>
              </button>
            `}
          </div>
        ` : d.isInvite ? `
          <div class="footer-left" style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="btn small primary-glow" data-resend-invite="${esc(person.email)}" data-invite-id="${esc(person.id)}" title="Generate fresh invitation link for this email">
              ${icon('refresh')}
              <span>Resend Invite</span>
            </button>
            ${demo ? `<button type="button" class="btn small primary-subtle" data-accept-demo="${esc(person.id)}">Accept in demo</button>` : ''}
          </div>
          <div class="footer-right">
            <button type="button" class="btn small danger-outline" data-revoke-invite="${esc(person.id)}">
              <span>Cancel Invite</span>
            </button>
          </div>
        ` : d.isOwner ? `
          <div class="footer-left">
            <span class="owner-pill-note">Workspace administrator has full access to retained mail</span>
          </div>
        ` : `
          <div class="footer-left">
            ${state.rules?.length ? `
              <button type="button" class="btn small outline" data-grant-member="${esc(person.id)}" data-grant-rule="${esc(state.rules[0]?.id)}">
                <span>Configure Access</span>
              </button>
            ` : ''}
          </div>
          <div class="footer-right">
            <button type="button" class="btn small danger-outline" data-remove="${esc(person.id)}" title="Remove member from workspace">
              ${icon('trash')}
              <span>Remove Member</span>
            </button>
          </div>
        `}
      </div>
    </article>
  `;
}

/**
 * Renders Team Access Pools grid or clean empty state
 */
export function renderTeamPools(teamPools = [], state = {}) {
  const rules = state.rules || [];
  const members = state.members || [];

  if (!teamPools.length) {
    return `
      <div class="people-empty-hero glass-neon-card" style="padding:40px 24px;text-align:center;margin-bottom:24px;">
        <div style="width:54px;height:54px;margin:0 auto 16px;border-radius:var(--radius-lg);background:var(--accent-subtle);color:var(--accent-bright);display:grid;place-items:center;border:1px solid var(--accent-border);">
          ${icon('people')}
        </div>
        <h3 style="margin:0 0 8px;font-size:18px;color:var(--ink);">No Team Access Pools Configured Yet</h3>
        <p style="max-width:520px;margin:0 auto 20px;font-size:13.5px;color:var(--muted);line-height:1.5;">
          Team Pools bundle inbound service rules and grant instant OTP verification codes and magic sign-in access to a group of team or family members.
        </p>
        <button type="button" class="btn primary pulse-glow" data-action="create-team-pool">
          ${icon('plus')}
          <span>Create Team Access Pool</span>
        </button>
      </div>
    `;
  }

  return `
    <div class="team-pools-grid">
      ${teamPools.map(pool => {
        const pRules = (pool.rule_ids || []).map(rid => rules.find(r => r.id === rid)).filter(Boolean);
        const pMembers = (pool.member_ids || []).map(mid => members.find(m => m.id === mid)).filter(Boolean);
        const portalUrl = pool.access_key ? `${location.origin}/access?key=${pool.access_key.key}` : '';

        return `
          <div class="team-pool-card glass-neon-card">
            <div class="team-pool-head">
              <div class="team-pool-title-group">
                <div class="team-pool-icon">${icon('people')}</div>
                <div>
                  <h3 class="team-pool-name">${esc(pool.name)}</h3>
                  <p class="team-pool-desc">${esc(pool.description || 'Shared service access pool')}</p>
                </div>
              </div>
              <button type="button" class="icon-btn danger" data-delete-pool="${esc(pool.id)}" title="Delete pool" aria-label="Delete pool">
                ${icon('trash')}
              </button>
            </div>

            <div class="team-pool-meta-row">
              <span class="team-pool-meta-label">Included Service Rules (${pRules.length})</span>
              <div class="team-pool-rules-chips">
                ${pRules.length > 0 ? pRules.map(r => `
                  <span class="team-pool-rule-chip">
                    ${getCompanyLogo(r.name, 18)}
                    <span>${esc(r.name)}</span>
                    <span class="badge ${r.mode === 'codes' ? 'blue' : r.mode === 'links' ? 'green' : 'purple'}" style="padding:1px 5px;font-size:10px;">${r.mode === 'codes' ? 'Codes' : r.mode === 'links' ? 'Links' : 'Read'}</span>
                  </span>
                `).join('') : '<span style="color:var(--muted);font-size:12px;">No rules assigned</span>'}
              </div>
            </div>

            <div class="team-pool-meta-row">
              <span class="team-pool-meta-label">Assigned Members (${pMembers.length})</span>
              <div class="team-pool-members-row">
                ${pMembers.length > 0 ? pMembers.map(m => `
                  <span class="team-pool-member-pill">
                    <span style="width:18px;height:18px;font-size:9px;border-radius:50%;background:var(--accent-subtle);color:var(--accent-bright);display:grid;place-items:center;font-weight:700;">${initials(m.name || m.email)}</span>
                    <span>${esc(m.name || m.email.split('@')[0])}</span>
                  </span>
                `).join('') : '<span style="color:var(--muted);font-size:12px;">All active members</span>'}
              </div>
            </div>

            ${portalUrl ? `
              <div class="team-pool-meta-row">
                <span class="team-pool-meta-label">Instant Access Portal Link (/access)</span>
                <div class="copy-box" style="margin:0;">
                  <code style="font-size:11px;">${esc(portalUrl)}</code>
                  <button type="button" class="icon-btn" data-copy="${esc(portalUrl)}" aria-label="Copy portal link">${icon('copy')}</button>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Unified People & Access Hub Page with Dedicated Tabbed Interface
 */
export function peoplePage({ state, me, demo }) {
  const members = state.members || [];
  const keys = state.keys || [];
  const teamPools = state.pools || [];
  const pending = (state.invitations || []).filter(i => !i.accepted_at && i.expires_at > Date.now());

  // Filter out workspace owner: owner is managed in profile and mailbox sections
  const ownerId = state.workspace?.owner_id;
  const distributionMembers = members.filter(m => m.id !== ownerId && m.role !== 'owner');

  // Auto-delete direct access tokens from list & table after 5 days of expiry (5 * 86400 * 1000 = 432000000 ms)
  const now = Date.now();
  const fiveDaysMs = 5 * 86400000;
  const visibleKeys = keys.filter(k => {
    if (k.expires_at && (now - k.expires_at > fiveDaysMs)) {
      return false; // Automatically delete from list and table after 5 days of expiry
    }
    return true;
  });

  // Aggregate all individuals into the distribution hub
  const peopleList = [
    // Delegated access keys (Direct Access without login)
    ...visibleKeys.map(k => ({ ...k, type: 'key' })),
    // Direct members (Any provider: Outlook, Yahoo, Gmail, corporate)
    ...distributionMembers.map(m => ({ ...m, type: 'member' })),
    // Pending invitations
    ...pending.map(i => ({ ...i, type: 'invite', name: i.email.split('@')[0] }))
  ];

  const totalPeople = peopleList.length;
  const activeKeysCount = visibleKeys.filter(k => !k.revoked_at && (!k.expires_at || k.expires_at > now) && (k.max_views === null || k.views < k.max_views)).length;
  const directMembersCount = distributionMembers.length;
  const cappedKeysCount = visibleKeys.filter(k => k.max_views !== null || k.expires_at).length;

  // Retrieve saved tab & view mode preferences (default to 'all' so users see all their people immediately)
  let activeTab = 'all';
  try {
    const saved = localStorage.getItem('mailgrant_people_tab');
    if (saved && ['all', 'direct', 'platform', 'pools'].includes(saved)) {
      activeTab = saved;
    }
  } catch {}

  let savedView = 'table';
  try {
    savedView = localStorage.getItem('mailgrant_people_view') || 'table';
  } catch {}
  const isTable = savedView !== 'cards';

  return `
    <div class="people-page-container">
      ${heading(
        'People & Access Distribution',
        'Manage external distribution to recipients — dedicated direct passwordless access (no login required), team pools, and verified mail provider accounts.',
        `
        <div class="people-header-actions" id="people-header-actions">
          <button type="button" class="btn primary add-access-btn" data-action="key" id="btn-header-key" title="Create a passwordless, time-bound key for a recipient" style="display: ${activeTab === 'platform' || activeTab === 'pools' ? 'none' : 'inline-flex'};">
            ${icon('key')}
            <span>+ Add Access Key</span>
          </button>
          <button type="button" class="btn outline" data-action="invite" id="btn-header-invite" title="Invite a user to this workspace" style="display: ${activeTab === 'direct' || activeTab === 'pools' ? 'none' : 'inline-flex'};">
            ${icon('people')}
            <span>+ Invite Member</span>
          </button>
          <button type="button" class="btn outline" data-action="create-team-pool" id="btn-header-pool" title="Create a Team Access Pool" style="display: ${activeTab === 'pools' || activeTab === 'all' ? 'inline-flex' : 'none'};">
            ${icon('people')}
            <span>+ Create Team Pool</span>
          </button>
          <a class="btn outline" href="/access" target="_blank" rel="noopener noreferrer" id="btn-header-portal" title="Open Recipient Direct Portal" style="display: ${activeTab === 'direct' ? 'inline-flex' : 'none'};">
            ${icon('mail')}
            <span>Recipient Portal ↗</span>
          </a>
        </div>
        `
      )}

      <!-- Dedicated Distribution Account Tabs -->
      <div class="people-main-tabs" role="tablist" aria-label="Distribution Account Types">
        <button type="button" class="people-tab-btn ${activeTab === 'all' ? 'active' : ''}" data-people-tab="all" role="tab" aria-selected="${activeTab === 'all'}">
          <span class="tab-icon-wrap">${icon('grid')}</span>
          <span class="tab-title">All Distribution</span>
          <span class="tab-count-pill">${totalPeople} Total</span>
        </button>
        <button type="button" class="people-tab-btn ${activeTab === 'direct' ? 'active' : ''}" data-people-tab="direct" role="tab" aria-selected="${activeTab === 'direct'}">
          <span class="tab-icon-wrap">${icon('key')}</span>
          <span class="tab-title">Direct Access (No Login)</span>
          <span class="tab-count-pill">${activeKeysCount} Active Keys</span>
        </button>
        <button type="button" class="people-tab-btn ${activeTab === 'platform' ? 'active' : ''}" data-people-tab="platform" role="tab" aria-selected="${activeTab === 'platform'}">
          <span class="tab-icon-wrap">${icon('people')}</span>
          <span class="tab-title">Platform Accounts (Verified Sign-in)</span>
          <span class="tab-count-pill">${directMembersCount + pending.length} Members</span>
        </button>
        <button type="button" class="people-tab-btn ${activeTab === 'pools' ? 'active' : ''}" data-people-tab="pools" role="tab" aria-selected="${activeTab === 'pools'}">
          <span class="tab-icon-wrap">${icon('people')}</span>
          <span class="tab-title">Team Access Pools</span>
          <span class="tab-count-pill">${teamPools.length} Pools</span>
        </button>
      </div>

      <!-- Dedicated Tab Explainer & Context Banner (No Duplicate Buttons) -->
      <div class="dedicated-tab-banner" id="dedicated-tab-banner">
        ${activeTab === 'direct' ? `
          <div class="banner-content">
            <strong>⚡ Direct Access (No Login Required):</strong>
            Recipients open their sandboxed inbox at <code>/access</code> using a passwordless access key or 1-click magic link. Access is stored encrypted in device session cookies. Expired tokens automatically delete from the list and database 5 days post-expiration.
          </div>
        ` : activeTab === 'platform' ? `
          <div class="banner-content">
            <strong>🛡️ Platform Verified Accounts:</strong>
            Team members authenticated through verified sign-in. Subdomain filters and company rules are granted and audited per individual account.
          </div>
        ` : activeTab === 'pools' ? `
          <div class="banner-content">
            <strong>👥 Team Access Pools:</strong>
            Bundle company service rules and grant instant access to a group of team or family members, or share an instant zero-trust access key link.
          </div>
        ` : `
          <div class="banner-content">
            <strong>🌐 Complete Access Distribution Hub:</strong>
            Overview of Direct Passwordless Keys (5-day auto-purge retention), Team Access Pools, and Verified Platform Members.
          </div>
        `}
      </div>

      <!-- Cyber Telemetry Overview Banner -->
      <section class="inbox-telemetry-banner glass-neon-card" aria-label="People & Access Metrics">
        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Direct Access</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-number">${visibleKeys.length.toString().padStart(2, '0')}</strong>
            <span class="telemetry-pill ${activeKeysCount > 0 ? 'active' : 'standby'}">
              <span class="pulse-dot" aria-hidden="true"></span>
              <span>${activeKeysCount} Active · No Login</span>
            </span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Platform Accounts</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${directMembersCount} Team Members</strong>
            <span class="telemetry-pill neutral">${pending.length} Invites</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Auto-Purge Lifecycle</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">5-Day Expiry Retention</strong>
            <span class="telemetry-pill positive">Auto-cleans expired tokens</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Boundary Security</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">Zero Passwords Shared</strong>
            <span class="telemetry-pill positive">Subdomain-Isolated</span>
          </div>
        </div>
      </section>

      <!-- People Management Hub Section -->
      <section class="people-hub-section">
        ${activeTab === 'pools' ? `
          <!-- Dedicated Team Pools View -->
          <div class="people-pools-view" id="people-pools-view">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--ink);">Active Team Access Pools</h3>
                <p style="margin:2px 0 0;font-size:13px;color:var(--muted);">Pooled zero-trust verification rules for shared logins across team and family members.</p>
              </div>
              <button type="button" class="btn primary pulse-glow" data-action="create-team-pool">
                ${icon('plus')}
                <span>+ Create Team Pool</span>
              </button>
            </div>
            ${renderTeamPools(teamPools, state)}
          </div>
        ` : `
          ${activeTab === 'all' && teamPools.length > 0 ? `
            <!-- Overview of Team Pools in All Distribution -->
            <div class="people-pools-overview-block" style="margin-bottom:28px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:8px;">
                  ${icon('people')}
                  <span>Team Access Pools (${teamPools.length})</span>
                </h3>
                <button type="button" class="btn small outline" data-action="create-team-pool">
                  ${icon('plus')}
                  <span>New Pool</span>
                </button>
              </div>
              ${renderTeamPools(teamPools, state)}
            </div>
          ` : ''}

          <!-- Controls Bar: Search, Filters, and View Switcher -->
          <div class="people-controls-bar">
            <div class="people-search-wrapper">
              <span class="search-icon-inside">${icon('search')}</span>
              <input type="search" 
                     id="people-search-input" 
                     class="people-search-input" 
                     placeholder="Search people by name, email, key prefix, company, or subdomain..." 
                     autocomplete="off" 
                     spellcheck="false" />
            </div>

            <!-- Quick Filter Segment Pills -->
            <div class="people-filter-pills" id="people-filter-controls">
              <button type="button" class="filter-pill active" data-filter-people="all">
                ${icon('grid')} All Recipients (${totalPeople})
              </button>
              <button type="button" class="filter-pill" data-filter-people="keys">
                ${icon('key')} Key Holders (${visibleKeys.length})
              </button>
              <button type="button" class="filter-pill" data-filter-people="members">
                ${icon('people')} Team Members (${distributionMembers.length})
              </button>
              ${pending.length ? `
                <button type="button" class="filter-pill" data-filter-people="invites">
                  ${icon('mail')} Pending Invites (${pending.length})
                </button>
              ` : ''}
            </div>

            <!-- View Switcher (Table vs Cards) -->
            <div class="people-view-switcher" role="group" aria-label="Layout view switcher">
              <button type="button" class="view-btn ${isTable ? 'active' : ''}" data-set-view="table" title="High-Density Table View">
                ${icon('menu')}
                <span>Table</span>
              </button>
              <button type="button" class="view-btn ${!isTable ? 'active' : ''}" data-set-view="cards" title="Detailed Cards View">
                ${icon('grid')}
                <span>Cards</span>
              </button>
            </div>
          </div>

          ${peopleList.length > 0 ? `
            <!-- 1. HIGH-DENSITY TABLE VIEW -->
            <div class="people-table-container glass-neon-card" id="people-table-container" style="display: ${isTable ? 'block' : 'none'};">
              <div class="people-table-scroller">
                <table class="people-data-table">
                  <thead>
                    <tr>
                      <th class="th-identity">Person / Recipient</th>
                      <th class="th-channel">Channel</th>
                      <th class="th-scopes">Company Boundaries & Subdomains</th>
                      <th class="th-restrictions">Restrictions & Limits</th>
                      <th class="th-status">Status</th>
                      <th class="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="people-table-body">
                    ${peopleList.map(person => renderPersonRow(person, { state, me, demo, activeTab })).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 2. SPACIOUS CARDS VIEW -->
            <div class="people-cards-grid" id="people-grid-container" style="display: ${isTable ? 'none' : 'grid'};">
              ${peopleList.map(person => renderPersonCard(person, { state, me, demo, activeTab })).join('')}
            </div>

            <!-- Empty search result alert -->
            <div id="people-no-results" class="people-no-results" style="display: none;">
              <div class="no-results-icon">${icon('search')}</div>
              <h4>No matching recipients found</h4>
              <p>Try searching for a different name, email, company, or subdomain pattern.</p>
            </div>
          ` : `
            <!-- Full Zero-State Hero -->
            <div class="people-empty-hero">
              <div class="empty-people-radar" aria-hidden="true">
                <div class="empty-radar-beam"></div>
                <div class="empty-radar-center">
                  ${icon('people')}
                </div>
              </div>
              <h3>No Access Credentials Configured Yet</h3>
              <p>Delegate zero-trust email access to contractors, family, or external partners with direct passwordless keys or any email provider.</p>
              <div class="empty-actions">
                <button type="button" class="btn primary-glow" data-action="key">
                  ${icon('key')}
                  <span>Issue Direct Access Key (No Login)</span>
                </button>
                <button type="button" class="btn outline" data-action="invite">
                  ${icon('people')}
                  <span>Invite Team Member</span>
                </button>
              </div>
            </div>
          `}
        `}
      </section>
    </div>
  `;
}

/**
 * Re-export keysPage pointing to the unified peoplePage
 */
export const keysPage = peoplePage;

/**
 * Invite Someone Modal (Team Email Account)
 */
export function openInviteModal(modal) {
  modal('Invite Someone to Workspace', `
    <p>Create a private invitation for a team member's email address. Share the generated link yourself; the app does not send external invitation emails.</p>
    <form id="invite-form">
      ${field('Their email address', 'email', 'colleague@example.com', 'type="email" required maxlength="254"')}
      <div class="notice">
        The invitation expires in 48 hours. After acceptance, this person starts with no company access. Set their permissions in People & Access.
      </div>
      ${formFooter('Create Invitation Link')}
    </form>
  `, {
    subtitle: 'Send a private invite link'
  });
}

/**
 * Adjust Person Permission Modal with Granular Subdomain Selection
 */
export function openGrantModal({ state, memberId, ruleId, modal }) {
  const r = state.rules.find(r => r.id === ruleId);
  const m = state.members.find(m => m.id === memberId);
  const g = state.grants.find(g => g.rule_id === ruleId && g.user_id === memberId);
  const options = r.mode === 'read' ? ['blocked', 'codes', 'links', 'read'] : ['blocked', r.mode];
  const domain = (r.sender.split('@')[1] || r.sender).replace(/^\*\./, '');

  modal(`Configure Access to ${r.name}`, `
    <p>Set what <strong>${esc(m.name || m.email)}</strong> may inspect for <strong>${esc(r.name)}</strong>. Changing permissions starts a new access window for future messages.</p>
    <form id="grant-form" data-member="${esc(memberId)}" data-rule="${esc(ruleId)}">
      <div class="field">
        <label for="grant-mode">Permitted Mode</label>
        <select name="mode" id="grant-mode">
          ${options.map(mode => `<option value="${mode}" ${g?.mode === mode ? 'selected' : ''}>${modes[mode]}</option>`).join('')}
        </select>
        <small>Codes-only rules extract verification numbers while stripping the message body.</small>
      </div>

      <!-- Individual Subdomain Scope Selection -->
      <div class="field">
        <label for="grant-subdomain">Subdomain Scope Selection</label>
        <select name="subdomain" id="grant-subdomain">
          <option value="*" ${!g?.subdomain || g?.subdomain === '*' ? 'selected' : ''}>All subdomains (*.${esc(domain)})</option>
          <option value="auth" ${g?.subdomain === 'auth' ? 'selected' : ''}>Authentication only (auth.* / login.*)</option>
          <option value="billing" ${g?.subdomain === 'billing' ? 'selected' : ''}>Billing & Checkout (billing.* / app.*)</option>
          <option value="notifications" ${g?.subdomain === 'notifications' ? 'selected' : ''}>Notifications (notify.* / mail.*)</option>
        </select>
        <small>Limit this individual member's access to specific sender/link subdomains.</small>
      </div>

      <div class="field">
        <label for="grant-expiry">Access Duration</label>
        <select name="duration" id="grant-expiry">
          <option value="0">Until manually revoked</option>
          <option value="1">After 1 hour (Emergency)</option>
          <option value="24">After 24 hours (1 day)</option>
          <option value="168">After 7 days (1 week)</option>
          <option value="720" selected>After 30 days</option>
        </select>
      </div>
      ${formFooter('Save Permission')}
    </form>
  `, {
    subtitle: 'Restrict access by company rule & subdomain'
  });
}
