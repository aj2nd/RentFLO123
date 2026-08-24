# Password and Authentication Handling Audit

## Result

RentFLO **does not implement local password authentication**. It redirects users to Google through OpenID Connect (`openid email profile`) and receives an authenticated identity and OAuth tokens only after Google completes its own sign-in flow. RentFLO never renders a password form, receives a Google password, validates a password, hashes a password, or writes a password-hash column to its database.

The application’s `users` table contains provider identity and profile fields, but no `password`, `passwordHash`, or equivalent credential column. The account persistence interface accepts those provider-profile records and provides no password creation, comparison, reset, or verification method.

| Audit area | Finding | Protection or action |
| --- | --- | --- |
| User login | Google OpenID Connect only | Google handles password collection and password-hash storage; RentFLO receives no plaintext password. |
| Local password storage | None | No password field or password-hash column exists in the user model. |
| Password logging | None | No password-related source code or raw request-body logging path exists in app source. |
| Local password packages | Removed | The unused `passport-local` dependency and its type package were removed, along with the obsolete bundler allowlist entry. |
| Verification | Added | `scripts/verify-password-security.ts` scans application source, the user model, auth storage, provider configuration, and declared dependencies. |

## What this means

> You are covered for password storage within RentFLO because the app does not store or process passwords. Google is responsible for protecting Google-account passwords, while RentFLO uses the resulting OIDC identity to create its own encrypted server-side session.

This conclusion applies to the current RentFLO repository. If local email-and-password login is introduced later, it must use a memory-hard password hash such as Argon2id (or bcrypt with an appropriate work factor), unique salts, no plaintext logging, password-reset tokens with a short expiry, and dedicated tests before release.

## Repeatable verification

```bash
pnpm exec tsx scripts/verify-password-security.ts
```
