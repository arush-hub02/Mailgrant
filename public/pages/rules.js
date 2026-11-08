import { icon } from '../components/icons.js';
import { getCompanyLogo } from '../components/logos.js';
import { esc, badge, modes, heading, field, formFooter } from './common.js';

/**
 * Curated Preset Library of Common & Famous Services
 * High-precision, zero-trust templates for popular developer and business platforms.
 */
export const RULE_PRESETS = [
  // 🎬 OTT & Streaming Platforms
  {
    id: 'netflix',
    name: 'Netflix',
    company: 'Netflix Inc',
    domain: 'netflix.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.netflix.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Netflix temporary sign-in codes, household verification, and one-time access links.'
  },
  {
    id: 'disney',
    name: 'Disney+',
    company: 'The Walt Disney Company',
    domain: 'disneyplus.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.disneyplus.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Disney+ temporary sign-in passcodes, device authorization pins, and one-time login links.'
  },
  {
    id: 'primevideo',
    name: 'Prime Video',
    company: 'Amazon Prime Video',
    domain: 'primevideo.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.primevideo.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Amazon Prime Video login verification codes, household access, and device registration.'
  },
  {
    id: 'max',
    name: 'Max (HBO)',
    company: 'Warner Bros. Discovery',
    domain: 'max.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.max.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Max & HBO streaming sign-in codes, household authentication, and temporary passes.'
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    company: 'Apple Inc.',
    domain: 'apple.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.apple.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Apple TV+ streaming and Apple ID two-factor verification codes.'
  },
  {
    id: 'hulu',
    name: 'Hulu',
    company: 'Hulu LLC',
    domain: 'hulu.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.hulu.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Hulu device activation codes, household sign-in verification, and login links.'
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    company: 'Paramount Global',
    domain: 'paramountplus.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.paramountplus.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Paramount+ streaming verification pins, device activation, and login passcodes.'
  },
  {
    id: 'peacock',
    name: 'Peacock',
    company: 'NBCUniversal',
    domain: 'peacocktv.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.peacocktv.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Peacock TV sign-in codes, device authorization, and household streaming verification.'
  },
  {
    id: 'youtube',
    name: 'YouTube Premium',
    company: 'Google / YouTube',
    domain: 'youtube.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.youtube.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'YouTube & YouTube Premium family sharing, login verification, and device codes.'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    company: 'Spotify AB',
    domain: 'spotify.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.spotify.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Spotify Family plan invitations, sign-in codes, and temporary device verification.'
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    company: 'Sony Pictures / Crunchyroll',
    domain: 'crunchyroll.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.crunchyroll.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Crunchyroll anime streaming login passcodes and device activation codes.'
  },
  {
    id: 'chaupal',
    name: 'Chaupal',
    company: 'Chaupal TV',
    domain: 'chaupal.tv',
    subdomain: '',
    wildcard: true,
    sender: '*@*.chaupal.tv',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Chaupal OTT streaming verification passcodes, OTPs, and regional entertainment access.'
  },
  {
    id: 'lionsgate',
    name: 'Lionsgate Play',
    company: 'Lionsgate Entertainment',
    domain: 'lionsgateplay.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.lionsgateplay.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Lionsgate Play sign-in codes, device authorization, and streaming verification.'
  },
  {
    id: 'zee5',
    name: 'ZEE5',
    company: 'Zee Entertainment',
    domain: 'zee5.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.zee5.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'ZEE5 OTT login verification passcodes, OTPs, and subscription verification.'
  },
  {
    id: 'sonyliv',
    name: 'Sony LIV',
    company: 'Sony Pictures Networks',
    domain: 'sonyliv.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.sonyliv.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Sony LIV sign-in OTPs, device registration, and sports/entertainment verification.'
  },
  {
    id: 'jiocinema',
    name: 'JioCinema',
    company: 'Viacom18 / Jio',
    domain: 'jiocinema.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.jiocinema.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'JioCinema Premium sign-in verification OTPs and household streaming access.'
  },
  {
    id: 'hotstar',
    name: 'Disney+ Hotstar',
    company: 'Disney+ Hotstar',
    domain: 'hotstar.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.hotstar.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'streaming',
    description: 'Hotstar sign-in verification OTPs, device authorization, and sports/movie access.'
  },

  // 💻 AI, Developer & Cloud Infrastructure
  {
    id: 'claude',
    name: 'Claude',
    company: 'Anthropic',
    domain: 'anthropic.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.anthropic.com',
    subject_contains: '',
    mode: 'read',
    link_host: 'claude.ai',
    retention_minutes: 30,
    category: 'developer',
    description: 'Anthropic Claude magic sign-in links, login codes, and ephemeral access.'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    company: 'ChatGPT / OpenAI',
    domain: 'openai.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.openai.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'developer',
    description: 'ChatGPT, Codex & OpenAI developer platform login codes.'
  },
  {
    id: 'github',
    name: 'GitHub',
    company: 'GitHub Inc',
    domain: 'github.com',
    subdomain: '',
    wildcard: false,
    sender: '*@github.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'developer',
    description: 'Two-factor device authorization and sudo sign-in codes.'
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    company: 'GitLab Inc',
    domain: 'gitlab.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.gitlab.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'developer',
    description: 'GitLab DevOps account security, CI/CD, and sign-in verification.'
  },
  {
    id: 'aws',
    name: 'Amazon AWS',
    company: 'Amazon Web Services',
    domain: 'amazon.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.amazon.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'developer',
    description: 'AWS Root Account, IAM and Cloud security passcodes.'
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    company: 'Cloudflare Inc',
    domain: 'cloudflare.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.cloudflare.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'developer',
    description: 'Cloudflare Zero Trust, Workers, and dashboard verification codes.'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    company: 'Vercel Inc',
    domain: 'vercel.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.vercel.com',
    subject_contains: '',
    mode: 'links',
    link_host: 'vercel.com',
    retention_minutes: 30,
    category: 'developer',
    description: 'Vercel deployment platform magic sign-in links and deployment alerts.'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    company: 'Supabase Inc',
    domain: 'supabase.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.supabase.com',
    subject_contains: '',
    mode: 'links',
    link_host: 'supabase.com',
    retention_minutes: 30,
    category: 'developer',
    description: 'Supabase open source Firebase alternative magic links & project alerts.'
  },
  {
    id: 'docker',
    name: 'Docker',
    company: 'Docker Inc',
    domain: 'docker.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.docker.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'developer',
    description: 'Docker Hub container registry sign-in and security codes.'
  },

  // ⚡ Productivity, Design & Collaboration
  {
    id: 'google',
    name: 'Google',
    company: 'Google Workspace',
    domain: 'google.com',
    subdomain: '',
    wildcard: false,
    sender: '*@google.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Google account security alerts and verification passcodes.'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    company: 'Microsoft 365',
    domain: 'microsoft.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.microsoft.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Microsoft Account security and Azure verification.'
  },
  {
    id: 'notion',
    name: 'Notion',
    company: 'Notion Labs',
    domain: 'notion.so',
    subdomain: '',
    wildcard: true,
    sender: '*@*.notion.so',
    subject_contains: '',
    mode: 'links',
    link_host: 'notion.so',
    retention_minutes: 30,
    category: 'productivity',
    description: 'Notion workspace magic login links and email tokens.'
  },
  {
    id: 'figma',
    name: 'Figma',
    company: 'Figma Design',
    domain: 'figma.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.figma.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 30,
    category: 'productivity',
    description: 'Figma design system invite and team authentication codes.'
  },
  {
    id: 'slack',
    name: 'Slack',
    company: 'Salesforce Slack',
    domain: 'slack.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.slack.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Direct Slack workspace sign-in and confirmation codes.'
  },
  {
    id: 'linear',
    name: 'Linear',
    company: 'Linear Orbit',
    domain: 'linear.app',
    subdomain: '',
    wildcard: true,
    sender: '*@*.linear.app',
    subject_contains: '',
    mode: 'links',
    link_host: 'linear.app',
    retention_minutes: 30,
    category: 'productivity',
    description: 'Linear issue tracker magic sign-in links and workspace invites.'
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    company: 'Atlassian Jira / Confluence',
    domain: 'atlassian.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.atlassian.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Jira, Confluence and Trello account verification codes.'
  },
  {
    id: 'canva',
    name: 'Canva',
    company: 'Canva Design',
    domain: 'canva.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.canva.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Canva team design collaboration and verification codes.'
  },
  {
    id: 'adobe',
    name: 'Adobe',
    company: 'Adobe Creative Cloud',
    domain: 'adobe.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.adobe.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Adobe ID and Creative Cloud verification codes.'
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    company: 'Dropbox Inc',
    domain: 'dropbox.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.dropbox.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Dropbox cloud storage security pins and sign-in codes.'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    company: 'Zoom Video',
    domain: 'zoom.us',
    subdomain: '',
    wildcard: true,
    sender: '*@*.zoom.us',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Zoom video meetings verification passcodes and invitations.'
  },
  {
    id: 'discord',
    name: 'Discord',
    company: 'Discord Inc',
    domain: 'discord.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.discord.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'productivity',
    description: 'Discord community and bot developer authorization codes.'
  },

  // 💳 Fintech & E-Commerce
  {
    id: 'stripe',
    name: 'Stripe',
    company: 'Stripe Payments',
    domain: 'stripe.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.stripe.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'fintech',
    description: 'Financial dashboard and merchant identity verification.'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    company: 'PayPal Holdings',
    domain: 'paypal.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.paypal.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'fintech',
    description: 'PayPal account security codes, transaction authorization, and login OTPs.'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    company: 'Shopify Inc',
    domain: 'shopify.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.shopify.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'fintech',
    description: 'Shopify merchant store access codes, admin verification, and login links.'
  },
  {
    id: 'uber',
    name: 'Uber',
    company: 'Uber Technologies',
    domain: 'uber.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.uber.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'fintech',
    description: 'Uber rides and Uber Eats sign-in codes and order verification.'
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    company: 'Airbnb Inc',
    domain: 'airbnb.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.airbnb.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'fintech',
    description: 'Airbnb booking, host verification, and security codes.'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    company: 'X Corp',
    domain: 'x.com',
    subdomain: '',
    wildcard: true,
    sender: '*@*.x.com',
    subject_contains: '',
    mode: 'codes',
    link_host: '',
    retention_minutes: 15,
    category: 'fintech',
    description: 'X (Twitter) two-factor authentication and sign-in verification codes.'
  }
];

