/**
 * Mailgrant Sleek Collapsible Drawer & Neon Navigation Component
 */

import { icon } from './icons.js';
import { getMailboxLogo } from './logos.js';

const STORAGE_KEY = 'mailgrant_sidebar_collapsed';

// Helper to escape HTML attributes and text
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const initials = (s) => String(s).split(/[ @]/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

// Global floating tooltip element
let tooltipEl = null;

function getOrCreateTooltip() {
  if (!tooltipEl && typeof document !== 'undefined') {
    tooltipEl = document.getElementById('sidebar-floating-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'sidebar-floating-tooltip';
      tooltipEl.className = 'sidebar-floating-tooltip';
      tooltipEl.setAttribute('role', 'tooltip');
      tooltipEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltipEl);
    }
  }
  return tooltipEl;
}

export function hideSidebarTooltip() {
  if (tooltipEl) {
    tooltipEl.classList.remove('visible');
  }
}

let tooltipsAttached = false;
export function initSidebarTooltips() {
  if (tooltipsAttached || typeof document === 'undefined') return;
  tooltipsAttached = true;
  const tooltip = getOrCreateTooltip();

  function showTooltip(target) {
    const sidebar = document.getElementById('workspace-nav');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.contains('collapsed');
    const isToggle = target.classList.contains('collapse-toggle');

    // Only show tooltip in collapsed mode, or for the collapse toggle button
    if (!isCollapsed && !isToggle) {
      hideSidebarTooltip();
      return;
    }

    // Do not show tooltip if workspace dropdown is currently open
    if (document.querySelector('.workspace-dropdown-wrap.is-open')) {
      hideSidebarTooltip();
      return;
    }

    const text = target.getAttribute('data-tooltip') || target.dataset.tooltip;
    if (!text) {
      hideSidebarTooltip();
      return;
    }

    const rect = target.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.top = `${rect.top + rect.height / 2}px`;
    tooltip.style.left = `${rect.right + 12}px`;
    tooltip.classList.add('visible');
  }

  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest('#workspace-nav [data-tooltip]');
    if (target) showTooltip(target);
    else hideSidebarTooltip();
  });

  document.addEventListener('pointerout', (e) => {
    const target = e.target.closest('#workspace-nav [data-tooltip]');
    if (target) hideSidebarTooltip();
  });

  document.addEventListener('focusin', (e) => {
    const target = e.target.closest('#workspace-nav [data-tooltip]');
    if (target) showTooltip(target);
  });

  document.addEventListener('focusout', hideSidebarTooltip);
  window.addEventListener('scroll', hideSidebarTooltip, { passive: true });
}

/**
 * Check if sidebar is currently in collapsed rail mode
 * @returns {boolean}
 */
export function isSidebarCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Toggle or set sidebar collapse state
 * @param {boolean} [forceState]
 * @returns {boolean} new state
 */
export function toggleSidebarCollapse(forceState) {
  const sidebar = document.getElementById('workspace-nav');
  const shell = document.querySelector('.shell');
  const currentState = sidebar ? sidebar.classList.contains('collapsed') : isSidebarCollapsed();
  const nextState = typeof forceState === 'boolean' ? forceState : !currentState;

  try {
    localStorage.setItem(STORAGE_KEY, String(nextState));
  } catch {}

  hideSidebarTooltip();

  if (sidebar) {
    sidebar.classList.toggle('collapsed', nextState);
    const toggleBtn = sidebar.querySelector('.collapse-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(!nextState));
      toggleBtn.setAttribute('title', nextState ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)');
      toggleBtn.setAttribute('data-tooltip', nextState ? 'Expand sidebar' : 'Collapse sidebar (Ctrl+B)');
      toggleBtn.innerHTML = icon(nextState ? 'expand' : 'collapse');
    }
  }

  if (shell) {
    shell.classList.toggle('sidebar-collapsed', nextState);
  }

  return nextState;
}

/**
 * Toggle mobile drawer open/close
 * @param {boolean} [forceOpen]
 */
