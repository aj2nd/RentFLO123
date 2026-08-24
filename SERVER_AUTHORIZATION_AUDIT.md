# RentFLO Server Authentication and Authorization Audit

**Audit date:** 24 August 2026  
**Scope:** 75 route declarations across the active server, authentication integration, provider callbacks, and inactive legacy route modules.

## Shared enforcement

All protected routes use `isAuthenticated`. The middleware verifies either a server session or signed Android bearer token, then now also loads the account from server storage on **every protected request**. A valid token or session for a deleted or nonexistent account therefore receives `401`; downstream handlers derive the caller identity only from `req.user.claims.sub` and the verified server account.

## Confirmed fixes

| Prior gap | Endpoint or module | Server-side remediation |
|---|---|---|
| A signed Android bearer token was accepted before confirming the account still existed. | Shared `isAuthenticated` middleware | Both bearer and session paths now require a matching `authStorage` account before `next()`. |
| A tenant could search owner email invitations without a role check. | `GET /api/properties/by-owner-email` | The server now requires the verified caller to have `TENANT` role. |
| Didit webhooks could be accepted as a passive ping when no verification secret was configured. | `POST /api/kyc/didit/webhook` | The endpoint now returns `503` until `DIDIT_WEBHOOK_SECRET` exists, then requires a valid signature. |
| Legacy conversation IDs were globally readable and writable by any authenticated caller if the inactive modules were registered. | Legacy chat and audio `/api/conversations*` modules | Both modules now require a verified `ADMIN` account. General-user enablement remains blocked until conversations gain a participant ownership field. |

## Protected endpoint coverage

| Endpoint group | Server enforcement |
|---|---|
| Properties and property joining | Authenticated account; owner/tenant/admin property relationship; join also validates the invited email against the authenticated account. |
| Ledgers, payments, UPI proofs, Cashfree verification | Authenticated account plus ledger/property ownership; tenant/admin or admin-only checks for state-changing operations. |
| Maintenance, agreements, KYC, users, messages, notifications, push subscriptions | Authenticated account plus caller-owned data, property relationship, or explicit role checks. |
| Administrative dashboards, payment decisions, KYC approval, agreement state changes, message review | Authenticated account plus `ADMIN` role. |
| Profile and onboarding role actions | Authenticated account; handlers use the session user ID, and role selection is limited to `TENANT` or `OWNER`—never client-selected `ADMIN`. |
| AI image/chat actions | Authenticated account; they do not accept another user’s resource ID or mutate a cross-user stored record. |

## Deliberate public exceptions

| Endpoint | Why it is public | Server validation |
|---|---|---|
| `/health` and Android asset links | Infrastructure discovery | No user data or action. |
| `/api/login`, Google callback, and logout | Authentication lifecycle | OAuth/session flow; logout only clears the caller’s current session. |
| `/api/cashfree/webhook` | Provider callback | HMAC signature over raw body using the server-only Cashfree secret. |
| `/api/kyc/didit/webhook` | Provider callback | Refused unless the server has `DIDIT_WEBHOOK_SECRET`; then HMAC signature is required. |
| `/api/push/vapid-key` | Browser push setup | Returns only the intentionally public VAPID key. |

## Remaining schema limitation

The legacy `conversations` table has no `user_id` or participant table. It cannot truthfully support “users can only access their own conversations” yet. It is currently not registered by the active RentFLO route setup and is now administrator-only even if registered. Add participant ownership before enabling it for tenants or owners.