/**
 * Parse an existing sender pattern string into its constituent parts:
 * prefix, domain, wildcard flag, and optional manual subdomain.
 */
export function parseSenderPattern(sender = '') {
  sender = String(sender || '').trim().toLowerCase();
  const atIdx = sender.indexOf('@');
  if (atIdx === -1) {
    return { prefix: '*', domain: sender, wildcard: true, subdomain: '' };
  }

  const prefix = sender.slice(0, atIdx) || '*';
  let domainPart = sender.slice(atIdx + 1);
  let wildcard = false;

  if (domainPart.startsWith('*.')) {
    wildcard = true;
    domainPart = domainPart.slice(2);
  }

  // Handle manual subdomains (e.g. mail.anthropic.com)
  const parts = domainPart.split('.');
  if (parts.length > 2) {
    const subdomain = parts.slice(0, parts.length - 2).join('.');
    const domain = parts.slice(parts.length - 2).join('.');
    return { prefix, domain, wildcard, subdomain };
  }

  return { prefix, domain: domainPart, wildcard, subdomain: '' };
}

/**
 * Format domain, prefix, subdomain, and wildcard options into a canonical sender pattern.
 */
export function computeSenderPattern({ prefix = '*', domain = '', wildcard = true, subdomain = '' }) {
  prefix = (prefix || '*').trim();
  domain = domain.trim().toLowerCase().replace(/^@/, '');
  subdomain = subdomain.trim().toLowerCase().replace(/^\./, '').replace(/\.$/, '');

  if (!domain) return '';

  let fullDomain = domain;
  if (subdomain) {
    fullDomain = `${subdomain}.${domain}`;
  }

  if (wildcard) {
    fullDomain = `*.${fullDomain}`;
  }

  return `${prefix}@${fullDomain}`;
}

