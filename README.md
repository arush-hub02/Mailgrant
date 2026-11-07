# Mailgrant

A selective email-sharing application with liquid glass light/dark themes and a self-contained, animated HTML project guide.

Start with [DEPLOYMENT.md](DEPLOYMENT.md) for exact console locations, required configuration, owner Gmail sign-in, and the simple sharing-key flow.

## What is included

- Google sign-in for identity, plus a separate optional read-only Gmail connection that works without a custom domain.
- Gmail API syncing for approved senders, encrypted refresh tokens, bounded pagination, deduplication, and reconnect/disconnect controls. Syncing runs while the dashboard is open or when Refresh is clicked; it does not poll while everyone is away.
- One owner dashboard can connect multiple Gmail accounts, each in its own isolated workspace (up to five). The linked Gmail can differ from the dashboard login; reconnects are pinned to that mailbox's verified Google identity.
- Exact-sender and optional subject filters; code-only, approved-link, and full plain-text retention modes.
- Invitations tied to a Google account email, single-use links, and 48-hour expiry. Invitations are copied and shared manually, not emailed by the application.
- Per-person, per-rule grants, optional expiry, future-message access, and removal.
- Revocable access keys for a recipient page without recipient Google sign-in: per-company scopes, optional/no expiry, optional/unlimited message-open allowance, one-time secret display, hashed keys and protected remembered browser sessions.
- A recipient can save multiple keys from different owners or mailboxes in one combined inbox, select a source, or remove one saved key. Every key keeps independent permissions, expiry and message-open limits.
- Extracted code copying, approved HTTPS sign-in links, and safe plain-text email display.
- Rule pause/resume/delete, receiving-address rotation, retained-message deletion, workspace deletion, and configuration export.
- AES-GCM content encryption; workspace-scoped queries; secure sessions; same-origin write checks; bounded requests; audit events; scheduled deletion.
- A sample-data demo, isolated from the server and clearly labelled. Demo mutations persist only in this browser's local storage.
- Animated project guide, interactive permission examples, a light/dark toggle, motion pause, reduced-motion support, responsive layouts, and a standalone offline HTML export.

## Open the project

On Windows, double-click **start.bat**. It installs missing dependencies, applies local migrations, starts the server hidden in the background, and opens the owner dashboard. Missing credentials show setup instructions; sample data is available only through the labelled demo link. Double-click **stop.bat** to stop this project's managed server while keeping the local database. Node.js 24 LTS is recommended.

If the default port 8787 is occupied, use `start.bat --port 8792`. For live Google sign-in, the chosen port must match `.dev.vars` APP_ORIGIN and Google's authorized localhost redirect URI. The launcher log is `.wrangler/local-server.log`. `start.bat --no-browser` starts without opening a tab.

```powershell
npm ci
npm run dev
```

Open the printed local URL. `/` is the live entry page, `/docs.html` is the animated project guide, and `/privacy.html` explains data handling. `/app.html?demo=1` opens the explicit sample workspace. `/app.html` and `/access.html` use the live backend.

For a local database, run `npm run db:local`. Copy `.dev.vars.example` to `.dev.vars` and supply your own local credentials. Do not commit this file. Use `http://localhost:8787` consistently in APP_ORIGIN, the Google redirect URI, and your browser when testing live sign-in; do not mix localhost and 127.0.0.1.

On restricted Windows environments, direct Wrangler's files into the checkout:

```powershell
$env:WRANGLER_LOG_PATH = "$PWD\.wrangler\logs"
$env:WRANGLER_SEND_METRICS = 'false'
$env:XDG_CONFIG_HOME = "$PWD\.wrangler\config"
npm run dev
```

## Deploy the live application to Cloudflare

