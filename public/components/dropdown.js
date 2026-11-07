/**
 * Mailgrant Universal Custom Dropdown Component
 * Replaces ugly native browser selects with sleek, theme-bound, accessible custom dropdowns platform-wide.
 */

import { icon } from './icons.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

/**
 * Render a declarative custom dropdown HTML string
 * @param {object} props
 * @param {string} props.id - Element ID for the underlying select
 * @param {string} [props.name] - Form field name
 * @param {string|number} [props.value] - Current selected value
 * @param {Array<{value: string|number, label: string, sub?: string, icon?: string}>} props.options
 * @param {string} [props.placeholder] - Fallback placeholder
 * @param {string} [props.className] - Additional CSS class
 * @param {string} [props.header] - Optional header label inside the menu
 * @param {string} [props.footerHtml] - Optional footer action HTML
 * @returns {string} HTML string
 */
export function renderDropdown({
  id,
  name = id,
  value,
  options = [],
  placeholder = 'Select an option...',
  className = '',
  header = '',
  footerHtml = ''
}) {
  const normOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: String(opt.value ?? ''),
        label: String(opt.label ?? opt.value ?? ''),
        sub: opt.sub ? String(opt.sub) : '',
        icon: opt.icon || ''
      };
    }
    return {
      value: String(opt),
      label: String(opt),
      sub: '',
      icon: ''
    };
  });

  const selectedVal = value !== undefined ? String(value) : (normOptions[0]?.value || '');
  const selectedOpt = normOptions.find((o) => o.value === selectedVal) || normOptions[0];

  return `
    <div class="mg-dropdown ${className}" data-dropdown-id="${esc(id)}">
      <select id="${esc(id)}" name="${esc(name)}" class="mg-native-select-hidden" tabindex="-1" aria-hidden="true" style="display:none;">
        ${normOptions.map((o) => `
          <option value="${esc(o.value)}" ${o.value === selectedVal ? 'selected' : ''}>
            ${esc(o.label)}
          </option>
        `).join('')}
      </select>

      <button
        type="button"
        class="mg-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded="false"
        data-dropdown-trigger
      >
        <div class="mg-dropdown-trigger-content">
          <span class="mg-dropdown-current-label">${esc(selectedOpt?.label || placeholder)}</span>
          ${selectedOpt?.sub ? `<small class="mg-dropdown-current-sub">${esc(selectedOpt.sub)}</small>` : ''}
        </div>
        <span class="mg-dropdown-chevron" aria-hidden="true">${icon('chevronDown')}</span>
      </button>

      <div class="mg-dropdown-menu" role="listbox" aria-labelledby="${esc(id)}">
        ${header ? `<div class="mg-dropdown-header">${esc(header)}</div>` : ''}
        <div class="mg-dropdown-items">
          ${normOptions.map((o) => {
            const isSelected = o.value === selectedVal;
            return `
              <div
                class="mg-dropdown-item ${isSelected ? 'selected' : ''}"
                role="option"
                aria-selected="${isSelected}"
                data-dropdown-value="${esc(o.value)}"
                tabindex="0"
              >
                ${o.icon ? `<span class="mg-dropdown-item-icon">${o.icon}</span>` : ''}
                <div class="mg-dropdown-item-text">
                  <span class="mg-dropdown-item-label">${esc(o.label)}</span>
                  ${o.sub ? `<small class="mg-dropdown-item-sub">${esc(o.sub)}</small>` : ''}
                </div>
                <span class="mg-dropdown-check" aria-hidden="true">${icon('check')}</span>
              </div>
            `;
          }).join('')}
        </div>
        ${footerHtml ? `<div class="mg-dropdown-footer">${footerHtml}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Enhance an existing native <select> element in the DOM into a custom dropdown.
 * Preserves the underlying select so forms, FormData, and event listeners keep working.
 * @param {HTMLSelectElement} selectEl
 */