/**
 * Render a cyber-styled, modern Rule Card
 */
export function ruleCard(r, i, owner = false, pools = []) {
  const isWildcard = r.sender.includes('*@*.') || r.sender.includes('@*.');
  const modeKey = r.mode || 'codes';
  const modeLabel = modes[modeKey] || 'Codes only';
  const modeClass = modeKey === 'codes' ? 'mode-codes' : modeKey === 'links' ? 'mode-links' : 'mode-read';
  const inPools = (pools || []).filter(p => (p.rule_ids || []).includes(r.id) || (p.rules || []).some(pr => pr.id === r.id));

  return `
    <article class="rule-card modern-cyber-card glass-neon-card" data-rule-card-id="${esc(r.id)}">
      <div class="rule-card-accent-bar" aria-hidden="true"></div>

      <div class="rule-card-top">
        <div class="rule-brand-cluster">
          <div class="rule-brand-logo-wrap">
            ${getCompanyLogo(r.name || r.sender, 36, i)}
          </div>
          <div class="rule-title-group">
            <h3 class="rule-name">${esc(r.name)}</h3>
            <div class="rule-sender-tag" title="Sender match pattern">
              <code>${esc(r.sender)}</code>
            </div>
          </div>
        </div>

        <div class="rule-status-cluster">
          ${badge(r.enabled ? 'Active' : 'Paused', r.enabled ? 'green' : '')}
        </div>
      </div>

      <div class="rule-details-body">
        <div class="rule-badges-row">
          <span class="rule-mode-pill ${modeClass}">
            <span class="mode-dot"></span>
            ${esc(modeLabel)}
          </span>
          ${isWildcard ? `
            <span class="rule-wildcard-pill" title="Matches any subdomain (*.domain.com) and root domain">
              <span class="wildcard-sym">*</span> Subdomains
            </span>
          ` : `
            <span class="rule-exact-pill" title="Exact domain boundary enforced">
              Strict Sender
            </span>
          `}
          <span class="rule-retention-pill">
            ${icon('time')} ${r.retention_minutes}m Purge
          </span>
          ${inPools.map(p => `
            <span class="badge blue" style="font-size:11px;" title="Included in Team Access Pool">
              ${icon('people')} ${esc(p.name)}
            </span>
          `).join('')}
        </div>

        ${r.subject_contains ? `
          <div class="rule-subject-filter">
            <span class="filter-label">Subject:</span>
            <span class="filter-val">“${esc(r.subject_contains)}”</span>
          </div>
        ` : ''}

        ${r.mode === 'links' && r.link_host ? `
          <div class="rule-host-filter">
            <span class="filter-label">Allowed Host:</span>
            <span class="filter-val"><code>https://${esc(r.link_host)}/*</code></span>
          </div>
        ` : ''}
      </div>

      ${owner ? `
        <div class="rule-card-footer">
          <div class="rule-actions-row">
            <button type="button" class="btn small outline" data-edit-rule="${esc(r.id)}" title="Edit rule pattern and retention">
              ${icon('rules')}
              <span>Edit</span>
            </button>
            <button type="button" class="btn small" data-toggle-rule="${esc(r.id)}" title="${r.enabled ? 'Pause rule' : 'Resume rule'}">
              ${icon(r.enabled ? 'pause' : 'play')}
              <span>${r.enabled ? 'Pause' : 'Resume'}</span>
            </button>
            <button type="button" class="icon-btn danger-hover" data-delete-rule="${esc(r.id)}" aria-label="Delete ${esc(r.name)} rule" title="Delete rule">
              ${icon('trash')}
            </button>
          </div>
        </div>
      ` : `
        <div class="rule-card-footer">
          <small class="shared-by-owner-note">Managed by workspace administrator</small>
        </div>
      `}
    </article>
  `;
}

