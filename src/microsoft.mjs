import PostalMime from 'postal-mime';
import {now, hash, encrypt, decrypt} from './security.mjs';
import {storeApprovedMail} from './mail.mjs';

export const MICROSOFT_SCOPE = 'openid email profile offline_access https://graph.microsoft.com/Mail.Read';

export function microsoftAuthenticated(mail) {
  const first = mail.headers?.find(h => h.key?.toLowerCase() === 'authentication-results')?.value || '';
  if (/(?:^|;)\s*dmarc=pass(?:\s|;|$)/i.test(first) || /(?:^|;)\s*dkim=pass(?:\s|;|$)/i.test(first) || /(?:^|;)\s*spf=pass(?:\s|;|$)/i.test(first)) {
    return true;
  }
  return /protection\.outlook\.com/i.test(first) || /microsoft\.com/i.test(first);
}

export async function syncMicrosoft(env, wid, {fetcher = fetch} = {}) {
  const connection = await env.DB.prepare('SELECT * FROM gmail_connections WHERE workspace_id=?').bind(wid).first();
  if (!connection) throw new Error('Connect Microsoft Outlook in Workspace settings first.');
  if (connection.needs_reconnect) throw new Error('Reconnect Microsoft Outlook in Workspace settings. Authorization has expired or been revoked.');

  const lease = await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET expires_at=excluded.expires_at WHERE expires_at<=? RETURNING bucket').bind(`ms-sync:${wid}`, now() + 120000, now()).first();
  if (!lease) return { ok: true, skipped: true };

  const mailbox = await env.DB.prepare('SELECT * FROM mailboxes WHERE workspace_id=?').bind(wid).first();
  const rules = (await env.DB.prepare('SELECT * FROM rules WHERE workspace_id=? AND enabled=1').bind(wid).all()).results;
  if (!rules.length) return { ok: true, matched: 0 };

  const credentials = await decrypt(connection.content, env.CONTENT_KEY, `${wid}:gmail`);
  const signal = AbortSignal.timeout(15000);

  if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET || credentials.mock) {
    await env.DB.prepare('UPDATE gmail_connections SET last_sync_at=? WHERE workspace_id=?').bind(now(), wid).run();
    return { ok: true, matched: 0 };
  }

  try {
    const tokenResponse = await fetcher('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID,
        client_secret: env.MICROSOFT_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: credentials.refresh_token,
        scope: 'https://graph.microsoft.com/Mail.Read offline_access'
      }),
      signal
    });

    if (!tokenResponse.ok) {
      if (tokenResponse.status === 400) {
        await env.DB.prepare('UPDATE gmail_connections SET needs_reconnect=1 WHERE workspace_id=?').bind(wid).run();
      }
      throw new Error('Microsoft authorization needs attention. Reconnect Outlook if this continues.');
    }

    const tokenData = await tokenResponse.json();
    const headers = { Authorization: `Bearer ${tokenData.access_token}` };

    const after = connection.query_after || (now() - 3600000);
    const filterDate = new Date(after).toISOString();
    const url = new URL('https://graph.microsoft.com/v1.0/me/messages');
    url.search = new URLSearchParams({
      $filter: `receivedDateTime ge ${filterDate}`,
      $top: '10',
      $orderby: 'receivedDateTime asc',
      $select: 'id,receivedDateTime,hasAttachments'
    }).toString();

    const listRes = await fetcher(url.toString(), { headers, signal });
    if (!listRes.ok) {
      throw new Error('Could not refresh Outlook. Check that authorization is active.');
    }

    const { value: items = [] } = await listRes.json();
    let matched = 0;

    for (const item of items) {
      const dedupeKey = await hash(`ms:${item.id}`);
      if (await env.DB.prepare('SELECT id FROM messages WHERE workspace_id=? AND dedupe=? LIMIT 1').bind(wid, dedupeKey).first()) continue;

      const rawRes = await fetcher(`https://graph.microsoft.com/v1.0/me/messages/${item.id}/$value`, { headers, signal });
      if (!rawRes.ok) continue;

      const bytes = new Uint8Array(await rawRes.arrayBuffer());
      const mail = await PostalMime.parse(bytes);
      const receivedAt = new Date(item.receivedDateTime || mail.date || now()).getTime();

      const stored = await storeApprovedMail(env, mailbox, mail, { receivedAt, dedupeId: `ms:${item.id}`, rules });
      if (stored) matched++;
    }

    await env.DB.prepare('UPDATE gmail_connections SET last_sync_at=?, query_after=? WHERE workspace_id=?').bind(now(), now() - 1000, wid).run();
    return { ok: true, matched };
  } finally {
    await env.DB.prepare('UPDATE rate_limits SET expires_at=? WHERE bucket=?').bind(now() + 30000, `ms-sync:${wid}`).run();
  }
}
