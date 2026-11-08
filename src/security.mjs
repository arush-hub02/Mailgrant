export const now = () => Date.now();
export const id = () => crypto.randomUUID();
export function b64url(bytes) { return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=',''); }
export function randomToken() { return b64url(crypto.getRandomValues(new Uint8Array(32))); }
export async function hash(value) { return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))); }
async function key(secret) {
  let bytes;
  try { bytes = Uint8Array.from(atob(secret || ''), c => c.charCodeAt(0)); } catch { throw new Error('Invalid content key'); }
  if (bytes.length !== 32) throw new Error('Invalid content key');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt','decrypt']);
}
export async function encrypt(value, secret, context) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:new TextEncoder().encode(context)}, await key(secret), new TextEncoder().encode(JSON.stringify(value)));
  return JSON.stringify({v:1, iv:btoa(String.fromCharCode(...iv)), data:btoa(String.fromCharCode(...new Uint8Array(encrypted)))});
}
export async function decrypt(value, secret, context) {
  let blob = typeof value === 'object' && value !== null ? value : JSON.parse(value);
  if (typeof blob === 'string') blob = JSON.parse(blob);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:Uint8Array.from(atob(blob.iv),c=>c.charCodeAt(0)), additionalData:new TextEncoder().encode(context)}, await key(secret), Uint8Array.from(atob(blob.data),c=>c.charCodeAt(0)));
  return JSON.parse(new TextDecoder().decode(plain));
}
export function cleanText(value, max=120) { return typeof value === 'string' ? value.trim().slice(0,max) : ''; }
export function validEmail(value) { return typeof value === 'string' && value.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value); }
export function validRuleSender(value) {
  if (typeof value !== 'string' || value.length < 3 || value.length > 254) return false;
  if (validEmail(value)) return true;
  return /^(@|[a-z0-9.!#$%&'*+/=?^_`{|}~-]*\*[a-z0-9.!#$%&'*+/=?^_`{|}~-]*@)(?:\*\.)?[a-z0-9*](?:[a-z0-9*.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value.trim());
}
export function matchesSender(pattern, sender) {
  if (!pattern || !sender) return false;
  pattern = pattern.toLowerCase().trim();
  sender = sender.toLowerCase().trim();
  if (pattern === sender) return true;
  if (pattern.startsWith('@') && !pattern.slice(1).includes('*')) return sender.endsWith(pattern);
  if (pattern.startsWith('*@') && !pattern.slice(2).includes('*')) return sender.endsWith(pattern.slice(1));
  if (pattern.includes('*')) {
    const atIdx = pattern.indexOf('@');
    if (atIdx >= 0) {
      const localPattern = pattern.slice(0, atIdx);
      const domainPattern = pattern.slice(atIdx + 1);
      const sAtIdx = sender.indexOf('@');
      if (sAtIdx >= 0) {
        const sLocal = sender.slice(0, sAtIdx);
        const sDomain = sender.slice(sAtIdx + 1);
        let domainMatches = false;
        if (domainPattern.startsWith('*.')) {
          const rootDomain = domainPattern.slice(2);
          domainMatches = (sDomain === rootDomain || sDomain.endsWith('.' + rootDomain));
        } else if (domainPattern.includes('*')) {
          const dRx = new RegExp('^' + domainPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
          domainMatches = dRx.test(sDomain);
        } else {
          domainMatches = (sDomain === domainPattern);
        }
        if (!domainMatches) return false;
        if (!localPattern || localPattern === '*') return true;
        const lRx = new RegExp('^' + localPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
        return lRx.test(sLocal);
      }
    }
    const rx = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
    return new RegExp(rx).test(sender);
  }
  return false;
}
export function validHost(host) { return /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(host); }
export function availableModes(storageMode) { return storageMode === 'read' ? ['blocked','codes','links','read'] : ['blocked',storageMode]; }
export function canRead({member,grant,rule,message,time=now()}) {
  return !!(member && grant && member.user_id === grant.user_id && member.id === message.workspace_id && rule.enabled && rule.id === message.rule_id && grant.mode !== 'blocked' && availableModes(rule.mode).includes(grant.mode) && (!grant.expires_at || grant.expires_at > time) && message.expires_at > time && message.received_at >= Math.max(member.joined_at,grant.starts_at) && grant.workspace_id === message.workspace_id && rule.workspace_id === message.workspace_id && grant.rule_id === message.rule_id);
}
export function authenticatedEmail(headers) {
  // Cloudflare prepends this result before invoking email(); never trust later sender-supplied results.
  const first = (headers.get('authentication-results') || '').split(/,(?=\s*[^;]+;)/)[0];
  return /^mx\.cloudflare\.net\s*;/i.test(first) && /(?:^|;)\s*dmarc=pass(?:\s|;|$)/i.test(first);
}
export function htmlToText(html) {
  if (!html || typeof html !== 'string') return '';
  let str = html;
  str = str.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  str = str.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
  str = str.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, ' ');
  str = str.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ');
  str = str.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, ' ');
  str = str.replace(/<!--[\s\S]*?-->/g, ' ');
  str = str.replace(/<a\b[^>]*href=["'](https?:\/\/[^"'\s<>]+)["'][^>]*>([\s\S]*?)<\/a>/gi, (match, href, inner) => {
    const cleanInner = inner.replace(/<[^>]*>/g, '').trim();
    if (!cleanInner) return href;
    if (cleanInner.toLowerCase() === href.toLowerCase()) return href;
    return `${cleanInner} (${href})`;
  });
  str = str.replace(/<\/(?:p|div|tr|h[1-6]|li|blockquote|table)>/gi, '\n');
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<hr\s*\/?>/gi, '\n---\n');
  str = str.replace(/<[^>]+>/g, ' ');
  str = str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      try { return String.fromCharCode(Number(dec)); } catch { return ''; }
    });
  str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  str = str.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n');
  return str.replace(/\n{3,}/g, '\n\n').trim();
}