export function enhanceSelect(selectEl) {
  if (!selectEl || selectEl.dataset.mgEnhanced) return;
  if (selectEl.classList.contains('mg-native-select-hidden')) return;

  const options = Array.from(selectEl.options).map((opt) => ({
    value: opt.value,
    label: opt.text,
    selected: opt.selected
  }));

  const id = selectEl.id || `mg-sel-${Math.random().toString(36).slice(2, 8)}`;
  const currentVal = selectEl.value;
  const currentOpt = options.find((o) => o.value === currentVal) || options[0];

  selectEl.dataset.mgEnhanced = 'true';
  selectEl.classList.add('mg-native-select-hidden');
  selectEl.style.display = 'none';

  const wrapper = document.createElement('div');
  wrapper.className = `mg-dropdown ${selectEl.className || ''}`.trim();
  wrapper.dataset.dropdownId = id;

  wrapper.innerHTML = `
    <button
      type="button"
      class="mg-dropdown-trigger"
      aria-haspopup="listbox"
      aria-expanded="false"
      data-dropdown-trigger
    >
      <div class="mg-dropdown-trigger-content">
        <span class="mg-dropdown-current-label">${esc(currentOpt?.label || 'Select...')}</span>
      </div>
      <span class="mg-dropdown-chevron" aria-hidden="true">${icon('chevronDown')}</span>
    </button>

    <div class="mg-dropdown-menu" role="listbox">
      <div class="mg-dropdown-items">
        ${options.map((o) => `
          <div
            class="mg-dropdown-item ${o.value === currentVal ? 'selected' : ''}"
            role="option"
            aria-selected="${o.value === currentVal}"
            data-dropdown-value="${esc(o.value)}"
            tabindex="0"
          >
            <div class="mg-dropdown-item-text">
              <span class="mg-dropdown-item-label">${esc(o.label)}</span>
            </div>
            <span class="mg-dropdown-check" aria-hidden="true">${icon('check')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  selectEl.parentNode.insertBefore(wrapper, selectEl);
  wrapper.insertBefore(selectEl, wrapper.firstChild);

  // Sync back if native select changes programmatically
  selectEl.addEventListener('change', () => {
    updateDropdownVisuals(wrapper, selectEl.value);
  });
}

/**
 * Scan a container and enhance all native <select> elements (except any marked data-native).
 * @param {HTMLElement|Document} [container=document]
 */
export function initDropdowns(container = document) {
  if (typeof document === 'undefined') return;
  const root = container || document;
  const selects = root.querySelectorAll('select:not([data-native]):not(.mg-native-select-hidden):not([data-mg-enhanced])');
  selects.forEach((sel) => {
    // Skip workspace-select or demo-viewer if already custom
    if (sel.closest('.mg-dropdown')) return;
    enhanceSelect(sel);
  });
}

function updateDropdownVisuals(dropdownEl, value) {
  const items = dropdownEl.querySelectorAll('.mg-dropdown-item');
  let selectedLabel = '';
  let selectedSub = '';

  items.forEach((item) => {
    const isMatch = item.dataset.dropdownValue === String(value);
    item.classList.toggle('selected', isMatch);
    item.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    if (isMatch) {
      selectedLabel = item.querySelector('.mg-dropdown-item-label, .workspace-item-title')?.textContent || '';
      selectedSub = item.querySelector('.mg-dropdown-item-sub, .workspace-item-email')?.textContent || '';
    }
  });

  const labelEl = dropdownEl.querySelector('.mg-dropdown-current-label, .workspace-name-label');
  if (labelEl && selectedLabel) {
    labelEl.textContent = selectedLabel;
  }
  const subEl = dropdownEl.querySelector('.mg-dropdown-current-sub, .workspace-subtitle');
  if (subEl && selectedSub) {
    subEl.textContent = selectedSub;
  }
}

/**
 * Close all currently open dropdowns across the page
 */
export function closeAllDropdowns() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.mg-dropdown.is-open').forEach((dd) => {
    dd.classList.remove('is-open', 'open-up');
    const trigger = dd.querySelector('[data-dropdown-trigger]');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
  document.querySelectorAll('.sidebar.has-open-dropdown').forEach((s) => {
    s.classList.remove('has-open-dropdown');
  });
}

let dropdownSystemInitialized = false;

/**
 * Global single-instance event listener for all dropdowns on the platform.
 */
export function initDropdownSystem() {
  if (dropdownSystemInitialized || typeof document === 'undefined') return;
  dropdownSystemInitialized = true;

  // Click delegation
  document.addEventListener('click', (e) => {
    // 1. Check if clicking a trigger
    const trigger = e.target.closest('[data-dropdown-trigger]');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = trigger.closest('.mg-dropdown');
      if (!dropdown) return;

      const wasOpen = dropdown.classList.contains('is-open');
      closeAllDropdowns();

      if (!wasOpen) {
        dropdown.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');

        // Hide any active floating tooltips immediately
        const tooltip = document.getElementById('sidebar-floating-tooltip');
        if (tooltip) tooltip.classList.remove('visible');

        const sidebar = dropdown.closest('.sidebar');
        if (sidebar) sidebar.classList.add('has-open-dropdown');

        // Check viewport collision
        const menu = dropdown.querySelector('.mg-dropdown-menu');
        if (menu) {
          const rect = menu.getBoundingClientRect();
          const overflowBottom = rect.bottom > (window.innerHeight || document.documentElement.clientHeight) - 20;
          if (overflowBottom) {
            dropdown.classList.add('open-up');
          } else {
            dropdown.classList.remove('open-up');
          }
        }
      }
      return;
    }

    // 2. Check if clicking an option item
    const item = e.target.closest('[data-dropdown-value]');
    if (item) {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = item.closest('.mg-dropdown');
      if (!dropdown) return;

      const val = item.dataset.dropdownValue;
      const nativeSelect = dropdown.querySelector('select');
      const hiddenInput = dropdown.querySelector('input[type="hidden"]');

      if (nativeSelect) {
        nativeSelect.value = val;
        updateDropdownVisuals(dropdown, val);
        nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (hiddenInput) {
        hiddenInput.value = val;
        updateDropdownVisuals(dropdown, val);
        hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      closeAllDropdowns();
      return;
    }

    // 3. Clicked inside the menu (like a footer button or header) - close if action button, else let bubble
    if (e.target.closest('.mg-dropdown-menu')) {
      if (e.target.closest('button, [data-action]')) {
        closeAllDropdowns();
      }
      return;
    }

    // 4. Clicked outside - close all
    closeAllDropdowns();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const openDropdown = document.querySelector('.mg-dropdown.is-open');
    if (!openDropdown) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeAllDropdowns();
      openDropdown.querySelector('[data-dropdown-trigger]')?.focus();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = Array.from(openDropdown.querySelectorAll('.mg-dropdown-item'));
      if (!items.length) return;
      const activeIdx = items.findIndex((it) => it === document.activeElement || it.classList.contains('is-focused'));
      let nextIdx = 0;
      if (e.key === 'ArrowDown') {
        nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
      } else {
        nextIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
      }
      items.forEach((it, idx) => it.classList.toggle('is-focused', idx === nextIdx));
      items[nextIdx]?.focus();
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      const focusedItem = openDropdown.querySelector('.mg-dropdown-item.is-focused') || document.activeElement?.closest('.mg-dropdown-item');
      if (focusedItem) {
        e.preventDefault();
        focusedItem.click();
      }
    }
  });
}

// Automatically initialize dropdown event listeners upon import in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdownSystem);
  } else {
    initDropdownSystem();
  }
}


