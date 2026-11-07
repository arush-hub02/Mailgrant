# Deploy Mailgrant and share selected mail

The code builds. The live deployment needs your Cloudflare account, a real D1 database ID, Google OAuth credentials and four runtime configuration values. The existing Sites URL is a private **sample-data showcase**, not the live mail backend.

No purchased domain, Gmail app password, Google API key or paid email provider is needed for the direct-Gmail path.

## Local startup on Windows

Install [Node.js 24 LTS](https://nodejs.org/) if needed. Double-click `start.bat` in the project folder. It prepares local dependencies and migrations, starts Mailgrant in the background and opens the live owner dashboard. Without `.dev.vars` configuration it shows the setup screen. Choose the labelled demo link to try sample data. Double-click `stop.bat` to stop the project-managed process tree and retain your local data.

For live local testing, copy `.dev.vars.example` to `.dev.vars`, set the four values from step 3, and register Google's localhost redirect from step 2. Default URL: `http://localhost:8787`. If another app uses that port, use `start.bat --port 8792` and update your Google redirect/APP_ORIGIN to match. `stop.bat` identifies the saved project launcher and run ID before stopping it; it does not stop an arbitrary process just because it uses the port.

## 1. Create the Cloudflare app and database

Create/sign in to [Cloudflare](https://dash.cloudflare.com/). In this project folder, run:

```powershell
npm ci
npx wrangler login
npx wrangler d1 create mailgrant
```

Copy the returned `database_id` into `wrangler.jsonc`, replacing `replace-with-your-d1-database-id`. Keep `binding` as `DB` and `database_name` as `mailgrant`. This project deploys to **Workers with static assets and D1**, not a static-only Cloudflare Pages upload. All five SQL migrations must be applied, including upgrades for linked mailboxes and saved keys.

```powershell
npm run db:remote
npm run deploy
```

This initial deployment gives you a URL such as `https://mailgrant.YOUR-SUBDOMAIN.workers.dev`. Pages and the demo will open, but live sign-in is disabled until step 3 is complete. Use the actual URL printed by Wrangler. You can choose your account's workers.dev subdomain in Cloudflare Workers & Pages settings.

Official guidance: [D1 setup](https://developers.cloudflare.com/d1/get-started/), [workers.dev addresses](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

## 2. Create the Google OAuth client

Open [Google Cloud Console](https://console.cloud.google.com/), create/select a project and:

1. Go to **APIs & Services → Library**, find **Gmail API**, and enable it.
2. Open **Google Auth platform → Branding** and complete the application name, support email and contact information.
3. Under **Audience**, choose the appropriate audience. For a personal Gmail testing deployment, use External/Testing and add **your dashboard-login account and every Gmail account you will connect** as test users. Access-key recipients do not authorize Gmail and do not need to be added merely to use their key.
4. Under **Data Access**, configure `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/gmail.readonly` for the application's flows. Basic sign-in requests identity only; Connect Gmail separately asks for mailbox read permission.
5. Go to **Clients → Create client → Web application**.
6. Set the authorized JavaScript origin to your exact Worker origin, e.g. `https://mailgrant.YOUR-SUBDOMAIN.workers.dev`.
7. Set the authorized redirect URI to that exact origin plus `/auth/callback`, e.g. `https://mailgrant.YOUR-SUBDOMAIN.workers.dev/auth/callback`.
8. Copy the **Client ID** and **Client secret**. These identify the deployed Mailgrant application, not the person who receives shared mail. Use your Worker homepage and `/privacy.html` when setting the app's homepage/privacy URLs, and supply your real support contact in Branding. Public release can require domain verification and additional Google review; a workers.dev origin works for personal testing but does not bypass those requirements.

For localhost testing, add a separate redirect URI `http://localhost:8787/auth/callback` and origin `http://localhost:8787`. Keep the browser host and `APP_ORIGIN` consistent.

Use an **OAuth client**, not Google's “Create API key” button. Private Gmail data requires user consent. Official guide: [Create OAuth credentials](https://developers.google.com/workspace/guides/create-credentials#oauth-client-id).

## 3. Set the Worker configuration

Use Cloudflare dashboard → **Workers & Pages → mailgrant → Settings → Variables and Secrets**, or these interactive commands:

```powershell
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put CONTENT_KEY
npx wrangler secret put APP_ORIGIN
```

| Name | Where its value comes from |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google Auth platform → Clients → your Web application |
| `GOOGLE_CLIENT_SECRET` | The same Google Web application client |
| `CONTENT_KEY` | Generate once locally with the command below |
| `APP_ORIGIN` | The deployed Worker origin, without a path or trailing slash |

Generate the content encryption key on your own computer:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste that value into Cloudflare's `CONTENT_KEY` secret prompt, then keep a secure backup. Do not put secrets in source control, browser JavaScript, screenshots or chat. Replacing or losing the key makes existing encrypted mail and Gmail credentials unreadable. `INBOUND_DOMAIN` stays unset unless you later choose filtered forwarding with your own domain.

Run `npm run deploy` again after configuration changes if needed, and check `/api/config` at your Worker origin. `configured: true` means required values are present and well formed; it does not prove Google credentials are valid. Verify by completing sign-in and connection.

Official guide: [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## 4. Sign in and connect one or more Gmail accounts

1. Open `https://YOUR-WORKER-ORIGIN/app.html` without `?demo=1`.
2. Choose **Continue with Google**. This is your dashboard identity; it does not yet grant Gmail read access.
3. Click **Connect your first Gmail**, or **Connected Gmail accounts → Add Gmail account**. Name the mailbox, e.g. Personal Gmail.
4. Google's account picker asks which Gmail to connect. It may differ from your dashboard login. Approve read-only Gmail access. The dashboard stays signed in as its original owner, while the selected mailbox gets its own workspace.
5. Go to **Access rules → Add access rule**. Enter a company name and the **actual From email address** copied from a received email. Do not enter the person you are sharing with in this sender field.
6. Choose codes only, approved sign-in links, or full plain-text retention. Set an optional subject match and retention. For links, set the exact allowed HTTPS hostname.

Repeat **Add Gmail account** for another mailbox (up to five workspaces per dashboard owner). The workspace selector switches the mailbox you manage, including its separate rules, people and keys. Reconnecting or disconnecting a mailbox does not change the dashboard login. Reconnect must use the Google identity first linked to that workspace; add a new mailbox for a different Gmail. Owners consent separately to every connected Gmail, and each must be an OAuth test user while Google is in Testing.

Gmail grants the application mailbox-wide read permission. Mailgrant fetches approved senders and applies its own rules; Google does not enforce sender-specific OAuth permissions. Owners can connect only accounts they can authorize in Google. Another person may sign into this deployment with their own Google account and create their own isolated workspaces; your mailboxes and keys do not appear in their dashboard.

## 5. Generate a key and share the page

1. Open **Access keys → Create access key**.
2. Name it, e.g. `Brother — Claude codes`.
3. Select the company permissions. Anything left Blocked stays unavailable.
4. Choose expiry: 24 hours, 7 days, 30 days, or **No expiry — until revoked**.
5. Optionally set maximum message opens. Leave blank for **no limit**. Each authorized message-open request counts, including repeat opens; inbox refreshes and key redemption do not count. Quotas cannot guarantee that a client received a response after a network failure.
6. Copy the generated `mgk_…` key. It is shown once; the server stores only its hash.
7. Send the recipient the page URL `https://YOUR-WORKER-ORIGIN/access.html` and their key privately. Create a different key for each person so you can revoke them independently.

The recipient opens the page, pastes the key and sees only the selected companies' permitted content. They do not sign into Google. Trigger a **new** matching email after key creation and use Refresh if needed. Messages received before that key was created remain private.

The browser saves a separate protected HttpOnly cookie, not the raw sharing key or your Gmail token. Its device session can last up to one year and is renewed on active visits. A no-expiry key remains redeemable until revoked or exhausted, but browser clearing, private browsing and device expiry can require entering it again.

To share a second Gmail, switch to its workspace and create another key with that mailbox's permissions. On the same recipient page, your brother chooses **Add access key** and pastes it. He can see **All saved keys** together or choose an individual mailbox/key. Each key keeps its own permissions, expiry and open allowance. Removing one key from a browser or revoking it does not remove the others. Keys from different owners on the same deployment can also be saved together. Keys from a different deployment belong on that deployment's recipient page.

Open **Access keys → Revoke** to deny subsequent requests from every browser using that key. Revocation cannot erase copied codes or end an already-created session in the external service. Anyone possessing a bearer key can use it; it is not bound to a recipient's identity. Use the existing Google-account invitation flow when identity binding is required.

## 6. Test before distributing real access

```powershell
npm test
npm run check
```

Live acceptance: connect a Gmail different from your dashboard login → add a real sender → create key → redeem in another/private browser → send a new matching email → verify code-only output → verify unrelated sender and older mail remain absent → connect a second Gmail and save its key alongside the first → verify independent limits → revoke one and verify the other still works. Also test Google authorization cancellation, expiry and reconnection. Real Google OAuth and Gmail delivery must be tested with your accounts; the automated suite uses controlled fixtures.

## Google testing and public release

For external OAuth projects in Testing with Gmail scopes, refresh tokens expire after seven days; the mailbox owner must reconnect. Sharing-key expiry is independent of Google authorization: a no-expiry sharing key cannot keep Gmail connected after Google authorization expires or is revoked.

Private testing/personal exceptions and public Gmail integration requirements differ. A public service that connects unrelated people's Gmail accounts can require Google's restricted-scope verification and security assessment. Do not promise a permanently free public launch solely because Cloudflare hosting has a free allowance.

References: [Google token expiry](https://developers.google.com/identity/protocols/oauth2#expiration), [restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification).

## Common setup problems

| Symptom | Check |
| --- | --- |
| `configured: false` | D1 binding, four required values, valid 32-byte key, exact origin |
| `redirect_uri_mismatch` | Google redirect URI must exactly equal `APP_ORIGIN` + `/auth/callback` |
| Google access blocked in Testing | Add the mailbox owner's account to OAuth test users; check audience and Gmail API enablement |
| Gmail needs reconnection | Reconnect the Gmail pinned to that workspace, which may differ from the dashboard login; check token expiry/revocation |
| Empty shared inbox | Active rule, actual From address, new message after key/rule/connection, matching original To/Cc, passing authentication, retention not expired |
| Key no longer works | Revocation, date expiry, open allowance, or cleared/expired browser session |
| The private Sites URL won't open for a friend | Use your live public Worker `/access.html` URL; Sites is only the private sample showcase |
