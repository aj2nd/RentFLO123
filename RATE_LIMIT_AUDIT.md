# API Rate-Limiting Audit

## Implemented server-side policy

Rate limits are enforced in Express before API handlers run. They are not frontend controls and cannot be bypassed by modifying the RentFLO client. Railway’s reverse proxy is explicitly trusted before the limiters execute, so IP-based limits use the originating client address. Paid-provider operations additionally receive a second rate limit after server authentication, keyed from the verified account ID rather than any client-supplied field.

| Route category | Server limit | Why it is protected |
| --- | --- | --- |
| All `/api/*` requests | 240 per IP / 15 minutes | Baseline abuse and burst protection. |
| Google login start | 5 per IP / 15 minutes | Restricts repeated OAuth initiation. |
| Google OAuth callback | 10 per IP / 15 minutes | Limits callback abuse while accommodating valid retries. |
| Account email discovery | 10 per IP / 15 minutes | Limits account-enumeration attempts. |
| General KYC, payment, ledger, push, and agreement mutations | 12 per IP / 15 minutes | Protects sensitive state-changing operations. |
| Didit KYC session creation | 5 per IP / hour, then 3 per verified account / hour | Controls external KYC-provider session creation. |
| Didit KYC status | 60 per IP / 15 minutes, then 30 per verified account / 15 minutes | Supports normal polling while limiting external provider calls. |
| Cashfree payment order | 10 per IP / 15 minutes, then 3 per verified account / 15 minutes | Protects payment-provider order creation. |
| Cashfree verification | 10 per IP / 15 minutes, then 10 per verified account / 15 minutes | Limits payment-provider verification calls. |
| OpenAI chatbot | 5 per IP / 15 minutes, then 3 per verified account / 15 minutes | Caps paid AI usage; account cap remains effective if the IP changes. |
| Rent-due notification trigger | 12 per IP / 15 minutes, then 2 per verified account / hour | Limits repeated notification work. |
| Cashfree and Didit webhooks | 60 per IP / minute | Limits incoming bursts; signature checks remain mandatory in the handlers. |

## Signup, password reset, and email-provider status

RentFLO has no local signup route, password-reset route, or application email-sending provider. Google OpenID Connect owns account-password and recovery flows, so there is no RentFLO email/password endpoint to limit. If RentFLO later adds one, it must receive a dedicated strict server limiter before any email or token generation occurs.

## Verification

Run:

```bash
pnpm exec tsx scripts/verify-rate-limits.ts
```

The check confirms the intended route coverage and runs a live Express test: two requests from a verified account succeed, a third request from the same account but a different forwarded IP receives `429`, and another account remains allowed.
