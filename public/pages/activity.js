import { icon } from '../components/icons.js';
import { esc, badge, empty, ago, heading } from './common.js';

export const actionNames = {
  'workspace.created': 'Workspace Initialized',
  'invitation.created': 'Invitation Created',
  'invitation.accepted': 'Invitation Accepted',
  'invitation.revoked': 'Invitation Revoked',
  'permission.changed': 'Permission Updated',
  'message.viewed': 'Message Opened & Decrypted',
  'message.received': 'Sample Email Ingested',
  'rule.created': 'Access Rule Added',
  'rule.paused': 'Access Rule Paused',
  'rule.resumed': 'Access Rule Resumed',
  'rule.deleted': 'Access Rule Deleted',
  'member.removed': 'Member Removed',
  'messages.deleted': 'Retained Messages Purged',
  'mailbox.address_rotated': 'Receiving Address Rotated',
  'mailbox.confirmation_viewed': 'Forwarding Confirmation Opened',
  'access_key.created': 'Access Key Created',
  'access_key.revoked': 'Access Key Revoked',
  'access_key.redeemed': 'Access Key Bound to Browser',
  'access_key.message_viewed': 'Message Opened via Access Key',
  'gmail.connected': 'Gmail Mailbox Connected',
  'gmail.disconnected': 'Gmail Mailbox Disconnected'
};

export const actionMeta = {
  'message.viewed': {
    category: 'reads',
    icon: 'inbox',
    color: 'cyan',
    tag: 'DECRYPTED_READ',
    desc: 'Authorized read of message verification code or content'
  },
  'access_key.message_viewed': {
    category: 'reads',
    icon: 'key',
    color: 'cyan',
    tag: 'DECRYPTED_READ',
    desc: 'Delegated passwordless key holder decrypted approved message'
  },
  'message.received': {
    category: 'reads',
    icon: 'mail',
    color: 'cyan',
    tag: 'MAIL_INGESTED',
    desc: 'Incoming email filtered by exact sender boundary and encrypted'
  },
  'access_key.created': {
    category: 'keys',
    icon: 'key',
    color: 'purple',
    tag: 'KEY_ISSUED',
    desc: 'Passwordless recipient access key generated with custom limits'
  },
  'access_key.redeemed': {
    category: 'keys',
    icon: 'lock',
    color: 'purple',
    tag: 'KEY_BOUND',
    desc: 'Key redeemed and securely bound to recipient device session'
  },
  'access_key.revoked': {
    category: 'keys',
    icon: 'trash',
    color: 'red',
    tag: 'KEY_REVOKED',
    desc: 'Key revoked across all devices immediately with zero access'
  },
  'rule.created': {
    category: 'rules',
    icon: 'shield',
    color: 'green',
    tag: 'POLICY_ACTIVE',
    desc: 'Exact-match sender boundary established for incoming mail'
  },
  'rule.paused': {
    category: 'rules',
    icon: 'pause',
    color: 'amber',
    tag: 'POLICY_PAUSED',
    desc: 'Rule temporarily deactivated from mail ingestion'
  },
  'rule.resumed': {
    category: 'rules',
    icon: 'play',
    color: 'green',
    tag: 'POLICY_RESUMED',
    desc: 'Rule resumed and actively filtering mail pipelines'
  },
  'rule.deleted': {
    category: 'rules',
    icon: 'trash',
    color: 'red',
    tag: 'POLICY_DELETED',
    desc: 'Rule and retained messages permanently deleted'
  },
  'permission.changed': {
    category: 'rules',
    icon: 'shield',
    color: 'amber',
    tag: 'PERMISSION_MUTATION',
    desc: 'Granular company read permission altered for member'
  },
  'invitation.created': {
    category: 'members',
    icon: 'mail',
    color: 'amber',
    tag: 'INVITE_ISSUED',
    desc: 'Private invitation link generated for recipient'
  },
  'invitation.accepted': {
    category: 'members',
    icon: 'people',
    color: 'green',
    tag: 'MEMBER_JOINED',
    desc: 'Invited Google user joined the workspace directory'
  },
  'invitation.revoked': {
    category: 'members',
    icon: 'trash',
    color: 'red',
    tag: 'INVITE_CANCELLED',
    desc: 'Pending invitation link invalidated'
  },
  'member.removed': {
    category: 'members',
    icon: 'trash',
    color: 'red',
    tag: 'MEMBER_REMOVED',
    desc: 'Member removed and workspace access revoked'
  },
  'workspace.created': {
    category: 'workspace',
    icon: 'shield',
    color: 'purple',
    tag: 'WORKSPACE_INIT',
    desc: 'Workspace created with KMS envelope encryption'
  },
  'gmail.connected': {
    category: 'workspace',
    icon: 'mail',
    color: 'green',
    tag: 'GMAIL_LINKED',
    desc: 'Read-only Google OAuth connection authorized'
  },
  'gmail.disconnected': {
    category: 'workspace',
    icon: 'trash',
    color: 'red',
    tag: 'GMAIL_DISCONNECTED',
    desc: 'OAuth tokens cleared and background sync halted'
  },
  'mailbox.address_rotated': {
    category: 'workspace',
    icon: 'refresh',
    color: 'amber',
    tag: 'ADDRESS_ROTATED',
    desc: 'Inbound receiving address refreshed'
  },
  'messages.deleted': {
    category: 'workspace',
    icon: 'trash',
    color: 'red',
    tag: 'MESSAGES_PURGED',
    desc: 'Retained messages cleared from encrypted D1 storage'
  }
};

