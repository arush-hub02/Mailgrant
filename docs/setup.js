import { getTheme, toggleTheme } from './theme.js';

// Interactive Content Key Generator (AES-256 Base64)
function initKeyGenerator() {
  const genBtn = document.querySelector('#gen-key-btn');
  const keyInput = document.querySelector('#gen-key-input');
  const copyBtn = document.querySelector('#copy-key-btn');

  if (!genBtn || !keyInput) return;

  function generateKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    let binary = '';
    const bytes = new Uint8Array(array);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = window.btoa(binary);
    keyInput.value = b64;
  }

  genBtn.addEventListener('click', generateKey);

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const val = keyInput.value.trim();
      if (!val) {
        generateKey();
      }
      try {
        await navigator.clipboard.writeText(keyInput.value.trim());
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy Key';
        }, 2000);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    });
  }

  generateKey();
}

// Interactive Redirect URI & Origin Formatter
function initUriHelper() {
  const domainInput = document.querySelector('#domain-helper-input');
  const originResult = document.querySelector('#formatted-origin');
  const callbackResult = document.querySelector('#formatted-callback');
  const copyUriBtn = document.querySelector('#copy-uri-btn');

  if (!domainInput || !originResult || !callbackResult) return;

  function update() {
    let raw = (domainInput.value || '').trim();
    if (!raw) {
      raw = 'your-project.your-subdomain.workers.dev';
    }

    raw = raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

    const origin = `https://${raw}`;
    const callback = `${origin}/auth/google/callback`;

    originResult.textContent = origin;
    callbackResult.textContent = callback;
  }

  domainInput.addEventListener('input', update);
  update();

  if (copyUriBtn) {
    copyUriBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(callbackResult.textContent.trim());
        copyUriBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyUriBtn.textContent = 'Copy URI';
        }, 2000);
      } catch {}
    });
  }
}

// Clipboard copy helper for all terminal blocks
function initTerminalCopy() {
  document.querySelectorAll('.terminal-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.copyTarget;
      const targetEl = targetId ? document.querySelector(`#${targetId}`) : btn.closest('.terminal-block')?.querySelector('.terminal-body');
      if (!targetEl) return;

      const text = targetEl.innerText || targetEl.textContent || '';
      try {
        await navigator.clipboard.writeText(text.trim());
        const orig = btn.innerHTML;
        btn.innerHTML = '<span>✓ Copied</span>';
        setTimeout(() => {
          btn.innerHTML = orig;
        }, 2000);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    });
  });
}

// Live Health Checker
function initHealthChecker() {
  const input = document.querySelector('#health-origin-input');
  const checkBtn = document.querySelector('#health-check-btn');
  const resultBox = document.querySelector('#health-check-result');

  if (!input || !checkBtn || !resultBox) return;

  checkBtn.addEventListener('click', async () => {
    let origin = (input.value || '').trim();
    if (!origin) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = '<span style="color:var(--amber);">Please enter your deployed worker URL above.</span>';
      return;
    }
    if (!origin.startsWith('http')) {
      origin = `https://${origin}`;
    }
    origin = origin.replace(/\/+$/, '');

    resultBox.style.display = 'block';
    resultBox.innerHTML = '<span class="status-dot"></span> Checking backend configuration at ' + origin + '…';

    try {
      const res = await fetch(`${origin}/api/config`, { cache: 'no-store' });
      const data = await res.json();
      if (data.configured) {
        resultBox.innerHTML = `
          <div class="callout success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <div>
              <strong>✓ Backend Connected & Fully Configured!</strong><br>
              Google OAuth Client ID is active and ready for live Gmail sign-in.
            </div>
          </div>
        `;
      } else {
        resultBox.innerHTML = `
          <div class="callout warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div>
              <strong>Service reached, but secrets are pending!</strong><br>
              The Worker is deployed, but <code>GOOGLE_CLIENT_ID</code> or <code>GOOGLE_CLIENT_SECRET</code> have not been set with <code>npx wrangler secret put</code>.
            </div>
          </div>
        `;
      }
    } catch (err) {
      resultBox.innerHTML = `
        <div class="callout warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          <div>
            <strong>Unable to reach endpoint:</strong> ${err.message}<br>
            Ensure your Worker is deployed and CORS/origin matches.
          </div>
        </div>
      `;
    }
  });
}

// Smooth scroll to step
function initProgressNav() {
  document.querySelectorAll('.progress-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.stepTarget;
      const target = document.querySelector(`#${targetId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('.progress-step-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });
}

// Boot up
document.addEventListener('DOMContentLoaded', () => {
  initKeyGenerator();
  initUriHelper();
  initTerminalCopy();
  initHealthChecker();
  initProgressNav();
});

