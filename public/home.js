import { getTheme, toggleTheme } from './theme.js';

// Status check on boot
async function initStatus() {
  const statusEl = document.querySelector('#service-status');
  const dotEl = document.querySelector('#status-dot');
  const statusText = document.querySelector('#status-text');

  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    const data = await res.json();
    if (data.configured) {
      if (dotEl) dotEl.className = 'status-dot';
      if (statusText) statusText.textContent = 'Live backend connected · Google OAuth ready';
      if (statusEl) statusEl.textContent = 'Live Gmail and access keys are active. You can sign in with your Google account.';
    } else {
      if (dotEl) dotEl.className = 'status-dot amber';
      if (statusText) statusText.textContent = 'Showcase & Demo Mode · Live setup pending';
      if (statusEl) statusEl.textContent = 'Live Gmail awaits deployment secrets. Explore the interactive sample workspace or deploy to Cloudflare.';
    }
  } catch {
    if (dotEl) dotEl.className = 'status-dot amber';
    if (statusText) statusText.textContent = 'Static Showcase Mode';
    if (statusEl) statusEl.textContent = 'This hosted showcase contains the demo and visual guide. Deploy the Cloudflare application to connect real Gmail.';
  }
}

// Interactive Preview Simulator Logic
function initSimulator() {
  const tabs = document.querySelectorAll('[data-preview-role]');
  const previewContent = document.querySelector('#simulator-content');
  if (!tabs.length || !previewContent) return;

  const views = {
    owner: `
      <div class="simulation-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:12px; color:var(--muted);">
          <span>Connected Mailbox: <strong>alex@example.com</strong></span>
          <span class="role-badge owner" style="margin:0; font-size:11px;">Owner View (Full Control)</span>
        </div>
        <div class="sim-row">
          <div class="sim-vendor">
            <span class="sim-avatar claude">C</span>
            <div class="sim-meta">
              <strong>Claude (Anthropic)</strong>
              <small>Rule: *@mail.anthropic.com · Codes only · 15m retention</small>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="sim-badge code">482 917</span>
            <span class="sim-badge" style="background:var(--green-light); color:var(--green); font-size:11px;">Active Rule</span>
          </div>
        </div>
        <div class="sim-row">
          <div class="sim-vendor">
            <span class="sim-avatar notion">N</span>
            <div class="sim-meta">
              <strong>Notion</strong>
              <small>Rule: team@m.notion.so · Magic link only · 30m retention</small>
            </div>
          </div>
          <span class="sim-badge link">Approved Magic Link</span>
        </div>
        <div class="sim-row" style="opacity: 0.75;">
          <div class="sim-vendor">
            <span class="sim-avatar personal">P</span>
            <div class="sim-meta">
              <strong>Personal & Banking Emails</strong>
              <small>All unwhitelisted senders</small>
            </div>
          </div>
          <span class="sim-badge blocked">Blocked & Private</span>
        </div>
      </div>
    `,
    recipient: `
      <div class="simulation-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:12px; color:var(--muted);">
          <span>Access Key: <strong>Brother — Claude Codes</strong></span>
          <span class="role-badge recipient" style="margin:0; font-size:11px;">Recipient View (Zero Google Login)</span>
        </div>
        <div class="sim-row" style="border: 2px solid var(--blue-border); background: var(--bg-card);">
          <div class="sim-vendor">
            <span class="sim-avatar claude">C</span>
            <div class="sim-meta">
              <strong>Claude Sign-in Code</strong>
              <small>Approved by owner · Expires in 14 min</small>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span class="sim-badge code" id="sim-copy-code">849 201</span>
            <button class="btn btn-primary btn-sm" id="sim-copy-btn" type="button" aria-label="Copy sample code">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
          </div>
        </div>
        <div class="sim-row">
          <div class="sim-vendor">
            <span class="sim-avatar notion">N</span>
            <div class="sim-meta">
              <strong>Notion Sign-in</strong>
              <small>Single-use link approved</small>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" type="button">Open Magic Link ↗</button>
        </div>
        <div class="sim-row" style="background:var(--bg-subtle); border-style:dashed;">
          <div class="sim-vendor">
            <div style="width:42px;height:42px;border-radius:10px;background:var(--bg);display:grid;place-items:center;color:var(--muted);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div class="sim-meta">
              <strong>Everything Else in Gmail</strong>
              <small>Bank alerts, personal mail, family threads</small>
            </div>
          </div>
          <span class="sim-badge owner-only">Completely Inaccessible</span>
        </div>
      </div>
    `
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const role = tab.dataset.previewRole;
      previewContent.innerHTML = views[role] || views.owner;
      bindCopy();
    });
  });

  function bindCopy() {
    const copyBtn = document.querySelector('#sim-copy-btn');
    const copyCode = document.querySelector('#sim-copy-code');
    if (copyBtn && copyCode) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(copyCode.textContent.trim());
          copyBtn.querySelector('span').textContent = 'Copied!';
          setTimeout(() => {
            if (copyBtn && copyBtn.querySelector('span')) {
              copyBtn.querySelector('span').textContent = 'Copy';
            }
          }, 2000);
        } catch {}
      });
    }
  }

  previewContent.innerHTML = views.recipient;
  bindCopy();
}

// Quick Key Submit Form on landing page
function initQuickKey() {
  const form = document.querySelector('#landing-key-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('#hero-access-key');
    const key = (input?.value || '').trim();
    if (!key) return;

    // Navigate to /access.html with key query or hash
    window.location.href = `/access.html?key=${encodeURIComponent(key)}`;
  });
}

// Smooth scroll to anchors
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Boot up
document.addEventListener('DOMContentLoaded', () => {
  initStatus();
  initSimulator();
  initQuickKey();
  initAnchors();
});
