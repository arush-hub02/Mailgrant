# Mailgrant security model

## Assets and trust

Codes and login links can grant account access. Approved recipients may copy them. Mailgrant cannot recall copies or terminate sessions created in another service. Prefer native seats/delegation in those services when access to their account data needs to be limited.

The backend, Cloudflare, Google identity, the connected mailbox, and privileged deployment operators are trusted. Encryption is not end-to-end: the Worker parses incoming messages and decrypts content for authorized requests. Application-level AES-GCM protects database-only leaks; compromise of the running Worker and its encryption key defeats that protection. Per-workspace encryption contexts prevent ciphertext from being moved between workspaces/rules without failing authentication. The single deployment key is a shared trust point; per-workspace managed keys are a future hardening option.

## Identity and authorization

- Google authorization-code login uses PKCE, nonce, a short-lived one-time state record and a same-site state cookie. The ID token's signature, issuer, audience, nonce and verified email are checked.
- Session identifiers are random 256-bit values, stored hashed, in HttpOnly/SameSite cookies (Secure on HTTPS). Sessions last 24 hours. Basic sign-in asks for identity scopes only. A separate, optional owner-only Gmail connection requests read-only mailbox scope and stores an encrypted refresh token; invitees never receive it.
- Every workspace request derives identity from the server session, then joins membership to that workspace. Client-supplied IDs never establish membership.
- Every message read additionally checks rule state, user/rule/workspace association, grant expiry, retention expiry and the later of membership/grant start. List endpoints apply the same boundaries and do not return message bodies.
- All management operations require ownership. Invitees have no management permission. There is no support-admin message reader.
- Invitations contain random tokens (only hashes stored), expire after 48 hours, and can be accepted only by the verified email addressed. Tokens use URL fragments to avoid access-log/referrer exposure and are cleared from the address bar on landing. Pending tokens temporarily use sessionStorage to survive sign-in; they are cleared on acceptance. Revoked/expired/used invites are denied.
- Mutations require the configured same origin and JSON bodies where applicable. Request payload size is bounded; SQL uses bound parameters.

## Access-key distribution

Owners can mint a random 256-bit `mgk_` sharing key with explicit per-rule permissions. Only its SHA-256 hash and a nonsecret display prefix are stored. The raw key is returned once with `Cache-Control: no-store`; it is not included in owner listings, activity events, configuration exports or live browser storage. It is a Mailgrant bearer capability, not a Google API key or Gmail credential. Anyone who gets it can redeem it; it is not identity-bound. Generate a different key per recipient. Existing Google-account invitations remain the identity-bound option.

The public `/access.html` page exchanges a valid key via a bounded, rate-limited, same-origin JSON POST for a separate random device credential. Its hash is stored server-side and the raw device credential is kept in an HttpOnly/SameSite=Strict cookie, Secure on HTTPS, scoped to `/api/shared`. A device can save multiple independently authorized keys on that same credential, including keys from different owners/workspaces. Selecting a key ID cannot authorize an unredeemed key. Combined inbox queries join only the keys redeemed on this device and apply each key's permissions, history, expiry and quota independently. Forgetting/revoking one deletes only its device associations. This credential cannot call owner/management APIs. Device sessions expire after one year and renew near expiry when used. A key may have no expiry while a browser still clears/expires its cookie; re-entering a still-valid key creates a new device session.

Every shared request checks key revocation, key expiry, message-open allowance and device expiry. Message list/read queries additionally join the key's scopes to rules in the same workspace, check active rule and allowed projection, enforce message retention, and exclude messages before key creation. The original Gmail token never leaves the backend. Shared refreshing may trigger bounded Gmail sync but returns no unrelated-company counts.

Each authorized message-open request consumes one view using a conditional atomic SQL update before content is returned. Simultaneous requests cannot exceed the quota. Repeated opens consume quota; listing/refreshing does not. Network failures after the authorization/count update may still consume an open. Revocation removes saved device sessions and denies key redemption and subsequent reads. Previously delivered content and requests already authorized concurrently with revocation cannot be recalled.

Demo keys protect sample data only. Their browser implementation keeps a hash and simulated device ID in local storage because a static demo cannot issue protected cookies. They are not a live security boundary.

## Incoming messages

Forwarded mail enters through the Cloudflare email handler, not a public HTTP upload endpoint. The Worker maps the SMTP recipient to its own alias record; it never accepts a workspace ID from mail content. Aliases are unpredictable but are not an authorization substitute. The optional direct Gmail path is described below.

Only the first Cloudflare-prepended `Authentication-Results` with `mx.cloudflare.net` and `dmarc=pass` is trusted. Later sender-supplied results do not grant trust. The parsed exact From sender must match a rule and the original To/Cc must include the connected Google-account email. Rejected mail is not retained in the database. Forwarding that does not preserve passing authentication, ambiguous parsing, BCC-only mail, and oversized mail fail closed. This does not prove delivery through a specific forwarding hop; it combines sender authentication, exact allowlisting, known alias, and matching original recipient. Do not describe it as a cryptographic guarantee of Gmail's forwarding path.

