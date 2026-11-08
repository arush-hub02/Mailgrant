const stored = (() => {
  try {
    return localStorage.getItem('mailgrant-theme');
  } catch {
    return null;
  }
})();

const storedAccent = (() => {
  try {
    return localStorage.getItem('mailgrant-accent') || 'cyan';
  } catch {
    return 'cyan';
  }
})();

const media = matchMedia('(prefers-color-scheme: dark)');

export function getTheme() {
  return document.documentElement.dataset.theme || 'light';
}

export function getThemeSetting() {
  try {
    return localStorage.getItem('mailgrant-theme') || 'system';
  } catch {
    return 'system';
  }
}

export function getAccent() {
  return document.documentElement.dataset.accent || 'cyan';
}

export function setAccent(accent, persist = true) {
  const validAccents = ['red', 'cyan', 'green', 'purple', 'amber'];
  const safeAccent = validAccents.includes(accent) ? accent : 'cyan';
  document.documentElement.dataset.accent = safeAccent;
  if (persist) {
    try {
      localStorage.setItem('mailgrant-accent', safeAccent);
    } catch {}
  }
  document.dispatchEvent(new CustomEvent('accentchange', { detail: safeAccent }));
  document.dispatchEvent(new CustomEvent('themechange', { detail: getTheme() }));
}

export function setTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = theme === 'dark' ? '#0a0e1a' : '#f8fafc';
  }

  if (persist) {
    try {
      localStorage.setItem('mailgrant-theme', theme);
    } catch {}
  }

  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export function setThemeSetting(setting) {
  try {
    localStorage.setItem('mailgrant-theme', setting);
  } catch {}

  if (setting === 'system') {
    setTheme(media.matches ? 'dark' : 'light', false);
  } else {
    setTheme(setting, false);
  }
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

// Initial theme & accent application
if (stored === 'dark' || stored === 'light') {
  setTheme(stored, false);
} else {
  setTheme(media.matches ? 'dark' : 'light', false);
}
setAccent(storedAccent, false);

media.addEventListener('change', (e) => {
  try {
    const setting = localStorage.getItem('mailgrant-theme');
    if (!setting || setting === 'system') {
      setTheme(e.matches ? 'dark' : 'light', false);
    }
  } catch {}
});

document.addEventListener('click', (e) => {
  const accentBtn = e.target.closest('[data-set-accent]');
  if (accentBtn) {
    const val = accentBtn.getAttribute('data-set-accent');
    setAccent(val);
    return;
  }

  const themeCard = e.target.closest('[data-set-theme]');
  if (themeCard) {
    const val = themeCard.getAttribute('data-set-theme');
    setThemeSetting(val);
    return;
  }

  const option = e.target.closest('.theme-toggle-option');
  if (option) {
    if (option.classList.contains('option-dark')) {
      setTheme('dark');
    } else if (option.classList.contains('option-light')) {
      setTheme('light');
    }
    return;
  }

  const button = e.target.closest('[data-theme-toggle]');
  if (button) {
    toggleTheme();
    button.setAttribute('aria-label', `Switch to ${getTheme() === 'dark' ? 'light' : 'dark'} mode`);
    return;
  }
});