export function toggleMobileSidebar(forceOpen) {
  const sidebar = document.getElementById('workspace-nav');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open');
  const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;

  sidebar.classList.toggle('mobile-open', nextOpen);
  sidebar.classList.toggle('open', nextOpen);
  if (backdrop) {
    backdrop.classList.toggle('active', nextOpen);
  }
  document.body.classList.toggle('sidebar-mobile-locked', nextOpen);

  const mobileMenuBtn = document.querySelector('.mobile-menu');
  if (mobileMenuBtn) {
    mobileMenuBtn.setAttribute('aria-expanded', String(nextOpen));
  }
}

// Global keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar collapse
let keyboardAttached = false;
export function attachSidebarShortcuts() {
  initSidebarTooltips();

  if (keyboardAttached) return;
  keyboardAttached = true;

  window.addEventListener('keydown', (e) => {
    // Only toggle if not currently typing in a field
    const active = document.activeElement;
    const isTyping = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
    if (isTyping || active?.isContentEditable) return;

    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      toggleSidebarCollapse();
    } else if (e.key === 'Escape') {
      // Close mobile drawer if open
      const sidebar = document.getElementById('workspace-nav');
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        toggleMobileSidebar(false);
      }
    }
  });
}

/**
 * Render the Sleek Collapsible Sidebar HTML
 * @param {object} props
 * @param {object} props.state - Workspace state
 * @param {object} props.me - Current user & workspaces
 * @param {string} props.page - Current active page ID
 * @param {object} props.labels - Page labels
 * @param {string} props.wid - Current workspace ID
 * @param {boolean} props.owner - Whether user is owner
 * @returns {string} HTML string
 */