/**
 * Access Rules Page Component
 */
export function rulesPage({ state }) {
  const rules = state.rules || [];
  const activeCount = rules.filter(r => r.enabled).length;
  const codesCount = rules.filter(r => r.mode === 'codes').length;
  const linksCount = rules.filter(r => r.mode === 'links').length;
  const readCount = rules.filter(r => r.mode === 'read').length;

  return `
    <div class="rules-page-container">
      ${heading(
        'A rule for every boundary.',
        'Choose exact senders, what to retain, and how long it stays.',
        `
        <div class="rules-header-actions">
          <button type="button" class="btn outline" data-sync-starter-rules title="Sync recommended starter templates into workspace database">
            ${icon('refresh')}
            <span>Sync Starter Pack</span>
          </button>
          <button type="button" class="btn primary" data-action="rule">
            ${icon('plus')}
            <span>Add access rule</span>
          </button>
        </div>
        `
      )}

      <!-- Top Cyber Telemetry Overview Banner (Exact Inbox Pattern) -->
      <section class="inbox-telemetry-banner glass-neon-card" aria-label="Rule Telemetry">
        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Approved Rules</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-number">${activeCount.toString().padStart(2, '0')}</strong>
            <span class="telemetry-pill ${activeCount > 0 ? 'active' : 'standby'}">
              <span class="pulse-dot" aria-hidden="true"></span>
              <span>${activeCount > 0 ? 'Filtering Active' : 'Standby'}</span>
            </span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Extraction Modes</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">${codesCount} Codes · ${linksCount} Links</strong>
            <span class="telemetry-pill positive">${readCount} Read-Only</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Sender Policy</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">Exact Domain / Subdomain</strong>
            <span class="telemetry-pill neutral">Fail-Closed</span>
          </div>
        </div>

        <div class="inbox-telemetry-item">
          <span class="telemetry-label">Data Retention</span>
          <div class="telemetry-value-row">
            <strong class="telemetry-text">Ephemeral 15m – 24h</strong>
            <span class="telemetry-pill positive">Auto-Purging</span>
          </div>
        </div>
      </section>

      <!-- Curated Template Presets Section -->
      <section class="rules-presets-section glass-neon-card" aria-label="Curated Service Templates">
        <div class="presets-section-header">
          <div>
            <h2 class="presets-title">Popular Service Templates</h2>
            <p class="presets-subtitle">1-click accelerators for OTT streaming (Netflix, Disney+, Prime, Chaupal, Lionsgate, etc.), developer platforms & productivity suites.</p>
          </div>
          <div class="presets-head-actions">
            <button type="button" class="btn small primary-glow" data-sync-ott-rules title="Sync all OTT streaming rules (Netflix, Disney+, Prime, Chaupal, Lionsgate, etc.) into workspace database">
              ${icon('plus')}
              <span>+ Add All OTT Streaming Rules</span>
            </button>
            <button type="button" class="btn small outline" data-sync-starter-rules title="Sync Claude, Google, GitHub and Notion to database">
              ${icon('check')}
              <span>Sync Top 4 Starter Rules</span>
            </button>
          </div>
        </div>

        <!-- Filter category pills -->
        <div class="presets-category-strip" role="tablist" aria-label="Template Categories">
          <button type="button" class="preset-cat-btn active" data-preset-cat="all" role="tab" aria-selected="true">
            <span>All Templates</span>
            <span class="cat-count-pill">${RULE_PRESETS.length}</span>
          </button>
          <button type="button" class="preset-cat-btn" data-preset-cat="streaming" role="tab" aria-selected="false">
            <span>🎬 OTT & Streaming</span>
            <span class="cat-count-pill">${RULE_PRESETS.filter(p => p.category === 'streaming').length}</span>
          </button>
          <button type="button" class="preset-cat-btn" data-preset-cat="developer" role="tab" aria-selected="false">
            <span>💻 AI & Cloud</span>
            <span class="cat-count-pill">${RULE_PRESETS.filter(p => p.category === 'developer').length}</span>
          </button>
          <button type="button" class="preset-cat-btn" data-preset-cat="productivity" role="tab" aria-selected="false">
            <span>⚡ Productivity & Team</span>
            <span class="cat-count-pill">${RULE_PRESETS.filter(p => p.category === 'productivity').length}</span>
          </button>
          <button type="button" class="preset-cat-btn" data-preset-cat="fintech" role="tab" aria-selected="false">
            <span>💳 Fintech & Commerce</span>
            <span class="cat-count-pill">${RULE_PRESETS.filter(p => p.category === 'fintech').length}</span>
          </button>
        </div>

        <div class="rules-presets-grid" id="rules-presets-grid">
          ${RULE_PRESETS.map((preset, idx) => {
            const alreadyAdded = rules.some(r => r.name.toLowerCase() === preset.name.toLowerCase() || r.sender.toLowerCase() === preset.sender.toLowerCase());
            return `
              <div class="rule-preset-card ${alreadyAdded ? 'added' : ''}" data-category="${preset.category || 'other'}">
                <div class="preset-card-top">
                  <div class="preset-logo-box">
                    ${getCompanyLogo(preset.name, 32, idx)}
                  </div>
                  <div>
                    <strong class="preset-name">${esc(preset.name)}</strong>
                    <span class="preset-company">${esc(preset.company)}</span>
                  </div>
                </div>

                <div class="preset-pattern-box">
                  <code>${esc(preset.sender)}</code>
                </div>

                <p class="preset-desc-text" style="font-size:11.5px; color:var(--muted); margin:2px 0 6px; line-height:1.4;">${esc(preset.description || '')}</p>

                <div class="preset-meta-row">
                  <span class="preset-mode-badge ${preset.mode}">${modes[preset.mode]}</span>
                  <span class="preset-time-badge">${preset.retention_minutes}m purge</span>
                </div>

                <div class="preset-action-row">
                  ${alreadyAdded ? `
                    <span class="preset-added-badge">
                      ${icon('check')} Active in Workspace
                    </span>
                  ` : `
                    <button type="button" class="btn small primary-subtle preset-add-btn" data-sync-preset="${esc(preset.id)}" title="Add ${esc(preset.name)} rule immediately to database">
                      ${icon('plus')} Add to Rules
                    </button>
                    <button type="button" class="btn small outline" data-apply-preset="${esc(preset.id)}" title="Customize ${esc(preset.name)} rule before saving">
                      <span>Customize</span>
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Active Workspace Rules Section -->
      <section class="rules-active-section">
        <div class="rules-section-header">
          <div class="section-title-wrap">
            <h2>Active Boundary Rules</h2>
            <span class="counter-badge">${rules.length}</span>
          </div>
          <div class="notice compact-notice">
            Codes-only rules retain only the extracted code. Read-message rules retain a plain-text copy and can grant narrower access to team members.
          </div>
        </div>

        ${rules.length > 0 ? `
          <div class="rule-grid">
            ${rules.map((r, i) => ruleCard(r, i, state.owner, state.pools)).join('')}
          </div>
        ` : `
          <div class="rules-empty-hero">
            <div class="empty-radar-wrap" aria-hidden="true">
              <div class="empty-radar-beam"></div>
              <div class="empty-radar-center">
                ${icon('rules')}
              </div>
            </div>
            <h3>No Access Rules Configured Yet</h3>
            <p>Mailgrant isolates your mailbox. Nothing reaches your shared inbox until you configure an approved sender boundary rule.</p>
            <div class="empty-actions">
              <button type="button" class="btn primary-glow" data-sync-starter-rules>
                ${icon('check')}
                <span>1-Click Activate Recommended Rules (Claude, Google, GitHub, Notion)</span>
              </button>
              <button type="button" class="btn outline" data-action="rule">
                ${icon('plus')}
                <span>Create Custom Rule</span>
              </button>
            </div>
          </div>
        `}
      </section>
    </div>
  `;
}

/**
 * Open the Add or Edit Access Rule Modal
 * Includes interactive wildcard subdomain toggles, manual subdomain controls,
 * real-time pattern resolution preview, and instant preset selector.
 */
export function openRuleModal(modal, state = {}, ruleToEdit = null, presetToApply = null) {
  const isEditing = Boolean(ruleToEdit);
  const title = isEditing ? `Edit Access Rule: ${ruleToEdit.name}` : presetToApply ? `Add ${presetToApply.name} Access Rule` : 'Add an Access Rule';

  const defaultName = ruleToEdit?.name || presetToApply?.name || '';
  const initialSender = ruleToEdit?.sender || presetToApply?.sender || '*@*.domain.com';
  const initialSubject = ruleToEdit?.subject_contains || presetToApply?.subject_contains || '';
  const initialMode = ruleToEdit?.mode || presetToApply?.mode || 'codes';
  const initialLinkHost = ruleToEdit?.link_host || presetToApply?.link_host || '';
  const initialRetention = String(ruleToEdit?.retention_minutes || presetToApply?.retention_minutes || 15);

  const parsed = ruleToEdit 
    ? parseSenderPattern(ruleToEdit.sender)
    : presetToApply 
      ? { prefix: '*', domain: presetToApply.domain, wildcard: presetToApply.wildcard, subdomain: presetToApply.subdomain || '' }
      : { prefix: '*', domain: '', wildcard: true, subdomain: '' };

  modal(title, `
    <div class="rule-modal-container">
      <p class="rule-modal-lead">
        Approved sender boundaries determine which inbound emails are accepted into your workspace. Anything unapproved is rejected at the boundary.
      </p>

      ${!isEditing ? `
        <!-- Quick Preset Switcher Strip -->
        <div class="modal-preset-selector">
          <div class="modal-preset-head">
            <span class="preset-selector-label">Load Template Preset:</span>
            <div class="modal-preset-cats">
              <button type="button" class="modal-cat-chip active" data-modal-cat="all">All (${RULE_PRESETS.length})</button>
              <button type="button" class="modal-cat-chip" data-modal-cat="streaming">🎬 OTTs</button>
              <button type="button" class="modal-cat-chip" data-modal-cat="developer">💻 Dev</button>
              <button type="button" class="modal-cat-chip" data-modal-cat="productivity">⚡ Work</button>
              <button type="button" class="modal-cat-chip" data-modal-cat="fintech">💳 Fintech</button>
            </div>
          </div>
          <div class="preset-pill-strip">
            ${RULE_PRESETS.map(p => `
              <button type="button" class="preset-quick-pill ${presetToApply?.id === p.id ? 'active' : ''}" data-fill-preset="${esc(p.id)}" data-cat="${p.category || 'other'}">
                ${esc(p.name)}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <form id="rule-form" ${isEditing ? `data-rule-id="${esc(ruleToEdit.id)}"` : ''}>
        ${field('Company or Rule Name', 'name', 'e.g. Claude', `required minlength="2" maxlength="60" value="${esc(defaultName)}"`)}

        <!-- Sender Pattern & Subdomain Configuration Suite -->
        <div class="modal-subdomain-box">
          <div class="subdomain-box-title">
            <span>Sender Matching Boundary</span>
            <small>Configure root domain & subdomain access</small>
          </div>

          <div class="field-row-split">
            <div class="field" style="flex:2;">
              <label for="f-domain">Base Domain <span class="required-star">*</span></label>
              <input id="f-domain" type="text" placeholder="e.g. anthropic.com" value="${esc(parsed.domain)}" required>
              <small>Company root domain (e.g. anthropic.com, google.com)</small>
            </div>

            <div class="field" style="flex:1;">
              <label for="f-prefix">Sender Prefix</label>
              <input id="f-prefix" type="text" placeholder="*" value="${esc(parsed.prefix)}">
              <small>* for any sender or exact name</small>
            </div>
          </div>

          <div class="subdomain-wildcard-toggle-box">
            <label class="toggle-checkbox-label">
              <input type="checkbox" id="f-wildcard-toggle" ${parsed.wildcard ? 'checked' : ''}>
              <span class="toggle-custom-box"></span>
              <span class="toggle-text-wrap">
                <strong>Include all subdomains (*.domain.com)</strong>
                <span class="toggle-help">Matches mail from any subdomain (e.g. mail.anthropic.com, auth.anthropic.com) and the apex domain.</span>
              </span>
            </label>
          </div>

          <div class="field manual-subdomain-field" id="field-manual-subdomain" style="${parsed.wildcard ? 'display:none;' : ''}">
            <label for="f-subdomain-manual">Specific Subdomain Only (Optional)</label>
            <input id="f-subdomain-manual" type="text" placeholder="e.g. mail or auth (leave empty for apex domain only)" value="${esc(parsed.subdomain)}">
            <small>Strict mode: Restricts access to a specific subdomain without wildcard access.</small>
          </div>

          <div class="resolved-sender-preview-card">
            <div class="preview-header">
              <span class="preview-badge">Resolved Sender Pattern:</span>
              <button type="button" class="btn-text-link" id="btn-toggle-raw-sender" style="font-size:11px;">Manual override</button>
            </div>
            <div class="preview-code-row">
              <code id="pattern-preview">${esc(initialSender)}</code>
            </div>
            <!-- Hidden/synced sender input actually submitted with the form -->
            <input type="text" id="f-sender" name="sender" value="${esc(initialSender)}" required style="display:none;" maxlength="254">
          </div>
        </div>

        ${field('Subject must contain (optional)', 'subject_contains', 'e.g. sign in, verification code', `maxlength="120" value="${esc(initialSubject)}"`)}

        <div class="field">
          <label for="f-mode">What should this rule retain?</label>
          <select id="f-mode" name="mode">
            <option value="codes" ${initialMode === 'codes' ? 'selected' : ''}>Extracted verification codes only (Safest)</option>
            <option value="links" ${initialMode === 'links' ? 'selected' : ''}>Approved sign-in links only</option>
            <option value="read" ${initialMode === 'read' ? 'selected' : ''}>Full plain-text message inspection</option>
          </select>
          <small>Team members can receive narrower access than the retained content. Codes-only rules never retain the message body.</small>
        </div>

        <div class="field" id="field-link-host" style="${initialMode === 'links' ? 'display:block;' : 'display:none;'}">
          <label for="f-link-host">Approved Link Hostname <span class="required-star">*</span></label>
          <input id="f-link-host" name="link_host" type="text" placeholder="e.g. notion.so or claude.ai" value="${esc(initialLinkHost)}" maxlength="253">
          <small>Required for links mode. Only URLs starting with https://hostname will be extracted.</small>
        </div>

        <div class="field">
          <label for="f-retention">Zero-Trust Retention Window</label>
          <select id="f-retention" name="retention_minutes">
            <option value="15" ${initialRetention === '15' ? 'selected' : ''}>15 minutes (Standard ephemeral window)</option>
            <option value="30" ${initialRetention === '30' ? 'selected' : ''}>30 minutes</option>
            <option value="60" ${initialRetention === '60' ? 'selected' : ''}>1 hour</option>
            <option value="1440" ${initialRetention === '1440' ? 'selected' : ''}>24 hours (Maximum retention limit)</option>
          </select>
          <small>After this duration, stored messages are permanently purged from database and memory.</small>
        </div>

        ${formFooter(isEditing ? 'Save Changes' : 'Create Access Rule')}
      </form>
    </div>
  `, {
    subtitle: 'Zero-trust inbound mail filter and retention boundary'
  });

  // Attach interactive DOM events for live calculation & preset selection
  setTimeout(() => {
    const form = document.getElementById('rule-form');
    if (!form) return;

    const domainInput = document.getElementById('f-domain');
    const prefixInput = document.getElementById('f-prefix');
    const wildcardToggle = document.getElementById('f-wildcard-toggle');
    const subdomainInput = document.getElementById('f-subdomain-manual');
    const manualSubdomainField = document.getElementById('field-manual-subdomain');
    const senderInput = document.getElementById('f-sender');
    const patternPreview = document.getElementById('pattern-preview');
    const modeSelect = document.getElementById('f-mode');
    const linkHostField = document.getElementById('field-link-host');
    const linkHostInput = document.getElementById('f-link-host');
    const btnToggleRaw = document.getElementById('btn-toggle-raw-sender');

    let rawMode = false;

    function updatePattern() {
      if (rawMode) {
        if (patternPreview && senderInput) {
          patternPreview.textContent = senderInput.value || '*@*.domain.com';
        }
        return;
      }
      const domain = (domainInput?.value || '').trim();
      const prefix = (prefixInput?.value || '*').trim();
      const isWildcard = Boolean(wildcardToggle?.checked);
      const sub = (subdomainInput?.value || '').trim();

      if (!domain) {
        if (patternPreview) patternPreview.textContent = 'Enter a base domain above';
        if (senderInput) senderInput.value = '';
        return;
      }

      const computed = computeSenderPattern({
        prefix,
        domain,
        wildcard: isWildcard,
        subdomain: sub
      });

      if (patternPreview) patternPreview.textContent = computed;
      if (senderInput) senderInput.value = computed;
    }

    function updateModeVisibility() {
      if (!modeSelect || !linkHostField) return;
      const isLinks = modeSelect.value === 'links';
      linkHostField.style.display = isLinks ? 'block' : 'none';
      if (linkHostInput) {
        if (isLinks) linkHostInput.setAttribute('required', 'required');
        else linkHostInput.removeAttribute('required');
      }
    }

    domainInput?.addEventListener('input', updatePattern);
    prefixInput?.addEventListener('input', updatePattern);
    subdomainInput?.addEventListener('input', updatePattern);

    wildcardToggle?.addEventListener('change', () => {
      if (manualSubdomainField) {
        manualSubdomainField.style.display = wildcardToggle.checked ? 'none' : 'block';
      }
      updatePattern();
    });

    modeSelect?.addEventListener('change', updateModeVisibility);

    btnToggleRaw?.addEventListener('click', () => {
      rawMode = !rawMode;
      if (senderInput) {
        senderInput.style.display = rawMode ? 'block' : 'none';
        if (rawMode) senderInput.focus();
      }
      btnToggleRaw.textContent = rawMode ? 'Use domain controls' : 'Manual override';
      updatePattern();
    });

    // Modal category filter chips
    document.querySelectorAll('[data-modal-cat]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-modal-cat]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.modalCat;
        document.querySelectorAll('.preset-quick-pill').forEach(btn => {
          btn.style.display = (cat === 'all' || btn.dataset.cat === cat) ? '' : 'none';
        });
      });
    });

    // Preset pills click handler
    document.querySelectorAll('.preset-quick-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-quick-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const pid = btn.dataset.fillPreset;
        const preset = RULE_PRESETS.find(p => p.id === pid);
        if (!preset) return;

        const nameInput = document.getElementById('f-name');
        if (nameInput) nameInput.value = preset.name;
        if (domainInput) domainInput.value = preset.domain;
        if (prefixInput) prefixInput.value = '*';
        if (wildcardToggle) wildcardToggle.checked = Boolean(preset.wildcard);
        if (manualSubdomainField) {
          manualSubdomainField.style.display = preset.wildcard ? 'none' : 'block';
        }
        if (subdomainInput) subdomainInput.value = preset.subdomain || '';
        if (modeSelect) modeSelect.value = preset.mode;
        if (linkHostInput) linkHostInput.value = preset.link_host || '';
        const retentionSelect = document.getElementById('f-retention');
        if (retentionSelect) retentionSelect.value = String(preset.retention_minutes);

        updateModeVisibility();
        updatePattern();
      });
    });

    updateModeVisibility();
    updatePattern();
  }, 25);
}
