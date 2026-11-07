import { icon } from '../components/icons.js';
import { getCompanyLogo } from '../components/logos.js';
import { esc, badge, modes, heading, field, formFooter } from './common.js';
import { peoplePage } from './people.js';

export { peoplePage as keysPage };

/**
 * Common Recipient Person Archetypes
 * Accelerates key creation with person-specific defaults and recommended permissions.
 */
export const PERSON_PRESETS = [
  {
    id: 'contractor',
    name: 'External Contractor',
    badge: 'Contractor',
    duration: '168', // 7 days
    maxViews: '20',
    suggestedName: 'Contractor — Project Verification',
    description: 'Time-bound project access for external developers and consultants.'
  },
  {
    id: 'developer',
    name: 'Software Engineer',
    badge: 'Engineering',
    duration: '720', // 30 days
    maxViews: '',
    suggestedName: 'Alex — Dev Services (GitHub & Claude)',
    description: 'Engineering tools, GitHub authorization and code extraction.'
  },
  {
    id: 'designer',
    name: 'Designer / Agency',
    badge: 'Design Studio',
    duration: '720', // 30 days
    maxViews: '',
    suggestedName: 'Design Lead — Figma & Notion links',
    description: 'Design collaboration, magic sign-in links and asset portals.'
  },
  {
    id: 'partner',
    name: 'Business Partner / Vendor',
    badge: 'External Partner',
    duration: '720', // 30 days
    maxViews: '',
    suggestedName: 'Partner — Operational Services',
    description: 'Vendor collaboration and shared business service notifications.'
  },
  {
    id: 'single_use',
    name: 'Single-Use OTP',
    badge: 'Burn After Read',
    duration: '1', // 1 hour
    maxViews: '1',
    suggestedName: 'One-Time Verification Key',
    description: 'Burn-after-reading: permanently revokes after opening 1 code.'
  }
];

/**
 * Calculate recipient initials from key or person name
 */