/**
 * Render a Single Timeline Audit Event Row
 */
function renderEventRow(e) {
  const meta = actionMeta[e.action] || {
    category: 'workspace',
    icon: 'activity',
    color: 'cyan',
    tag: 'AUDIT_LOG',
    desc: 'Security event recorded'
  };

  const title = actionNames[e.action] || e.action;
  const actor = e.actor || '';
  const target = e.target ? String(e.target) : '';
  const isKeyHolder = !actor && (e.action.startsWith('access_key.') || target.includes('Key'));
  const actorDisplayName = isKeyHolder ? 'Access Key Holder' : (actor || 'System Daemon');

  const searchIndex = `${title} ${actorDisplayName} ${target} ${meta.tag} ${meta.category}`.toLowerCase();
  const timeExact = new Date(e.created_at).toLocaleString();
  const timeRelative = ago(e.created_at);

  return `
    <article class="activity-timeline-item color-${meta.color}" 
             data-activity-filter="${meta.category}" 
             data-activity-search="${esc(searchIndex)}">
      
      <!-- Left Timeline Spine & Glowing Icon Node -->
      <div class="timeline-node-wrap">
        <div class="timeline-icon-node ${meta.color}">
          ${icon(meta.icon)}
        </div>
        <div class="timeline-spine-line" aria-hidden="true"></div>
      </div>

      <!-- Right Event Card Body -->
      <div class="activity-event-card glass-neon-card">
        <div class="event-card-header">
          <div class="event-title-cluster">
            <h4 class="event-title">${esc(title)}</h4>
            <span class="event-tag-badge ${meta.color}">${esc(meta.tag)}</span>
          </div>
          <time class="event-timestamp" datetime="${new Date(e.created_at).toISOString()}" title="${esc(timeExact)}">
            <span class="timestamp-relative">${esc(timeRelative)}</span>
            <span class="timestamp-bullet">·</span>
            <span class="timestamp-exact">${new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </time>
        </div>

        <p class="event-description">${esc(meta.desc)}</p>

        <div class="event-meta-footer">
          <div class="event-actor-pill">
            <span class="actor-icon">${icon(isKeyHolder ? 'key' : 'user')}</span>
            <span class="actor-label">Actor:</span>
            <strong class="actor-name">${esc(actorDisplayName)}</strong>
          </div>

          ${target ? `
            <div class="event-target-pill">
              <span class="target-icon">${icon('shield')}</span>
              <span class="target-label">Target:</span>
              <code class="target-value">${esc(target)}</code>
            </div>
          ` : ''}

          <div class="event-security-indicator">
            <span class="indicator-dot"></span>
            <span>Immutable 30d Audit Ledger</span>
          </div>
        </div>
      </div>

    </article>
  `;
}

/**
 * Modern High-Tech Cyber Security Audit Trail Page
 */
