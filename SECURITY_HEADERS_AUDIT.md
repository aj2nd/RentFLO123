# Security Headers Audit

RentFLO now centralizes its browser security policy in `server/security-headers.ts` and installs it before all pages, APIs, static assets, and public account-deletion content. The policy uses Helmet with explicit values where the application’s payment, KYC, OAuth, and service-worker requirements need a deliberate decision.

| Header | Production value | What it does for RentFLO |
|---|---|---|
| `Content-Security-Policy` | Same-origin default with narrow HTTPS allowlists for Cashfree, Didit, Leegality, Google Fonts, and the existing CSP report endpoint. `frame-ancestors 'none'`, `object-src 'none'`, and production excludes `ws:`. | Limits which scripts, frames, network endpoints, fonts, images, workers, and other resources a browser may load. It reduces the impact of injected markup or scripts while preserving required payment and KYC providers. |
| `X-Frame-Options` | `DENY` | Prevents RentFLO pages from being embedded in another site’s frame, reducing clickjacking. CSP’s `frame-ancestors 'none'` enforces the same restriction in modern browsers. |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from guessing a response’s MIME type, reducing the chance that an uploaded/downloaded or mislabelled resource is interpreted as executable content. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` on production HTTPS responses | Tells browsers to use HTTPS only for one year for RentFLO and its subdomains after first secure contact, helping prevent protocol downgrade and cookie exposure over HTTP. It is disabled in local HTTP development. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full referrer paths only to same-origin requests; cross-origin destinations receive only the origin when appropriate. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Separates RentFLO’s top-level browsing context from cross-origin pages to reduce cross-window data leaks. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents other origins from loading RentFLO resources unless they are same-origin. |
| Helmet secondary headers | `X-DNS-Prefetch-Control: off`, `X-Download-Options: noopen`, `X-Permitted-Cross-Domain-Policies: none`, and safe defaults | Reduce legacy browser integration risks and unintended cross-domain behavior. |

## Live and deployment status

At the latest live check before this header standardization was pushed, `https://rentflo.in` already served CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, Referrer-Policy, COOP, and CORP through Railway/Helmet. The new application policy tightens framing from `SAMEORIGIN` to `DENY` and preserves the required provider CSP rules. The prior Railway edge check also confirmed that public HTTP redirects to HTTPS.

`X-XSS-Protection` remains `0`, intentionally: modern browsers rely on CSP and correct output encoding, while legacy XSS filters have a history of unsafe behavior. This is not a missing protection.

## Development exceptions

Only local development retains `ws:` for the Vite hot-reload connection and disables HSTS so `http://localhost` remains usable. Production does not permit these exceptions. Cross-origin embedder isolation remains disabled because the KYC and payment experience legitimately uses third-party frames; CSP restricts those frames to the required HTTPS provider origins.

Run `pnpm exec tsx scripts/verify-security-headers.ts` after changing the header policy. It validates the emitted production and development headers plus the source-level installation of the shared policy.
