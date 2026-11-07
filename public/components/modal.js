/**
 * Mailgrant Universal Modal Component
 * Center-aligned, glassmorphic, theme-accented modal dialog used platform-wide.
 */

import { icon } from './icons.js';
import { initDropdowns } from './dropdown.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

// Infer a matching icon for standard modal titles
function inferModalIcon(title = '') {
  const t = title.toLowerCase();
  if (t.includes('workspace')) return 'grid';
  if (t.includes('key')) return 'key';
  if (t.includes('rule')) return 'rules';
  if (t.includes('member') || t.includes('person') || t.includes('invite')) return 'people';
  if (t.includes('gmail') || t.includes('mail') || t.includes('message')) return 'mail';
  if (t.includes('security') || t.includes('session') || t.includes('protect')) return 'shield';
  if (t.includes('delete') || t.includes('remove') || t.includes('revoke')) return 'trash';
  return 'shield';
}

/**
 * Open a center-aligned modern modal dialog
 * @param {string|object} titleOrConfig - Modal title string or configuration object
 * @param {string} [htmlContent] - Content HTML string if title was passed as string
 * @param {object} [options] - Optional settings
 */
export function openModal(titleOrConfig, htmlContent = '', options = {}) {
  const config = typeof titleOrConfig === 'object'
    ? titleOrConfig
    : {
        title: titleOrConfig,
        content: htmlContent,
        ...options
      };

  const {
    title = '',
    subtitle = '',
    content = '',
    iconName = inferModalIcon(title),
    dialogId = 'dialog',
    actions = '',
    onClose = null
  } = config;

  const dialogEl = document.getElementById(dialogId);
  if (!dialogEl) return;

  dialogEl.innerHTML = `
    <div class="mg-modal-card" role="document">
      <!-- Glowing Top Accent Line -->
      <div class="mg-modal-accent-bar"></div>

      <!-- Close Button -->
      <button type="button" class="mg-modal-close-btn" data-action="close" aria-label="Close dialog">
        ${icon('close')}
      </button>

      <!-- Center-Aligned Header -->
      <div class="mg-modal-head">
        ${iconName ? `<div class="mg-modal-icon-badge">${icon(iconName)}</div>` : ''}
        <h2 id="dialog-title" class="mg-modal-title">${esc(title)}</h2>
        ${subtitle ? `<p class="mg-modal-subtitle">${esc(subtitle)}</p>` : ''}
      </div>

      <!-- Modal Body -->
      <div class="mg-modal-body">
        ${content}
        ${actions ? `<div class="mg-modal-actions">${actions}</div>` : ''}
      </div>
    </div>
  `;

  // Attach backdrop click and close button handlers
  dialogEl.onclick = (e) => {
    if (
      e.target === dialogEl || 
      e.target.closest('.mg-modal-close-btn') || 
      e.target.closest('[data-action="close"]') || 
      e.target.closest('[data-close]')
    ) {
      closeModal(dialogId);
    }
  };

  // Close callback
  if (onClose) {
    dialogEl.onclose = onClose;
  }

  // Open modal
  if (!dialogEl.open) {
    dialogEl.showModal();
  }

  // Auto-enhance any native selects inside the modal into custom dropdowns
  initDropdowns(dialogEl);

  // Focus primary input if present
  const firstInput = dialogEl.querySelector('input:not([type="hidden"]), select, textarea');
  if (firstInput && !firstInput.disabled) {
    requestAnimationFrame(() => firstInput.focus());
  }
}

/**
 * Close a modal dialog
 * @param {string} [dialogId='dialog']
 */
export function closeModal(dialogId = 'dialog') {
  const dialogEl = document.getElementById(dialogId);
  if (dialogEl && dialogEl.open) {
    dialogEl.close();
  }
}