export function renderSidebar({ state, me, page, labels, wid, owner, demo = false }) {
  const collapsed = isSidebarCollapsed();
  const userName = me.user?.name || 'Workspace User';
  const userInitials = initials(userName);
  const currentWs = me.workspaces?.find(w => w.id === wid) || state.workspace || {};
  const currentWorkspaceName = currentWs.name || state.workspace?.name || 'Personal Workspace';
  const currentMailbox = currentWs.mailbox_email || state.workspace?.mailbox_email || '';
  const workspaceInitial = (currentWorkspaceName && currentWorkspaceName[0]) ? currentWorkspaceName[0].toUpperCase() : 'W';
  const unreadCount = state.messages?.length || 0;
  const isDark = typeof document !== 'undefined' && document.documentElement?.dataset?.theme === 'dark';

  // Initialize tooltips in DOM
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(initSidebarTooltips);
  }

  // Navigation definition with modern icon mappings
  const navItems = [
    { id: 'dashboard', icon: 'grid', label: labels.dashboard || 'Dashboard' },
    { id: 'inbox', icon: 'inbox', label: labels.inbox || 'Shared inbox', count: unreadCount },
    ...(owner ? [
      { id: 'mailboxes', icon: 'mail', label: labels.mailboxes || 'Connected Gmail accounts' },
      { id: 'rules', icon: 'rules', label: labels.rules || 'Access rules' },
      { id: 'people', icon: 'people', label: labels.people || 'People & Access' },
      { id: 'activity', icon: 'activity', label: labels.activity || 'Activity log' }
    ] : []),
    { id: 'profile', icon: 'user', label: labels.profile || 'Profile & Settings', mobileOnly: true }
  ];

  return `
    <aside id="workspace-nav" class="sidebar ${collapsed ? 'collapsed' : ''}" aria-label="Workspace navigation">
      <!-- Sidebar Header with Refresh & Minimal Sleek Chevron Toggle -->
      <div class="sidebar-header">
        <a class="brand-wrapper" href="/" aria-label="Mailgrant Home">
          <span class="brand-mark">
            <img src="/images/mailgrant-mark.png" alt="Mailgrant" class="brand-mark-img" width="34" height="34" />
          </span>
          <span class="brand-name">Mail<span class="brand-gradient-text">grant</span></span>
        </a>
        <div class="sidebar-header-actions">
          <button type="button" class="sidebar-refresh-btn has-tooltip" data-action="refresh" aria-label="Refresh workspace" data-tooltip="Refresh workspace">
            ${icon('refresh')}
          </button>
          <button type="button" class="collapse-toggle has-tooltip" data-action="toggle-sidebar" aria-label="${collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}" data-tooltip="${collapsed ? 'Expand sidebar' : 'Collapse sidebar (Ctrl+B)'}" aria-expanded="${!collapsed}">
            ${icon(collapsed ? 'expand' : 'collapse')}
          </button>
        </div>
      </div>

      <!-- Workspace Switcher Card with Custom Dropdown -->
      <div class="workspace-dropdown-wrap mg-dropdown" data-dropdown-id="workspace-select">
        <select id="workspace-select" name="workspace" class="mg-native-select-hidden" tabindex="-1" aria-hidden="true" style="display:none;">
          ${me.workspaces.map((w) => `
            <option value="${esc(w.id)}" ${w.id === wid ? 'selected' : ''}>
              ${esc(w.name)}
            </option>
          `).join('')}
        </select>

        <div
          class="workspace-card"
          role="button"
          tabindex="0"
          aria-haspopup="listbox"
          aria-expanded="false"
          data-dropdown-trigger
          data-tooltip="Switch workspace"
        >
          <span class="workspace-avatar" aria-hidden="true">${getMailboxLogo(currentMailbox || currentWorkspaceName, 22, Boolean(state.gmail_connected))}</span>
          <div class="workspace-info">
            <div class="workspace-title-row">
              <span class="workspace-name-label">${esc(currentWorkspaceName)}</span>
              <span class="mg-dropdown-chevron" aria-hidden="true">${icon('chevronDown')}</span>
            </div>
            <span class="workspace-subtitle">${esc(currentMailbox || (owner ? 'Primary workspace' : 'Member'))}</span>
          </div>
        </div>

        <div class="mg-dropdown-menu workspace-menu" role="listbox">
          <div class="mg-dropdown-header">SWITCH WORKSPACE</div>
          <div class="mg-dropdown-items">
            ${me.workspaces.map((w) => {
              const isSelected = w.id === wid;
              const wInit = (w.name && w.name[0]) ? w.name[0].toUpperCase() : 'W';
              return `
                <div
                  class="mg-dropdown-item workspace-item ${isSelected ? 'selected' : ''}"
                  role="option"
                  aria-selected="${isSelected}"
                  data-dropdown-value="${esc(w.id)}"
                  tabindex="0"
                >
                  <span class="workspace-item-avatar">${getMailboxLogo(w.mailbox_email || w.name, 20, Boolean(w.gmail_connected))}</span>
                  <div class="workspace-item-info">
                    <span class="workspace-item-title">${esc(w.name)}</span>
                    ${w.mailbox_email ? `<small class="workspace-item-email">${esc(w.mailbox_email)}</small>` : ''}
                  </div>
                  ${isSelected ? `<span class="mg-dropdown-check" aria-hidden="true">${icon('check')}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          <div class="mg-dropdown-footer">
            <button type="button" class="workspace-add-btn" data-action="workspace">
              ${icon('plus')}
              <span>Create new workspace</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Navigation with High-Impact Neon Selection -->
      <nav class="sidebar-nav" aria-label="Primary navigation">
        ${navItems.map((item) => {
          const isActive = item.id === page;
          const tooltipText = `${item.label}${item.count != null && item.count > 0 ? ` (${item.count})` : ''}`;
          return `
            <button
              type="button"
              data-page="${item.id}"
              class="nav-item ${isActive ? 'active' : ''} ${item.mobileOnly ? 'mobile-only-nav-item' : ''}"
              ${isActive ? 'aria-current="page"' : ''}
              data-tooltip="${esc(tooltipText)}"
              aria-label="${esc(item.label)}"
            >
              ${icon(item.icon)}
              <span class="nav-label">${esc(item.label)}</span>
              ${item.count != null ? `
                <span class="nav-count">${item.count}</span>
                ${item.count > 0 ? `<span class="nav-unread-dot" aria-hidden="true"></span>` : ''}
              ` : ''}
            </button>
          `;
        }).join('')}
      </nav>

      <!-- Sidebar Bottom: Theme Switcher, New Workspace, User Profile -->
      <div class="sidebar-bottom">
        ${demo ? `
          <!-- Interactive Demo Perspective Switcher Box -->
          <div class="sidebar-demo-box">
            <div class="sidebar-demo-header">
              <span class="badge blue">Demo perspective</span>
              <button type="button" class="demo-reset-link" data-action="reset" data-tooltip="Reset demo data">Reset</button>
            </div>
            <select class="sidebar-demo-select" id="demo-viewer" aria-label="Demo perspective">
              <option value="owner" ${owner ? 'selected' : ''}>View as Administrator</option>
              <option value="brother" ${!owner ? 'selected' : ''}>View as Collaborator (Restricted)</option>
            </select>
          </div>
        ` : ''}


        <!-- Sidebar Divider above Theme Switcher -->
        <div class="sidebar-divider"></div>

        <!-- Animated Modern Dark / Light Mode Switcher -->
        <div class="sidebar-theme-wrapper">
          ${collapsed ? `
            <!-- Compact morphing icon button when sidebar is collapsed -->
            <button type="button" class="sidebar-theme-compact-btn has-tooltip ${isDark ? 'is-dark' : 'is-light'}" data-theme-toggle aria-label="Toggle theme" data-tooltip="${isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}">
              <span class="compact-icon moon-icon">${icon('moon')}</span>
              <span class="compact-icon sun-icon">${icon('sun')}</span>
            </button>
          ` : `
            <div class="sidebar-theme-toggle ${isDark ? 'is-dark' : 'is-light'}" data-theme-toggle role="button" tabindex="0" aria-label="Toggle theme mode" data-tooltip="${isDark ? 'Switch to Light theme' : 'Switch to Dark Cyber Neon'}">
              <div class="theme-toggle-pill"></div>
              <div class="theme-toggle-option option-dark">
                <span class="theme-option-icon">${icon('moon')}</span>
                <span class="theme-option-label">Dark</span>
              </div>
              <div class="theme-toggle-option option-light">
                <span class="theme-option-icon">${icon('sun')}</span>
                <span class="theme-option-label">Light</span>
              </div>
            </div>
          `}
        </div>

        <!-- Sidebar Divider above Profile & Settings -->
        <div class="sidebar-divider"></div>

        <!-- User Profile Account Footer (Click to open Profile & Settings) -->
        <div class="sidebar-account has-tooltip ${page === 'profile' || page === 'settings' ? 'active' : ''}" data-page="profile" data-tooltip="Profile & Settings" role="button" tabindex="0">
          <div class="user-avatar-wrap">
            <span class="user-avatar" aria-hidden="true">
              ${me.user?.avatar
                ? `<img src="${esc(me.user.avatar)}" class="avatar-photo" alt="${esc(userName)}" />`
                : `<span class="user-avatar-initials">${userInitials}</span>`}
            </span>
            <span class="avatar-online-dot-mini" aria-hidden="true"></span>
          </div>
          <div class="sidebar-account-info">
            <strong>${esc(userName)}</strong>
            <small>${owner ? 'Workspace Administrator' : 'Team Member'}</small>
          </div>
          <button type="button" class="logout-btn has-tooltip" data-action="logout" aria-label="Sign out" data-tooltip="Sign out" onclick="event.stopPropagation(); window.mailgrantLogout ? window.mailgrantLogout() : (location.href='/signin')">
            ${icon('logout')}
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Drawer Backdrop -->
    <div id="sidebar-backdrop" class="sidebar-backdrop" data-action="close-menu" aria-hidden="true"></div>
  `;
}
