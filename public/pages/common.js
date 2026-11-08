import { icon } from '../components/icons.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

export const modes = {
  codes: 'Codes only',
  links: 'Sign-in links',
  read: 'Full message',
  blocked: 'Blocked'
};

export const ago = t => {
  const m = Math.max(0, Math.floor((Date.now() - t) / 60000));
  return m === 0 ? 'Just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} hr ago`;
};

export const remain = t => `${Math.max(0, Math.ceil((t - Date.now()) / 60000))} min left`;

export const initials = s => String(s).split(/[ @]/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();

export const badge = (text, color = '') => `<span class="badge ${color}">${esc(text)}</span>`;

export const vendor = (name, i = 0) => `<span class="vendor v${i % 4}">${esc(name[0])}</span>`;

export const btn = (label, action, style = '') => `<button class="btn ${style}" data-action="${action}">${esc(label)}</button>`;

export const empty = (title, text, action = '') => `<div class="empty">${icon('inbox')}<h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;

export const heading = (title, sub, action = '') => `
  <div class="page-head">
    <div class="page-head-titles">
      <h1 class="page-title">${esc(title)}</h1>
      ${sub ? `<p class="subtitle">${esc(sub)}</p>` : ''}
    </div>
    ${action ? `<div class="page-head-actions">${action}</div>` : ''}
  </div>
`;

export const field = (label, name, placeholder = '', extra = '') => `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" placeholder="${placeholder}" ${extra}></div>`;

export const formFooter = label => `<p class="form-error" role="alert"></p><div class="dialog-actions">${btn('Cancel', 'close')}<button type="submit" class="btn primary">${label}</button></div>`;