export function activityPage({ state }) {
  const events = state.events || [];
  const total = events.length;

  const readCount = events.filter(e => (actionMeta[e.action]?.category === 'reads')).length;
  const keyCount = events.filter(e => (actionMeta[e.action]?.category === 'keys')).length;
  const ruleCount = events.filter(e => (actionMeta[e.action]?.category === 'rules')).length;
  const memberCount = events.filter(e => (actionMeta[e.action]?.category === 'members')).length;

  return `
    <div class="activity-page-container">
      ${heading(
        'Audit Trail & Security Activity',
        'Immutable 30-day security audit trail of workspace access, key redemptions, rule changes, and message reads. Content bodies, codes, and links are never logged.',
        `
        <div class="activity-header-actions">
          <button type="button" class="btn outline" data-action="export-audit" title="Export audit trail to JSON">
            ${icon('copy')}
            <span>Export Audit Trail</span>
          </button>
          <button type="button" class="btn secondary" data-action="refresh-audit" title="Refresh audit log">
            ${icon('refresh')}
            <span>Refresh</span>
          </button>
        </div>
        `
      )}

      <!-- Top Cyber Telemetry Overview Banner (Exact Inbox Pattern) -->
      <section class="inbox-telemetry-banner glass-neon-card" aria-label="Security Telemetry">
        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Recorded Events</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-number">${total.toString().padStart(2, '0')}</strong>
            <span class="telemetry-pill ${total > 0 ? 'active' : 'standby'}">
              <span class="pulse-dot" aria-hidden="true"></span>
              <span>30-Day Audit Trail</span>
            </span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Decryptions & Reads</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${readCount} Content Reads</strong>
            <span class="telemetry-pill positive">Zero Plaintext Logs</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Key Operations</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${keyCount} Key Events</strong>
            <span class="telemetry-pill neutral">Device-Bound</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Security Integrity</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">100% Zero-Trust</strong>
            <span class="telemetry-pill positive">Tamper-Evident</span>
          </div>
        </div>
      </section>

      <!-- Activity Feed Controls Section -->
      <section class="activity-feed-section">
        <div class="activity-controls-bar">
          <div class="activity-search-wrapper">
            <span class="search-icon-inside">${icon('search')}</span>
            <input type="search" 
                   id="activity-search-input" 
                   class="activity-search-input" 
                   placeholder="Search audit trail by actor, action, company or target..." 
                   autocomplete="off" 
                   spellcheck="false" />
          </div>

          <!-- Quick Category Filter Pills -->
          <div class="activity-filter-pills" id="activity-filter-controls">
            <button type="button" class="filter-pill active" data-filter-activity="all">
              All Events (${total})
            </button>
            <button type="button" class="filter-pill" data-filter-activity="reads">
              ${icon('inbox')} Decryptions (${readCount})
            </button>
            <button type="button" class="filter-pill" data-filter-activity="keys">
              ${icon('key')} Key Events (${keyCount})
            </button>
            <button type="button" class="filter-pill" data-filter-activity="rules">
              ${icon('shield')} Policy & Rules (${ruleCount})
            </button>
            <button type="button" class="filter-pill" data-filter-activity="members">
              ${icon('people')} Members (${memberCount})
            </button>
          </div>
        </div>

        <!-- Activity Feed List / Timeline -->
        ${events.length > 0 ? `
          <div class="activity-timeline-feed" id="activity-timeline-feed">
            ${events.map(e => renderEventRow(e)).join('')}
          </div>

          <!-- Empty search result notice -->
          <div id="activity-no-results" class="activity-no-results" style="display: none;">
            <div class="no-results-icon">${icon('search')}</div>
            <h4>No matching activity found</h4>
            <p>Try searching for a different action, actor, or target.</p>
          </div>
        ` : `
          <!-- Full Zero-State Hero -->
          <div class="activity-empty-hero">
            <div class="empty-activity-radar" aria-hidden="true">
              <div class="empty-radar-beam"></div>
              <div class="empty-radar-center">
                ${icon('activity')}
              </div>
            </div>
            <h3>Audit Trail Initialized</h3>
            <p>Every message decryption, rule creation, and access key event will be recorded here in an immutable 30-day security trail.</p>
          </div>
        `}
      </section>
    </div>
  `;
}