export function extractContent(mail, rule) {
  let text = '';
  const rawText = typeof mail.text === 'string' ? mail.text.trim() : '';
  const looksLikeCssOrHtml = /^(@import|@media|\.[\w-]+\s*\{|<style|<html|<!doctype)/i.test(rawText);
  if (rawText && !looksLikeCssOrHtml) {
    if (!rawText.includes('https://') && mail.html && mail.html.includes('https://')) {
      const fromHtml = htmlToText(mail.html);
      text = fromHtml || rawText;
    } else {
      text = rawText;
    }
  } else if (mail.html) {
    text = htmlToText(mail.html);
  }
  text = text.slice(0, 60000);

  const source = `${mail.subject || ''}\n${text}`;
  // Ambiguous emails stay unavailable instead of guessing a number or exposing the original body.
  const contextual = [...source.matchAll(/(?:verification|security|sign[ -]?in|login|one[ -]?time|confirmation|your)?\s*code\s*(?:is|:|=|-)?\s*(\d{4,8})\b/gi)].map(m=>m[1]);
  const candidates = [...new Set(contextual.length ? contextual : [...source.matchAll(/^\s*(\d{6})\s*$/gm)].map(m=>m[1]))];
  const code = candidates.length === 1 ? candidates[0] : null;

  const assetExt = /\.(png|gif|jpe?g|svg|webp|ico|css|otf|ttf|woff2?|map)$/i;
  const ignoredHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'schema.org', 'schemas.google.com', 'www.w3.org']);

  const hrefMatches = [...(mail.html || '').matchAll(/href=["'](https:\/\/[^"'\s<>]+)["']/gi)].map(m => m[1]);
  const rawUrls = [
    ...hrefMatches,
    ...[...(source || '').matchAll(/https:\/\/[^\s<>"')]+/g)].map(m => m[0]),
    ...[...(mail.html || '').matchAll(/https:\/\/[^\s<>"')]+/g)].map(m => m[0])
  ].map(u => u.replaceAll('&amp;', '&').replace(/[.,;>)]+$/, ''));

  const links = [...new Set(rawUrls)].filter(raw => {
    try {
      const u = new URL(raw);
      if (u.protocol !== 'https:' || u.username || u.password) return false;
      if (u.port && u.port !== '443') return false;
      if (ignoredHosts.has(u.hostname.toLowerCase())) return false;
      if (rule.link_host && !(u.hostname === rule.link_host || u.hostname.endsWith('.' + rule.link_host))) return false;
      const pathname = u.pathname.split('?')[0];
      if (assetExt.test(pathname)) return false;
      return true;
    } catch {
      return false;
    }
  });

  let link = null;
  if (links.length === 1) {
    link = links[0];
  } else if (links.length > 1) {
    const signinKw = /(?:sign[ -]?in|log[ -]?in|magic[ -]?link|verify|verification|auth|authenticate|confirm|session|token|access)/i;
    const anchorMatches = [...(mail.html || '').matchAll(/<a\b[^>]*href=["'](https:\/\/[^"'\s<>]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    for (const [, href, inner] of anchorMatches) {
      const cleanHref = href.replaceAll('&amp;', '&').replace(/[.,;>)]+$/, '');
      if (links.includes(cleanHref) && (signinKw.test(inner) || signinKw.test(cleanHref))) {
        link = cleanHref;
        break;
      }
    }
    if (!link) {
      link = links.find(l => {
        const lower = l.toLowerCase();
        return (
          lower.includes('magic-link') ||
          lower.includes('login') ||
          lower.includes('signin') ||
          lower.includes('sign-in') ||
          lower.includes('verify') ||
          lower.includes('auth') ||
          lower.includes('token') ||
          lower.includes('code')
        ) && !lower.includes('unsubscribe') && !lower.includes('privacy');
      }) || null;
    }
    if (!link) {
      const nonFooters = links.filter(l => !/(?:unsubscribe|privacy|terms|help|support|feedback|twitter|linkedin|facebook)/i.test(l));
      link = nonFooters[0] || links[0] || null;
    }
  }

  if (rule.mode === 'codes') return { code };
  if (rule.mode === 'links') return { link };
  return {
    code,
    link,
    subject: cleanText(mail.subject, 240),
    sender: mail.from?.address ? mail.from.address.toLowerCase() : '',
    text
  };
}
export function projectContent(content, mode) {
  if(mode==='codes') return {code:content.code || null};
  if(mode==='links') return {link:content.link || null};
  if(mode==='read') return content;
  return null;
}

export function detectMailProvider(emailOrSender = '') {
  const s = String(emailOrSender || '').toLowerCase().trim();
  if (s.includes('google') || s.includes('gmail') || s.endsWith('@googlemail.com')) return 'google';
  if (s.includes('microsoft') || s.includes('outlook') || s.includes('hotmail') || s.includes('live.com') || s.includes('msn.com') || s.includes('office365') || s.includes('office.com') || s.includes('accountprotection')) return 'microsoft';
  if (s.includes('yahoo') || s.includes('ymail.com') || s.includes('rocketmail.com')) return 'yahoo';
  if (s.includes('apple') || s.includes('icloud') || s.includes('me.com') || s.includes('mac.com')) return 'apple';
  if (s.includes('proton') || s.includes('pm.me')) return 'proton';
  if (s.includes('zoho')) return 'zoho';
  if (s.includes('fastmail')) return 'fastmail';
  return 'custom';
}

export function getProviderDisplayName(provider = '') {
  const p = String(provider).toLowerCase();
  switch (p) {
    case 'google':
    case 'gmail':
      return 'Google Gmail';
    case 'microsoft':
    case 'outlook':
    case 'hotmail':
      return 'Microsoft Outlook / Hotmail';
    case 'yahoo':
      return 'Yahoo Mail';
    case 'apple':
    case 'icloud':
      return 'Apple iCloud';
    case 'proton':
      return 'ProtonMail';
    case 'zoho':
      return 'Zoho Mail';
    case 'fastmail':
      return 'Fastmail';
    default:
      return 'Inbound Mail Stream';
  }
}

export function isForwardingSetupEmail({ sender = '', subject = '', text = '' } = {}) {
  const s = String(sender || '').toLowerCase().trim();
  const sub = String(subject || '').toLowerCase().trim();
  const knownSenders = [
    'forwarding-noreply@google.com',
    'account-security-noreply@accountprotection.microsoft.com',
    'no-reply@microsoft.com',
    'member_services@live.com',
    'mail-noreply@microsoft.com',
    'msa@communication.microsoft.com',
    'no-reply@cc.yahoo-inc.com',
    'account-security-noreply@cc.yahoo-inc.com',
    'confirmation-service@yahoo-inc.com',
    'noreply@email.apple.com',
    'appleid@id.apple.com',
    'notify@proton.me',
    'no-reply@proton.me',
    'support@zohomail.com',
    'noreply@zohomail.com'
  ];
  if (knownSenders.includes(s) || s.endsWith('@accountprotection.microsoft.com') || s.endsWith('@cc.yahoo-inc.com')) {
    return true;
  }
  const patterns = [
    /forward(?:ing)?\s+(?:confirmation|verification|request|code|address)/i,
    /verify\s+(?:your\s+)?(?:email|forwarding|account)/i,
    /confirm\s+(?:your\s+)?(?:email|forwarding|account)/i,
    /verification\s+code/i,
    /security\s+code/i
  ];
  return patterns.some(p => p.test(sub));
}

export function extractSetupConfirmation(mail) {
  const subject = cleanText(mail.subject, 240);
  let text = '';
  if (mail.text) {
    text = mail.text.slice(0, 20000);
  } else if (mail.html) {
    text = htmlToText(mail.html).slice(0, 20000);
  }
  const sender = mail.from?.address ? mail.from.address.toLowerCase() : '';
  const provider = detectMailProvider(sender || mail.to?.[0]?.address || '');
  const providerName = getProviderDisplayName(provider);

  let code = null;
  const codeMatch = text.match(/(?:confirmation|verification|security)\s+code(?:\s+is)?[:\s]+([0-9]{4,10})/i) ||
                    text.match(/code[:\s]+([0-9]{4,10})/i) ||
                    text.match(/\b([0-9]{6,9})\b/);
  if (codeMatch) code = codeMatch[1];

  let link = null;
  const linkMatches = [
    ...[...(mail.html || '').matchAll(/<a\b[^>]*href=["'](https:\/\/[^"'\s<>]+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m => m[1]),
    ...[...(text || '').matchAll(/https:\/\/[^\s<>"')]+/g)].map(m => m[0])
  ].map(u => u.replaceAll('&amp;', '&').replace(/[.,;>)]+$/, ''));

  for (const rawUrl of linkMatches) {
    try {
      const u = new URL(rawUrl);
      if (['google.com', 'microsoft.com', 'live.com', 'yahoo.com', 'apple.com', 'proton.me', 'zoho.com'].some(d => u.hostname === d || u.hostname.endsWith('.' + d))) {
        link = rawUrl;
        break;
      }
    } catch {}
  }

  let instructions = 'Enter this confirmation code or click the confirmation link in your mail provider to enable forwarding.';
  if (provider === 'microsoft') {
    instructions = 'Copy the Microsoft security code and paste it into Outlook / Hotmail Settings > Mail > Forwarding to confirm.';
  } else if (provider === 'yahoo') {
    instructions = 'Copy the Yahoo verification code and paste it into Yahoo Mail Settings > More Settings > Mailboxes > Forwarding.';
  } else if (provider === 'google') {
    instructions = 'Copy the confirmation code into Gmail Settings > Forwarding and POP/IMAP, or click the verification link.';
  }

  return {
    provider,
    provider_name: providerName,
    sender,
    subject,
    text,
    code,
    link,
    instructions
  };
}
