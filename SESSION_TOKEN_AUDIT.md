# Login and Session Token Storage Audit

## Implemented browser-session protections

RentFLO's web application authenticates through a server-managed PostgreSQL session. The browser receives only an opaque session identifier in the `__Host-rentflo.sid` cookie. It is `HttpOnly`, `Secure`, scoped to `/`, and `SameSite=Lax`; browser JavaScript cannot read or write that credential. The PostgreSQL session record is already protected by the application’s encrypted session envelope, so OAuth access and refresh tokens are not stored as readable JSON in the database.

Sessions now have a fixed **seven-day** maximum lifetime. The browser-cookie lifetime, the server-side `authIssuedAt` check, the PostgreSQL store fallback TTL, and the Android bearer-token expiry are aligned to that window. The server also destroys and clears an expired session instead of merely returning an unauthenticated response.

> The PostgreSQL adapter expects `ttl` in seconds. The previous value was supplied in milliseconds, which could retain a session row much longer than intended when no cookie expiry was present. It now receives the correct seconds value.

| Storage or flow | Result | Notes |
| --- | --- | --- |
| Web login session | Hardened | `__Host-rentflo.sid` is secure, HTTP-only, host-only, `SameSite=Lax`, and has a fixed seven-day life. |
| Browser JavaScript storage | No auth token | The web token adapter returns `null`; authenticated browser requests use `credentials: "include"` instead. Startup removes the legacy `auth_token` key from both `localStorage` and `sessionStorage` but never reads or writes it. Existing unrelated `sessionStorage` keys only control development previews, a payment-processing marker, or KYC redirect state. |
| PostgreSQL session payload | Encrypted | The session-store wrapper encrypts the full payload, including OAuth provider tokens, before persistence. |
| Logout and expiry | Hardened | Both logout routes clear the current and legacy cookie names. Expired or failed-refresh sessions are destroyed server-side and cleared in the browser. |
| Android OAuth fallback | Bounded exception | Android cannot share the Custom Tab cookie with its native WebView, so it uses a seven-day bearer token stored through Capacitor Preferences only on native builds. This is never used by the browser build. A future Android-specific keystore migration would further improve device-token protection. |

## Repeatable verification

Run:

```bash
pnpm exec tsx scripts/verify-session-token-security.ts
```

The verification checks cookie flags, session duration, seconds-based database TTL, server-side absolute expiration, session encryption, browser credential handling, and the absence of browser-storage access in the token adapter.