function getRecipientInitials(name = '') {
  const parts = String(name).trim().split(/[\s—–-]+/).filter(Boolean);
  if (!parts.length) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Render a single Person-Specific Access Key Card
 */
export function keyCard(k, demo = false) {
  const isRevoked = Boolean(k.revoked_at);
  const isExpired = Boolean(k.expires_at && k.expires_at <= Date.now());
  const isLimitReached = Boolean(k.max_views !== null && k.views >= k.max_views);
  const isActive = !isRevoked && !isExpired && !isLimitReached;

  const statusLabel = isRevoked ? 'Revoked' : isExpired ? 'Expired' : isLimitReached ? 'Limit Reached' : 'Active';
  const statusClass = isActive ? 'green' : isLimitReached ? 'amber' : isRevoked ? 'red' : '';

  const scopes = k.scopes || [];
  const initials = getRecipientInitials(k.name);
  const percentViews = k.max_views ? Math.min(100, Math.round((k.views / k.max_views) * 100)) : 0;

  return `
    <article class="key-person-card ${isActive ? 'active' : 'inactive'}" data-key-id="${esc(k.id)}">
      <div class="key-card-accent-bar" aria-hidden="true"></div>

      <!-- Top Header Row: Person Identity & Status -->
      <div class="key-card-header">
        <div class="key-person-identity">
          <div class="key-person-avatar ${isActive ? 'active' : ''}">
            <span>${esc(initials)}</span>
            ${isActive ? `<span class="person-online-indicator" aria-hidden="true"></span>` : ''}
          </div>
          <div class="key-person-meta">
            <h3 class="key-person-name" title="${esc(k.name)}">${esc(k.name)}</h3>
            <div class="key-prefix-row">
              <span class="key-prefix-tag">
                ${icon('key')}
                <code>${esc(k.prefix)}…</code>
              </span>
              <span class="key-created-date">Created ${new Date(k.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div class="key-status-wrap">
          ${badge(statusLabel, statusClass)}
        </div>
      </div>

      <!-- Middle: Granular Company Access Matrix -->
      <div class="key-card-scopes">
        <span class="scopes-label">Permitted Company Boundaries (${scopes.length}):</span>
        <div class="key-scope-badges">
          ${scopes.length ? scopes.map(s => {
            const modeClass = s.mode === 'codes' ? 'mode-codes' : s.mode === 'links' ? 'mode-links' : 'mode-read';
            return `
              <div class="key-scope-chip ${modeClass}" title="${esc(s.name)} · ${modes[s.mode]} · Subdomain: ${esc(s.subdomain || '*')}">
                <span class="scope-chip-logo">${getCompanyLogo(s.name, 18)}</span>
                <strong class="scope-chip-name">${esc(s.name)}</strong>
                <span class="scope-chip-mode">${modes[s.mode]}</span>
                <span class="chip-subdomain-tag">${s.subdomain && s.subdomain !== '*' ? esc(s.subdomain + '.*') : 'all subdomains'}</span>
              </div>
            `;
          }).join('') : `
            <span class="scope-none-chip">No remaining active rules</span>
          `}
        </div>
      </div>

      <!-- Telemetry & Ephemeral Limits Row -->
      <div class="key-telemetry-row">
        <div class="key-telemetry-item">
          <span class="telemetry-item-label">${icon('time')} Expiration Window:</span>
          <strong class="telemetry-item-val ${isExpired ? 'expired-text' : ''}">
            ${k.expires_at ? `${new Date(k.expires_at).toLocaleDateString()} (${Math.max(0, Math.ceil((k.expires_at - Date.now()) / 86400000))}d remaining)` : 'No expiry (Until revoked)'}
          </strong>
        </div>

        <div class="key-telemetry-item">
          <span class="telemetry-item-label">${icon('shield')} Open Allowance:</span>
          <strong class="telemetry-item-val ${isLimitReached ? 'limit-text' : ''}">
            ${k.max_views === null 
              ? `${k.views} opens (Unlimited views)` 
              : k.max_views === 1 
                ? `${k.views}/1 open ${k.views >= 1 ? '(Burned)' : '(Single-use OTP)'}` 
                : `${k.views} of ${k.max_views} opens used`}
          </strong>
          ${k.max_views ? `
            <div class="key-opens-bar" title="${k.views} of ${k.max_views} views consumed">
              <div class="opens-bar-fill ${percentViews >= 100 ? 'full' : ''}" style="width: ${percentViews}%;"></div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Bottom Actions Row -->
      <div class="key-card-footer">
        <div class="key-footer-left">
          <a class="btn small outline" href="/access${demo ? '?demo=1' : ''}" target="_blank" rel="noopener noreferrer" title="View recipient portal">
            <span>Recipient Portal ↗</span>
          </a>
        </div>
        <div class="key-footer-right">
          ${isRevoked ? `
            <span class="key-revoked-note">Access permanently revoked</span>
          ` : `
            <button type="button" class="btn small danger-outline" data-revoke-key="${esc(k.id)}" title="Revoke this person's access immediately">
              ${icon('trash')}
              <span>Revoke Key</span>
            </button>
          `}
        </div>
      </div>
    </article>
  `;
}



/**
 * Interactive Person-Specific Access Key Creation Modal
 * Includes Person Archetype Presets, Interactive Visual Permission Matrix,
 * Granular Expiration & Burn-After-Reading View Caps.
 */
export function openKeyModal({ state, modal, toast }) {
  if (!state.rules || !state.rules.length) {
    toast('Add an approved sender in Access rules first.');
    return;
  }

  const activeRules = state.rules.filter(r => r.enabled);
  if (!activeRules.length) {
    toast('At least one access rule must be active to create a key.');
    return;
  }

  modal('Create Person-Specific Access Key', `
    <div class="key-modal-container">
      <p class="key-modal-lead">
        Issue a passwordless, isolated access key for a specific person. They view permitted emails at <strong>/access</strong> without Google sign-in.
      </p>

      <!-- Step 1: Who is this key for? (Person Archetypes) -->
      <div class="modal-person-picker-box">
        <div class="box-title-row">
          <span>1. Who is this key for? (Person Presets)</span>
          <small>Click to apply persona defaults</small>
        </div>
        <div class="person-preset-pills">
          ${PERSON_PRESETS.map(p => `
            <button type="button" class="person-preset-pill" data-person-preset="${esc(p.id)}">
              <span class="pill-badge">${esc(p.badge)}</span>
              <strong>${esc(p.name)}</strong>
            </button>
          `).join('')}
        </div>
      </div>

      <form id="key-form">
        <!-- Recipient Name & Role Input -->
        <div class="field">
          <label for="f-key-name">Recipient Name & Purpose <span class="required-star">*</span></label>
          <input id="f-key-name" name="name" type="text" placeholder="e.g. Contractor — Project Verification or Alex (Engineering)" required minlength="2" maxlength="60" value="Contractor — Project Verification">
          <small>Helps you identify who holds this key and revokes access when their task is done.</small>
        </div>

        <!-- Step 2: Interactive Company Access Matrix -->
        <div class="modal-scopes-matrix-box">
          <div class="matrix-head-row">
            <div>
              <span class="matrix-title">2. Company Permissions Matrix</span>
              <p class="matrix-subtitle">Select what this recipient may view for each approved company rule.</p>
            </div>
            <div class="matrix-quick-actions">
              <button type="button" class="matrix-action-btn" id="btn-matrix-all-codes" title="Set all to Codes Only">🛡️ All Codes</button>
              <button type="button" class="matrix-action-btn" id="btn-matrix-all-links" title="Set all to Magic Links">🔗 All Links</button>
              <button type="button" class="matrix-action-btn" id="btn-matrix-clear" title="Block all">🚫 Clear All</button>
            </div>
          </div>

          <div class="matrix-rules-list">
            ${activeRules.map((r, i) => {
              const allowedModes = r.mode === 'read' ? ['blocked', 'codes', 'links', 'read'] : ['blocked', r.mode];
              const defaultMode = allowedModes.includes('codes') ? 'codes' : allowedModes[1] || 'blocked';

              return `
                <div class="matrix-rule-row" data-rule-id="${esc(r.id)}">
                  <div class="matrix-rule-info">
                    <div class="matrix-logo-wrap">
                      ${getCompanyLogo(r.name || r.sender, 28, i)}
                    </div>
                    <div>
                      <strong class="matrix-rule-name">${esc(r.name)}</strong>
                      <span class="matrix-rule-sender"><code>${esc(r.sender)}</code></span>
                    </div>
                  </div>

                  <div class="matrix-pills-group">
                    <button type="button" class="mode-pill ${defaultMode === 'blocked' ? 'selected' : ''}" data-set-mode="blocked">Blocked</button>
                    <button type="button" class="mode-pill ${defaultMode === 'codes' ? 'selected' : ''}" data-set-mode="codes">Codes</button>
                    ${allowedModes.includes('links') ? `
                      <button type="button" class="mode-pill ${defaultMode === 'links' ? 'selected' : ''}" data-set-mode="links">Links</button>
                    ` : ''}
                    ${allowedModes.includes('read') ? `
                      <button type="button" class="mode-pill ${defaultMode === 'read' ? 'selected' : ''}" data-set-mode="read">Full Read</button>
                    ` : ''}
                  </div>

                  <!-- Individual Subdomain Scope Selection per Access -->
                  <div class="matrix-subdomain-row" data-rule-subdomain-row="${esc(r.id)}">
                    <span class="matrix-subdomain-label">${icon('globe')} Subdomain Scope:</span>
                    <div class="subdomain-pills-group">
                      <button type="button" class="subdomain-pill selected" data-set-subdomain="*">All (*.${esc((r.sender.split('@')[1] || r.sender).replace(/^\*\./, ''))})</button>
                      <button type="button" class="subdomain-pill" data-set-subdomain="auth">Auth & SSO (auth.*)</button>
                      <button type="button" class="subdomain-pill" data-set-subdomain="billing">Billing & App (billing.*)</button>
                      <button type="button" class="subdomain-pill" data-set-subdomain="custom">Custom…</button>
                    </div>
                    <input type="text" class="custom-subdomain-input" placeholder="e.g. auth, verify, sso" style="display:none;" maxlength="40">
                    <input type="hidden" data-key-subdomain="${esc(r.id)}" value="*">
                  </div>

                  <!-- Hidden select/input used by form submission -->
                  <input type="hidden" data-key-rule="${esc(r.id)}" value="${defaultMode}">
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Step 3: Granular Ephemeral Limits & View Allowance -->
        <div class="modal-limits-box">
          <div class="limits-box-title">
            <span>3. Ephemeral Expiry & View Caps</span>
            <small>Enforce automatic revocation</small>
          </div>

          <div class="field-row-split">
            <!-- Expiration Duration -->
            <div class="field" style="flex:1.2;">
              <label for="key-duration">Key Expiration</label>
              <select id="key-duration" name="duration">
                <option value="1">After 1 hour (Emergency access)</option>
                <option value="12">After 12 hours (Work shift)</option>
                <option value="24">After 24 hours (1 day)</option>
                <option value="168">After 7 days (1 week)</option>
                <option value="720" selected>After 30 days (Standard)</option>
                <option value="0">No expiry — until manually revoked</option>
              </select>
              <small>Key permanently invalidates after this window.</small>
            </div>

            <!-- Message Open Allowance / Burn-After-Reading -->
            <div class="field" style="flex:1;">
              <label for="key-max-views">Max Message Opens</label>
              <input id="key-max-views" name="max_views" type="number" min="1" max="1000000000" step="1" placeholder="Unlimited">
              <small>Blank = Unlimited views</small>
            </div>
          </div>

          <div class="quick-limits-chips">
            <span class="limits-chips-label">Quick Limits:</span>
            <button type="button" class="limit-chip active" data-set-views="">Unlimited Views</button>
            <button type="button" class="limit-chip" data-set-views="1">🔥 Burn after 1 view</button>
            <button type="button" class="limit-chip" data-set-views="5">5 Views</button>
            <button type="button" class="limit-chip" data-set-views="10">10 Views</button>
          </div>

          <div class="burn-notice" id="single-use-notice" style="display:none;">
            🔥 <strong>Single-Use Burn Mode:</strong> This key automatically terminates permanently as soon as the recipient opens their first verification code.
          </div>
        </div>

        <div class="notice compact-security-notice">
          <strong>Zero Google Sign-in:</strong> The recipient visits <code>/access</code> with this key. Their device is bound via encrypted HttpOnly cookie. Your Gmail password and unrelated emails remain 100% private.
        </div>

        ${formFooter('Generate Person Access Key')}
      </form>
    </div>
  `, {
    subtitle: 'Zero-trust delegated inbox credential'
  });

  // Attach interactive DOM events for Presets, Matrix Toggles, and View Caps
  setTimeout(() => {
    const form = document.getElementById('key-form');
    if (!form) return;

    const nameInput = document.getElementById('f-key-name');
    const durationSelect = document.getElementById('key-duration');
    const maxViewsInput = document.getElementById('key-max-views');
    const singleUseNotice = document.getElementById('single-use-notice');

    // Handle Person Archetype Presets
    document.querySelectorAll('[data-person-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-person-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const pid = btn.dataset.personPreset;
        const preset = PERSON_PRESETS.find(p => p.id === pid);
        if (!preset) return;

        if (nameInput) nameInput.value = preset.suggestedName;
        if (durationSelect) durationSelect.value = preset.duration;
        if (maxViewsInput) maxViewsInput.value = preset.maxViews;

        // Update single-use notice
        if (singleUseNotice) {
          singleUseNotice.style.display = preset.maxViews === '1' ? 'block' : 'none';
        }

        // Highlight matching limit chip
        document.querySelectorAll('[data-set-views]').forEach(chip => {
          chip.classList.toggle('active', chip.dataset.setViews === preset.maxViews);
        });

        // Set default permissions matrix
        document.querySelectorAll('.matrix-rule-row').forEach(row => {
          const modePills = row.querySelectorAll('.mode-pill');
          const hiddenInput = row.querySelector('[data-key-rule]');
          const targetMode = preset.defaultMode;

          let targetBtn = row.querySelector(`[data-set-mode="${targetMode}"]`);
          if (!targetBtn && targetMode === 'links') {
            targetBtn = row.querySelector(`[data-set-mode="codes"]`);
          }
          if (!targetBtn) {
            targetBtn = row.querySelector(`[data-set-mode="codes"]`);
          }

          if (targetBtn && hiddenInput) {
            modePills.forEach(p => p.classList.remove('selected'));
            targetBtn.classList.add('selected');
            hiddenInput.value = targetBtn.dataset.setMode;
          }
        });
      });
    });

    // Handle Matrix Pill clicks per rule
    document.querySelectorAll('.matrix-rule-row').forEach(row => {
      const modePills = row.querySelectorAll('.mode-pill');
      const hiddenInput = row.querySelector('[data-key-rule]');

      modePills.forEach(pill => {
        pill.addEventListener('click', () => {
          modePills.forEach(p => p.classList.remove('selected'));
          pill.classList.add('selected');
          if (hiddenInput) {
            hiddenInput.value = pill.dataset.setMode;
          }
        });
      });
    });

    // Handle Subdomain Scope pill clicks per rule
    document.querySelectorAll('.subdomain-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.matrix-subdomain-row');
        if (!row) return;
        row.querySelectorAll('.subdomain-pill').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const val = btn.dataset.setSubdomain;
        const hidden = row.querySelector('[data-key-subdomain]');
        const customInput = row.querySelector('.custom-subdomain-input');
        if (val === 'custom') {
          if (customInput) {
            customInput.style.display = 'inline-block';
            customInput.focus();
            if (hidden) hidden.value = customInput.value.trim() || '*';
          }
        } else {
          if (customInput) customInput.style.display = 'none';
          if (hidden) hidden.value = val;
        }
      });
    });

    document.querySelectorAll('.custom-subdomain-input').forEach(input => {
      input.addEventListener('input', () => {
        const row = input.closest('.matrix-subdomain-row');
        const hidden = row?.querySelector('[data-key-subdomain]');
        if (hidden) hidden.value = input.value.trim() || '*';
      });
    });

    // Quick Matrix Batch Actions
    document.getElementById('btn-matrix-all-codes')?.addEventListener('click', () => {
      document.querySelectorAll('.matrix-rule-row').forEach(row => {
        const btn = row.querySelector('[data-set-mode="codes"]');
        const hidden = row.querySelector('[data-key-rule]');
        if (btn && hidden) {
          row.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('selected'));
          btn.classList.add('selected');
          hidden.value = 'codes';
        }
      });
    });

    document.getElementById('btn-matrix-all-links')?.addEventListener('click', () => {
      document.querySelectorAll('.matrix-rule-row').forEach(row => {
        const btn = row.querySelector('[data-set-mode="links"]') || row.querySelector('[data-set-mode="codes"]');
        const hidden = row.querySelector('[data-key-rule]');
        if (btn && hidden) {
          row.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('selected'));
          btn.classList.add('selected');
          hidden.value = btn.dataset.setMode;
        }
      });
    });

    document.getElementById('btn-matrix-clear')?.addEventListener('click', () => {
      document.querySelectorAll('.matrix-rule-row').forEach(row => {
        const btn = row.querySelector('[data-set-mode="blocked"]');
        const hidden = row.querySelector('[data-key-rule]');
        if (btn && hidden) {
          row.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('selected'));
          btn.classList.add('selected');
          hidden.value = 'blocked';
        }
      });
    });

    // Quick limits chips
    document.querySelectorAll('[data-set-views]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-set-views]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (maxViewsInput) {
          maxViewsInput.value = chip.dataset.setViews;
        }
        if (singleUseNotice) {
          singleUseNotice.style.display = chip.dataset.setViews === '1' ? 'block' : 'none';
        }
      });
    });

    maxViewsInput?.addEventListener('input', () => {
      const val = maxViewsInput.value.trim();
      document.querySelectorAll('[data-set-views]').forEach(c => {
        c.classList.toggle('active', c.dataset.setViews === val);
      });
      if (singleUseNotice) {
        singleUseNotice.style.display = val === '1' ? 'block' : 'none';
      }
    });
  }, 25);
}

