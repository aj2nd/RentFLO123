# Content Security Policy and Reporting Audit

## Policy status

RentFLO serves a server-enforced Content Security Policy on all responses through Helmet. The policy defaults to same-origin content and rejects browser plugins, untrusted base URLs, form posts to other origins, and embedding by other sites. It also includes a same-origin CSP reporting endpoint at `POST /api/csp-report`.

The policy no longer grants broad `unsafe-eval` or `unsafe-inline` permission for JavaScript. The two required static startup scripts in `client/index.html` are instead authorized by their exact SHA-256 hashes. Inline styles remain temporarily allowed because the app intentionally uses static inline splash styles and many React style attributes; this does **not** authorize JavaScript execution.

| Directive | RentFLO policy | Reason |
| --- | --- | --- |
| `default-src` | `'self'` | Same-origin default for unspecified content. |
| `script-src` | Same origin, exact inline hashes, Cashfree SDK origins | Blocks arbitrary inline/eval scripts while preserving known startup and payment code. |
| `style-src` | Same origin, inline styles, Google Fonts CSS | Supports existing static/React styles and the configured font stylesheet. |
| `img-src`, `media-src` | Same origin, approved `data:`/`blob:` where required, HTTPS images | Supports validated user-upload previews and approved remote images. |
| `connect-src` | Same origin plus Cashfree, Didit, and Leegality origins | Preserves browser-side provider calls and required API connections. |
| `frame-src` | Same origin plus Cashfree, Didit, and Leegality origins | Preserves hosted payment, verification, and signature workflows. |
| `worker-src`, `manifest-src` | Same origin plus `blob:` worker support | Preserves RentFLO’s service worker and manifest. |
| `object-src`, `base-uri`, `form-action`, `frame-ancestors` | `'none'`, `'self'`, `'self'`, `'none'` | Blocks plugins, hostile base tags, cross-origin form destinations, and clickjacking frames. |

## Reporting endpoint

Browsers receive both the standards-based `Reporting-Endpoints` header and the legacy-compatible `Report-To` header for the `csp` group. The CSP includes both `report-to csp` and `report-uri /api/csp-report` so supporting browsers can deliver a violation report to RentFLO.

The server accepts legacy `application/csp-report` and modern `application/reports+json` report shapes. Reports are limited to **32 KB**, rate-limited to **20 per minute per client IP**, and log only truncated, control-character-normalized directive and URI metadata. They are not persisted as application records.

## Operational use

Review Railway logs for lines beginning `[csp] violation`. A valid report from a deployed browser indicates that a browser blocked a source; inspect the reported directive and URI before adding any new CSP allowlist entry. Do not add broad `https:`, `*`, `unsafe-eval`, or `unsafe-inline` script permissions to silence reports.

## Verification

Run:

```bash
pnpm exec tsx scripts/verify-csp.ts
```

The verifier recomputes the static inline script hashes, checks the critical restrictive directives, confirms `unsafe-eval` and broad inline scripts are absent from `script-src`, and confirms the reporting route and bounded collectors are present.
