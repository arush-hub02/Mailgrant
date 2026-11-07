# Mailgrant 🛡️

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-32%20Passing-success?logo=node.js&logoColor=white)](tests/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black?logo=three.js&logoColor=white)](public/vault3d.js)
[![Security: Zero-Trust](https://img.shields.io/badge/Security-Zero--Trust%20Proxy-blue)](SECURITY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**The open-source, zero-trust cryptographic proxy for selective email sharing.**

Share verification OTP codes and magic login links with teammates, family members, or virtual assistants—**without ever sharing your Google password or exposing your personal banking emails.**

---

## ⚡ The Problem vs The Mailgrant Solution

| Dimension | ❌ The Old Way: Sharing Your Password | ✅ The Mailgrant Way: Zero-Trust Edge Proxy |
| :--- | :--- | :--- |
| **Personal & Banking Mail** | **Exposed.** Recipient can browse your bank alerts, taxes, and family threads. | **Strictly Blocked.** Unapproved senders are rejected at the edge. |
| **Google Account Scope** | **Total Takeover.** Grants access to Google Drive, Photos, and Search history. | **Zero Credentials Shared.** Works via read-only Google OAuth. |
| **Message Body Retention** | **Full Message Scraped.** Body can be read, forwarded, or harvested. | **Body-Stripped.** Discards the body; delivers only the 6-digit OTP code or link. |
| **Revocation Control** | **Nightmarish.** Requires resetting your Google password on all phones/laptops. | **Instant 1-Click Revocation.** Terminates all recipient browser sessions immediately. |
| **Recipient Sign-in** | Requires logging into your Google account. | **Zero Login.** Recipient pastes an access key (`mgk_...`) at `/access.html`. |

---

## 🚀 Open Source Documentation & Interactive Demo

The public setup guide, architecture documentation, and in-browser interactive demo are hosted on **GitHub Pages** (completely isolated from any private cloud deployments):

* **Interactive Setup Wizard**: [https://arush-hub02.github.io/Mailgrant/setup.html](https://arush-hub02.github.io/Mailgrant/setup.html)
* **Architecture & Privacy Docs**: [https://arush-hub02.github.io/Mailgrant/docs.html](https://arush-hub02.github.io/Mailgrant/docs.html)
* **Interactive Demo Playground**: [https://arush-hub02.github.io/Mailgrant/app.html?demo=1](https://arush-hub02.github.io/Mailgrant/app.html?demo=1)
* **Recipient Demo View**: [https://arush-hub02.github.io/Mailgrant/access.html?demo=1](https://arush-hub02.github.io/Mailgrant/access.html?demo=1)

---

## 🛠️ Quickstart: Self-Host on Cloudflare in 5 Minutes

Mailgrant runs entirely within Cloudflare's **100% Free Tier** (Cloudflare Workers + Cloudflare D1 SQLite) and requires **no custom domain** (uses your free `workers.dev` subdomain).

### Prerequisites
* [Node.js](https://nodejs.org/) v20+ LTS
* A free [Cloudflare Account](https://dash.cloudflare.com/)
* A free [Google Cloud Console Account](https://console.cloud.google.com/)

---

### Step 1: Clone the Repository & Install Dependencies

```bash
# 1. Clone the repository
git clone https://github.com/arush-hub02/Mailgrant.git
cd Mailgrant

# 2. Install dependencies
npm install

# 3. Run the automated test suite (32 security regression tests)
npm test
```

---

### Step 2: Provision Cloudflare D1 Database

```bash
# 1. Sign into your Cloudflare account
npx wrangler login

# 2. Create your serverless D1 SQLite database
npx wrangler d1 create mailgrant

# Note: Wrangler outputs a database_id (e.g. "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
# Verify that database_id in wrangler.jsonc matches this ID!

# 3. Apply the database migrations to remote D1
npx wrangler d1 migrations apply mailgrant --remote
```

---

### Step 3: Create Google OAuth 2.0 Credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create a project (e.g., `Mailgrant Proxy`).
2. Navigate to **APIs & Services &rarr; Library**, search for **Gmail API**, and click **Enable**.
3. Go to **APIs & Services &rarr; OAuth consent screen**:
   * User Type: **External**
   * Scopes: `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/gmail.readonly`.
   * Test Users: Add your personal Gmail address.
4. Go to **APIs & Services &rarr; Credentials &rarr; Create Credentials &rarr; OAuth client ID**:
   * Application type: **Web application**
   * Name: `Mailgrant Web Client`
   * Authorized JavaScript origins: `https://<your-worker>.workers.dev` (or `http://localhost:8787` for local dev)
   * Authorized redirect URIs: `https://<your-worker>.workers.dev/auth/google/callback`
5. Copy your **Client ID** and **Client Secret**.

---

### Step 4: Configure Cloudflare Worker Secrets

Run each command in your terminal and paste the secret value when prompted:

```bash
# 1. Google OAuth Client ID
npx wrangler secret put GOOGLE_CLIENT_ID

# 2. Google OAuth Client Secret
npx wrangler secret put GOOGLE_CLIENT_SECRET

# 3. Generate a 32-byte AES-256 Content Encryption Key
# (or click 'Generate' in /setup.html)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npx wrangler secret put CONTENT_KEY

# 4. Your Worker HTTPS origin (without trailing slash)
npx wrangler secret put APP_ORIGIN
```

---

### Step 5: Deploy to Cloudflare

```bash
# Deploy worker and all static assets
npx wrangler deploy
```

Your zero-trust email proxy is now live at `https://<your-worker>.workers.dev`!

---

## 🔄 Automatic Deployment with GitHub Actions (CI/CD)

This repository includes a pre-configured GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

Whenever you run `git push origin master`, GitHub Actions will automatically:
1. Run all 32 security regression and API tests.
2. Verify JavaScript syntax and asset references.
3. Deploy the latest code and assets directly to Cloudflare Workers!

### Setup in 60 Seconds:
1. In your GitHub repository, navigate to **Settings &rarr; Secrets and variables &rarr; Actions**.
2. Click **New repository secret** and add:
   * `CLOUDFLARE_API_TOKEN`: Create a token in [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) using the **"Edit Cloudflare Workers"** template.
   * `CLOUDFLARE_ACCOUNT_ID`: Your 32-character Cloudflare Account ID (visible on Cloudflare Dashboard sidebar, or via `npx wrangler whoami`).

---

## 💻 Local Development

To run Mailgrant locally on Windows, macOS, or Linux:

```bash
# 1. Copy the environment template
cp .dev.vars.example .dev.vars

# 2. Fill in your GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CONTENT_KEY, and APP_ORIGIN=http://localhost:8787

# 3. Apply migrations to your local SQLite database
npm run db:local

# 4. Start local development server
npm run dev
```

* **Windows 1-Click**: Double-click [`start.bat`](start.bat) to launch the local server in the background and open your browser automatically. Double-click [`stop.bat`](stop.bat) to stop it.

---

## 🔒 Security Architecture & Privacy Guarantees

* **Zero Password Exposure**: Gmail connects via read-only OAuth with cryptographic nonce and PKCE verification.
* **Fail-Closed Body Stripping**: For 2FA rules, the email body is stripped in memory; only the extracted OTP code digits or authorized links are preserved.
* **AES-256-GCM Encryption**: All ephemeral message projections and Google refresh tokens are encrypted at rest with your private `CONTENT_KEY`.
* **Automatic Scheduled Pruning**: A Cloudflare Cron Trigger (`*/15 * * * *`) automatically purges expired keys and messages from D1 SQLite every 15 minutes.
* **Content Security Policy (CSP)**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`. No third-party CDNs or remote trackers are loaded.

---

## 📁 Repository Structure

```text
├── public/                 # Static web application & assets
│   ├── index.html          # Interactive landing page with 3D WebGL Gateway
│   ├── setup.html          # Step-by-step interactive self-hosting wizard
│   ├── app.html            # Mailbox owner dashboard
│   ├── access.html         # Recipient portal (paste key, zero login)
│   ├── docs.html           # Architecture guide
│   ├── vault3d.js          # Interactive Three.js WebGL 3D Mail Gateway
│   ├── landing.css         # Modern animated design system
│   └── tokens.css          # Design tokens (dark / light themes)
├── src/                    # Cloudflare Worker backend
│   ├── worker.mjs          # Edge router, Google OAuth, D1 API, cron triggers
│   └── security.mjs        # AES-GCM encryption, regex extraction, token hashing
├── migrations/             # Cloudflare D1 SQLite database migrations (16 tables)
├── tests/                  # Security regression & API test suite (32 tests)
├── .github/workflows/      # GitHub Actions CI/CD deployment workflow
├── wrangler.jsonc          # Cloudflare Worker & D1 binding configuration
├── start.bat               # Windows 1-click local launcher
└── stop.bat                # Windows 1-click process terminator
```

---

## 🧪 Testing & Verification

Run the full verification pipeline with:

```bash
# 1. Run all 32 security regression and API tests
npm test

# 2. Verify JavaScript syntax and HTML asset integrity
npm run check

# 3. Compile standalone offline project guide
npm run showcase

# 4. Test Cloudflare Worker dry-run packaging
npx wrangler deploy --dry-run
```

---

## 📄 License

Open-sourced under the [MIT License](LICENSE). Contributions, bug reports, and pull requests are welcome!