/**
 * Display Generated Key & 1-Click Magic Link
 */
export function showKeyModal({ result, modal }) {
  const currentAccent = (typeof document !== 'undefined' && document.documentElement?.dataset?.accent) || 'cyan';
  let url = result.url || '/access';
  if (!url.includes('accent=')) {
    url += (url.includes('?') ? '&' : '?') + `accent=${encodeURIComponent(currentAccent)}`;
  }
  const magicLink = url.includes('#') 
    ? `${url}&key=${result.key}` 
    : `${url}#key=${result.key}`;

  modal('Access Key Created Successfully', `
    <div class="key-success-container">
      <div class="key-success-icon-wrap" aria-hidden="true">
        <div class="success-ring"></div>
        ${icon('check')}
      </div>

      <p class="key-success-lead">
        Share this private key or 1-click magic link with your recipient. The plaintext key is shown only once and cannot be recovered.
      </p>

      <!-- Raw Secret Key Box -->
      <div class="key-secret-card">
        <div class="secret-card-head">
          <span>Secret Access Key:</span>
          <button type="button" class="btn small primary" data-copy="${esc(result.key)}">
            ${icon('copy')}
            <span>Copy Key</span>
          </button>
        </div>
        <div class="secret-code-display">
          <code>${esc(result.key)}</code>
        </div>
      </div>

      <!-- 1-Click Direct Magic Link -->
      <div class="key-magic-link-card">
        <div class="magic-link-head">
          <div class="magic-badge">
            ${icon('mail')}
            <span>1-Click Direct Access Link:</span>
          </div>
          <button type="button" class="btn small outline" data-copy="${esc(magicLink)}">
            ${icon('copy')}
            <span>Copy Magic Link</span>
          </button>
        </div>
        <div class="magic-link-display">
          <code>${esc(magicLink)}</code>
        </div>
        <small class="magic-hint">
          Opening this link automatically signs in the recipient's browser without requiring them to paste the key.
        </small>
      </div>

      <div class="key-success-actions">
        <a class="btn primary-glow" href="${esc(magicLink)}" target="_blank" rel="noopener noreferrer">
          <span>Open Recipient Inbox ↗</span>
        </a>
      </div>
    </div>
  `, {
    subtitle: 'Share securely with your recipient'
  });
}
