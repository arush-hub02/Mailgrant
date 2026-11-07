const stored=(()=>{try{return localStorage.getItem('mailgrant-theme');}catch{return null;}})();
const media=matchMedia('(prefers-color-scheme: dark)');
export function getTheme(){return document.documentElement.dataset.theme||'light';}
export function setTheme(theme,persist=true){document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;if(persist)try{localStorage.setItem('mailgrant-theme',theme);}catch{}document.dispatchEvent(new CustomEvent('themechange',{detail:theme}));}
export function toggleTheme(){setTheme(getTheme()==='dark'?'light':'dark');}
setTheme(stored==='dark'||stored==='light'?stored:media.matches?'dark':'light',false);
media.addEventListener('change',e=>{try{if(!localStorage.getItem('mailgrant-theme'))setTheme(e.matches?'dark':'light',false);}catch{}});
document.addEventListener('click',e=>{const button=e.target.closest('[data-theme-toggle]');if(button){toggleTheme();button.setAttribute('aria-label',`Switch to ${getTheme()==='dark'?'light':'dark'} mode`);}});
