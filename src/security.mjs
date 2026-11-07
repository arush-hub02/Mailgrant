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
export function extractContent(mail, rule) {
  const text = (mail.text || (mail.html || '').replace(/<[^>]*>/g,' ')).slice(0,60000);
  const source = `${mail.subject || ''}\n${text}`;
  // Ambiguous emails stay unavailable instead of guessing a number or exposing the original body.
  const contextual = [...source.matchAll(/(?:verification|security|sign[ -]?in|login|one[ -]?time|confirmation|your)?\s*code\s*(?:is|:|=|-)?\s*(\d{4,8})\b/gi)].map(m=>m[1]);
  const candidates = [...new Set(contextual.length ? contextual : [...source.matchAll(/^\s*(\d{6})\s*$/gm)].map(m=>m[1]))];
  const code = candidates.length === 1 ? candidates[0] : null;
  const assetExt = /\.(png|gif|jpe?g|svg|webp|ico|css|otf|ttf|woff2?)$/i;
  const urls = [...source.matchAll(/https:\/\/[^\s<>"')]+/g), ...(mail.html || '').matchAll(/https:\/\/[^\s<>"')]+/g)].map(m=>m[0].replaceAll('&amp;','&'));
  const links = [...new Set(urls)].filter(raw=>{ try { const u=new URL(raw); return u.protocol==='https:' && !u.username && !u.password && (rule.link_host ? (u.hostname===rule.link_host || u.hostname.endsWith('.'+rule.link_host)) : true) && (!u.port || u.port==='443') && !assetExt.test(u.pathname); } catch { return false; } });
  const link = links.length === 1 ? links[0] : (links.find(l => l.includes('magic-link') || l.includes('login') || l.includes('verify')) || null);
  if(rule.mode==='codes') return {code};
  if(rule.mode==='links') return {link};
  return {code,link,subject:cleanText(mail.subject,240),sender:mail.from.address.toLowerCase(),text};
}
export function projectContent(content, mode) {
  if(mode==='codes') return {code:content.code || null};
  if(mode==='links') return {link:content.link || null};
  if(mode==='read') return content;
  return null;
}