1. Sign into your own Cloudflare account using `npx wrangler login`.
2. Create a D1 database with `npx wrangler d1 create mailgrant`.
3. Put its returned `database_id` into `wrangler.jsonc`, replacing the placeholder. Keep the binding `DB`.
4. Run `npm run db:remote` to apply all five included migrations. Run `npm run deploy` once to obtain the Worker origin before configuring Google.
5. In Google Cloud Console, enable the Gmail API and create a Web application OAuth client. Basic sign-in requests `openid email profile`; the separate Connect Gmail flow also requests `https://www.googleapis.com/auth/gmail.readonly`. Configure the consent screen, test users, your deployed origin and the exact redirect URI `https://YOUR-APP-ORIGIN/auth/callback`. Add local redirect URIs separately if needed. A free Cloudflare `workers.dev` HTTPS origin works; you do not need to buy a domain.
6. Configure these Worker secrets with `npx wrangler secret put NAME` (each command prompts for its value): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CONTENT_KEY`, and `APP_ORIGIN`. `INBOUND_DOMAIN` is optional and only needed for forwarding.
7. Generate `CONTENT_KEY` once with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Store it securely. Do not print or paste it into chat or commit it. Losing or replacing this key makes existing encrypted content unreadable. Delete retained content before a planned key replacement; key-ring rotation is not implemented.
8. Set `APP_ORIGIN` to the exact HTTPS origin of your Worker/custom domain, without a trailing slash. Leave `INBOUND_DOMAIN` unset for domain-free Gmail mode. If deploying for the first time, choose/obtain your Worker URL, then configure the same exact origin in Google and the secret.
9. Run `npm run deploy`.
10. Sign into the owner dashboard, choose **Connected Gmail accounts → Add Gmail account**, name it, and select the Gmail to authorize in Google's account picker. Add exact-sender rules and scoped access keys in that mailbox. Repeat for additional Gmail accounts; switching workspaces switches the rules and keys you manage. Reconnect an existing workspace using its already-linked Gmail. The app receives broad Gmail read permission; recipients receive only their rule-based permissions. Review Google's applicable verification/security assessment requirements before accepting unrelated public users.
11. The included cron trigger runs every 15 minutes. Confirm it is deployed. Expired messages are already rejected during API reads, independently of cleanup.
12. Test with two Google accounts using the acceptance steps below before inviting real users.

Cloudflare Workers, D1 and incoming Email Routing have free allowances; domain registration and usage above those allowances can cost money. This repo is a Cloudflare application, not a Vercel serverless application. Vercel would need a separate inbound-email and database deployment.

### Domain-free Gmail operation

Basic sign-in does not connect Gmail. Connect Gmail is a separate owner-only Google consent flow, with identity/account binding, PKCE, nonce, and one-time state checks. A refresh token is encrypted using the same protected deployment key and is never returned to browsers. Google grants mailbox-wide read scope; the backend uses sender-filtered searches and rechecks sender, recipient, subject, authentication, time window, and permissions. These application filters do not narrow Google's OAuth grant itself.

Only mail received after connection and rule creation is imported. Each sync processes up to 10 matches within a fixed time window, preserves page state, deduplicates already-stored messages, and limits syncs to roughly once per 30 seconds per workspace. Completing later pages cannot skip mail arriving while earlier pages were processed. Retention uses Gmail's original received time; refreshing cannot make an expired code new again. The dashboard and recipient page poll while open; Refresh can be clicked manually. No background Gmail polling or push subscription is configured.

For an external OAuth project in Testing with Gmail scopes, Google refresh tokens expire after seven days; reconnect when needed. A broadly available public Gmail integration can require restricted-scope verification and a security assessment, so free hosting is not a promise of a free public Gmail SaaS launch. See [Google token expiry](https://developers.google.com/identity/protocols/oauth2#expiration) and [restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification).

Disconnect removes the local credential and stops new syncs; retained messages expire normally. In-flight syncs check the current credential before storing another message. An already-authorized operation can still complete concurrently with disconnect. To revoke Google's grant too, use Google Account → Connections. Revocation there can affect other connections using the same OAuth project/account. Reconnecting begins a new collection window and must use the pinned Gmail identity.

### Optional filtered forwarding

If you later own a domain, set `INBOUND_DOMAIN` and configure Cloudflare Email Routing on a dedicated inbound subdomain. Do not replace an existing Google Workspace domain's MX records. Route a catch-all on that inbound subdomain to the `mailgrant` Worker. Unknown aliases are rejected. This path does not need Gmail read permission and keeps unrelated mail out of the application entirely.

## Connect using filtered forwarding (optional)

1. Sign in and create a workspace. The connected mailbox is the verified Google account email; arbitrary mailbox addresses cannot be claimed.
2. Add an access rule using the **actual sender** from a received email. Demo senders ending in `.test` are illustrative and will not receive real mail.
3. Open Settings, copy the workspace receiving address, and add it as a forwarding address in Gmail.
4. Open “View forwarding confirmation” in Mailgrant. Only the owner can access this setup email. Enter Gmail's confirmation code in Gmail settings.
5. Leave global forwarding disabled. Create a Gmail filter for the selected exact sender/subject and forward only matching mail to the receiving address.
6. Receive a new matching message. Cloudflare must report DMARC pass and the original To/Cc must include the connected mailbox. This marks receiving as active. BCC-only messages are deliberately unsupported.
7. Invite a person's Google account, share the private invitation URL yourself, and wait for acceptance. Set their per-company permission under People. New grants apply to messages received after the grant; old messages do not become visible.

The app does not have Gmail settings permission and cannot create/delete Gmail filters. Remove filters yourself when disconnecting. Address rotation rejects new mail to the old address, but you must verify the new address and update filters.

## Verification

```powershell
npm test
npm run showcase
npm run check
npx wrangler deploy --dry-run --outdir artifacts/worker
```

Tests use Node's built-in SQLite engine to exercise the real SQL schema and API. They cover cross-workspace denial, projection of codes-only responses, revocation, expiry, history boundaries, invitations, mutation authorization, encrypted ingestion, and deletion cascades. They do not substitute for a real Google/Cloudflare end-to-end test or an independent security assessment.

Live acceptance: owner creates a workspace and rule → owner connects Gmail (or confirms forwarding) → correct invitee accepts → owner grants access → a new authenticated matching email arrives → Refresh imports it → invitee sees only permitted content → pause/revoke/expiry denies the next read. Also test another workspace's IDs, the wrong Google account on an invitation/connection, Google token revocation, pagination, and reconnection.

## Visual guide and hosted showcase

`npm run showcase` builds `Mailgrant-Project-Guide.html` in the repository root and copies static assets into `showcase/dist`. The standalone file contains its own CSS and JS, opens offline, and can be shared without credentials. Links to the sample app require internet and access to the hosted showcase. The feature guide is also available at `/docs.html`.

The Sites publication contains **only the static demo and guide**; it does not deploy the live Google/email backend or hold real mail. It starts owner-private. The downloadable HTML is the easiest way to present the project to others without changing that access policy. The live app is configured and deployed separately in your own Cloudflare account.

## Project layout

```text
public/                    Liquid glass application, demo and visual guide
public/access.html         Recipient page: paste an access key, view only permitted mail
src/worker.mjs             Cloudflare HTTP API, Google auth, email and cron handlers
src/security.mjs           Encryption, extraction, authentication and access checks
migrations/                D1 database schema
tests/                     Real API and SQL security regression tests
scripts/                   Checks and standalone-guide/showcase packaging
wrangler.jsonc             Cloudflare deployment configuration
.dev.vars.example          Required local configuration names, without secrets
SECURITY.md                Trust model, controls, limits and operational guidance
DEPLOYMENT.md              Console-by-console deployment and key distribution guide
Mailgrant-Project-Guide.html  Standalone presentation, generated
showcase/.openai/hosting.json  Private Sites showcase identity
```

## Current boundaries

No Gmail sending, deletion of Gmail originals, attachments, HTML email execution, automatic invitation emails, team billing, background Gmail polling while everyone is away, or third-party session termination. Extraction is conservative and format-dependent; ambiguous codes/links are unavailable instead of revealing full bodies. A read rule must include an exact link hostname before narrower link grants can return a link.

Initial application limits: 5 owned workspaces per account, 25 members per workspace, 30 rules per workspace, 200 forwarded messages per workspace per day, 30 invitations per workspace per day, 10 Gmail matches per sync with a 30-second minimum interval, 256 KB per incoming message, 60,000 characters per retained plain-text body, 100 current inbox rows, and 100 recent activity rows. These are small-release guardrails, not enterprise guarantees. Owner creation/member/rule count checks are not serialized global quota reservations; use stronger transactional admission if strict quotas become a billing boundary.

Protect the deployment account and Google project with MFA, keep dependencies current, monitor operational failures without logging mail content, and confirm backup retention before making deletion promises. This code has automated tests but has not had an independent production security audit.