The special `forwarding-noreply@google.com` setup message is encrypted for 24 hours and exposed only to the owner, never to members. Confirmations do not grant other users access.

### Direct Gmail connection

This optional path works without a custom domain but broadens the backend's trust. Google grants `gmail.readonly` for the mailbox, not only selected senders. The backend searches approved senders and rechecks rules after retrieval; these are application controls, not a provider-enforced sender-limited OAuth grant. A compromised Worker with access to the encrypted refresh token and key can read unrelated mail. This distinction must remain visible before Google consent.

The dashboard owner must remain signed in through the connection callback. The one-time state binds the workspace and dashboard user. The owner can authorize a different Gmail in Google's account picker; the verified subject/email become the workspace's linked mailbox. Later reconnects require that same Google subject, even after local disconnect. A previously verified forwarding mailbox is also email-bound on its first direct connection. The dashboard identity and ownership do not change when another Gmail is linked. Each mailbox occupies its own workspace with independent rules, tokens and keys. The refresh token is encrypted with the workspace-specific `workspace:gmail` context. It is never included in state responses, audit events, exports, client storage, or logs. Access tokens are used only in server-side Authorization headers and kept in request memory. Disconnect deletes the local refresh credential; Google-side revocation is available separately in Google Account connections.

Syncing uses authenticated Gmail HTTPS APIs, sender-filtered queries, a bounded 10-message page, metadata size limits before raw downloads, cursor pagination, a database sync lease, a 25-second overall deadline, original received timestamps, and per-message deduplication. Each paginated query holds a fixed end time; completing its last page advances only to that boundary. Changes to the sender query restart pagination safely. Before storing each message, the sync checks that its credential is still connected and unchanged. New connections and newly created rules do not import earlier mail. Only the first Gmail authentication result from `mx.google.com` with DMARC pass is accepted; the same sender, subject, recipient and extraction checks apply before retention. Public integration requires review of Google's restricted-scope rules. There is no Gmail sending/deletion scope.

The dashboard or an authorized Refresh request triggers sync; the scheduled cleanup job does not poll Gmail while everyone is away. A currently authorized member with an active company grant may trigger a workspace sync, but gets only a generic success result; content still requires normal per-message access checks. Sync does not return message counts for blocked companies.

Codes-only and links-only rules retain no full body or subject. Extracted codes must be unambiguous. Link extraction permits a single HTTPS URL on an exact owner-approved hostname, without credentials or nonstandard ports. Code/link format extraction cannot verify that a value is still valid at its original service. Full reading is plain text; scripts, remote images, HTML and attachments are not served. Deduplication uses message IDs/content digests per rule.

## Storage, expiry and revocation

Sensitive content is encrypted using a random 96-bit AES-GCM nonce per record, a 256-bit secret outside D1, and workspace/rule additional authenticated data. Metadata such as sender rules, workspace names, account emails and activity timestamps remains readable to database administrators. D1 also supplies provider-managed encryption at rest and TLS in transit: <https://developers.cloudflare.com/d1/reference/data-security/>.

Message expiry is checked in SQL/authorization before reads. A 15-minute cron deletes expired content and clears setup confirmations; it also expires sessions/state/rate-limit rows/invitations and activity older than 30 days. Active storage deletion does not imply immediate removal from provider backups. A restored database must run cleanup before serving requests. Never restore expired content into an unrestricted export.

Revocation takes effect on subsequent backend authorization checks. An already-authorized response can complete concurrently with a revocation. Previously delivered content, screenshots, clipboard copies and existing third-party sessions cannot be recalled. The UI refreshes every 30 seconds when idle and removes an expired open message; a displayed copy may remain until then. No long-lived client cache of live messages is used.

## Operational work before public release

Configure HTTPS and an exact APP_ORIGIN, protect Cloudflare/Google accounts with MFA, keep secrets out of logs/source/client bundles, and retain an emergency process to disconnect Gmail, rotate a receiving alias and revoke grants. Back up the encryption key in a secure secret store. Key-ring rotation is not implemented; replacing the only key invalidates retained content and Gmail credentials. Disconnect Gmail and delete retained messages before planned replacement, then reconnect afterwards.

Review Cloudflare backup, data location and access policies, configure monitoring without capturing sensitive bodies/URLs, and add an account deletion/support process before accepting unrelated public customers. Independent security review and real two-account end-to-end testing are still required. The test suite is regression coverage, not certification.

Reference for Cloudflare's trusted email authentication result: <https://developers.cloudflare.com/email-service/api/route-emails/email-handler/#authentication-results>.
